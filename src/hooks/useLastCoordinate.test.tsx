// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { useLastCoordinate } from "./useLastCoordinate";
import {
  loadLastCoordinate,
  saveLastCoordinateToIDB,
} from "../storage/settings";

vi.mock("../storage/settings", () => ({
  loadLastCoordinate: vi.fn(),
  saveLastCoordinateToIDB: vi.fn(),
}));

const loadMock = loadLastCoordinate as unknown as Mock;
const saveIdbMock = saveLastCoordinateToIDB as unknown as Mock;

function Probe() {
  const { coordinate, saveCoordinate, loaded } = useLastCoordinate();
  return (
    <div>
      <span data-testid="loaded">{String(loaded)}</span>
      <span data-testid="coord">
        {coordinate ? `${coordinate.latitude},${coordinate.longitude}` : "none"}
      </span>
      <button
        type="button"
        onClick={() => saveCoordinate({ latitude: -33.45, longitude: -70.66 })}
      >
        save
      </button>
    </div>
  );
}

beforeEach(() => {
  loadMock.mockResolvedValue(null);
  saveIdbMock.mockResolvedValue(undefined);
  localStorage.clear();
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe("useLastCoordinate", () => {
  it("loads the stored coordinate and marks it as loaded", async () => {
    loadMock.mockResolvedValue({ latitude: -33.45, longitude: -70.66 });
    render(<Probe />);
    await waitFor(() => {
      expect(screen.getByTestId("loaded")).toHaveTextContent("true");
    });
    expect(screen.getByTestId("coord")).toHaveTextContent("-33.45,-70.66");
  });

  it("updates optimistically and persists to IndexedDB and localStorage", async () => {
    render(<Probe />);
    await waitFor(() => expect(screen.getByTestId("loaded")).toHaveTextContent("true"));
    fireEvent.click(screen.getByRole("button", { name: "save" }));
    expect(screen.getByTestId("coord")).toHaveTextContent("-33.45,-70.66");
    expect(saveIdbMock).toHaveBeenCalledWith({
      latitude: -33.45,
      longitude: -70.66,
    });
    expect(localStorage.getItem("vantops:lastCoordinate")).toContain("-33.45");
  });

  it("warns but keeps the value when IndexedDB fails", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    saveIdbMock.mockRejectedValue(new Error("idb down"));
    render(<Probe />);
    await waitFor(() => expect(screen.getByTestId("loaded")).toHaveTextContent("true"));
    fireEvent.click(screen.getByRole("button", { name: "save" }));
    expect(screen.getByTestId("coord")).toHaveTextContent("-33.45,-70.66");
    await waitFor(() => expect(warn).toHaveBeenCalled());
  });

  it("does not crash when localStorage is unavailable", async () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("private mode");
    });
    render(<Probe />);
    await waitFor(() => expect(screen.getByTestId("loaded")).toHaveTextContent("true"));
    fireEvent.click(screen.getByRole("button", { name: "save" }));
    expect(screen.getByTestId("coord")).toHaveTextContent("-33.45,-70.66");
    await waitFor(() => expect(saveIdbMock).toHaveBeenCalled());
  });
});
