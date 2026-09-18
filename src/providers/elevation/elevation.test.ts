import { describe, it, expect, vi, afterEach } from "vitest";
import { buildElevationUrl, fetchElevation, ElevationError } from "./openMeteoElevation";

function jsonResponse(payload: unknown, ok = true, status = 200): Response {
  return { ok, status, json: async () => payload } as unknown as Response;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("buildElevationUrl", () => {
  it("builds correct URL", () => {
    const url = buildElevationUrl(-33.45, -70.66);
    expect(url).toContain("latitude=-33.45");
    expect(url).toContain("longitude=-70.66");
    expect(url).toContain("api.open-meteo.com/v1/elevation");
  });
});

describe("fetchElevation", () => {
  it("returns elevation for a valid response", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ elevation: [512.3] }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchElevation(-33.45, -70.66);
    expect(result.meters).toBe(512.3);
    expect(result.meta.source).toBe("Open-Meteo Elevation");
    expect(result.meta.status).toBe("updated");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("rejects invalid coordinates without calling the API", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(fetchElevation(999, -70.66)).rejects.toThrow("Coordenadas inválidas");
    await expect(fetchElevation(-33.45, 181)).rejects.toThrow("Coordenadas inválidas");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("throws on HTTP error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({}, false, 500)));
    await expect(fetchElevation(-33.45, -70.66)).rejects.toThrow(ElevationError);
  });

  it("throws when the payload is incomplete", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({})));
    await expect(fetchElevation(-33.45, -70.66)).rejects.toThrow("Sin datos de elevación");
  });

  it("throws when the payload has null elevation", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ elevation: [null] })));
    await expect(fetchElevation(-33.45, -70.66)).rejects.toThrow("Sin datos de elevación");
  });

  it("throws on invalid JSON shape (no elevation array)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ elevation: "nope" })));
    await expect(fetchElevation(-33.45, -70.66)).rejects.toThrow("Sin datos de elevación");
  });

  it("throws a clear error on network failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("network")));
    await expect(fetchElevation(-33.45, -70.66)).rejects.toThrow(/No se pudo contactar/);
  });

  it("throws a timeout error when the request is aborted", async () => {
    const abortError = new Error("aborted");
    abortError.name = "AbortError";
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(abortError));
    await expect(fetchElevation(-33.45, -70.66)).rejects.toThrow(/Timeout/);
  });
});

describe("fetchElevation error kinds", () => {
  it("classifies invalid input", async () => {
    await expect(fetchElevation(999, 0)).rejects.toMatchObject({
      kind: "invalid-input",
    });
  });

  it("classifies HTTP errors", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({}, false, 503)));
    await expect(fetchElevation(-33.45, -70.66)).rejects.toMatchObject({
      kind: "http",
      status: 503,
    });
  });

  it("classifies offline failures", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("network")));
    await expect(fetchElevation(-33.45, -70.66)).rejects.toMatchObject({
      kind: "offline",
    });
  });

  it("classifies timeouts", async () => {
    const abortError = new Error("aborted");
    abortError.name = "AbortError";
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(abortError));
    await expect(fetchElevation(-33.45, -70.66)).rejects.toMatchObject({
      kind: "timeout",
    });
  });

  it("classifies invalid JSON bodies", async () => {
    const badJson = {
      ok: true,
      status: 200,
      json: async () => {
        throw new SyntaxError("Unexpected token");
      },
    } as unknown as Response;
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(badJson));
    await expect(fetchElevation(-33.45, -70.66)).rejects.toMatchObject({
      kind: "invalid-response",
    });
  });
});

const processEnv = (globalThis as {
  process?: { env?: Record<string, string | undefined> };
}).process?.env;

const RUN_INTEGRATION = processEnv?.RUN_INTEGRATION === "1";

describe.skipIf(!RUN_INTEGRATION)("fetchElevation integration (real API)", () => {
  it("returns a positive elevation for Santiago", async () => {
    const result = await fetchElevation(-33.45, -70.66);
    expect(typeof result.meters).toBe("number");
    expect(result.meters).toBeGreaterThan(0);
    expect(result.meters).toBeLessThan(10000);
  });
});
