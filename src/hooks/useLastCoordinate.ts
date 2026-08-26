import { useState, useCallback } from "react";
import type { Coordinate } from "../domain/coordinate";

const STORAGE_KEY = "vantops:lastCoordinate";

export function useLastCoordinate() {
  const [coordinate, setCoordinate] = useState<Coordinate | null>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as Coordinate;
      if (
        typeof parsed.latitude === "number" &&
        typeof parsed.longitude === "number"
      ) {
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  });

  const saveCoordinate = useCallback((c: Coordinate) => {
    setCoordinate(c);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(c));
    } catch {
      // storage full or unavailable — ignore
    }
  }, []);

  return { coordinate, saveCoordinate };
}
