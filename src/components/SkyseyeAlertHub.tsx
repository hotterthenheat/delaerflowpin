/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Floating tactical-alert hub. Surfaces dealer-flow / decision-state changes derived
 * from the live server state as a dismissible stack of toasts in the top-right.
 */

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Zap, TrendingUp, TrendingDown, ShieldAlert, X } from 'lucide-react';
import { useContractStore } from '../lib/store';

interface TacticalAlert {
  id: string;
  kind: 'ENTER' | 'REDUCE' | 'EXIT' | 'FLOW';
  title: string;
  detail: string;
  ts: number;
}

const KIND_META: Record<
  TacticalAlert['kind'],
  { icon: typeof Zap; color: string; ring: string }
> = {
  ENTER: { icon: TrendingUp, color: 'text-emerald-400', ring: 'border-emerald-500/30' },
  REDUCE: { icon: TrendingDown, color: 'text-amber-400', ring: 'border-amber-500/30' },
  EXIT: { icon: ShieldAlert, color: 'text-rose-400', ring: 'border-rose-500/30' },
  FLOW: { icon: Zap, color: 'text-sky-400', ring: 'border-sky-500/30' },
};

export function SkyseyeAlertHub() {
  const serverState = useContractStore((s) => s.serverState);
  const [alerts, setAlerts] = useState<TacticalAlert[]>([]);
  const lastRecRef = useRef<string | null>(null);

  // Emit an alert whenever the recommendation state transitions.
  useEffect(() => {
    if (!serverState) return;
    const rec = serverState.recommendation;
    if (rec && rec !== lastRecRef.current && (rec === 'ENTER' || rec === 'REDUCE' || rec === 'EXIT')) {
      lastRecRef.current = rec;
      const alert: TacticalAlert = {
        id: `rec-${Date.now()}`,
        kind: rec,
        title: `${rec} signal — ${serverState.contract || 'active contract'}`,
        detail:
          serverState.dealer_flow?.headline ||
          `Trade health ${Math.round(serverState.trade_health || 0)} · ${serverState.data_source || 'sandbox'}`,
        ts: Date.now(),
      };
      setAlerts((prev) => [alert, ...prev].slice(0, 4));
    } else if (rec) {
      lastRecRef.current = rec;
    }
  }, [serverState]);

  // Auto-expire alerts after 9s.
  useEffect(() => {
    if (alerts.length === 0) return;
    const timer = setInterval(() => {
      const now = Date.now();
      setAlerts((prev) => prev.filter((a) => now - a.ts < 9000));
    }, 1000);
    return () => clearInterval(timer);
  }, [alerts.length]);

  const dismiss = (id: string) => setAlerts((prev) => prev.filter((a) => a.id !== id));

  return (
    <div className="fixed top-4 right-4 z-[120] flex flex-col gap-2 w-[300px] max-w-[calc(100vw-2rem)] pointer-events-none">
      <AnimatePresence initial={false}>
        {alerts.map((alert) => {
          const meta = KIND_META[alert.kind];
          const Icon = meta.icon;
          return (
            <motion.div
              key={alert.id}
              layout
              initial={{ opacity: 0, x: 40, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.96 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className={`pointer-events-auto bg-[#0a0a0c]/95 backdrop-blur-md border ${meta.ring} rounded-xl p-3 shadow-2xl font-mono`}
            >
              <div className="flex items-start gap-2.5">
                <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${meta.color}`} />
                <div className="flex-1 min-w-0">
                  <div className={`text-[10.5px] font-black uppercase tracking-wider ${meta.color} truncate`}>
                    {alert.title}
                  </div>
                  <div className="text-[10px] text-zinc-400 mt-1 leading-snug line-clamp-2">
                    {alert.detail}
                  </div>
                </div>
                <button
                  onClick={() => dismiss(alert.id)}
                  className="text-zinc-600 hover:text-zinc-300 transition-colors shrink-0"
                  aria-label="Dismiss alert"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

export default SkyseyeAlertHub;
