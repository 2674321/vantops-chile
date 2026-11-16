import { useCallback, useEffect, useState } from "react";
import type { OperationSession } from "../domain/operations/types";
import { listOperationSessions, loadActiveOperationSession, OPERATION_CHANGED_EVENT } from "../storage/repositories/operationSessionRepository";

export function useOperationSessions() {
  const [active, setActive] = useState<OperationSession | null>(null);
  const [recent, setRecent] = useState<OperationSession[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const [nextActive, nextRecent] = await Promise.all([loadActiveOperationSession(), listOperationSessions(30)]);
    setActive(nextActive);
    setRecent(nextRecent);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
    const update = () => void refresh();
    window.addEventListener(OPERATION_CHANGED_EVENT, update);
    window.addEventListener("focus", update);
    const channel = typeof BroadcastChannel === "undefined" ? null : new BroadcastChannel(OPERATION_CHANGED_EVENT);
    channel?.addEventListener("message", update);
    return () => {
      window.removeEventListener(OPERATION_CHANGED_EVENT, update);
      window.removeEventListener("focus", update);
      channel?.close();
    };
  }, [refresh]);

  return { active, recent, loading, refresh };
}
