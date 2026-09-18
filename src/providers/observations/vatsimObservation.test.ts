import { describe, it, expect, vi, afterEach } from "vitest";
import { fetchNearestObservation, VATSIM_SOURCE_LABEL, ObservationError } from "./vatsimObservation";

const SANTIAGO = { lat: -33.45, lon: -70.66 };

function metarFor(date: Date, station = "SCEL"): string {
  const dd = String(date.getUTCDate()).padStart(2, "0");
  const hh = String(date.getUTCHours()).padStart(2, "0");
  return `${station} ${dd}${hh}00Z 33013KT 9999 SCT039 13/10 Q1001`;
}

function textResponse(body: string, ok = true, status = 200): Response {
  return { ok, status, text: async () => body } as unknown as Response;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("fetchNearestObservation (VATSIM METAR)", () => {
  it("returns a decoded snapshot for a fresh METAR", async () => {
    const fetchMock = vi.fn().mockResolvedValue(textResponse(metarFor(new Date())));
    vi.stubGlobal("fetch", fetchMock);

    const snapshot = await fetchNearestObservation(SANTIAGO.lat, SANTIAGO.lon);
    expect(snapshot.observation).not.toBeNull();
    expect(snapshot.stationIcao).toBe("SCEL");
    expect(snapshot.meta.source).toBe(VATSIM_SOURCE_LABEL);
    expect(snapshot.meta.status).toBe("updated");
    expect(snapshot.observation?.windKmh).toBe(24);
  });

  it("keeps the observation minutes from the METAR timestamp", async () => {
    const now = new Date();
    const dd = String(now.getUTCDate()).padStart(2, "0");
    const hh = String((now.getUTCHours() + 23) % 24).padStart(2, "0");
    const body = `SCEL ${dd}${hh}53Z 33013KT 9999 13/10 Q1001`;
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(textResponse(body)));

    const snapshot = await fetchNearestObservation(SANTIAGO.lat, SANTIAGO.lon);
    expect(snapshot.observation?.observedAtISO).toMatch(/:\d{2}:00\.000Z$/);
    expect(snapshot.observation?.observedAtISO.slice(14, 16)).toBe("53");
  });

  it("returns no-data when the METAR has no valid observation time", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(textResponse("SCEL 991200Z 33013KT 9999 13/10 Q1001"))
    );
    const snapshot = await fetchNearestObservation(SANTIAGO.lat, SANTIAGO.lon);
    expect(snapshot.meta.status).toBe("no-data");
    expect(snapshot.meta.error).toMatch(/hora de observación/);
  });

  it("marks old METAR as error (obsoleto) with a clear message", async () => {
    const yesterday = new Date(Date.now() - 24 * 3600_000);
    const fetchMock = vi.fn().mockResolvedValue(textResponse(metarFor(yesterday)));
    vi.stubGlobal("fetch", fetchMock);

    const snapshot = await fetchNearestObservation(SANTIAGO.lat, SANTIAGO.lon);
    expect(snapshot.meta.status).toBe("error");
    expect(snapshot.meta.error).toMatch(/obsoleto/);
  });

  it("returns no-data for an empty body", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(textResponse("   ")));
    const snapshot = await fetchNearestObservation(SANTIAGO.lat, SANTIAGO.lon);
    expect(snapshot.observation).toBeNull();
    expect(snapshot.meta.status).toBe("no-data");
    expect(snapshot.meta.error).toMatch(/vacía/);
  });

  it("returns no-data for METAR NIL", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(textResponse("METAR SCEL 011200Z NIL")));
    const snapshot = await fetchNearestObservation(SANTIAGO.lat, SANTIAGO.lon);
    expect(snapshot.observation).toBeNull();
    expect(snapshot.meta.error).toMatch(/NIL/);
  });

  it("returns no-data for a malformed METAR", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(textResponse("SCEL")));
    const snapshot = await fetchNearestObservation(SANTIAGO.lat, SANTIAGO.lon);
    expect(snapshot.observation).toBeNull();
    expect(snapshot.meta.error).toMatch(/malformado/);
  });

  it("throws ObservationError on HTTP error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(textResponse("", false, 500)));
    await expect(fetchNearestObservation(SANTIAGO.lat, SANTIAGO.lon)).rejects.toThrow(ObservationError);
  });

  it("throws ObservationError on network failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("network")));
    await expect(fetchNearestObservation(SANTIAGO.lat, SANTIAGO.lon)).rejects.toThrow(
      /No se pudo contactar/
    );
  });

  it("throws ObservationError on timeout/abort", async () => {
    const abortError = new Error("aborted");
    abortError.name = "AbortError";
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(abortError));
    await expect(fetchNearestObservation(SANTIAGO.lat, SANTIAGO.lon)).rejects.toThrow(/Timeout/);
  });

  it("classifies provider error kinds", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(textResponse("", false, 500)));
    await expect(fetchNearestObservation(SANTIAGO.lat, SANTIAGO.lon)).rejects.toMatchObject({
      kind: "http",
      status: 500,
    });

    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("network")));
    await expect(fetchNearestObservation(SANTIAGO.lat, SANTIAGO.lon)).rejects.toMatchObject({
      kind: "offline",
    });

    const abortError = new Error("aborted");
    abortError.name = "AbortError";
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(abortError));
    await expect(fetchNearestObservation(SANTIAGO.lat, SANTIAGO.lon)).rejects.toMatchObject({
      kind: "timeout",
    });
  });
});