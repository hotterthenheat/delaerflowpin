/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Gamma-exposure (GEX) engine.
 *
 * Builds a dealer-positioning profile from an option chain (per-strike GEX/DEX/VEX,
 * call/put walls, gamma flip, magnet, expected move) and derives a dealer-flow
 * pressure gauge from that profile.
 */

import { ChainContract } from './v11Math';
import { GexProfileData, GexStrikeDetail, DealerFlowData, DealerComponent } from '../types';

const CONTRACT_MULTIPLIER = 100;

function contractGex(c: ChainContract, spot: number): number {
  const sign = c.type === 'call' ? 1 : -1;
  return c.gamma * c.openInterest * CONTRACT_MULTIPLIER * (spot * spot) * 0.01 * sign;
}
function contractDex(c: ChainContract, spot: number): number {
  const sign = c.type === 'call' ? 1 : -1;
  return c.delta * c.openInterest * CONTRACT_MULTIPLIER * spot * sign;
}
function contractVex(c: ChainContract): number {
  const sign = c.type === 'call' ? 1 : -1;
  return c.vega * c.openInterest * CONTRACT_MULTIPLIER * sign;
}

/**
 * Aggregates a chain into a GEX profile.
 * @param contracts full option chain
 * @param spot      underlying spot price
 * @param _t        time to expiry in years (reserved for live recalibration)
 * @param _r        risk-free rate (reserved for live recalibration)
 */
export function buildGexProfile(
  contracts: ChainContract[],
  spot: number,
  _t: number = 1 / 365,
  _r: number = 0.06,
): GexProfileData | null {
  if (!contracts || contracts.length === 0 || !spot) return null;

  const byStrike = new Map<number, GexStrikeDetail>();
  let netGex = 0;
  let netDex = 0;
  let netVex = 0;
  let totalCallOi = 0;
  let totalPutOi = 0;

  for (const c of contracts) {
    const gex = contractGex(c, spot);
    const dex = contractDex(c, spot);
    const vex = contractVex(c);
    netGex += gex;
    netDex += dex;
    netVex += vex;

    let row = byStrike.get(c.strike);
    if (!row) {
      row = {
        strike: c.strike,
        callGex: 0, putGex: 0, netGex: 0,
        callOi: 0, putOi: 0,
        callVolume: 0, putVolume: 0,
        callDex: 0, putDex: 0, netDex: 0,
        callVex: 0, putVex: 0, netVex: 0,
      };
      byStrike.set(c.strike, row);
    }

    if (c.type === 'call') {
      row.callGex += gex;
      row.callOi += c.openInterest;
      row.callVolume += Math.round(c.openInterest * 0.35);
      row.callDex = (row.callDex || 0) + dex;
      row.callVex = (row.callVex || 0) + vex;
      totalCallOi += c.openInterest;
    } else {
      row.putGex += gex;
      row.putOi += c.openInterest;
      row.putVolume += Math.round(c.openInterest * 0.35);
      row.putDex = (row.putDex || 0) + dex;
      row.putVex = (row.putVex || 0) + vex;
      totalPutOi += c.openInterest;
    }
    row.netGex = row.callGex + row.putGex;
    row.netDex = (row.callDex || 0) + (row.putDex || 0);
    row.netVex = (row.callVex || 0) + (row.putVex || 0);
  }

  const strikes = Array.from(byStrike.values()).sort((a, b) => a.strike - b.strike);

  // Walls & magnet
  let callWall = spot;
  let putWall = spot;
  let magnet = spot;
  let maxCall = -Infinity;
  let maxPut = -Infinity;
  let maxAbsNet = -Infinity;
  for (const s of strikes) {
    if (s.callGex > maxCall) { maxCall = s.callGex; callWall = s.strike; }
    if (Math.abs(s.putGex) > maxPut) { maxPut = Math.abs(s.putGex); putWall = s.strike; }
    const absNet = Math.abs(s.netGex);
    if (absNet > maxAbsNet) { maxAbsNet = absNet; magnet = s.strike; }
  }

  // Gamma flip: first strike where cumulative net GEX crosses zero
  let gammaFlip = spot;
  let cum = 0;
  let prev = 0;
  for (const s of strikes) {
    prev = cum;
    cum += s.netGex;
    if ((prev <= 0 && cum > 0) || (prev >= 0 && cum < 0)) {
      gammaFlip = s.strike;
      break;
    }
  }

  const expectedMovePct = Number(
    Math.min(8, Math.max(0.2, Math.abs(netVex) / (spot * 1e6) + 0.6)).toFixed(2),
  );

  return {
    spot,
    netGex,
    netDex,
    netVex,
    callWall,
    putWall,
    gammaFlip,
    magnet,
    totalCallOi,
    totalPutOi,
    callPutOiRatio: totalPutOi > 0 ? (totalCallOi / totalPutOi).toFixed(2) : 'n/a',
    expectedMovePct,
    feed: 'DERIVED_MODEL',
    strikes,
  };
}

/**
 * Derives a dealer-flow pressure gauge (0-100) and regime bias from a GEX profile
 * plus net charm and net delta exposure.
 */
export function computeDealerFlowGauge(
  profile: GexProfileData,
  netCharm = 0,
  netDex = 0,
): DealerFlowData {
  const netGex = profile?.netGex || 0;
  const longGamma = netGex >= 0;

  const gexMag = Math.min(1, Math.abs(netGex) / 5e9);
  const charmMag = Math.min(1, Math.abs(netCharm) / 1e8);
  const dexMag = Math.min(1, Math.abs(netDex) / 5e9);
  const pressure = Math.round(Math.min(99, gexMag * 45 + charmMag * 20 + dexMag * 20 + 10));

  const spot = profile.spot || 0;
  const magnet = profile.magnet ?? spot;
  const magnetCloseness = spot
    ? 1 - Math.min(1, Math.abs(magnet - spot) / (spot * 0.02))
    : 0;

  const bias = longGamma ? 'LONG GAMMA' : 'SHORT GAMMA';
  const headline = longGamma
    ? 'Dealers long gamma: mean-reverting regime, volatility suppressed near magnet.'
    : 'Dealers short gamma: momentum-amplifying regime, hedging accelerates the trend.';

  const components: DealerComponent[] = [
    {
      name: 'Gamma regime',
      value: Number(gexMag.toFixed(2)),
      weight: 0.35,
      detail: longGamma ? 'positive net gamma (pinning)' : 'negative net gamma (chasing)',
    },
    {
      name: 'Magnet pull',
      value: Number(magnetCloseness.toFixed(2)),
      weight: 0.15,
      detail: `pin @ ${magnet || '—'}`,
    },
    {
      name: 'Charm decay flow',
      value: Number(charmMag.toFixed(2)),
      weight: 0.2,
      detail: netCharm >= 0 ? 'supportive charm drift' : 'decaying charm drift',
    },
    {
      name: 'Delta inventory',
      value: Number(dexMag.toFixed(2)),
      weight: 0.1,
      detail: netDex >= 0 ? 'net long delta inventory' : 'net short delta inventory',
    },
    {
      name: 'Hedge-flow demand',
      value: Number(gexMag.toFixed(2)),
      weight: 0.2,
      detail: 'modeled hedge volume',
    },
  ];

  return { pressure, bias, headline, components };
}
