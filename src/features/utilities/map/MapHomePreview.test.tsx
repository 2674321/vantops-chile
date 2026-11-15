// @vitest-environment jsdom
import "fake-indexeddb/auto";
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getDB, resetDB } from "../../../storage/db";
import { saveOperationalMap } from "../../../storage/repositories/operationalMapRepository";
import { MapHomePreview } from "./MapHomePreview";

vi.mock("./OperationalMapCanvas", () => ({ default: () => <div data-testid="home-map-canvas">Mapa cargado</div> }));

beforeEach(async () => {
  resetDB();
  await getDB().delete();
  resetDB();
});

afterEach(() => cleanup());

describe("MapHomePreview", () => {
  it("keeps Leaflet preview collapsed until the user expands it", async () => {
    render(<MemoryRouter><MapHomePreview /></MemoryRouter>);
    expect(screen.queryByTestId("home-map-canvas")).not.toBeInTheDocument();
    const toggle = screen.getByRole("button", { name: "Desplegar mapa" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(toggle);
    expect(await screen.findByTestId("home-map-canvas")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Contraer mapa" })).toHaveAttribute("aria-expanded", "true");
  });

  it("shows the real saved-map count and persisted zone", async () => {
    const now = new Date().toISOString();
    await saveOperationalMap({ id: "map-1", schemaVersion: 1, name: "Mapa QA", zones: [{ id: "zone-1", name: "Radio público", center: { latitude: -33.4489, longitude: -70.6693 }, radiusMeters: 500, color: "#38bdf8", visible: true, fillOpacity: 0.12 }], createdAt: now, updatedAt: now });
    render(<MemoryRouter><MapHomePreview /></MemoryRouter>);
    expect(await screen.findByText("1 mapa guardado en este dispositivo")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Desplegar mapa" }));
    expect(await screen.findByRole("button", { name: /Radio público/ })).toBeInTheDocument();
  });

  it("shows the selected B1 empty state only after expanding a map without radii", async () => {
    render(<MemoryRouter><MapHomePreview /></MemoryRouter>);
    expect(screen.queryByText("Aún no hay radios en este mapa. Abre el editor para definir el primero.")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Desplegar mapa" }));
    expect(await screen.findByText("Aún no hay radios en este mapa. Abre el editor para definir el primero.")).toBeInTheDocument();
  });
});
