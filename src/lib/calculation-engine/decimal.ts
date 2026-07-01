import Decimal from "decimal.js";

// Configure Decimal.js for IPCR precision
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

export type D = Decimal;

export function d(value: string | number | Decimal | null | undefined): D {
  if (value === null || value === undefined || value === "") return new Decimal(0);
  return new Decimal(value);
}

export function cap(value: D, max: D = d(5)): D {
  const v = value.lt(0) ? d(0) : value;
  return v.gt(max) ? max : v;
}

export function round(value: D, places: number = 3): D {
  return value.toDecimalPlaces(places, Decimal.ROUND_HALF_UP);
}

export function toNumber(value: D, places: number = 3): number {
  return round(value, places).toNumber();
}

export function avg(values: D[]): D {
  if (values.length === 0) return d(0);
  const sum = values.reduce((acc, v) => acc.plus(v), d(0));
  return sum.div(values.length);
}

export function weightedSum(items: { value: D; weight: D }[]): D {
  return items.reduce((acc, item) => acc.plus(item.value.times(item.weight)), d(0));
}

export interface ComputationStep {
  label: string;
  formula?: string;
  value: string;
  detail?: string;
}

export interface ComputationTrace {
  indicatorCode?: string;
  indicatorName?: string;
  steps: ComputationStep[];
  finalRating: string;
  isComplete: boolean;
  warnings: string[];
}

export function createTrace(
  steps: ComputationStep[],
  finalRating: D,
  warnings: string[] = [],
  isComplete: boolean = true
): ComputationTrace {
  return {
    steps,
    finalRating: round(finalRating).toFixed(3),
    isComplete,
    warnings,
  };
}

// Adjectival rating interpretation (SPMS)
export function getAdjectivalRating(rating: D | null): string {
  if (rating === null || rating.isNaN() || !rating.isFinite()) return "Not Yet Computable";
  if (rating.lte(0)) return "Not Yet Computable";
  if (rating.eq(5)) return "Outstanding";
  if (rating.gte(4) && rating.lt(5)) return "Very Satisfactory";
  if (rating.gte(3) && rating.lt(4)) return "Satisfactory";
  if (rating.gte(2) && rating.lt(3)) return "Unsatisfactory";
  if (rating.gte(1) && rating.lt(2)) return "Poor";
  return "Not Yet Computable";
}

// Authorship allocation: main author 60%, co-authors share 40%
export function allocateAuthorship(
  rawRating: D,
  isMainAuthor: boolean,
  numberOfAuthors: number,
  mainAuthorPct = 60,
  coAuthorPct = 40
): { allocated: D; trace: ComputationStep[] } {
  const steps: ComputationStep[] = [];
  const n = Math.max(numberOfAuthors, 1);

  if (n <= 1) {
    steps.push({
      label: "Sole author/producer",
      value: round(rawRating).toFixed(3),
    });
    return { allocated: rawRating, trace: steps };
  }

  const mainFrac = d(mainAuthorPct).div(100);
  const coFrac = d(coAuthorPct).div(100);

  if (isMainAuthor) {
    const allocated = rawRating.times(mainFrac);
    steps.push({
      label: "Main author allocation",
      formula: `${rawRating.toFixed(1)} × ${mainAuthorPct}%`,
      value: round(allocated).toFixed(3),
    });
    return { allocated, trace: steps };
  }

  const coAuthorShare = rawRating.times(coFrac).div(n - 1);
  steps.push({
    label: "Co-author allocation",
    formula: `${rawRating.toFixed(1)} × ${coAuthorPct}% ÷ ${n - 1} co-authors`,
    value: round(coAuthorShare).toFixed(3),
  });
  return { allocated: coAuthorShare, trace: steps };
}

// Project leader allocation: leader 60%, members share 40%
export function allocateProjectRole(
  rawRating: D,
  isLeader: boolean,
  numberOfMembers: number,
  leaderPct = 60,
  memberPct = 40
): { allocated: D; trace: ComputationStep[] } {
  return allocateAuthorship(rawRating, isLeader, numberOfMembers, leaderPct, memberPct);
}

