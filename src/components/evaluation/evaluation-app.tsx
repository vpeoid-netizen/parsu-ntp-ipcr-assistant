"use client";

import { EvaluationProvider, useEvaluation } from "@/components/evaluation/evaluation-context";
import { WelcomeScreen } from "@/components/evaluation/welcome-screen";
import { EvaluationWorkspace } from "@/components/evaluation/evaluation-workspace";

function EvaluationAppInner() {
  const { state } = useEvaluation();
  return state ? <EvaluationWorkspace /> : <WelcomeScreen />;
}

export function EvaluationApp() {
  return (
    <EvaluationProvider>
      <EvaluationAppInner />
    </EvaluationProvider>
  );
}
