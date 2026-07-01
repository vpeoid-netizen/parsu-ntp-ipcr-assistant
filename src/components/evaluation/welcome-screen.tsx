"use client";

import { Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ParsuLogo } from "@/components/parsu-logo";
import { useEvaluation } from "@/components/evaluation/evaluation-context";

export function WelcomeScreen() {
  const { startEvaluation } = useEvaluation();

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="text-center mb-10">
        <ParsuLogo size={80} className="h-20 w-20 object-contain mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-parsu-dark">
          ParSU Non-Teaching Personnel IPCR Evaluation Assistant
        </h1>
        <p className="mt-2 text-muted-foreground max-w-xl mx-auto">
          FY 2026 rating computation tool for non-teaching personnel. Enter function deliverable
          ratings and personnel information to compute your IPCR — no account required. Data is kept
          only for this browser session.
        </p>
      </div>

      <div className="rounded-lg border bg-card p-8 text-center shadow-sm">
        <Calculator className="h-12 w-12 text-primary mx-auto mb-4" />
        <h2 className="text-lg font-semibold mb-2">Start your evaluation</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Based on the FY 2026 IPCR Guidelines for Non-Teaching Personnel. Rate Core, Strategic,
          Support, and Other functions per your personnel category.
        </p>
        <Button size="lg" className="w-full sm:w-auto px-8" onClick={startEvaluation}>
          Start Evaluation
        </Button>
      </div>
    </div>
  );
}