// Research fund co-contributor: main gets full, co-contributors get half
export function allocateFundGeneration(
  rawRating: D,
  isMainContributor: boolean
): { allocated: D; trace: ComputationStep[] } {
  const steps: ComputationStep[] = [];
  if (isMainContributor) {
    steps.push({
      label: "Main contributor allocation",
      formula: `${rawRating.toFixed(1)} × 100%`,
      value: round(rawRating).toFixed(3),
    });
    return { allocated: rawRating, trace: steps };
  }
  const half = rawRating.times(0.5);
  steps.push({
    label: "Co-contributor allocation",
    formula: `${rawRating.toFixed(1)} × 50%`,
    value: round(half).toFixed(3),
  });
  return { allocated: half, trace: steps };
}

// Average by required count (for research productivity, presentations, publications)
export function averageByRequiredCount(
  allocatedScores: D[],
  requiredCount: number,
  capAt: D = d(5)
): { rating: D; trace: ComputationStep[] } {
  const steps: ComputationStep[] = [];
  const sum = allocatedScores.reduce((acc, s) => acc.plus(s), d(0));
  steps.push({
    label: "Sum of allocated scores",
    value: round(sum).toFixed(3),
    detail: allocatedScores.map((s, i) => `Output ${i + 1}: ${round(s).toFixed(3)}`).join(", "),
  });

  if (requiredCount <= 0) requiredCount = 1;
  const raw = sum.div(requiredCount);
  steps.push({
    label: "Divide by required count",
    formula: `${round(sum).toFixed(3)} ÷ ${requiredCount}`,
    value: round(raw).toFixed(3),
  });

  const capped = cap(raw, capAt);
  if (capped.lt(raw)) {
    steps.push({
      label: "Cap applied",
      formula: `min(${round(raw).toFixed(3)}, ${capAt.toFixed(1)})`,
      value: round(capped).toFixed(3),
    });
  }

  return { rating: capped, trace: steps };
}

// Cumulative scoring with cap
export function cumulativeWithCap(scores: D[], capAt: D = d(5)): { rating: D; trace: ComputationStep[] } {
  const steps: ComputationStep[] = [];
  const sum = scores.reduce((acc, s) => acc.plus(s), d(0));
  steps.push({
    label: "Cumulative sum",
    value: round(sum).toFixed(3),
    detail: scores.map((s, i) => `Item ${i + 1}: ${round(s).toFixed(3)}`).join(", "),
  });
  const capped = cap(sum, capAt);
  if (capped.lt(sum)) {
    steps.push({
      label: "Cap applied",
      formula: `min(${round(sum).toFixed(3)}, ${capAt.toFixed(1)})`,
      value: round(capped).toFixed(3),
    });
  }
  return { rating: capped, trace: steps };
}

// Highest only (non-cumulative)
export function highestOnly(scores: D[]): { rating: D; trace: ComputationStep[] } {
  const steps: ComputationStep[] = [];
  if (scores.length === 0) {
    steps.push({ label: "No valid outputs", value: "0.000" });
    return { rating: d(0), trace: steps };
  }
  const highest = scores.reduce((max, s) => (s.gt(max) ? s : max), d(0));
  steps.push({
    label: "Highest achieved",
    value: round(highest).toFixed(3),
    detail: scores.map((s, i) => `Item ${i + 1}: ${round(s).toFixed(3)}`).join(", "),
  });
  return { rating: highest, trace: steps };
}

