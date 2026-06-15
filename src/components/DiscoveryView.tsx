/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Discovery Radar. Streams the server's live contract-discovery feed
 * (/api/stream/discovery) and renders ranked opportunity cards grouped by shelf,
 * with model-mispricing context. Selecting a card promotes it into the cockpit.
 */

import { useEffect, useMemo, useState } from 'react';
import { Radar, Activity, Zap, TrendingUp, TrendingDown, Gauge } from 'lucide-react';
import { AssetInfo } from '../types';
import { ASSET_LIST } from '../data';

interface DiscoveryContract {
  id: string;
  ticker: string;
  strike: number;
  isCall: boolean;
  health: number;
  expectedMove?: string;
  action?: 'ENTER' | 'HOLD' | 'REDUCE' | 'EXIT';
  narrative?: string;
  tagText?: string;
  shelf?: string;
  price?: number;
  volume?: number;
}

interface DiscoveryPayload {
  contracts: DiscoveryContract[];
  feedLogs: any[];
  brierScore: number;
  globalGex: number;
  scanRate: number;
}

interface DiscoveryViewProps {
  systemScore?: any;
  discovery?: any;
  onSelectContract?: (asset: AssetInfo, strike: number, isCall: boolean) => void;
}

const ACTION_STYLE: Record<string, string> = {
  ENTER: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
  HOLD: 'text-sky-400 border-sky-500/30 bg-sky-500/10',
  REDUCE: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
  EXIT: 'text-rose-400 border-rose-500/30 bg-rose-500/10',
};

function assetFor(ticker: string): AssetInfo {
  return ASSET_LIST.find((a) => a.ticker === ticker) || ASSET_LIST[0];
}

