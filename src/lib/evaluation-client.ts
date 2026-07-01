import {
  FUNCTION_WEIGHTS,
  getApplicableFunctionCategories,
  getDepartmentMeta,
  getFunctionWeight,
  getOfficeMeta,
  hasPassengerFeedback,
  OFFICES,
} from "@/data/reference";
import { computeNtpEvaluation, type NtpEvaluationResult } from "@/lib/calculation-engine/ntp-evaluation";
import type {
  DesignationDeliverableState,
  EvaluationProfile,
  EvaluationState,
  FunctionCategory,
  FunctionDeliverableState,
  PersonnelCategory,
} from "@/lib/types";

const SESSION_KEY = "parsu-ntp-ipcr-session";

export function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createDefaultProfile(): EvaluationProfile {
  const defaultOffice = OFFICES[0];
  const dept = getDepartmentMeta(defaultOffice.department);
  return {
    employeeName: "",
    positionTitle: "Staff",
    personnelCategory: "ADMIN_STAFF",
    officeCode: defaultOffice.code,
    officeName: defaultOffice.name,
    functionalDepartment: dept?.name ?? "",
    supervisingOffice: dept?.supervisingOffice ?? "",
    appointmentType: "PERMANENT",
    evaluationYear: 2026,
    ratingPeriod: "January–June",
    hasDesignation: false,
    officeOrderVerified: false,
  };
}

export function createInitialState(): EvaluationState {
  return {
    mode: "SELF_EVALUATION",
    currentStep: 1,
    profile: createDefaultProfile(),
    functionDeliverables: [],
    designationDeliverables: [],
  };
}

export function profileIsComplete(profile: EvaluationProfile): boolean {
  return Boolean(
    profile.employeeName.trim() &&
      profile.positionTitle.trim() &&
      profile.officeCode &&
      profile.appointmentType &&
      profile.evaluationYear &&
      profile.ratingPeriod
  );
}

export function hasDeliverableRatingInput(item: {
  qualityRating?: number;
  efficiencyRating?: number;
  timelinessRating?: number;
}): boolean {
  return [item.qualityRating, item.efficiencyRating, item.timelinessRating].some(
    (r) => r != null && r > 0
  );
}

export function computeDeliverableComposite(item: {
  qualityRating?: number;
  efficiencyRating?: number;
  timelinessRating?: number;
}): number | null {
  const ratings = [item.qualityRating, item.efficiencyRating, item.timelinessRating].filter(
    (r): r is number => r != null && r > 0
  );
  if (ratings.length === 0) return null;
  return ratings.reduce((a, b) => a + b, 0) / ratings.length;
}

export function computeDeliverablesSectionRating(
  items: { qualityRating?: number; efficiencyRating?: number; timelinessRating?: number }[]
): number | null {
  const composites = items
    .map(computeDeliverableComposite)
    .filter((r): r is number => r != null && r > 0);
  if (composites.length === 0) return null;
  return composites.reduce((a, b) => a + b, 0) / composites.length;
}

export function getDeliverablesForCategory(
  state: EvaluationState,
  category: FunctionCategory
): FunctionDeliverableState[] {
  return state.functionDeliverables.filter((d) => d.functionCategory === category);
}

export function computeFunctionCategoryRating(
  state: EvaluationState,
  category: FunctionCategory
): number | null {
  return computeDeliverablesSectionRating(getDeliverablesForCategory(state, category));
}

export function computeDesignationLive(state: EvaluationState): number | null {
  return computeDeliverablesSectionRating(state.designationDeliverables);
}

export function buildComputeInput(state: EvaluationState) {
  const { profile } = state;
  const categories = getApplicableFunctionCategories(profile.personnelCategory);
  const functionRatings: Record<string, number> = {};

  for (const category of categories) {
    const rating = computeFunctionCategoryRating(state, category);
    if (rating != null && rating > 0) functionRatings[category] = rating;
  }

  const weights: Record<string, number> = {};
  for (const [key, value] of Object.entries(FUNCTION_WEIGHTS[profile.personnelCategory])) {
    if ((value ?? 0) > 0) weights[key] = value!;
  }

  return {
    personnelCategory: profile.personnelCategory,
    functionWeights: weights,
    functionRatings,
    passengerFeedbackRating: hasPassengerFeedback(profile.personnelCategory)
      ? state.passengerFeedbackRating
      : undefined,
    hasDesignation: profile.hasDesignation,
    officeOrderVerified: profile.officeOrderVerified,
    designationDeliverables: state.designationDeliverables
      .filter(hasDeliverableRatingInput)
      .map((dd) => ({
        qualityRating: dd.qualityRating ?? 0,
        efficiencyRating: dd.efficiencyRating ?? 0,
        timelinessRating: dd.timelinessRating ?? 0,
      })),
  };
}

export function computeLiveEvaluation(state: EvaluationState): NtpEvaluationResult {
  return computeNtpEvaluation(buildComputeInput(state));
}

export function getRatingProgress(state: EvaluationState) {
  const categories = getApplicableFunctionCategories(state.profile.personnelCategory);
  let completed = 0;
  const sectionProgress = categories.map((category) => {
    const deliverables = getDeliverablesForCategory(state, category);
    const rated = deliverables.filter(hasDeliverableRatingInput).length;
    const total = deliverables.length;
    if (total > 0 && rated > 0) completed++;
    return {
      code: category,
      label: category.replace(/_/g, " "),
      completed: rated,
      total: Math.max(total, 1),
      percent: total > 0 ? Math.round((rated / total) * 100) : 0,
      rating: computeFunctionCategoryRating(state, category) ?? 0,
    };
  });

  if (hasPassengerFeedback(state.profile.personnelCategory)) {
    const hasFeedback = (state.passengerFeedbackRating ?? 0) > 0;
    if (hasFeedback) completed++;
    sectionProgress.push({
      code: "PASSENGER_FEEDBACK",
      label: "Passenger Feedback",
      completed: hasFeedback ? 1 : 0,
      total: 1,
      percent: hasFeedback ? 100 : 0,
      rating: state.passengerFeedbackRating ?? 0,
    });
  }

  const total = sectionProgress.length;
  return {
    total,
    completed,
    percent: total > 0 ? Math.round((completed / total) * 100) : 0,
    sectionProgress,
  };
}

export function saveSession(state: EvaluationState) {
  if (typeof window !== "undefined") {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(state));
  }
}

export function loadSession(): EvaluationState | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    const state = JSON.parse(raw) as EvaluationState;
    const rawAppointment = state.profile.appointmentType as string;
    const appointmentType =
      rawAppointment === "TEMPORARY" ? ("CASUAL" as const) : state.profile.appointmentType;
    return {
      ...state,
      profile: { ...state.profile, appointmentType },
    };
  } catch {
    return null;
  }
}

export function clearSession() {
  if (typeof window !== "undefined") sessionStorage.removeItem(SESSION_KEY);
}

export function updateOfficeSelection(
  profile: EvaluationProfile,
  officeCode: string
): EvaluationProfile {
  const office = getOfficeMeta(officeCode);
  if (!office) return profile;
  const dept = getDepartmentMeta(office.department);
  return {
    ...profile,
    officeCode: office.code,
    officeName: office.name,
    functionalDepartment: dept?.name ?? "",
    supervisingOffice: dept?.supervisingOffice ?? "",
  };
}

export function getWeightLabel(category: PersonnelCategory, functionCategory: FunctionCategory) {
  const weight = getFunctionWeight(category, functionCategory);
  return weight > 0 ? `${weight * 100}%` : null;
}
