import { useState, useEffect, useCallback } from "react";
import type { Coordinate } from "../domain/coordinate";
import { loadLastCoordinate, saveLastCoordinateToIDB } from "../storage/settings";

const STORAGE_KEY = "vantops:lastCoordinate";

export function useLastCoordinate() {
  const [coordinate, setCoordinate] = useState<Coordinate | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadLastCoordinate().then((c) => {
      setCoordinate(c);
      setLoaded(true);
    });
  }, []);

  const saveCoordinate = useCallback((c: Coordinate) => {
    setCoordinate(c);
    saveLastCoordinateToIDB(c).catch(() => {});
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(c));
    } catch {
      // ignore
    }
  }, []);

  return { coordinate, saveCoordinate, loaded };
}
