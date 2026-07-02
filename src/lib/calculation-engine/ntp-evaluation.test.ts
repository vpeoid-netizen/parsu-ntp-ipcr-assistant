import { describe, expect, it } from "vitest";
import {
  computeBaseIpcrNtp,
  computeFinalIpcrNtp,
  computeNtpEvaluation,
} from "./ntp-evaluation";

describe("computeBaseIpcrNtp", () => {
  it("computes weighted base IPCR for admin staff categories", () => {
    const result = computeBaseIpcrNtp(
      { CORE: 0.5, STRATEGIC: 0.2, SUPPORT: 0.2, OTHER: 0.1 },
      { CORE: 4, STRATEGIC: 3, SUPPORT: 5, OTHER: 4 }
    );
    // 4×0.5 + 3×0.2 + 5×0.2 + 4×0.1 = 2 + 0.6 + 1 + 0.4 = 4.0
    expect(result.rating.toNumber()).toBeCloseTo(4, 3);
  });

  it("includes passenger feedback for drivers", () => {
    const result = computeBaseIpcrNtp(
      { CORE: 0.5, SUPPORT: 0.1, OTHER: 0.2, PASSENGER_FEEDBACK: 0.2 },
      { CORE: 4, SUPPORT: 3, OTHER: 4 },
      5
    );
    // 4×0.5 + 3×0.1 + 4×0.2 + 5×0.2 = 2 + 0.3 + 0.8 + 1 = 4.1
    expect(result.rating.toNumber()).toBeCloseTo(4.1, 3);
  });
});

describe("computeFinalIpcrNtp", () => {
  it("returns base IPCR unchanged when no designation", () => {
    const result = computeFinalIpcrNtp(4, 5, false);
    expect(result.rating.toNumber()).toBeCloseTo(4, 3);
  });

  it("applies 70/30 weighting when designation is enabled", () => {
    const result = computeFinalIpcrNtp(4, 5, true);
    // 4×0.7 + 5×0.3 = 2.8 + 1.5 = 4.3
    expect(result.rating.toNumber()).toBeCloseTo(4.3, 3);
  });

  it("applies 70/30 even when designation rating is zero", () => {
    const result = computeFinalIpcrNtp(4, 0, true);
    expect(result.rating.toNumber()).toBeCloseTo(2.8, 3);
  });
});

describe("computeNtpEvaluation", () => {
  it("averages designation deliverable composites for designation rating", () => {
    const result = computeNtpEvaluation({
      personnelCategory: "ADMIN_STAFF",
      functionWeights: { CORE: 0.5, STRATEGIC: 0.2, SUPPORT: 0.2, OTHER: 0.1 },
      functionRatings: { CORE: 4, STRATEGIC: 3, SUPPORT: 5, OTHER: 4 },
      hasDesignation: true,
      designationDeliverables: [
        { qualityRating: 5, efficiencyRating: 5, timelinessRating: 5 },
        { qualityRating: 3, efficiencyRating: 3, timelinessRating: 3 },
      ],
    });

    expect(result.baseIpcr.rating).toBeCloseTo(4, 3);
    expect(result.designationRating.rating).toBeCloseTo(4, 3);
    expect(result.finalIpcr.rating).toBeCloseTo(4 * 0.7 + 4 * 0.3, 3);
  });
});
