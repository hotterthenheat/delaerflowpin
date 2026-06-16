/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * V5 — SkyScore contract ranker.
 *
 * Runs AFTER the directional engine emits a BUY (spec Part 0.1). It does not
 * touch direction; it ranks the contracts available on that BUY by expected
 * opportunity and returns a ranked list (not a signal).
 *
 * Every 0–100 score routes through src/lib/normalize.ts (no ad-hoc math, no
 * Math.random anywhere in this path). Cross-sectional scores are relative to
 * the current candidate set C only — a SkyScore of 94 means "best of this scan,"
 * not an absolute grade.
 */

import { computeBlackScholesPrice, computeLiquidityScore } from './v11Math';
import { SnapshotStore } from './snapshotStore';
import {
  clamp, normLogSaturate, normSignedTanh, normCrossSection, unit,
} from './normalize';

// ============================================================
// CONFIG (spec Part 11). Defaults only; tune from the forward log (§9.5).
// ============================================================
export interface V5Config {
  // Eligibility gate (Part 10B)
  minOI: number; minVolume: number; maxSpread: number; deltaMin: number; deltaMax: number;
  // Positioning (Part 2)
  NBRS_CAP: number; OIV_SCALE: number; neighborWeights: [number, number, number];
  // Dealer influence (Part 3)
  ACCEL_SIGN: 1 | -1; dealerWallMagWeight: number; dealerAlignWeight: number;
  exposureWeights: { gex: number; dex: number; vex: number };
  // Acceleration (Part 4)
  VE_SCALE: number; GVEL_SCALE: number; VVEL_SCALE: number; LOOKBACK_BARS: number;
  // EMA path (Part 5)
  SPOT_VOL_BETA: number; SIGMA_FLOOR: number; EMA_RET_SCALE: number;
  // Final blend (Part 7)
  weights: { positioning: number; dealer: number; acceleration: number; emaPath: number; liquidity: number };
  // Convexity (Part 8)
  convexityWeights: { gammaVel: number; vannaVel: number; speed: number };
  isExplosiveSky: number; isExplosiveConvexity: number;
}

export const DEFAULT_V5_CONFIG: V5Config = {
  minOI: 250, minVolume: 100, maxSpread: 0.12, deltaMin: 0.30, deltaMax: 0.60,
  NBRS_CAP: 12, OIV_SCALE: 5000, neighborWeights: [1.0, 0.75, 0.5],
  ACCEL_SIGN: 1, // CALIBRATION REQUIRED — Zak confirms vs SPX dealer-flow convention before live (Part 3.4)
  dealerWallMagWeight: 0.60, dealerAlignWeight: 0.40,
  exposureWeights: { gex: 0.50, dex: 0.30, vex: 0.20 },
  VE_SCALE: 1.5, GVEL_SCALE: 5e8, VVEL_SCALE: 5e7, LOOKBACK_BARS: 5,
  SPOT_VOL_BETA: -0.012, SIGMA_FLOOR: 0.03, EMA_RET_SCALE: 0.5,
  weights: { positioning: 0.25, dealer: 0.25, acceleration: 0.20, emaPath: 0.20, liquidity: 0.10 }, // CALIBRATION REQUIRED (Part 7.1)
  convexityWeights: { gammaVel: 0.45, vannaVel: 0.35, speed: 0.20 },
  isExplosiveSky: 85, isExplosiveConvexity: 80,
};

// ============================================================
// TYPES
// ============================================================
export interface RankerContract {
  symbol: string;
  expiration: string;
  strike: number;
  type: 'C' | 'P';
  oi: number;
  volume: number;
  bid: number;
  ask: number;
  iv: number;
  delta: number;
  gamma: number;
  vega: number;
  theta: number;
  vanna?: number;
  charm?: number;
  speed?: number;             // ∂³V/∂S³ for convexity (Part 8); optional
  rvol?: number;              // time-of-day-adjusted RVOL (Part 4.1); 1.0 = normal
  gexStrike?: number;         // per-strike signed exposures (Part 3); derived if absent
  dexStrike?: number;
  vexStrike?: number;
  oiPriorSession?: number;    // for OI velocity (Part 2.2); absent → 0 in sandbox
}

export interface EmaTargets { ema5: number; ema9: number; ema20: number; ema50: number; ema200: number; }

export interface RankInput {
  direction: 'bullish' | 'bearish';
  spot: number;
  dteDays: number;
  chain: RankerContract[];
  emaTargets: EmaTargets;
  dataSource: 'LIVE' | 'SIMULATED';
  config?: Partial<V5Config>;
  store?: SnapshotStore;      // for velocity terms (Part 4) — omit → neutral 50
}

