/**
 * Generates the ParSU IPCR Assistant beginner user guide (8.5" × 13").
 * Run: npm run generate-guide
 */
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { writeFileSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT_DIR = join(ROOT, "public", "guides");
const OUT_FILE = join(OUT_DIR, "ParSU-IPCR-Assistant-User-Guide.pdf");

const PT = 72;
const PAGE_W = 8.5 * PT;
const PAGE_H = 13 * PT;
const MARGIN_TOP = 0.75 * PT;
const MARGIN_SIDE = 0.6 * PT;
const MARGIN_BOTTOM = 0.6 * PT;
const CONTENT_W = PAGE_W - MARGIN_SIDE * 2;

const BODY = 9;
const BODY_SM = 8;
const H1 = 16;
const H2 = 12;
const H3 = 10;
const COVER_TITLE = 22;
const COVER_SUB = 11;

const C = {
  text: rgb(0.1, 0.14, 0.22),
  muted: rgb(0.4, 0.45, 0.52),
  primary: rgb(0.12, 0.35, 0.72),
  sectionBg: rgb(0.12, 0.23, 0.37),
  white: rgb(1, 1, 1),
  line: rgb(0.85, 0.88, 0.92),
  highlight: rgb(0.94, 0.97, 1),
};

function wrap(text, font, size, maxW) {
  const words = String(text).split(/\s+/).filter(Boolean);
  if (!words.length) return [""];
  const lines = [];
  let line = "";
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (font.widthOfTextAtSize(next, size) <= maxW) line = next;
    else {
      if (line) lines.push(line);
      line = w;
    }
  }
  if (line) lines.push(line);
  return lines;
}

class Writer {
  constructor(doc, fonts) {
    this.doc = doc;
    this.font = fonts.regular;
    this.bold = fonts.bold;
    this.italic = fonts.italic;
    this.page = null;
    this.y = 0;
    this.pageNum = 0;
    this.newPage();
  }

  newPage() {
    this.page = this.doc.addPage([PAGE_W, PAGE_H]);
    this.pageNum += 1;
    this.y = PAGE_H - MARGIN_TOP;
    if (this.pageNum > 1) {
      this.drawMuted(
        `ParSU IPCR Evaluation Assistant — User Guide · Page ${this.pageNum}`,
        MARGIN_SIDE,
        MARGIN_BOTTOM - 4,
        BODY_SM
      );
    }
  }

  ensure(h) {
    if (this.y - h < MARGIN_BOTTOM + 14) this.newPage();
  }

  drawText(text, x, y, size, font, color = C.text) {
    this.page.drawText(text, { x, y, size, font, color });
  }

  drawMuted(text, x, y, size = BODY_SM) {
    this.drawText(text, x, y, size, this.font, C.muted);
  }

  drawParagraph(text, size = BODY, gap = 4, indent = 0) {
    const lines = wrap(text, this.font, size, CONTENT_W - indent);
    const block = lines.length * (size + gap) + 6;
    this.ensure(block);
    for (const line of lines) {
      this.y -= size + gap;
      this.drawText(line, MARGIN_SIDE + indent, this.y, size, this.font);
    }
    this.y -= 6;
  }

  drawBullet(text, size = BODY) {
    const lines = wrap(text, this.font, size, CONTENT_W - 16);
    const block = lines.length * (size + 3) + 4;
    this.ensure(block);
    this.y -= size + 3;
    this.drawText("•", MARGIN_SIDE + 2, this.y, size, this.font, C.primary);
    this.drawText(lines[0], MARGIN_SIDE + 14, this.y, size, this.font);
    for (let i = 1; i < lines.length; i++) {
      this.y -= size + 3;
      this.drawText(lines[i], MARGIN_SIDE + 14, this.y, size, this.font);
    }
    this.y -= 4;
  }

