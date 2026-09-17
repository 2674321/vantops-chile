import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Download, X } from "lucide-react";
import { useInstallPrompt } from "../../hooks/useInstallPrompt";
import { esCL as t } from "../../i18n/es-CL";

export function InstallPromptCard() {
  const { visible, iosHintVisible, isIos, promptInstall, dismiss } = useInstallPrompt();

  const showNative = visible;
  const showIos = !visible && isIos && iosHintVisible;

  if (!showNative && !showIos) return null;

  return (
    <Card>
      <CardContent className="flex items-start gap-3 py-3">
        <Download className="mt-0.5 h-5 w-5 shrink-0 text-sky-400" aria-hidden />
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-sm font-medium text-slate-100">{t.install.title}</p>
          <p className="text-xs text-slate-400">
            {showIos ? t.install.iosHint : t.install.description}
          </p>
          <div className="flex flex-wrap gap-2">
            {showNative && (
              <Button type="button" size="sm" onClick={() => void promptInstall()}>
                {t.install.action}
              </Button>
            )}
            <Button type="button" variant="outline" size="sm" onClick={dismiss}>
              {t.install.dismiss}
            </Button>
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label={t.install.dismiss}
          className="shrink-0 text-slate-500 hover:text-slate-300"
        >
          <X className="h-4 w-4" />
        </button>
      </CardContent>
    </Card>
  );
}
