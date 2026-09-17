import { describe, it, expect } from "vitest";
import {
  INSTALL_DISMISS_COOLDOWN_MS,
  isStandaloneMode,
  shouldShowInstallPrompt,
  parseDismissedAt,
} from "./pwaInstall";

describe("isStandaloneMode", () => {
  it("is true when either signal is true", () => {
    expect(isStandaloneMode(true, false)).toBe(true);
    expect(isStandaloneMode(false, true)).toBe(true);
  });

  it("is false when both signals are false", () => {
    expect(isStandaloneMode(false, false)).toBe(false);
  });
});

describe("shouldShowInstallPrompt", () => {
  const base = { canInstall: true, isStandalone: false, dismissedAt: null };

  it("shows when installable, not standalone and not dismissed", () => {
    expect(shouldShowInstallPrompt(base, 1000)).toBe(true);
  });

  it("never shows when already installed (standalone)", () => {
    expect(shouldShowInstallPrompt({ ...base, isStandalone: true }, 1000)).toBe(false);
  });

  it("does not show without a captured install event", () => {
    expect(shouldShowInstallPrompt({ ...base, canInstall: false }, 1000)).toBe(false);
  });

  it("respects the dismissal cooldown", () => {
    const dismissedAt = 1_000_000;
    expect(
      shouldShowInstallPrompt({ ...base, dismissedAt }, dismissedAt + 1000)
    ).toBe(false);
  });

  it("shows again after the cooldown elapses", () => {
    const dismissedAt = 1_000_000;
    expect(
      shouldShowInstallPrompt(
        { ...base, dismissedAt },
        dismissedAt + INSTALL_DISMISS_COOLDOWN_MS + 1
      )
    ).toBe(true);
  });
});

describe("parseDismissedAt", () => {
  it("returns null for missing or invalid values", () => {
    expect(parseDismissedAt(null)).toBeNull();
    expect(parseDismissedAt("not-a-number")).toBeNull();
  });

  it("parses a numeric timestamp", () => {
    expect(parseDismissedAt("1700000000000")).toBe(1700000000000);
  });
});
