import { describe, expect, it } from "vitest";
import {
  computeDeliverableComposite,
  hasDeliverableRatingInput,
} from "./deliverable-rating";

describe("deliverable rating dimensions", () => {
  it("averages only applicable dimensions", () => {
    const composite = computeDeliverableComposite({
      qualityRating: 5,
      efficiencyRating: 1,
      timelinessRating: 1,
      qualityApplicable: true,
      efficiencyApplicable: false,
      timelinessApplicable: false,
    });
    expect(composite).toBe(5);
  });

  it("requires at least one applicable rated dimension", () => {
    expect(
      hasDeliverableRatingInput({
        qualityRating: 5,
        qualityApplicable: false,
        efficiencyApplicable: false,
        timelinessApplicable: false,
      })
    ).toBe(false);
  });

  it("defaults missing applicability flags to applicable", () => {
    const composite = computeDeliverableComposite({
      qualityRating: 4,
      efficiencyRating: 2,
      timelinessRating: 3,
    });
    expect(composite).toBeCloseTo(3, 3);
  });
});
