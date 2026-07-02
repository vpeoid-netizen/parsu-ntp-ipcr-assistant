"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  clampRating,
  type DeliverableRatingsFields,
  type RatingDimension,
} from "@/lib/deliverable-rating";
import { cn } from "@/lib/utils";

export const RATING_OPTIONS = [0, 1, 2, 3, 4, 5] as const;

const DIMENSIONS: {
  key: RatingDimension;
  label: string;
  ratingKey: keyof DeliverableRatingsFields;
  applicableKey: keyof DeliverableRatingsFields;
}[] = [
  { key: "quality", label: "Quality", ratingKey: "qualityRating", applicableKey: "qualityApplicable" },
  {
    key: "efficiency",
    label: "Efficiency",
    ratingKey: "efficiencyRating",
    applicableKey: "efficiencyApplicable",
  },
  {
    key: "timeliness",
    label: "Timeliness",
    ratingKey: "timelinessRating",
    applicableKey: "timelinessApplicable",
  },
];

function DimensionToggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={`${label} applicable`}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 rounded-full border transition-colors",
        checked ? "bg-primary border-primary" : "bg-muted border-input"
      )}
    >
      <span
        className={cn(
          "pointer-events-none block h-4 w-4 rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-4" : "translate-x-0.5"
        )}
      />
    </button>
  );
}

export function RatingSelect({
  label,
  value,
  onChange,
  disabled = false,
}: {
  label: string;
  value?: number;
  onChange: (value: number | undefined) => void;
  disabled?: boolean;
}) {
  return (
    <div className={cn(disabled && "opacity-50")}>
      <Label className="text-xs">{label}</Label>
      <Select
        value={value !== undefined ? String(value) : undefined}
        onValueChange={(v) => onChange(clampRating(parseInt(v, 10)))}
        disabled={disabled}
      >
        <SelectTrigger className="h-9">
          <SelectValue placeholder="0–5" />
        </SelectTrigger>
        <SelectContent>
          {RATING_OPTIONS.map((n) => (
            <SelectItem key={n} value={String(n)}>
              {n}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function RatingFieldsGrid({
  item,
  onChange,
}: {
  item: DeliverableRatingsFields;
  onChange: (patch: Partial<DeliverableRatingsFields>) => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Toggle which dimensions apply to this deliverable. Only applicable dimensions are averaged.
      </p>
      {DIMENSIONS.map(({ key, label, ratingKey, applicableKey }) => {
        const applicable = item[applicableKey] !== false;
        return (
          <div key={key} className="grid grid-cols-[auto_1fr] items-end gap-3">
            <div className="flex flex-col items-center gap-1 pb-2">
              <DimensionToggle
                checked={applicable}
                label={label}
                onChange={(checked) =>
                  onChange({
                    [applicableKey]: checked,
                    ...(checked ? {} : { [ratingKey]: undefined }),
                  })
                }
              />
              <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                {applicable ? "On" : "Off"}
              </span>
            </div>
            <RatingSelect
              label={label}
              value={item[ratingKey] as number | undefined}
              disabled={!applicable}
              onChange={(rating) => onChange({ [ratingKey]: rating })}
            />
          </div>
        );
      })}
    </div>
  );
}
