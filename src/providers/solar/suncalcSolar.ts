import SunCalc from "suncalc";
import type { SolarTimes } from "../../domain/solar";

export function computeSolarTimes(date: Date, lat: number, lon: number): SolarTimes {
  const times = SunCalc.getTimes(date, lat, lon);
  const safe = (d: Date): Date | null =>
    d instanceof Date && !Number.isNaN(d.getTime()) ? d : null;
  const sunrise = safe(times.sunrise);
  const sunset = safe(times.sunset);
  let dayLengthMinutes: number | null = null;
  if (sunrise && sunset) {
    dayLengthMinutes = Math.round((sunset.getTime() - sunrise.getTime()) / 60_000);
  }
  return {
    sunrise,
    sunset,
    goldenHourEnd: safe(times.goldenHourEnd),
    goldenHourStart: safe(times.goldenHour),
    dawn: safe(times.dawn),
    dusk: safe(times.dusk),
    dayLengthMinutes,
  };
}
