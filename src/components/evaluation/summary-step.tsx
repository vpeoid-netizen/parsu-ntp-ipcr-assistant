"use client";

import { useEvaluation } from "@/components/evaluation/evaluation-context";
import { IndicatorRatingBar } from "@/components/evaluation/rating-bar";
import { profileIsComplete } from "@/lib/evaluation-client";
import { FUNCTION_CATEGORY_LABELS, FUNCTION_WEIGHTS } from "@/data/reference";
import { formatRating } from "@/lib/utils";
import { RULESET_VERSION } from "@/data/reference";

export function SummaryStep() {
  const { state, computation } = useEvaluation();
  if (!state || !computation) return null;

  const profileComplete = profileIsComplete(state.profile);
  const ipcrRating = computation.finalIpcr.rating;
  const weights = FUNCTION_WEIGHTS[state.profile.personnelCategory];

  const functionRows = Object.entries(weights)
    .filter(([, w]) => (w ?? 0) > 0)
    .map(([category, weight]) => {
      const rating =
        category === "PASSENGER_FEEDBACK"
          ? state.passengerFeedbackRating ?? 0
          : computation.functionSectionRatings[category]?.rating ?? 0;
      return {
        label: FUNCTION_CATEGORY_LABELS[category as keyof typeof FUNCTION_CATEGORY_LABELS],
        weight: `${(weight! * 100).toFixed(0)}%`,
        rating,
      };
    });

  return (
    <div className="space-y-6">
      {!profileComplete && (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
          Personnel information is incomplete. Ratings below update live as you enter data.
        </p>
      )}

      <div className="text-center rounded-lg bg-primary/10 p-6 space-y-3">
        <p className="text-sm text-muted-foreground">IPCR Rating</p>
        <p className="text-4xl font-bold font-mono text-parsu-dark">
          {formatRating(ipcrRating)}
        </p>
        <p className="text-lg font-semibold">
          {ipcrRating > 0 ? computation.adjectivalRating : "Enter ratings to compute"}
        </p>
        <IndicatorRatingBar rating={ipcrRating} label="IPCR Rating" showValue={false} variant="ipcr" />
        <p className="text-xs text-muted-foreground">{RULESET_VERSION}</p>
      </div>

      <div className="space-y-2">
        <h4 className="text-sm font-semibold">Function Category Breakdown</h4>
        {functionRows.map((row) => (
          <div key={row.label} className="flex justify-between border-b py-2 text-sm">
            <span>
              {row.label} <span className="text-muted-foreground">({row.weight})</span>
            </span>
            <span className="font-mono font-semibold">{formatRating(row.rating)}</span>
          </div>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 text-sm">
        {[
          ["Base IPCR", computation.baseIpcr.rating],
          ...(state.profile.hasDesignation
            ? [["Designation", computation.designationRating.rating]]
            : []),
          ["Final IPCR", computation.finalIpcr.rating],
        ].map(([label, val]) => (
          <div key={String(label)} className="flex justify-between border-b py-2">
            <span>{label}</span>
            <span className="font-mono font-semibold">{formatRating(val as number)}</span>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground text-center">
        This rating summary is for computation assistance only and remains subject to official
        approval and signing per the FY 2026 Non-Teaching IPCR Guidelines.
      </p>
    </div>
  );
}
