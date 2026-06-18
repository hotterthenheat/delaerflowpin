import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useContractStore } from '../lib/store';

interface Msg { role: 'user' | 'ai'; text: string; fallback?: boolean; }

const SUGGESTIONS = [
  'Summarize the current dealer positioning.',
  'What does the gamma flip level imply for today?',
  'Is the score being driven by flow or volatility?',
  'Where are the key support and resistance walls?',
];

/**
 * "Ask Slayer" — AI research panel grounded in the CURRENT ticker's live metrics.
 * Self-contained: floating trigger + right-side slide-over chat. Opens on click or
 * on the `slayer:ask-open` window event (dispatched by the ⌘K command palette).
 * Sends a compact live-metrics snapshot to /api/gemini/ask. Degrades gracefully.
 */
export function AskSlayerPanel() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const serverState = useContractStore(s => s.serverState);
  const selectedAsset = useContractStore(s => s.selectedAsset);
  const selectedOptionType = useContractStore(s => s.selectedOptionType);

  // Open on the command-palette event.
  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener('slayer:ask-open', onOpen as EventListener);
    return () => window.removeEventListener('slayer:ask-open', onOpen as EventListener);
  }, []);

  useEffect(() => {
    if (open) { const t = setTimeout(() => inputRef.current?.focus(), 60); return () => clearTimeout(t); }
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [msgs, busy]);

  const buildContext = useCallback(() => {
    const ss: any = serverState || {};
    return {
      ticker: selectedAsset?.ticker,
      name: selectedAsset?.name,
      optionType: selectedOptionType === 'C' ? 'Call' : 'Put',
      dataSource: ss.data_source,
      spot: ss.pinpoint_map?.spot_price ?? selectedAsset?.defaultPrice,
      slayerScore: ss.system_score?.total,
      systemScore: ss.system_score,
      dealerMetrics: ss.deep_intelligence?.dealer_metrics,
      gexProfile: ss.gex_profile,
      expectedMove: ss.expected_move,
      positionManagement: ss.position_management,
      tradeHealth: ss.trade_health,
      optionPremium: ss.optionPremiumFloat,
    };
  }, [serverState, selectedAsset, selectedOptionType]);

  const ask = useCallback(async (q: string) => {
    const question = q.trim();
    if (!question || busy) return;
    setMsgs(m => [...m, { role: 'user', text: question }]);
    setInput('');
    setBusy(true);
    try {
      const res = await fetch('/api/gemini/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ question, context: buildContext() }),
      });
      if (res.status === 401) {
        setMsgs(m => [...m, { role: 'ai', text: 'Please sign in to use AI research.', fallback: true }]);
      } else {
        const data = await res.json().catch(() => null);
        setMsgs(m => [...m, { role: 'ai', text: (data && data.answer) || 'No response.', fallback: !!(data && data.isFallback) }]);
      }
    } catch {
      setMsgs(m => [...m, { role: 'ai', text: 'Network error reaching the AI analyst. Try again.', fallback: true }]);
    } finally {
      setBusy(false);
    }
  }, [busy, buildContext]);

  return (
    <>
      {/* Floating trigger */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Ask Slayer AI"
          className="fixed bottom-5 right-5 z-[9990] flex items-center gap-2 px-4 py-3 rounded-full bg-white text-black font-mono text-[11px] font-bold uppercase tracking-widest shadow-2xl hover:scale-[1.03] active:scale-95 transition"
        >
          <span className="text-[13px] leading-none">✦</span> Ask Slayer
        </button>
      )}

      {/* Slide-over panel */}
      {open && (
        <div className="fixed inset-0 z-[10001] flex justify-end" onMouseDown={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-md h-full bg-[#0a0a0b] border-l border-zinc-800 flex flex-col font-mono shadow-2xl"
            onMouseDown={e => e.stopPropagation()}
            onKeyDown={e => { if (e.key === 'Escape') setOpen(false); }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <span className="text-white text-sm">✦</span>
                <div>
                  <div className="text-[12px] font-bold text-white tracking-wide">Ask Slayer</div>
                  <div className="text-[9px] uppercase tracking-[0.2em] text-zinc-600">
                    AI research · {selectedAsset?.ticker || '—'}
                  </div>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="text-zinc-500 hover:text-white text-lg leading-none px-2">×</button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {msgs.length === 0 && (
                <div className="space-y-3">
                  <p className="text-zinc-500 text-xs leading-relaxed">
                    Ask anything about <span className="text-zinc-300">{selectedAsset?.ticker || 'the current ticker'}</span>’s
                    live flow, dealer positioning, or score. Answers are grounded in the current on-screen metrics.
                  </p>
                  <div className="space-y-2">
                    {SUGGESTIONS.map(s => (
                      <button
                        key={s}
                        onClick={() => ask(s)}
                        className="w-full text-left text-[11px] text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 border border-zinc-800 rounded-lg px-3 py-2 transition"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {msgs.map((m, i) => (
                <div key={i} className={m.role === 'user' ? 'text-right' : 'text-left'}>
                  <div
                    className={`inline-block max-w-[85%] text-left text-[12px] leading-relaxed rounded-xl px-3.5 py-2.5 whitespace-pre-wrap ${
                      m.role === 'user'
                        ? 'bg-white text-black'
                        : m.fallback ? 'bg-amber-500/10 border border-amber-500/20 text-amber-100/90' : 'bg-white/5 border border-zinc-800 text-zinc-200'
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
              {busy && (
                <div className="text-left">
                  <div className="inline-block bg-white/5 border border-zinc-800 text-zinc-500 text-[12px] rounded-xl px-3.5 py-2.5 animate-pulse">
                    Analyzing live metrics…
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="border-t border-zinc-800 p-3">
              <form
                onSubmit={e => { e.preventDefault(); ask(input); }}
                className="flex items-center gap-2 bg-[#111317] border border-zinc-800 rounded-lg px-3 py-2"
              >
                <span className="text-zinc-600 text-sm">&gt;</span>
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Ask about the current setup…"
                  className="flex-1 bg-transparent outline-none text-[12px] text-zinc-100 placeholder-zinc-600"
                  disabled={busy}
                  spellCheck={false}
                  autoComplete="off"
                />
                <button type="submit" disabled={busy || !input.trim()} className="text-[10px] font-bold uppercase tracking-widest text-black bg-white rounded px-2.5 py-1 disabled:opacity-40">
                  Send
                </button>
              </form>
              <p className="text-[8.5px] text-zinc-600 mt-2 px-1 leading-relaxed">
                Educational analysis grounded in live metrics — not financial advice.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default AskSlayerPanel;
