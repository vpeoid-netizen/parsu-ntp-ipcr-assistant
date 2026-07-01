import {
  addDays,
  format,
  isSaturday,
  isSunday,
  isWithinInterval,
  parseISO,
} from "date-fns";
import { d, type D } from "./decimal";

export interface Holiday {
  date: string; // ISO date string YYYY-MM-DD
  name: string;
}

/**
 * Calculate working-day difference between deadline and submission date.
 * Positive = early, Negative = late, Zero = on deadline.
 * Excludes weekends and configured holidays.
 */
export function calculateWorkingDayDifference(
  deadline: Date | string,
  submissionDate: Date | string,
  holidays: Holiday[] = []
): { difference: number; trace: { label: string; value: string }[] } {
  const trace: { label: string; value: string }[] = [];
  const deadlineDate = typeof deadline === "string" ? parseISO(deadline) : deadline;
  const submission = typeof submissionDate === "string" ? parseISO(submissionDate) : submissionDate;

  trace.push({
    label: "Deadline",
    value: format(deadlineDate, "yyyy-MM-dd (EEEE)"),
  });
  trace.push({
    label: "Submission date",
    value: format(submission, "yyyy-MM-dd (EEEE)"),
  });

  const holidayDates = new Set(holidays.map((h) => h.date));

  function isWorkingDay(date: Date): boolean {
    if (isSaturday(date) || isSunday(date)) return false;
    if (holidayDates.has(format(date, "yyyy-MM-dd"))) return false;
    return true;
  }

  function countWorkingDaysBetween(from: Date, to: Date): number {
    let count = 0;
    let current = new Date(from);
    const direction = from < to ? 1 : -1;

    while (
      (direction > 0 && current < to) ||
      (direction < 0 && current > to)
    ) {
      current = addDays(current, direction);
      if (isWorkingDay(current)) count += direction;
    }
    return count;
  }

  const diff = countWorkingDaysBetween(deadlineDate, submission);

  const direction =
    diff > 0 ? `${diff} working day(s) early` :
    diff < 0 ? `${Math.abs(diff)} working day(s) late` :
    "on deadline";

  trace.push({ label: "Working-day difference", value: direction });

  if (holidays.length > 0) {
    trace.push({
      label: "Holidays excluded",
      value: holidays.map((h) => `${h.date} (${h.name})`).join(", "),
    });
  }

  return { difference: diff, trace };
}

/**
 * Map working-day difference to timeliness rating (5-to-1 scale).
 */
export function workingDayDifferenceToRating(diff: number): D {
  if (diff >= 3) return d(5);
  if (diff >= 1) return d(4);
  if (diff === 0) return d(3);
  if (diff >= -2) return d(2);
  return d(1);
}

/**
 * Full timeliness rating computation.
 */
export function computeTimelinessRating(
  deadline: Date | string,
  submissionDate: Date | string,
  holidays: Holiday[] = []
): { rating: D; difference: number; trace: { label: string; value: string }[] } {
  const { difference, trace } = calculateWorkingDayDifference(deadline, submissionDate, holidays);
  const rating = workingDayDifferenceToRating(difference);
  trace.push({
    label: "Timeliness rating",
    value: rating.toFixed(1),
    detail: getTimelinessBandDescription(difference),
  } as { label: string; value: string });
  return { rating, difference, trace };
}

function getTimelinessBandDescription(diff: number): string {
  if (diff >= 3) return "At least 3 working days early → 5";
  if (diff >= 1) return "1–2 working days early → 4";
  if (diff === 0) return "On deadline → 3";
  if (diff >= -2) return "1–2 working days late → 2";
  return "At least 3 working days late → 1";
}

/**
 * Validate teaching effectiveness rating (1.00–5.00).
 */
export function validateTeachingRating(value: number): { valid: boolean; rating: D; message?: string } {
  if (value < 1 || value > 5) {
    return { valid: false, rating: d(0), message: "Teaching evaluation rating must be between 1.00 and 5.00" };
  }
  return { valid: true, rating: d(value) };
}