export interface RankedCandidate {
  symbol: string; strike: number; type: 'C' | 'P';
  eligible: boolean; rejectReasons: string[];
  positioningScore: number; dealerInfluenceScore: number; accelerationScore: number;
  emaPathScore: number; liquidityScore: number;
  skyScore: number;
  convexityScore: number; convexityStatus: 'Rising Fast' | 'Rising' | 'Flat' | 'Falling';
  isExplosive: boolean;
  nbrs: number; oiVelocity: number; volumeExpansion: number; gammaVelocity: number; distanceFromSpotPct: number;
  emaReturns: { ema5: number; ema9: number; ema20: number; ema50: number; ema200: number };
  flags: string[];
  data_source: 'LIVE' | 'SIMULATED';
}

const EMA_KEYS: (keyof EmaTargets)[] = ['ema5', 'ema9', 'ema20', 'ema50', 'ema200'];

// ============================================================
// Helpers
// ============================================================
function mid(c: RankerContract): number { return (c.bid + c.ask) / 2; }

/** Per-strike signed dealer exposure when the adapter didn't supply it.
 *  Convention (existing engine): short calls negative, long puts positive. */
function exposures(c: RankerContract, spot: number) {
  const sign = c.type === 'C' ? -1 : 1;
  const gex = c.gexStrike ?? sign * (c.gamma || 0) * c.oi * 100 * spot * spot * 0.01;
  const dex = c.dexStrike ?? sign * (c.delta || 0) * c.oi * 100 * spot;
  const vex = c.vexStrike ?? sign * (c.vega || 0) * c.oi * 100;
  return { gex, dex, vex };
}

// ============================================================
// Eligibility gate (Part 0.3 / Part 10B — NET-NEW)
// ============================================================
function evaluateEligibility(c: RankerContract, targetType: 'C' | 'P', cfg: V5Config): string[] {
  const reasons: string[] = [];
  const m = mid(c);
  if (c.type !== targetType) reasons.push(`type ${c.type} != ${targetType}`);
  if (c.bid <= 0) reasons.push('bid <= 0');
  if (m <= 0) reasons.push('mid <= 0');
  if (c.oi < cfg.minOI) reasons.push(`OI ${c.oi} < ${cfg.minOI}`);
  if (c.volume < cfg.minVolume) reasons.push(`volume ${c.volume} < ${cfg.minVolume}`);
  const spread = m > 0 ? (c.ask - c.bid) / m : 1;
  if (spread > cfg.maxSpread) reasons.push(`spread ${(spread * 100).toFixed(1)}% > ${(cfg.maxSpread * 100).toFixed(0)}%`);
  const absDelta = Math.abs(c.delta);
  if (absDelta < cfg.deltaMin || absDelta > cfg.deltaMax) reasons.push(`|delta| ${absDelta.toFixed(2)} outside [${cfg.deltaMin},${cfg.deltaMax}]`);
  return reasons;
}

// ============================================================
// Part 5 — EMA path target + repriced return
// ============================================================
function nextUnhitEma(spot: number, direction: 'bullish' | 'bearish', emaTargets: EmaTargets): number | null {
  const vals = EMA_KEYS.map((k) => emaTargets[k]).filter((v) => isFinite(v) && v > 0);
  if (direction === 'bullish') {
    const ahead = vals.filter((v) => v > spot).sort((a, b) => a - b);
    return ahead.length ? ahead[0] : null;
  }
  const ahead = vals.filter((v) => v < spot).sort((a, b) => b - a);
  return ahead.length ? ahead[0] : null;
}

function repricedReturn(c: RankerContract, spot: number, target: number, dteDays: number, cfg: V5Config): number {
  const isCall = c.type === 'C';
  const now = computeBlackScholesPrice(spot, c.strike, dteDays, c.iv, isCall);
  if (!(now > 0)) return 0;
  const movePct = 100 * (target - spot) / spot;            // signed
  const sigmaTarget = Math.max(cfg.SIGMA_FLOOR, c.iv + cfg.SPOT_VOL_BETA * movePct); // skew-adjusted (Part 5.2)
  // T_target = T_now (conservative — understates theta; acceptable for v1, flagged)
  const at = computeBlackScholesPrice(target, c.strike, dteDays, sigmaTarget, isCall);
  return (at - now) / now;
}

