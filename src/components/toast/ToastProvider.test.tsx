// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { ToastProvider } from "./ToastProvider";
import { useToast } from "./useToast";

function Harness() {
  const toast = useToast();
  return (
    <div>
      <button type="button" onClick={() => toast.success("Guardado")}>
        success
      </button>
      <button type="button" onClick={() => toast.error("Fallo inesperado")}>
        error
      </button>
      <button
        type="button"
        onClick={() => {
          toast.info("Uno");
          toast.info("Dos");
          toast.info("Tres");
          toast.info("Cuatro");
        }}
      >
        many
      </button>
      <button
        type="button"
        onClick={() => {
          toast.warning("Duplicado");
          toast.warning("Duplicado");
        }}
      >
        duplicate
      </button>
    </div>
  );
}

function renderHarness() {
  return render(
    <ToastProvider>
      <Harness />
    </ToastProvider>
  );
}

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("ToastProvider", () => {
  it("renders a success toast with a polite live region", () => {
    renderHarness();
    fireEvent.click(screen.getByRole("button", { name: "success" }));
    const toast = screen.getByText("Guardado").closest("[role]");
    expect(toast).toHaveAttribute("role", "status");
    expect(toast).toHaveAttribute("aria-live", "polite");
  });

  it("renders an error toast with an assertive alert role", () => {
    renderHarness();
    fireEvent.click(screen.getByRole("button", { name: "error" }));
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Fallo inesperado");
    expect(alert).toHaveAttribute("aria-live", "assertive");
  });

  it("dismisses a toast manually", () => {
    renderHarness();
    fireEvent.click(screen.getByRole("button", { name: "success" }));
    expect(screen.getByText("Guardado")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cerrar notificación" }));
    expect(screen.queryByText("Guardado")).not.toBeInTheDocument();
  });

  it("autodismisses a success toast after its duration", () => {
    vi.useFakeTimers();
    renderHarness();
    fireEvent.click(screen.getByRole("button", { name: "success" }));
    expect(screen.getByText("Guardado")).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(3600);
    });
    expect(screen.queryByText("Guardado")).not.toBeInTheDocument();
  });

  it("keeps at most three visible toasts", () => {
    renderHarness();
    fireEvent.click(screen.getByRole("button", { name: "many" }));
    expect(screen.queryByText("Uno")).not.toBeInTheDocument();
    expect(screen.getByText("Dos")).toBeInTheDocument();
    expect(screen.getByText("Tres")).toBeInTheDocument();
    expect(screen.getByText("Cuatro")).toBeInTheDocument();
  });

  it("deduplicates identical messages in the same window", () => {
    renderHarness();
    fireEvent.click(screen.getByRole("button", { name: "duplicate" }));
    expect(screen.getAllByText("Duplicado")).toHaveLength(1);
  });

  it("throws when useToast is used outside the provider", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Harness />)).toThrow(/ToastProvider/);
    consoleError.mockRestore();
  });
});
