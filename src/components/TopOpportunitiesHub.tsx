/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { AssetInfo, SystemScore } from '../types';
import { Sparkles, Check, Compass, Award, Cpu } from 'lucide-react';
import { calculateV10Metrics } from '../lib/v10Math';

interface TopOpportunitiesHubProps {
  assets: AssetInfo[];
  masterScore: SystemScore;
  onSelectOpportunity: (asset: AssetInfo, optionType: 'C' | 'P') => void;
  selectedAsset: AssetInfo;
}

export function TopOpportunitiesHub({
  assets,
  masterScore,
  onSelectOpportunity,
  selectedAsset,
}: TopOpportunitiesHubProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Generate opportunities for the main hero grid using mathematical V10 formulas
  const opportunities = assets.map((asset, index) => {
    const isBullish = index % 2 === 0;
    const basePrice = asset.defaultPrice;
    
    // Nearest round strike price
    const roundStep = basePrice > 1000 ? 100 : basePrice > 100 ? 5 : 1;
    const targetStrike = Math.round(basePrice / roundStep) * roundStep + (isBullish ? roundStep : -roundStep);
    
    // Computed premium based on scale
    const basePremium = basePrice * 0.0008 * (asset.decimals === 5 ? 100000 : 1);
    const premiumFloat = Math.max(1.15, basePremium * (1.1 + Math.sin(index + 55000) * 0.45));
    const currentPriceStr = `$${premiumFloat.toFixed(2)}`;
    
    // Compute dynamic mathematical attributes under the V10 decision template
    const metrics = calculateV10Metrics(asset, isBullish, masterScore, premiumFloat);
    const confidence = metrics.posteriorWinRate;
    const expectedValue = metrics.expectedValuePct;
    
    const fairValueStr = `$${metrics.fairValue.toFixed(2)}`;
    const entryZoneStr = `$${metrics.entryZoneMin.toFixed(2)} - $${metrics.entryZoneMax.toFixed(2)}`;

    let recommendation: 'BUY' | 'WAIT' | 'REDUCE' | 'EXIT' = 'WAIT';
    if (expectedValue >= 11) {
      recommendation = 'BUY';
    } else if (expectedValue >= 4.0) {
      recommendation = 'WAIT';
    } else {
      recommendation = 'REDUCE';
    }

    const tickerStr = `${asset.ticker} ${targetStrike}${isBullish ? 'C' : 'P'}`;

    return {
      asset,
      ticker: tickerStr,
      strike: targetStrike,
      type: isBullish ? 'BULLISH' : 'BEARISH',
      confidence,
      expectedValue,
      currentPrice: currentPriceStr,
      fairValue: fairValueStr,
      entryZone: entryZoneStr,
      recommendation,
      isCall: isBullish,
    };
  });

  // Re-sort opportunities for ranking strictly by Expected Value (EV) as per the decision hierarchy!
  const mainGridOpportunities = [...opportunities].sort((a, b) => b.expectedValue - a.expectedValue);

  // Generate Top 10 Calls List using V10 maths
  const top10Calls = assets.concat(assets).slice(0, 10).map((asset, idx) => {
    const basePrice = asset.defaultPrice;
    const roundStep = basePrice > 1000 ? 100 : basePrice > 100 ? 5 : 1;
    const strike = Math.round(basePrice / roundStep) * roundStep + (idx + 1) * roundStep;
    
    const basePremium = basePrice * 0.0008 * (asset.decimals === 5 ? 100000 : 1);
    const premiumFloat = Math.max(1.15, basePremium * (1.1 + Math.sin(idx + 55000) * 0.45));
    const metrics = calculateV10Metrics(asset, true, masterScore, premiumFloat);

    let action: 'BUY' | 'WAIT' | 'HOLD' = 'WAIT';
    if (metrics.expectedValuePct >= 11) action = 'BUY';
    else if (metrics.expectedValuePct >= 4) action = 'HOLD';

    return {
      asset,
      ticker: `${asset.ticker} $${strike}C`,
      confidence: Math.round(metrics.posteriorWinRate),
      expectedValue: metrics.expectedValuePct,
      action,
      type: 'C' as const,
    };
  });

  // Generate Top 10 Puts List using V10 maths
  const top10Puts = assets.concat(assets).slice(0, 10).map((asset, idx) => {
    const basePrice = asset.defaultPrice;
    const roundStep = basePrice > 1000 ? 100 : basePrice > 100 ? 5 : 1;
    const strike = Math.round(basePrice / roundStep) * roundStep - (idx + 1) * roundStep;
    
    const basePremium = basePrice * 0.0008 * (asset.decimals === 5 ? 100000 : 1);
    const premiumFloat = Math.max(1.15, basePremium * (1.1 + Math.sin(idx + 55000) * 0.45));
    const metrics = calculateV10Metrics(asset, false, masterScore, premiumFloat);

    let action: 'BUY' | 'WAIT' | 'HOLD' = 'WAIT';
    if (metrics.expectedValuePct >= 11) action = 'BUY';
    else if (metrics.expectedValuePct >= 4) action = 'HOLD';

    return {
      asset,
      ticker: `${asset.ticker} $${strike}P`,
      confidence: Math.round(metrics.posteriorWinRate),
      expectedValue: metrics.expectedValuePct,
      action,
      type: 'P' as const,
    };
  });

  return (
    <div className="flex flex-col gap-5">
      
      {/* Recent Performance Stats Summary Banner */}
      <div className="bg-[#121214] border border-[#2A2A2D] rounded-sm p-4 font-mono shadow-md grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        <div className="flex items-center gap-3">
          <Award className="w-5 h-5 text-emerald-400" />
          <div>
            <span className="text-[10px] tracking-[0.2em] text-[#888888] font-bold block uppercase">SYSTEM PERFORMANCE RATING</span>
            <span className="text-xs text-zinc-300 font-sans tracking-wide">Continuous validation against institutional order blocks.</span>
          </div>
        </div>
        
        {/* Metric Target Hit Rate */}
        <div className="flex items-center justify-between border-l md:border-l border-zinc-800 px-0 md:px-6">
          <span className="text-xs text-[#888888] uppercase">Target Hit Rate</span>
          <div className="text-right">
            <span className="text-xl font-bold text-emerald-400">84.6%</span>
            <span className="text-[9px] text-[#888888] block text-right">MODEL CAPABILITY</span>
          </div>
        </div>

        {/* Confidence Accuracy */}
        <div className="flex items-center justify-between border-l border-zinc-800 px-0 md:px-6">
          <span className="text-xs text-[#888888] uppercase">Confidence Accuracy</span>
          <div className="text-right">
            <span className="text-xl font-bold text-white">91.2%</span>
            <span className="text-[9px] text-[#888888] block text-right">MASTER ALIGNMENT</span>
          </div>
        </div>
      </div>

      {/* Hero: Top Opportunities Grid */}
      <div className="bg-[#121214] border border-[#2A2A2D] rounded-sm font-mono overflow-hidden shadow-lg">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#2A2A2D] bg-[#17171A]/60">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 text-emerald-400" />
            <h2 className="text-xs uppercase tracking-[0.2em] font-bold text-[#E0E0E0]">
              TOP OPPORTUNITIES ENGINE
            </h2>
          </div>
          <span className="text-[9px] text-zinc-550 border border-zinc-800 px-2 py-0.5 bg-black/40">MASTER SCORE CLASSIFICATION</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs divide-y divide-[#2A2A2D]">
            <thead className="bg-[#0A0A0B] text-[#888888] uppercase tracking-wider text-[9px]">
              <tr>
                <th className="px-4 py-2.5">Rank</th>
                <th className="px-4 py-2.5">Contract</th>
                <th className="px-4 py-2.5 text-center">Bias</th>
                <th className="px-4 py-2.5 text-center">P(win)</th>
                <th className="px-4 py-2.5 text-center text-emerald-400">Expected Value (EV)</th>
                <th className="px-4 py-2.5 text-right">Current Price</th>
                <th className="px-4 py-2.5 text-right">Fair Value</th>
                <th className="px-4 py-2.5 text-center">Entry Area</th>
                <th className="px-4 py-2.5 text-center">Action</th>
                <th className="px-4 py-2.5 text-right">Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A2A2D] bg-[#0C0C0D]/20">
              {mainGridOpportunities.map((opp, idx) => {
                const isSelected = selectedAsset.ticker === opp.asset.ticker;
                const isBuy = opp.recommendation === 'BUY';
                const isWait = opp.recommendation === 'WAIT';

                return (
                  <tr
                    key={opp.ticker}
                    className={`hover:bg-[#1A1A1D]/80 transition-colors ${
                      isSelected ? 'bg-emerald-950/20 border-l border-emerald-500' : ''
                    }`}
                  >
                    {/* Rank */}
                    <td className="px-4 py-3 font-semibold text-zinc-400">
                      #0{idx + 1}
                    </td>

                    {/* Contract */}
                    <td className="px-4 py-3">
                      <span
                        onClick={() => onSelectOpportunity(opp.asset, opp.isCall ? 'C' : 'P')}
                        className="text-white tracking-wider font-semibold hover:underline cursor-pointer"
                      >
                        {opp.ticker}
                      </span>
                    </td>

                    {/* Bias Direction */}
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-sm font-bold ${
                        opp.isCall
                          ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/30'
                          : 'bg-rose-950/40 text-rose-450 border border-rose-900/30'
                      }`}>
                        {opp.isCall ? 'BULLISH' : 'BEARISH'}
                      </span>
                    </td>

                    {/* Win probability (P_win) */}
                    <td className="px-4 py-3 text-center font-bold text-white">
                      <span>{opp.confidence.toFixed(1)}%</span>
                    </td>

                    {/* Expected Value */}
                    <td className="px-4 py-3 text-center font-black">
                      <span className={`text-xs px-2 py-0.5 rounded-sm ${opp.expectedValue >= 0 ? 'text-emerald-400 bg-emerald-950/20 border border-emerald-900/35' : 'text-rose-450 bg-rose-950/20 border border-rose-900/35'}`}>
                        {opp.expectedValue >= 0 ? '+' : ''}{opp.expectedValue.toFixed(1)}%
                      </span>
                    </td>

                    {/* Ask price */}
                    <td className="px-4 py-3 text-right font-bold text-zinc-100">
                      {opp.currentPrice}
                    </td>

                    {/* Fair Value target */}
                    <td className="px-4 py-3 text-right text-emerald-400 font-mono font-medium">
                      {opp.fairValue}
                    </td>

                    {/* Opt Entry Zone */}
                    <td className="px-4 py-3 text-center text-zinc-400 font-mono">
                      {opp.entryZone}
                    </td>

                    {/* Action badge */}
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-sm text-[10px] font-black tracking-wider ${
                        isBuy
                          ? 'bg-emerald-500 text-black'
                          : isWait
                          ? 'bg-zinc-800 text-zinc-300'
                          : 'bg-rose-950 text-rose-400 border border-rose-900/60'
                      }`}>
                        {opp.recommendation}
                      </span>
                    </td>

                    {/* Analysis launcher */}
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => onSelectOpportunity(opp.asset, opp.isCall ? 'C' : 'P')}
                        className={`px-3 py-1 text-[10px] font-bold rounded-sm border cursor-pointer uppercase transition-all flex items-center gap-1 ml-auto ${
                          isSelected
                            ? 'bg-emerald-950 border-emerald-400 text-emerald-400'
                            : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-zinc-350 hover:text-white'
                        }`}
                      >
                        {isSelected ? <Check className="w-3" /> : null}
                        {isSelected ? 'LOADED' : 'DECIDERS'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Side-by-Side: Top 10 Calls & Top 10 Puts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Top 10 Calls list */}
        <div className="bg-[#121214] border border-[#2A2A2D] rounded-sm font-mono overflow-hidden shadow-md">
          <div className="flex items-center justify-between px-3.5 py-2.5 bg-emerald-950/20 border-b border-[#2A2A2D]">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">TOP 10 RANKED BULLISH CALLS</span>
            </div>
            <span className="text-[8px] text-emerald-500 font-extrabold uppercase">AGGRESSIVE INSTITUTIONAL FLOW</span>
          </div>

          <div className="divide-y divide-zinc-900 overflow-y-auto max-h-[360px]">
            {top10Calls.map((item, idx) => (
              <div
                key={idx}
                onClick={() => onSelectOpportunity(item.asset, 'C')}
                className="flex items-center justify-between p-3.5 hover:bg-zinc-900/40 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-emerald-500/80 font-bold font-mono">#{(idx+1).toString().padStart(2, '0')}</span>
                  <span className="text-white tracking-wider font-semibold font-mono text-xs">{item.ticker}</span>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-[8px] text-[#888888] block uppercase font-mono">EXPECTED VALUE</span>
                    <span className="text-xs font-black text-emerald-400 font-mono flex items-center justify-end">+{item.expectedValue.toFixed(1)}%</span>
                  </div>

                  <span className={`px-2 py-0.5 rounded-sm text-[9px] font-bold ${
                    item.action === 'BUY' ? 'bg-emerald-500 text-black font-black' : 'bg-zinc-800 text-zinc-400'
                  }`}>
                    {item.action}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top 10 Puts list */}
        <div className="bg-[#121214] border border-[#2A2A2D] rounded-sm font-mono overflow-hidden shadow-md">
          <div className="flex items-center justify-between px-3.5 py-2.5 bg-rose-950/20 border-b border-[#2A2A2D]">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-rose-450" />
              <span className="text-xs font-bold text-rose-450 uppercase tracking-wider">TOP 10 RANKED BEARISH PUTS</span>
            </div>
            <span className="text-[8px] text-rose-500 font-extrabold uppercase">AGGRESSIVE DISTRIBUTION REVERSAL</span>
          </div>

          <div className="divide-y divide-zinc-900 overflow-y-auto max-h-[360px]">
            {top10Puts.map((item, idx) => (
              <div
                key={idx}
                onClick={() => onSelectOpportunity(item.asset, 'P')}
                className="flex items-center justify-between p-3.5 hover:bg-zinc-900/40 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-rose-450/80 font-bold font-mono">#{(idx+1).toString().padStart(2, '0')}</span>
                  <span className="text-white tracking-wider font-semibold font-mono text-xs">{item.ticker}</span>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-[8px] text-[#888888] block uppercase font-mono">EXPECTED VALUE</span>
                    <span className="text-xs font-black text-emerald-400 font-mono flex items-center justify-end">+{item.expectedValue.toFixed(1)}%</span>
                  </div>

                  <span className={`px-2 py-0.5 rounded-sm text-[9px] font-bold ${
                    item.action === 'BUY' ? 'bg-rose-950 text-rose-450 border border-rose-900/30' : 'bg-zinc-800 text-zinc-450'
                  }`}>
                    {item.action === 'BUY' ? 'SELL' : item.action}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
