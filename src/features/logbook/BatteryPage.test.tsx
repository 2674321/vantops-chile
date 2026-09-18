// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter } from "react-router-dom";
import { ToastProvider } from "../../components/toast/ToastProvider";
import { BatteryPage } from "./BatteryPage";
import {
  createBattery,
  deleteBattery,
  incrementCycles,
  listBatteries,
} from "../../storage/repositories/batteryRepository";

vi.mock("../../storage/repositories/batteryRepository", () => ({
  listBatteries: vi.fn(),
  createBattery: vi.fn(),
  deleteBattery: vi.fn(),
  incrementCycles: vi.fn(),
  updateBattery: vi.fn(),
}));

const listMock = listBatteries as unknown as Mock;
const createMock = createBattery as unknown as Mock;
const deleteMock = deleteBattery as unknown as Mock;
const cycleMock = incrementCycles as unknown as Mock;

const SAVED_BATTERY = {
  id: "bat-1",
  name: "Pack A",
  cycleCount: 4,
  createdAt: "2026-01-01T00:00:00.000Z",
};

function renderPage() {
  return render(
    <MemoryRouter>
      <ToastProvider>
        <BatteryPage />
      </ToastProvider>
    </MemoryRouter>
  );
}

beforeEach(() => {
  listMock.mockResolvedValue([]);
  createMock.mockResolvedValue(undefined);
  deleteMock.mockResolvedValue(undefined);
  cycleMock.mockResolvedValue(undefined);
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("BatteryPage", () => {
  it("shows the empty state", async () => {
    renderPage();
    expect(await screen.findByText("Sin baterías registradas")).toBeInTheDocument();
  });

  it("requires a name before creating a battery", async () => {
    renderPage();
    await screen.findByText("Sin baterías registradas");
    fireEvent.click(screen.getByRole("button", { name: "Nueva batería" }));
    const submitButtons = screen.getAllByRole("button", { name: "Nueva batería" });
    fireEvent.click(submitButtons[submitButtons.length - 1]);
    await waitFor(() => {
      expect(screen.getByText("Ingresa un nombre.")).toBeInTheDocument();
    });
    expect(createMock).not.toHaveBeenCalled();
  });

  it("creates a battery and confirms with a toast", async () => {
    renderPage();
    await screen.findByText("Sin baterías registradas");
    fireEvent.click(screen.getByRole("button", { name: "Nueva batería" }));
    fireEvent.change(screen.getByLabelText("Nombre"), {
      target: { value: "Pack A" },
    });
    const addButtons = screen.getAllByRole("button", { name: "Nueva batería" });
    fireEvent.click(addButtons[addButtons.length - 1]);
    await waitFor(() => {
      expect(createMock).toHaveBeenCalledWith({ name: "Pack A", notes: undefined });
    });
    expect(await screen.findByText("Batería creada")).toBeInTheDocument();
  });

  it("registers a cycle and reports it", async () => {
    listMock.mockResolvedValue([SAVED_BATTERY]);
    renderPage();
    await screen.findByText("Pack A");
    fireEvent.click(screen.getByRole("button", { name: "Registrar ciclo" }));
    await waitFor(() => {
      expect(cycleMock).toHaveBeenCalledWith("bat-1");
    });
    expect(await screen.findByText("Ciclo registrado")).toBeInTheDocument();
  });

  it("deletes a battery after inline confirmation", async () => {
    listMock.mockResolvedValue([SAVED_BATTERY]);
    renderPage();
    await screen.findByText("Pack A");
    fireEvent.click(screen.getByRole("button", { name: "Eliminar batería" }));
    fireEvent.click(screen.getByRole("button", { name: "Eliminar batería" }));
    await waitFor(() => {
      expect(deleteMock).toHaveBeenCalledWith("bat-1");
    });
    expect(await screen.findByText("Batería eliminada")).toBeInTheDocument();
  });

  it("shows an operation error toast when a cycle fails", async () => {
    listMock.mockResolvedValue([SAVED_BATTERY]);
    cycleMock.mockRejectedValue(new Error("idb"));
    renderPage();
    await screen.findByText("Pack A");
    fireEvent.click(screen.getByRole("button", { name: "Registrar ciclo" }));
    expect(
      await screen.findByText("No se pudo completar la operación con la batería.")
    ).toBeInTheDocument();
  });
});
