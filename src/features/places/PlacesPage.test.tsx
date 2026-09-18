// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter } from "react-router-dom";
import { ToastProvider } from "../../components/toast/ToastProvider";
import { PlacesPage } from "./PlacesPage";
import {
  createPlace,
  deletePlace,
  listPlaces,
  updatePlace,
} from "../../storage/repositories/placeRepository";

vi.mock("../../storage/repositories/placeRepository", () => ({
  listPlaces: vi.fn(),
  createPlace: vi.fn(),
  deletePlace: vi.fn(),
  updatePlace: vi.fn(),
}));

const listMock = listPlaces as unknown as Mock;
const createMock = createPlace as unknown as Mock;
const deleteMock = deletePlace as unknown as Mock;
const updateMock = updatePlace as unknown as Mock;

const SAVED_PLACE = {
  id: "place-1",
  name: "Aeródromo Tobalaba",
  favorite: false,
  coordinate: { latitude: -33.45, longitude: -70.66 },
};

function renderPage() {
  return render(
    <MemoryRouter>
      <ToastProvider>
        <PlacesPage />
      </ToastProvider>
    </MemoryRouter>
  );
}

beforeEach(() => {
  listMock.mockResolvedValue([]);
  createMock.mockResolvedValue(undefined);
  deleteMock.mockResolvedValue(undefined);
  updateMock.mockResolvedValue(undefined);
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("PlacesPage", () => {
  it("shows the empty state", async () => {
    renderPage();
    expect(await screen.findByText("Sin lugares guardados")).toBeInTheDocument();
  });

  it("validates name and coordinates before saving", async () => {
    renderPage();
    await screen.findByText("Sin lugares guardados");
    fireEvent.click(screen.getByRole("button", { name: "Nuevo lugar" }));
    const submitButtons = screen.getAllByRole("button", { name: "Nuevo lugar" });
    fireEvent.click(submitButtons[submitButtons.length - 1]);
    await waitFor(() => {
      expect(screen.getByText("Ingresa un nombre.")).toBeInTheDocument();
    });
    expect(createMock).not.toHaveBeenCalled();
  });

  it("creates a place and confirms with a toast", async () => {
    renderPage();
    await screen.findByText("Sin lugares guardados");
    fireEvent.click(screen.getByRole("button", { name: "Nuevo lugar" }));
    const addButtons = screen.getAllByRole("button", { name: "Nuevo lugar" });
    fireEvent.change(screen.getByLabelText("Nombre"), {
      target: { value: "Mi sitio" },
    });
    fireEvent.change(screen.getByLabelText(/Latitud/), {
      target: { value: "-33.45" },
    });
    fireEvent.change(screen.getByLabelText(/Longitud/), {
      target: { value: "-70.66" },
    });
    fireEvent.click(addButtons[addButtons.length - 1]);
    await waitFor(() => {
      expect(createMock).toHaveBeenCalledTimes(1);
    });
    expect(await screen.findByText("Lugar guardado")).toBeInTheDocument();
  });

  it("toggles a favorite and reports it", async () => {
    listMock.mockResolvedValue([SAVED_PLACE]);
    renderPage();
    await screen.findByText("Aeródromo Tobalaba");
    fireEvent.click(screen.getByRole("button", { name: "Añadido a favoritos" }));
    await waitFor(() => {
      expect(updateMock).toHaveBeenCalledWith("place-1", { favorite: true });
    });
    expect(await screen.findByText("Añadido a favoritos")).toBeInTheDocument();
  });

  it("deletes a place after inline confirmation", async () => {
    listMock.mockResolvedValue([SAVED_PLACE]);
    renderPage();
    await screen.findByText("Aeródromo Tobalaba");
    fireEvent.click(screen.getByRole("button", { name: "Eliminar lugar" }));
    fireEvent.click(screen.getByRole("button", { name: "Eliminar lugar" }));
    await waitFor(() => {
      expect(deleteMock).toHaveBeenCalledWith("place-1");
    });
    expect(await screen.findByText("Lugar eliminado")).toBeInTheDocument();
  });

  it("shows a toast when loading fails", async () => {
    listMock.mockRejectedValue(new Error("idb"));
    renderPage();
    expect(
      await screen.findByText("No se pudieron cargar los datos en este dispositivo.")
    ).toBeInTheDocument();
  });
});