// Percentage achievement to rating
export function percentageToRating(pct: D): { rating: D; trace: ComputationStep[] } {
  const steps: ComputationStep[] = [];
  steps.push({ label: "Achievement percentage", value: `${round(pct, 2).toFixed(2)}%` });

  let rating: D;
  if (pct.gte(100)) rating = d(5);
  else if (pct.gte(90)) rating = d(4);
  else if (pct.gte(80)) rating = d(3);
  else if (pct.gte(70)) rating = d(2);
  else if (pct.gt(0)) rating = d(1);
  else rating = d(0);

  steps.push({
    label: "Mapped rating",
    value: round(rating, 1).toFixed(1),
    detail: getPercentageBandDescription(pct),
  });
  return { rating, trace: steps };
}

function getPercentageBandDescription(pct: D): string {
  if (pct.gte(100)) return "100% or more → 5";
  if (pct.gte(90)) return "90%–99.99% → 4";
  if (pct.gte(80)) return "80%–89.99% → 3";
  if (pct.gte(70)) return "70%–79.99% → 2";
  if (pct.gt(0)) return "Below 70% but > 0 → 1";
  return "No accomplishment → 0";
}

// Target comparison rating (for persons trained, etc.)
export function targetComparisonRating(
  actual: D,
  target: D
): { rating: D; pct: D; trace: ComputationStep[] } {
  const steps: ComputationStep[] = [];
  if (target.lte(0)) {
    steps.push({ label: "No target assigned", value: "0.000" });
    return { rating: d(0), pct: d(0), trace: steps };
  }

  const pct = actual.div(target).times(100);
  steps.push({
    label: "Achievement",
    formula: `${actual.toFixed(0)} ÷ ${target.toFixed(0)} × 100`,
    value: `${round(pct, 2).toFixed(2)}%`,
  });

  let rating: D;
  if (pct.gt(115)) rating = d(5);
  else if (pct.gt(100)) rating = d(4);
  else if (pct.eq(100)) rating = d(3);
  else if (pct.gt(85)) rating = d(2);
  else if (pct.gt(0)) rating = d(1);
  else rating = d(0);

  steps.push({ label: "Mapped rating", value: round(rating, 1).toFixed(1) });
  return { rating, pct, trace: steps };
}

// Fund amount to rating
export function fundAmountToRating(amount: D): { rating: D; trace: ComputationStep[] } {
  const steps: ComputationStep[] = [];
  steps.push({ label: "Total funded amount", value: `PHP ${amount.toFixed(2)}` });

  let rating: D;
  if (amount.lte(0)) rating = d(0);
  else if (amount.gte(1000000)) rating = d(5);
  else if (amount.gt(750000)) rating = d(4);
  else if (amount.gt(500000)) rating = d(3);
  else if (amount.gt(250000)) rating = d(2);
  else rating = d(1);

  steps.push({ label: "Mapped rating", value: round(rating, 1).toFixed(1) });
  return { rating, trace: steps };
}

// Geographic level to rating
export function geographicLevelToRating(
  level: string,
  scale: "training" | "engagement" | "presentation"
): D {
  const trainingMap: Record<string, number> = {
    INTERNATIONAL: 5,
    NATIONAL: 4,
    REGIONAL: 3,
    PROVINCIAL: 3,
    DISTRICT: 3,
    MUNICIPAL: 3,
    UNIVERSITY: 2,
    UNIVERSITY_LEVEL: 2,
    COLLEGE: 1,
    COLLEGE_LEVEL: 1,
  };

  const engagementMap: Record<string, number> = {
    INTERNATIONAL: 5,
    NATIONAL: 4,
    REGIONAL: 3,
    PROVINCIAL: 3,
    DISTRICT: 3,
    MUNICIPAL: 3,
    UNIVERSITY_WIDE: 2,
    UNIVERSITY: 2,
    COLLEGE_WIDE: 1,
    COLLEGE: 1,
  };

  const presentationMap: Record<string, number> = {
    INTERNATIONAL: 5,
    NATIONAL: 4,
    REGIONAL: 3,
    AGENCY_INHOUSE: 2,
    COLLEGE: 1,
  };

  const map =
    scale === "engagement" ? engagementMap :
    scale === "presentation" ? presentationMap :
    trainingMap;
  return d(map[level.toUpperCase()] ?? 0);
}

