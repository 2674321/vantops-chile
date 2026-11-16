export type AutosavePhase = "idle" | "pending" | "saving" | "saved" | "invalid" | "error";
export interface AutosaveView { phase: AutosavePhase; revision: number; persistedRevision: number; savedAt?: string; message?: string; }

export class AutosaveController<T extends object> {
  private latest: T | null = null;
  private revision = 0;
  private persistedRevision = 0;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private inFlight: Promise<boolean> | null = null;
  private listeners = new Set<(state: AutosaveView) => void>();
  private state: AutosaveView = { phase: "idle", revision: 0, persistedRevision: 0 };
  constructor(private write: (value: T) => Promise<void>, private validate: (value: T) => string | null, private delayMs = 550) { if (!Number.isFinite(delayMs) || delayMs < 0) throw new Error("Intervalo de guardado inválido"); }
  get snapshot(): AutosaveView { return { ...this.state }; }
  get isDirty(): boolean { return this.revision !== this.persistedRevision; }
  subscribe(listener: (state: AutosaveView) => void): () => void { this.listeners.add(listener); listener(this.snapshot); return () => { this.listeners.delete(listener); }; }
  private notify(phase: AutosavePhase, message?: string, savedAt?: string) { this.state = { phase, message, savedAt: savedAt ?? this.state.savedAt, revision: this.revision, persistedRevision: this.persistedRevision }; for (const listener of this.listeners) listener(this.snapshot); }
  private clearTimer() { if (this.timer) clearTimeout(this.timer); this.timer = null; }
  resetFromStorage(value: T) { if (this.inFlight) throw new Error("Guardado anterior en curso"); this.clearTimer(); this.latest = structuredClone(value); this.revision += 1; this.persistedRevision = this.revision; this.notify("saved"); }
  stage(value: T) { this.latest = structuredClone(value); this.revision += 1; this.clearTimer(); const error = this.validate(this.latest); if (error) { this.notify("invalid", error); return; } this.notify("pending"); this.timer = setTimeout(() => { void this.flush(); }, this.delayMs); }
  async flush(): Promise<boolean> { this.clearTimer(); if (!this.latest || this.revision === this.persistedRevision) return true; if (this.inFlight) { const ok = await this.inFlight; return ok ? this.flush() : false; } const error = this.validate(this.latest); if (error) { this.notify("invalid", error); return false; } const value = structuredClone(this.latest); const target = this.revision; this.notify("saving"); const operation = (async () => { try { await this.write(value); this.persistedRevision = target; this.notify(this.isDirty ? "pending" : "saved", undefined, new Date().toISOString()); return true; } catch (caught) { const message = typeof caught === "object" && caught !== null && "message" in caught && typeof caught.message === "string" ? caught.message : "No se pudo guardar"; this.notify("error", message); return false; } })(); this.inFlight = operation; const ok = await operation; this.inFlight = null; if (!ok) return false; return this.isDirty ? this.flush() : true; }
  retry() { return this.flush(); }
  stopTimers() { this.clearTimer(); }
  dispose() { this.clearTimer(); this.listeners.clear(); }
}
