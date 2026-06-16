import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldAlert, Users, Activity, Key, MonitorPlay, Radio, ScrollText,
  Ticket, Power, ToggleLeft, ToggleRight, Ban, UserX, LogOut, Eye, Search, RefreshCw,
} from 'lucide-react';

interface AdminPanelProps {
  session: any;
  onSimulateTier: (tierStr: string, tierNum: number) => void;
}

type Tab = 'overview' | 'users' | 'audit' | 'coupons';

async function api(path: string, opts: RequestInit = {}) {
  const res = await fetch(path, { credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, ...opts });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `HTTP ${res.status}`);
  return res.json();
}

export function AdminOverseerPanel({ session, onSimulateTier }: AdminPanelProps) {
  const [tab, setTab] = useState<Tab>('overview');
  const [overview, setOverview] = useState<any>(null);
  const [live, setLive] = useState<number>(0);

  const loadOverview = useCallback(() => {
    api('/api/admin/overview').then((d) => { setOverview(d); setLive(d.live_connections); }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!session?.is_super_admin) return;
    loadOverview();
    const t = setInterval(() => api('/api/admin/live').then((d) => setLive(d.live_connections)).catch(() => {}), 5000);
    return () => clearInterval(t);
  }, [session, loadOverview]);

  if (!session?.is_super_admin) {
    return (
      <div className="p-8 text-center bg-[#050505] border border-rose-500/30 rounded-sm max-w-xl mx-auto mt-10">
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-4" />
        <h2 className="text-xl font-black text-white uppercase tracking-widest">Unauthorized Access Logged</h2>
        <p className="text-[11px] text-zinc-500 mt-2 uppercase tracking-widest">This incident has been recorded to the immutable audit trail.</p>
      </div>
    );
  }

  const TABS: { id: Tab; label: string; icon: any }[] = [
    { id: 'overview', label: 'Command Overview', icon: Activity },
    { id: 'users', label: 'User CRM & Moderation', icon: Users },
    { id: 'audit', label: 'Audit Trail', icon: ScrollText },
    { id: 'coupons', label: 'Coupon Generator', icon: Ticket },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto font-mono text-zinc-300 p-4 md:p-6">
      <div className="border-b border-zinc-900 pb-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black tracking-widest text-white uppercase flex items-center gap-3">
            <Key className="w-6 h-6 text-rose-500" /> Overseer Command Center
          </h2>
          <p className="text-xs text-zinc-500 uppercase tracking-widest mt-1">
            Role: <span className="text-amber-400 font-bold">{overview?.admin_role || session.admin_role || 'super_admin'}</span>
            <span className="mx-2 text-zinc-700">|</span>
            <span className="text-emerald-400">● MFA ENFORCED</span>
          </p>
        </div>
        <div className="flex items-center gap-2 bg-[#0a0a0c] border border-zinc-900 rounded-lg px-4 py-2">
          <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
          <div>
            <div className="text-[8px] text-zinc-500 uppercase tracking-widest font-black">Live Connections</div>
            <div className="text-lg font-black text-white leading-none">{live}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5 mb-6">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-3 py-2 text-[10.5px] font-bold uppercase tracking-widest rounded-md border flex items-center gap-1.5 transition-all ${
                tab === t.id ? 'bg-zinc-900 border-zinc-700 text-white' : 'border-zinc-900 text-zinc-500 hover:text-zinc-300'
              }`}>
              <Icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'overview' && <OverviewTab overview={overview} reload={loadOverview} onSimulateTier={onSimulateTier} />}
      {tab === 'users' && <UsersTab />}
      {tab === 'audit' && <AuditTab />}
      {tab === 'coupons' && <CouponsTab />}
    </div>
  );
}

function StatCard({ label, value, color = 'text-white' }: { label: string; value: any; color?: string }) {
  return (
    <div className="bg-[#0a0a0c] border border-zinc-900 rounded-lg p-3">
      <div className="text-[8px] text-zinc-500 uppercase font-black tracking-widest">{label}</div>
      <div className={`text-2xl font-black mt-1 ${color}`}>{value}</div>
    </div>
  );
}

function OverviewTab({ overview, reload, onSimulateTier }: { overview: any; reload: () => void; onSimulateTier: (s: string, n: number) => void }) {
  const [busy, setBusy] = useState(false);
  const toggleMaintenance = async () => {
    setBusy(true);
    try { await api('/api/admin/maintenance', { method: 'POST', body: JSON.stringify({ enabled: !overview?.maintenance_mode }) }); reload(); } finally { setBusy(false); }
  };
  const toggleFlag = async (key: string, value: boolean) => {
    await api('/api/admin/flags', { method: 'POST', body: JSON.stringify({ key, value }) }).catch(() => {});
    reload();
  };
  const flags = overview?.feature_flags || {};
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Users" value={overview?.total_users ?? '—'} />
        <StatCard label="Live Connections" value={overview?.live_connections ?? '—'} color="text-emerald-400" />
        <StatCard label="Suspended" value={overview?.suspended ?? '—'} color="text-amber-400" />
        <StatCard label="Banned" value={overview?.banned ?? '—'} color="text-rose-400" />
      </div>

      {/* Maintenance */}
      <div className="bg-[#0a0a0c] border border-zinc-900 rounded-lg p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Power className={`w-4 h-4 ${overview?.maintenance_mode ? 'text-rose-400' : 'text-zinc-500'}`} />
            <span className="text-sm font-bold text-white">Maintenance Mode</span>
            {overview?.maintenance_mode && <span className="text-[8px] bg-rose-500/15 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded uppercase font-black tracking-widest">503 Active</span>}
          </div>
          <button onClick={toggleMaintenance} disabled={busy} className="text-zinc-300">
            {overview?.maintenance_mode ? <ToggleRight className="w-9 h-9 text-rose-400" /> : <ToggleLeft className="w-9 h-9 text-zinc-600" />}
          </button>
        </div>
        <p className="text-[10px] text-zinc-500 mt-2 uppercase tracking-widest">Returns 503 Service Unavailable to all non-admin traffic while active.</p>
      </div>

      {/* Feature flags */}
      <div className="bg-[#0a0a0c] border border-zinc-900 rounded-lg p-5">
        <div className="text-sm font-bold text-white mb-3">Feature Toggles</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {Object.keys(flags).map((k) => (
            <button key={k} onClick={() => toggleFlag(k, !flags[k])}
              className="flex items-center justify-between bg-black/40 border border-zinc-900 rounded-md px-3 py-2 hover:border-zinc-700">
              <span className="text-[11px] text-zinc-300">{k.replace(/_/g, ' ')}</span>
              {flags[k] ? <ToggleRight className="w-7 h-7 text-emerald-400" /> : <ToggleLeft className="w-7 h-7 text-zinc-600" />}
            </button>
          ))}
        </div>
      </div>

      {/* QA viewport simulation (retained) */}
      <div className="bg-[#0a0a0c] border border-zinc-900 rounded-lg p-5">
        <div className="flex items-center gap-2 text-sm font-bold text-white mb-3">
          <MonitorPlay className="w-4 h-4 text-sky-500" /> QA Viewport Simulation
        </div>
        <div className="flex flex-wrap gap-2">
          {[['Guest', 0], ['SkyVision', 2], ['Pinpoint', 3], ['Quant', 4], ['Lifetime', 5]].map(([label, n]) => (
            <button key={label as string} onClick={() => onSimulateTier(label as string, n as number)}
              className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest bg-black/40 border border-zinc-800 rounded text-zinc-300 hover:border-sky-500/50 hover:text-white">
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function UsersTab() {
  const [data, setData] = useState<any>({ rows: [], total: 0, page: 1, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api(`/api/admin/users?page=${page}&perPage=10&q=${encodeURIComponent(q)}`).then(setData).catch(() => {}).finally(() => setLoading(false));
  }, [page, q]);
  useEffect(() => { load(); }, [load]);

  const act = async (email: string, action: string) => {
    if (action === 'ban' && !confirm(`Permanently BAN ${email}?`)) return;
    await api(`/api/admin/users/${encodeURIComponent(email)}/${action}`, { method: 'POST' }).catch((e) => alert(e.message));
    if (action === 'impersonate') { window.location.reload(); return; }
    load();
  };
  const impersonate = async (email: string) => {
    if (!confirm(`Impersonate ${email}? You'll view the app as this user (read-only).`)) return;
    await api(`/api/admin/impersonate/${encodeURIComponent(email)}`, { method: 'POST' }).catch((e) => alert(e.message));
    window.location.reload();
  };

  return (
    <div className="space-y-3 animate-fadeIn">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
          <input value={q} onChange={(e) => { setPage(1); setQ(e.target.value); }} placeholder="Search by email, username, name…"
            className="w-full bg-black/50 border border-zinc-900 rounded-lg pl-9 pr-3 py-2.5 text-[11px] text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-700" />
        </div>
        <button onClick={load} className="p-2.5 bg-black/50 border border-zinc-900 rounded-lg text-zinc-400 hover:text-white"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /></button>
      </div>

      <div className="bg-[#0a0a0c] border border-zinc-900 rounded-lg overflow-x-auto">
        <table className="w-full text-[10.5px]">
          <thead>
            <tr className="text-zinc-600 uppercase tracking-widest text-[8.5px] border-b border-zinc-900">
              <th className="text-left p-3">User</th><th className="text-left p-3">Tier</th>
              <th className="text-left p-3">Tokens</th><th className="text-left p-3">Status</th><th className="text-right p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((u: any) => (
              <tr key={u.id} className="border-b border-zinc-950/80 hover:bg-white/[0.02]">
                <td className="p-3">
                  <div className="text-white font-bold">{u.name || u.username}</div>
                  <div className="text-zinc-600">{u.email}</div>
                </td>
                <td className="p-3 uppercase text-zinc-400">{u.access_tier}{u.role !== 'user' && <span className="ml-1 text-amber-400">★</span>}</td>
                <td className="p-3 text-zinc-300">{u.referral_tokens_pool}</td>
                <td className="p-3">
                  {u.banned ? <span className="text-rose-400 font-bold">BANNED</span> : u.suspended ? <span className="text-amber-400 font-bold">SUSPENDED</span> : <span className="text-emerald-400">Active</span>}
                </td>
                <td className="p-3">
                  <div className="flex items-center justify-end gap-1.5">
                    <button title="Impersonate" onClick={() => impersonate(u.email)} className="p-1.5 rounded hover:bg-sky-500/15 text-sky-400"><Eye className="w-3.5 h-3.5" /></button>
                    <button title={u.suspended ? 'Unsuspend' : 'Suspend'} onClick={() => act(u.email, u.suspended ? 'unsuspend' : 'suspend')} className="p-1.5 rounded hover:bg-amber-500/15 text-amber-400"><UserX className="w-3.5 h-3.5" /></button>
                    <button title="Force Logout" onClick={() => act(u.email, 'force-logout')} className="p-1.5 rounded hover:bg-zinc-500/15 text-zinc-400"><LogOut className="w-3.5 h-3.5" /></button>
                    <button title={u.banned ? 'Unban' : 'Ban'} onClick={() => act(u.email, u.banned ? 'unban' : 'ban')} className="p-1.5 rounded hover:bg-rose-500/15 text-rose-400"><Ban className="w-3.5 h-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {data.rows.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-zinc-600 uppercase tracking-widest">No users</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-[10px] text-zinc-500 uppercase tracking-widest">
        <span>{data.total} users · page {data.page}/{data.totalPages}</span>
        <div className="flex gap-2">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1.5 bg-black/50 border border-zinc-900 rounded disabled:opacity-40">Prev</button>
          <button disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1.5 bg-black/50 border border-zinc-900 rounded disabled:opacity-40">Next</button>
        </div>
      </div>
    </div>
  );
}

