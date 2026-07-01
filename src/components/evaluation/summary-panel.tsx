"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RatingHealthTracker } from "@/components/evaluation/rating-bar";
import { useEvaluation } from "@/components/evaluation/evaluation-context";
import { getRatingProgress, profileIsComplete } from "@/lib/evaluation-client";
import { FUNCTION_CATEGORY_LABELS } from "@/data/reference";
import { formatRating } from "@/lib/utils";

export function SummaryPanel() {
  const { state, computation } = useEvaluation();

  const progress = useMemo(() => (state ? getRatingProgress(state) : null), [state]);

  if (!state || !computation) return null;

  const profileComplete = profileIsComplete(state.profile);
  const ipcrRating = computation.finalIpcr.rating;

  const sectionProgress = progress?.sectionProgress.map((section) => ({
    ...section,
    label:
      FUNCTION_CATEGORY_LABELS[section.code as keyof typeof FUNCTION_CATEGORY_LABELS] ??
      section.label,
  }));

  return (
    <Card className="sticky top-20 h-fit">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Live Rating Summary</CardTitle>
      </CardHeader>
      <CardContent className="text-xs space-y-4">
        {state.profile.hasDesignation && state.profile.officeOrderVerified && (
          <p className="text-primary bg-primary/5 border border-primary/20 rounded-lg p-2 text-xs">
            Designation active: Final IPCR = Base (70%) + Designation (30%).
          </p>
        )}
        <div className="flex justify-between">
          <span>Profile</span>
          <span className={profileComplete ? "text-blue-700" : "text-amber-600"}>
            {profileComplete ? "Complete" : "Incomplete"}
          </span>
        </div>

        {progress && (
          <RatingHealthTracker
            finalRating={ipcrRating}
            adjectival={computation.adjectivalRating}
            completionPercent={progress.percent}
            completed={progress.completed}
            total={progress.total}
            sectionProgress={sectionProgress}
          />
        )}

        <div className="space-y-2 border-t pt-3">
          <div className="flex justify-between">
            <span>Base IPCR</span>
            <span className="font-mono">{formatRating(computation.baseIpcr.rating)}</span>
          </div>
          {state.profile.hasDesignation && (
            <div className="flex justify-between">
              <span>Designation</span>
              <span className="font-mono">
                {formatRating(computation.designationRating.rating)}
              </span>
            </div>
          )}
          <div className="flex justify-between font-semibold border-t pt-2 mt-2">
            <span>Final IPCR</span>
            <span className="font-mono text-primary">{formatRating(ipcrRating)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