// MFO average from applicable indicators
export function computeMfoRating(
  indicatorRatings: { code: string; rating: D; applicable: boolean }[]
): { rating: D; trace: ComputationStep[] } {
  const steps: ComputationStep[] = [];
  const applicable = indicatorRatings.filter((i) => i.applicable && i.rating.gt(0));

  if (applicable.length === 0) {
    steps.push({ label: "No applicable indicators", value: "0.000" });
    return { rating: d(0), trace: steps };
  }

  applicable.forEach((ind) => {
    steps.push({
      label: ind.code,
      value: round(ind.rating).toFixed(3),
    });
  });

  const ratings = applicable.map((i) => i.rating);
  const average = avg(ratings);
  steps.push({
    label: "MFO average",
    formula: `(${ratings.map((r) => round(r).toFixed(3)).join(" + ")}) ÷ ${ratings.length}`,
    value: round(average).toFixed(3),
  });

  return { rating: cap(average), trace: steps };
}

// Performance Results from MFO weights
export interface MfoWeights {
  mfo1_2: D;
  mfo3: D;
  mfo4: D;
}

export function computePerformanceResults(
  mfo1_2Rating: D,
  mfo3Rating: D,
  mfo4Rating: D,
  weights: MfoWeights
): { rating: D; trace: ComputationStep[] } {
  const steps: ComputationStep[] = [];

  const contributions = [
    { label: "MFO 1 & 2", rating: mfo1_2Rating, weight: weights.mfo1_2 },
    { label: "MFO 3", rating: mfo3Rating, weight: weights.mfo3 },
    { label: "MFO 4", rating: mfo4Rating, weight: weights.mfo4 },
  ];

  contributions.forEach((c) => {
    const contrib = c.rating.times(c.weight);
    steps.push({
      label: `${c.label} contribution`,
      formula: `${round(c.rating).toFixed(3)} × ${c.weight.times(100).toFixed(0)}%`,
      value: round(contrib).toFixed(3),
    });
  });

  const total = weightedSum(
    contributions.map((c) => ({ value: c.rating, weight: c.weight }))
  );
  steps.push({
    label: "Performance Results",
    value: round(total).toFixed(3),
  });

  return { rating: cap(total), trace: steps };
}

// Consolidate strategic/priority targets
export function consolidateStrategicPriority(
  strategicTargets: { accomplishment: D; target: D; unit: string }[],
  priorityTargets: { accomplishment: D; target: D; unit: string }[],
  method: "weighted_total" | "average_percentage" = "weighted_total",
  pctCeiling: number = 100
): { rating: D; pct: D; trace: ComputationStep[] } {
  const steps: ComputationStep[] = [];
  const allTargets = [
    ...strategicTargets.map((t) => ({ ...t, type: "Strategic" })),
    ...priorityTargets.map((t) => ({ ...t, type: "Priority" })),
  ];

  if (allTargets.length === 0) {
    steps.push({ label: "No strategic/priority targets assigned", value: "N/A" });
    return { rating: d(0), pct: d(0), trace: steps, };
  }

  // Check if all share common unit
  const units = new Set(allTargets.map((t) => t.unit));
  if (units.size === 1 && method === "weighted_total") {
    const totalTarget = allTargets.reduce((s, t) => s.plus(t.target), d(0));
    const totalAccomplishment = allTargets.reduce((s, t) => s.plus(t.accomplishment), d(0));
    const pct = totalTarget.gt(0) ? totalAccomplishment.div(totalTarget).times(100) : d(0);
    steps.push({
      label: "Consolidated achievement (common unit)",
      formula: `${round(totalAccomplishment).toFixed(2)} ÷ ${round(totalTarget).toFixed(2)} × 100`,
      value: `${round(pct, 2).toFixed(2)}%`,
    });
    const { rating, trace: ratingTrace } = percentageToRating(pct);
    steps.push(...ratingTrace.slice(1));
    return { rating, pct, trace: steps };
  }

  // Different units: average individual percentages
  const percentages = allTargets.map((t) => {
    const pct = t.target.gt(0) ? t.accomplishment.div(t.target).times(100) : d(0);
    const capped = pct.gt(pctCeiling) ? d(pctCeiling) : pct;
    steps.push({
      label: `${t.type} target`,
      formula: `${round(t.accomplishment).toFixed(2)} ÷ ${round(t.target).toFixed(2)} × 100`,
      value: `${round(capped, 2).toFixed(2)}%`,
    });
    return capped;
  });

  const avgPct = avg(percentages);
  steps.push({
    label: "Average achievement percentage",
    value: `${round(avgPct, 2).toFixed(2)}%`,
  });

  const { rating, trace: ratingTrace } = percentageToRating(avgPct);
  steps.push(...ratingTrace.slice(1));
  return { rating, pct: avgPct, trace: steps };
}

