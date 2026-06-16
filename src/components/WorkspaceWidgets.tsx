/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Standardized pane container + the widget library rendered inside the grid.
 * Panes are flat (1px borders, 2px max radius), with a 24px mono header.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Maximize2, Minimize2, X } from 'lucide-react';
import { useContractStore } from '../lib/store';
import { ASSET_LIST } from '../data';
import { formatPrice, formatPct } from '../lib/format';
import type { WidgetType } from '../lib/workspace';

interface PaneProps {
  title: string;
  isMaximized?: boolean;
  onClose?: () => void;
  onMaximize?: () => void;
  onHeaderPointerDown?: (e: React.PointerEvent) => void;
  children: React.ReactNode;
}

/** The uniform pane chrome: 24px mono header + scroll body + (caller adds resize handle). */
export function Pane({ title, isMaximized, onClose, onMaximize, onHeaderPointerDown, children }: PaneProps) {
  return (
    <div className="flex flex-col h-full w-full bg-[#0a0a0c] border border-[color:var(--border-color,#27272a)] rounded-[2px] overflow-hidden">
      <div
        onPointerDown={onHeaderPointerDown}
        className="h-6 shrink-0 flex items-center justify-between px-2 bg-black/60 border-b border-[color:var(--border-color,#27272a)] cursor-move select-none"
      >
        <span className="text-[9px] font-mono font-bold tracking-widest text-zinc-400 truncate">
          &gt; {title}
        </span>
        <div className="flex items-center gap-1">
          <button onClick={onMaximize} className="w-4 h-4 flex items-center justify-center text-zinc-500 hover:text-white" title={isMaximized ? 'Restore' : 'Maximize'}>
            {isMaximized ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
          </button>
          {onClose && (
            <button onClick={onClose} className="w-4 h-4 flex items-center justify-center text-zinc-500 hover:text-rose-400" title="Close">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-auto p-2.5 font-mono">{children}</div>
    </div>
  );
}

const STATUS_CLASS: Record<string, string> = {
  HOLDING: 'status-holding',
  TESTING: 'status-testing',
  FAILING: 'status-failing',
};

/** Live ticker array with the "stale data" failsafe (spec Group 3 #2). */
function LiveTickerArray() {
  const serverState = useContractStore((s) => s.serverState);
  const [lastTick, setLastTick] = useState(Date.now());
  const [stale, setStale] = useState(false);

  useEffect(() => {
    if (serverState) setLastTick(Date.now());
  }, [serverState]);

  useEffect(() => {
    const t = setInterval(() => setStale(Date.now() - lastTick > 3000), 1000);
    return () => clearInterval(t);
  }, [lastTick]);

  const statusFor = (idx: number): keyof typeof STATUS_CLASS => {
    // Deterministic-but-rotating status purely for the demo ticker.
    const v = (Math.floor(Date.now() / 4000) + idx) % 3;
    return v === 0 ? 'HOLDING' : v === 1 ? 'TESTING' : 'FAILING';
  };

  return (
    <div className={`transition-opacity duration-300 ${stale ? 'opacity-50' : ''}`}>
      <div className="flex items-center gap-1.5 mb-2">
        {stale ? (
          <>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-[8.5px] font-black tracking-widest text-amber-400">[RECONNECTING...]</span>
          </>
        ) : (
          <>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[8.5px] font-black tracking-widest text-emerald-400">LIVE</span>
          </>
        )}
      </div>
      <div className="space-y-1">
        {ASSET_LIST.slice(0, 8).map((a, i) => {
          const st = statusFor(i);
          const price = serverState?.pinpoint_map?.spot_price && a.ticker === 'SPX'
            ? serverState.pinpoint_map.spot_price
            : a.defaultPrice;
          return (
            <div key={a.ticker} className="flex items-center justify-between text-[10px] tabular-nums border-b border-zinc-950/70 pb-1">
              <span className="text-zinc-300 font-bold w-10">{a.ticker}</span>
              <span className="text-zinc-400">{formatPrice(price)}</span>
              <span className={`${STATUS_CLASS[st]} font-bold w-14 text-right`}>{st.toLowerCase()}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RegimeScan({ ticker }: { ticker: string }) {
  const serverState = useContractStore((s) => s.serverState);
  const score = serverState?.system_score?.total ?? 72;
  const bias = (serverState?.recommendation || 'HOLD') as string;
  const status = score >= 80 ? 'HOLDING' : score >= 55 ? 'TESTING' : 'FAILING';
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-zinc-500 uppercase tracking-widest">{ticker} Regime</span>
        <span className={`${STATUS_CLASS[status]} text-[10px] font-bold`}>{status.toLowerCase()}</span>
      </div>
      <div className="text-3xl font-black text-white tabular-nums">{Math.round(score)}</div>
      <div className="text-[9px] text-zinc-500 uppercase tracking-widest">System Score</div>
      <div className="h-1.5 bg-zinc-900 rounded-[2px] overflow-hidden">
        <div className="h-full bg-sky-500" style={{ width: `${Math.min(100, score)}%` }} />
      </div>
      <div className="text-[10px] text-zinc-400">Bias: <span className="text-zinc-200 font-bold">{bias}</span></div>
    </div>
  );
}

function FeedList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="space-y-1">
      <div className="text-[9px] text-zinc-600 uppercase tracking-widest mb-1">{title}</div>
      {items.length === 0 && <div className="text-[10px] text-zinc-600">Awaiting feed…</div>}
      {items.map((line, i) => (
        <div key={i} className="text-[10px] text-zinc-400 tabular-nums truncate border-b border-zinc-950/60 pb-0.5">{line}</div>
      ))}
    </div>
  );
}

function WhaleSweeps() {
  const serverState = useContractStore((s) => s.serverState);
  const feed = (serverState?.deep_intelligence?.flow_feed || []).slice(0, 12)
    .map((f: any) => `${f.contract || ''} ${f.desc || ''}`.trim());
  const fallback = ['4500 SPX 7615C // $1.5M SWEEP', '900 NDX 18300P // $0.8M BLOCK', '2100 QQQ 448C // $0.6M UNUSUAL'];
  return <FeedList title="Institutional Block Tape" items={feed.length ? feed : fallback} />;
}

function LiveOptionsFlow() {
  const serverState = useContractStore((s) => s.serverState);
  const feed = (serverState?.deep_intelligence?.flow_feed || []).slice(0, 14)
    .map((f: any) => `${f.type || 'FLOW'} ${f.contract || ''}`.trim());
  const fallback = ['SWEEP SPX 7620C', 'BLOCK SPY 515P', 'UNUSUAL QQQ 450C'];
  return <FeedList title="Real-time Flow" items={feed.length ? feed : fallback} />;
}

function DiscoveryCockpit() {
  const setActiveTab = useContractStore((s) => s.setActiveTab);
  return (
    <div className="space-y-2">
      <div className="text-[10px] text-zinc-400">Live discovery radar runs in the SkyVision cockpit.</div>
      <button onClick={() => setActiveTab('skyvision')} className="text-[10px] font-bold uppercase tracking-widest text-sky-400 border border-sky-500/30 rounded-[2px] px-2 py-1 hover:bg-sky-500/10">
        Open Discovery →
      </button>
    </div>
  );
}

function ReferralDashboard() {
  const [code, setCode] = useState('…');
  const [tokens, setTokens] = useState(0);
  useEffect(() => {
    fetch('/api/billing/my-referral-code', { credentials: 'same-origin' })
      .then((r) => r.json()).then((d) => { if (d.referral_code) { setCode(d.referral_code); setTokens(d.tokens || 0); } })
      .catch(() => {});
  }, []);
  return (
    <div className="space-y-2">
      <div className="text-[9px] text-zinc-600 uppercase tracking-widest">Your Referral Code</div>
      <code className="block bg-black border border-zinc-800 rounded-[2px] px-2 py-1.5 text-[12px] font-black text-emerald-400 tracking-widest">{code}</code>
      <div className="text-[10px] text-zinc-400 tabular-nums">Tokens: <span className="text-white font-bold">{tokens}</span> · 1 token = 10% off</div>
    </div>
  );
}

function SettingsWidget() {
  const setActiveTab = useContractStore((s) => s.setActiveTab);
  return (
    <button onClick={() => setActiveTab('settings')} className="text-[10px] font-bold uppercase tracking-widest text-zinc-300 border border-zinc-800 rounded-[2px] px-2 py-1 hover:border-zinc-600">
      Open System Settings →
    </button>
  );
}

function TerminalOutput() {
  const serverState = useContractStore((s) => s.serverState);
  const lines = [
    `[${new Date().toLocaleTimeString()}] data_source=${serverState?.data_source || 'SANDBOX_SYNTHETIC'}`,
    `[sys] system_score=${serverState?.system_score?.total ?? '—'} health=${Math.round(serverState?.trade_health || 0)}`,
    `[feed] ${serverState?.candle_feed || 'streaming'}`,
    `[ok] workspace grid engine online`,
  ];
  return (
    <div className="space-y-0.5">
      {lines.map((l, i) => (
        <div key={i} className="text-[10px] text-emerald-300/80 tabular-nums truncate">{l}</div>
      ))}
    </div>
  );
}

function AdminWidget({ kind }: { kind: 'health' | 'crm' | 'fin' }) {
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState(false);
  useEffect(() => {
    fetch('/api/admin/overview', { credentials: 'same-origin' })
      .then((r) => { if (!r.ok) throw new Error('forbidden'); return r.json(); })
      .then(setData).catch(() => setErr(true));
  }, []);
  if (err) return <div className="text-[10px] text-rose-400 uppercase tracking-widest">Super-admin access required</div>;
  if (!data) return <div className="text-[10px] text-zinc-600">Loading…</div>;
  if (kind === 'health') {
    return (
      <div className="grid grid-cols-2 gap-2 text-center">
        {[['Live', data.live_connections, 'text-emerald-400'], ['Users', data.total_users, 'text-white'], ['Suspended', data.suspended, 'text-amber-400'], ['Banned', data.banned, 'text-rose-400']].map(([l, v, c]) => (
          <div key={l as string} className="bg-black/40 border border-zinc-900 rounded-[2px] p-2">
            <div className="text-[8px] text-zinc-600 uppercase tracking-widest">{l}</div>
            <div className={`text-lg font-black tabular-nums ${c}`}>{v as any}</div>
          </div>
        ))}
      </div>
    );
  }
  if (kind === 'crm') {
    return <div className="text-[10px] text-zinc-400 tabular-nums">Total users: <b className="text-white">{data.total_users}</b><br />Open the Overseer Command Center for the full CRM.</div>;
  }
  return <div className="text-[10px] text-zinc-400 tabular-nums">Coupons: <b className="text-white">{data.coupons}</b> · Audit entries: <b className="text-white">{data.audit_entries}</b></div>;
}

export function renderWidget(type: WidgetType): React.ReactNode {
  switch (type) {
    case 'ticker': return <LiveTickerArray />;
    case 'regime_spx': return <RegimeScan ticker="SPX" />;
    case 'regime_ndx': return <RegimeScan ticker="NDX" />;
    case 'whales': return <WhaleSweeps />;
    case 'flow': return <LiveOptionsFlow />;
    case 'discovery': return <DiscoveryCockpit />;
    case 'referrals': return <ReferralDashboard />;
    case 'settings': return <SettingsWidget />;
    case 'terminal': return <TerminalOutput />;
    case 'server_health': return <AdminWidget kind="health" />;
    case 'user_crm': return <AdminWidget kind="crm" />;
    case 'financials': return <AdminWidget kind="fin" />;
    default: return null;
  }
}
