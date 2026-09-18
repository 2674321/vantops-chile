// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ToastProvider } from "../../components/toast/ToastProvider";
import { FlightForm } from "./FlightForm";
import { createFlight } from "../../storage/repositories/flightRepository";
import { listBatteries, markBatteryUsed } from "../../storage/repositories/batteryRepository";

vi.mock("../../storage/repositories/flightRepository", () => ({
  createFlight: vi.fn(),
  getFlight: vi.fn(),
  updateFlight: vi.fn(),
}));

vi.mock("../../storage/repositories/batteryRepository", () => ({
  listBatteries: vi.fn(),
  markBatteryUsed: vi.fn(),
}));

const createFlightMock = createFlight as unknown as Mock;
const listBatteriesMock = listBatteries as unknown as Mock;
const markBatteryUsedMock = markBatteryUsed as unknown as Mock;

function renderForm() {
  return render(
    <MemoryRouter initialEntries={["/bitacora/nuevo"]}>
      <ToastProvider>
        <Routes>
          <Route path="/bitacora/nuevo" element={<FlightForm />} />
          <Route path="/bitacora/:id" element={<p>detalle</p>} />
        </Routes>
      </ToastProvider>
    </MemoryRouter>
  );
}

function fillCoordinates(lat: string, lon: string) {
  fireEvent.change(screen.getByLabelText(/Latitud/), { target: { value: lat } });
  fireEvent.change(screen.getByLabelText(/Longitud/), { target: { value: lon } });
}

beforeEach(() => {
  listBatteriesMock.mockResolvedValue([]);
  createFlightMock.mockResolvedValue({ id: "flight-1" });
  markBatteryUsedMock.mockResolvedValue(undefined);
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("FlightForm", () => {
  it("shows inline errors and does not save with empty coordinates", async () => {
    renderForm();
    fireEvent.click(screen.getByRole("button", { name: "Guardar vuelo" }));
    await waitFor(() => {
      expect(screen.getByText(/Ingresa la latitud/)).toBeInTheDocument();
    });
    expect(createFlightMock).not.toHaveBeenCalled();
  });

  it("accepts explicit 0,0 as valid coordinates", async () => {
    renderForm();
    fillCoordinates("0", "0");
    fireEvent.click(screen.getByRole("button", { name: "Guardar vuelo" }));
    await waitFor(() => {
      expect(createFlightMock).toHaveBeenCalledTimes(1);
    });
    expect(createFlightMock.mock.calls[0][0].coordinate).toEqual({
      latitude: 0,
      longitude: 0,
    });
    expect(await screen.findByText("Vuelo registrado")).toBeInTheDocument();
  });

  it("rejects an end time before the start time", async () => {
    renderForm();
    fillCoordinates("-33.45", "-70.66");
    fireEvent.change(screen.getByLabelText("Fecha y hora de fin"), {
      target: { value: "2020-01-01T00:00" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Guardar vuelo" }));
    await waitFor(() => {
      expect(screen.getByText(/no puede ser anterior/)).toBeInTheDocument();
    });
    expect(createFlightMock).not.toHaveBeenCalled();
  });

  it("rejects a battery percentage out of range", async () => {
    listBatteriesMock.mockResolvedValue([
      { id: "bat-1", name: "Pack A", cycleCount: 3 },
    ]);
    renderForm();
    fillCoordinates("-33.45", "-70.66");
    const batterySelect = await screen.findByLabelText("Batería (opcional)");
    fireEvent.change(batterySelect, { target: { value: "bat-1" } });
    fireEvent.change(screen.getByLabelText("% Inicio"), {
      target: { value: "150" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Guardar vuelo" }));
    await waitFor(() => {
      expect(screen.getByText(/entre 0 y 100/)).toBeInTheDocument();
    });
    expect(createFlightMock).not.toHaveBeenCalled();
  });

  it("disables the submit button while saving", async () => {
    let resolveCreate: (value: { id: string }) => void = () => {};
    createFlightMock.mockImplementation(
      () =>
        new Promise<{ id: string }>((resolve) => {
          resolveCreate = resolve;
        })
    );
    renderForm();
    fillCoordinates("-33.45", "-70.66");
    fireEvent.click(screen.getByRole("button", { name: "Guardar vuelo" }));
    const savingButton = await screen.findByRole("button", { name: "Guardando…" });
    expect(savingButton).toBeDisabled();
    resolveCreate({ id: "flight-1" });
  });

  it("shows an error toast when storage fails", async () => {
    createFlightMock.mockRejectedValue(new Error("quota"));
    renderForm();
    fillCoordinates("-33.45", "-70.66");
    fireEvent.click(screen.getByRole("button", { name: "Guardar vuelo" }));
    expect(
      await screen.findByText("No se pudo guardar el vuelo. Intenta nuevamente.")
    ).toBeInTheDocument();
  });
});
