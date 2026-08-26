import type { DataSourceMeta } from "./sourceMeta";

export interface ElevationResult {
  meters: number | null;
  meta: DataSourceMeta;
}
