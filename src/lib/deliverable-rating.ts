export interface DeliverableRatingsFields {
  qualityRating?: number;
  efficiencyRating?: number;
  timelinessRating?: number;
  qualityApplicable?: boolean;
  efficiencyApplicable?: boolean;
  timelinessApplicable?: boolean;
}

export type RatingDimension = "quality" | "efficiency" | "timeliness";

const DIMENSIONS: {
  key: RatingDimension;
  ratingKey: keyof DeliverableRatingsFields;
  applicableKey: keyof DeliverableRatingsFields;
}[] = [
  { key: "quality", ratingKey: "qualityRating", applicableKey: "qualityApplicable" },
  { key: "efficiency", ratingKey: "efficiencyRating", applicableKey: "efficiencyApplicable" },
  { key: "timeliness", ratingKey: "timelinessRating", applicableKey: "timelinessApplicable" },
];

export function clampRating(value: number | undefined | null): number | undefined {
  if (value == null || Number.isNaN(value)) return undefined;
  return Math.min(5, Math.max(0, value));
}

export function isDimensionApplicable(
  item: DeliverableRatingsFields,
  dimension: RatingDimension
): boolean {
  const applicableKey = DIMENSIONS.find((d) => d.key === dimension)?.applicableKey;
  if (!applicableKey) return false;
  return item[applicableKey] !== false;
}

export function defaultDeliverableRatings(): Pick<
  DeliverableRatingsFields,
  "qualityApplicable" | "efficiencyApplicable" | "timelinessApplicable"
> {
  return {
    qualityApplicable: true,
    efficiencyApplicable: true,
    timelinessApplicable: true,
  };
}

export function hasDeliverableRatingInput(item: DeliverableRatingsFields): boolean {
  return DIMENSIONS.some(({ key, ratingKey }) => {
    if (!isDimensionApplicable(item, key)) return false;
    const rating = item[ratingKey];
    return typeof rating === "number" && !Number.isNaN(rating) && rating >= 0;
  });
}

export function hasApplicableDimension(item: DeliverableRatingsFields): boolean {
  return DIMENSIONS.some(({ key }) => isDimensionApplicable(item, key));
}

export function computeDeliverableComposite(item: DeliverableRatingsFields): number | null {
  const ratings = DIMENSIONS.filter(({ key }) => isDimensionApplicable(item, key))
    .map(({ ratingKey }) => {
      const value = item[ratingKey];
      return typeof value === "number" ? clampRating(value) : undefined;
    })
    .filter((r): r is number => r != null);

  if (ratings.length === 0) return null;
  const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
  return clampRating(avg) ?? null;
}