// Base IPCR computation
export function computeBaseIpcr(
  performanceResults: D,
  consolidatedStratPri: D,
  supportFunctionsRating: D,
  hasSupportFunctions: boolean,
  hasStrategicOrPriority: boolean
): { rating: D; trace: ComputationStep[] } {
  const steps: ComputationStep[] = [];

  if (hasSupportFunctions) {
    const prWeight = hasStrategicOrPriority ? 0.8 : 0.9;
    const spWeight = 0.1;
    const sfWeight = 0.1;
    const prContrib = performanceResults.times(prWeight);
    const spContrib = consolidatedStratPri.times(spWeight);
    const sfContrib = supportFunctionsRating.times(sfWeight);
    steps.push({
      label: `Performance Results (${prWeight * 100}%)`,
      formula: `${round(performanceResults).toFixed(3)} × ${prWeight * 100}%`,
      value: round(prContrib).toFixed(3),
    });
    if (hasStrategicOrPriority) {
      steps.push({
        label: "Strategic/Priority (10%)",
        formula: `${round(consolidatedStratPri).toFixed(3)} × 10%`,
        value: round(spContrib).toFixed(3),
      });
    }
    steps.push({
      label: "Support Functions (10%)",
      formula: `${round(supportFunctionsRating).toFixed(3)} × 10%`,
      value: round(sfContrib).toFixed(3),
    });
    const total = prContrib.plus(hasStrategicOrPriority ? spContrib : d(0)).plus(sfContrib);
    steps.push({ label: "Base IPCR", value: round(total).toFixed(3) });
    return { rating: cap(total), trace: steps };
  }

  const prWeight = hasStrategicOrPriority ? 0.85 : 1;
  const spWeight = 0.15;
  const prContrib = performanceResults.times(prWeight);
  const spContrib = consolidatedStratPri.times(spWeight);
  steps.push({
    label: `Performance Results (${prWeight * 100}%)`,
    formula: `${round(performanceResults).toFixed(3)} × ${prWeight * 100}%`,
    value: round(prContrib).toFixed(3),
  });
  if (hasStrategicOrPriority) {
    steps.push({
      label: "Strategic/Priority (15%)",
      formula: `${round(consolidatedStratPri).toFixed(3)} × 15%`,
      value: round(spContrib).toFixed(3),
    });
  }
  const total = prContrib.plus(hasStrategicOrPriority ? spContrib : d(0));
  steps.push({ label: "Base IPCR", value: round(total).toFixed(3) });
  return { rating: cap(total), trace: steps };
}

