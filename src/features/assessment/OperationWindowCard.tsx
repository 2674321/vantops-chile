import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Clock } from "lucide-react";
import type { OperationWindow } from "../../domain/assessment/operationWindow";
import { formatWeatherHourLabel } from "../../domain/weatherTime";
import { esCL as t } from "../../i18n/es-CL";

interface OperationWindowCardProps {
  window: OperationWindow;
  onGoSettings: () => void;
}

export function OperationWindowCard({ window, onGoSettings }: OperationWindowCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock className="h-4 w-4 text-sky-400" aria-hidden />
          {t.operationWindow.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <WindowBody window={window} onGoSettings={onGoSettings} />
        <p className="text-[11px] text-slate-500">{t.operationWindow.disclaimer}</p>
      </CardContent>
    </Card>
  );
}

function WindowBody({ window, onGoSettings }: OperationWindowCardProps) {
  if (window.kind === "needs-limits") {
    return (
      <div className="space-y-3">
        <p className="text-sm text-slate-300">{t.operationWindow.needsLimits}</p>
        <Button type="button" variant="outline" size="sm" onClick={onGoSettings}>
          {t.operationWindow.goSettings}
        </Button>
      </div>
    );
  }

  if (window.kind === "insufficient-data") {
    return <p className="text-sm text-slate-400">{t.operationWindow.insufficientData}</p>;
  }

  if (window.kind === "no-favorable") {
    return <p className="text-sm text-amber-300">{t.operationWindow.noFavorable}</p>;
  }

  if (window.startISO === null || window.endISO === null) {
    return <p className="text-sm text-slate-400">{t.operationWindow.insufficientData}</p>;
  }

  const message =
    window.bestStatus === "CAUTION"
      ? t.operationWindow.caution(formatWeatherHourLabel(window.startISO), formatWeatherHourLabel(window.endISO))
      : t.operationWindow.favorable(formatWeatherHourLabel(window.startISO), formatWeatherHourLabel(window.endISO));

  return (
    <output className="block text-sm text-emerald-300">
      {message}
    </output>
  );
}
