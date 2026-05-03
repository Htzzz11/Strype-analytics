/** Minimum time between analytics HTTP batches (run / save) to avoid spam. */
export const Analytics_run_save_flush_ms = 5000;

/** Session active-time tick interval (see `sessionTracker.ts`). */
export const Analytics_session_tick_ms = 30_000;

/** Idle gap after which active time is not accumulated. */
export const Analytics_session_idle_threshold_ms = 5 * 60_000;