function AuditTab() {
  const [entries, setEntries] = useState<any[]>([]);
  useEffect(() => { api('/api/admin/audit').then((d) => setEntries(d.entries || [])).catch(() => {}); }, []);
  return (
    <div className="bg-[#0a0a0c] border border-zinc-900 rounded-lg overflow-x-auto animate-fadeIn">
      <table className="w-full text-[10.5px]">
        <thead>
          <tr className="text-zinc-600 uppercase tracking-widest text-[8.5px] border-b border-zinc-900">
            <th className="text-left p-3">Timestamp</th><th className="text-left p-3">Admin</th>
            <th className="text-left p-3">Action</th><th className="text-left p-3">Target</th>
            <th className="text-left p-3">Method</th><th className="text-left p-3">IP</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => (
            <tr key={e.id} className="border-b border-zinc-950/80">
              <td className="p-3 text-zinc-500">{new Date(e.timestamp).toLocaleString()}</td>
              <td className="p-3 text-zinc-300">{e.admin_email}</td>
              <td className="p-3 text-amber-400 font-bold">{e.action_taken}</td>
              <td className="p-3 text-zinc-400">{e.target_id}</td>
              <td className="p-3 text-zinc-500">{e.method}</td>
              <td className="p-3 text-zinc-600">{e.ip_address}</td>
            </tr>
          ))}
          {entries.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-zinc-600 uppercase tracking-widest">No audit entries yet</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

function CouponsTab() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [form, setForm] = useState({ code: '', discount_type: 'PERCENT', discount_value: 10, redemption_limit: 100, user_restriction: '', expires_at: '' });
  const [msg, setMsg] = useState('');
  const load = () => api('/api/admin/coupons').then((d) => setCoupons(d.coupons || [])).catch(() => {});
  useEffect(() => { load(); }, []);
  const create = async () => {
    setMsg('');
    try { await api('/api/admin/coupons', { method: 'POST', body: JSON.stringify(form) }); setMsg('Coupon created.'); setForm({ ...form, code: '' }); load(); }
    catch (e: any) { setMsg(e.message); }
  };
  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="bg-[#0a0a0c] border border-zinc-900 rounded-lg p-5 space-y-3">
        <div className="text-sm font-bold text-white">Generate Coupon</div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <input placeholder="CODE (A-Z 0-9)" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') })}
            className="bg-black/50 border border-zinc-900 rounded-md px-3 py-2 text-[11px] text-white uppercase placeholder:text-zinc-600 focus:outline-none focus:border-zinc-700" />
          <select value={form.discount_type} onChange={(e) => setForm({ ...form, discount_type: e.target.value })}
            className="bg-black/50 border border-zinc-900 rounded-md px-3 py-2 text-[11px] text-white focus:outline-none">
            <option value="PERCENT">Percent %</option><option value="FIXED">Fixed $</option>
          </select>
          <input type="number" placeholder="Value" value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: Number(e.target.value) })}
            className="bg-black/50 border border-zinc-900 rounded-md px-3 py-2 text-[11px] text-white focus:outline-none focus:border-zinc-700" />
          <input type="number" placeholder="Redemption limit" value={form.redemption_limit} onChange={(e) => setForm({ ...form, redemption_limit: Number(e.target.value) })}
            className="bg-black/50 border border-zinc-900 rounded-md px-3 py-2 text-[11px] text-white focus:outline-none focus:border-zinc-700" />
          <input placeholder="User restriction (email, optional)" value={form.user_restriction} onChange={(e) => setForm({ ...form, user_restriction: e.target.value })}
            className="bg-black/50 border border-zinc-900 rounded-md px-3 py-2 text-[11px] text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-700" />
          <input type="date" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
            className="bg-black/50 border border-zinc-900 rounded-md px-3 py-2 text-[11px] text-white focus:outline-none focus:border-zinc-700" />
        </div>
        <div className="flex items-center gap-3">
          <button onClick={create} className="px-4 py-2 bg-emerald-600/15 border border-emerald-500/30 text-emerald-400 rounded-md text-[11px] font-bold uppercase tracking-widest hover:bg-emerald-600/25">Generate</button>
          {msg && <span className="text-[10px] text-zinc-400">{msg}</span>}
        </div>
      </div>

      <div className="bg-[#0a0a0c] border border-zinc-900 rounded-lg overflow-x-auto">
        <table className="w-full text-[10.5px]">
          <thead><tr className="text-zinc-600 uppercase tracking-widest text-[8.5px] border-b border-zinc-900">
            <th className="text-left p-3">Code</th><th className="text-left p-3">Discount</th><th className="text-left p-3">Limit</th><th className="text-left p-3">Restriction</th><th className="text-left p-3">Expires</th>
          </tr></thead>
          <tbody>
            {coupons.map((c) => (
              <tr key={c.code} className="border-b border-zinc-950/80">
                <td className="p-3 text-white font-bold">{c.code}</td>
                <td className="p-3 text-emerald-400">{c.discount_type === 'PERCENT' ? `${c.discount_value}%` : `$${c.discount_value}`}</td>
                <td className="p-3 text-zinc-400">{c.redemptions}/{c.redemption_limit || '∞'}</td>
                <td className="p-3 text-zinc-500">{c.user_restriction || 'any'}</td>
                <td className="p-3 text-zinc-500">{c.expires_at || 'never'}</td>
              </tr>
            ))}
            {coupons.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-zinc-600 uppercase tracking-widest">No coupons yet</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminOverseerPanel;
