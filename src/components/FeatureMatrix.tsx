/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import {
  Compass,
  Crosshair,
  Waves,
  ShieldCheck,
  Check,
  ArrowRight,
} from 'lucide-react';

interface FeatureMatrixProps {
  onEnterApp: (targetTab?: string) => void;
}

const ENGINES = [
  {
    icon: Compass,
    accent: 'text-sky-400',
    glow: 'rgba(56,189,248,0.45)',
    name: 'SkyVision Cockpit',
    tier: 'TIER 2',
    tagline: 'Quantitative decision engine',
    features: [
      'V11 system score across 10 weighted factors',
      'Displacement, structure & liquidity mapping',
      'Real-time take-profit & invalidation ladders',
    ],
  },
  {
    icon: Crosshair,
    accent: 'text-emerald-400',
    glow: 'rgba(16,185,129,0.45)',
    name: 'Pinpoint Gexbot',
    tier: 'TIER 3',
    tagline: 'Dealer gamma cartography',
    features: [
      'Per-strike GEX / DEX / VEX exposure map',
      'Call & put walls, gamma flip and magnets',
      'Live hedging-pressure pin detection',
    ],
  },
  {
    icon: Waves,
    accent: 'text-violet-400',
    glow: 'rgba(167,139,250,0.45)',
    name: 'Dealer Flow',
    tier: 'TIER 2',
    tagline: 'Institutional order-flow radar',
    features: [
      'Unusual sweep / block / unusual tape',
      'Dealer-flow pressure gauge & regime bias',
      'Charm-decay and delta-inventory tracking',
    ],
  },
  {
    icon: ShieldCheck,
    accent: 'text-amber-400',
    glow: 'rgba(251,191,36,0.45)',
    name: 'Quant Audit',
    tier: 'TIER 4',
    tagline: 'Trust & calibration engine',
    features: [
      'Full trade archive with outcome tracking',
      'Win-rate, profit factor & expectancy',
      'Probability calibration scoring',
    ],
  },
];

export function FeatureMatrix({ onEnterApp }: FeatureMatrixProps) {
  return (
    <motion.section
      id="feature-matrix"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
      className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-16 md:py-24"
    >
      <div className="text-center mb-12 md:mb-16">
        <span className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.35em] text-zinc-500">
          The Intelligence Stack
        </span>
        <h2 className="mt-3 text-3xl md:text-5xl font-black text-white tracking-tight">
          Four engines. One edge.
        </h2>
        <p className="mt-4 text-sm md:text-base text-[#A1A1AA] max-w-2xl mx-auto leading-relaxed">
          Every layer of the institutional options stack — dealer positioning, flow,
          structure and post-trade calibration — fused into a single high-performance
          cockpit.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        {ENGINES.map((engine, idx) => {
          const Icon = engine.icon;
          return (
            <motion.div
              key={engine.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.08 }}
              className="relative bg-[#0a0a0c]/90 border border-zinc-900 rounded-2xl p-5 overflow-hidden group hover:border-zinc-700 transition-colors duration-300"
            >
              <div
                className="absolute -top-10 -right-10 w-28 h-28 rounded-full blur-[40px] opacity-20 pointer-events-none group-hover:opacity-40 transition-opacity duration-500"
                style={{ background: engine.glow }}
              />
              <div className="flex items-center justify-between mb-4 relative z-10">
                <Icon className={`w-6 h-6 ${engine.accent}`} />
                <span className="text-[8.5px] font-black uppercase tracking-widest text-zinc-600 border border-zinc-800 rounded px-1.5 py-0.5">
                  {engine.tier}
                </span>
              </div>
              <h3 className="text-[15px] font-black text-white tracking-tight relative z-10">
                {engine.name}
              </h3>
              <p className="text-[9.5px] uppercase tracking-widest text-zinc-500 font-bold mt-1 mb-4 relative z-10">
                {engine.tagline}
              </p>
              <ul className="space-y-2 relative z-10">
                {engine.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-[11px] text-[#D4D4D8] leading-snug">
                    <Check className={`w-3 h-3 mt-0.5 shrink-0 ${engine.accent}`} />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          );
        })}
      </div>

      <div className="flex justify-center mt-12 md:mt-16">
        <button
          onClick={() => onEnterApp('skyvision')}
          className="group inline-flex items-center gap-2.5 bg-white text-black font-black text-xs md:text-sm uppercase tracking-widest px-7 py-3.5 rounded-full hover:bg-zinc-200 transition-colors duration-200 shadow-[0_0_30px_rgba(255,255,255,0.12)]"
        >
          Enter the Cockpit
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
        </button>
      </div>
    </motion.section>
  );
}

export default FeatureMatrix;
