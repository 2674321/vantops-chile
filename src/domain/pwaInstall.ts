export const INSTALL_DISMISS_COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000;

export interface InstallPromptState {
  canInstall: boolean;
  isStandalone: boolean;
  dismissedAt: number | null;
}

export function isStandaloneMode(
  matchMediaStandalone: boolean,
  navigatorStandalone: boolean
): boolean {
  return matchMediaStandalone || navigatorStandalone;
}

export function shouldShowInstallPrompt(
  state: InstallPromptState,
  nowMs: number
): boolean {
  if (state.isStandalone) return false;
  if (!state.canInstall) return false;
  if (
    state.dismissedAt !== null &&
    nowMs - state.dismissedAt < INSTALL_DISMISS_COOLDOWN_MS
  ) {
    return false;
  }
  return true;
}

export function parseDismissedAt(raw: string | null): number | null {
  if (raw === null) return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}
