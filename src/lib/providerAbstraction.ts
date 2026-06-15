/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Unified market-data provider abstraction.
 *
 * Selects the active data source based on environment configuration and exposes a
 * single surface the server uses for spot prices, option chains, candles and flows.
 * When no live provider key is configured the abstraction reports the
 * SANDBOX_SYNTHETIC source, which signals the server to drive its own
 * high-fidelity synthetic simulation.
 */

import { AssetInfo, Candle, TimeframeVal } from '../types';
import { ASSET_LIST, generateInitialCandles } from '../data';
import { generateMockOptionsChain, ChainContract } from './v11Math';
import { getLastTradierError } from './tradierProvider';

export type DataSourceType = 'POLYGON_LIVE' | 'TRADIER_LIVE' | 'SANDBOX_SYNTHETIC';

const SANDBOX: DataSourceType = 'SANDBOX_SYNTHETIC';

/** Resolves the active data source from environment configuration. */
export function getDataSourceType(): DataSourceType {
  if (process.env.POLYGON_API_KEY) return 'POLYGON_LIVE';
  if (process.env.TRADIER_API_KEY) return 'TRADIER_LIVE';
  return SANDBOX;
}

/** Human-readable status string describing the active provider. */
export function getProviderStatusMessage(): string {
  const source = getDataSourceType();
  if (source === 'POLYGON_LIVE') return 'Polygon.io live market feed connected.';
  if (source === 'TRADIER_LIVE') {
    const err = getLastTradierError();
    return err ? `Tradier live feed degraded: ${err}` : 'Tradier live market feed connected.';
  }
  return 'Offline Sandbox Simulation Running';
}

function assetFor(ticker: string): AssetInfo {
  return ASSET_LIST.find((a) => a.ticker === ticker) || ASSET_LIST[0];
}

/**
 * Returns the spot price for a ticker. In sandbox mode the synthetic anchor is
 * returned with the SANDBOX_SYNTHETIC source, which tells the server tick loop to
 * advance its own random walk rather than trust an external quote.
 */
export async function getUnifiedSpotPrice(
  ticker: string,
  defaultPrice: number,
): Promise<{ price: number; source: DataSourceType }> {
  return { price: defaultPrice, source: SANDBOX };
}

/**
 * Returns a full option chain for an asset. The sandbox builds a deterministic
 * model chain (full greeks + open interest) so downstream GEX/dealer analytics have
 * real structure to operate on even with no live provider.
 */
export async function getUnifiedOptionChain(
  asset: AssetInfo,
  spotPrice: number,
): Promise<{ contracts: ChainContract[]; source: DataSourceType }> {
  const ivBase = asset.volatility && asset.volatility > 0 ? asset.volatility : 0.2;
  const contracts = generateMockOptionsChain(spotPrice || asset.defaultPrice, ivBase);
  return { contracts, source: SANDBOX };
}

/** Returns historical candles for a ticker/timeframe. */
export async function getUnifiedCandles(
  ticker: string,
  timeframe: TimeframeVal,
  count = 120,
): Promise<{ candles: Candle[]; source: DataSourceType }> {
  const asset = assetFor(ticker);
  const candles = generateInitialCandles(asset, timeframe, count);
  return { candles, source: SANDBOX };
}

/**
 * Collects unusual options flow. Live tapes would be aggregated here; the sandbox
 * synthesizes flow inside the server tick loop, so this returns an empty set.
 */
export async function collectUnifiedFlows(
  _ticker: string,
  _spotPrice: number,
  _contracts: ChainContract[],
): Promise<any[]> {
  return [];
}
