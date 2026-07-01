"use client";

import { Plus, Trash2 } from "lucide-react";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { IndicatorRatingBar } from "@/components/evaluation/rating-bar";
import { RatingFieldsGrid } from "@/components/evaluation/rating-select";
import { useEvaluation } from "@/components/evaluation/evaluation-context";
import { FUNCTION_CATEGORY_LABELS } from "@/data/reference";
import {
  computeDeliverableComposite,
  computeFunctionCategoryRating,
  getWeightLabel,
  uid,
} from "@/lib/evaluation-client";
import { formatRating } from "@/lib/utils";
import type { FunctionCategory, FunctionDeliverableState } from "@/lib/types";

export function FunctionsStep({ category }: { category: FunctionCategory }) {
  const { state, setState } = useEvaluation();

  const sectionRating = useMemo(
    () => (state ? computeFunctionCategoryRating(state, category) : null),
    [state, category]
  );

  if (!state) return null;

  const weightLabel = getWeightLabel(state.profile.personnelCategory, category);
  const list = state.functionDeliverables.filter((d) => d.functionCategory === category);

  const update = (next: FunctionDeliverableState[]) => {
    const other = state.functionDeliverables.filter((d) => d.functionCategory !== category);
    setState({ ...state, functionDeliverables: [...other, ...next] });
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-primary/5 p-4">
        <h3 className="font-semibold">{FUNCTION_CATEGORY_LABELS[category]}</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Rate each deliverable using Quality, Efficiency, and Timeliness (0–5) per the FY 2026
          Non-Teaching IPCR Guidelines.
          {weightLabel && (
            <span className="block mt-1 font-medium text-primary">
              Weight allocation: {weightLabel} of base IPCR
            </span>
          )}
        </p>
      </div>

      {sectionRating != null && (
        <div className="rounded-lg border bg-card p-4 space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="font-medium">{FUNCTION_CATEGORY_LABELS[category]} rating</span>
            <span className="font-mono font-semibold text-primary">
              {formatRating(sectionRating)}
            </span>
          </div>
          <IndicatorRatingBar rating={sectionRating} label="Section rating" compact />
        </div>
      )}

      {list.map((item) => {
        const composite = computeDeliverableComposite(item);
        return (
          <div key={item.id} className="rounded-lg border p-4 space-y-3">
            <div className="flex justify-between items-start gap-2">
              {composite != null ? (
                <span className="text-sm font-mono font-semibold text-primary field-computed px-2 py-1 rounded">
                  {formatRating(composite)}
                </span>
              ) : (
                <span className="text-sm text-muted-foreground">—</span>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => update(list.filter((x) => x.id !== item.id))}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            {composite != null && (
              <IndicatorRatingBar rating={composite} label="Composite (Q+E+T avg)" compact />
            )}
            <Textarea
              placeholder="Committed deliverable / target indicator"
              value={item.deliverable}
              onChange={(e) =>
                update(list.map((x) => (x.id === item.id ? { ...x, deliverable: e.target.value } : x)))
              }
            />
            <Textarea
              placeholder="Actual accomplishment"
              value={item.actualOutput ?? ""}
              onChange={(e) =>
                update(
                  list.map((x) => (x.id === item.id ? { ...x, actualOutput: e.target.value } : x))
                )
              }
            />
            <RatingFieldsGrid
              item={item}
              onChange={(patch) =>
                update(list.map((x) => (x.id === item.id ? { ...x, ...patch } : x)))
              }
            />
          </div>
        );
      })}

      <Button
        variant="outline"
        onClick={() =>
          update([...list, { id: uid(), functionCategory: category, deliverable: "" }])
        }
      >
        <Plus className="h-4 w-4" /> Add deliverable
      </Button>
    </div>
  );
}
