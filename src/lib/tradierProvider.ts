/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Tradier provider adapter.
 *
 * In sandbox mode (no TRADIER_API_KEY configured) this module is inert and simply
 * tracks the last error surfaced by a live Tradier request so the /api/health
 * endpoint and provider-status messaging can report integration state.
 */

let lastTradierError: string | null = null;

/** Returns the most recent Tradier integration error, or null if healthy/unused. */
export function getLastTradierError(): string | null {
  return lastTradierError;
}

/** Records (or clears) the most recent Tradier integration error. */
export function setLastTradierError(error: string | null): void {
  lastTradierError = error;
}

/** True when a Tradier API key is present in the environment. */
export function isTradierConfigured(): boolean {
  return !!process.env.TRADIER_API_KEY;
}
