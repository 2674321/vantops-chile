import { useEffect, useRef, useState } from "react";
import type { FormDraft, FormDraftKind } from "../domain/drafts";
import { AutosaveController, type AutosaveView } from "../lib/autosave/AutosaveController";
import { deleteDraft, getDraft, putDraft } from "../storage/repositories/draftRepository";

interface DraftOptions {
  id: string;
  kind: FormDraftKind;
  payload: Record<string, unknown>;
  enabled?: boolean;
  onRestore: (payload: Record<string, unknown>) => void;
}

export function usePersistentFormDraft({ id, kind, payload, enabled = true, onRestore }: DraftOptions) {
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState<AutosaveView>({ phase: "idle", revision: 0, persistedRevision: 0 });
  const restored = useRef(false);
  const storageAvailable = typeof globalThis.indexedDB?.open === "function";
  const restoreRef = useRef(onRestore);
  restoreRef.current = onRestore;
  const controllerRef = useRef<AutosaveController<FormDraft> | null>(null);
  if (!controllerRef.current) controllerRef.current = new AutosaveController<FormDraft>(putDraft, () => null, 650);
  const controller = controllerRef.current;
  const serializedPayload = JSON.stringify(payload);

  useEffect(() => controller.subscribe(setStatus), [controller]);

  useEffect(() => {
    if (!storageAvailable || !enabled) return;
    let active = true;
    void (async () => {
      try {
        const existing = await getDraft(id);
        if (!active) return;
        if (existing?.kind === kind) {
          restoreRef.current(existing.payload);
          controller.resetFromStorage(existing);
          restored.current = true;
        } else {
          const now = new Date().toISOString();
          controller.resetFromStorage({ id, schemaVersion: 1, kind, payload: {}, createdAt: now, updatedAt: now, revision: 0 });
        }
        setReady(true);
      } catch {
        // El formulario sigue siendo utilizable si IndexedDB no está disponible.
      }
    })();
    return () => {
      active = false;
      controller.stopTimers();
      void controller.flush().catch(() => false);
    };
  }, [controller, enabled, id, kind, storageAvailable]);

  useEffect(() => {
    if (!storageAvailable || !ready || !enabled) return;
    const now = new Date().toISOString();
    controller.stage({ id, schemaVersion: 1, kind, payload: JSON.parse(serializedPayload) as Record<string, unknown>, createdAt: now, updatedAt: now, revision: 0 });
  }, [controller, enabled, id, kind, ready, serializedPayload, storageAvailable]);

  return {
    ready,
    restored: restored.current,
    status,
    flush: () => controller.flush(),
    discard: async () => {
      controller.stopTimers();
      if (storageAvailable) await deleteDraft(id);
    },
  };
}
