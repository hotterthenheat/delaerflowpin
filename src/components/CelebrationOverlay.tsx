import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Trophy, Shield, Cpu } from 'lucide-react';

interface CelebrationOverlayProps {
  purchasedTier: number; // 1: Discord, 2: Intraday, 3: Quant, 4/5: Lifetime/Enterprise
  onComplete: () => void;
  isOpen: boolean;
}

export function CelebrationOverlay({ purchasedTier, onComplete, isOpen }: CelebrationOverlayProps) {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; color: string; size: number; delay: number }>>([]);
  const [matrixCols, setMatrixCols] = useState<Array<{ id: number; text: string; left: number; speed: number; delay: number }>>([]);

  useEffect(() => {
    if (!isOpen) return;

    // Discord buyers (Tier 1) bypass the animation completely!
    if (purchasedTier === 1) {
      const t = setTimeout(() => {
        onComplete();
      }, 50);
      return () => clearTimeout(t);
    }

    // Set auto-dismiss timer exactly after 3 seconds
    const dismissTimer = setTimeout(() => {
      onComplete();
    }, 3000);

    // Initializations for Tier effects
    if (purchasedTier === 2) {
      // Confetti burst particles (Institutional Green / Emerald / White)
      const colors = ['#30d158', '#34c759', '#ffffff', '#a1a1aa', '#10b981'];
      const newParticles = Array.from({ length: 60 }).map((_, i) => ({
        id: i,
        x: Math.random() * 100, // percentage left
        y: Math.random() * 20 - 10, // start above/middle
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 4,
        delay: Math.random() * 0.5
      }));
      setParticles(newParticles);
    } else if (purchasedTier === 3) {
      // Matrix Money falling data lines
      const codeChars = ['$', 'GEX', 'VOL', 'QQQ', 'SPX', '100x', 'HOLDING', 'TESTING', 'CALL', 'PUT'];
      const newCols = Array.from({ length: 25 }).map((_, i) => ({
        id: i,
        text: Array.from({ length: 8 }).map(() => codeChars[Math.floor(Math.random() * codeChars.length)]).join(' '),
        left: (i * 100) / 25 + Math.random() * 2,
        speed: Math.random() * 1.5 + 1.2,
        delay: Math.random() * 0.4
      }));
      setMatrixCols(newCols);
    }

    return () => clearTimeout(dismissTimer);
  }, [isOpen, purchasedTier, onComplete]);

  if (!isOpen || purchasedTier === 1) return null;

  return (
    <AnimatePresence>
      <motion.div 
        id="celebration-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] bg-[#050506]/95 backdrop-blur-xl flex flex-col items-center justify-center overflow-hidden font-mono"
      >
        {/* Tier 2 effect: Confetti Burst */}
        {purchasedTier === 2 && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {particles.map((p) => (
              <motion.div
                key={p.id}
                initial={{ 
                  x: `${p.x}vw`, 
                  y: '-10vh', 
                  opacity: 1, 
                  rotate: 0 
                }}
                animate={{ 
                  y: '110vh', 
                  opacity: [1, 1, 0], 
                  rotate: 360 
                }}
                transition={{ 
                  duration: 2.2, 
                  ease: "easeOut", 
                  delay: p.delay 
                }}
                style={{
                  position: 'absolute',
                  width: p.size,
                  height: p.size,
                  backgroundColor: p.color,
                  borderRadius: p.id % 2 === 0 ? '50%' : '2px',
                }}
              />
            ))}
          </div>
        )}

        {/* Tier 3 effect: Green Matrix Money rain */}
        {purchasedTier === 3 && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden selection:bg-transparent text-emerald-500/30 text-[9px] font-mono leading-none">
            {matrixCols.map((col) => (
              <motion.div
                key={col.id}
                initial={{ y: '-50vh', opacity: 0 }}
                animate={{ y: '120vh', opacity: [0, 1, 1, 0] }}
                transition={{ 
                  duration: col.speed, 
                  repeat: Infinity, 
                  ease: "linear", 
                  delay: col.delay 
                }}
                style={{
                  position: 'absolute',
                  left: `${col.left}%`,
                  writingMode: 'vertical-rl',
                  textOrientation: 'upright',
                }}
                className="text-[#30d158] drop-shadow-[0_0_4px_#30d158]"
              >
                {col.text}
              </motion.div>
            ))}
          </div>
        )}

        {/* Tier 4 & 5 effect: Elite Gold Matrix Topography Scanline */}
        {(purchasedTier === 4 || purchasedTier === 5) && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {/* Topography Golden Scanline Grid */}
            <div className="absolute inset-0 opacity-[0.12] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-500/50 via-zinc-950 to-zinc-950" />
            
            {/* Horizontal sweep laser scanline */}
            <motion.div
              initial={{ translateY: '-10vh' }}
              animate={{ translateY: '110vh' }}
              transition={{ duration: 1.5, repeat: 2, ease: "linear" }}
              className="absolute left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_20px_#fbbf24] z-10"
            />

            {/* Matrix code lines in golden hue */}
            <div className="absolute inset-0 opacity-15 flex flex-col justify-around text-amber-500/20 text-[7.5px] font-mono leading-none select-none">
              {Array.from({ length: 15 }).map((_, i) => (
                <div key={i} className="whitespace-nowrap overflow-hidden animate-pulse" style={{ animationDelay: `${i * 0.15}s` }}>
                  {Array.from({ length: 10 }).map(() => `SYS_SECURE_AUTH_GRANTED // ID_${Math.round(Math.random() * 99999)} // TOPOGRAPHY_GRID_ACTIVE_LOCK_VERIFIED`).join('  ---  ')}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Centered Main Panel visualizer card */}
        <motion.div
          initial={{ scale: 0.9, y: 15, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          transition={{ type: "spring", damping: 15, stiffness: 100 }}
          style={{
            borderColor: purchasedTier === 4 || purchasedTier === 5 ? '#f59f0a' : '#30d158',
          }}
          className={`relative max-w-lg w-full mx-4 p-8 bg-[#0a0a0c]/98 border rounded-xl rounded-md shadow-[0_0_50px_rgba(0,0,0,0.8)] text-center space-y-5 border-zinc-900`}
        >
          {/* Top holographic scanner corner accents */}
          <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-zinc-700 rounded-tl-sm" />
          <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-zinc-700 rounded-tr-sm" />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-zinc-700 rounded-bl-sm" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-zinc-700 rounded-br-sm" />

          {/* Icon Badge */}
          <div className="flex justify-center">
            <div className={`p-4 rounded-full ${
              purchasedTier === 4 || purchasedTier === 5 
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' 
                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
            }`}>
              {purchasedTier === 2 && <Sparkles className="w-8 h-8" />}
              {purchasedTier === 3 && <Trophy className="w-8 h-8 font-black" />}
              {(purchasedTier === 4 || purchasedTier === 5) && <Cpu className="w-8 h-8" />}
            </div>
          </div>

          {/* Action text */}
          <div className="space-y-2">
            <span className={`text-[9px] font-black tracking-widest uppercase px-2.5 py-1 rounded bg-zinc-950 border ${
              purchasedTier === 4 || purchasedTier === 5 ? 'text-amber-400 border-amber-500/20' : 'text-emerald-400 border-emerald-500/20'
            }`}>
              {purchasedTier === 2 && 'TIER 2 // INTRADAY ACTIVATE'}
              {purchasedTier === 3 && 'TIER 3 // QUANT ACTIVE'}
              {purchasedTier === 4 && 'TIER 4 // UNLIMITED ARMORY'}
              {purchasedTier === 5 && 'TIER 5 // LIFETIME GRANTED'}
            </span>
            <h2 className="text-xl md:text-2xl font-sans tracking-tight text-white font-extrabold line-height-tight mt-3">
              Institutional Options Intelligence Activated
            </h2>
            <div className="h-[1px] w-24 bg-gradient-to-r from-transparent via-zinc-800 to-transparent mx-auto my-3" />
            <p className="text-[#a1a1aa] text-xs leading-relaxed max-w-sm mx-auto font-mono uppercase">
              {purchasedTier === 2 && 'Slayer Trade Workstation is spinning up... Secure authorization tokens generated successfully.'}
              {purchasedTier === 3 && 'Slayer Trade Gamma execution engine is locked... Connecting to the CBOE net-position stream.'}
              {(purchasedTier === 4 || purchasedTier === 5) && 'Elite administrative terminal active. Bypassing standard rate shields.'}
            </p>
          </div>

          {/* Status logs */}
          <div className="bg-[#050506] border border-zinc-950 p-3 rounded-lg text-left font-mono text-[8px] text-[#8e8e93] leading-released space-y-1">
            <div className="flex justify-between border-b border-zinc-900 pb-1 mb-1 font-bold text-zinc-650 tracking-widest uppercase">
              <span>LEDGER PROTOCOL LOGS</span>
              <span className={purchasedTier === 4 || purchasedTier === 5 ? 'text-amber-500' : 'text-emerald-400'}>ONLINE</span>
            </div>
            <div className="truncate"><span className="text-zinc-600">&gt;&gt;</span> ENCRYPTION KEY HANDSHAKE COMPLETE</div>
            <div className="truncate"><span className="text-zinc-600">&gt;&gt;</span> ACCESS TIER WRITE VERIFIED (TIER_{purchasedTier})</div>
            <div className="truncate"><span className="text-zinc-600">&gt;&gt;</span> ALL SUBSCRIPTION TERMINALS COMMITTED SECURELY</div>
          </div>

          {/* Standard 3s status progress bar */}
          <div className="w-full bg-[#121215] h-[2px] rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 3, ease: 'linear' }}
              className={`h-full ${purchasedTier === 4 || purchasedTier === 5 ? 'bg-amber-400' : 'bg-emerald-400'}`}
            />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
