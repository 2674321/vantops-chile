// @vitest-environment jsdom
import "fake-indexeddb/auto";
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "../../../components/toast/ToastProvider";
import { getDB, resetDB } from "../../../storage/db";
import * as mapRepository from "../../../storage/repositories/operationalMapRepository";
import { listPlaces } from "../../../storage/repositories/placeRepository";
import { OperationalMapPage, parseOperationalPanelTab } from "./OperationalMapPage";

vi.mock("./OperationalMapCanvas", () => ({ default: ({ onMapPick, onMoveZone, onMovePin }: { onMapPick: (point: { latitude: number; longitude: number }) => void; onMoveZone?: (id: string, point: { latitude: number; longitude: number }) => void; onMovePin?: (id: string, point: { latitude: number; longitude: number }) => void }) => <div data-testid="map-canvas">Mapa<button type="button" onClick={() => onMapPick({ latitude: -32, longitude: -71 })}>Punto mapa</button><button type="button" onClick={() => onMoveZone?.("zone-test", { latitude: -31, longitude: -70 })}>Mover radio simulado</button><button type="button" onClick={() => onMovePin?.("pin-test", { latitude: -30, longitude: -69 })}>Mover pin simulado</button></div> }));

beforeEach(async () => {
  localStorage.clear();
  resetDB();
  await getDB().delete();
  resetDB();
  vi.restoreAllMocks();
});

afterEach(() => cleanup());

