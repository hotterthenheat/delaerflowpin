/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ShieldAlert, Zap, Timer } from 'lucide-react';
import { SystemScore } from '../types';

interface MarketRegimeProps {
  score: SystemScore;
  assetTicker: string;
}

export function MarketRegimeCard({ score, assetTicker }: MarketRegimeProps) {
  const isBullish = score.vwapAlignment >= 5;
  const regimeStr = isBullish ? 'BULLISH REGIME' : 'BEARISH REGIME';
  const confidence = score.total;
  
  // Trend stability status
  let trendStability = 'STRONG';
  if (score.structureQuality >= 8) trendStability = 'EXCEPTIONAL FORCE';
  else if (score.structureQuality >= 5) trendStability = 'STABLE ACCELERATION';
  else if (score.structureQuality >= 3) trendStability = 'CONSOLIDATIVE NOISE';
  else trendStability = 'DETERIORATING';

  // Volatility and momentum indications
  const momentumState = score.momentumAcceleration >= 7 ? 'INCREASING SPEED' : 'DECELERATING / STABLE';

  return (
    <div className="bg-[#121214] border border-[#2A2A2D] rounded-sm font-mono overflow-hidden shadow-lg p-4">
      <div className="flex items-center justify-between border-b border-[#2A2A2D] pb-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="relative">
            <span className="absolute inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </div>
          <span className="text-[10px] tracking-[0.25em] text-[#888888] font-bold uppercase">GLOBAL MARKET REGIME</span>
        </div>
        <span className="text-[8px] text-[#888888]">REFRESH FEED: STREAM ACTIVE</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Regime State */}
        <div className="bg-[#0A0A0B] p-3 border-l border-[#2A2A2D]">
          <div className="flex items-center gap-1.5 text-[#888888] text-[9px] uppercase tracking-wider mb-1">
            <span className="text-[9px] font-bold">[TREND]</span> Market Regime
          </div>
          <span className={`text-sm font-bold tracking-tight uppercase ${isBullish ? 'text-emerald-400' : 'text-rose-450'}`}>
            {regimeStr}
          </span>
        </div>

        {/* Confidence rating */}
        <div className="bg-[#0A0A0B] p-3 border-l border-[#2A2A2D]">
          <div className="flex items-center gap-1.5 text-[#888888] text-[9px] uppercase tracking-wider mb-1">
            <Zap className="w-3 text-[#D97706]" />
            <span>Confidence</span>
          </div>
          <span className="text-sm font-bold tracking-tight text-white">
            {confidence}% <span className="text-[10px] text-[#888888] font-normal">ACCURACY LEVEL</span>
          </span>
        </div>

        {/* Momentum */}
        <div className="bg-[#0A0A0B] p-3 border-l border-[#2A2A2D]">
          <div className="flex items-center gap-1.5 text-[#888888] text-[9px] uppercase tracking-wider mb-1">
            <ShieldAlert className="w-3 text-zinc-400" />
            <span>Momentum</span>
          </div>
          <span className="text-sm font-bold tracking-wide text-zinc-100 uppercase">
            {score.momentumAcceleration >= 7 ? 'STRONG' : score.momentumAcceleration >= 4 ? 'MODERATE' : 'CONSOLIDATING'}
          </span>
        </div>

        {/* Participation */}
        <div className="bg-[#0A0A0B] p-3 border-l border-[#2A2A2D]">
          <div className="flex items-center gap-1.5 text-[#888888] text-[9px] uppercase tracking-wider mb-1">
            <Timer className="w-3 text-[#10B981]" />
            <span>Participation</span>
          </div>
          <span className="text-xs font-bold tracking-wide text-emerald-400 uppercase">
            {score.volumeExpansion >= 7 ? 'HIGH PARTICIPATION' : score.volumeExpansion >= 4 ? 'STABLE REGIME' : 'MUTED ACTION'}
          </span>
        </div>
      </div>
    </div>
  );
}
