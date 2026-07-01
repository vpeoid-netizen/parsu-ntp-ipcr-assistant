import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  FUNCTION_CATEGORY_LABELS,
  hasPassengerFeedback,
} from "@/data/reference";
import type { EvaluationMode, EvaluationProfile } from "@/lib/types";

export type { EvaluationMode };

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRating(value: number | string | null | undefined, decimals = 3): string {
  if (value === null || value === undefined) return "—";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num) || num < 0) return "—";
  if (num === 0) return (0).toFixed(decimals);
  return num.toFixed(decimals);
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" });
}

export const APPOINTMENT_LABELS: Record<string, string> = {
  PERMANENT: "Permanent",
  CASUAL: "Casual",
  COS: "Contract of Service",
};

export const PERSONNEL_CATEGORY_LABELS: Record<string, string> = {
  DIRECTOR_UNIT_HEAD: "Director / Unit Head",
  ADMIN_STAFF: "Office / Unit / Administrative Staff",
  UNIVERSITY_DRIVER: "Full-Time University Driver",
  PROJECT_BASED: "Project-Based Personnel",
};

export interface EvaluationStep {
  id: number;
  label: string;
  key: string;
}

export function getEvaluationSteps(profile: EvaluationProfile): EvaluationStep[] {
  const steps: EvaluationStep[] = [
    { id: 1, label: "Personnel Information", key: "profile" },
    { id: 2, label: "Core Functions", key: "core" },
  ];

  let nextId = 3;
  const add = (label: string, key: string) => {
    steps.push({ id: nextId++, label, key });
  };

  if (profile.personnelCategory !== "UNIVERSITY_DRIVER") {
    add("Strategic Functions", "strategic");
  }

  if (profile.personnelCategory === "ADMIN_STAFF" || profile.personnelCategory === "PROJECT_BASED") {
    add("Support Functions", "support");
  }

  if (profile.personnelCategory === "UNIVERSITY_DRIVER") {
    add("Support Functions", "support");
  }

  add("Other Functions", "other");

  if (hasPassengerFeedback(profile.personnelCategory)) {
    add("Passenger Feedback", "passenger");
  }

  if (profile.hasDesignation) {
    add("Designation Rating", "designation");
  }

  add("Rating Summary", "summary");
  add("Preview & Export", "export");

  return steps;
}

export const EVALUATION_MODE_LABELS: Record<EvaluationMode, string> = {
  SELF_EVALUATION: "Self-Evaluation Mode",
  VALIDATION: "Validation Mode",
};

export const EVALUATION_MODE_DESCRIPTIONS: Record<EvaluationMode, string> = {
  SELF_EVALUATION:
    "Enter accomplishments and factual details to determine a preliminary or proposed rating.",
  VALIDATION:
    "Review entered accomplishments, apply prescribed criteria, and determine or validate the appropriate rating.",
};

export const DIMENSION_LABELS: Record<string, string> = {
  QUALITY: "Quality",
  EFFICIENCY: "Efficiency",
  TIMELINESS: "Timeliness",
};

export { FUNCTION_CATEGORY_LABELS };
