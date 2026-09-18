// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter } from "react-router-dom";
import { ToastProvider } from "../../components/toast/ToastProvider";
import { SettingsPage } from "./SettingsPage";
import { loadFlightLimits, saveFlightLimits } from "../../storage/settings";

vi.mock("../../storage/settings", () => ({
  loadFlightLimits: vi.fn(),
  saveFlightLimits: vi.fn(),
}));

const loadLimitsMock = loadFlightLimits as unknown as Mock;
const saveLimitsMock = saveFlightLimits as unknown as Mock;

function renderPage() {
  return render(
    <MemoryRouter>
      <ToastProvider>
        <SettingsPage />
      </ToastProvider>
    </MemoryRouter>
  );
}

beforeEach(() => {
  loadLimitsMock.mockResolvedValue({});
  saveLimitsMock.mockResolvedValue(undefined);
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("SettingsPage", () => {
  it("loads stored limits into the form", async () => {
    loadLimitsMock.mockResolvedValue({ windMaxKmh: 25, temperatureMaxC: 32 });
    renderPage();
    const wind = await screen.findByLabelText("Viento máximo (10 m)");
    expect(wind).toHaveValue("25");
    expect(screen.getByLabelText("Temperatura máxima")).toHaveValue("32");
  });

  it("saves parsed limits and confirms with a toast", async () => {
    renderPage();
    const wind = await screen.findByLabelText("Viento máximo (10 m)");
    fireEvent.change(wind, { target: { value: "30" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar límites" }));
    await waitFor(() => {
      expect(saveLimitsMock).toHaveBeenCalledWith({ windMaxKmh: 30 });
    });
    expect(await screen.findByText("Límites guardados")).toBeInTheDocument();
  });

  it("rejects an inverted temperature range", async () => {
    renderPage();
    const min = await screen.findByLabelText("Temperatura mínima");
    fireEvent.change(min, { target: { value: "40" } });
    fireEvent.change(screen.getByLabelText("Temperatura máxima"), {
      target: { value: "10" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Guardar límites" }));
    await waitFor(() => {
      expect(
        screen.getByText("La temperatura mínima debe ser menor que la máxima.")
      ).toBeInTheDocument();
    });
    expect(saveLimitsMock).not.toHaveBeenCalled();
  });

  it("clears all limits after an inline confirmation", async () => {
    loadLimitsMock.mockResolvedValue({ windMaxKmh: 25 });
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: "Borrar todo" }));
    expect(
      screen.getByText("¿Borrar todos los límites operacionales guardados?")
    ).toBeInTheDocument();
    const confirmButtons = screen.getAllByRole("button", {
      name: "Borrar todo",
    });
    fireEvent.click(confirmButtons[confirmButtons.length - 1]);
    await waitFor(() => {
      expect(saveLimitsMock).toHaveBeenCalledWith({});
    });
    expect(await screen.findByText("Límites eliminados")).toBeInTheDocument();
  });

  it("shows an inline error when persistence fails", async () => {
    saveLimitsMock.mockRejectedValue(new Error("quota"));
    renderPage();
    await screen.findByLabelText("Viento máximo (10 m)");
    fireEvent.click(screen.getByRole("button", { name: "Guardar límites" }));
    expect(
      await screen.findByText("No se pudieron guardar los límites en este dispositivo.")
    ).toBeInTheDocument();
  });

  it("disables the save button while persisting", async () => {
    let resolveSave: () => void = () => {};
    saveLimitsMock.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveSave = resolve;
        })
    );
    renderPage();
    await screen.findByLabelText("Viento máximo (10 m)");
    fireEvent.click(screen.getByRole("button", { name: "Guardar límites" }));
    const pending = await screen.findByRole("button", { name: "Guardando…" });
    expect(pending).toBeDisabled();
    resolveSave();
  });
});
