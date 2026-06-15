/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Pinpoint AI — dealer gamma cartography. Renders a strike ladder of dealer
 * positioning (support / resistance / magnet) with GEX-dollar magnitude bars,
 * anchored against live spot, gamma flip and the call/put walls.
 */

import { useMemo } from 'react';
import { Crosshair, Magnet, ArrowUp, ArrowDown, CircleDot } from 'lucide-react';
import { useContractStore } from '../lib/store';
import type { PinLevel } from '../lib/store';

const TYPE_META: Record<PinLevel['type'], { color: string; bar: string; icon: typeof Magnet; label: string }> = {
  resistance: { color: 'text-rose-400', bar: 'bg-rose-500/70', icon: ArrowUp, label: 'Resistance' },
  support: { color: 'text-emerald-400', bar: 'bg-emerald-500/70', icon: ArrowDown, label: 'Support' },
  magnet: { color: 'text-amber-400', bar: 'bg-amber-500/70', icon: Magnet, label: 'Magnet' },
};

function fmtDollars(v: number): string {
  const abs = Math.abs(v);
  if (abs >= 1e9) return `$${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `$${(abs / 1e6).toFixed(0)}M`;
  if (abs >= 1e3) return `$${(abs / 1e3).toFixed(0)}K`;
  return `$${abs.toFixed(0)}`;
}

export function PinpointAIView() {
  const activeContract = useContractStore((s) => s.activeContract);
  const serverState = useContractStore((s) => s.serverState);
  const selectedAsset = useContractStore((s) => s.selectedAsset);

  const decimals = selectedAsset?.decimals ?? 0;
  const pinpoint = activeContract?.pinpoint;
  const spot = pinpoint?.spotPrice || serverState?.pinpoint_map?.spot_price || selectedAsset?.defaultPrice || 0;
  const gex = serverState?.gex_profile;

  const levels = useMemo(() => {
    const raw: PinLevel[] = pinpoint?.levels || [];
    const maxDollars = Math.max(1, ...raw.map((l) => Math.abs(l.dollars)));
    return raw
      .slice()
      .sort((a, b) => b.strike - a.strike)
      .map((l) => ({ ...l, pct: (Math.abs(l.dollars) / maxDollars) * 100 }));
  }, [pinpoint]);

  const headStats = [
    { label: 'Spot', value: spot ? spot.toFixed(decimals) : '—', color: 'text-white' },
    { label: 'Gamma Flip', value: gex?.gammaFlip ? gex.gammaFlip.toFixed(decimals) : '—', color: 'text-violet-400' },
    { label: 'Call Wall', value: gex?.callWall ? gex.callWall.toFixed(decimals) : '—', color: 'text-emerald-400' },
    { label: 'Put Wall', value: gex?.putWall ? gex.putWall.toFixed(decimals) : '—', color: 'text-rose-400' },
  ];

  return (
    <div className="w-full text-zinc-200 font-mono">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
        <div>
          <h2 className="text-[13px] font-black tracking-widest text-[#e4e4e7] uppercase flex items-center gap-2">
            <Crosshair className="w-4 h-4 text-emerald-400" />
            Pinpoint Gamma Map
          </h2>
          <p className="text-[9px] text-zinc-500 uppercase tracking-widest mt-1">
            Per-strike dealer exposure & hedging-pressure cartography for {selectedAsset?.ticker}.
          </p>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {headStats.map((s) => (
            <div key={s.label} className="bg-[#0c0c0e] border border-zinc-900 px-3 py-2 rounded-lg text-center">
              <div className="text-[8px] text-zinc-500 uppercase font-black tracking-widest">{s.label}</div>
              <div className={`text-[12px] font-bold ${s.color}`}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      {levels.length === 0 ? (
        <div className="py-16 text-center bg-black/40 border border-zinc-900 rounded-lg flex flex-col items-center justify-center">
          <Crosshair className="w-8 h-8 text-zinc-800 animate-pulse mb-3" />
          <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-black">
            Awaiting dealer positioning data — select a contract to map.
          </div>
        </div>
      ) : (
        <div className="bg-[#08080a] border border-zinc-900 rounded-xl p-4 space-y-1.5">
          {levels.map((l) => {
            const meta = TYPE_META[l.type] || TYPE_META.magnet;
            const Icon = meta.icon;
            const isNearSpot = spot && Math.abs(l.strike - spot) / spot < 0.0015;
            return (
              <div key={l.strike} className="relative">
                {isNearSpot && (
                  <div className="absolute -left-1 top-1/2 -translate-y-1/2 flex items-center gap-1 z-10">
                    <CircleDot className="w-3 h-3 text-sky-400 animate-pulse" />
                  </div>
                )}
                <div
                  className={`flex items-center gap-3 py-1.5 px-2 rounded-md ${
                    isNearSpot ? 'bg-sky-500/5 border border-sky-500/20' : ''
                  }`}
                >
                  <span className={`w-16 shrink-0 text-[12px] font-black ${meta.color}`}>
                    {l.strike.toFixed(decimals)}
                  </span>
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${meta.color}`} />
                  <div className="flex-1 h-2.5 bg-zinc-900 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${meta.bar}`} style={{ width: `${l.pct}%` }} />
                  </div>
                  <span className="w-20 shrink-0 text-right text-[10px] font-bold text-zinc-300">
                    {fmtDollars(l.dollars)}
                  </span>
                  <span className="w-14 shrink-0 text-right text-[8.5px] uppercase tracking-widest text-zinc-600 font-black hidden sm:inline">
                    {meta.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Net exposure footer */}
      {gex && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          {[
            { label: 'Net GEX', value: fmtDollars(gex.netGex || 0), positive: (gex.netGex || 0) >= 0 },
            { label: 'Net DEX', value: fmtDollars(gex.netDex || 0), positive: (gex.netDex || 0) >= 0 },
            { label: 'Expected Move', value: `${(gex.expectedMovePct || 0).toFixed(2)}%`, positive: true },
            { label: 'C/P OI Ratio', value: gex.callPutOiRatio || '—', positive: true },
          ].map((m) => (
            <div key={m.label} className="bg-black/50 border border-zinc-900 rounded-lg p-3">
              <div className="text-[8px] text-zinc-500 uppercase font-black tracking-widest">{m.label}</div>
              <div className={`text-[14px] font-black mt-0.5 ${m.positive ? 'text-emerald-400' : 'text-rose-400'}`}>
                {m.value}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default PinpointAIView;
