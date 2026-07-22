import type {MatrixHeatmapTone} from "../../services/matrixInsightService";

export const EMPTY_DISPLAY_LABELS_BY_KEY: Record<string, string> = {};
export const EMPTY_UNAVAILABLE_ROW_IDS = new Set<string>();
export const EMPTY_UNAVAILABLE_COLUMN_IDS = new Set<string>();
export const EMPTY_UNAVAILABLE_REASON_BY_ROW_ID: Record<string, string> = {};
export const EMPTY_UNAVAILABLE_REASON_BY_COLUMN_ID: Record<string, string> = {};
export const EMPTY_HEATMAP_TONE_BY_CELL_KEY: Record<string, MatrixHeatmapTone> = {};