  drawH1(text) {
    this.ensure(36);
    this.y -= 8;
    this.drawText(text, MARGIN_SIDE, this.y, H1, this.bold, C.primary);
    this.y -= 10;
    this.page.drawLine({
      start: { x: MARGIN_SIDE, y: this.y },
      end: { x: MARGIN_SIDE + CONTENT_W, y: this.y },
      thickness: 1,
      color: C.line,
    });
    this.y -= 14;
  }

  drawH2(text) {
    this.ensure(28);
    this.y -= 6;
    this.drawText(text, MARGIN_SIDE, this.y, H2, this.bold, C.text);
    this.y -= 14;
  }

  drawH3(text) {
    this.ensure(22);
    this.y -= 4;
    this.drawText(text, MARGIN_SIDE, this.y, H3, this.bold, C.text);
    this.y -= 12;
  }

  drawSectionBar(label) {
    this.ensure(24);
    this.y -= 20;
    this.page.drawRectangle({
      x: MARGIN_SIDE,
      y: this.y,
      width: CONTENT_W,
      height: 18,
      color: C.sectionBg,
    });
    this.drawText(label, MARGIN_SIDE + 8, this.y + 5, H3, this.bold, C.white);
    this.y -= 10;
  }

  drawCallout(text) {
    const lines = wrap(text, this.font, BODY_SM, CONTENT_W - 20);
    const h = lines.length * (BODY_SM + 3) + 14;
    this.ensure(h + 4);
    this.y -= h;
    this.page.drawRectangle({
      x: MARGIN_SIDE,
      y: this.y,
      width: CONTENT_W,
      height: h,
      color: C.highlight,
      borderColor: C.line,
      borderWidth: 0.5,
    });
    let cy = this.y + h - 12;
    for (const line of lines) {
      this.drawText(line, MARGIN_SIDE + 10, cy, BODY_SM, this.font);
      cy -= BODY_SM + 3;
    }
    this.y -= 8;
  }

  drawNumbered(n, title, body) {
    this.drawH3(`${n}. ${title}`);
    this.drawParagraph(body, BODY, 4, 8);
  }
}

