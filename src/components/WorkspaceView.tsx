/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Dependency-free resizable grid workspace (React-19 safe — no findDOMNode).
 * Snap-to-grid drag + resize via pointer events; debounced persistence to
 * localStorage + PATCH /api/users/workspace; hydrates from API or Template A.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, LayoutGrid, ChevronDown } from 'lucide-react';
import { Pane, renderWidget } from './WorkspaceWidgets';
import {
  PaneLayout, WidgetType, WIDGETS, widgetMeta, paneId, TEMPLATES, cloneTemplate, GRID_COLS,
} from '../lib/workspace';

const ROW_HEIGHT = 40;
const GAP = 8;

interface Props { isSuperAdmin?: boolean; }

export function WorkspaceView({ isSuperAdmin }: Props) {
  const [layout, setLayout] = useState<PaneLayout[]>([]);
  const [maximized, setMaximized] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [loadOpen, setLoadOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [colWidth, setColWidth] = useState(80);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const interaction = useRef<null | { id: string; mode: 'move' | 'resize'; startX: number; startY: number; orig: PaneLayout }>(null);

  useEffect(() => {
    const measure = () => {
      const w = containerRef.current?.clientWidth || 960;
      setColWidth(Math.max(24, (w - GAP * (GRID_COLS + 1)) / GRID_COLS));
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  const persist = useCallback((next: PaneLayout[]) => {
    try { localStorage.setItem('slayer_workspace', JSON.stringify(next)); } catch {}
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      fetch('/api/users/workspace', {
        method: 'PATCH', credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ layout: next }),
      }).catch(() => {});
    }, 1000);
  }, []);

  const commit = useCallback((next: PaneLayout[]) => { setLayout(next); persist(next); }, [persist]);

  // Hydrate: API -> localStorage -> Template A (never render an empty terminal).
  useEffect(() => {
    let cancelled = false;
    const fallback = (): PaneLayout[] => {
      try {
        const ls = localStorage.getItem('slayer_workspace');
        if (ls) { const p = JSON.parse(ls); if (Array.isArray(p) && p.length) return p; }
      } catch {}
      return cloneTemplate('A');
    };
    fetch('/api/users/workspace', { credentials: 'same-origin' })
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (Array.isArray(d.layout) && d.layout.length) {
          setLayout(d.layout);
        } else {
          const fb = fallback();
          setLayout(fb);
          persist(fb); // hydrate Template A into the user's profile
        }
      })
      .catch(() => { if (!cancelled) setLayout(fallback()); });
    return () => { cancelled = true; };
  }, [persist]);

  const onPointerMove = useCallback((e: PointerEvent) => {
    const it = interaction.current;
    if (!it) return;
    const dxCols = Math.round((e.clientX - it.startX) / (colWidth + GAP));
    const dyRows = Math.round((e.clientY - it.startY) / (ROW_HEIGHT + GAP));
    setLayout((prev) => prev.map((p) => {
      if (p.i !== it.id) return p;
      const meta = widgetMeta(p.widget);
      if (it.mode === 'move') {
        return {
          ...p,
          x: Math.max(0, Math.min(GRID_COLS - it.orig.w, it.orig.x + dxCols)),
          y: Math.max(0, it.orig.y + dyRows),
        };
      }
      return {
        ...p,
        w: Math.max(meta.minW, Math.min(GRID_COLS - p.x, it.orig.w + dxCols)),
        h: Math.max(meta.minH, it.orig.h + dyRows),
      };
    }));
  }, [colWidth]);

  const endInteraction = useCallback(() => {
    if (interaction.current) {
      interaction.current = null;
      setLayout((cur) => { persist(cur); return cur; });
    }
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', endInteraction);
  }, [onPointerMove, persist]);

  const startInteraction = (id: string, mode: 'move' | 'resize', e: React.PointerEvent) => {
    e.preventDefault();
    const orig = layout.find((p) => p.i === id);
    if (!orig) return;
    interaction.current = { id, mode, startX: e.clientX, startY: e.clientY, orig: { ...orig } };
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', endInteraction);
  };

  const closePane = (id: string) => commit(layout.filter((p) => p.i !== id));
  const addWidget = (widget: WidgetType) => {
    const maxY = layout.reduce((m, p) => Math.max(m, p.y + p.h), 0);
    const meta = widgetMeta(widget);
    commit([...layout, { i: paneId(widget), widget, x: 0, y: maxY, w: Math.max(meta.minW, 4), h: Math.max(meta.minH, 4) }]);
    setAddOpen(false);
  };
  const loadTemplate = (key: 'A' | 'B' | 'C') => { commit(cloneTemplate(key)); setLoadOpen(false); setMaximized(null); };

  const maxRow = layout.reduce((m, p) => Math.max(m, p.y + p.h), 0);
  const gridHeight = Math.max(8, maxRow) * (ROW_HEIGHT + GAP) + GAP;
  const visibleWidgets = WIDGETS.filter((w) => isSuperAdmin || !w.adminOnly);
  const templateKeys = (['A', 'B', 'C'] as const).filter((k) => isSuperAdmin || !TEMPLATES[k].adminOnly);

  return (
    <div className="w-full h-[calc(100vh-150px)] flex flex-col font-mono">
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-[11px] font-black tracking-widest text-zinc-400 uppercase flex items-center gap-2">
          <LayoutGrid className="w-4 h-4 text-emerald-400" /> Terminal Workspace
        </span>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button onClick={() => { setLoadOpen(!loadOpen); setAddOpen(false); }} className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-300 bg-[#0a0a0c] border border-zinc-800 rounded-[2px] px-3 py-1.5 hover:border-zinc-600">
              Load Workspace <ChevronDown className="w-3 h-3" />
            </button>
            {loadOpen && (
              <div className="absolute right-0 mt-1 w-60 bg-[#0a0a0c] border border-zinc-800 rounded-[2px] z-50 p-1 shadow-2xl">
                {templateKeys.map((k) => (
                  <button key={k} onClick={() => loadTemplate(k)} className="w-full text-left px-2 py-1.5 text-[10px] text-zinc-300 hover:bg-zinc-900 rounded-[2px]">
                    Template {k} — {TEMPLATES[k].name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="relative">
            <button onClick={() => { setAddOpen(!addOpen); setLoadOpen(false); }} className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-[2px] px-3 py-1.5 hover:bg-emerald-500/20">
              <Plus className="w-3 h-3" /> Add Pane
            </button>
            {addOpen && (
              <div className="absolute right-0 mt-1 w-60 max-h-72 overflow-auto bg-[#0a0a0c] border border-zinc-800 rounded-[2px] z-50 p-1 shadow-2xl">
                {visibleWidgets.map((w) => (
                  <button key={w.type} onClick={() => addWidget(w.type)} className="w-full text-left px-2 py-1.5 text-[10px] text-zinc-300 hover:bg-zinc-900 rounded-[2px]">{w.title}</button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Grid surface — viewport-locked: only this region scrolls. */}
      <div ref={containerRef} className="relative flex-1 overflow-auto bg-black/30 border border-zinc-900 rounded-[2px]">
        <div className="relative" style={{ height: gridHeight }}>
          {layout.map((p) => {
            const meta = widgetMeta(p.widget);
            const style: React.CSSProperties = {
              position: 'absolute',
              left: GAP + p.x * (colWidth + GAP),
              top: GAP + p.y * (ROW_HEIGHT + GAP),
              width: p.w * colWidth + (p.w - 1) * GAP,
              height: p.h * ROW_HEIGHT + (p.h - 1) * GAP,
            };
            return (
              <div key={p.i} style={style}>
                <Pane
                  title={meta.title}
                  onClose={() => closePane(p.i)}
                  onMaximize={() => setMaximized(p.i)}
                  onHeaderPointerDown={(e) => startInteraction(p.i, 'move', e)}
                >
                  {renderWidget(p.widget)}
                </Pane>
                <div
                  onPointerDown={(e) => startInteraction(p.i, 'resize', e)}
                  className="absolute bottom-0 right-0 w-3.5 h-3.5 cursor-se-resize z-10"
                  style={{ background: 'linear-gradient(135deg, transparent 45%, #52525b 45%, #52525b 55%, transparent 55%)' }}
                  title="Resize"
                />
              </div>
            );
          })}
          {layout.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-[11px] text-zinc-600 uppercase tracking-widest">Loading workspace…</div>
          )}
        </div>
      </div>

      {maximized && (() => {
        const p = layout.find((x) => x.i === maximized);
        if (!p) return null;
        return (
          <div className="fixed inset-0 z-[100] bg-black/92 p-4">
            <Pane
              title={widgetMeta(p.widget).title}
              isMaximized
              onMaximize={() => setMaximized(null)}
              onClose={() => { closePane(p.i); setMaximized(null); }}
            >
              {renderWidget(p.widget)}
            </Pane>
          </div>
        );
      })()}
    </div>
  );
}

export default WorkspaceView;
