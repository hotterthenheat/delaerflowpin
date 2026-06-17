/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Maximize2, Minimize2, X } from 'lucide-react';
import { useContractStore } from '../lib/store';
import { ASSET_LIST } from '../data';
import { formatPrice } from '../lib/format';
import type { WidgetType } from '../lib/workspace';

interface PaneProps {
  title: string;
  isMaximized?: boolean;
  onClose?: () => void;
  onMaximize?: () => void;
  onHeaderPointerDown?: (e: React.PointerEvent) => void;
  children: React.ReactNode;
}

export function Pane({ title, isMaximized, onClose, onMaximize, onHeaderPointerDown, children }: PaneProps) {
  return (
    <div className="flex flex-col h-full w-full bg-black border border-[var(--grey-700)] rounded-[2px] overflow-hidden mirror-panel">
      <div
        onPointerDown={onHeaderPointerDown}
        className="h-6 shrink-0 flex items-center justify-between px-2 bg-black/60 border-b border-[var(--grey-700)] cursor-move select-none"
      >
        <span className="text-[9px] font-mono font-bold tracking-widest text-[#A3A3A3] truncate">
          &gt; {title}
        </span>
        <div className="flex items-center gap-1">
          <button onClick={onMaximize} className="w-4 h-4 flex items-center justify-center text-[#A3A3A3] hover:text-[#E5E5E5]">
            {isMaximized ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
          </button>
          {onClose && (
            <button onClick={onClose} className="w-4 h-4 flex items-center justify-center text-[#A3A3A3] hover:text-[#F87171]">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-auto p-2.5 font-mono">{children}</div>
    </div>
  );
}

const LiveTickerArray = React.memo(() => {
  const serverState = useContractStore((s) => s.serverState);
  const [stale, setStale] = useState(false);
  const [lastTick, setLastTick] = useState(Date.now());

  useEffect(() => {
    if (serverState) setLastTick(Date.now());
  }, [serverState]);

  useEffect(() => {
    const t = setInterval(() => setStale(Date.now() - lastTick > 3000), 1000);
    return () => clearInterval(t);
  }, [lastTick]);

  return (
    <div className={`transition-opacity duration-300 ${stale ? 'opacity-50' : ''}`}>
      <div className="flex items-center gap-1.5 mb-2">
        {stale ? (
           <>
             <span className="w-1.5 h-1.5 rounded-full bg-[#A1A1AA] animate-pulse" />
             <span className="text-[8.5px] font-black tracking-widest text-[#A1A1AA]">[RECONNECTING...]</span>
           </>
        ) : (
           <>
             <span className="w-1.5 h-1.5 rounded-full bg-[#4ADE80] animate-pulse" />
             <span className="text-[8.5px] font-black tracking-widest text-[#4ADE80]">LIVE</span>
           </>
        )}
      </div>
      <div className="space-y-1">
        {ASSET_LIST.slice(0, 8).map((a, i) => {
          const st = (Math.floor(Date.now() / 4000) + i) % 3 === 0 ? 'HOLDING' : 'TESTING';
          const price = serverState?.pinpoint_map?.spot_price && a.ticker === 'SPX'
            ? serverState.pinpoint_map.spot_price
            : a.defaultPrice;
          return (
            <div key={a.ticker} className="flex items-center justify-between text-[10px] tabular-nums border-b border-[#1F1F1F] pb-1">
              <span className="text-[#E5E5E5] font-bold w-10">{a.ticker}</span>
              <span className="text-[#A3A3A3] font-bold">{formatPrice(price)}</span>
              <span className={`font-bold w-14 text-right ${st === 'HOLDING' ? 'text-[#4ADE80]' : 'text-[#A1A1AA]'}`}>[{st}]</span>
            </div>
          );
        })}
      </div>
    </div>
  );
});

const RegimeScan = React.memo(({ ticker }: { ticker: string }) => {
  const serverState = useContractStore((s) => s.serverState);
  const score = serverState?.system_score?.total ?? 72;
  const status = score >= 80 ? 'HOLDING' : score >= 55 ? 'TESTING' : 'FAILING';
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-[#A3A3A3] uppercase tracking-widest">{ticker} Regime</span>
        <span className={`text-[10px] font-bold ${status === 'HOLDING' ? 'text-[#4ADE80]' : status === 'TESTING' ? 'text-[#A1A1AA]' : 'text-[#F87171]'}`}>[{status}]</span>
      </div>
      <div className="text-3xl font-black text-[#E5E5E5] tabular-nums">{Math.round(score)}</div>
      <div className="text-[9px] text-[#A3A3A3] uppercase tracking-widest">System Score</div>
      <div className="h-1.5 bg-[#1F1F1F] rounded-[2px] overflow-hidden">
        <div className="h-full bg-[#4ADE80]" style={{ width: `${Math.min(100, score)}%` }} />
      </div>
    </div>
  );
});

const WhaleSweeps = React.memo(() => {
  const items = ['4500 SPX 7615C // $1.5M SWEEP', '900 NDX 18300P // $0.8M BLOCK', '2100 QQQ 448C // $0.6M UNUSUAL'];
  return (
    <div className="space-y-1">
      <div className="text-[9px] text-[#A3A3A3] uppercase tracking-widest mb-1">Institutional Block Tape</div>
      {items.map((line, i) => (
        <div key={i} className="text-[10px] text-[#E5E5E5] tabular-nums truncate border-b border-[#1F1F1F] pb-0.5">{line}</div>
      ))}
    </div>
  );
});

// Monotonic counter so every generated flow row gets a stable, unique id. Rows are
// unshift-ed to the front of the list, so an array-index key would shift on every insert
// and cause React to mis-associate rows.
let liveFlowRowSeq = 0;

const LiveOptionsFlow = React.memo(() => {
  const generateMockFlow = () => {
    return Array.from({length: 14}).map((_, i) => {
      const isCall = Math.random() > 0.5;
      const types = ['SWEEP', 'BLOCK'];
      const tickers = ['SPX', 'QQQ', 'NDX', 'SPY', 'IWM'];
      const type = types[Math.floor(Math.random() * types.length)];
      const ticker = tickers[Math.floor(Math.random() * tickers.length)];
      const strike = Math.floor(Math.random() * 1000 + 4000) + (isCall ? 'C' : 'P');
      const size = '$' + (Math.random() * 2 + 0.1).toFixed(1) + 'M';
      const d = new Date();
      d.setMinutes(d.getMinutes() - i * 2 - Math.floor(Math.random() * 5));
      const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      return { id: `flow-${liveFlowRowSeq++}`, time, size, ticker, strike, type, isBullish: isCall };
    });
  };

  const [flow, setFlow] = useState(generateMockFlow());

  useEffect(() => {
    const t = setInterval(() => {
      setFlow(prev => {
        const next = [...prev];
        const isCall = Math.random() > 0.5;
        const types = ['SWEEP', 'BLOCK'];
        const tickers = ['SPX', 'QQQ', 'NDX', 'SPY', 'IWM'];
        const type = types[Math.floor(Math.random() * types.length)];
        const ticker = tickers[Math.floor(Math.random() * tickers.length)];
        const strike = Math.floor(Math.random() * 1000 + 4000) + (isCall ? 'C' : 'P');
        const size = '$' + (Math.random() * 2 + 0.1).toFixed(1) + 'M';
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        next.unshift({ id: `flow-${liveFlowRowSeq++}`, time, size, ticker, strike, type, isBullish: isCall });
        return next.slice(0, 50);
      });
    }, 2500);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex flex-col h-full w-full">
      <div className="text-[9px] font-black tracking-widest text-[#a1a1aa] uppercase mb-2 shrink-0">
        LIVE OPTIONS FLOW
      </div>
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left text-[10px] tabular-data">
          <thead className="text-[9px] text-zinc-500 uppercase tracking-widest sticky top-0 bg-[#0A0A0A]/80 backdrop-blur-md z-10">
            <tr>
              <th className="py-1 min-w-[60px]">Time</th>
              <th className="py-1">Size</th>
              <th className="py-1">Ticker</th>
              <th className="py-1">Strike</th>
              <th className="py-1">Type</th>
            </tr>
          </thead>
          <tbody>
            {flow.map((row) => (
              <tr key={row.id} className="border-b border-[#1F1F1F] hover:bg-[#161616] transition-colors group">
                <td className="py-1.5" style={{ borderLeft: `2px solid ${row.isBullish ? 'var(--status-holding)' : 'var(--status-failing)'}`, paddingLeft: '6px' }}>
                  <span className="text-[#A3A3A3]">{row.time}</span>
                </td>
                <td className="py-1.5 text-[#E5E5E5] font-bold">{row.size}</td>
                <td className="py-1.5 text-[#A3A3A3] font-bold">{row.ticker}</td>
                <td className="py-1.5 text-[#A3A3A3]">{row.strike}</td>
                <td className="py-1.5">
                  <span className={`text-[9px] font-bold ${row.type === 'SWEEP' ? 'text-[#E5E5E5]' : 'text-[#A3A3A3]'}`}>
                    {row.type}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});

const ReferralDashboard = React.memo(() => {
  return (
    <div className="space-y-2">
      <div className="text-[9px] text-[#A3A3A3] uppercase tracking-widest">Your Referral Code</div>
      <code className="block bg-[#161616] border border-[#1F1F1F] rounded-[2px] px-2 py-1.5 text-[12px] font-black text-[#4ADE80] tracking-widest">SLAYER-PRO</code>
      <div className="text-[10px] text-[#A3A3A3] tabular-nums">Tokens: <span className="text-[#E5E5E5] font-bold">12</span></div>
    </div>
  );
});

const SettingsWidget = React.memo(() => {
  const setActiveTab = useContractStore((s) => s.setActiveTab);
  return (
    <button onClick={() => setActiveTab('settings')} className="text-[10px] font-bold uppercase tracking-widest text-[#E5E5E5] border border-[#1F1F1F] rounded-[2px] px-2 py-1 hover:bg-[#161616]">
      Open System Settings
    </button>
  );
});

const AdminWidget = React.memo(({ kind }: { kind: 'health' | 'crm' | 'fin' }) => {
  if (kind === 'health') {
    return (
      <div className="grid grid-cols-2 gap-2 text-center">
        {[['Live', 942, 'text-[#4ADE80]'], ['Users', 1512, 'text-[#E5E5E5]'], ['Suspended', 12, 'text-[#A1A1AA]'], ['Banned', 3, 'text-[#F87171]']].map(([l, v, c]) => (
          <div key={l as string} className="bg-[#161616] border border-[#1F1F1F] rounded-[2px] p-2">
            <div className="text-[8px] text-[#A3A3A3] uppercase tracking-widest">{l}</div>
            <div className={`text-lg font-black tabular-nums ${c}`}>{v as any}</div>
          </div>
        ))}
      </div>
    );
  }
  return <div className="text-[10px] text-[#A3A3A3] tabular-nums">Admin Data Stream Module</div>;
});

export const SlayerScoreWidget = React.memo(() => {
  const [data, setData] = useState({ long: 82, short: 41, prob: 74, cushion: 'Weak', expected: 48 });

  useEffect(() => {
    const t = setInterval(() => {
      setData(prev => ({
        long: Math.max(0, Math.min(100, prev.long + Math.floor(Math.random() * 5) - 2)),
        short: Math.max(0, Math.min(100, prev.short + Math.floor(Math.random() * 5) - 2)),
        prob: Math.max(0, Math.min(100, prev.prob + Math.floor(Math.random() * 3) - 1)),
        cushion: Math.random() > 0.8 ? (prev.cushion === 'Weak' ? 'Strong' : 'Weak') : prev.cushion,
        expected: Math.max(10, prev.expected + Math.floor(Math.random() * 3) - 1)
      }));
    }, 2500);
    return () => clearInterval(t);
  }, []);

  const totalScore = data.long + data.short;
  const isWaiting = data.prob < 50;
  
  return (
    <div className={`flex flex-col h-full w-full font-mono transition-opacity ${isWaiting ? 'opacity-60' : 'opacity-100'}`}>
      <div className="flex items-center gap-2 text-[9px] font-black tracking-widest text-[#a1a1aa] uppercase mb-4 shrink-0">
        <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isWaiting ? 'bg-[#A1A1AA]' : 'bg-[#4ADE80]'}`} />
        SLAYER SCORE
      </div>
      <div className="space-y-3 flex-1 flex flex-col justify-center">
        <div className="flex justify-between items-center bg-[#161616] border border-[#1F1F1F] rounded p-2.5">
          <span className="text-[9px] text-[#A3A3A3] uppercase tracking-widest">Long Score</span>
          <span className="font-mono font-bold text-[#E5E5E5] uppercase tabular-nums">{data.long}</span>
        </div>
        <div className="flex justify-between items-center bg-[#161616] border border-[#1F1F1F] rounded p-2.5">
          <span className="text-[9px] text-[#A3A3A3] uppercase tracking-widest">Short Score</span>
          <span className="font-mono font-bold text-[#E5E5E5] uppercase tabular-nums">{data.short}</span>
        </div>
        <div className="flex justify-between items-center bg-[#161616] border border-[#1F1F1F] rounded p-2.5">
          <span className="text-[9px] text-[#A3A3A3] uppercase tracking-widest">Confidence</span>
          <span className="font-mono font-bold uppercase tabular-nums text-[#E5E5E5]">{data.prob}%</span>
        </div>
        <div className="flex justify-between items-center bg-[#161616] border border-[#1F1F1F] rounded p-2.5">
          <span className="text-[9px] text-[#A3A3A3] uppercase tracking-widest">Market Regime</span>
          <span className={`font-mono font-bold uppercase tabular-nums ${data.expected > 45 ? 'text-[#E5E5E5]' : 'text-[#A1A1AA]'}`}>
            {data.expected > 45 ? 'TRENDING' : 'CHOP'}
          </span>
        </div>
      </div>
    </div>
  );
});

export const VolatilityStateWidget = React.memo(() => {
  const [data, setData] = useState({ expected: 48, prob: 74, cushion: 'Weak', regime: 'Expansion' });
  useEffect(() => {
    const t = setInterval(() => {
      setData(prev => ({
        ...prev,
        expected: Math.max(10, prev.expected + Math.floor(Math.random() * 5) - 2),
        prob: Math.max(0, Math.min(100, prev.prob + Math.floor(Math.random() * 3) - 1)),
        cushion: Math.random() > 0.85 ? (prev.cushion === 'Weak' ? 'Deteriorating' : 'Weak') : prev.cushion,
        regime: prev.expected > 45 ? 'Expansion' : 'Chop'
      }));
    }, 3000);
    return () => clearInterval(t);
  }, []);

  const isLowConfidence = data.prob < 50;

  return (
    <div className={`flex flex-col h-full w-full font-mono transition-opacity ${isLowConfidence ? 'opacity-80' : 'opacity-100'}`}>
      <div className="flex items-center gap-2 text-[9px] font-black tracking-widest text-[#a1a1aa] uppercase mb-4 shrink-0">
        <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isLowConfidence ? 'bg-[#A1A1AA]' : 'bg-[#E5E5E5]'}`} />
        VOLATILITY STATE
      </div>
      <div className="space-y-3 flex-1 flex flex-col justify-center">
        <div className="flex justify-between items-center bg-[#161616] border border-[#1F1F1F] rounded p-2.5">
          <span className="text-[9px] text-[#A3A3A3] uppercase tracking-widest">Current Regime</span>
          <span className={`font-mono font-bold uppercase tabular-nums text-[#E5E5E5]`}>{data.regime}</span>
        </div>
        <div className="flex justify-between items-center bg-[#161616] border border-[#1F1F1F] rounded p-2.5">
          <span className="text-[9px] text-[#A3A3A3] uppercase tracking-widest">Expected Move</span>
          <span className="font-mono font-bold text-[#A3A3A3] uppercase tabular-nums">±{data.expected} pts</span>
        </div>
        <div className="flex justify-between items-center bg-[#161616] border border-[#1F1F1F] rounded p-2.5">
          <span className="text-[9px] text-[#A3A3A3] uppercase tracking-widest">Dealer Cushion</span>
          <span className="font-mono font-bold uppercase tabular-nums text-[#A3A3A3]">{data.cushion}</span>
        </div>
      </div>
    </div>
  );
});

export function renderWidget(type: WidgetType): React.ReactNode {
  switch (type) {
    case 'ticker': return <LiveTickerArray />;
    case 'regime_spx': return <RegimeScan ticker="SPX" />;
    case 'regime_ndx': return <RegimeScan ticker="NDX" />;
    case 'whales': return <WhaleSweeps />;
    case 'flow': return <LiveOptionsFlow />;
    case 'referrals': return <ReferralDashboard />;
    case 'settings': return <SettingsWidget />;
    case 'server_health': return <AdminWidget kind="health" />;
    case 'user_crm': return <AdminWidget kind="crm" />;
    case 'financials': return <AdminWidget kind="fin" />;
    case 'slayer_score': return <SlayerScoreWidget />;
    case 'volatility_state': return <VolatilityStateWidget />;
    default: return null;
  }
}
