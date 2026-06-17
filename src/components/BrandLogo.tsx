import React from 'react';

export function TerminalLogo() {
  return (
    <div className="flex items-center gap-1.5 font-mono select-none">
      <span className="text-[#6b7177] font-bold text-lg -translate-y-[2px]">&gt;</span>
      <span className="text-[#f4f5f6] font-extrabold text-2xl drop-shadow-[0_0_8px_rgba(244,245,246,0.18)]">S</span>
      <span className="w-1.5 h-6 bg-[#f4f5f6] shadow-[0_0_4px_rgba(244,245,246,0.5)] animate-pulse" />
    </div>
  );
}

export function WordmarkHorizontal() {
  return (
    <div className="flex items-center gap-3 text-[#f4f5f6] select-none uppercase">
      <span className="font-extrabold text-xl tracking-[0.03em] leading-none">SLAYER</span>
      <span className="w-[1.5px] h-[22px] bg-[#f4f5f6] opacity-50 block" />
      <span className="font-medium text-[10px] sm:text-xs tracking-[0.46em] text-[#9aa0a6] pl-[0.46em] leading-none">TERMINAL</span>
    </div>
  );
}

export function BrandHeader() {
  return (
    <div className="flex items-center gap-4 group cursor-pointer">
      <TerminalLogo />
      <WordmarkHorizontal />
    </div>
  );
}
