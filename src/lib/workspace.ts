/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Workspace grid configuration: widget registry + hardcoded default layout
 * templates (spec Group 4/5). Layout units are on a 12-column grid; `h`/`y`
 * are in row units (see ROW_HEIGHT in WorkspaceView).
 */

export type WidgetType =
  | 'ticker'
  | 'regime_spx'
  | 'regime_ndx'
  | 'whales'
  | 'flow'
  | 'discovery'
  | 'referrals'
  | 'settings'
  | 'terminal'
  | 'server_health'
  | 'user_crm'
  | 'financials';

export interface PaneLayout {
  i: string;        // unique pane id
  widget: WidgetType;
  x: number;        // grid column (0-11)
  y: number;        // grid row
  w: number;        // width in columns
  h: number;        // height in rows
}

export interface WidgetMeta {
  type: WidgetType;
  title: string;       // shown in the pane header, mono + caps
  adminOnly?: boolean;
  minW: number;
  minH: number;
}

export const GRID_COLS = 12;

export const WIDGETS: WidgetMeta[] = [
  { type: 'ticker', title: 'LIVE_TICKER_ARRAY', minW: 2, minH: 4 },
  { type: 'regime_spx', title: 'SPX_REGIME_SCAN', minW: 3, minH: 3 },
  { type: 'regime_ndx', title: 'NDX_REGIME_SCAN', minW: 3, minH: 3 },
  { type: 'whales', title: 'WHALE_SWEEPS', minW: 3, minH: 4 },
  { type: 'flow', title: 'LIVE_OPTIONS_FLOW', minW: 3, minH: 3 },
  { type: 'discovery', title: 'DISCOVERY_COCKPIT', minW: 3, minH: 3 },
  { type: 'referrals', title: 'REFERRAL_DASHBOARD', minW: 3, minH: 3 },
  { type: 'settings', title: 'SYSTEM_SETTINGS', minW: 2, minH: 2 },
  { type: 'terminal', title: 'TERMINAL_OUTPUT', minW: 4, minH: 2 },
  { type: 'server_health', title: 'SERVER_HEALTH', adminOnly: true, minW: 4, minH: 3 },
  { type: 'user_crm', title: 'LIVE_USER_CRM', adminOnly: true, minW: 4, minH: 4 },
  { type: 'financials', title: 'FINANCIALS_LOG', adminOnly: true, minW: 3, minH: 3 },
];

export function widgetMeta(type: WidgetType): WidgetMeta {
  return WIDGETS.find((w) => w.type === type) || WIDGETS[0];
}

let _id = 0;
export function paneId(widget: WidgetType): string {
  _id += 1;
  return `${widget}-${Date.now().toString(36)}-${_id}`;
}

/** Template A — Core Regime (default): central regime scanners, thin left
 *  ticker array, full-width terminal log along the bottom. */
const TEMPLATE_A: PaneLayout[] = [
  { i: 'a-ticker', widget: 'ticker', x: 0, y: 0, w: 2, h: 8 },
  { i: 'a-spx', widget: 'regime_spx', x: 2, y: 0, w: 6, h: 4 },
  { i: 'a-ndx', widget: 'regime_ndx', x: 8, y: 0, w: 4, h: 4 },
  { i: 'a-flow', widget: 'flow', x: 2, y: 4, w: 6, h: 4 },
  { i: 'a-disc', widget: 'discovery', x: 8, y: 4, w: 4, h: 4 },
  { i: 'a-term', widget: 'terminal', x: 0, y: 8, w: 12, h: 3 },
];

/** Template B — Whale Tracker: left half whales, right half flow over discovery. */
const TEMPLATE_B: PaneLayout[] = [
  { i: 'b-whales', widget: 'whales', x: 0, y: 0, w: 6, h: 10 },
  { i: 'b-flow', widget: 'flow', x: 6, y: 0, w: 6, h: 5 },
  { i: 'b-disc', widget: 'discovery', x: 6, y: 5, w: 6, h: 5 },
];

/** Template C — System Admin (God Mode): server health row, then CRM + financials. */
const TEMPLATE_C: PaneLayout[] = [
  { i: 'c-health', widget: 'server_health', x: 0, y: 0, w: 12, h: 4 },
  { i: 'c-crm', widget: 'user_crm', x: 0, y: 4, w: 7, h: 6 },
  { i: 'c-fin', widget: 'financials', x: 7, y: 4, w: 5, h: 6 },
];

export const TEMPLATES: Record<'A' | 'B' | 'C', { name: string; adminOnly?: boolean; layout: PaneLayout[] }> = {
  A: { name: 'Core Regime', layout: TEMPLATE_A },
  B: { name: 'Whale Tracker', layout: TEMPLATE_B },
  C: { name: 'System Admin (God Mode)', adminOnly: true, layout: TEMPLATE_C },
};

/** Deep clone a template layout so callers never mutate the source. */
export function cloneTemplate(key: 'A' | 'B' | 'C'): PaneLayout[] {
  return TEMPLATES[key].layout.map((p) => ({ ...p }));
}
