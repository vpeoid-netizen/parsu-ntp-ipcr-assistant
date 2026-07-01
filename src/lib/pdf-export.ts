import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage, type RGB } from "pdf-lib";
import {
  buildExportFilename,
  buildWorksheetData,
  type WorksheetData,
} from "@/lib/export-worksheet";
import type { NtpEvaluationResult } from "@/lib/calculation-engine/ntp-evaluation";
import type { EvaluationState } from "@/lib/types";

export { buildExportFilename } from "@/lib/export-worksheet";

const PT = 72;
const PAGE_WIDTH = 8.5 * PT;
const PAGE_HEIGHT = 13 * PT;
const MARGIN_TOP = 1.4 * PT;
const MARGIN_SIDE = 0.5 * PT;
const MARGIN_BOTTOM = 0.5 * PT;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_SIDE * 2;

const BODY = 8;
const TITLE = 12;
const SUBTITLE = 8;
const SECTION = 9;
const NOTE = 7;
const FINAL_RATING = 20;
const FINAL_LABEL = 8;

const COLORS = {
  text: rgb(0.12, 0.16, 0.22),
  muted: rgb(0.45, 0.5, 0.55),
  border: rgb(0.82, 0.86, 0.9),
  sectionBg: rgb(0.12, 0.23, 0.37),
  sectionText: rgb(1, 1, 1),
  tableHead: rgb(0.94, 0.96, 0.98),
  highlightBg: rgb(0.94, 0.97, 1),
  white: rgb(1, 1, 1),
};