// Final IPCR with designation weighting
export function computeFinalIpcr(
  baseIpcr: D,
  designationRating: D,
  deloadedUnits: D,
  totalLoadUnits: D,
  officeOrderVerified: boolean
): { rating: D; trace: ComputationStep[] } {
  const steps: ComputationStep[] = [];

  if (!officeOrderVerified || deloadedUnits.lte(0) || totalLoadUnits.lte(0)) {
    steps.push({
      label: "No verified designation weighting applied",
      value: round(baseIpcr).toFixed(3),
    });
    return { rating: cap(baseIpcr), trace: steps };
  }

  const designationWeight = deloadedUnits.div(totalLoadUnits);
  const baseWeight = totalLoadUnits.minus(deloadedUnits).div(totalLoadUnits);

  steps.push({
    label: "Designation weight (A/B)",
    formula: `${deloadedUnits.toFixed(0)} ÷ ${totalLoadUnits.toFixed(0)}`,
    value: `${round(designationWeight.times(100), 1).toFixed(1)}%`,
  });
  steps.push({
    label: "Base IPCR weight ((B-A)/B)",
    formula: `(${totalLoadUnits.toFixed(0)} - ${deloadedUnits.toFixed(0)}) ÷ ${totalLoadUnits.toFixed(0)}`,
    value: `${round(baseWeight.times(100), 1).toFixed(1)}%`,
  });

  const desigContrib = designationRating.times(designationWeight);
  const baseContrib = baseIpcr.times(baseWeight);

  steps.push({
    label: "Designation contribution",
    formula: `${round(designationRating).toFixed(3)} × ${round(designationWeight.times(100), 1).toFixed(1)}%`,
    value: round(desigContrib).toFixed(3),
  });
  steps.push({
    label: "Base IPCR contribution",
    formula: `${round(baseIpcr).toFixed(3)} × ${round(baseWeight.times(100), 1).toFixed(1)}%`,
    value: round(baseContrib).toFixed(3),
  });

  const final = desigContrib.plus(baseContrib);
  steps.push({ label: "Final IPCR", value: round(final).toFixed(3) });
  return { rating: cap(final), trace: steps };
}

// Support functions average
export function computeSupportFunctionsRating(
  deliverables: { compositeRating: D }[]
): { rating: D; trace: ComputationStep[] } {
  const steps: ComputationStep[] = [];
  const valid = deliverables.filter((d) => d.compositeRating.gt(0));
  if (valid.length === 0) {
    steps.push({ label: "No support function deliverables", value: "0.000" });
    return { rating: d(0), trace: steps };
  }
  valid.forEach((d, i) => {
    steps.push({ label: `Deliverable ${i + 1}`, value: round(d.compositeRating).toFixed(3) });
  });
  const average = avg(valid.map((d) => d.compositeRating));
  steps.push({
    label: "Support Functions average",
    value: round(cap(average)).toFixed(3),
  });
  return { rating: cap(average), trace: steps };
}

// Designation deliverables average
export function computeDesignationRating(
  deliverables: { compositeRating: D }[]
): { rating: D; trace: ComputationStep[] } {
  return computeSupportFunctionsRating(deliverables);
}

// MFO weights by rank category
export function getMfoWeights(
  rankCategory: string,
  appointmentType: string
): MfoWeights {
  if (appointmentType === "COS") {
    return { mfo1_2: d(1), mfo3: d(0), mfo4: d(0) };
  }

  const table: Record<string, MfoWeights> = {
    INSTRUCTOR: { mfo1_2: d(0.8), mfo3: d(0.15), mfo4: d(0.05) },
    ASSISTANT_PROFESSOR: { mfo1_2: d(0.7), mfo3: d(0.2), mfo4: d(0.1) },
    ASSOCIATE_PROFESSOR: { mfo1_2: d(0.6), mfo3: d(0.3), mfo4: d(0.1) },
    PROFESSOR: { mfo1_2: d(0.45), mfo3: d(0.5), mfo4: d(0.05) },
  };

  return table[rankCategory] ?? table.INSTRUCTOR;
}

// Required output count by rank
export function getRequiredOutputCount(
  rankCategory: string,
  defaultCount: number = 1
): number {
  if (rankCategory === "PROFESSOR") return 2;
  return defaultCount;
}
