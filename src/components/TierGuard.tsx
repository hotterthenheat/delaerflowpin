import React, { ReactNode } from 'react';
import { useContractStore } from '../lib/store';
import { Lock, ArrowRight, ShieldCheck, Check, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

interface TierGuardProps {
  requiredTier: number;
  tabKey: string;
  planKey: string;
  planName: string;
  planPrice: string;
  children: ReactNode;
}

// Interactive details specific to each tier
const TIER_LOOKUP: Record<string, {
  badge: string;
  desc: string;
  features: string[];
  accentColor: string;
  badgeBg: string;
}> = {
  discord: {
    badge: "Tier 1 // Discord Plan",
    desc: "Gain entry to high-speed trade alerts and active trader community discussion channels.",
    features: [
      "Real-time Discord Chat & Alerts Feed",
      "Daily Options Discovery Reports",
      "Verified Historical Trade Archives"
    ],
    accentColor: "indigo",
    badgeBg: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
  },
  skyvision: {
    badge: "Tier 2 // SkyVision Cockpit",
    desc: "Gain access to real-time Volatility Solvers and advanced expected P&L calculation dashboards.",
    features: [
      "SVI Volatility Surface Solver Engine",
      "Live Strategy Health Tracking Indexes",
      "Expected P&L Simulation Models",
      "Full Discord Alert Suite Included"
    ],
    accentColor: "blue",
    badgeBg: "bg-blue-500/10 text-blue-400 border-blue-500/20"
  },
  pinpoint: {
    badge: "Tier 3 // Pinpoint Gexbot",
    desc: "Track market maker position changes and key GEX trends.",
    features: [
      "Pinpoint Gexbot Exposure Tracker Feed",
      "Live Gamma (GEX), Delta (DEX) & Vega (VEX) Strips",
      "Interactive Dealer Spot Placement Grid",
      "Includes Tiers 1 and 2 Access"
    ],
    accentColor: "emerald",
    badgeBg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
  },
  quant: {
    badge: "Tier 4 // Quant Suite",
    desc: "Empower your portfolio with high-speed order flow tapes, backtesting, and market microstructure tracking.",
    features: [
      "Full Algorithmic Backtesting Sandbox",
      "Displacement Valuations & Speed Gauges",
      "High-Speed Microstructure Liquidity Monitor",
      "All Premium Platform Tiers Unlocked"
    ],
    accentColor: "violet",
    badgeBg: "bg-violet-500/10 text-violet-400 border-violet-500/20"
  }
};

export default function TierGuard({
  requiredTier,
  tabKey,
  planKey,
  planName,
  planPrice,
  children
}: TierGuardProps) {
  const purchasedTier = useContractStore(s => s.purchasedTier);
  const setCheckoutPlan = useContractStore(s => s.setCheckoutPlan);
  const setActiveTab = useContractStore(s => s.setActiveTab);

  const hasAccess = purchasedTier >= requiredTier;

  if (hasAccess) {
    return <>{children}</>;
  }

  // Retrieve plan specific metadata, default to discord values if safe-guarding
  const details = TIER_LOOKUP[planKey] || TIER_LOOKUP['discord'];

  const handleLiveCheckout = () => {
    setCheckoutPlan(planKey);
    setActiveTab('home');
  };

  // Build current vs target designation labels
  const getTierLabel = (tierNum: number) => {
    if (tierNum === 1) return "Tier 1: Discord Plan";
    if (tierNum === 2) return "Tier 2: SkyVision Cockpit";
    if (tierNum === 3) return "Tier 3: Pinpoint Gexbot";
    if (tierNum === 4) return "Tier 4: Quant Suite";
    if (tierNum >= 5) return "Tier 5: Lifetime Pass";
    return "Tier 0: Sandbox Edition";
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-full max-w-3xl mx-auto my-12 border border-zinc-800/80 bg-gradient-to-b from-[#09090b] via-[#070709] to-[#040405] rounded-3xl relative overflow-hidden shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] p-6 md:p-10"
    >
      {/* Decorative mechanical accents */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-zinc-850 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-zinc-900 to-transparent" />

      {/* Top action header info */}
      <div className="flex flex-col items-center text-center space-y-4 relative z-10 pb-4">
        {/* Dynamic Badge */}
        <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-wider font-mono ${details.badgeBg}`}>
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          <span>{details.badge}</span>
        </div>

        {/* Locked Core Headline */}
        <div className="space-y-2">
          <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight font-sans flex items-center justify-center gap-2.5">
            <Lock className="w-5 h-5 text-indigo-400" />
            <span>{tabKey.toUpperCase()} LEVEL ACCESS REQUIRED</span>
          </h3>
          <p className="text-xs text-zinc-400 max-w-lg leading-relaxed font-sans mt-1">
            {details.desc} Purchase or upgrade your plan below to unlock this workspace tab.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch relative z-10 py-6 my-2 border-y border-zinc-900/85">
        {/* Left Grid Section: Interactive features checklist of what they will unlock */}
        <div className="bg-[#050556]/5 border border-zinc-850/60 rounded-2xl p-5 flex flex-col justify-between space-y-4">
          <div>
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest font-mono block mb-3">
              GUARANTEED TIER ACCESS INCLUSIONS
            </span>
            <div className="space-y-3">
              {details.features.map((feature, i) => (
                <div key={i} className="flex items-start gap-2.5 text-xs text-zinc-300">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-emerald-400" />
                  </span>
                  <span className="font-mono text-zinc-300 leading-snug">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-[10px] text-zinc-500 border-t border-zinc-900 pt-3 flex items-center gap-1.5 uppercase font-mono">
            <ShieldCheck className="w-4 h-4 text-emerald-500/80" />
            <span>Cumulative access tier applies</span>
          </div>
        </div>

        {/* Right Grid Section: Authorization parameters comparing levels */}
        <div className="bg-zinc-950/60 border border-zinc-900/60 rounded-2xl p-5 flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest font-mono block">
              SUBSCRIBER LEVEL DETAIL
            </span>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center bg-[#070709] border border-zinc-900 p-3 rounded-xl">
                <span className="text-[10px] font-mono text-zinc-500 uppercase">CURRENT LEVEL:</span>
                <span className="text-xs font-mono font-bold text-zinc-400">{getTierLabel(purchasedTier)}</span>
              </div>

              <div className="flex justify-between items-center bg-[#101014] border border-indigo-950/40 p-3 rounded-xl">
                <span className="text-[10px] font-mono text-indigo-400 uppercase">REQUIRED LEVEL:</span>
                <span className="text-xs font-mono font-bold text-indigo-300">{getTierLabel(requiredTier)}</span>
              </div>
            </div>
          </div>

          <div className="text-center pt-2">
            <div className="text-[11px] font-mono text-zinc-500">SUBSCRIPTION PRICE:</div>
            <div className="text-2xl font-black text-white font-sans mt-0.5">
              {planPrice} <span className="text-xs text-zinc-500 font-normal">/mo</span>
            </div>
          </div>
        </div>
      </div>

      {/* CTA upgrade trigger matching active pricing tier */}
      <div className="flex flex-col items-center justify-center space-y-3 pt-4 relative z-10 max-w-sm mx-auto">
        <button
          onClick={handleLiveCheckout}
          className="w-full py-3.5 px-6 rounded-xl bg-indigo-505 hover:bg-white hover:text-black border border-zinc-700 bg-zinc-900 text-zinc-200 font-black text-[11px] uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 transform hover:scale-[1.01] active:scale-95 transition-all cursor-pointer"
        >
          <span>GO PREMIUM - ACTIVATE NOW</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}