const CELL_PAD = 6;
const ROW_H = 14;
const SECTION_H = 20;
const TABLE_HEAD_H = 16;
const SECTION_GAP = 10;
const TITLE_GAP = 12;

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [""];

  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      line = candidate;
    } else {
      if (line) lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function rowHeightForText(
  text: string,
  font: PDFFont,
  size: number,
  maxWidth: number,
  minHeight = ROW_H
): number {
  const lines = wrapText(text, font, size, maxWidth);
  return Math.max(minHeight, lines.length * (size + 3) + CELL_PAD);
}

class WorksheetPdfWriter {
  private pageIndex = 0;
  private y = 0;

  constructor(
    private doc: PDFDocument,
    private templateDoc: PDFDocument,
    private font: PDFFont,
    private fontBold: PDFFont
  ) {
    this.resetCursor();
  }

  private get page(): PDFPage {
    return this.doc.getPages()[this.pageIndex];
  }

  private resetCursor() {
    this.y = this.page.getHeight() - MARGIN_TOP;
  }

  private async ensureSpace(needed: number) {
    if (this.y - needed >= MARGIN_BOTTOM) return;
    const [nextPage] = await this.doc.copyPages(this.templateDoc, [0]);
    this.doc.addPage(nextPage);
    this.pageIndex += 1;
    this.resetCursor();
  }

  private drawRect(
    x: number,
    y: number,
    w: number,
    h: number,
    color: RGB,
    border = false
  ) {
    this.page.drawRectangle({ x, y, width: w, height: h, color });
    if (border) {
      this.page.drawRectangle({
        x,
        y,
        width: w,
        height: h,
        borderColor: COLORS.border,
        borderWidth: 0.75,
      });
    }
  }

  private drawTextInBox(
    text: string,
    x: number,
    yTop: number,
    width: number,
    height: number,
    opts: {
      font?: PDFFont;
      size?: number;
      color?: RGB;
      align?: "left" | "center" | "right";
    } = {}
  ) {
    const font = opts.font ?? this.font;
    const size = opts.size ?? BODY;
    const color = opts.color ?? COLORS.text;
    const lines = wrapText(text, font, size, width - CELL_PAD * 2);
    const lineHeight = size + 3;
    let textY = yTop - CELL_PAD - size;

    for (const line of lines) {
      let drawX = x + CELL_PAD;
      const lineWidth = font.widthOfTextAtSize(line, size);
      if (opts.align === "center") drawX = x + (width - lineWidth) / 2;
      if (opts.align === "right") drawX = x + width - CELL_PAD - lineWidth;

      this.page.drawText(line, { x: drawX, y: textY, size, font, color });
      textY -= lineHeight;
    }
  }

  private async drawCenteredTitle(title: string, subtitle: string) {
    await this.ensureSpace(50);

    const titleWidth = this.fontBold.widthOfTextAtSize(title, TITLE);
    const titleX = MARGIN_SIDE + (CONTENT_WIDTH - titleWidth) / 2;
    this.page.drawText(title, {
      x: titleX,
      y: this.y,
      size: TITLE,
      font: this.fontBold,
      color: COLORS.text,
    });
    this.y -= TITLE + 4;

    const subWidth = this.font.widthOfTextAtSize(subtitle, SUBTITLE);
    const subX = MARGIN_SIDE + (CONTENT_WIDTH - subWidth) / 2;
    this.page.drawText(subtitle, {
      x: subX,
      y: this.y,
      size: SUBTITLE,
      font: this.font,
      color: COLORS.muted,
    });
    this.y -= SUBTITLE + 8;

    const lineY = this.y;
    this.page.drawLine({
      start: { x: MARGIN_SIDE, y: lineY },
      end: { x: MARGIN_SIDE + CONTENT_WIDTH, y: lineY },
      thickness: 0.75,
      color: COLORS.border,
    });
    this.y -= TITLE_GAP;
  }

  private async drawSectionHeader(title: string) {
    await this.ensureSpace(SECTION_H + SECTION_GAP);
    this.y -= SECTION_GAP;

    const boxBottom = this.y - SECTION_H;
    this.drawRect(MARGIN_SIDE, boxBottom, CONTENT_WIDTH, SECTION_H, COLORS.sectionBg);
    this.drawTextInBox(title, MARGIN_SIDE, this.y, CONTENT_WIDTH, SECTION_H, {
      font: this.fontBold,
      size: SECTION,
      color: COLORS.sectionText,
      align: "left",
    });
    this.y = boxBottom;
  }

  private async drawKeyValuePanel(rows: [string, string][]) {
    const labelWidth = CONTENT_WIDTH * 0.34;
    const valueWidth = CONTENT_WIDTH - labelWidth;

    const rowHeights = rows.map(([label, value]) => {
      const lh = rowHeightForText(label, this.fontBold, BODY, labelWidth - CELL_PAD * 2);
      const vh = rowHeightForText(value, this.font, BODY, valueWidth - CELL_PAD * 2);
      return Math.max(lh, vh);
    });
    const totalHeight = rowHeights.reduce((a, b) => a + b, 0);

    await this.ensureSpace(totalHeight + 2);
    const boxBottom = this.y - totalHeight;
    this.drawRect(MARGIN_SIDE, boxBottom, CONTENT_WIDTH, totalHeight, COLORS.white, true);

    let rowTop = this.y;
    for (let i = 0; i < rows.length; i++) {
      const [label, value] = rows[i];
      const h = rowHeights[i];
      const rowBottom = rowTop - h;

      if (i > 0) {
        this.page.drawLine({
          start: { x: MARGIN_SIDE, y: rowTop },
          end: { x: MARGIN_SIDE + CONTENT_WIDTH, y: rowTop },
          thickness: 0.5,
          color: COLORS.border,
        });
      }

      this.drawTextInBox(label, MARGIN_SIDE, rowTop, labelWidth, h, {
        font: this.fontBold,
        size: BODY,
      });
      this.drawTextInBox(value, MARGIN_SIDE + labelWidth, rowTop, valueWidth, h, {
        size: BODY,
      });

      rowTop = rowBottom;
    }

    this.y = boxBottom;
  }

  private async drawTable(
    columns: { label: string; width: number; align?: "left" | "right" }[],
    rows: string[][]
  ) {
    const colWidths = columns.map((c) => c.width * CONTENT_WIDTH);
    const bodyHeights = rows.map((row) => {
      let maxH = ROW_H;
      row.forEach((cell, i) => {
        const h = rowHeightForText(cell, this.font, BODY, colWidths[i] - CELL_PAD * 2);
        maxH = Math.max(maxH, h);
      });
      return maxH;
    });
    const totalHeight = TABLE_HEAD_H + bodyHeights.reduce((a, b) => a + b, 0);

    await this.ensureSpace(totalHeight + 2);
    const boxBottom = this.y - totalHeight;
    this.drawRect(MARGIN_SIDE, boxBottom, CONTENT_WIDTH, totalHeight, COLORS.white, true);

    let rowTop = this.y;
    this.drawRect(MARGIN_SIDE, rowTop - TABLE_HEAD_H, CONTENT_WIDTH, TABLE_HEAD_H, COLORS.tableHead);

    let colX = MARGIN_SIDE;
    for (let i = 0; i < columns.length; i++) {
      this.drawTextInBox(columns[i].label, colX, rowTop, colWidths[i], TABLE_HEAD_H, {
        font: this.fontBold,
        size: BODY,
      });
      colX += colWidths[i];
    }
    rowTop -= TABLE_HEAD_H;

    this.page.drawLine({
      start: { x: MARGIN_SIDE, y: rowTop },
      end: { x: MARGIN_SIDE + CONTENT_WIDTH, y: rowTop },
      thickness: 0.5,
      color: COLORS.border,
    });

    for (let r = 0; r < rows.length; r++) {
      const h = bodyHeights[r];
      rowTop -= h;

      if (r > 0) {
        this.page.drawLine({
          start: { x: MARGIN_SIDE, y: rowTop + h },
          end: { x: MARGIN_SIDE + CONTENT_WIDTH, y: rowTop + h },
          thickness: 0.5,
          color: COLORS.border,
        });
      }

      colX = MARGIN_SIDE;
      for (let c = 0; c < columns.length; c++) {
        const color = c === 1 && columns.length === 3 ? COLORS.muted : COLORS.text;
        this.drawTextInBox(rows[r][c], colX, rowTop + h, colWidths[c], h, {
          size: BODY,
          color,
          align: columns[c].align ?? "left",
        });
        colX += colWidths[c];
      }
    }

    this.y = boxBottom;
  }

  private async drawSummaryPanel(rows: [string, string][]) {
    const labelWidth = CONTENT_WIDTH * 0.65;
    const valueWidth = CONTENT_WIDTH - labelWidth;

    const rowHeights = rows.map(([label, value]) => {
      const lh = rowHeightForText(label, this.fontBold, BODY, labelWidth - CELL_PAD * 2);
      const vh = rowHeightForText(value, this.font, BODY, valueWidth - CELL_PAD * 2);
      return Math.max(lh, vh);
    });
    const totalHeight = rowHeights.reduce((a, b) => a + b, 0);

    await this.ensureSpace(totalHeight + 2);
    const boxBottom = this.y - totalHeight;
    this.drawRect(MARGIN_SIDE, boxBottom, CONTENT_WIDTH, totalHeight, COLORS.white, true);

    let rowTop = this.y;
    for (let i = 0; i < rows.length; i++) {
      const [label, value] = rows[i];
      const h = rowHeights[i];
      const rowBottom = rowTop - h;

      if (i > 0) {
        this.page.drawLine({
          start: { x: MARGIN_SIDE, y: rowTop },
          end: { x: MARGIN_SIDE + CONTENT_WIDTH, y: rowTop },
          thickness: 0.5,
          color: COLORS.border,
        });
      }

      this.drawTextInBox(label, MARGIN_SIDE, rowTop, labelWidth, h, {
        font: this.fontBold,
        size: BODY,
      });
      this.drawTextInBox(value, MARGIN_SIDE + labelWidth, rowTop, valueWidth, h, {
        size: BODY,
        align: "right",
      });

      rowTop = rowBottom;
    }

    this.y = boxBottom;
  }

  private async drawFinalHighlight(rating: string, adjectival: string) {
    const boxHeight = 56;
    await this.ensureSpace(boxHeight + SECTION_GAP);
    this.y -= SECTION_GAP;

    const boxBottom = this.y - boxHeight;
    this.drawRect(MARGIN_SIDE, boxBottom, CONTENT_WIDTH, boxHeight, COLORS.highlightBg, true);

    const label = "Final IPCR Rating";
    const labelWidth = this.font.widthOfTextAtSize(label, FINAL_LABEL);
    this.page.drawText(label, {
      x: MARGIN_SIDE + (CONTENT_WIDTH - labelWidth) / 2,
      y: this.y - 14,
      size: FINAL_LABEL,
      font: this.font,
      color: COLORS.muted,
    });

    const ratingWidth = this.fontBold.widthOfTextAtSize(rating, FINAL_RATING);
    this.page.drawText(rating, {
      x: MARGIN_SIDE + (CONTENT_WIDTH - ratingWidth) / 2,
      y: this.y - 36,
      size: FINAL_RATING,
      font: this.fontBold,
      color: COLORS.text,
    });

    const adjWidth = this.fontBold.widthOfTextAtSize(adjectival, SECTION);
    this.page.drawText(adjectival, {
      x: MARGIN_SIDE + (CONTENT_WIDTH - adjWidth) / 2,
      y: boxBottom + 10,
      size: SECTION,
      font: this.fontBold,
      color: COLORS.text,
    });

    this.y = boxBottom;
  }

  private async drawFooterNote(note: string) {
    await this.ensureSpace(30);
    this.y -= SECTION_GAP;
    const lines = wrapText(note, this.font, NOTE, CONTENT_WIDTH - 20);
    for (const line of lines) {
      const lineWidth = this.font.widthOfTextAtSize(line, NOTE);
      const x = MARGIN_SIDE + (CONTENT_WIDTH - lineWidth) / 2;
      await this.ensureSpace(10);
      this.page.drawText(line, { x, y: this.y, size: NOTE, font: this.font, color: COLORS.muted });
      this.y -= 9;
    }
  }

  async render(data: WorksheetData) {
    await this.drawCenteredTitle(data.title, data.subtitle);

    await this.drawSectionHeader("Personnel and Evaluation Information");
    await this.drawKeyValuePanel(data.personnelRows);

    await this.drawSectionHeader("Function Deliverables");
    await this.drawTable(
      [
        { label: "Category", width: 0.22 },
        { label: "Deliverable", width: 0.5 },
        { label: "Rating", width: 0.28, align: "right" },
      ],
      data.deliverables.map((r) => [r.category, r.deliverable, r.rating])
    );

    await this.drawSectionHeader("Rating Summary");
    await this.drawSummaryPanel(data.summaryRows);

    await this.drawFinalHighlight(data.finalRating, data.adjectivalRating);
    await this.drawFooterNote(data.footerNote);
  }
}

async function loadBackgroundDocument(): Promise<PDFDocument> {
  const response = await fetch("/background/background.pdf");
  if (!response.ok) {
    throw new Error("Background template could not be loaded.");
  }
  return PDFDocument.load(await response.arrayBuffer());
}

async function buildEvaluationPdf(
  state: EvaluationState,
  computation: NtpEvaluationResult
): Promise<Uint8Array> {
  const data = buildWorksheetData(state, computation);
  const templateDoc = await loadBackgroundDocument();
  const doc = await PDFDocument.load(await templateDoc.save());

  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const writer = new WorksheetPdfWriter(doc, templateDoc, font, fontBold);

  await writer.render(data);
  return doc.save();
}

export async function exportEvaluationPdf(
  state: EvaluationState,
  computation: NtpEvaluationResult
) {
  const pdfBytes = await buildEvaluationPdf(state, computation);
  const blob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = buildExportFilename(state);
  a.click();
  URL.revokeObjectURL(url);
}
