import { describe, expect, it } from "vitest";
import { weekStartISO } from "./week";

describe("weekStartISO", () => {
  it("returns the Monday of the week for a mid-week date", () => {
    // Wednesday 15 July 2026 local
    const date = new Date(2026, 6, 15, 12, 0, 0);
    expect(weekStartISO(date)).toBe("2026-07-13");
  });

  it("keeps Monday as Monday", () => {
    const monday = new Date(2026, 6, 13, 15, 30, 0);
    expect(weekStartISO(monday)).toBe("2026-07-13");
  });

  it("uses the local calendar date at local midnight", () => {
    const mondayMidnight = new Date(2026, 6, 13, 0, 0, 0, 0);
    expect(weekStartISO(mondayMidnight)).toBe("2026-07-13");
  });

  it("treats Sunday as the end of the prior Monday-started week", () => {
    const sunday = new Date(2026, 6, 19, 18, 0, 0);
    expect(weekStartISO(sunday)).toBe("2026-07-13");
  });
});
