import {
  avg,
  cap,
  createTrace,
  d,
  getAdjectivalRating,
  round,
  type ComputationStep,
  type ComputationTrace,
  type D,
} from "./decimal";

export interface DeliverableInput {
  qualityRating: number;
  efficiencyRating: number;
  timelinessRating: number;
}

export interface NtpEvaluationInput {
  personnelCategory: string;
  functionWeights: Record<string, number>;
  functionRatings: Record<string, number>;
  passengerFeedbackRating?: number;
  hasDesignation: boolean;
  designationDeliverables: DeliverableInput[];
}

export interface SectionRating {
  rating: number;
  trace: ComputationTrace;
}

export interface NtpEvaluationResult {
  functionSectionRatings: Record<string, SectionRating>;
  baseIpcr: SectionRating;
  designationRating: SectionRating;
  finalIpcr: SectionRating;
  adjectivalRating: string;
}

function compositeRating(item: DeliverableInput): number {
  const ratings = [item.qualityRating, item.efficiencyRating, item.timelinessRating]
    .map((r) => Math.min(5, Math.max(0, r)))
    .filter((r) => !Number.isNaN(r));
  if (ratings.length === 0) return 0;
  const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
  return Math.min(5, avg);
}

function avgDeliverables(items: DeliverableInput[]): { rating: D; trace: ComputationStep[] } {
  const steps: ComputationStep[] = [];
  if (items.length === 0) {
    steps.push({ label: "No rated deliverables", value: "0.000" });
    return { rating: d(0), trace: steps };
  }

  const composites = items.map((item) => d(compositeRating(item)));
  const rating = avg(composites);
  steps.push({
    label: "Average of deliverable composites (Q+E+T)",
    formula: `${composites.map((c) => round(c).toFixed(3)).join(" + ")} ÷ ${composites.length}`,
    value: round(rating).toFixed(3),
  });
  return { rating, trace: steps };
}

export function computeBaseIpcrNtp(
  functionWeights: Record<string, number>,
  functionRatings: Record<string, number>,
  passengerFeedbackRating?: number
): { rating: D; trace: ComputationStep[] } {
  const steps: ComputationStep[] = [];
  const contributions: { label: string; value: number; weight: number }[] = [];

  for (const [category, weight] of Object.entries(functionWeights)) {
    if (weight <= 0) continue;
    const rating =
      category === "PASSENGER_FEEDBACK"
        ? Math.min(5, Math.max(0, passengerFeedbackRating ?? 0))
        : Math.min(5, Math.max(0, functionRatings[category] ?? 0));
    const contrib = rating * weight;
    contributions.push({
      label: category.replace(/_/g, " "),
      value: rating,
      weight,
    });
    steps.push({
      label: `${category.replace(/_/g, " ")} (${weight * 100}%)`,
      formula: `${rating.toFixed(3)} × ${weight * 100}%`,
      value: contrib.toFixed(3),
    });
  }

  const total = contributions.reduce((sum, c) => sum + c.value * c.weight, 0);
  steps.push({
    label: "Base IPCR (weighted sum)",
    value: total.toFixed(3),
  });

  return { rating: d(total), trace: steps };
}

export function computeFinalIpcrNtp(
  baseIpcr: number,
  designationRating: number,
  hasDesignation: boolean
): { rating: D; trace: ComputationStep[] } {
  const steps: ComputationStep[] = [];
  const base = d(baseIpcr);
  const designation = d(Math.min(5, Math.max(0, designationRating)));

  if (!hasDesignation) {
    steps.push({
      label: "Final IPCR (no designation)",
      value: round(base).toFixed(3),
    });
    return { rating: cap(base), trace: steps };
  }

  const baseContrib = base.times(0.7);
  const desigContrib = designation.times(0.3);
  steps.push({
    label: "Base IPCR (70%)",
    formula: `${round(base).toFixed(3)} × 70%`,
    value: round(baseContrib).toFixed(3),
  });
  steps.push({
    label: "Designation rating (30%)",
    formula: `${round(designation).toFixed(3)} × 30%`,
    value: round(desigContrib).toFixed(3),
  });
  const final = baseContrib.plus(desigContrib);
  steps.push({ label: "Final IPCR", value: round(final).toFixed(3) });
  return { rating: cap(final), trace: steps };
}

export function computeNtpEvaluation(input: NtpEvaluationInput): NtpEvaluationResult {
  const functionSectionRatings: Record<string, SectionRating> = {};

  for (const category of Object.keys(input.functionWeights)) {
    if (category === "PASSENGER_FEEDBACK") continue;
    const rating = input.functionRatings[category] ?? 0;
    functionSectionRatings[category] = {
      rating,
      trace: createTrace(
        [{ label: `${category} section average`, value: rating.toFixed(3) }],
        d(rating),
        [],
        rating > 0
      ),
    };
  }

  const baseResult = computeBaseIpcrNtp(
    input.functionWeights,
    input.functionRatings,
    input.passengerFeedbackRating
  );

  const desigResult = avgDeliverables(input.designationDeliverables);
  const finalResult = computeFinalIpcrNtp(
    round(baseResult.rating).toNumber(),
    round(desigResult.rating).toNumber(),
    input.hasDesignation
  );

  return {
    functionSectionRatings,
    baseIpcr: {
      rating: round(baseResult.rating).toNumber(),
      trace: createTrace(baseResult.trace, baseResult.rating),
    },
    designationRating: {
      rating: round(desigResult.rating).toNumber(),
      trace: createTrace(desigResult.trace, desigResult.rating),
    },
    finalIpcr: {
      rating: round(finalResult.rating).toNumber(),
      trace: createTrace(finalResult.trace, finalResult.rating),
    },
    adjectivalRating: getAdjectivalRating(finalResult.rating),
  };
}
