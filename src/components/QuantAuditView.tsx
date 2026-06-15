/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Quant Audit — trust & calibration engine. Aggregates the trade archive into
 * win-rate / profit-factor / expectancy stats and renders a searchable, expandable
 * ledger of every recorded trade outcome.
 */

import { useMemo } from 'react';
import {
  ShieldCheck,
  Search,
  Trash2,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  CircleCheck,
  CircleX,
  Clock,
} from 'lucide-react';
import { AssetInfo, V8TradeRecord } from '../types';
import { useContractStore } from '../lib/store';

interface QuantAuditViewProps {
  selectedAsset: AssetInfo;
  isCall: boolean;
  systemScore?: any;
  optionPremium?: number;
  trades: V8TradeRecord[];
  onClearTrades: () => void;
}

function isWin(t: V8TradeRecord): boolean {
  return typeof t.finalOutcome === 'string' && t.finalOutcome.includes('Winner');
}
function isActive(t: V8TradeRecord): boolean {
  return t.finalOutcome === 'Active';
}

export function QuantAuditView({
  selectedAsset,
  systemScore,
  trades,
  onClearTrades,
}: QuantAuditViewProps) {
  const auditSearchQuery = useContractStore((s) => s.auditSearchQuery);
  const setAuditSearchQuery = useContractStore((s) => s.setAuditSearchQuery);
  const expandedAuditId = useContractStore((s) => s.expandedAuditId);
  const setExpandedAuditId = useContractStore((s) => s.setExpandedAuditId);

  const safeTrades = trades || [];

  const stats = useMemo(() => {
    const completed = safeTrades.filter((t) => !isActive(t));
    const wins = completed.filter(isWin);
    const losses = completed.filter((t) => t.finalOutcome === 'Failure');
    const grossWin = wins.reduce((sum, t) => sum + Math.max(0, t.maxGain || 0), 0);
    const grossLoss = losses.reduce((sum, t) => sum + Math.abs(t.maxDrawdown || 0), 0);
    const winRate = completed.length ? (wins.length / completed.length) * 100 : 0;
    const profitFactor = grossLoss > 0 ? grossWin / grossLoss : grossWin > 0 ? 99 : 0;
    const avgExpectancy = completed.length
      ? completed.reduce((sum, t) => sum + (t.expectedReturn || 0), 0) / completed.length
      : 0;
    return {
      total: safeTrades.length,
      completed: completed.length,
      winRate,
      profitFactor,
      avgExpectancy,
    };
  }, [safeTrades]);

  const filtered = useMemo(() => {
    const q = auditSearchQuery.trim().toLowerCase();
    if (!q) return safeTrades;
    return safeTrades.filter((t) =>
      [t.underlying, t.contract, t.finalOutcome, t.direction]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(q)),
    );
  }, [safeTrades, auditSearchQuery]);

  const scoreTotal = typeof systemScore === 'number' ? systemScore : Number(systemScore?.total ?? 0);

  const statCards = [
    { label: 'Total Trades', value: String(stats.total), color: 'text-white' },
    { label: 'Win Rate', value: `${stats.winRate.toFixed(0)}%`, color: stats.winRate >= 50 ? 'text-emerald-400' : 'text-amber-400' },
    { label: 'Profit Factor', value: stats.profitFactor.toFixed(2), color: stats.profitFactor >= 1.5 ? 'text-emerald-400' : 'text-rose-400' },
    { label: 'Avg Expectancy', value: `${stats.avgExpectancy.toFixed(0)}%`, color: stats.avgExpectancy >= 0 ? 'text-emerald-400' : 'text-rose-400' },
    { label: 'Live Sys Score', value: scoreTotal.toFixed(0), color: 'text-sky-400' },
  ];

  return (
    <div className="w-full text-zinc-200 font-mono">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5">
        <div>
          <h2 className="text-[13px] font-black tracking-widest text-[#e4e4e7] uppercase flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            Trust Archive & Registry
          </h2>
          <p className="text-[9px] text-zinc-500 uppercase tracking-widest mt-1">
            Immutable post-trade calibration ledger · {selectedAsset?.ticker}
          </p>
        </div>
        <button
          onClick={onClearTrades}
          className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-rose-400 border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 px-3 py-2 rounded-lg transition-colors"
        >
          <Trash2 className="w-3 h-3" /> Clear Archive
        </button>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
        {statCards.map((c) => (
          <div key={c.label} className="bg-[#0c0c0e] border border-zinc-900 rounded-lg p-3">
            <div className="text-[8px] text-zinc-500 uppercase font-black tracking-widest">{c.label}</div>
            <div className={`text-xl font-black mt-1 ${c.color}`}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
        <input
          value={auditSearchQuery}
          onChange={(e) => setAuditSearchQuery(e.target.value)}
          placeholder="Filter by ticker, contract, or outcome…"
          className="w-full bg-black/50 border border-zinc-900 rounded-lg pl-9 pr-3 py-2.5 text-[11px] text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-700"
        />
      </div>

      {/* Trade ledger */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center bg-black/40 border border-zinc-900 rounded-lg flex flex-col items-center justify-center">
          <ShieldCheck className="w-8 h-8 text-zinc-800 mb-3" />
          <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-black">
            {safeTrades.length === 0 ? 'No trades recorded yet' : 'No trades match filter'}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((t) => {
            const won = isWin(t);
            const active = isActive(t);
            const expanded = expandedAuditId === t.id;
            const OutcomeIcon = active ? Clock : won ? CircleCheck : CircleX;
            const outcomeColor = active ? 'text-sky-400' : won ? 'text-emerald-400' : 'text-rose-400';
            const DirIcon = t.direction === 'BULLISH' ? TrendingUp : TrendingDown;
            return (
              <div key={t.id} className="bg-[#0c0c0e]/90 border border-zinc-900 rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedAuditId(expanded ? null : t.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors text-left"
                >
                  <OutcomeIcon className={`w-4 h-4 shrink-0 ${outcomeColor}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-black text-white truncate">{t.contract}</span>
                      <DirIcon className={`w-3 h-3 ${t.direction === 'BULLISH' ? 'text-emerald-500' : 'text-rose-500'}`} />
                    </div>
                    <div className="text-[8.5px] text-zinc-600 uppercase tracking-widest mt-0.5 truncate">
                      {t.timestamp} · {t.finalOutcome}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className={`text-[13px] font-black ${(t.maxGain || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {(t.maxGain || 0) >= 0 ? '+' : ''}
                      {(t.maxGain || 0).toFixed(1)}%
                    </div>
                    <div className="text-[8px] text-zinc-600 uppercase tracking-widest">max gain</div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-zinc-600 shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                </button>
                {expanded && (
                  <div className="px-4 pb-4 pt-1 border-t border-zinc-900/60 grid grid-cols-2 md:grid-cols-4 gap-3 text-[10px]">
                    {[
                      { k: 'Entry', v: `$${(t.entryPrice || 0).toFixed(2)}` },
                      { k: 'Recommendation', v: t.recommendation },
                      { k: 'Prob +', v: `${t.probabilityPositive}%` },
                      { k: 'Thesis Stability', v: `${t.thesisStability}%` },
                      { k: 'Exp. Return', v: `${t.expectedReturn}%` },
                      { k: 'Max Drawdown', v: `${(t.maxDrawdown || 0).toFixed(1)}%` },
                      { k: 'Time Taken', v: `${t.timeTaken}m` },
                      { k: 'First Target', v: t.whatTargetReachedFirst || '—' },
                    ].map((d) => (
                      <div key={d.k}>
                        <div className="text-zinc-600 uppercase tracking-widest text-[8px] font-black">{d.k}</div>
                        <div className="text-zinc-200 font-bold mt-0.5">{d.v}</div>
                      </div>
                    ))}
                    {t.failureReasons && t.failureReasons.length > 0 && (
                      <div className="col-span-2 md:col-span-4">
                        <div className="text-rose-500/80 uppercase tracking-widest text-[8px] font-black">Failure Reasons</div>
                        <div className="text-zinc-400 mt-0.5">{t.failureReasons.join(' · ')}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default QuantAuditView;
