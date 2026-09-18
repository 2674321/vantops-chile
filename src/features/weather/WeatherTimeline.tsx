import type { HourlyWeather } from "../../domain/weather";
import type { AssessmentStatus } from "../../domain/assessment/types";
import type { HourlyAssessment } from "../../domain/assessment/hourly";
import { windDirectionLabel, weatherCodeEmoji } from "./WeatherPanel";
import { formatWeatherHourLabel } from "../../domain/weatherTime";
import { esCL as t } from "../../i18n/es-CL";

interface WeatherTimelineProps {
  hours: HourlyWeather[];
  assessments: HourlyAssessment[];
  maxHours?: number;
}

const STATUS_STYLES: Record<AssessmentStatus, { label: string; symbol: string; className: string }> = {
  FAVORABLE: { label: t.timeline.favorable, symbol: "✓", className: "text-emerald-300 border-emerald-800/60" },
  CAUTION: { label: t.timeline.caution, symbol: "!", className: "text-amber-300 border-amber-800/60" },
  UNFAVORABLE: { label: t.timeline.unfavorable, symbol: "✕", className: "text-red-300 border-red-800/60" },
  NO_DATA: { label: t.timeline.noData, symbol: "–", className: "text-slate-400 border-slate-700" },
};

function value(value: number | null, suffix: string): string {
  return value === null ? t.weather.noData : `${value}${suffix}`;
}

export function WeatherTimeline({ hours, assessments, maxHours = 12 }: WeatherTimelineProps) {
  const upcoming = hours.slice(0, maxHours);
  const statuses = new Map(assessments.map((item) => [item.timeISO, item.assessment.status]));

  if (upcoming.length === 0) {
    return (
      <section aria-label={t.timeline.title} className="space-y-2">
        <h3 className="text-base font-semibold text-slate-100">{t.timeline.title}</h3>
        <p className="text-sm text-slate-400">{t.timeline.empty}</p>
      </section>
    );
  }

  return (
    <section aria-label={t.timeline.title} className="space-y-2">
      <div>
        <h3 className="text-base font-semibold text-slate-100">{t.timeline.title}</h3>
        <p className="text-xs text-slate-500">{t.timeline.subtitle}</p>
      </div>

      <ul className="no-scrollbar flex snap-x gap-2 overflow-x-auto pb-2">
        {upcoming.map((hour, index) => {
          const status = statuses.get(hour.timeISO) ?? "NO_DATA";
          const style = STATUS_STYLES[status];
          return (
            <li
              key={hour.timeISO}
              className={`min-w-[8.5rem] shrink-0 snap-start rounded-lg border bg-slate-950/60 p-3 ${style.className}`}
            >
              <p className="text-sm font-semibold text-slate-100">
                {index === 0 ? t.timeline.now : formatWeatherHourLabel(hour.timeISO)}
              </p>
              <p className="text-[11px] text-slate-500">{formatWeatherHourLabel(hour.timeISO)}</p>

              <p className="mt-1 text-2xl" aria-hidden>
                {hour.weatherCode === null ? "—" : weatherCodeEmoji(hour.weatherCode)}
              </p>

              <p className={`mt-1 text-xs font-medium ${style.className.split(" ")[0]}`}>
                <span aria-hidden>{style.symbol}</span> {style.label}
              </p>

              <dl className="mt-2 space-y-1 text-[11px] text-slate-400">
                <div className="flex items-center justify-between gap-2">
                  <dt>{t.timeline.temperature}</dt>
                  <dd>{value(hour.temperatureC === null ? null : Math.round(hour.temperatureC), "°C")}</dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt>{t.timeline.wind}</dt>
                  <dd>
                    {hour.windSpeedKmh === null
                      ? t.weather.noData
                      : `${hour.windSpeedKmh} km/h${
                          hour.windDirectionDeg === null
                            ? ""
                            : ` ${windDirectionLabel(hour.windDirectionDeg)}`
                        }`}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt>{t.timeline.gusts}</dt>
                  <dd>{value(hour.windGustsKmh, " km/h")}</dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt>{t.timeline.precipitation}</dt>
                  <dd>{value(hour.precipitationMm, " mm")}</dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt>{t.timeline.visibility}</dt>
                  <dd>{hour.visibilityM === null ? t.weather.noData : `${hour.visibilityM} m`}</dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt>{t.timeline.cloudCover}</dt>
                  <dd>{value(hour.cloudCoverPct, "%")}</dd>
                </div>
              </dl>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
