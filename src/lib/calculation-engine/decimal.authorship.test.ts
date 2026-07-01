import { describe, expect, it } from "vitest";
import { allocateAuthorship, d, round } from "./decimal";

describe("allocateAuthorship", () => {
  it("awards 1.2 to main author and 0.4 each to co-authors for 2-point output in group of 3", () => {
    const raw = d(2);
    const main = allocateAuthorship(raw, true, 3);
    expect(round(main.allocated).toNumber()).toBe(1.2);

    const co = allocateAuthorship(raw, false, 3);
    expect(round(co.allocated).toNumber()).toBe(0.4);
  });

  it("awards full points to sole author", () => {
    const raw = d(2);
    const sole = allocateAuthorship(raw, true, 1);
    expect(round(sole.allocated).toNumber()).toBe(2);
  });
});
