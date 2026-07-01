"use client";

import { Plus, Trash2 } from "lucide-react";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { IndicatorRatingBar } from "@/components/evaluation/rating-bar";
import { RatingFieldsGrid, RatingSelect } from "@/components/evaluation/rating-select";
import { useEvaluation } from "@/components/evaluation/evaluation-context";
import { computeDeliverableComposite, computeDesignationLive, uid } from "@/lib/evaluation-client";
import { formatRating } from "@/lib/utils";
import type { DesignationDeliverableState } from "@/lib/types";

export function PassengerFeedbackStep() {
  const { state, setState } = useEvaluation();
  if (!state) return null;

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-primary/5 p-4">
        <h3 className="font-semibold">Passenger&apos;s Feedback</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Full-time university drivers are rated on passenger feedback at 20% of the base IPCR.
          Select the overall feedback rating (0–5).
        </p>
      </div>

      <RatingSelect
        label="Passenger Feedback Rating"
        value={state.passengerFeedbackRating}
        onChange={(rating) => setState({ ...state, passengerFeedbackRating: rating })}
      />

      {state.passengerFeedbackRating != null && (
        <IndicatorRatingBar
          rating={state.passengerFeedbackRating}
          label="Passenger Feedback"
          compact
        />
      )}
    </div>
  );
}

export function DesignationStep() {
  const { state, setState } = useEvaluation();
  const designationRating = useMemo(
    () => (state ? computeDesignationLive(state) : null),
    [state]
  );

  if (!state) return null;

  if (!state.profile.hasDesignation) {
    return (
      <p className="text-sm text-muted-foreground p-4">
        Designation rating is not enabled. Check designation options in Personnel Information.
      </p>
    );
  }

  const list = state.designationDeliverables;
  const update = (next: DesignationDeliverableState[]) =>
    setState({ ...state, designationDeliverables: next });

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-primary/5 p-4">
        <h3 className="font-semibold">Designation Rating</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Non-teaching personnel with designations: Final IPCR = Base IPCR (70%) + Designation
          rating (30%). Office Order must be verified.
        </p>
      </div>

      {designationRating != null && (
        <div className="rounded-lg border bg-card p-4 space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="font-medium">Designation rating</span>
            <span className="font-mono font-semibold text-primary">
              {formatRating(designationRating)}
            </span>
          </div>
          <IndicatorRatingBar rating={designationRating} label="Section rating" compact />
        </div>
      )}

      {list.map((dd) => {
        const composite = computeDeliverableComposite(dd);
        return (
          <div key={dd.id} className="rounded-lg border p-4 space-y-3">
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => update(list.filter((x) => x.id !== dd.id))}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            {composite != null && (
              <span className="text-sm font-mono font-semibold text-primary">
                {formatRating(composite)}
              </span>
            )}
            <Textarea
              placeholder="Designation deliverable"
              value={dd.deliverable}
              onChange={(e) =>
                update(list.map((x) => (x.id === dd.id ? { ...x, deliverable: e.target.value } : x)))
              }
            />
            <Textarea
              placeholder="Actual output"
              value={dd.actualOutput ?? ""}
              onChange={(e) =>
                update(list.map((x) => (x.id === dd.id ? { ...x, actualOutput: e.target.value } : x)))
              }
            />
            <RatingFieldsGrid
              item={dd}
              onChange={(patch) =>
                update(list.map((x) => (x.id === dd.id ? { ...x, ...patch } : x)))
              }
            />
          </div>
        );
      })}
      <Button variant="outline" onClick={() => update([...list, { id: uid(), deliverable: "" }])}>
        <Plus className="h-4 w-4" /> Add deliverable
      </Button>
    </div>
  );
}
