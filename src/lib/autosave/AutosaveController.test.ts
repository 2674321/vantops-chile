import { describe, expect, it, vi } from "vitest";
import { AutosaveController } from "./AutosaveController";

describe("AutosaveController", () => {
  it("does not report saved until the durable write resolves", async () => {
    let release = () => {};
    const write = vi.fn(() => new Promise<void>((resolve) => { release = resolve; }));
    const controller = new AutosaveController(write, () => null, 10_000);
    controller.stage({ value: 1 });
    const flushing = controller.flush();
    expect(controller.snapshot.phase).toBe("saving");
    release();
    await expect(flushing).resolves.toBe(true);
    expect(controller.snapshot.phase).toBe("saved");
  });

  it("keeps invalid and failed revisions dirty for correction or retry", async () => {
    const invalid = new AutosaveController(async () => {}, (value: { value: number }) => value.value < 0 ? "inválido" : null);
    invalid.stage({ value: -1 });
    expect(await invalid.flush()).toBe(false);
    expect(invalid.snapshot).toMatchObject({ phase: "invalid", message: "inválido" });
    const failed = new AutosaveController(async () => { throw new Error("cuota"); }, () => null);
    failed.stage({ value: 1 });
    expect(await failed.flush()).toBe(false);
    expect(failed.snapshot).toMatchObject({ phase: "error", message: "cuota" });
  });
});