export function DiscoveryView({ systemScore, discovery, onSelectContract }: DiscoveryViewProps) {
  const [data, setData] = useState<DiscoveryPayload | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let es: EventSource | null = null;
    try {
      es = new EventSource('/api/stream/discovery');
      es.onopen = () => setConnected(true);
      es.onmessage = (evt) => {
        try {
          setData(JSON.parse(evt.data));
        } catch {
          /* ignore malformed frame */
        }
      };
      es.onerror = () => setConnected(false);
    } catch {
      setConnected(false);
    }
    return () => es?.close();
  }, []);

  const scoreTotal =
    typeof systemScore === 'number' ? systemScore : Number(systemScore?.total ?? 0);

  const contracts = data?.contracts || [];
  const mispriced: any[] = discovery?.mispricedCalls || [];

  const shelves = useMemo(() => {
    const map = new Map<string, DiscoveryContract[]>();
    for (const c of contracts) {
      const key = (c.shelf || 'signals').toUpperCase();
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(c);
    }
    return Array.from(map.entries());
  }, [contracts]);

  return (
    <div className="w-full text-zinc-200 font-mono">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
        <div>
          <h2 className="text-[13px] font-black tracking-widest text-[#e4e4e7] uppercase flex items-center gap-2">
            <Radar className={`w-4 h-4 ${connected ? 'text-emerald-400 animate-pulse' : 'text-zinc-600'}`} />
            Discovery Radar
          </h2>
          <p className="text-[9px] text-zinc-500 uppercase tracking-widest mt-1">
            Continuous scan of dealer-positioned, model-mispriced contracts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {[
            { label: 'Scan Rate', value: `${(data?.scanRate ?? 0).toFixed(1)}/s`, icon: Activity, color: 'text-sky-400' },
            { label: 'Brier', value: (data?.brierScore ?? 0).toFixed(3), icon: Gauge, color: 'text-violet-400' },
            { label: 'Sys Score', value: scoreTotal.toFixed(0), icon: Zap, color: 'text-emerald-400' },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="bg-[#0c0c0e] border border-zinc-900 px-3 py-2 rounded-lg">
                <span className="text-[8px] text-zinc-500 uppercase font-black tracking-widest flex items-center gap-1">
                  <Icon className={`w-3 h-3 ${stat.color}`} /> {stat.label}
                </span>
                <span className="text-[12px] font-bold text-white">{stat.value}</span>
              </div>
            );
          })}
        </div>
      </div>

      {contracts.length === 0 && mispriced.length === 0 ? (
        <div className="py-16 text-center bg-black/40 border border-zinc-900 rounded-lg flex flex-col items-center justify-center">
          <Radar className="w-8 h-8 text-zinc-800 animate-pulse mb-3" />
          <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-black">
            {connected ? 'Scanning for convergence…' : 'Connecting to discovery feed…'}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {shelves.map(([shelf, items]) => (
            <div key={shelf}>
              <div className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-2 flex items-center gap-2">
                <span className="h-px flex-1 bg-zinc-900" />
                {shelf}
                <span className="h-px flex-1 bg-zinc-900" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {items.map((c) => {
                  const actionCls = ACTION_STYLE[c.action || 'HOLD'] || ACTION_STYLE.HOLD;
                  return (
                    <button
                      key={c.id}
                      onClick={() => onSelectContract?.(assetFor(c.ticker), c.strike, c.isCall)}
                      className="text-left bg-[#0c0c0e]/90 border border-zinc-900 rounded-xl p-4 hover:border-zinc-700 transition-colors duration-200 group relative overflow-hidden"
                    >
                      <div
                        className={`absolute top-0 left-0 right-0 h-[2px] ${c.isCall ? 'bg-emerald-500/70' : 'bg-rose-500/70'}`}
                      />
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <span className="text-[15px] font-black text-white">
                            {c.ticker} {c.strike}
                            <span className={c.isCall ? 'text-emerald-400' : 'text-rose-400'}>
                              {c.isCall ? 'C' : 'P'}
                            </span>
                          </span>
                          {c.tagText && (
                            <div className="text-[8px] font-black uppercase tracking-widest text-zinc-500 mt-0.5">
                              {c.tagText}
                            </div>
                          )}
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${actionCls}`}>
                          {c.action || 'HOLD'}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-400 leading-snug line-clamp-2 mb-3 min-h-[28px]">
                        {c.narrative || 'Model convergence detected.'}
                      </p>
                      <div className="flex items-center justify-between text-[9px] uppercase tracking-widest font-black">
                        <span className="text-zinc-500 flex items-center gap-1">
                          {c.isCall ? <TrendingUp className="w-3 h-3 text-emerald-500" /> : <TrendingDown className="w-3 h-3 text-rose-500" />}
                          Health {c.health}
                        </span>
                        <span className={c.expectedMove?.startsWith('-') ? 'text-rose-400' : 'text-emerald-400'}>
                          {c.expectedMove || '—'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {mispriced.length > 0 && (
            <div>
              <div className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-2 flex items-center gap-2">
                <span className="h-px flex-1 bg-zinc-900" />
                MODEL MISPRICING
                <span className="h-px flex-1 bg-zinc-900" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {mispriced.map((m, i) => (
                  <button
                    key={`${m.asset?.ticker}-${m.strike}-${i}`}
                    onClick={() => m.asset && onSelectContract?.(m.asset, m.strike, !!m.isCall)}
                    className="text-left bg-[#0c0c0e]/90 border border-zinc-900 rounded-xl p-4 hover:border-emerald-500/30 transition-colors duration-200"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[13px] font-black text-white">
                        {m.asset?.ticker} {m.strike}
                        <span className="text-emerald-400">{m.isCall ? 'C' : 'P'}</span>
                      </span>
                      <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">{m.discount}</span>
                    </div>
                    <div className="flex justify-between text-[9px] text-zinc-500 uppercase tracking-widest">
                      <span>Mkt ${Number(m.marketPrice).toFixed(2)}</span>
                      <span className="text-zinc-300">Model ${Number(m.modelValue).toFixed(2)}</span>
                    </div>
                    <p className="text-[9px] text-zinc-500 mt-2 line-clamp-1">{m.status}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Feed log ticker */}
      {data?.feedLogs && data.feedLogs.length > 0 && (
        <div className="mt-6 bg-black/40 border border-zinc-900 rounded-lg p-3 max-h-32 overflow-y-auto">
          <span className="text-[8px] text-zinc-600 uppercase font-black tracking-widest">Scanner Telemetry</span>
          <div className="mt-1.5 space-y-1">
            {data.feedLogs.slice(0, 8).map((log: any, i: number) => (
              <div key={i} className="text-[9px] text-zinc-500 font-mono truncate">
                {typeof log === 'string' ? log : log?.text || log?.message || log?.label || JSON.stringify(log)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default DiscoveryView;
