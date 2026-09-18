// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { useInstallPrompt } from "./useInstallPrompt";

interface FakePromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function makePromptEvent(
  outcome: "accepted" | "dismissed"
): FakePromptEvent {
  const event = new Event("beforeinstallprompt") as FakePromptEvent;
  event.prompt = vi.fn().mockResolvedValue(undefined);
  event.userChoice = Promise.resolve({ outcome });
  return event;
}

function setMatchMedia(standalone: boolean) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: standalone && query.includes("standalone"),
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

function Probe() {
  const { visible, canInstall, dismiss, promptInstall } = useInstallPrompt();
  return (
    <div>
      <span data-testid="visible">{String(visible)}</span>
      <span data-testid="canInstall">{String(canInstall)}</span>
      <button type="button" onClick={dismiss}>
        dismiss
      </button>
      <button type="button" onClick={() => void promptInstall()}>
        install
      </button>
    </div>
  );
}

beforeEach(() => {
  localStorage.clear();
  setMatchMedia(false);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("useInstallPrompt", () => {
  it("stays hidden without a beforeinstallprompt event", () => {
    render(<Probe />);
    expect(screen.getByTestId("visible")).toHaveTextContent("false");
    expect(screen.getByTestId("canInstall")).toHaveTextContent("false");
  });

  it("becomes visible after beforeinstallprompt", () => {
    render(<Probe />);
    act(() => {
      window.dispatchEvent(makePromptEvent("accepted"));
    });
    expect(screen.getByTestId("canInstall")).toHaveTextContent("true");
    expect(screen.getByTestId("visible")).toHaveTextContent("true");
  });

  it("hides the prompt after dismissal and persists the cooldown", () => {
    render(<Probe />);
    act(() => {
      window.dispatchEvent(makePromptEvent("accepted"));
    });
    fireEvent.click(screen.getByRole("button", { name: "dismiss" }));
    expect(screen.getByTestId("visible")).toHaveTextContent("false");
    expect(localStorage.getItem("vantops:installDismissedAt")).not.toBeNull();
  });

  it("stays hidden in standalone mode", () => {
    setMatchMedia(true);
    render(<Probe />);
    act(() => {
      window.dispatchEvent(makePromptEvent("accepted"));
    });
    expect(screen.getByTestId("visible")).toHaveTextContent("false");
  });

  it("resolves promptInstall according to the user's choice", async () => {
    const event = makePromptEvent("dismissed");
    render(<Probe />);
    act(() => {
      window.dispatchEvent(event);
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "install" }));
    });
    expect(event.prompt).toHaveBeenCalled();
    expect(screen.getByTestId("canInstall")).toHaveTextContent("false");
  });
});
