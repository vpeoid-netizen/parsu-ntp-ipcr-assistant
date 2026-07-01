"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { clampRating } from "@/lib/evaluation-client";

export const RATING_OPTIONS = [0, 1, 2, 3, 4, 5] as const;

export function RatingSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: number;
  onChange: (value: number | undefined) => void;
}) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <Select
        value={value !== undefined ? String(value) : undefined}
        onValueChange={(v) => onChange(clampRating(parseInt(v, 10)))}
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
  item: {
    qualityRating?: number;
    efficiencyRating?: number;
    timelinessRating?: number;
  };
  onChange: (patch: {
    qualityRating?: number;
    efficiencyRating?: number;
    timelinessRating?: number;
  }) => void;
}) {
  const fields = [
    { key: "qualityRating" as const, label: "Quality" },
    { key: "efficiencyRating" as const, label: "Efficiency" },
    { key: "timelinessRating" as const, label: "Timeliness" },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {fields.map(({ key, label }) => (
        <RatingSelect
          key={key}
          label={label}
          value={item[key]}
          onChange={(rating) => onChange({ [key]: rating })}
        />
      ))}
    </div>
  );
}
