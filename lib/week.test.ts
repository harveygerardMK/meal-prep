import { describe, expect, it } from "vitest";
import {
  dinnerSlotDate,
  resolveDinnerFocus,
  weekStartISO,
  weekdayShort,
} from "./week";

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

describe("dinnerSlotDate", () => {
  it("maps index 0 to the Monday of weekOf", () => {
    const monday = dinnerSlotDate("2026-07-13", 0);
    expect(monday.getFullYear()).toBe(2026);
    expect(monday.getMonth()).toBe(6);
    expect(monday.getDate()).toBe(13);
    expect(weekdayShort(monday)).toMatch(/Mon/);
  });

  it("maps later indexes to later weekdays", () => {
    const wednesday = dinnerSlotDate("2026-07-13", 2);
    expect(wednesday.getDate()).toBe(15);
  });
});

describe("resolveDinnerFocus", () => {
  it("returns tonight when today matches a dinner slot", () => {
    const focus = resolveDinnerFocus(
      "2026-07-13",
      4,
      new Date(2026, 6, 15, 17, 0, 0)
    );
    expect(focus?.index).toBe(2);
    expect(focus?.kind).toBe("tonight");
  });

  it("returns the next upcoming slot when today has no dinner", () => {
    // Sunday after a Mon–Thu dinner week
    const focus = resolveDinnerFocus(
      "2026-07-13",
      4,
      new Date(2026, 6, 12, 10, 0, 0)
    );
    expect(focus?.kind).toBe("up_next");
    expect(focus?.index).toBe(0);
  });
});
