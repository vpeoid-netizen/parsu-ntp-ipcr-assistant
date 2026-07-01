"use client";

import { Download, FileText, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEvaluation } from "@/components/evaluation/evaluation-context";
import { buildWorksheetData } from "@/lib/export-worksheet";
import { profileIsComplete } from "@/lib/evaluation-client";
import { exportEvaluationPdf } from "@/lib/pdf-export";

export function ExportStep() {
  const { state, computation } = useEvaluation();
  if (!state || !computation) return null;

  const profileComplete = profileIsComplete(state.profile);
  const worksheet = buildWorksheetData(state, computation);

  const handleExport = () => exportEvaluationPdf(state, computation);
  const handlePrint = () => window.print();

  return (
    <div className="space-y-6 print:space-y-4">
      <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div className="flex items-start gap-3">
          <FileText className="h-8 w-8 text-primary shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold">Export evaluation worksheet</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Download a PDF or print the full NTP IPCR rating worksheet below.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleExport}>
            <Download className="h-4 w-4" />
            Export as PDF
          </Button>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4" />
            Print
          </Button>
        </div>
      </div>

      {!profileComplete && (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3 print:hidden">
          Some personnel information fields are blank. The worksheet will reflect current entries.
        </p>
      )}

      <div
        id="export-worksheet-preview"
        className="rounded-lg border bg-white p-6 space-y-6 shadow-sm print:shadow-none print:border-0"
      >
        <div className="text-center border-b pb-4">
          <h3 className="text-lg font-bold">{worksheet.title}</h3>
          <p className="text-sm text-muted-foreground">{worksheet.subtitle}</p>
        </div>

        <section>
          <h4 className="section-header rounded-b-none">Personnel and Evaluation Information</h4>
          <div className="border border-t-0 rounded-b-lg divide-y text-sm">
            {worksheet.personnelRows.map(([label, value]) => (
              <div key={label} className="grid grid-cols-[1fr_2fr] gap-2 px-4 py-2">
                <span className="font-medium">{label}</span>
                <span>{value}</span>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h4 className="section-header rounded-b-none">Function Deliverables</h4>
          <div className="border border-t-0 rounded-b-lg overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-2 font-medium">Category</th>
                  <th className="text-left p-2 font-medium">Deliverable</th>
                  <th className="text-right p-2 font-medium w-28">Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {worksheet.deliverables.map((row) => (
                  <tr key={`${row.category}-${row.deliverable}`}>
                    <td className="p-2 text-muted-foreground">{row.category}</td>
                    <td className="p-2">{row.deliverable}</td>
                    <td className="p-2 text-right font-mono">{row.rating}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h4 className="section-header rounded-b-none">Rating Summary</h4>
          <div className="border border-t-0 rounded-b-lg divide-y text-sm">
            {worksheet.summaryRows.map(([label, val]) => (
              <div key={label} className="grid grid-cols-[1fr_auto] gap-2 px-4 py-2">
                <span className="font-medium">{label}</span>
                <span className="font-mono text-right">{val}</span>
              </div>
            ))}
          </div>
        </section>

        <div className="text-center rounded-lg bg-primary/10 p-4">
          <p className="text-sm text-muted-foreground">Final IPCR Rating</p>
          <p className="text-3xl font-bold font-mono mt-1">{worksheet.finalRating}</p>
          <p className="font-semibold mt-1">{worksheet.adjectivalRating}</p>
        </div>

        <p className="text-xs text-muted-foreground italic text-center">{worksheet.footerNote}</p>
      </div>
    </div>
  );
}
