// @vitest-environment jsdom
import "fake-indexeddb/auto";
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "../../../components/toast/ToastProvider";
import { getDB, resetDB } from "../../../storage/db";
import { listOperationalMaps } from "../../../storage/repositories/operationalMapRepository";
import { OperationalMapPage } from "./OperationalMapPage";

vi.mock("./OperationalMapCanvas", () => ({ default: () => <div data-testid="map-canvas">Mapa</div> }));

beforeEach(async () => {
  resetDB();
  await getDB().delete();
  resetDB();
  vi.restoreAllMocks();
});

afterEach(() => cleanup());

describe("OperationalMapPage", () => {
  it("creates multiple zones and persists the map", async () => {
    render(<MemoryRouter><ToastProvider><OperationalMapPage /></ToastProvider></MemoryRouter>);
    expect(await screen.findByTestId("map-canvas")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Añadir" }));
    await userEvent.click(screen.getByRole("button", { name: "250 m" }));
    expect(screen.getAllByText(/Radio/).length).toBeGreaterThanOrEqual(2);
    await userEvent.clear(screen.getByLabelText("Nombre del mapa"));
    await userEvent.type(screen.getByLabelText("Nombre del mapa"), "Mapa QA público");
    await userEvent.click(screen.getByRole("button", { name: "Guardar mapa" }));
    await waitFor(async () => expect(await listOperationalMaps()).toHaveLength(1));
    expect((await listOperationalMaps())[0]).toMatchObject({ name: "Mapa QA público", zones: [{ radiusMeters: 500 }, { radiusMeters: 250 }] });
  });

  it("rejects a partial numeric radius instead of parsing its prefix", async () => {
    render(<MemoryRouter><ToastProvider><OperationalMapPage /></ToastProvider></MemoryRouter>);
    await screen.findByTestId("map-canvas");
    await userEvent.click(screen.getByRole("button", { name: "Añadir" }));
    const radius = screen.getByLabelText("Radio en metros");
    await userEvent.clear(radius);
    await userEvent.type(radius, "500abc");
    await userEvent.tab();
    expect(screen.getByRole("alert")).toHaveTextContent("Radio válido");
    expect(radius).toHaveValue("500");
  });
});
