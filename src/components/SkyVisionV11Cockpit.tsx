/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * SkyVision V11 quantitative decision cockpit. Renders the weighted system-score
 * breakdown, the derived decision tier (0-14) and the active contract framing.
 */

import { useMemo } from 'react';
import { AssetInfo, SystemScore } from '../types';
import { Gauge, TrendingUp, TrendingDown, Layers, Cpu } from 'lucide-react';

interface SkyVisionV11CockpitProps {
  asset: AssetInfo;
  isCall: boolean;
  score: SystemScore;
  optionPremium: number;
  optionStrike: number;
}

const FACTOR_LABELS: { key: keyof SystemScore; label: string }[] = [
  { key: 'displacementQuality', label: 'Displacement Quality' },
  { key: 'volumeExpansion', label: 'Volume Expansion' },
  { key: 'rsiCascade', label: 'RSI Cascade' },
  { key: 'vwapAlignment', label: 'VWAP Alignment' },
  { key: 'structureQuality', label: 'Structure Quality' },
  { key: 'liquiditySweep', label: 'Liquidity Sweep' },
  { key: 'htfAgreement', label: 'HTF Agreement' },
  { key: 'volatilityRegime', label: 'Volatility Regime' },
  { key: 'premiumDiscount', label: 'Premium / Discount' },
  { key: 'momentumAcceleration', label: 'Momentum Accel.' },
];

export function SkyVisionV11Cockpit({
  asset,
  isCall,
  score,
  optionPremium,
  optionStrike,
}: SkyVisionV11CockpitProps) {
  const safeScore: SystemScore = score || ({ total: 0 } as SystemScore);
  const total = safeScore.total || 0;

  const { tier, factors, maxFactor } = useMemo(() => {
    const factors = FACTOR_LABELS.map((f) => ({
      ...f,
      value: Number(safeScore[f.key] ?? 0),
    }));
    const maxFactor = Math.max(1, ...factors.map((f) => Math.abs(f.value)));
    const tier = Math.min(14, Math.max(0, Math.round((total / 100) * 14)));
    return { tier, factors, maxFactor };
  }, [safeScore, total]);

  const bias = isCall ? 'BULLISH' : 'BEARISH';
  const biasColor = isCall ? 'text-emerald-400' : 'text-rose-400';
  const BiasIcon = isCall ? TrendingUp : TrendingDown;

  const tierColor =
    tier >= 11 ? 'text-emerald-400' : tier >= 6 ? 'text-sky-400' : tier >= 3 ? 'text-amber-400' : 'text-zinc-400';

  return (
    <div className="w-full bg-[#08080a] border border-zinc-850 rounded-sm p-4 font-mono text-zinc-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-900 pb-3 mb-4">
        <span className="text-xs font-black tracking-widest text-zinc-400 uppercase flex items-center gap-2">
          <Cpu className="w-4 h-4 text-sky-500" />
          SkyVision V11 · Decision Engine
        </span>
        <span className={`text-[9.5px] font-black uppercase tracking-widest flex items-center gap-1.5 ${biasColor}`}>
          <BiasIcon className="w-3.5 h-3.5" /> {bias}
        </span>
      </div>

      {/* Top metric row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <div className="bg-black/50 border border-zinc-900 rounded-lg p-3">
          <span className="text-[8.5px] uppercase tracking-widest text-zinc-500 font-black flex items-center gap-1.5">
            <Gauge className="w-3 h-3 text-sky-500" /> System Score
          </span>
          <div className="text-2xl font-black text-white mt-1">{total.toFixed(0)}</div>
        </div>
        <div className="bg-black/50 border border-zinc-900 rounded-lg p-3">
          <span className="text-[8.5px] uppercase tracking-widest text-zinc-500 font-black flex items-center gap-1.5">
            <Layers className="w-3 h-3 text-violet-400" /> Decision Tier
          </span>
          <div className={`text-2xl font-black mt-1 ${tierColor}`}>
            {tier}
            <span className="text-zinc-600 text-sm">/14</span>
          </div>
        </div>
        <div className="bg-black/50 border border-zinc-900 rounded-lg p-3">
          <span className="text-[8.5px] uppercase tracking-widest text-zinc-500 font-black">Target Strike</span>
          <div className="text-2xl font-black text-white mt-1">
            {optionStrike?.toFixed(asset?.decimals ?? 0)}
            <span className={`text-sm ml-1 ${biasColor}`}>{isCall ? 'C' : 'P'}</span>
          </div>
        </div>
        <div className="bg-black/50 border border-zinc-900 rounded-lg p-3">
          <span className="text-[8.5px] uppercase tracking-widest text-zinc-500 font-black">Option Premium</span>
          <div className="text-2xl font-black text-white mt-1">${(optionPremium || 0).toFixed(2)}</div>
        </div>
      </div>

      {/* Factor breakdown */}
      <div className="space-y-2">
        <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-black">
          Weighted Factor Breakdown · {asset?.ticker}
        </span>
        {factors.map((f) => {
          const pct = Math.min(100, (Math.abs(f.value) / maxFactor) * 100);
          const positive = f.value >= 0;
          return (
            <div key={f.key} className="flex items-center gap-3">
              <span className="text-[9.5px] text-zinc-400 w-36 shrink-0 truncate">{f.label}</span>
              <div className="flex-1 h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${positive ? 'bg-emerald-500/80' : 'bg-rose-500/80'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className={`text-[9.5px] font-black w-12 text-right ${positive ? 'text-emerald-400' : 'text-rose-400'}`}>
                {f.value.toFixed(1)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default SkyVisionV11Cockpit;
