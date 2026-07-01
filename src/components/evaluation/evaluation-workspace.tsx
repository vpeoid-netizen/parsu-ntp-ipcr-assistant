"use client";

import { Calculator, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useEvaluation } from "@/components/evaluation/evaluation-context";
import { ProfileStep } from "@/components/evaluation/profile-step";
import { FunctionsStep } from "@/components/evaluation/functions-step";
import { DesignationStep, PassengerFeedbackStep } from "@/components/evaluation/designation-step";
import { SummaryStep } from "@/components/evaluation/summary-step";
import { ExportStep } from "@/components/evaluation/export-step";
import { SummaryPanel } from "@/components/evaluation/summary-panel";
import { cn, formatRating, getEvaluationSteps } from "@/lib/utils";

export function EvaluationWorkspace() {
  const { state, setState, resetEvaluation, computation } = useEvaluation();
  if (!state) return null;

  const steps = getEvaluationSteps(state.profile);
  const step = Math.min(state.currentStep, steps.length);
  const totalSteps = steps.length;
  const progress = (step / totalSteps) * 100;
  const currentStepMeta = steps[step - 1];

  const goTo = (n: number) =>
    setState((s) => (s ? { ...s, currentStep: Math.max(1, Math.min(n, steps.length)) } : s));

  const renderStep = () => {
    const key = currentStepMeta?.key;
    switch (key) {
      case "profile":
        return <ProfileStep />;
      case "core":
        return <FunctionsStep category="CORE" />;
      case "strategic":
        return <FunctionsStep category="STRATEGIC" />;
      case "support":
        return <FunctionsStep category="SUPPORT" />;
      case "other":
        return <FunctionsStep category="OTHER" />;
      case "passenger":
        return <PassengerFeedbackStep />;
      case "designation":
        return <DesignationStep />;
      case "summary":
        return <SummaryStep />;
      case "export":
        return <ExportStep />;
      default:
        return null;
    }
  };

  const currentLabel = currentStepMeta?.label ?? "";

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <p className="text-xs text-primary font-semibold uppercase tracking-wide">
            FY 2026 Non-Teaching Personnel IPCR Evaluation
          </p>
          <h2 className="text-xl font-bold">{currentLabel}</h2>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={resetEvaluation}>
            <RotateCcw className="h-4 w-4" />
            New Evaluation
          </Button>
        </div>
      </div>

      <Progress value={progress} className="mb-4 h-2" />

      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        {steps.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => goTo(s.id)}
            className={cn(
              "shrink-0 rounded-full px-3 py-1 text-xs font-medium border transition-colors",
              step === s.id
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-white text-muted-foreground hover:bg-secondary"
            )}
          >
            {s.id}. {s.label}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Step {step}: {currentLabel}
            </CardTitle>
          </CardHeader>
          <CardContent>{renderStep()}</CardContent>
          <div className="flex justify-between border-t p-4">
            <Button variant="outline" disabled={step <= 1} onClick={() => goTo(step - 1)}>
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button disabled={step >= totalSteps} onClick={() => goTo(step + 1)}>
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </Card>

        <SummaryPanel />
      </div>

      {computation && computation.finalIpcr.rating > 0 && (
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Current final IPCR:{" "}
          <span className="font-mono font-semibold text-foreground">
            {formatRating(computation.finalIpcr.rating)}
          </span>{" "}
          ({computation.adjectivalRating})
        </p>
      )}
    </div>
  );
}