// ============================================================
// Main ranker (spec Parts 2–8)
// ============================================================
export function rankContracts(input: RankInput): RankedCandidate[] {
  const cfg: V5Config = { ...DEFAULT_V5_CONFIG, ...(input.config || {}) };
  const { spot, direction, dteDays, emaTargets, dataSource, store } = input;
  const targetType: 'C' | 'P' = direction === 'bullish' ? 'C' : 'P';
  const dir = direction === 'bullish' ? 1 : -1;

  // Eligibility → candidate set C (eligible, matching targetType).
  const evaluated = input.chain.map((c) => ({ c, reasons: evaluateEligibility(c, targetType, cfg) }));
  const C = evaluated.filter((e) => e.reasons.length === 0).map((e) => e.c);

  // OI-by-strike map across ALL target-type contracts (neighbors may be ineligible).
  const targetContracts = input.chain.filter((c) => c.type === targetType);
  const oiByStrike = new Map<number, number>();
  for (const c of targetContracts) oiByStrike.set(c.strike, c.oi);
  const sortedStrikes = [...oiByStrike.keys()].sort((a, b) => a - b);
  const strikeIndex = new Map<number, number>();
  sortedStrikes.forEach((s, i) => strikeIndex.set(s, i));

  // ---- Cross-sectional sets over C (computed before per-candidate scoring) ----
  const nbrsOf = (c: RankerContract): number => {
    const idx = strikeIndex.get(c.strike);
    if (idx === undefined) return 1;
    const [w1, w2, w3] = cfg.neighborWeights;
    const w = [w1, w2, w3];
    let num = 0, W = 0;
    for (let k = 1; k <= 3; k++) {
      const up = sortedStrikes[idx + k]; const dn = sortedStrikes[idx - k];
      if (up !== undefined) { num += w[k - 1] * (oiByStrike.get(up) || 0); W += w[k - 1]; }
      if (dn !== undefined) { num += w[k - 1] * (oiByStrike.get(dn) || 0); W += w[k - 1]; }
    }
    const weightedNeighborOI = W > 0 ? num / W : 0;
    return c.oi / Math.max(weightedNeighborOI, 1);
  };

  const wallMagSet = C.map((c) => Math.abs(exposures(c, spot).gex));
  const alignSet = C.map((c) => {
    const { gex, dex, vex } = exposures(c, spot);
    const signed = cfg.exposureWeights.gex * gex + cfg.exposureWeights.dex * dex + cfg.exposureWeights.vex * vex;
    return cfg.ACCEL_SIGN * dir * signed;
  });
  const speedSet = C.map((c) => (c.speed || 0) * Math.abs((nextUnhitEma(spot, direction, emaTargets) ?? spot) - spot));

  const out: RankedCandidate[] = evaluated.map(({ c, reasons }) => {
    const eligible = reasons.length === 0;
    const flags: string[] = [];
    const distanceFromSpotPct = spot > 0 ? 100 * (c.strike - spot) / spot : 0;

    // Default neutral output for ineligible candidates (not scored cross-sectionally).
    if (!eligible) {
      return {
        symbol: c.symbol, strike: c.strike, type: c.type, eligible: false, rejectReasons: reasons,
        positioningScore: 0, dealerInfluenceScore: 0, accelerationScore: 0, emaPathScore: 0, liquidityScore: 0,
        skyScore: 0, convexityScore: 0, convexityStatus: 'Flat', isExplosive: false,
        nbrs: 0, oiVelocity: 0, volumeExpansion: c.rvol ?? 0, gammaVelocity: 0, distanceFromSpotPct,
        emaReturns: { ema5: 0, ema9: 0, ema20: 0, ema50: 0, ema200: 0 }, flags, data_source: dataSource,
      };
    }

    // ---------- Part 2: Positioning ----------
    const nbrs = nbrsOf(c);
    const nbrsScore = normLogSaturate(nbrs, cfg.NBRS_CAP);
    const oiVelocity = dataSource === 'SIMULATED' ? 0 : (c.oi - (c.oiPriorSession ?? c.oi));
    if (dataSource === 'SIMULATED') flags.push('positioning:simulated-degraded');
    const oivScore = normSignedTanh(oiVelocity, cfg.OIV_SCALE);
    const positioningScore = 0.60 * nbrsScore + 0.40 * oivScore;

    // ---------- Part 3: Dealer influence ----------
    const { gex, dex, vex } = exposures(c, spot);
    const wallMagScore = normCrossSection(Math.abs(gex), wallMagSet);
    const signed = cfg.exposureWeights.gex * gex + cfg.exposureWeights.dex * dex + cfg.exposureWeights.vex * vex;
    const alignRaw = cfg.ACCEL_SIGN * dir * signed;
    const alignScore = normCrossSection(alignRaw, alignSet);
    const dealerInfluenceScore = cfg.dealerWallMagWeight * wallMagScore + cfg.dealerAlignWeight * alignScore;

    // ---------- Part 4: Acceleration (velocity reads the snapshot store) ----------
    const ve = (c.rvol ?? 1);
    const veScore = normSignedTanh(ve - 1, cfg.VE_SCALE);
    const key = SnapshotStore.key(c.symbol, c.expiration, c.strike, c.type);
    const prev = store ? store.prior(key, cfg.LOOKBACK_BARS) : null;
    let gammaVelocity = 0;
    let gammaVelScore = 50, vexVelScore = 50;
    if (prev) {
      gammaVelocity = gex - prev.gexStrike;
      gammaVelScore = normSignedTanh(gammaVelocity, cfg.GVEL_SCALE);
      vexVelScore = normSignedTanh(vex - prev.vexStrike, cfg.VVEL_SCALE);
    } else {
      flags.push('acceleration:no-prior-snapshot');
    }
    const accelerationScore = 0.40 * veScore + 0.35 * gammaVelScore + 0.25 * vexVelScore;

    // ---------- Part 5: EMA path ----------
    const target = nextUnhitEma(spot, direction, emaTargets);
    let emaPathScore = 50;
    if (target === null) {
      flags.push('emapath:no_target_ahead');
    } else {
      const ret = repricedReturn(c, spot, target, dteDays, cfg);
      emaPathScore = normSignedTanh(ret, cfg.EMA_RET_SCALE);
    }
    flags.push('emapath:T_target=T_now'); // conservative theta (Part 5.2)
    const emaReturns = EMA_KEYS.reduce((acc, k) => {
      acc[k] = Number((100 * repricedReturn(c, spot, emaTargets[k], dteDays, cfg)).toFixed(2));
      return acc;
    }, {} as Record<keyof EmaTargets, number>) as RankedCandidate['emaReturns'];

    // ---------- Part 6: Liquidity (reuse v11Math.computeLiquidityScore) ----------
    const priorMids = store ? store.recentMids(key) : [];
    const liquidityScore = computeLiquidityScore(c.bid, c.ask, c.volume, c.oi, priorMids).liquidityScore;

    // ---------- Part 7: SkyScore ----------
    const skyScore =
      cfg.weights.positioning * positioningScore +
      cfg.weights.dealer * dealerInfluenceScore +
      cfg.weights.acceleration * accelerationScore +
      cfg.weights.emaPath * emaPathScore +
      cfg.weights.liquidity * liquidityScore;

    // ---------- Part 8: V5.1 Convexity ----------
    const vannaVelScore = prev ? normSignedTanh(vex - prev.vexStrike, cfg.VVEL_SCALE) : 50;
    const speedLevelScore = normCrossSection((c.speed || 0) * Math.abs((target ?? spot) - spot), speedSet);
    const convexityScore = 100 * clamp(
      cfg.convexityWeights.gammaVel * unit(gammaVelScore) +
      cfg.convexityWeights.vannaVel * unit(vannaVelScore) +
      cfg.convexityWeights.speed * unit(speedLevelScore), 0, 1);
    const convexityStatus: RankedCandidate['convexityStatus'] =
      convexityScore >= 80 ? 'Rising Fast' : convexityScore >= 60 ? 'Rising' : convexityScore >= 40 ? 'Flat' : 'Falling';

    const isExplosive = skyScore >= cfg.isExplosiveSky && convexityScore >= cfg.isExplosiveConvexity;

    // Record this scan's snapshot for next time (velocity is computed BEFORE this).
    if (store) {
      store.record(key, {
        ts: Date.now(), gexStrike: gex, vexStrike: vex,
        gamma: c.gamma || 0, vanna: c.vanna || 0, oi: c.oi, volume: c.volume, mid: mid(c),
      });
    }

    return {
      symbol: c.symbol, strike: c.strike, type: c.type, eligible: true, rejectReasons: [],
      positioningScore: round(positioningScore), dealerInfluenceScore: round(dealerInfluenceScore),
      accelerationScore: round(accelerationScore), emaPathScore: round(emaPathScore), liquidityScore: round(liquidityScore),
      skyScore: round(skyScore), convexityScore: round(convexityScore), convexityStatus, isExplosive,
      nbrs: Number(nbrs.toFixed(2)), oiVelocity, volumeExpansion: ve, gammaVelocity, distanceFromSpotPct: Number(distanceFromSpotPct.toFixed(2)),
      emaReturns, flags, data_source: dataSource,
    };
  });

  // Eligible first, sorted by SkyScore desc; ineligible after.
  return out.sort((a, b) => {
    if (a.eligible !== b.eligible) return a.eligible ? -1 : 1;
    return b.skyScore - a.skyScore;
  });
}

function round(x: number): number { return Number(x.toFixed(2)); }
