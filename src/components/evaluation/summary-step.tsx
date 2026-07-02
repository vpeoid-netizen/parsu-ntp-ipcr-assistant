"use client";

import { useEvaluation } from "@/components/evaluation/evaluation-context";
import { IndicatorRatingBar } from "@/components/evaluation/rating-bar";
import {
  computeDeliverableComposite,
  getDesignationRating,
  profileIsComplete,
} from "@/lib/evaluation-client";
import { FUNCTION_CATEGORY_LABELS, FUNCTION_WEIGHTS, RULESET_VERSION } from "@/data/reference";
import { formatRating } from "@/lib/utils";

export function SummaryStep() {
  const { state, computation } = useEvaluation();
  if (!state || !computation) return null;

  const profileComplete = profileIsComplete(state.profile);
  const ipcrRating = computation.finalIpcr.rating;
  const designationRating = getDesignationRating(state, computation);
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

  const designationRows = state.designationDeliverables
    .filter((d) => d.deliverable.trim() || computeDeliverableComposite(d) != null)
    .map((d) => ({
      deliverable: d.deliverable || "—",
      rating: computeDeliverableComposite(d),
    }));

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
        <div className="flex justify-between border-b py-2 text-sm font-medium">
          <span>Base IPCR</span>
          <span className="font-mono">{formatRating(computation.baseIpcr.rating)}</span>
        </div>
      </div>

      {state.profile.hasDesignation && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Designation Rating (30%)</h4>
          {state.profile.designationTitle && (
            <p className="text-xs text-muted-foreground">
              Designation: {state.profile.designationTitle}
            </p>
          )}
          {designationRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No designation deliverables entered yet.</p>
          ) : (
            designationRows.map((row) => (
              <div
                key={`${row.deliverable}-${row.rating}`}
                className="flex justify-between border-b py-2 text-sm"
              >
                <span className="pr-4">{row.deliverable}</span>
                <span className="font-mono font-semibold shrink-0">
                  {formatRating(row.rating)}
                </span>
              </div>
            ))
          )}
          <div className="flex justify-between border-b py-2 text-sm font-medium">
            <span>Designation Rating</span>
            <span className="font-mono">{formatRating(designationRating)}</span>
          </div>
        </div>
      )}

      {state.profile.hasDesignation && (
        <p className="text-sm text-primary bg-primary/5 border border-primary/20 rounded-lg p-3">
          Final IPCR = Base IPCR ({formatRating(computation.baseIpcr.rating)} × 70%) + Designation
          rating ({formatRating(designationRating)} × 30%) = {formatRating(computation.finalIpcr.rating)}
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2 text-sm">
        {[
          ["Base IPCR", computation.baseIpcr.rating],
          ...(state.profile.hasDesignation
            ? [
                ["Designation Rating", designationRating],
                ["Base IPCR weighted (70%)", computation.baseIpcr.rating * 0.7],
                ["Designation weighted (30%)", designationRating * 0.3],
              ]
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
