/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * V5 SkyScore acceptance tests (spec Part 10). Plain assert + tsx style.
 * Run: npx tsx tests/skyScore.test.ts
 */

import assert from 'assert';
import { normSignedTanh, normCrossSection, percentile } from '../src/lib/normalize';
import { rankContracts, RankerContract, EmaTargets, DEFAULT_V5_CONFIG } from '../src/lib/skyScore';

let passed = 0;
const ok = (cond: boolean, msg: string) => { assert.ok(cond, msg); passed++; console.log('  ✓', msg); };

const EMAS: EmaTargets = { ema5: 105, ema9: 108, ema20: 112, ema50: 120, ema200: 90 };

function mk(p: Partial<RankerContract>): RankerContract {
  return {
    symbol: 'SPX', expiration: '2026-06-20', strike: 100, type: 'C',
    oi: 1000, volume: 500, bid: 2.0, ask: 2.05, iv: 0.20,
    delta: 0.5, gamma: 0.02, vega: 0.1, theta: -0.5,
    ...p,
  };
}

console.log('--- V5 SKYSCORE ACCEPTANCE SUITE ---');

// ---- Test A: normalizers + degenerate sets ----
console.log('A. Normalizers / degenerate sets');
ok(normSignedTanh(0, 5000) === 50, 'normSignedTanh(0, s) === 50 (zero change = neutral)');
ok(normCrossSection(5, [5]) === 50, 'normCrossSection(x, [x]) === 50 (single-value set)');
ok(normSignedTanh(0, 0) === 50, 'normSignedTanh(d, 0) === 50 (no scale → neutral, no NaN)');
ok(percentile([], 50) === 0 && isFinite(percentile([7], 90)), 'percentile guards empty/single');
{
  const single = rankContracts({
    direction: 'bullish', spot: 100, dteDays: 5, dataSource: 'SIMULATED', emaTargets: EMAS,
    chain: [mk({ strike: 100 }), mk({ strike: 105, type: 'P', delta: -0.5 })], // 1 eligible call, 1 put (wrong type)
  });
  const elig = single.filter((c) => c.eligible);
  ok(elig.length === 1, 'single-candidate set: exactly one eligible');
  ok(elig[0].dealerInfluenceScore === 50, 'single-candidate cross-section score === 50');
  ok(single.every((c) => [c.skyScore, c.positioningScore, c.dealerInfluenceScore, c.accelerationScore, c.emaPathScore, c.liquidityScore].every(isFinite)), 'no NaN/Infinity in any score');
}

// ---- Test B: eligibility gate ----
console.log('B. Eligibility gate');
{
  const base = { direction: 'bullish' as const, spot: 100, dteDays: 5, dataSource: 'SIMULATED' as const, emaTargets: EMAS };
  const reasonFor = (p: Partial<RankerContract>) => rankContracts({ ...base, chain: [mk(p)] })[0];
  ok(reasonFor({ oi: 100 }).rejectReasons.some((r) => r.includes('OI')), 'rejects OI < 250');
  ok(reasonFor({ volume: 50 }).rejectReasons.some((r) => r.includes('volume')), 'rejects volume < 100');
  ok(reasonFor({ bid: 2.0, ask: 2.6 }).rejectReasons.some((r) => r.includes('spread')), 'rejects spread > 12%');
  ok(reasonFor({ delta: 0.10 }).rejectReasons.some((r) => r.includes('delta')), 'rejects |delta| < 0.30');
  ok(reasonFor({ delta: 0.80 }).rejectReasons.some((r) => r.includes('delta')), 'rejects |delta| > 0.60');
  ok(reasonFor({ bid: 0 }).rejectReasons.some((r) => r.includes('bid')), 'rejects bid <= 0');
  ok(reasonFor({}).eligible === true, 'clean contract passes all filters');
}

// ---- Test C-Positioning: NBRS weighted-average ----
console.log('C. Positioning — NBRS weighted average');
{
  // 7 calls; center 100 OI=12400, all neighbors OI=1000 -> weighted neighbor OI = 1000 -> NBRS = 12.4
  const strikes = [85, 90, 95, 100, 105, 110, 115];
  const chain = strikes.map((s) => mk({ strike: s, oi: s === 100 ? 12400 : 1000 }));
  const res = rankContracts({ direction: 'bullish', spot: 100, dteDays: 5, dataSource: 'SIMULATED', emaTargets: EMAS, chain });
  const center = res.find((c) => c.strike === 100)!;
  ok(Math.abs(center.nbrs - 12.4) < 0.01, `NBRS matches weighted-average formula (${center.nbrs} ≈ 12.40)`);
  // NBRS 12.4 with cap 12 -> nbrsScore = 100; positioning = 0.6*100 + 0.4*50(SIM oiv) = 80
  ok(Math.abs(center.positioningScore - 80) < 0.01, '12.4× NBRS → nbrsScore≈100 → positioning≈80 (SIM)');
}

