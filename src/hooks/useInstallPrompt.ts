import { useCallback, useEffect, useState } from "react";
import {
  isStandaloneMode,
  parseDismissedAt,
  shouldShowInstallPrompt,
} from "../domain/pwaInstall";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "vantops:installDismissedAt";

function readDismissedAt(): number | null {
  try {
    return parseDismissedAt(localStorage.getItem(DISMISS_KEY));
  } catch {
    return null;
  }
}

function isIosDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export function useInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [dismissedAt, setDismissedAt] = useState<number | null>(null);
  const [isIos] = useState(isIosDevice);

  useEffect(() => {
    const mq = window.matchMedia?.("(display-mode: standalone)");
    const navigatorStandalone = Boolean(
      (navigator as { standalone?: boolean }).standalone
    );
    setIsStandalone(isStandaloneMode(Boolean(mq?.matches), navigatorStandalone));
    setDismissedAt(readDismissedAt());

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setDeferred(null);
      setIsStandalone(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const promptInstall = useCallback(async (): Promise<boolean> => {
    if (deferred === null) return false;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    setDeferred(null);
    return choice.outcome === "accepted";
  }, [deferred]);

  const dismiss = useCallback(() => {
    const now = Date.now();
    setDismissedAt(now);
    try {
      localStorage.setItem(DISMISS_KEY, String(now));
    } catch {
      // ignore
    }
  }, []);

  const state = {
    canInstall: deferred !== null,
    isStandalone,
    dismissedAt,
  };

  return {
    isIos,
    isStandalone,
    canInstall: deferred !== null,
    visible: shouldShowInstallPrompt(state, Date.now()),
    iosHintVisible: shouldShowInstallPrompt(
      { canInstall: true, isStandalone, dismissedAt },
      Date.now()
    ),
    promptInstall,
    dismiss,
  };
}
