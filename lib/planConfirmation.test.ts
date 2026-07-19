import { describe, expect, it } from "vitest";
import {
  clearConfirmation,
  markPlanConfirmed,
  withConfirmationDefaults,
} from "./planGenerator";
import type { WeekPlan } from "./types";

const basePlan: WeekPlan = {
  weekOf: "2026-07-13",
  dinners: ["dinner-1"],
  girlLunch: "girl-lunch-1",
  boyLunch: "boy-lunch-1",
  locks: { dinners: [null], girlLunch: null, boyLunch: null },
};

describe("plan confirmation helpers", () => {
  it("defaults legacy plans without confirmation fields to unconfirmed", () => {
    expect(withConfirmationDefaults(basePlan)).toEqual({
      ...basePlan,
      confirmed: false,
    });
  });

  it("marks a plan confirmed at the supplied ISO timestamp", () => {
    const confirmedAt = "2026-07-19T18:00:00.000Z";

    expect(markPlanConfirmed(basePlan, confirmedAt)).toEqual({
      ...basePlan,
      confirmed: true,
      confirmedAt,
    });
  });

  it("clears an existing confirmation", () => {
    expect(
      clearConfirmation({
        ...basePlan,
        confirmed: true,
        confirmedAt: "2026-07-19T18:00:00.000Z",
      })
    ).toEqual({
      ...basePlan,
      confirmed: false,
    });
  });
});
