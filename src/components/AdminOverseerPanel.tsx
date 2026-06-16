import React, { useState, useEffect } from 'react';
import { ShieldAlert, Users, Activity, DollarSign, XOctagon, Key, MonitorPlay } from 'lucide-react';

interface AdminPanelProps {
  session: any;
  onSimulateTier: (tierStr: string, tierNum: number) => void;
}

export function AdminOverseerPanel({ session, onSimulateTier }: AdminPanelProps) {
  if (!session?.is_super_admin) {
    return (
      <div className="p-8 text-center bg-[#050505] border border-rose-500/30">
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-4" />
        <h2 className="text-xl font-black text-white uppercase tracking-widest">UNAUTHORIZED ACCESS LOGGED</h2>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto font-mono text-zinc-300 p-6">
      <div className="border-b border-zinc-900 pb-4 mb-6">
        <h2 className="text-xl font-black tracking-widest text-white uppercase flex items-center gap-3">
          <Key className="w-6 h-6 text-rose-500" />
          OVERSEER COMMAND MATRIX
        </h2>
        <p className="text-xs text-zinc-500 uppercase tracking-widest mt-1">
          Master system controls and global network analytics.
        </p>
      </div>

      {/* NEW: VIEWPORT SPOOFING MATRIX */}
      <div className="bg-[#050505] border border-zinc-900 p-5 mb-8">
        <div className="flex items-center gap-2 text-xs text-white font-black uppercase tracking-widest mb-4 border-b border-zinc-900 pb-2">
          <MonitorPlay className="w-4 h-4 text-sky-500" />
          QA Viewport Simulation Engine
        </div>
        <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-4">
          Temporarily strip master clearance to audit platform restrictions and paywalls from a standard user perspective.
        </p>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => onSimulateTier('guest', 0)}
            className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors"
          >
            Simulate Unpaid Guest
          </button>
          <button 
            onClick={() => onSimulateTier('intraday', 2)}
            className="bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-400 px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors"
          >
            Simulate Intraday Tier
          </button>
          <button 
            onClick={() => onSimulateTier('quant', 3)}
            className="bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors"
          >
            Simulate Quant Tier
          </button>
        </div>
      </div>
    </div>
  );
}
