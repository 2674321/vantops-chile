import { describe, it, expect } from "vitest";
import { useOnlineStatus } from "./useOnlineStatus";

describe("useOnlineStatus", () => {
  it("exports a function", () => {
    expect(typeof useOnlineStatus).toBe("function");
  });
});