function buildGuide(w) {
  // —— Cover ——
  w.y = PAGE_H - 2 * PT;
  w.drawText("Partido State University", MARGIN_SIDE, w.y, COVER_SUB, w.font, C.muted);
  w.y -= 36;
  w.drawText("ParSU IPCR Evaluation", MARGIN_SIDE, w.y, COVER_TITLE, w.bold, C.primary);
  w.y -= 28;
  w.drawText("Assistant", MARGIN_SIDE, w.y, COVER_TITLE, w.bold, C.primary);
  w.y -= 32;
  w.drawText("Beginner-Friendly User Guide", MARGIN_SIDE, w.y, COVER_SUB, w.bold);
  w.y -= 20;
  w.drawText("FY 2026 Rating Computation Tool for Teaching Personnel", MARGIN_SIDE, w.y, BODY, w.font, C.muted);
  w.y -= 40;
  w.drawParagraph(
    "This guide explains how to open the web application, enter your faculty information and indicator ratings, understand your computed IPCR score, and export your evaluation worksheet as a PDF.",
    BODY
  );
  w.y -= 20;
  w.drawCallout(
    "No account or password is required. Your entries are stored only in your browser for this session. Always export or print your worksheet before closing the browser."
  );
  w.y = MARGIN_BOTTOM + 60;
  w.drawMuted("Document format: 8.5\" × 13\" (Long Bond) · For faculty self-evaluation use", MARGIN_SIDE, w.y);

  w.newPage();

  // —— Table of contents ——
  w.drawH1("Table of Contents");
  const toc = [
    "1. Introduction",
    "2. Key Features",
    "3. What You Need Before Starting",
    "4. How to Open the Application",
    "5. Step-by-Step Usage (Steps 1–11)",
    "6. Special Instructions by Faculty Type",
    "7. Understanding Your IPCR Rating",
    "8. Exporting Your Evaluation Worksheet",
    "9. Important Reminders",
    "10. Troubleshooting (FAQ)",
  ];
  for (const item of toc) {
    w.drawBullet(item);
  }

  w.newPage();
  w.drawH1("1. Introduction");
  w.drawParagraph(
    "The ParSU IPCR Evaluation Assistant is a web-based tool that helps teaching personnel compute their Individual Performance Commitment and Review (IPCR) rating under the FY 2026 rules. It guides you through each performance indicator, applies the official rating formulas automatically, and shows your live IPCR score as you enter data."
  );
  w.drawParagraph(
    "The tool is designed for self-evaluation: you enter ratings and accomplishments, and the application calculates Performance Results, Strategic/Priority contributions, Support Functions, Designation weighting (if applicable), and your final IPCR rating."
  );
  w.drawCallout(
    "This assistant computes ratings for planning and reference. Your official IPCR still requires review, Means of Verification (MOV) as required by your college, and approval by your supervisor and the Human Resource Management Office."
  );

  w.drawH1("2. Key Features");
  const features = [
    "No login required — open the link and click Start Evaluation.",
    "Live IPCR rating that updates automatically as you enter indicator data.",
    "Color-coded IPCR health bar: red (0–3), yellow (>3–4), green (>4–5).",
    "All 11 evaluation steps in one guided workflow.",
    "Per-indicator rating period toggle — include only indicators targeted for the rating period.",
    "Professor MFO3 research targets (0–2) for Research Productivity, Presentation, and Publication.",
    "COS Instructor toggles for Strategic and Priority assigned targets.",
    "Teaching Effectiveness uses a numeric rating input (1.00–5.00).",
    "Strategic and Priority Results with target vs. accomplishment entry.",
    "Support Functions and Designation rating (when applicable).",
    "Rating Summary with computation breakdown.",
    "Preview & Export — download an 8.5\" × 13\" PDF evaluation worksheet on the official background template.",
    "Means of Verification shown as reference guidance only (no file upload).",
    "Data kept in browser session only — nothing is saved on a server.",
  ];
  for (const f of features) w.drawBullet(f);

  w.newPage();
  w.drawH1("3. What You Need Before Starting");
  w.drawH2("Materials to prepare");
  w.drawBullet("Your faculty profile details: name, academic rank, college, appointment status, evaluation year, and rating period.");
  w.drawBullet("Your IPCR targets and accomplishments for the rating period.");
  w.drawBullet("Ratings or factual bases for each applicable MFO indicator.");
  w.drawBullet("Strategic and Priority target statements with period targets and actual accomplishments (if assigned).");
  w.drawBullet("Office Order details if you have an official designation with deloaded units.");

  w.drawH2("Technical requirements");
  w.drawBullet("A computer, laptop, or tablet with a modern web browser (Chrome, Edge, Firefox, or Safari).");
  w.drawBullet("Stable internet connection to load the application.");
  w.drawBullet("PDF reader if you wish to open your exported worksheet.");

  w.drawH1("4. How to Open the Application");
  w.drawNumbered(
    1,
    "Get the application URL",
    "Open the link provided by your college or the VPEO office (for example: https://your-app-name.vercel.app). Bookmark it for easy access."
  );
  w.drawNumbered(
    2,
    "Welcome screen",
    "You will see the ParSU logo, the title ParSU IPCR Evaluation Assistant, and a short description. Read the note that data is kept only for this browser session."
  );
  w.drawNumbered(
    3,
    "Start Evaluation",
    "Click the Start Evaluation button. The 11-step evaluation workspace will open with a step navigation bar at the top and a summary panel on the side."
  );

  w.newPage();
  w.drawH1("5. Step-by-Step Usage");
  w.drawParagraph("Use the step buttons at the top to move between sections. You can go back to any step to edit entries. Your IPCR rating updates live in the summary panel.");

  w.drawSectionBar("Step 1 — Faculty Information");
  w.drawParagraph("Enter your name, academic rank, college, appointment status, evaluation year, and rating period. Optional fields include department and supervisor/dean name.");
  w.drawBullet("Total Teaching Load is fixed at 18 units (not editable).");
  w.drawBullet("Check Has support functions if you perform official support roles.");
  w.drawBullet("Check Has official designation with deloaded units if applicable, then enter designation title, office order number, deloaded units, and verify the office order checkbox.");

  w.drawSectionBar("Step 2 — Applicability");
  w.drawParagraph("Review which indicators apply to your rank and appointment. Indicators not applicable to your profile are excluded automatically.");

  w.drawSectionBar("Steps 3–5 — MFO 1 & 2, MFO 3, MFO 4");
  w.drawParagraph("For each indicator card:");
  w.drawBullet("Use the Included in rating period toggle. Turn it ON only when that indicator is targeted for this rating period. Excluded indicators are not counted in MFO averages.");
  w.drawBullet("Enter your rating or accomplishments using the fields shown (dropdown, numeric input, or Add Entry for multiple outputs).");
  w.drawBullet("Watch the live rating and health bar on each card.");
  w.drawParagraph("Indicator headers are light blue when included and light gray when excluded.");

  w.newPage();
  w.drawSectionBar("Step 6 — Strategic Results");
  w.drawParagraph("Enter strategic target statements, units of measure, period targets, and actual accomplishments. Required MOV (reference): Certification by College Planning and Development Coordinator.");

  w.drawSectionBar("Step 7 — Priority Results");
  w.drawParagraph("Same format as Strategic Results. Required MOV (reference): Proof certified by the College Dean.");

  w.drawSectionBar("Step 8 — Support Functions");
  w.drawParagraph("Available only if you checked Has support functions in Step 1. Rate each support role on Quality, Efficiency, and Timeliness.");

  w.drawSectionBar("Step 9 — Designation Rating");
  w.drawParagraph("Available when you have an official designation. Enter deliverables and rate Quality, Efficiency, and Timeliness. Office Order must be verified for designation weighting to apply.");

  w.drawSectionBar("Step 10 — Rating Summary");
  w.drawParagraph("Review your Performance Results, Strategic/Priority, Support Functions, Designation, Base IPCR, and Final IPCR with adjectival rating. Expand computation details to see how each value was derived.");

  w.drawSectionBar("Step 11 — Preview & Export");
  w.drawParagraph("Preview the full evaluation worksheet. Click Export as PDF to download your IPCR Eval Sheet, or Print to send to a printer. Indicators not included in the rating period appear as N/A in the worksheet.");

  w.newPage();
  w.drawH1("6. Special Instructions by Faculty Type");

  w.drawH2("All faculty — Rating period inclusion");
  w.drawParagraph(
    "Each indicator has an Included in rating period switch. If an indicator was not targeted for the current rating period, leave the switch OFF. That indicator will not affect your MFO average and will show N/A on the exported worksheet."
  );

  w.drawH2("Professors — MFO3 research targets");
  w.drawParagraph(
    "For Research Productivity, Research Presentation, and Research Publication, select your target for the rating period (0, 1, or 2). Your rating is computed as total accomplishment score divided by this target. Example: one terminal report rated 5.00 with target 2 gives 2.500; with target 1 gives 5.000. Selecting 0 automatically excludes the indicator."
  );

  w.drawH2("COS Instructors — Strategic & Priority toggles");
  w.drawParagraph(
    "On Steps 6 and 7, COS Instructors see a Has assigned target for rating period toggle on each section. Turn it ON only when you have an assigned target for that section."
  );
  w.drawCallout(
    "If BOTH Strategic and Priority are set to no assigned target, your IPCR is computed from MFO 1 & 2 only. A notice will appear on those steps confirming this."
  );

  w.drawH2("COS appointment");
  w.drawParagraph(
    "Contract of Service (COS) faculty performance results are weighted 100% on MFO 1 & 2 (teaching indicators). MFO 3 and MFO 4 do not apply."
  );

  w.newPage();
  w.drawH1("7. Understanding Your IPCR Rating");
  w.drawParagraph("The summary panel and Step 10 show these components:");
  w.drawBullet("Performance Results — weighted average of MFO 1 & 2, MFO 3, and MFO 4 (weights vary by rank; COS uses MFO 1 & 2 only).");
  w.drawBullet("Strategic/Priority — consolidated achievement percentage converted to a rating (15% of Base IPCR when applicable, or 10% if you have support functions).");
  w.drawBullet("Support Functions — average of rated support roles (10% when enabled).");
  w.drawBullet("Base IPCR — combination of Performance Results and Strategic/Priority (and Support Functions if applicable).");
  w.drawBullet("Designation Rating — weighted into Final IPCR when office order is verified and deloaded units are entered.");
  w.drawBullet("Final IPCR — your overall rating, with adjectival label (e.g., Outstanding, Very Satisfactory).");

  w.drawH2("IPCR health bar colors");
  w.drawBullet("Red: 0.000 to 3.000");
  w.drawBullet("Yellow: above 3.000 to 4.000");
  w.drawBullet("Green: above 4.000 to 5.000");

  w.drawH1("8. Exporting Your Evaluation Worksheet");
  w.drawNumbered(1, "Complete as much of the evaluation as possible", "At minimum, fill in required faculty information and your applicable indicators.");
  w.drawNumbered(2, "Go to Step 11 — Preview & Export", "Review the on-screen preview for accuracy.");
  w.drawNumbered(3, "Export as PDF", "Click the button. The file is saved as [First 10 chars of your name]-IPCR Eval Sheet.pdf using the official 8.5\" × 13\" background template.");
  w.drawNumbered(4, "Print (optional)", "Use Print if you need a hard copy. Adjust printer settings to long bond / legal 8.5\" × 13\" if available.");
  w.drawCallout("Export or save your PDF before closing the browser tab. Session data is not stored on the server.");

  w.newPage();
  w.drawH1("9. Important Reminders");
  w.drawBullet("This tool does not upload or store Means of Verification. MOV guidance is for reference only.");
  w.drawBullet("Do not use one browser session for multiple faculty members. Each person should use their own device or browser profile.");
  w.drawBullet("Refreshing the page may keep session data, but closing the browser or clearing site data can erase your entries.");
  w.drawBullet("Computed ratings are for assistance only. Official IPCR submission follows your college and HRMO procedures.");
  w.drawBullet("For COS Instructors without Strategic or Priority targets, ensure both toggles are OFF so the IPCR reflects MFO 1 & 2 only.");
  w.drawBullet("Double-check indicators marked N/A on the worksheet — they were excluded from the rating period.");

  w.drawH1("10. Troubleshooting (FAQ)");
  w.drawH3("The page is blank or will not load.");
  w.drawParagraph("Check your internet connection. Try another browser or clear cache and reload the URL.");

  w.drawH3("My IPCR rating shows 0 or seems incomplete.");
  w.drawParagraph("Ensure applicable indicators are toggled ON for the rating period and have ratings entered. Complete faculty information required fields.");

  w.drawH3("I closed the browser and lost my data.");
  w.drawParagraph("Data is stored only in the browser session. Re-enter your information and export the PDF when finished.");

  w.drawH3("PDF export does not download.");
  w.drawParagraph("Allow downloads from the site in your browser. Try Print to PDF as an alternative.");

  w.drawH3("Wrong rank or appointment selected.");
  w.drawParagraph("Return to Step 1, correct your profile, then review Steps 2–5 — applicability and indicators may change.");

  w.y -= 20;
  w.drawCallout(
    "For technical issues with the deployed application, contact your college IPCR coordinator or the office that shared the application link."
  );
}

async function main() {
  const doc = await PDFDocument.create();
  const fonts = {
    regular: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
    italic: await doc.embedFont(StandardFonts.HelveticaOblique),
  };

  const w = new Writer(doc, fonts);
  buildGuide(w);

  const bytes = await doc.save();
  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(OUT_FILE, bytes);
  console.log(`User guide written to:\n  ${OUT_FILE}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
