// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
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

beforeEach(() => {
  listBatteriesMock.mockResolvedValue([]);
  createFlightMock.mockResolvedValue({ id: "flight-1" });
  markBatteryUsedMock.mockResolvedValue(undefined);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("a11y regression: validación anunciada", () => {
  it("inputs inválidos llevan aria-invalid y aria-describedby hacia el mensaje", () => {
    renderForm();
    fireEvent.change(screen.getByLabelText(/Latitud/), {
      target: { value: "-33.45" },
    });
    fireEvent.change(screen.getByLabelText(/Longitud/), {
      target: { value: "-70.66" },
    });
    fireEvent.change(screen.getByLabelText("Fecha y hora de fin"), {
      target: { value: "2020-01-01T00:00" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Guardar vuelo" }));

    expect(screen.getByText(/no puede ser anterior/)).toBeInTheDocument();

    const timesInput = screen.getByLabelText(/Fecha y hora de inicio/);
    expect(timesInput).toHaveAttribute("aria-invalid", "true");
    const referenced = document.getElementById(
      timesInput.getAttribute("aria-describedby") ?? ""
    );
    expect(referenced).not.toBeNull();
    expect(referenced).toHaveAttribute("role", "alert");
    expect(referenced).toHaveAttribute("id", "flight-times-error");
    expect(referenced).toHaveTextContent(/no puede ser anterior/);
  });

  it("el mensaje de error de coordenadas está asociado por aria-describedby", () => {
    renderForm();
    fireEvent.click(screen.getByRole("button", { name: "Guardar vuelo" }));

    const latInput = screen.getByLabelText(/Latitud/);
    expect(latInput).toHaveAttribute("aria-invalid", "true");
    const latError = document.getElementById(
      latInput.getAttribute("aria-describedby") ?? ""
    );
    expect(latError).not.toBeNull();
    expect(latError).toHaveAttribute("role", "alert");
  });

  it("las horas de inicio quedan vinculadas por label (nombre accesible)", () => {
    renderForm();
    expect(
      screen.getByLabelText(/Fecha y hora de inicio/).getAttribute("id")
    ).not.toBeNull();
  });
});