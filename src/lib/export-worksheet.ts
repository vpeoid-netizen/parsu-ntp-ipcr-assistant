import type { NtpEvaluationResult } from "@/lib/calculation-engine/ntp-evaluation";
import {
  computeDeliverableComposite,
  computeFunctionCategoryRating,
} from "@/lib/evaluation-client";
import type { EvaluationState, FunctionCategory } from "@/lib/types";
import {
  FUNCTION_CATEGORY_LABELS,
  FUNCTION_WEIGHTS,
  RULESET_VERSION,
} from "@/data/reference";
import { formatRating, PERSONNEL_CATEGORY_LABELS, APPOINTMENT_LABELS } from "@/lib/utils";

export interface WorksheetDeliverableRow {
  category: string;
  deliverable: string;
  rating: string;
}

export interface WorksheetData {
  title: string;
  subtitle: string;
  personnelRows: [string, string][];
  deliverables: WorksheetDeliverableRow[];
  summaryRows: [string, string][];
  finalRating: string;
  adjectivalRating: string;
  footerNote: string;
}

export function buildWorksheetData(
  state: EvaluationState,
  computation: NtpEvaluationResult
): WorksheetData {
  const { profile } = state;

  const personnelRows: [string, string][] = [
    ["Employee", profile.employeeName || "—"],
    ["Position", profile.positionTitle || "—"],
    ["Personnel Category", PERSONNEL_CATEGORY_LABELS[profile.personnelCategory] || "—"],
    ["Office / Unit", profile.officeName || "—"],
    ["Functional Department", profile.functionalDepartment || "—"],
    ["Supervising Office", profile.supervisingOffice || "—"],
    ["Appointment", APPOINTMENT_LABELS[profile.appointmentType] ?? profile.appointmentType],
    ["Evaluation Year / Period", `${profile.evaluationYear} — ${profile.ratingPeriod}`],
  ];

  if (profile.supervisorName) {
    personnelRows.push(["Immediate Supervisor", profile.supervisorName]);
  }

  if (profile.hasDesignation && profile.designationTitle) {
    personnelRows.push(["Designation", profile.designationTitle]);
  }

  const deliverables: WorksheetDeliverableRow[] = state.functionDeliverables
    .filter((d) => d.deliverable.trim() || computeDeliverableComposite(d) != null)
    .map((d) => ({
      category: FUNCTION_CATEGORY_LABELS[d.functionCategory],
      deliverable: d.deliverable || "—",
      rating: formatRating(computeDeliverableComposite(d)),
    }));

  if ((state.passengerFeedbackRating ?? 0) > 0) {
    deliverables.push({
      category: FUNCTION_CATEGORY_LABELS.PASSENGER_FEEDBACK,
      deliverable: "Passenger Feedback",
      rating: formatRating(state.passengerFeedbackRating),
    });
  }

  const weights = FUNCTION_WEIGHTS[profile.personnelCategory];
  const summaryRows: [string, string][] = Object.entries(weights)
    .filter(([, w]) => (w ?? 0) > 0)
    .map(([category, weight]) => {
      const label = FUNCTION_CATEGORY_LABELS[category as FunctionCategory];
      const rating =
        category === "PASSENGER_FEEDBACK"
          ? state.passengerFeedbackRating ?? 0
          : computeFunctionCategoryRating(state, category as FunctionCategory) ?? 0;
      return [`${label} (${(weight! * 100).toFixed(0)}%)`, formatRating(rating)];
    });

  summaryRows.push(
    ["Base IPCR", formatRating(computation.baseIpcr.rating)],
    ...(profile.hasDesignation
      ? [["Designation", formatRating(computation.designationRating.rating)] as [string, string]]
      : []),
    ["Final IPCR", formatRating(computation.finalIpcr.rating)],
    ["Adjectival Rating", computation.adjectivalRating]
  );

  return {
    title: "ParSU Non-Teaching Personnel IPCR Evaluation Worksheet",
    subtitle: `${RULESET_VERSION} — ${profile.employeeName || "Unnamed Employee"}`,
    personnelRows,
    deliverables,
    summaryRows,
    finalRating: formatRating(computation.finalIpcr.rating),
    adjectivalRating: computation.adjectivalRating,
    footerNote:
      "Computation assistance only. Subject to official validation, approval, and signing per FY 2026 Non-Teaching IPCR Guidelines.",
  };
}

export function buildExportFilename(state: EvaluationState): string {
  const name = state.profile.employeeName.trim().replace(/\s+/g, "_") || "employee";
  const period = state.profile.ratingPeriod.replace(/[–\s]/g, "_");
  return `ParSU_Non_Teaching_Personnel_IPCR_${name}_${state.profile.evaluationYear}_${period}.pdf`;
}
