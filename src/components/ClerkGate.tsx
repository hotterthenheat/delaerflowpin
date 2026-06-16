import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Lock, Mail, User, Info, Check, X } from 'lucide-react';

interface ClerkGateProps {
  onSuccess: (userData: any) => void;
  referralCodeFromUrl?: string;
  onClose?: () => void;
}

export function ClerkGate({ onSuccess, referralCodeFromUrl, onClose }: ClerkGateProps) {
  const [activeMode, setActiveMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [referralCode, setReferralCode] = useState(referralCodeFromUrl || '');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showRefApplied, setShowRefApplied] = useState(!!referralCodeFromUrl);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const endpoint = activeMode === 'signup' ? '/api/auth/clerk-signup' : '/api/auth/clerk-login';
      const body = activeMode === 'signup' 
        ? { email, name, password, referralCode: referralCode.trim(), avatar: avatarUrl } 
        : { email, password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        const data = await res.json();
        // Trigger parent callback 
        onSuccess(data.user);
        window.location.reload(); // Reload immediately to secure signed httpOnly session cookies!
      } else {
        const errorData = await res.json();
        setErrorMessage(errorData.error || 'Authentication error. Please try again.');
      }
    } catch (err) {
      setErrorMessage('Network timeout. Slayer auth server is offline.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="clerk-authentication-gate" className="min-h-screen bg-[#050506] text-zinc-400 flex flex-col justify-center items-center font-mono selection:bg-emerald-500/20 selection:text-white p-4">
      
      {/* Visual background atmospheric elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] rounded-full bg-emerald-500/[0.02] blur-[150px] pointer-events-none" />
      <div className="absolute top-12 left-12 flex items-center gap-2 select-none">
        <div className="w-1.5 h-1.5 rounded-full bg-[#30d158] animate-pulse" />
        <span className="text-[10px] text-zinc-550 font-black tracking-widest uppercase">SLAYER TRADE SECURE ZONE</span>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md bg-[#0a0a0c] border border-zinc-900 shadow-[0_0_60px_rgba(0,0,0,0.8)] rounded-xl overflow-hidden p-8 space-y-6 relative"
      >
        {/* Holographic scanner accents */}
        <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-zinc-800 rounded-tl-xs" />
        <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-zinc-800 rounded-tr-xs" />
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-zinc-800 rounded-bl-xs" />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-zinc-800 rounded-br-xs" />

        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-all cursor-pointer font-black p-1.5 hover:scale-110 h-8 w-8 rounded-full border border-zinc-900/40 flex items-center justify-center bg-black/40 hover:bg-zinc-950 hover:border-zinc-805"
            title="Dismiss verification gate"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        <div className="text-center space-y-2">
          <div className="flex justify-center mb-1">
            <div className="p-3 bg-emerald-950/40 text-emerald-400 border border-emerald-500/10 rounded-full">
              <ShieldCheck className="w-7 h-7" />
            </div>
          </div>
          <h1 className="text-lg font-sans font-black tracking-tight text-white uppercase select-none">
            SLAYER TRADE GATEWAY
          </h1>
          <p className="text-[#a1a1aa] text-[10px] uppercase font-mono tracking-wide leading-relaxed">
            Secure enterprise sign-in managed via Clerk Auth API
          </p>
        </div>

        {/* Tab switcher */}
        <div className="grid grid-cols-2 bg-black rounded-lg p-1 border border-zinc-950 text-[10px] uppercase font-black">
          <button
            onClick={() => { setActiveMode('signin'); setErrorMessage(null); }}
            className={`py-2 rounded-md transition-all cursor-pointer ${activeMode === 'signin' ? 'bg-zinc-900 text-white' : 'text-zinc-550 hover:text-zinc-350'}`}
          >
            Sign In Account
          </button>
          <button
            onClick={() => { setActiveMode('signup'); setErrorMessage(null); }}
            className={`py-2 rounded-md transition-all cursor-pointer ${activeMode === 'signup' ? 'bg-zinc-900 text-white' : 'text-zinc-550 hover:text-zinc-350'}`}
          >
            Register Station
          </button>
        </div>

        {errorMessage && (
          <div className="p-3.5 bg-rose-950/20 border border-rose-900/30 rounded-lg text-[10px] text-rose-400 leading-relaxed font-mono uppercase">
            <span className="font-black">Error:</span> {errorMessage}
          </div>
        )}

        {referralCode && activeMode === 'signup' && (
          <div className="p-3 bg-emerald-950/25 border border-emerald-900/30 rounded-lg text-[9.5px] text-emerald-400 leading-tight font-mono uppercase flex items-center gap-2">
            <Check className="w-3.5 h-3.5 shrink-0" />
            <span>Referral code active! 5% discount applied automatically on subscription clearance.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          {activeMode === 'signup' && (
            <div>
              <label className="text-[8.5px] text-zinc-500 uppercase tracking-widest font-extrabold block mb-1">
                Your Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Zak Ali"
                  className="w-full bg-black/60 border border-zinc-900 focus:border-zinc-700 text-white font-mono rounded-lg p-3 pl-10 text-xs focus:outline-none transition-colors"
                />
                <User className="w-3.5 h-3.5 text-zinc-650 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          )}

          {activeMode === 'signup' && (
            <div>
              <label className="text-[8.5px] text-zinc-500 uppercase tracking-widest font-extrabold block mb-1">
                Profile Photo URL (Optional)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://example.com/avatar.png"
                  className="w-full bg-black/60 border border-zinc-900 focus:border-zinc-700 text-white font-mono rounded-lg p-3 pl-10 text-xs focus:outline-none transition-colors"
                />
                <User className="w-3.5 h-3.5 text-zinc-650 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          )}

          <div>
            <label className="text-[8.5px] text-zinc-500 uppercase tracking-widest font-extrabold block mb-1">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="slayer@trade.com"
                className="w-full bg-black/60 border border-zinc-900 focus:border-zinc-700 text-white font-mono rounded-lg p-3 pl-10 text-xs focus:outline-none transition-colors"
              />
              <Mail className="w-3.5 h-3.5 text-zinc-650 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="text-[8.5px] text-zinc-500 uppercase tracking-widest font-extrabold block mb-1">
              Security Key Password
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-black/60 border border-zinc-900 focus:border-zinc-700 text-white font-mono rounded-lg p-3 pl-10 text-xs focus:outline-none transition-colors"
              />
              <Lock className="w-3.5 h-3.5 text-zinc-650 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {activeMode === 'signup' && (
            <div>
              <label className="text-[8.5px] text-zinc-500 uppercase tracking-widest font-extrabold block mb-1">
                Referral Code (Optional)
              </label>
              <input
                type="text"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value)}
                placeholder="SLAYERY123"
                className="w-full bg-black/60 border border-zinc-900 focus:border-zinc-700 text-white font-mono rounded-lg p-3 text-xs focus:outline-none transition-colors uppercase"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 mt-2 bg-emerald-400 hover:bg-emerald-300 text-neutral-950 font-black text-[10px] uppercase tracking-widest rounded-lg shadow-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer hover:scale-[1.01]"
          >
            {isLoading ? (
              <>
                <div className="w-3.5 h-3.5 rounded-full border-t border-r border-[#000] animate-spin" />
                <span>SECURE AUTHORIZATION PENDING...</span>
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5" />
                <span>{activeMode === 'signin' ? 'Verify Credentials & Load Terminal' : 'Issue Workstation Authorization Code'}</span>
              </>
            )}
          </button>
        </form>

        <div className="border-t border-[#121217] pt-4 text-center">
          <p className="text-[8px] text-zinc-650 leading-relaxed uppercase">
            UNAUTHORIZED DISCOVERY PROBES ARE PERMANENTLY RETRACTED AND REPORTED TO SYSTEM CONTROL SHELL.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
