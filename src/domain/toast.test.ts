import { describe, it, expect } from "vitest";
import {
  enqueueToast,
  dismissToast,
  removeExpiredToasts,
  isToastExpired,
  resolveDurationMs,
  TOAST_DURATIONS_MS,
  MAX_VISIBLE_TOASTS,
  TOAST_DEDUPE_WINDOW_MS,
} from "./toast";
import type { Toast, ToastVariant } from "./toast";

function makeToast(
  id: string,
  variant: ToastVariant,
  message: string,
  createdAt: number,
  durationMs?: number,
): Toast {
  return {
    id,
    variant,
    message,
    createdAt,
    durationMs: durationMs ?? resolveDurationMs(variant),
  };
}

describe("resolveDurationMs", () => {
  it("uses shorter durations for success and info", () => {
    expect(TOAST_DURATIONS_MS.success).toBeLessThanOrEqual(4000);
    expect(TOAST_DURATIONS_MS.info).toBeLessThanOrEqual(4000);
  });

  it("uses longer durations for warning and error", () => {
    expect(TOAST_DURATIONS_MS.warning).toBeGreaterThanOrEqual(5000);
    expect(TOAST_DURATIONS_MS.error).toBeGreaterThanOrEqual(5000);
  });

  it("respects a custom duration", () => {
    expect(resolveDurationMs("success", 9000)).toBe(9000);
  });

  it("ignores invalid custom durations", () => {
    expect(resolveDurationMs("success", 0)).toBe(TOAST_DURATIONS_MS.success);
    expect(resolveDurationMs("success", -10)).toBe(TOAST_DURATIONS_MS.success);
    expect(resolveDurationMs("success", Number.NaN)).toBe(TOAST_DURATIONS_MS.success);
  });
});

describe("enqueueToast", () => {
  it("adds a success toast", () => {
    const list = enqueueToast([], makeToast("1", "success", "Guardado", 0));
    expect(list).toHaveLength(1);
    expect(list[0].variant).toBe("success");
  });

  it("adds an error toast", () => {
    const list = enqueueToast([], makeToast("1", "error", "Falló", 0));
    expect(list).toHaveLength(1);
    expect(list[0].variant).toBe("error");
  });

  it("keeps insertion order", () => {
    let list = enqueueToast([], makeToast("1", "success", "Uno", 0));
    list = enqueueToast(list, makeToast("2", "info", "Dos", 0));
    expect(list.map((t) => t.id)).toEqual(["1", "2"]);
  });

  it("dedupes identical messages within the window", () => {
    const first = makeToast("1", "success", "Guardado", 0);
    const second = makeToast("2", "success", "Guardado", TOAST_DEDUPE_WINDOW_MS - 1);
    const list = enqueueToast(enqueueToast([], first), second);
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe("2");
  });

  it("does not dedupe after the window", () => {
    const first = makeToast("1", "success", "Guardado", 0);
    const second = makeToast("2", "success", "Guardado", TOAST_DEDUPE_WINDOW_MS + 1);
    const list = enqueueToast(enqueueToast([], first), second);
    expect(list).toHaveLength(2);
  });

  it("does not dedupe different variants", () => {
    const first = makeToast("1", "success", "Guardado", 0);
    const second = makeToast("2", "error", "Guardado", 0);
    const list = enqueueToast(enqueueToast([], first), second);
    expect(list).toHaveLength(2);
  });

  it(`limits visible toasts to ${MAX_VISIBLE_TOASTS}`, () => {
    let list: Toast[] = [];
    for (let i = 0; i < 5; i++) {
      list = enqueueToast(list, makeToast(String(i), "info", `Mensaje ${i}`, i));
    }
    expect(list).toHaveLength(MAX_VISIBLE_TOASTS);
    expect(list.map((t) => t.id)).toEqual(["2", "3", "4"]);
  });
});

describe("dismissToast", () => {
  it("removes the matching toast", () => {
    const list = [
      makeToast("1", "success", "Uno", 0),
      makeToast("2", "error", "Dos", 0),
    ];
    expect(dismissToast(list, "1").map((t) => t.id)).toEqual(["2"]);
  });

  it("ignores unknown ids", () => {
    const list = [makeToast("1", "success", "Uno", 0)];
    expect(dismissToast(list, "nope")).toHaveLength(1);
  });
});

describe("autodismiss", () => {
  it("expires success toasts after their duration", () => {
    const toast = makeToast("1", "success", "Listo", 1000);
    expect(isToastExpired(toast, 1000 + toast.durationMs - 1)).toBe(false);
    expect(isToastExpired(toast, 1000 + toast.durationMs)).toBe(true);
  });

  it("removes expired toasts but keeps active ones", () => {
    const now = 10_000;
    const active = makeToast("1", "error", "Activo", now - 100);
    const expired = makeToast("2", "success", "Viejo", now - 10_000);
    const list = removeExpiredToasts([active, expired], now);
    expect(list.map((t) => t.id)).toEqual(["1"]);
  });
});
