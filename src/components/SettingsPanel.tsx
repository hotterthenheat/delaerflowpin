import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Settings, 
  HelpCircle, 
  Type, 
  Eye, 
  Palette, 
  RefreshCw, 
  Coins, 
  Share2, 
  Receipt, 
  Calculator,
  ShieldAlert,
  FolderSync
} from 'lucide-react';

interface SettingsPanelProps {
  session: any;
  onUpdateSession: () => void;
}

export function SettingsPanel({ session, onUpdateSession }: SettingsPanelProps) {
  const [selectedFont, setSelectedFont] = useState<'STANDARD' | 'ENHANCED'>(session?.selected_font_scale || 'STANDARD');
  const [compactMode, setCompactMode] = useState<boolean>(!!session?.compact_view_enabled);
  const [activeTheme, setActiveTheme] = useState<string>(session?.selected_theme || 'SLAYER PURE DARK');
  
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSimulatingInvoice, setIsSimulatingInvoice] = useState(false);
  const [invoiceLog, setInvoiceLog] = useState<any | null>(null);
  const [referralCopied, setReferralCopied] = useState(false);

  // Link for copy
  const referralLink = typeof window !== 'undefined' 
    ? `${window.location.origin}/?ref=${session?.custom_referral_code || 'SLAYERX'}` 
    : `/?ref=${session?.custom_referral_code || 'SLAYERX'}`;

  const handleSaveSettings = async (font: 'STANDARD' | 'ENHANCED', compact: boolean, theme: string) => {
    setIsUpdating(true);
    try {
      const res = await fetch('/api/settings/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selected_font_scale: font,
          compact_view_enabled: compact,
          selected_theme: theme
        })
      });

      if (res.ok) {
        onUpdateSession();
      }
    } catch (e) {
      console.error('Failed to update Settings parameters', e);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRunSimulatedBilling = async () => {
    setIsSimulatingInvoice(true);
    setInvoiceLog(null);
    try {
      const res = await fetch('/api/billing/sim-cron-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (res.ok) {
        const data = await res.json();
        setInvoiceLog(data);
        // Refresh token stats on header
        onUpdateSession();
      }
    } catch (e) {
      console.error('Invoice simulation failed', e);
    } finally {
      setIsSimulatingInvoice(false);
    }
  };

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    setReferralCopied(true);
    setTimeout(() => setReferralCopied(false), 2000);
  };

  return (
    <div id="slayer-settings-panel" className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 text-left font-mono">
      
      {/* Col 1-7: Appearance settings */}
      <div className="lg:col-span-7 space-y-6">
        
        {/* Module 6: Appearance customization option box */}
        <div className="bg-[#0a0a0c] border border-zinc-900 rounded-xl p-6 space-y-5 relative">
          <div className="absolute top-0 right-0 p-3 text-[8.5px] text-zinc-600 font-bold uppercase tracking-widest">
            Module-06 Panel
          </div>

          <div className="flex items-center gap-2.5 border-b border-zinc-900 pb-3">
            <Settings className="w-5 h-5 text-indigo-400" />
            <h2 className="text-sm font-sans font-black tracking-tight text-white uppercase">
              Terminal Workstation Personalization
            </h2>
          </div>

          {/* Option A: Font Size Scaling (STANDARD vs ENHANCED) */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[10px] uppercase font-black text-white tracking-widest">
              <Type className="w-3.5 h-3.5 text-zinc-550 shrink-0" />
              <span>Global Typography Profile</span>
            </div>
            <p className="text-[9px] text-[#8e8e93] leading-normal uppercase">
              Configure system terminal font scale. Enhanced scaling optimizes readability on massive high-pixel monitors.
            </p>
            
            <div className="grid grid-cols-2 gap-2 mt-2">
              <button
                onClick={() => {
                  setSelectedFont('STANDARD');
                  handleSaveSettings('STANDARD', compactMode, activeTheme);
                }}
                className={`py-2 px-3 border text-[10px] uppercase font-black tracking-widest rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  selectedFont === 'STANDARD'
                    ? 'bg-zinc-900 border-indigo-500 text-white shadow-md'
                    : 'bg-black border-zinc-900 text-zinc-500 hover:text-white'
                }`}
              >
                <span>◌ Standard Size</span>
              </button>
              <button
                onClick={() => {
                  setSelectedFont('ENHANCED');
                  handleSaveSettings('ENHANCED', compactMode, activeTheme);
                }}
                className={`py-2 px-3 border text-[10px] uppercase font-black tracking-widest rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  selectedFont === 'ENHANCED'
                    ? 'bg-zinc-900 border-indigo-500 text-white shadow-md'
                    : 'bg-black border-zinc-900 text-zinc-500 hover:text-white'
                }`}
              >
                <span>◈ Enhanced Scale (+8%)</span>
              </button>
            </div>
          </div>

          {/* Option B: Compact rows spacing density (denser row rendering overlay) */}
          <div className="pt-2 border-t border-zinc-900/60 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[10px] uppercase font-black text-white tracking-widest">
                <Eye className="w-3.5 h-3.5 text-zinc-550 shrink-0" />
                <span>Station Spacing Density</span>
              </div>
              
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={compactMode}
                  onChange={(e) => {
                    const newVal = e.target.checked;
                    setCompactMode(newVal);
                    handleSaveSettings(selectedFont, newVal, activeTheme);
                  }}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-zinc-950 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-550 after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:bg-zinc-950 peer-checked:bg-indigo-600 peer-checked:after:bg-white" />
              </label>
            </div>
            <p className="text-[9px] text-[#8e8e93] leading-normal uppercase">
              Toggle Compact View mode. Restructures vertical list paddings, layout metrics, and grid density for extreme information bandwidth.
            </p>
          </div>

          {/* Option C: Background Theme custom drop-down selection */}
          <div className="pt-2 border-t border-zinc-900/60 space-y-2">
            <div className="flex items-center gap-2 text-[10px] uppercase font-black text-white tracking-widest">
              <Palette className="w-3.5 h-3.5 text-zinc-550 shrink-0" />
              <span>Institutional Theme Layer</span>
            </div>
            <p className="text-[9px] text-[#8e8e93] leading-normal uppercase mb-2">
              Alters background containment fields and surface panels colors. Core execute labels and indicator marker colors are permanently frozen!
            </p>

            <select
              value={activeTheme}
              onChange={(e) => {
                const newVal = e.target.value;
                setActiveTheme(newVal);
                handleSaveSettings(selectedFont, compactMode, newVal);
              }}
              className="w-full bg-black border border-zinc-900 text-white rounded-lg p-3 text-xs focus:outline-none focus:border-zinc-700 transition-colors uppercase font-mono cursor-pointer"
            >
              <option value="SLAYER PURE DARK">SLAYER PURE DARK (Pitch Black)</option>
              <option value="DEALER FLOW SLATE">DEALER FLOW SLATE (Navy Matte)</option>
              <option value="VOLATILITY RADAR">VOLATILITY RADAR (Low-Light Night Violet)</option>
              <option value="CARBON MONITOR MATTE">CARBON MONITOR MATTE (Industrial Charcoal)</option>
            </select>
          </div>
        </div>

        {/* Informational notification */}
        <div className="p-4 bg-zinc-950/40 border border-zinc-900 text-[10px] rounded-xl font-mono uppercase text-[#a1a1aa] leading-relaxed flex gap-3">
          <ShieldAlert className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <span>
            Strict System Lock: Changing themes only shifts parent-level backdrops. Directives mandate that all key visual execution marks, heat maps, and status flags (GEX columns, Buy/Wait, <span className="text-zinc-300 font-bold">HOLDING</span>, <span className="text-zinc-300 font-bold">TESTING</span>, <span className="text-zinc-300 font-bold">FAILING</span> labels) must never shift hues.
          </span>
        </div>
      </div>

      {/* Col 8-12: Referrals Token discount vault & Invoice simulation */}
      <div className="lg:col-span-5 space-y-6">
        
        {/* Module 5: Referrals token stats */}
        <div className="bg-[#0a0a0c] border border-zinc-900 rounded-xl p-6 space-y-5 relative">
          <div className="absolute top-0 right-0 p-3 text-[8.5px] text-zinc-650 font-bold uppercase tracking-widest">
            Module-05 Engine
          </div>

          <div className="flex items-center gap-2.5 border-b border-zinc-900 pb-3">
            <Coins className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm font-sans font-black tracking-tight text-white uppercase">
              Referral Rewards Token Pool
            </h2>
          </div>

          {/* Referral Token Pool Dashboard metrics */}
          <div className="grid grid-cols-2 gap-3 bg-black/40 border border-zinc-950 rounded-xl p-4 text-center">
            <div className="space-y-1">
              <span className="text-[8px] text-zinc-500 uppercase font-black block tracking-widest">YOUR TOKENS</span>
              <span className="text-2xl font-black text-emerald-400 font-mono block drop-shadow-[0_0_8px_rgba(16,185,129,0.2)]">
                {session?.referral_tokens_pool || 0}
              </span>
              <span className="text-[7.5px] text-zinc-600 block uppercase font-mono">1 Token = 10% Off</span>
            </div>
            
            <div className="space-y-1 border-l border-zinc-900/60 pl-3">
              <span className="text-[8px] text-zinc-500 uppercase font-black block tracking-widest">CURRENT DISCOUNT</span>
              <span className="text-2xl font-black text-white font-mono block">
                {Math.min(100, (session?.referral_tokens_pool || 0) * 10)}%
              </span>
              <span className="text-[7.5px] text-[#8e8e93] block uppercase font-mono">Simulated Multipliers</span>
            </div>
          </div>

          {/* Your custom referral code */}
          <div className="space-y-2">
            <span className="text-[9px] text-[#A1A1AA] uppercase tracking-widest font-black block">Your Custom Referral Code</span>
            <div className="flex gap-2">
              <div className="flex-1 bg-zinc-950 border border-zinc-900 text-white rounded-lg px-3 py-2 text-xs font-bold font-mono tracking-wider flex items-center justify-between">
                <span>{session?.custom_referral_code || 'SLAYERX9Y2'}</span>
                <span className="text-[8px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded">Active</span>
              </div>
              <button
                onClick={copyReferralLink}
                className="px-3.5 py-1.5 bg-zinc-900 border border-zinc-850 hover:bg-zinc-850 text-zinc-300 hover:text-white rounded-lg flex items-center justify-center cursor-pointer transition-colors"
                title="Copy full referral link to clipboard"
              >
                {referralCopied ? <span className="text-[9px] uppercase text-emerald-400 font-black">Copied!</span> : <Share2 className="w-4 h-4 text-zinc-400" />}
              </button>
            </div>
            <p className="text-[8.5px] text-zinc-500 leading-normal uppercase">
              Send your link to traders. They receive a 5% discount on checkout, and you earn exactly 1 Token when they pay. Earn 10 tokens for a 100% free workstation month!
            </p>
          </div>

          {/* Invoice simulation box */}
          <div className="pt-2 border-t border-[#121217] space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[9px] text-[#A1A1AA] uppercase tracking-widest font-black block">Interactive Billing Test</span>
              <span className="text-[8px] bg-[#0c1824] px-2 py-0.5 border border-[#1e1e24] rounded text-zinc-400">Sandbox</span>
            </div>
            <p className="text-[8.5px] text-zinc-500 leading-normal uppercase">
              Test your infinite rollover pool. Click below to trigger a simulated monthly cron-job run. Up to 10 tokens will load as invoice deductions, with excess tokens rolled over.
            </p>

            <button
              onClick={handleRunSimulatedBilling}
              disabled={isSimulatingInvoice}
              className="w-full py-2.5 bg-indigo-500/10 border border-indigo-500/30 hover:bg-[#6366f1]/20 text-indigo-400 font-black text-[10px] uppercase tracking-widest rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              {isSimulatingInvoice ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>CALCULATING INVOICE LEDGERS...</span>
                </>
              ) : (
                <>
                  <Calculator className="w-3.5 h-3.5" />
                  <span>Run Simulated Billing Invoice</span>
                </>
              )}
            </button>

            {invoiceLog && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#050506] border border-zinc-900 rounded-lg p-3 text-left font-mono text-[8px] text-[#a1a1aa] leading-relaxed space-y-1 mt-2 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-1 bg-indigo-500/10 border-l border-b border-zinc-900 text-indigo-400 font-black tracking-widest text-[7px] uppercase select-none">Invoice Receipt</div>
                <div className="text-[7.5px] text-zinc-650 font-black tracking-widest uppercase border-b border-zinc-900 pb-1 mb-1.5 flex justify-between">
                  <span>BILLING_RUN_RESULT // SUCCESS</span>
                  <span className="text-zinc-600 font-normal">Active tier: {invoiceLog.access_tier}</span>
                </div>
                <div>Plan Base Monthly Tariff: <span className="text-white font-bold font-mono">${invoiceLog.base_rate}.00</span></div>
                <div>Invoice Tokens Redeemed: <span className="text-rose-400 text-right">-{invoiceLog.tokens_deducted} Tokens ({invoiceLog.discount_rate_pct}% Off)</span></div>
                <div>Applied Deduction Credit: <span className="text-emerald-400 text-right">-${invoiceLog.discount_amount_usd.toFixed(2)} USD</span></div>
                <div className="border-t border-zinc-900/60 pt-1 mt-1 font-bold flex justify-between text-[9px]">
                  <span className="text-[#f4f4f5]">Net Amount Charged:</span>
                  <span className="text-emerald-400">${invoiceLog.total_charged_usd.toFixed(2)} USD</span>
                </div>
                <div className="border-t border-dashed border-zinc-900/80 pt-1 mt-1 text-[7.5px] text-zinc-600 uppercase flex gap-1.5 items-center">
                  <FolderSync className="w-3 h-3 text-indigo-400/80" />
                  <span>Rollover Vault: {invoiceLog.tokens_remaining_rolled_over} Tokens rolled over safely for next months.</span>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
