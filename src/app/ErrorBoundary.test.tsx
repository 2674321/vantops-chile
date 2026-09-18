// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { ErrorBoundary } from "./ErrorBoundary";

function Boom(): never {
  throw new Error("detalle tecnico interno");
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("ErrorBoundary", () => {
  it("renders the accessible fallback when a child throws", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Algo salió mal");
    expect(
      screen.getByRole("button", { name: "Recargar" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Volver al inicio" })
    ).toBeInTheDocument();
  });

  it("hides technical details outside development", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubEnv("DEV", false);
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>
    );
    expect(screen.queryByText("detalle tecnico interno")).not.toBeInTheDocument();
  });

  it("renders children when there is no error", () => {
    render(
      <ErrorBoundary>
        <p>contenido</p>
      </ErrorBoundary>
    );
    expect(screen.getByText("contenido")).toBeInTheDocument();
  });

  it("reloads the page when Recargar is pressed", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const reload = vi.fn();
    const original = window.location.reload;
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...window.location, reload, hash: "" },
    });
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>
    );
    fireEvent.click(screen.getByRole("button", { name: "Recargar" }));
    expect(reload).toHaveBeenCalledTimes(1);
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...window.location, reload: original },
    });
  });
});
