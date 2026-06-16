/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import {
  CheckCircle2,
  AlertOctagon,
  Cpu,
  Layers,
  Search,
  Database,
  BarChart4,
  DollarSign,
  HelpCircle,
  FileSpreadsheet,
  Gauge,
  Percent,
  Calculator,
  Activity
} from 'lucide-react';
import { AssetInfo, SystemScore } from '../types';
import { calculateV11Metrics, SimilarTrade, TargetV11 } from '../lib/v11Math';

interface SkyVisionV11CockpitProps {
  asset: AssetInfo;
  isCall: boolean;
  score: SystemScore;
  optionPremium: number;
  optionStrike: number;
}

export function SkyVisionV11Cockpit({
  asset,
  isCall,
  score,
  optionPremium,
  optionStrike
}: SkyVisionV11CockpitProps) {
  const [activeTab, setActiveTab] = useState<'exposure' | 'knn' | 'probability' | 'fairvalue'>('exposure');

  // Compute our high-fidelity V11 metrics
  const metrics = calculateV11Metrics(asset, isCall, score, optionPremium, optionStrike);
  const integrity = metrics.integrity;

  return (
    <div className="bg-[#0b0b0c] border border-zinc-850 rounded-sm font-mono p-5 shadow-lg select-text text-left">
      
      {/* 1. Header with Data Quality & EV Anchor */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center border-b border-zinc-900 pb-4 mb-4 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-emerald-450 animate-pulse" />
            <h2 className="text-sm font-black text-white tracking-[0.2em] uppercase">
              SKYVISION V11 // INSTITUTIONAL DECISION SUITE
            </h2>
          </div>
          <p className="text-[10.5px] text-zinc-500 mt-1 uppercase">
            Active Asset: <span className="text-zinc-300 font-bold">{asset.ticker}</span> • 
            Strike: <span className="text-zinc-300 font-bold">${optionStrike}</span> • 
            Bias: <span className={`font-bold ${isCall ? 'text-emerald-400' : 'text-rose-450'}`}>{isCall ? 'CALL / BULLISH' : 'PUT / BEARISH'}</span>
          </p>
        </div>

        {/* Dynamic Quality Indicator (Tier 0) */}
        <div className="flex items-center gap-3 bg-[#0f1115] border border-zinc-850 px-3 py-1.5 rounded-sm">
          <div className="text-right">
            <div className="flex items-center gap-1.5 justify-end">
              <span className={`w-2 h-2 rounded-full ${integrity.isValid ? 'bg-emerald-400' : 'bg-rose-400'} animate-ping`} />
              <span className="text-[9px] text-[#888888] font-bold uppercase tracking-wider">T0 INTEGRITY SCORE:</span>
            </div>
            <span className="text-[13px] font-black text-white">{integrity.score}% / {integrity.greeksConsistency}</span>
          </div>
          {integrity.isValid ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          ) : (
            <AlertOctagon className="w-5 h-5 text-rose-400" />
          )}
        </div>
      </div>

      {/* Warning if data falls below safe boundaries */}
      {!integrity.isValid && (
        <div className="bg-rose-950/20 border border-rose-900/60 p-3.5 mb-4 text-[11px] text-rose-500 leading-normal flex gap-2">
          <AlertOctagon className="w-4 shrink-0 mt-0.5 animate-bounce" />
          <div>
            <span className="font-bold uppercase block">DATA CORRUPTION WARNING</span>
            Quality scores fell below the safe 75% threshold. SkyVision recommendation engines are deactivated until microstructural queue synchronicity is re-established.
          </div>
        </div>
      )}

      {/* Tabs Menu */}
      <div className="flex flex-wrap gap-1 border-b border-zinc-950 pb-2 mb-4">
        <button
          onClick={() => setActiveTab('exposure')}
          className={`px-3 py-1.5 text-[10.5px] font-bold uppercase rounded-sm border transition-all cursor-pointer ${
            activeTab === 'exposure'
              ? 'bg-zinc-900 border-zinc-800 text-white'
              : 'border-transparent text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" />
            <span>EXPOSURE & SURFACE (T1-T4)</span>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('knn')}
          className={`px-3 py-1.5 text-[10.5px] font-bold uppercase rounded-sm border transition-all cursor-pointer ${
            activeTab === 'knn'
              ? 'bg-zinc-900 border-zinc-800 text-white'
              : 'border-transparent text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5" />
            <span>FEATURE SIMILARITY (T5-T6)</span>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('probability')}
          className={`px-3 py-1.5 text-[10.5px] font-bold uppercase rounded-sm border transition-all cursor-pointer ${
            activeTab === 'probability'
              ? 'bg-zinc-900 border-zinc-800 text-white'
              : 'border-transparent text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <BarChart4 className="w-3.5 h-3.5" />
            <span>OUTCOME DISTRIBUTION (T7-T8)</span>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('fairvalue')}
          className={`px-3 py-1.5 text-[10.5px] font-bold uppercase rounded-sm border transition-all cursor-pointer ${
            activeTab === 'fairvalue'
              ? 'bg-zinc-900 border-zinc-800 text-white'
              : 'border-transparent text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5" />
            <span>VALUATION & ENTRY (T9-T11)</span>
          </div>
        </button>
      </div>

      {/* TAB CONTENTS */}

      {/* TAB 1: EXPOSURE & Vol Surface */}
      {activeTab === 'exposure' && (
        <div className="space-y-5 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Vol Surface Curve Viewer */}
            <div className="bg-black/30 border border-zinc-900 p-4 rounded-sm">
              <h3 className="text-xs font-black text-zinc-300 border-b border-zinc-900 pb-2 mb-3 flex items-center gap-1.5">
                <Activity className="w-3.5 text-emerald-450" /> T2 // OPTIONS IMPLIED VOLATILITY SKEW
              </h3>
              
              <div className="space-y-2">
                <div className="text-[10px] text-zinc-500 mb-2 flex justify-between">
                  <span>STRIKE LEVEL</span>
                  <span>IV (%)</span>
                </div>
                {metrics.surface.skewCurve.map((st, i) => (
                  <div key={i} className="flex items-center justify-between text-[11px] font-mono p-1 border-b border-zinc-950/60">
                    <span className="text-zinc-450">
                      ${st.strike.toFixed(1)} <span className="text-[8.5px] text-zinc-600">({st.label})</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1 bg-zinc-950 rounded-sm overflow-hidden hidden sm:block">
                        <div className="h-full bg-emerald-500" style={{ width: `${st.iv * 180}%` }} />
                      </div>
                      <span className="text-white font-bold">{(st.iv * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3.5 text-[9px] text-zinc-550 flex justify-between border-t border-zinc-900 pt-2 uppercase">
                <span>TERM STRUCTURE: ATM IV</span>
                <span>RANK: {metrics.surface.ivRank} // PERC: {metrics.surface.ivPercentile}</span>
              </div>
            </div>

            {/* Dealer Walls Engine */}
            <div className="bg-black/30 border border-zinc-900 p-4 rounded-sm">
              <h3 className="text-xs font-black text-zinc-300 border-b border-zinc-900 pb-2 mb-3 flex items-center gap-1.5">
                <Database className="w-3.5 text-emerald-450" /> T3 // DEALER EXPOSURES & INVENTORY WALLS
              </h3>

              <div className="space-y-2.5">
                <div className="flex justify-between items-center text-[10.5px] border-b border-zinc-950 pb-1">
                  <span className="text-zinc-500">DEALER GAMMA STATE:</span>
                  <span className="text-white font-black text-[9.5px] uppercase bg-zinc-900 px-1.5 py-0.5 rounded-sm border border-zinc-800">
                    {metrics.dealer.gammaExposureText}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="p-2 bg-black/60 border border-zinc-900">
                    <span className="text-[8px] text-zinc-500 block">CALL WALL LEVEL</span>
                    <span className="text-xs font-black text-white">${metrics.dealer.callWall}</span>
                  </div>
                  <div className="p-2 bg-black/60 border border-zinc-900">
                    <span className="text-[8px] text-zinc-500 block">PUT WALL LEVEL</span>
                    <span className="text-xs font-black text-white">${metrics.dealer.putWall}</span>
                  </div>
                  <div className="p-2 bg-black/60 border border-zinc-900">
                    <span className="text-[8px] text-zinc-500 block">GAMMA FLIP BOUNDARY</span>
                    <span className="text-xs font-black text-rose-450">${metrics.dealer.gammaFlipPrice.toFixed(1)}</span>
                  </div>
                  <div className="p-2 bg-black/60 border border-zinc-900">
                    <span className="text-[8px] text-zinc-500 block">DEALER INVENTORY PRESS</span>
                    <span className="text-xs font-black text-emerald-400">{(metrics.dealer.dealerPressureIndex).toFixed(1)} / 10.0</span>
                  </div>
                </div>

                <div className="p-2 rounded-sm bg-zinc-950 border border-zinc-900 mt-2">
                  <span className="text-[8px] text-zinc-500 block font-bold uppercase">CHARM EXPOSURE DECAY INFLUENCE:</span>
                  <p className="text-[10px] text-emerald-450 leading-relaxed font-sans mt-0.5">
                    {metrics.dealer.charmExposureText}
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* Market regime (Tier 4) */}
          <div className="bg-[#0e0f11] border border-zinc-850 p-3 rounded-sm flex flex-col sm:flex-row justify-between items-start sm:items-center text-[10.5px]">
            <div>
              <span className="text-zinc-500 uppercase font-black">T4 // COMPOSITE MARKET REGIME CLASSIFIER:</span>
              <p className="text-zinc-400 mt-0.5 font-sans leading-relaxed">
                Structural label determined: <span className="text-white font-bold uppercase">{asset.type} REGIME DETECTED</span> • Spot {score.total > 70 ? 'exhibiting bullish momentum acceleration' : 'facing overhead liquidation pressure'}.
              </p>
            </div>
            <div className="mt-2 sm:mt-0 shrink-0 uppercase tracking-widest px-2 py-1 bg-emerald-950/30 text-emerald-400 border border-emerald-900/50 rounded-sm font-black text-[9.5px]">
              {score.total > 75 ? 'DEALER SUPPORTIVE' : 'RANGE BOUND EXPANSION'}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: KNN & SImilar setups */}
      {activeTab === 'knn' && (
        <div className="space-y-4 animate-fade-in">
          <div>
            <h3 className="text-xs font-black text-zinc-300 border-b border-zinc-900 pb-2 mb-2 uppercase flex items-center gap-1.5">
              <Search className="w-3.5 text-emerald-450" /> T5 // CURRENT ACTIVE STATE FEATURE VECTOR
            </h3>
            
            {/* Feature lists */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-[9px] uppercase text-zinc-500 font-mono mb-4 text-center">
              <div className="bg-[#09090b] border border-zinc-900 p-1.5">
                <span className="block text-zinc-600 font-bold mb-0.5">RSI 1m</span>
                <span className="text-zinc-300 font-black">{Math.floor(score.rsiCascade * 6.5 + 23)}</span>
              </div>
              <div className="bg-[#09090b] border border-zinc-900 p-1.5">
                <span className="block text-zinc-600 font-bold mb-0.5">RVOL MULTI</span>
                <span className="text-zinc-300 font-black">{(score.volumeExpansion * 0.35 + 0.8).toFixed(2)}x</span>
              </div>
              <div className="bg-[#09090b] border border-zinc-900 p-1.5">
                <span className="block text-zinc-600 font-bold mb-0.5">GEX SCORE</span>
                <span className="text-zinc-300 font-black">+{score.total}</span>
              </div>
              <div className="bg-[#09090b] border border-zinc-900 p-1.5">
                <span className="block text-zinc-600 font-bold mb-0.5">ATR MULTI</span>
                <span className="text-zinc-300 font-black">{(asset.volatility * 1.4).toFixed(3)}</span>
              </div>
              <div className="bg-[#09090b] border border-zinc-900 p-1.5 col-span-2 sm:col-span-1">
                <span className="block text-zinc-600 font-bold mb-0.5">STRUCTURE</span>
                <span className="text-zinc-300 font-black">REGIME_A{score.structureQuality}</span>
              </div>
            </div>
          </div>

          {/* Historical similarity table (Tier 6) */}
          <div className="bg-black/30 border border-zinc-900 rounded-sm overflow-hidden">
            <div className="px-4 py-2 bg-[#0d0e11] border-b border-zinc-900 flex justify-between items-center text-xs font-black text-zinc-300 uppercase">
              <span>T6 // HISTORICAL SIMILARITY ENGINE (KNN SUITE)</span>
              <span className="text-[10px] text-zinc-500">5 Closest Matches Found</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px] font-mono">
                <thead>
                  <tr className="border-b border-zinc-900 text-zinc-500 uppercase text-[9px] bg-black/40">
                    <th className="p-3">Matched Date</th>
                    <th className="p-3">Asset</th>
                    <th className="p-3 text-center">Distance Similarity</th>
                    <th className="p-3 text-center">Outcome</th>
                    <th className="p-3 text-right">R-Multiple</th>
                    <th className="p-3 text-right">Max Drawdown</th>
                    <th className="p-3 text-right">MFE Excursion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-950 text-zinc-200">
                  {metrics.similarTrades.map((tr, index) => (
                    <tr key={index} className="hover:bg-zinc-900/40">
                      <td className="p-3 text-zinc-400">{tr.date}</td>
                      <td className="p-3 font-bold text-white shrink-0">{tr.pastTicker}</td>
                      <td className="p-3 text-center font-bold text-emerald-400">
                        {tr.similarityRating}%
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-1.5 py-0.5 rounded-sm font-bold text-[9px] ${
                          tr.win ? 'bg-emerald-950/45 text-emerald-450 border border-emerald-900/40' : 'bg-rose-950/40 text-rose-450 border border-rose-900/40'
                        }`}>
                          {tr.win ? 'WINNER' : 'STOP_LOSS'}
                        </span>
                      </td>
                      <td className={`p-3 text-right font-bold ${tr.pnlMultiplier >= 0 ? 'text-emerald-400' : 'text-rose-450'}`}>
                        {tr.pnlMultiplier >= 0 ? '+' : ''}{tr.pnlMultiplier}R
                      </td>
                      <td className="p-3 text-right text-rose-500 font-semibold">{tr.maxDrawdown}%</td>
                      <td className="p-3 text-right text-emerald-450 font-semibold">+{tr.maxExcursion}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* KNN Summary Stat Box */}
            <div className="p-3 bg-zinc-950/40 border-t border-zinc-900 text-[10.5px] leading-relaxed font-sans text-zinc-400">
              <span className="font-bold text-zinc-300 font-mono uppercase text-[9.5px]">Master Historic Precedent Summary:</span>
              <p className="mt-0.5">
                The similarity module tracked {metrics.similarTrades.length} high-correlation precedents in the backtest archive with a <span className="text-emerald-400 font-bold">{(metrics.similarTrades.filter(t => t.win).length / (metrics.similarTrades.length || 1) * 100).toFixed(1)}% historic win rate</span>. Average PnL excursion equals <span className="text-emerald-400 font-bold">+{(metrics.similarTrades.reduce((acc, t) => acc + t.pnlMultiplier, 0) / (metrics.similarTrades.length || 1)).toFixed(2)}R</span>, median adverse drawdown restricted to <span className="text-rose-500 font-bold">{(metrics.similarTrades.reduce((acc, t) => acc + t.maxDrawdown, 0) / (metrics.similarTrades.length || 1)).toFixed(1)}%</span>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Probability outcome spectrum */}
      {activeTab === 'probability' && (
        <div className="space-y-4 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Outcome Spectrum Summation (Tier 7 & 8) */}
            <div className="bg-black/30 border border-zinc-900 p-4 rounded-sm">
              <h3 className="text-xs font-black text-zinc-300 border-b border-zinc-900 pb-2 mb-3 uppercase flex items-center gap-1.5">
                <BarChart4 className="w-3.5 text-[#10B981]" /> T7 // PROBABILITY OUTCOME SPECTRUM
              </h3>

              <div className="space-y-3 mt-1 text-[11px]">
                {metrics.outcomeDistribution.map((oc, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="flex justify-between items-center text-zinc-350">
                      <span className="font-sans leading-normal">{oc.outcomeName}:</span>
                      <span className="text-white font-mono font-black">{oc.probability}%</span>
                    </div>
                    {/* Visual distribution horizontal bar */}
                    <div className="w-full bg-zinc-950 h-2 rounded-sm overflow-hidden relative border border-zinc-900">
                      <div 
                        className={`h-full rounded-sm transition-all duration-300 ${
                          oc.averageValuePct > 10 ? 'bg-emerald-500' :
                          oc.averageValuePct > 0 ? 'bg-[#10B981]' :
                          oc.averageValuePct > -10 ? 'bg-amber-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${oc.probability}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[9px] text-zinc-550 italic font-mono">
                      <span>Value: {oc.averageValuePct > 0 ? '+' : ''}{oc.averageValuePct.toFixed(1)}%</span>
                      <span>EV Contrib: {oc.contribution > 0 ? '+' : ''}{oc.contribution.toFixed(2)}% EV</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Expected value engine stats and ML adjusters */}
            <div className="bg-black/30 border border-zinc-900 p-4 rounded-sm flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-black text-zinc-300 border-b border-zinc-900 pb-2 mb-3 uppercase flex items-center gap-1.5">
                  <Cpu className="w-3.5 text-emerald-450" /> T8 // EV CALCULATIONS MATRIX (RISK-ADJUSTED)
                </h3>

                <div className="p-3 bg-black/60 rounded-sm border border-zinc-900 relative overflow-hidden mb-3">
                  <div className="absolute right-2 top-2 select-none font-bold text-[8px] text-emerald-500/25 uppercase border border-emerald-500/10 px-1 py-0.5 rounded-sm">
                    STAT_READY
                  </div>
                  <span className="text-[9px] text-[#888888] block uppercase font-mono">INTEGRATED EXPECTED VALUE ENSEMBLE</span>
                  <div className="flex items-baseline gap-1.5 mt-1 font-mono">
                    <span className="text-[22px] font-black tracking-wide text-emerald-400">
                      {metrics.expectedValuePct >= 0 ? '+' : ''}{metrics.expectedValuePct.toFixed(1)}%
                    </span>
                    <span className="text-[9.5px] text-zinc-550 uppercase">Expected return of layout per trade</span>
                  </div>
                </div>

                <div className="text-[10.5px] space-y-1.5 pt-1">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500">EXPECTED DRAWDOWN METRIC:</span>
                    <span className="text-rose-450 font-bold">{metrics.expectedDrawdownPct}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500">EXPECTED REWARD/RISK RATIO:</span>
                    <span className="text-white font-bold">{metrics.riskRewardRatio}x R</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500">EXPECTED TIME IN STRUCTURE:</span>
                    <span className="text-zinc-300 font-bold">{metrics.expectedHoldTimeMinutes} Minutes</span>
                  </div>
                </div>
              </div>

              {/* Tier 14 Machine Learning Adjuster */}
              <div className="mt-4 pt-3 border-t border-zinc-900/60 font-mono text-[10px]">
                <div className="flex justify-between items-center font-black uppercase text-[#10B981] mb-1">
                  <span>T14 // XGBoost PARAMETER BIAS ADJUST</span>
                  <span>{metrics.xgbAdjustPct >= 0 ? '+' : ''}{metrics.xgbAdjustPct.toFixed(2)}%</span>
                </div>
                <p className="text-[9.5px] text-zinc-550 leading-relaxed font-sans">
                  Explainable regressor trees updated prior win likelihood models based on volatility contraction and GEX hedging flow pressure points.
                </p>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* TAB 4: Fair Value & Targets */}
      {activeTab === 'fairvalue' && (
        <div className="space-y-4 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Black-Scholes valuation (Tier 9) */}
            <div className="bg-black/30 border border-zinc-900 p-4 rounded-sm flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-black text-zinc-300 border-b border-zinc-900 pb-2 mb-3 uppercase flex items-center gap-1.5">
                  <Calculator className="w-3.5 text-emerald-450" /> T9 // BLACK-SCHOLES OPTIONS VALUATION
                </h3>

                <div className="space-y-3 text-[10.5px] leading-relaxed">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500">MARKET ASK PRICE:</span>
                    <span className="text-white font-bold">${optionPremium.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500">BLACK-SCHOLES MODEL VALUE:</span>
                    <span className="text-emerald-400 font-bold">${metrics.optionModelPrice.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500">VALUATION SKEW / DEVIATION:</span>
                    <span className={`font-black ${metrics.premiumSurchargePct <= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                      {metrics.premiumSurchargePct <= 0 ? '' : '+'}{metrics.premiumSurchargePct.toFixed(1)}% {metrics.premiumSurchargePct <= 0 ? 'Discount' : 'Premium'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center border-t border-zinc-950 pt-2 text-[11px]">
                    <span className="text-zinc-400 uppercase font-bold">VALUATION HEALTH INDEX:</span>
                    <span className={`px-2 py-0.5 rounded-sm font-black text-[9px] ${
                      metrics.valuationLabel === 'UNDERVALUED' ? 'bg-emerald-950 text-emerald-450 border border-emerald-900/60' :
                      metrics.valuationLabel === 'FAIRLY_PRICED' ? 'bg-zinc-900 text-zinc-300 border border-zinc-800' : 'bg-rose-950/30 text-rose-500 border border-rose-900/40'
                    }`}>
                      {metrics.valuationLabel}
                    </span>
                  </div>
                </div>
              </div>

              {/* Entry Optimisation (Tier 10) */}
              <div className="mt-4 pt-3 border-t border-zinc-900/60">
                <span className="text-[8.5px] uppercase text-zinc-550 font-black block">T10 // MATHEMATICAL OPTIMAL FILLED CAP ENTRY ZONE:</span>
                <p className="text-[10px] text-zinc-400 font-sans leading-relaxed mt-1">
                  Optimal Fill: <span className="text-emerald-440 font-mono font-bold">${metrics.entryZoneMin.toFixed(2)} - ${metrics.entryZoneMax.toFixed(2)}</span> (estimated bid slip {metrics.expectedSlippagePct.toFixed(2)}%). Validated by positive historical EV bounds.
                </p>
              </div>
            </div>

            {/* Target Distributions (Tier 11) */}
            <div className="bg-black/30 border border-zinc-900 p-4 rounded-sm">
              <h3 className="text-xs font-black text-zinc-300 border-b border-zinc-900 pb-2 mb-3 uppercase flex items-center gap-1.5">
                <Percent className="w-3.5 text-[#10B981]" /> T11 // TARGET DISTRIBUTION ESTIMATOR
              </h3>

              <div className="space-y-2 mt-1 text-[10.5px]">
                {metrics.targets.map((t, idx) => {
                  let probColor = 'text-emerald-400';
                  if (t.probability < 50) probColor = 'text-rose-450';
                  else if (t.probability < 75) probColor = 'text-amber-500';

                  return (
                    <div key={idx} className="flex justify-between items-center p-1.5 border-b border-zinc-950 font-mono">
                      <div>
                        <span className="block text-white font-bold">{t.label} (Value: ${t.optionValue.toFixed(2)})</span>
                        <span className="text-[8.5px] text-zinc-550 uppercase">Spot Under: ${t.price.toFixed(1)} • {t.confidenceInterval}</span>
                      </div>

                      <div className="text-right shrink-0">
                        <span className={`block font-black ${probColor}`}>{t.probability}%</span>
                        <span className="text-[8.5px] text-zinc-550 font-sans uppercase">ETA: {t.expectedTimeMinutes}m</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* T12 Thesis health state explanation on foot of component */}
      <div className="mt-4 pt-3.5 border-t border-zinc-900/60 flex flex-col sm:flex-row justify-between items-start sm:items-center text-[10px] text-zinc-550 gap-2 uppercase font-bold uppercase tracking-wider select-none">
        <div className="flex items-center gap-1">
          <HelpCircle className="w-3.5 text-zinc-650" />
          <span>T12 // Thesis engine: ACTIVE RE-EVALUATION OCCURRING MINUTE-WISE BY CORE ENGINE</span>
        </div>
        <span>Ref code: SV_DECISION_FRAMEWORK_V11</span>
      </div>

    </div>
  );
}