// ---- Test C-Dealer: ACCEL_SIGN flips the ranking ----
console.log('C. Dealer — ACCEL_SIGN wired (flip inverts ranking)');
{
  const dealerOnly = { weights: { positioning: 0, dealer: 1, acceleration: 0, emaPath: 0, liquidity: 0 } };
  const A = mk({ symbol: 'AAA', strike: 100, gexStrike: 2e9, dexStrike: 0, vexStrike: 0 });
  const B = mk({ symbol: 'BBB', strike: 200, gexStrike: -2e9, dexStrike: 0, vexStrike: 0 });
  const base = { direction: 'bullish' as const, spot: 150, dteDays: 5, dataSource: 'SIMULATED' as const, emaTargets: EMAS, chain: [A, B] };
  const plus = rankContracts({ ...base, config: { ...dealerOnly, ACCEL_SIGN: 1 } });
  const minus = rankContracts({ ...base, config: { ...dealerOnly, ACCEL_SIGN: -1 } });
  ok(plus[0].strike === 100, 'ACCEL_SIGN=+1 → strike 100 ranks #1');
  ok(minus[0].strike === 200, 'ACCEL_SIGN=-1 → ranking inverts, strike 200 ranks #1');
}

// ---- Test C-EMAPath: skew adjustment is active (beta=0 widens low-delta gap) ----
console.log('C. EMA Path — skew adjustment active');
{
  const emas2: EmaTargets = { ema5: 106, ema9: 110, ema20: 115, ema50: 125, ema200: 90 };
  const low = mk({ symbol: 'LOW', strike: 106, delta: 0.33, iv: 0.30 });   // OTM at spot, ATM at target
  const near = mk({ symbol: 'NEAR', strike: 97, delta: 0.58, iv: 0.30 });   // ITM call (less vega-sensitive)
  const base = { direction: 'bullish' as const, spot: 100, dteDays: 14, dataSource: 'SIMULATED' as const, emaTargets: emas2, chain: [low, near] };
  const withSkew = rankContracts({ ...base, config: { SPOT_VOL_BETA: -0.012 } });
  const noSkew = rankContracts({ ...base, config: { SPOT_VOL_BETA: 0 } });
  const ret = (r: any[], sym: string) => r.find((c) => c.symbol === sym)!.emaReturns.ema5;
  const gapSkew = ret(withSkew, 'LOW') - ret(withSkew, 'NEAR');
  const gapNoSkew = ret(noSkew, 'LOW') - ret(noSkew, 'NEAR');
  ok(ret(noSkew, 'LOW') > ret(withSkew, 'LOW'), 'beta=0 raises the low-delta EMA return vs skew-adjusted');
  ok(gapNoSkew > gapSkew, 'beta=0 widens low-delta advantage (proves skew term is active)');
}

// ---- Test E: stability + breakdown sums into SkyScore ----
console.log('E. Stability + breakdown reconciliation');
{
  const chain = [85, 90, 95, 100, 105, 110].map((s) => mk({ strike: s, oi: 1000 + s, volume: 300 + s }));
  const inp = { direction: 'bullish' as const, spot: 100, dteDays: 5, dataSource: 'SIMULATED' as const, emaTargets: EMAS, chain };
  const r1 = rankContracts(inp);
  const r2 = rankContracts(inp);
  ok(JSON.stringify(r1.map((c) => [c.strike, c.skyScore])) === JSON.stringify(r2.map((c) => [c.strike, c.skyScore])), 'identical inputs → identical ranking');
  const w = DEFAULT_V5_CONFIG.weights;
  const top = r1[0];
  const recon = w.positioning * top.positioningScore + w.dealer * top.dealerInfluenceScore + w.acceleration * top.accelerationScore + w.emaPath * top.emaPathScore + w.liquidity * top.liquidityScore;
  ok(Math.abs(recon - top.skyScore) < 0.6, `component breakdown reconciles to SkyScore (${recon.toFixed(2)} ≈ ${top.skyScore})`);
}

console.log(`\n--- V5 SUITE PASSED: ${passed} assertions ---`);