describe("OperationalMapPage", () => {
  it("parses supported deep-linked panels safely", () => {
    expect(parseOperationalPanelTab("pines")).toBe("pines");
    expect(parseOperationalPanelTab("unknown")).toBe("ubicacion");
  });

  it("creates multiple zones and persists the map", async () => {
    render(<MemoryRouter><ToastProvider><OperationalMapPage /></ToastProvider></MemoryRouter>);
    expect(await screen.findByTestId("map-canvas", {}, { timeout: 5000 })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("tab", { name: "Radios" }));
    await userEvent.click(screen.getByRole("button", { name: "Añadir radio" }));
    await userEvent.click(screen.getByRole("button", { name: "250 m" }));
    expect(screen.getAllByText(/Radio/).length).toBeGreaterThanOrEqual(2);
    await userEvent.click(screen.getByRole("tab", { name: "Lugar" }));
    await userEvent.clear(screen.getByLabelText("Nombre del mapa"));
    await userEvent.type(screen.getByLabelText("Nombre del mapa"), "Mapa QA público");
    await userEvent.click(screen.getByRole("button", { name: "Guardar ahora" }));
    await waitFor(async () => expect(await mapRepository.listOperationalMaps()).toHaveLength(1));
    expect((await mapRepository.listOperationalMaps())[0]).toMatchObject({ name: "Mapa QA público", zones: [{ radiusMeters: 500 }, { radiusMeters: 250 }] });
  }, 10_000);

  it("adds a custom radius and a persistent pin", async () => {
    render(<MemoryRouter><ToastProvider><OperationalMapPage /></ToastProvider></MemoryRouter>);
    await screen.findByTestId("map-canvas", {}, { timeout: 5000 });
    await userEvent.click(screen.getByRole("tab", { name: "Radios" }));
    await userEvent.clear(screen.getByLabelText("Radio personalizado en metros"));
    await userEvent.type(screen.getByLabelText("Radio personalizado en metros"), "1350");
    await userEvent.click(screen.getByRole("button", { name: "Añadir radio personalizado" }));
    await userEvent.click(screen.getByRole("button", { name: "Pin" }));
    await userEvent.click(screen.getByRole("button", { name: "Punto mapa" }));
    await userEvent.click(screen.getByRole("tab", { name: "Lugar" }));
    await userEvent.click(screen.getByRole("button", { name: "Guardar ahora" }));
    await waitFor(async () => expect(await mapRepository.listOperationalMaps()).toHaveLength(1));
    const storedMap = (await mapRepository.listOperationalMaps())[0];
    const storedPins = await listPlaces();
    expect(storedMap).toMatchObject({ zones: [{ radiusMeters: 1350 }], pinnedPlaceIds: [storedPins[0].id] });
    expect(storedPins[0]).toMatchObject({ coordinate: { latitude: -32, longitude: -71 } });
  }, 10_000);

  it("rejects a partial numeric radius instead of parsing its prefix", async () => {
    render(<MemoryRouter><ToastProvider><OperationalMapPage /></ToastProvider></MemoryRouter>);
    await screen.findByTestId("map-canvas");
    await userEvent.click(screen.getByRole("tab", { name: "Radios" }));
    await userEvent.click(screen.getByRole("button", { name: "Añadir radio" }));
    const radius = screen.getByLabelText("Radio en metros");
    await userEvent.clear(radius);
    await userEvent.type(radius, "500abc");
    await userEvent.tab();
    expect(screen.getByRole("alert")).toHaveTextContent("Radio válido");
    expect(radius).toHaveValue("500");
  });

  it("does not recenter the selected coordinate while measuring", async () => {
    render(<MemoryRouter><ToastProvider><OperationalMapPage /></ToastProvider></MemoryRouter>);
    await screen.findByTestId("map-canvas");
    expect(screen.getByLabelText("Latitud WGS84")).toHaveValue("-33.4489");
    await userEvent.click(screen.getByRole("button", { name: "Medir" }));
    await userEvent.click(screen.getByRole("button", { name: "Punto mapa" }));
    expect(screen.getByLabelText("Latitud WGS84")).toHaveValue("-33.4489");
  });

  it("keeps the draft and reports a storage write failure", async () => {
    vi.spyOn(mapRepository, "saveOperationalMap").mockRejectedValue(new DOMException("Cuota", "QuotaExceededError"));
    render(<MemoryRouter><ToastProvider><OperationalMapPage /></ToastProvider></MemoryRouter>);
    await screen.findByTestId("map-canvas");
    await userEvent.clear(screen.getByLabelText("Nombre del mapa"));
    await userEvent.type(screen.getByLabelText("Nombre del mapa"), "Borrador recuperable");
    await userEvent.click(screen.getByRole("button", { name: "Guardar ahora" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Cuota");
    expect(screen.getByLabelText("Nombre del mapa")).toHaveValue("Borrador recuperable");
    expect(screen.getByRole("button", { name: "Copiar borrador JSON" })).toBeInTheDocument();
  });

  it("flushes edits before switching saved maps without a confirmation reload", async () => {
    const now = new Date().toISOString();
    await mapRepository.saveOperationalMap({ id: "map-a", schemaVersion: 1, name: "Mapa A", zones: [], createdAt: now, updatedAt: "2026-11-15T12:00:00.000Z" });
    await mapRepository.saveOperationalMap({ id: "map-b", schemaVersion: 1, name: "Mapa B", zones: [], createdAt: now, updatedAt: "2026-11-15T11:00:00.000Z" });
    const confirmSpy = vi.spyOn(window, "confirm");
    render(<MemoryRouter><ToastProvider><OperationalMapPage /></ToastProvider></MemoryRouter>);
    await waitFor(() => expect(screen.getByLabelText("Nombre del mapa")).toHaveValue("Mapa A"));
    await userEvent.clear(screen.getByLabelText("Nombre del mapa"));
    await userEvent.type(screen.getByLabelText("Nombre del mapa"), "Mapa A editado");
    await userEvent.selectOptions(screen.getByLabelText("Abrir mapa guardado"), "map-b");
    await waitFor(() => expect(screen.getByLabelText("Nombre del mapa")).toHaveValue("Mapa B"));
    expect(confirmSpy).not.toHaveBeenCalled();
    expect(await mapRepository.getOperationalMap("map-a")).toMatchObject({ name: "Mapa A editado" });
  });

  it("saves an edited zone before sending it to a preparation", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<MemoryRouter initialEntries={["/utilidades/mapa"]}><ToastProvider><Routes><Route path="/utilidades/mapa" element={<OperationalMapPage />} /><Route path="/operacion/nueva" element={<h1>Preparación segura</h1>} /></Routes></ToastProvider></MemoryRouter>);
    await screen.findByTestId("map-canvas");
    await userEvent.click(screen.getByRole("tab", { name: "Radios" }));
    await userEvent.click(screen.getByRole("button", { name: "Añadir radio" }));
    await userEvent.clear(screen.getByLabelText("Radio en metros"));
    await userEvent.type(screen.getByLabelText("Radio en metros"), "750");
    await userEvent.tab();
    await userEvent.click(screen.getByRole("button", { name: "Usar en nueva preparación" }));
    expect(await screen.findByRole("heading", { name: "Preparación segura" })).toBeInTheDocument();
    expect((await mapRepository.listOperationalMaps())[0].zones[0].radiusMeters).toBe(750);
  });

  it("uses a synthetic geolocation fixture and reports its accuracy", async () => {
    Object.defineProperty(navigator, "geolocation", { configurable: true, value: { getCurrentPosition: (success: PositionCallback) => success({ coords: { latitude: -33.0472, longitude: -71.6127, accuracy: 12 } } as GeolocationPosition) } });
    render(<MemoryRouter><ToastProvider><OperationalMapPage /></ToastProvider></MemoryRouter>);
    await screen.findByTestId("map-canvas");
    await userEvent.click(screen.getByRole("button", { name: "Mi GPS" }));
    expect(screen.getByLabelText("Latitud WGS84")).toHaveValue("-33.0472");
    expect(screen.getByRole("alert")).toHaveTextContent("±12 m");
  });

  it.each([
    [1, "Permiso denegado"],
    [3, "Tiempo agotado"],
  ])("keeps manual alternatives visible when geolocation fails with code %s", async (code, message) => {
    Object.defineProperty(navigator, "geolocation", { configurable: true, value: { getCurrentPosition: (_success: PositionCallback, failure: PositionErrorCallback) => failure({ code } as GeolocationPositionError) } });
    render(<MemoryRouter><ToastProvider><OperationalMapPage /></ToastProvider></MemoryRouter>);
    await screen.findByTestId("map-canvas");
    await userEvent.click(screen.getByRole("button", { name: "Mi GPS" }));
    expect(screen.getByRole("alert")).toHaveTextContent(message);
    expect(screen.getByRole("button", { name: "Centrar" })).toBeInTheDocument();
  });
});
