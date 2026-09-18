import { describe, it, expect } from "vitest";
import { detectReconnection } from "./connectivity";

describe("detectReconnection", () => {
  it("does not fire on first render while already online", () => {
    expect(detectReconnection(null, true)).toBe(false);
  });

  it("does not fire on first render while offline", () => {
    expect(detectReconnection(null, false)).toBe(false);
  });

  it("does not fire while staying online", () => {
    expect(detectReconnection(true, true)).toBe(false);
  });

  it("does not fire when going offline", () => {
    expect(detectReconnection(true, false)).toBe(false);
  });

  it("fires only on a real offline to online transition", () => {
    expect(detectReconnection(false, true)).toBe(true);
  });
});
