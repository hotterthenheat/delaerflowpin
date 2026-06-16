import React, { useState, useEffect, memo, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useContractStore } from './lib/store';
import { applyAllPreferences } from './lib/displayPrefs';
import { withCacheBust } from './lib/format';
import { ASSET_LIST } from './data';
import { AssetInfo } from './types';

// Import Workspace Modular Views
import { SkyVisionView } from './components/SkyVisionView';
import { PinpointAIView } from './components/PinpointAIView';
import { QuantAuditView } from './components/QuantAuditView';
import { DiscoveryView } from './components/DiscoveryView';
import { DealerFlowView } from './components/DealerFlowView';
import SlayerIntro from './components/SlayerIntro';
import { SkyseyeAlertHub } from './components/SkyseyeAlertHub';
import ArborCapital from './components/ArborCapital';
import TierGuard from './components/TierGuard';
import { ClerkGate } from './components/ClerkGate';
import { SettingsPanel } from './components/SettingsPanel';
import { SubscriptionPricing } from './components/SubscriptionPricing';
import { CelebrationOverlay } from './components/CelebrationOverlay';
import { AdminOverseerPanel } from './components/AdminOverseerPanel';
import { WorkspaceView } from './components/WorkspaceView';

import {
  Sparkles,
  Database,
  Compass,
  Dna,
  Lock,
  LayoutGrid,
  LogOut,
  Waves,
  ShieldCheck,
  Sun,
  Moon,
  Activity,
  Bell,
  Smartphone,
  FileText,
  SlidersHorizontal,
  GraduationCap,
  Search,
  ChevronRight,
  Calculator
} from 'lucide-react';

const TickerTape = memo(() => {
  const staticTickers = [
    { ticker: 'SPX', name: 'S&P 500 Index', price: 7623.00, change: '+0.88%', isUp: true, vol: '14.2%' },
    { ticker: 'NDX', name: 'NASDAQ 100 Index', price: 18250.00, change: '+1.42%', isUp: true, vol: '21.0%' },
    { ticker: 'QQQ', name: 'NASDAQ ETF', price: 445.50, change: '+1.24%', isUp: true, vol: '18.5%' },
    { ticker: 'SPY', name: 'S&P 505 ETF', price: 512.30, change: '+0.65%', isUp: true, vol: '12.8%' },
    { ticker: 'RUT', name: 'Russell 2000 Index', price: 2025.00, change: '+0.92%', isUp: true, vol: '16.4%' },
    { ticker: 'SPX', name: 'S&P 500 Index', price: 7623.00, change: '+0.88%', isUp: true, vol: '14.2%' },
    { ticker: 'NDX', name: 'NASDAQ 100 Index', price: 18250.00, change: '+1.42%', isUp: true, vol: '21.0%' },
    { ticker: 'QQQ', name: 'NASDAQ ETF', price: 445.50, change: '+1.24%', isUp: true, vol: '18.5%' },
    { ticker: 'SPY', name: 'S&P 505 ETF', price: 512.30, change: '+0.65%', isUp: true, vol: '12.8%' },
    { ticker: 'RUT', name: 'Russell 2000 Index', price: 2025.00, change: '+0.92%', isUp: true, vol: '16.4%' },
    { ticker: 'SPX', name: 'S&P 500 Index', price: 7623.00, change: '+0.88%', isUp: true, vol: '14.2%' },
    { ticker: 'NDX', name: 'NASDAQ 100 Index', price: 18250.00, change: '+1.42%', isUp: true, vol: '21.0%' },
    { ticker: 'QQQ', name: 'NASDAQ ETF', price: 445.50, change: '+1.24%', isUp: true, vol: '18.5%' },
    { ticker: 'SPY', name: 'S&P 505 ETF', price: 512.30, change: '+0.65%', isUp: true, vol: '12.8%' },
    { ticker: 'RUT', name: 'Russell 2000 Index', price: 2025.00, change: '+0.92%', isUp: true, vol: '16.4%' }
  ];

  return (
    <div className="w-full bg-[#050506]/75 border-b border-zinc-900/50 backdrop-blur-xl overflow-hidden py-1.5 relative z-40 select-none">
      <div className="animate-ticker-marquee flex whitespace-nowrap">
        {[...Array(2)].map((_, loopIdx) => (
          <div key={loopIdx} className="flex gap-14 items-center pr-14 animate-none">
            {staticTickers.map((t, idx) => (
              <div 
                key={`${loopIdx}-${idx}`} 
                className="flex items-center gap-2.5 font-mono text-[9.5px] px-2 py-1 rounded transition-all"
              >
                <span className="font-black text-white tracking-widest">{t.ticker}</span>
                <span className="text-zinc-500 text-[8.5px] uppercase">{t.name}</span>
                <span className="font-extrabold text-[#f4f4f5]">${t.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                <span className={`font-bold flex items-center gap-0.5 ${t.isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {t.isUp ? '▲' : '▼'}{t.change}
                </span>
                <span className="text-zinc-650 text-[8px] font-black border border-zinc-950/20 bg-zinc-950/60 px-1 rounded-xs uppercase">
                  VOL: {t.vol}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
});

export default function App() {
  // Navigation & configuration subscribing to global useContractStore Zustand store
  const activeTab = useContractStore(s => s.activeTab);
  const setActiveTab = useContractStore(s => s.setActiveTab);

  const handleSelectTab = (tab: any) => {
    setActiveTab(tab);
  };

  const selectedAsset = useContractStore(s => s.selectedAsset);
  const setSelectedAsset = useContractStore(s => s.setSelectedAsset);
  const selectedTimeframe = useContractStore(s => s.selectedTimeframe);
  const setSelectedTimeframe = useContractStore(s => s.setSelectedTimeframe);
  const selectedOptionType = useContractStore(s => s.selectedOptionType);
  const setSelectedOptionType = useContractStore(s => s.setSelectedOptionType);
  const selectedStrike = useContractStore(s => s.selectedStrike);
  const setCustomStrike = useContractStore(s => s.setSelectedStrike);
  const isPositionOpen = useContractStore(s => s.isPositionOpen);
  const setIsPositionOpen = useContractStore(s => s.setIsPositionOpen);

  const serverState = useContractStore(s => s.serverState);
  const updateFromSSE = useContractStore(s => s.updateFromSSE);
  const tickMarketState = useContractStore(s => s.tickMarketState);
  const isContractLocked = useContractStore(s => s.isContractLocked);
  const purchasedTier = useContractStore(s => s.purchasedTier);

  const themeMode = useContractStore(s => s.themeMode);
  const toggleThemeMode = useContractStore(s => s.toggleThemeMode);
  const isLight = themeMode === 'light';

  const smoothScroll = useContractStore(s => s.smoothScroll);
  const toggleSmoothScroll = useContractStore(s => s.toggleSmoothScroll);
  const keybinds = useContractStore(s => s.keybinds);

  useEffect(() => {
    if (isLight) {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
  }, [isLight]);

  useEffect(() => {
    if (smoothScroll) {
      document.documentElement.classList.add('scroll-smooth');
      document.body.classList.add('scroll-smooth');
    } else {
      document.documentElement.classList.remove('scroll-smooth');
      document.body.classList.remove('scroll-smooth');
    }
  }, [smoothScroll]);

  // User session state (Bug #9 HttpOnly cookie verification and storage)
  const [session, setSession] = useState<{ 
    authenticated: boolean; 
    name?: string; 
    provider?: string; 
    avatar?: string;
    access_tier?: 'guest' | 'discord' | 'intraday' | 'quant' | 'enterprise' | 'lifetime';
    is_super_admin?: boolean;
    referral_tokens_pool?: number;
    custom_referral_code?: string;
    selected_font_scale?: 'STANDARD' | 'ENHANCED';
    compact_view_enabled?: boolean;
    selected_theme?: 'SLAYER PURE DARK' | 'DEALER FLOW SLATE' | 'VOLATILITY RADAR' | 'CARBON MONITOR MATTE' | 'FOREST ALGORITHM' | 'CRIMSON TAPE' | 'MIDNIGHT OCEAN' | string;
    no_refund_policy_logged?: boolean;
  } | null>(null);

  const [sessionBlockedMessage, setSessionBlockedMessage] = useState<string | null>(null);
  const [showWelcomeCelebration, setShowWelcomeCelebration] = useState(false);
  const [welcomeCelebrationTier, setWelcomeCelebrationTier] = useState(1);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // INJECT: VIEWPORT SIMULATION STATE
  const [originalAdminSession, setOriginalAdminSession] = useState<any | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const handleSimulateTier = (targetTier: string, targetTierNum: number) => {
    // Save the real admin session in the background before overriding
    if (!isSimulating) setOriginalAdminSession(session);
    
    setIsSimulating(true);
    
    // Spoof the session object to downgrade clearance
    setSession((prev: any) => ({ 
      ...prev, 
      access_tier: targetTier, 
      is_super_admin: false 
    })); 
    
    // Override the global Zustand store to trigger the UI changes
    useContractStore.getState().setPurchasedTier(targetTierNum);
    
    // Route to home so the admin can test the routing locks natively
    setActiveTab('home');
  };

  const handleExitSimulation = () => {
    // Instantly restore God-Mode clearance
    setSession(originalAdminSession);
    setIsSimulating(false);
    useContractStore.getState().setPurchasedTier(5); // Restores Lifetime/Admin tier visually
    setOriginalAdminSession(null);
  };

  // Apply Text Size Scaling and Compact View to DOM
  useEffect(() => {
    if (!session) return;
    
    // Font Scaling
    const html = document.documentElement;
    if ((session.selected_font_scale as any) === 'ENHANCED') {
      html.style.fontSize = '18px';
    } else if ((session.selected_font_scale as any) === 'ENHANCED_XL') {
      html.style.fontSize = '20px';
    } else {
      html.style.fontSize = '16px';
    }

    // Compact View Mode
    if (session.compact_view_enabled) {
      html.style.setProperty('--grid-gap', '0.25rem');
      html.style.setProperty('--card-padding', '0.5rem');
      html.classList.add('compact-mode');
    } else {
      html.style.setProperty('--grid-gap', '1rem');
      html.style.setProperty('--card-padding', '1.5rem');
      html.classList.remove('compact-mode');
    }
  }, [session?.selected_font_scale, session?.compact_view_enabled]);

  // Prevent background scrolling when auth modal is active
  useEffect(() => {
    if (showAuthModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  }, [showAuthModal]);

  // Subscription tier calculations and click-to-upgrade behavior
  const tierInfo = useMemo(() => {
    switch (purchasedTier) {
      case 1:
        return {
          label: "TIER 1 // DISCORD ALERTS",
          desc: "LIVE TRADING FEED ACTIVE",
          style: "bg-indigo-500/10 border-indigo-500/25 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.05)]",
          dotColor: "bg-indigo-500",
          iconColor: "text-indigo-400"
        };
      case 2:
        return {
          label: "TIER 2 // SKYVISION COCKPIT",
          desc: "DECISION ARMORY UNLOCKED",
          style: "bg-sky-500/10 border-sky-500/25 text-sky-400 shadow-[0_0_15px_rgba(14,165,233,0.05)]",
          dotColor: "bg-sky-450",
          iconColor: "text-sky-400"
        };
      case 3:
        return {
          label: "TIER 3 // PINPOINT GEXBOT",
          desc: "REAL-TIME GAMMA DEALER FLOW",
          style: "bg-emerald-500/10 border-emerald-500/25 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.05)] border-2 border-emerald-500/30",
          dotColor: "bg-emerald-450",
          iconColor: "text-emerald-400 animate-pulse"
        };
      case 4:
        return {
          label: "TIER 4 // QUANT ARMORY",
          desc: "INSTITUTIONAL QUANT SUITE",
          style: "bg-amber-500/10 border-amber-500/25 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.05)]",
          dotColor: "bg-amber-400",
          iconColor: "text-amber-400"
        };
      case 5:
      default:
        return {
          label: "TIER 5 // LIFETIME UNLIMITED",
          desc: "WORKSPACE CLEARANCE GRANTED",
          style: "bg-gradient-to-r from-red-500/5 via-amber-500/5 to-indigo-500/5 border-amber-500/40 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.12)]",
          dotColor: "bg-gradient-to-r from-red-400 via-amber-400 to-indigo-400",
          iconColor: "text-amber-300 animate-pulse"
        };
    }
  }, [purchasedTier]);

  const handleUpgradeClick = () => {
    if (activeTab !== 'home') {
      setActiveTab('home');
      setTimeout(() => {
        const element = document.getElementById('pricing-matrices');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 150);
    } else {
      const element = document.getElementById('pricing-matrices');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  // Global Command Palette states (Prism Menu) backed by our Zustand store
  const isGlobalSearchOpen = useContractStore(s => s.isGlobalSearchOpen);
  const setIsGlobalSearchOpen = useContractStore(s => s.setIsGlobalSearchOpen);
  const trades = useContractStore(s => s.trades);

  const [globalSearchInput, setGlobalSearchInput] = useState('');
  const [globalSearchIndex, setGlobalSearchIndex] = useState(0);
  // Cache-bust the avatar only when it actually changes (avoids re-fetch churn).
  const avatarCacheBust = useMemo(() => Date.now(), [session?.avatar]);
  const prismFilter = useContractStore(s => s.prismFilter);
  const setPrismFilter = useContractStore(s => s.setPrismFilter);
  const globalSearchInputRef = useRef<HTMLInputElement>(null);

  const filterTickersList = useMemo(() => {
    const query = globalSearchInput.trim().toLowerCase();

    // Contextual static items
    const staticContracts = [
      { ticker: 'SPX', name: 'SPX 7650C Call Winning Transaction', contract: 'SPX 7650C', pnl: '+$4.20B', status: 'Success Target 3', id: 'stat-1', isContract: true },
      { ticker: 'NDX', name: 'NDX 18200C Call Early Closed Transaction', contract: 'NDX 18200C', pnl: '+$2.50B', status: 'Success Target 2', id: 'stat-2', isContract: true },
      { ticker: 'NDX', name: 'NDX 18200P Put Swing Trade', contract: 'NDX 18200P', pnl: '+$1.80B', status: 'Success Target 2', id: 'stat-sp1', isContract: true },
      { ticker: 'SPY', name: 'SPY 448P Put Imbalance Washout', contract: 'SPY 448P', pnl: '+$240M', status: 'Success Target 3', id: 'stat-sp2', isContract: true },
      { ticker: 'QQQ', name: 'QQQ 492P Volatility Expansion Swing', contract: 'QQQ 492P', pnl: '-$45M', status: 'Stop Loss Hit', id: 'stat-sp3', isContract: true },
      { ticker: 'SPY', name: 'SPY 445P Put Short Cover Raid', contract: 'SPY 445P', pnl: '+$310M', status: 'Success Target 3', id: 'stat-sp4', isContract: true },
    ];

    const convertedLive = trades.map(t => ({
      ticker: t.underlying,
      name: `${t.underlying} ${t.contract} ${t.direction === 'BULLISH' ? 'CALL' : 'PUT'} Execution`,
      contract: t.contract,
      pnl: t.maxGain > 0 ? `+${t.maxGain.toFixed(1)}%` : 'Active Tracker',
      status: t.target3Hit ? 'Target 3 Clipped' : t.target2Hit ? 'Target 2 Clipped' : 'Staged/Live',
      id: t.id,
      isContract: true
    }));

    const mergedContracts = [...convertedLive, ...staticContracts];

    const toolsItems = [
      { ticker: 'SVI', name: 'SVI Volatility Solver', pnl: 'Physics Module', id: 'svi-solver', isTool: true },
      { ticker: 'G3D', name: '3D Gamma Topography', pnl: 'Visualizer', id: 'gamma-surface', isTool: true },
      { ticker: 'VPIN', name: 'Order Flow Toxicity', pnl: 'Microstructure', id: 'vpin-tracker', isTool: true }
    ];

    const navItems = [
      { id: 'nav-home', name: 'Home Workspace', ticker: 'HOME', pnl: 'Workspace', isNav: true, targetTab: 'home' },
      { id: 'nav-skyvision', name: 'SkyVision Cockpit', ticker: 'SKYV', pnl: 'Workspace', isNav: true, targetTab: 'skyvision' },
      { id: 'nav-pinpoint', name: 'Pinpoint AI', ticker: 'PINP', pnl: 'Workspace', isNav: true, targetTab: 'pinpoint' },
      { id: 'nav-auditor', name: 'Trust Archive & Registry', ticker: 'AUDIT', pnl: 'Workspace', isNav: true, targetTab: 'auditor' },
      { id: 'nav-dealerflow', name: 'Dealer Flow', ticker: 'FLOW', pnl: 'Workspace', isNav: true, targetTab: 'dealerflow' },
      { id: 'nav-arbor', name: 'Research & Community', ticker: 'ARBOR', pnl: 'Workspace', isNav: true, targetTab: 'arbor' },
      { id: 'nav-settings', name: 'Settings & Preferences', ticker: 'SETT', pnl: 'System', isNav: true, targetTab: 'settings' }
    ];

    const defaultTickers = [
      { ticker: 'SPX', name: 'S&P 500 Index', price: 7623.00, change: '+0.88%', isUp: true, isContract: false },
      { ticker: 'NDX', name: 'Nasdaq 100 Index', price: 18250.00, change: '+1.42%', isUp: true, isContract: false },
      { ticker: 'QQQ', name: 'Invesco QQQ Trust', price: 445.50, change: '+1.24%', isUp: true, isContract: false },
      { ticker: 'SPY', name: 'SPDR S&P 500 ETF', price: 512.30, change: '+0.65%', isUp: true, isContract: false },
      { ticker: 'RUT', name: 'Russell 2000 Index', price: 2025.00, change: '+0.92%', isUp: true, isContract: false },
    ];

    let combinedSet = [];
    if (prismFilter === 'All') {
      combinedSet = [
        ...defaultTickers,
        ...toolsItems,
        ...navItems,
        ...(activeTab === 'auditor' ? mergedContracts : [])
      ];
    } else if (prismFilter === 'Assets') {
      combinedSet = defaultTickers;
    } else if (prismFilter === 'Tools') {
      combinedSet = toolsItems;
    } else if (prismFilter === 'Navigation') {
      combinedSet = navItems;
    }

    if (!query) return combinedSet;

    return combinedSet.filter(item => {
      const pnlSearch = (item.pnl || '').toString().toLowerCase();
      const statusSearch = (item.status || '').toString().toLowerCase();
      const contractSearch = (item.contract || '').toString().toLowerCase();

      return item.ticker.toLowerCase().includes(query) || 
             item.name.toLowerCase().includes(query) ||
             pnlSearch.includes(query) ||
             statusSearch.includes(query) ||
             contractSearch.includes(query);
    });
  }, [globalSearchInput, prismFilter, activeTab, trades]);

  useEffect(() => {
    if (isGlobalSearchOpen) {
      setGlobalSearchInput('');
      setGlobalSearchIndex(0);
      document.body.classList.add('prism-locked'); // Lock background scrolling
      const timer = setTimeout(() => {
        globalSearchInputRef.current?.focus();
      }, 80);
      return () => {
        clearTimeout(timer);
        document.body.classList.remove('prism-locked'); // Unlock scrolling
      };
    } else {
      document.body.classList.remove('prism-locked');
    }
  }, [isGlobalSearchOpen]);

  // Global Keybind Event Listener
  useEffect(() => {
    const handleGlobalSearchKeys = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        if (e.key === 'Escape') {
          useContractStore.getState().setIsGlobalSearchOpen(false);
        }
        return;
      }
      
      const parts = [];
      if (e.metaKey || e.ctrlKey) parts.push('cmd');
      if (e.shiftKey) parts.push('shift');
      if (e.altKey) parts.push('alt');
      parts.push(e.key.toLowerCase());
      const pressedCombo = parts.join('+');

      const state = useContractStore.getState();
      const binds = state.keybinds;
      const disabled = state.disabledKeybinds || {};
      const globalEnabled = state.globalKeybindsEnabled;

      // Handle escape independently of the configurable keybinds
      if (e.key === 'Escape') {
        useContractStore.getState().setIsGlobalSearchOpen(false);
        return;
      }

      if (!globalEnabled) return;

      if (pressedCombo === binds.prismMenu && !disabled.prismMenu) {
        e.preventDefault();
        const currentOpen = useContractStore.getState().isGlobalSearchOpen;
        useContractStore.getState().setIsGlobalSearchOpen(!currentOpen);
      } else if (pressedCombo === binds.home && !disabled.home) {
        e.preventDefault();
        useContractStore.getState().setActiveTab('home');
        useContractStore.getState().setIsGlobalSearchOpen(false);
      } else if (pressedCombo === binds.skyvision && !disabled.skyvision) {
        e.preventDefault();
        useContractStore.getState().setActiveTab('skyvision');
        useContractStore.getState().setIsGlobalSearchOpen(false);
      } else if (pressedCombo === binds.pinpoint && !disabled.pinpoint) {
        e.preventDefault();
        useContractStore.getState().setActiveTab('pinpoint');
        useContractStore.getState().setIsGlobalSearchOpen(false);
      } else if (pressedCombo === binds.auditor && !disabled.auditor) {
        e.preventDefault();
        useContractStore.getState().setActiveTab('auditor');
        useContractStore.getState().setIsGlobalSearchOpen(false);
      } else if (pressedCombo === binds.dealerflow && !disabled.dealerflow) {
        e.preventDefault();
        useContractStore.getState().setActiveTab('dealerflow');
        useContractStore.getState().setIsGlobalSearchOpen(false);
      } else if (pressedCombo === binds.arbor && !disabled.arbor) {
        e.preventDefault();
        useContractStore.getState().setActiveTab('arbor');
        useContractStore.getState().setIsGlobalSearchOpen(false);
      } else if (pressedCombo === binds.settings && !disabled.settings) {
        e.preventDefault();
        useContractStore.getState().setActiveTab('settings');
        useContractStore.getState().setIsGlobalSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleGlobalSearchKeys);
    return () => window.removeEventListener('keydown', handleGlobalSearchKeys);
  }, []);

  const handleGlobalSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setGlobalSearchIndex(prev => (prev + 1) % filterTickersList.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setGlobalSearchIndex(prev => (prev - 1 + filterTickersList.length) % filterTickersList.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filterTickersList[globalSearchIndex]) {
        const item = filterTickersList[globalSearchIndex] as any;
        if (item.isContract) {
          useContractStore.setState({
            activeTab: 'auditor',
            auditSearchQuery: item.contract,
            expandedAuditId: item.id
          });

        } else if (item.isNav) {
          useContractStore.setState({
            activeTab: item.targetTab,
            auditSearchQuery: '',
            expandedAuditId: null
          });
        } else if (item.isTool) {
          if (item.id === 'svi-solver') {
            useContractStore.setState({
              activeTab: 'pinpoint',
              auditSearchQuery: '',
              expandedAuditId: null
            });
          } else if (item.id === 'gamma-surface') {
            useContractStore.setState({
              activeTab: 'skyvision',
              auditSearchQuery: '',
              expandedAuditId: null
            });
          } else if (item.id === 'vpin-tracker') {
            useContractStore.setState({
              activeTab: 'dealerflow',
              auditSearchQuery: '',
              expandedAuditId: null
            });
          }
        } else {
          const targetAsset = ASSET_LIST.find(a => a.ticker === item.ticker);
          if (targetAsset) {
            setSelectedAsset(targetAsset);
            useContractStore.setState({
              auditSearchQuery: '',
              expandedAuditId: null
            });
          }
        }
        setIsGlobalSearchOpen(false);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsGlobalSearchOpen(false);
    }
  };

  // Fetch session on load
  const fetchSession = async () => {
    try {
      const res = await fetch('/api/auth/session');
      if (res.ok) {
        const data = await res.json();
        
        // Restore avatar from local storage if server memory wiped it
        if (data.authenticated) {
          const localAvatar = localStorage.getItem('slayer_avatar');
          if (localAvatar) {
            data.avatar = localAvatar;
          }
          applyAllPreferences({
            selected_theme: data.selected_theme,
            selected_font_scale: data.selected_font_scale,
            compact_view_enabled: data.compact_view_enabled,
            ultrawide_enabled: data.ultrawide_enabled,
          });
        }
        
        setSession(data);
        
        // Sync the Zustand store tier from session tier
        if (data.authenticated && data.access_tier) {
          useContractStore.getState().setIsAuthenticated(true);
          const tierNum = data.access_tier === 'discord' ? 1
            : (data.access_tier === 'skyvision' || data.access_tier === 'intraday') ? 2
            : (data.access_tier === 'pinpoint' || data.access_tier === 'quant') ? 3
            : (data.access_tier === 'enterprise') ? 4
            : data.access_tier === 'lifetime' ? 5
            : 0;
          useContractStore.getState().setPurchasedTier(tierNum);
        }
      }
    } catch (e) {
      console.error('Failed to load session details', e);
    }
  };

  useEffect(() => {
    fetchSession();
    (window as any).refreshSlayerSession = fetchSession;
    
    // Check for referral link
    if (window.location.pathname.startsWith('/join/')) {
      // Just take them to the subscription page directly as requested
      const timer = setTimeout(() => {
        setActiveTab('subscription');
      }, 100);
      return () => clearTimeout(timer);
    }
    
    return () => {
      delete (window as any).refreshSlayerSession;
    };
  }, []);

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        setSession({ authenticated: false });
        // Redirect to homepage
        window.location.reload();
      }
    } catch (err) {
      console.error('Logout error', err);
    }
  };

  // Keep NY hours tick alive globally every second
  useEffect(() => {
    const interval = setInterval(tickMarketState, 1000);
    return () => clearInterval(interval);
  }, [tickMarketState]);

  // Establish live SSE stream directly mapping payload updates into the Zustand cache (Bug #1, Bug #2)
  useEffect(() => {
    if (!session) return;
    const assetParam = selectedAsset.ticker;
    const tfParam = selectedTimeframe;
    const isCall = selectedOptionType === 'C';
    const strikeParam = selectedStrike !== null ? `&strike=${selectedStrike}` : '';
    const posParam = `&positionOpen=${isPositionOpen}`;

    const url = `/api/stream?asset=${assetParam}&timeframe=${tfParam}&isCall=${isCall}${strikeParam}${posParam}`;
    
    const eventSource = new EventSource(url);
    let latestPayload: any = null;
    let flushInterval: any = null;

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'TERMINATE') {
          setSessionBlockedMessage(data.reason || 'CONCURRENT_SESSION_IP_MISMATCH');
          eventSource.close();
          return;
        }
        latestPayload = data;
      } catch (err) {
        console.error('[SkyVision Client] Parsing SSE Data Stream', err);
      }
    };

    flushInterval = setInterval(() => {
      if (latestPayload) {
        updateFromSSE(latestPayload);
        latestPayload = null;
      }
    }, 100);

    eventSource.onerror = (err) => {
      console.error('[SkyVision Client] Stream Connection Error', err);
    };

    return () => {
      eventSource.close();
      if (flushInterval) clearInterval(flushInterval);
    };
  }, [selectedAsset, selectedTimeframe, selectedOptionType, selectedStrike, isPositionOpen, updateFromSSE, session]);

  // Option Action handlers connecting to backend storage
  const handleAddNewPerformanceLog = async (
    direction: 'BULLISH' | 'BEARISH',
    entry: number,
    target: number,
    stop: number
  ) => {
    if (!serverState) return;

    const body = {
      underlying: selectedAsset.ticker,
      contract: serverState.contract,
      direction: direction,
      entryPrice: entry,
      underlyingPrice: serverState.pinpoint_map.spot_price,
      iv: serverState.expected_move.ivPercentile,
      target1: serverState.targets[0]?.optionValue || (entry * 1.3),
      target2: serverState.targets[1]?.optionValue || (entry * 1.7),
      target3: serverState.targets[2]?.optionValue || (entry * 2.2),
      stretchTarget: serverState.targets[3]?.optionValue || (entry * 3.0),
      stopLoss: stop
    };

    try {
      const res = await fetch('/api/trades/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        setIsPositionOpen(true);
      }
    } catch (e) {
      console.error('[SkyVision Client] POST trade action failure', e);
    }
  };

  const clearV8Trades = async () => {
    try {
      const res = await fetch('/api/trades/clear', { method: 'POST' });
      if (res.ok) {
        setIsPositionOpen(false);
      }
    } catch (e) {
      console.error('[SkyVision Client] POST clear state failure', e);
    }
  };

  const handleSelectOpportunity = (asset: AssetInfo, type: 'C' | 'P', strike?: number) => {
    const step = asset.defaultPrice > 1000 ? 100 : asset.defaultPrice > 150 ? 5 : 1;
    const targetStrike = strike || Math.round(asset.defaultPrice / step) * step;
    
    useContractStore.getState().selectContractAtomically(asset, targetStrike, type === 'C');
    setActiveTab('skyvision', true);
  };

  if (sessionBlockedMessage) {
    return (
      <div className="min-h-screen bg-[#110203] text-red-500 flex flex-col justify-center items-center font-mono p-6 text-center select-none antialiased">
        <div className="w-16 h-16 border-2 border-red-500 rounded-full flex items-center justify-center mb-6 animate-pulse">
          <span className="text-3xl font-black">!</span>
        </div>
        <h1 className="text-xl font-black tracking-widest text-white uppercase mb-2">SLAYER TRADE SECURITY KICKOUT</h1>
        <p className="text-xs text-red-500 max-w-md uppercase tracking-wider leading-relaxed mb-4">
          CONCURRENT ACCESS PROTECTOR DISPATCHED: Connection established from a different IP address of this verified user credential. Active real-time workstation constraints limited to 1 concurrent IP.
        </p>
        <div className="text-[10px] text-zinc-500 uppercase">
          If this was you, please wait 30 seconds and refresh to initiate a new primary handshake.
        </div>
        <button
          onClick={() => {
            window.location.reload();
          }}
          className="mt-6 px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-widest rounded transition-colors cursor-pointer"
        >
          Re-establish Session Hook
        </button>
      </div>
    );
  }

  if (session === null) {
    return (
      <div className="min-h-screen bg-black text-zinc-400 flex flex-col justify-center items-center font-mono select-none antialiased">
        <div className="w-8 h-8 border-t-2 border-white rounded-full animate-spin mb-4"></div>
        <div className="tracking-widest uppercase text-xs text-white">SECURE WORKSTATION COCKPIT CONNECTING...</div>
        <div className="text-[10px] text-zinc-650 mt-2 uppercase font-mono font-bold animate-pulse">Verifying verified Clerk credentials and security cookies</div>
      </div>
    );
  }

  // Gating check has been deferred so that unauthenticated users can view the full homepage landing workspace.
  // Clicking secondary workspace pages, settings, or purchase channels triggers authorization inline.

  // Safe fallback loading state and skeletal setup
  if (!serverState) {
    return (
      <div className="min-h-screen bg-black text-zinc-400 flex flex-col justify-center items-center font-mono select-none antialiased">
        <div className="w-8 h-8 border-t-2 border-white rounded-full animate-spin mb-4"></div>
        <div className="tracking-widest uppercase text-xs text-white">SLAYER CLIENT HYDRATION ENGINE ONLINE...</div>
        <div className="text-[10px] text-zinc-650 mt-2 uppercase font-mono">Resolving dynamic system variables</div>
      </div>
    );
  }

  // Pre-calculated components mappings with zero client math
  const topMispriced = serverState?.discovery?.mispricedCalls?.[0];
  const bestOpportunity = {
    asset: topMispriced?.asset || ASSET_LIST[0],
    ticker: `${topMispriced?.asset?.ticker || 'SPX'} ${topMispriced?.strike || 7640}C`,
    confidence: topMispriced?.health || 91,
    isCall: true,
    currentPrice: `$${(topMispriced?.marketPrice || 4.2).toFixed(2)}`,
    fairValue: `$${(topMispriced?.modelValue || 6.8).toFixed(2)}`,
    entryZone: `$${((topMispriced?.marketPrice || 4.2) * 0.92).toFixed(2)} - $${((topMispriced?.marketPrice || 4.2) * 0.98).toFixed(2)}`
  };

  const topSub10Calls = (serverState?.discovery?.mispricedCalls || []).map((c: any) => ({
    asset: c.asset,
    ticker: `${c.asset.ticker} ${c.strike}C`,
    confidence: c.health
  }));

  const topSub10Puts = (serverState?.discovery?.mispricedPuts || []).map((p: any) => ({
    asset: p.asset,
    ticker: `${p.asset.ticker} ${p.strike}P`,
    confidence: p.health
  }));

  const isCall = selectedOptionType === 'C';
  const showColoredBg = isContractLocked && (activeTab === 'skyvision' || activeTab === 'auditor');

  let bgClass = "min-h-screen text-[#f4f4f5] flex flex-col font-mono select-none overflow-x-hidden antialiased relative transition-all duration-700 ease-in-out";
  const activeSlayerTheme = session?.selected_theme || 'SLAYER PURE DARK';

  if (activeSlayerTheme === 'CARBON MONITOR MATTE') {
    bgClass += " bg-[#121212] text-zinc-100";
  } else if (activeSlayerTheme === 'VOLATILITY RADAR') {
    bgClass += " bg-[#0b0416] text-purple-100";
  } else if (activeSlayerTheme === 'DEALER FLOW SLATE') {
    bgClass += " bg-[#0b0f19] text-blue-50";
  } else if (activeSlayerTheme === 'FOREST ALGORITHM') {
    bgClass += " bg-[#021008] text-emerald-50";
  } else if (activeSlayerTheme === 'CRIMSON TAPE') {
    bgClass += " bg-[#120303] text-rose-50";
  } else if (activeSlayerTheme === 'MIDNIGHT OCEAN') {
    bgClass += " bg-[#000a12] text-teal-50";
  } else {
    bgClass += " bg-[#050506] text-[#f4f4f5]";
  }

  if (showColoredBg) {
    if (isCall) {
      bgClass = "min-h-screen text-[#f4f4f5] flex flex-col font-mono select-none overflow-x-hidden antialiased relative transition-all duration-700 ease-in-out bg-[#011409]";
    } else {
      bgClass = "min-h-screen text-[#f4f4f5] flex flex-col font-mono select-none overflow-x-hidden antialiased relative transition-all duration-700 ease-in-out bg-[#140203]";
    }
  }

  // Determine if alert notifications are allowed to display.
  // Alert notifications are only allowed if purchasedTier > 1 (paid tiers).
  // Additionally, alerts are never allowed on the landing page ('home'), for any tier.
  const showAlerts = purchasedTier > 1 && activeTab !== 'home';

  return (
    <div className={bgClass}>
      {showAlerts && <SkyseyeAlertHub />}
      
      {/* Liquid background elements mirroring Apple macOS/iOS fluid updates */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 transition-opacity duration-1000">
        {showColoredBg && isCall && (
          <>
            <div className="absolute top-[-10%] left-[-10%] w-[55%] h-[55%] rounded-full bg-emerald-500/12 blur-[120px] animate-fluid-blob-1 transition-all duration-700" />
            <div className="absolute bottom-[-15%] right-[-10%] w-[65%] h-[60%] rounded-full bg-teal-500/8 blur-[140px] animate-fluid-blob-2 transition-all duration-700" />
            <div className="absolute top-[35%] right-[20%] w-[45%] h-[45%] rounded-full bg-emerald-450/6 blur-[110px] animate-fluid-blob-3 transition-all duration-700" />
          </>
        )}
        {showColoredBg && !isCall && (
          <>
            <div className="absolute top-[-10%] left-[-10%] w-[55%] h-[55%] rounded-full bg-rose-500/12 blur-[120px] animate-fluid-blob-1 transition-all duration-700" />
            <div className="absolute bottom-[-15%] right-[-10%] w-[65%] h-[60%] rounded-full bg-red-600/8 blur-[140px] animate-fluid-blob-2 transition-all duration-700" />
            <div className="absolute top-[35%] right-[20%] w-[45%] h-[45%] rounded-full bg-[#ff453a]/6 blur-[110px] animate-fluid-blob-3 transition-all duration-700" />
          </>
        )}
        {!showColoredBg && (
          <>
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.012] via-transparent to-black/[0.12] backdrop-blur-[1px] pointer-events-none transition-all duration-700" />
            <div className="absolute top-[-10%] left-[-10%] w-[52%] h-[52%] rounded-full bg-white/6 blur-[120px] animate-fluid-blob-1 transition-all duration-700" />
            <div className="absolute bottom-[-15%] right-[-10%] w-[60%] h-[55%] rounded-full bg-zinc-400/5 blur-[140px] animate-fluid-blob-2 transition-all duration-700" />
            <div className="absolute top-[35%] right-[20%] w-[40%] h-[40%] rounded-full bg-zinc-650/4 blur-[110px] animate-fluid-blob-3 transition-all duration-700" />
            <div className="absolute top-[10%] right-[40%] w-[35%] h-[35%] rounded-full bg-white/3 blur-[90px] animate-pulse transition-all duration-700" />
          </>
        )}
      </div>

      <div className="flex-1 flex flex-col w-full max-w-[1600px] mx-auto relative z-10">
        {/* Upper ecosystem workstation cockpit core header */}
        <header className="sticky top-0 z-50 bg-[#050506]/80 backdrop-blur-xl border-b border-zinc-900/60 px-6 py-3 flex flex-col sm:flex-row justify-between items-center select-none font-mono gap-4">

        <div className="flex flex-wrap items-center gap-3.5">
          <div 
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse group-hover:bg-emerald-450 transition-colors" />
            <span className="text-xs font-black tracking-widest text-[#FFFFFF] uppercase whitespace-nowrap group-hover:text-emerald-400 transition-colors">
              slayertrade
            </span>
          </div>

          {serverState?.data_source === 'TRADIER_POLYGON_COMPLEMENTARY' ? (
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 text-[8.5px] font-black tracking-widest uppercase rounded-xs">
              <span className="relative flex h-1.5 w-1.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-500"></span>
              </span>
              <span>COMPLEMENTARY FEED (POLYGON + TRADIER) ACTIVE</span>
            </div>
          ) : serverState?.data_source === 'TRADIER_LIVE' ? (
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-500/10 border border-blue-500/25 text-blue-400 text-[8.5px] font-black tracking-widest uppercase rounded-xs">
              <span className="relative flex h-1.5 w-1.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-450 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500"></span>
              </span>
              <span>LIVE TRADIER STREAM ACTIVE</span>
            </div>
          ) : serverState?.data_source === 'POLYGON_LIVE' ? (
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[8.5px] font-black tracking-widest uppercase rounded-xs">
              <span className="relative flex h-1.5 w-1.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
              <span>LIVE POLYGON STREAM ACTIVE</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-500/10 border border-amber-500/25 text-amber-500 text-[8.5px] font-black tracking-widest uppercase rounded-xs" title="Provide TRADIER_API_KEY inside workspace configuration to activate live Tradier OPRA contracts">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
              <span>SANDBOX SIMULATION MODE</span>
            </div>
          )}

          <span className="text-zinc-800 text-xs hidden sm:inline">/</span>

          {/* Active Workstation selector dropdown on hover */}
          <div className="relative group py-1">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400 hover:text-white cursor-pointer select-none bg-zinc-950/80 hover:bg-zinc-900 border border-zinc-850 px-3 py-1.5 rounded-md transition-all">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>ACTIVE ENGINE: <span className="text-white uppercase font-black">
                {activeTab === 'home' && 'Ecosystem Introduction'}
                {activeTab === 'skyvision' && 'Slayer // SkyVision'}
                {activeTab === 'pinpoint' && 'Slayer // Pinpoint'}
                {activeTab === 'auditor' && 'Trust Archive & Registry'}
                {activeTab === 'dealerflow' && 'Dealer Flow'}
                {activeTab === 'arbor' && 'Research & Community'}
              </span></span>
              <span className="text-[8px] text-zinc-650 group-hover:text-white transition-transform duration-200">▼</span>
            </div>
            
            {/* Hover options list */}
            <div className="absolute top-full left-0 mt-1 w-[22rem] bg-[#09090b] border border-zinc-850 rounded-sm shadow-2xl opacity-0 scale-95 origin-top-left invisible group-hover:opacity-100 group-hover:scale-100 group-hover:visible transition-all duration-150 z-50 p-2 space-y-1 max-h-[80vh] overflow-y-auto">
              <div className="text-[8px] text-zinc-650 font-black tracking-widest px-2 py-1 border-b border-[#121214] uppercase mb-1">
                SELECT COGNITIVE CORE
              </div>
                       <button
                onClick={() => handleSelectTab('home')}
                className={`w-full text-left px-2.5 py-2 text-[10px] font-medium transition-all rounded-xs flex items-center justify-between cursor-pointer ${
                  activeTab === 'home'
                    ? 'bg-zinc-900 text-white font-bold border-l-2 border-white pl-2'
                    : 'text-zinc-400 hover:bg-zinc-900/50 hover:text-white'
                }`}
              >
                <span>1. ECOSYSTEM INTRODUCTION</span>
                <span className="text-[8px] text-zinc-650 font-mono">LANDING</span>
              </button>

              <button
                onClick={() => handleSelectTab('skyvision')}
                className={`w-full text-left px-2.5 py-2 text-[10px] font-medium transition-all rounded-xs flex items-center justify-between cursor-pointer ${
                  activeTab === 'skyvision'
                    ? 'bg-zinc-900 text-white font-bold border-l-2 border-emerald-450 pl-2'
                    : 'text-zinc-400 hover:bg-zinc-900/50 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-1.55">
                  <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" />
                  <span>2. SLAYER // SKYVISION</span>
                </span>
                <span className="text-[8px] text-zinc-650 font-mono">DECISION ARMORY</span>
              </button>

              <button
                onClick={() => handleSelectTab('pinpoint')}
                className={`w-full text-left px-2.5 py-2 text-[10px] font-medium transition-all rounded-xs flex items-center justify-between cursor-pointer ${
                  activeTab === 'pinpoint'
                    ? 'bg-zinc-900 text-white font-bold border-l-2 border-emerald-450 pl-2'
                    : 'text-zinc-400 hover:bg-zinc-900/50 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-1.55">
                  <Dna className="w-3 h-3 text-emerald-450" />
                  <span>3. SLAYER // PINPOINT</span>
                </span>
                <span className="text-[8px] text-zinc-650 font-mono">MARKET INTEL</span>
              </button>

              <button
                onClick={() => handleSelectTab('auditor')}
                className={`w-full text-left px-2.5 py-2 text-[10px] font-medium transition-all rounded-xs flex items-center justify-between cursor-pointer ${
                  activeTab === 'auditor'
                    ? 'bg-zinc-900 text-white font-bold border-l-2 border-emerald-450 pl-2'
                    : 'text-zinc-400 hover:bg-zinc-900/50 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-1.55">
                  <Database className="w-3 h-3 text-zinc-500" />
                  <span>4. TRUST ARCHIVE & REGISTRY</span>
                </span>
                <span className="text-[8px] text-zinc-650 font-mono">TRUST CORE</span>
              </button>

              <button
                onClick={() => handleSelectTab('dealerflow')}
                className={`w-full text-left px-2.5 py-2 text-[10px] font-medium transition-all rounded-xs flex items-center justify-between cursor-pointer ${
                  activeTab === 'dealerflow'
                    ? 'bg-zinc-900 text-white font-bold border-l-2 border-emerald-450 pl-2'
                    : 'text-zinc-400 hover:bg-zinc-900/50 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-1.55">
                  <Waves className="w-3 h-3 text-emerald-450" />
                  <span>5. DEALER FLOW</span>
                </span>
                <span className="text-[8px] text-zinc-650 font-mono">GAMMA FLOW</span>
              </button>

              <div className="text-[8px] text-zinc-650 font-black tracking-widest px-2 py-1 border-t border-b border-[#121214] uppercase my-1 font-mono">
                MORE POWER TOOLS
              </div>

              <button
                onClick={() => handleSelectTab('arbor')}
                className={`w-full text-left px-2.5 py-2 text-[10px] font-medium transition-all rounded-xs flex items-center justify-between cursor-pointer ${
                  activeTab === 'arbor'
                    ? 'bg-zinc-900 text-white font-bold border-l-2 border-emerald-450 pl-2'
                    : 'text-zinc-400 hover:bg-zinc-900/50 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-1.55">
                  <GraduationCap className="w-3 h-3 text-emerald-450" />
                  <span>6. RESEARCH & COMMUNITY</span>
                </span>
                <span className="text-[8px] text-zinc-650 font-mono">EDUCATION</span>
              </button>

              <div className="text-[8px] text-zinc-650 font-black tracking-widest px-2 py-1 border-t border-b border-[#121214] uppercase my-1 font-mono">
                USER PERSONALIZATION
              </div>

              <button
                onClick={() => handleSelectTab('settings')}
                className={`w-full text-left px-2.5 py-2 text-[10px] font-medium transition-all rounded-xs flex items-center justify-between cursor-pointer ${
                  activeTab === 'settings'
                    ? 'bg-zinc-900 text-white font-bold border-l-2 border-emerald-450 pl-2'
                    : 'text-zinc-400 hover:bg-zinc-900/50 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-1.55">
                  <SlidersHorizontal className="w-3 h-3 text-emerald-450" />
                  <span>7. SYSTEM CONFIGURATION</span>
                </span>
                <span className="text-[8px] text-zinc-650 font-mono">SETTINGS</span>
              </button>

              <button
                onClick={() => handleSelectTab('workspace')}
                className={`w-full text-left px-2.5 py-2 text-[10px] font-medium transition-all rounded-xs flex items-center justify-between cursor-pointer ${
                  activeTab === 'workspace'
                    ? 'bg-zinc-900 text-white font-bold border-l-2 border-emerald-450 pl-2'
                    : 'text-zinc-400 hover:bg-zinc-900/50 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-1.55">
                  <LayoutGrid className="w-3 h-3 text-emerald-450" />
                  <span>8. TERMINAL WORKSPACE</span>
                </span>
                <span className="text-[8px] text-zinc-650 font-mono">GRID</span>
              </button>

              {session?.is_super_admin && (
                <button
                  onClick={() => handleSelectTab('admin')}
                  className={`w-full text-left px-2.5 py-2 text-[10px] font-medium transition-all rounded-xs flex items-center justify-between cursor-pointer ${
                    activeTab === 'admin'
                      ? 'bg-rose-950/40 text-white font-bold border-l-2 border-rose-500 pl-2'
                      : 'text-rose-400/80 hover:bg-rose-950/20 hover:text-rose-300'
                  }`}
                >
                  <span className="flex items-center gap-1.55">
                    <Lock className="w-3 h-3 text-rose-500" />
                    <span>★ OVERSEER COMMAND CENTER</span>
                  </span>
                  <span className="text-[8px] text-zinc-650 font-mono">ADMIN</span>
                </button>
              )}
            </div>
          </div>

          {/* Timeframe picker removed from top bar */}
        </div>

        {/* Real HTTP OAuth Action segment header (Bug #9) */}
        <div className="flex items-center flex-wrap gap-4 text-[9.5px]">
          {/* Subscription Tier Badge */}
          <div 
            onClick={handleUpgradeClick}
            className={`flex items-center gap-2.5 px-3 py-1.5 border rounded-md cursor-pointer hover:brightness-110 hover:border-zinc-500/40 active:scale-[0.98] transition-all select-none group font-mono ${tierInfo.style}`}
            title="Your current subscription level. Click to view upgrade options or manage tiers."
          >
            <span className="relative flex h-2 w-2 shrink-0">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${tierInfo.dotColor}`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${tierInfo.dotColor}`}></span>
            </span>
            <div className="flex flex-col text-left leading-tight">
              <span className="text-[9.5px] font-black tracking-wider flex items-center gap-1 text-white text-sans">
                {tierInfo.label}
                <ChevronRight className="w-2.5 h-2.5 opacity-30 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all ml-0.5 text-zinc-400 shrink-0" />
              </span>
              <span className="text-[7.5px] text-[#71717A] font-extrabold tracking-wider uppercase group-hover:text-white transition-colors">
                {tierInfo.desc}
              </span>
            </div>
          </div>

          {session?.authenticated ? (
            <div className="flex items-center gap-3 bg-zinc-950 px-3.5 py-1.5 border border-zinc-900 rounded-sm">
              <img
                src={withCacheBust(session.avatar, avatarCacheBust)}
                alt="user avatar"
                className="w-4.5 h-4.5 rounded-full border border-zinc-850 object-cover" 
                referrerPolicy="no-referrer"
              />
              <span className="text-[10px] font-black text-white uppercase">{session.name}</span>
              <span className="text-zinc-800">|</span>
              <button 
                onClick={() => handleSelectTab('settings')} 
                className={`flex items-center gap-1 text-[10px] uppercase font-black tracking-wider transition-colors cursor-pointer ${
                  activeTab === 'settings' ? 'text-emerald-400 text-bold' : 'text-zinc-500 hover:text-white'
                }`}
                title="System preferences & invoice summaries"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>SETTINGS</span>
              </button>
              <span className="text-zinc-800">|</span>
              <button 
                onClick={handleLogout} 
                className="hover:text-amber-500 transition-colors cursor-pointer text-zinc-500 uppercase font-black flex items-center gap-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>LOGOUT</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-zinc-650 hidden md:block uppercase font-black text-[9px] mr-2">SECURE PORTAL:</span>
              <button
                onClick={() => setShowAuthModal(true)}
                className="px-3 py-1.5 border border-emerald-850 hover:border-emerald-500 bg-emerald-950/30 text-emerald-400 hover:text-white uppercase font-black transition-all flex items-center gap-1.5 text-[9.5px] rounded-xs cursor-pointer active:scale-95"
              >
                <span>LOGIN / CREATE ACCOUNT</span>
              </button>
              <span className="text-zinc-800 text-[10px] select-none mx-0.5">|</span>
              <a 
                href="/api/auth/sandbox" 
                className="px-3 py-1.5 border border-zinc-850 hover:border-zinc-755 bg-zinc-950 text-zinc-400 hover:text-white uppercase font-black transition-colors flex items-center gap-1.5 text-[9.5px] rounded-xs"
              >
                <span>ACTIVATE SANDBOX ENVIRONMENT</span>
              </a>
            </div>
          )}
        </div>
      </header>

      {/* Interactive Continuously-Scrolling Nasdaq Ticker Tape (Restricted to Landing Page only) */}
      {activeTab === 'home' && <TickerTape />}
 
       {/* Main workspace frame */}
       <main className="flex-1 p-4 md:p-6 flex flex-col gap-6 w-full max-w-full justify-start">
        {/* TAB 1: HOME */}
        {activeTab === 'home' && (
          <div className="animate-fadeIn">
            <SlayerIntro 
              onEnterApp={(targetTab) => {
                const mappedTab = targetTab === 'quant' ? 'auditor' : (targetTab || 'skyvision');
                handleSelectTab(mappedTab as any);
              }} 
              onUpgradeComplete={(newTier) => {
                setWelcomeCelebrationTier(newTier);
                setShowWelcomeCelebration(true);
              }}
              selectedAsset={selectedAsset}
              setSelectedAsset={setSelectedAsset}
              selectedTimeframe={selectedTimeframe}
              setSelectedTimeframe={setSelectedTimeframe}
              systemScore={serverState.system_score}
              v8Trades={serverState.trade_archive}
              bestOpportunity={bestOpportunity}
              topSub10Calls={topSub10Calls}
              topSub10Puts={topSub10Puts}
              onSelectOpportunity={(asset, type, strike) => {
                handleSelectOpportunity(asset, type, strike);
              }}
              renderTerminalWorkspace={() => null}
              session={session}
              onRequestAuth={() => setShowAuthModal(true)}
            />
          </div>
        )}

        {activeTab === 'subscription' && (
          <div className="view-enter w-full mx-auto min-h-screen">
             <SubscriptionPricing 
               onUpgradeComplete={(newTier) => {
                 setWelcomeCelebrationTier(newTier);
                 setShowWelcomeCelebration(true);
               }}
               onEnterApp={() => setActiveTab('home')}
               session={session}
               onRequestAuth={() => setShowAuthModal(true)}
             />
          </div>
        )}

        {/* TAB 2: SKYVISION (DECISION ENGINE) */}
        {activeTab === 'skyvision' && (
          <div className="view-enter">
            <TierGuard requiredTier={2} tabKey="skyvision" planKey="skyvision" planName="SkyVision Cockpit" planPrice="$350">
              <SkyVisionView />
            </TierGuard>
          </div>
        )}

        {/* TAB 3: PINPOINT AI (MARKET INTELLIGENCE) */}
        {activeTab === 'pinpoint' && (
          <div className="view-enter border border-zinc-900 bg-[#060607]/80 rounded-md p-1 drop-shadow-2xl">
            <TierGuard requiredTier={3} tabKey="pinpoint" planKey="pinpoint" planName="Pinpoint Gexbot Tracker" planPrice="$500">
              <PinpointAIView />
            </TierGuard>
          </div>
        )}

        {/* TAB 5: AUDIT (TRUST ENGINE) */}
        {activeTab === 'auditor' && (
          <div className="view-enter">
            <TierGuard requiredTier={4} tabKey="trust archive & registry" planKey="quant" planName="Institutional Quant Engine" planPrice="$1500">
              <QuantAuditView
                selectedAsset={selectedAsset}
                isCall={selectedOptionType === 'C'}
                systemScore={serverState.system_score}
                optionPremium={serverState.optionPremiumFloat}
                trades={serverState.trade_archive}
                onClearTrades={clearV8Trades}
              />
            </TierGuard>
          </div>
        )}

        {/* TAB 6: DEALER FLOW */}
        {activeTab === 'dealerflow' && (
          <div className="view-enter">
            <TierGuard requiredTier={4} tabKey="dealer flow" planKey="quant" planName="Institutional Quant Engine" planPrice="$1500">
              <DealerFlowView />
            </TierGuard>
          </div>
        )}

        {/* TAB 11: RESEARCH & COMMUNITY */}
        {activeTab === 'arbor' && (
          <div className="view-enter">
            <TierGuard requiredTier={2} tabKey="research & community" planKey="skyvision" planName="SkyVision Cockpit" planPrice="$350">
              <ArborCapital />
            </TierGuard>
          </div>
        )}

        {/* TAB 7: SETTINGS PERSONALIZATION */}
        {activeTab === 'settings' && (
          <div className="view-enter">
            <SettingsPanel session={session} onUpdateSession={fetchSession} />
          </div>
        )}

        {/* TAB 8: ADMIN OVERSEER */}
        {activeTab === 'workspace' && (
          <div className="view-enter">
            <WorkspaceView isSuperAdmin={!!session?.is_super_admin} />
          </div>
        )}

        {activeTab === 'admin' && (
          <AdminOverseerPanel
            session={session} 
            onSimulateTier={handleSimulateTier} 
          />
        )}
      </main>

      {/* Subscription Tier Upgrade Celebration Overlay */}
      <CelebrationOverlay 
        purchasedTier={welcomeCelebrationTier}
        isOpen={showWelcomeCelebration}
        onComplete={() => {
          setShowWelcomeCelebration(false);
          useContractStore.getState().setActiveTab('home');
        }}
      />

      {/* VIEWPORT SIMULATION ACTIVE BANNER */}
      {isSimulating && (
        <div className="fixed top-0 left-0 right-0 z-[9999] bg-rose-600 text-white px-4 py-1.5 flex justify-between items-center font-mono text-[10px] uppercase tracking-widest font-black shadow-[0_0_20px_rgba(225,29,72,0.4)]">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 bg-white rounded-full animate-ping" />
            <span>SPOOFING ACTIVE: VIEWING PLATFORM AS [{session?.access_tier}]</span>
          </div>
          <button 
            onClick={handleExitSimulation}
            className="bg-black hover:bg-zinc-900 text-white px-4 py-1 transition-colors border border-rose-800"
          >
            TERMINATE SIMULATION & RESTORE MASTER CLEARANCE
          </button>
        </div>
      )}

      {/* Clerk Secure Gateway Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
          <ClerkGate 
            referralCodeFromUrl={window.location.pathname.startsWith('/join/') ? window.location.pathname.replace('/join/', '') : undefined}
            onSuccess={(user) => {
              setSession(user);
              setShowAuthModal(false);
              fetchSession();
            }}
            onClose={() => setShowAuthModal(false)}
          />
        </div>
      )}

      {/* Terminal Footer Status Bar */}
      <footer className="mt-auto border-t border-zinc-900 bg-black px-6 py-3.5 flex flex-col sm:flex-row items-center justify-between text-[9px] text-zinc-550 font-mono tracking-widest uppercase gap-2">
        <div className="flex flex-wrap gap-4 sm:gap-6 justify-center sm:justify-start">
          <span>SYSTEM STATUS: OPTIMAL</span>
          <span className="text-zinc-850">|</span>
          <span>LATENCY: ACTIVE (SSE SYNC)</span>
          <span className="text-zinc-850">|</span>
          <span>FEED: CME GROUP DIRECT FEED</span>
          <span className="text-zinc-850">|</span>
          <span>PROVENANCE TRAIL ACTIVE</span>
          <span className="text-zinc-850">|</span>
          <span className="text-white">AUDIT: {serverState?.provenance?.audit_id || 'AUD-991A'}</span>
        </div>
        <div className="flex items-center gap-2 mt-2 sm:mt-0">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
          <span className="text-zinc-400 font-bold">SERVER LIVE FEED STREAMING</span>
        </div>
      </footer>
      </div>

      {/* ============================================================
       PRISM GLOBAL COMMAND MENU PALETTE MODAL (CMD+K Gateway)
       ============================================================ */}
      <AnimatePresence>
        {isGlobalSearchOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setIsGlobalSearchOpen(false);
              }
            }}
            className="fixed inset-0 bg-black/90 z-[999] flex items-center justify-center p-4 backdrop-blur-md font-mono cursor-default" 
            id="prism-menu"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 16, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 12, opacity: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1.2, 0.36, 1] }} // --ease-spring
              className="w-full max-w-lg bg-[#0e0e11] border border-zinc-850 rounded-lg shadow-2xl overflow-hidden text-left"
            >
              <div className="p-4 border-b border-zinc-900/60 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <Search className="w-4 h-4 text-zinc-500 animate-pulse" />
                  <input 
                    type="text"
                    ref={globalSearchInputRef}
                    value={globalSearchInput}
                    onChange={(e) => {
                      setGlobalSearchInput(e.target.value);
                      setGlobalSearchIndex(0);
                    }}
                    onKeyDown={handleGlobalSearchKeyDown}
                    placeholder="Type search keyword or select computing token..."
                    className="w-full bg-zinc-950 border border-zinc-850 px-3.5 py-1.5 text-white text-xs placeholder-zinc-650 font-mono rounded-md focus:ring-1 focus:ring-emerald-500/80 focus:border-emerald-500/80 focus:outline-none text-[11px]"
                  />
                  <button 
                    type="button"
                    onClick={() => setIsGlobalSearchOpen(false)}
                    className="text-zinc-500 hover:text-white text-[9px] uppercase font-black transition-colors focus:outline-none"
                  >
                    ESC
                  </button>
                </div>
                <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar -mb-1 pb-1">
                  {['All', 'Assets', 'Tools', 'Navigation'].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => {
                        setPrismFilter(filter as any);
                        setGlobalSearchIndex(0);
                      }}
                      className={`px-3 py-1 rounded-sm text-[9px] uppercase font-bold transition-colors cursor-pointer ${
                        prismFilter === filter ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 max-h-[320px] overflow-y-auto hide-scrollbar">
                <div className="text-[7.5px] text-[#5c5c68] font-extrabold uppercase px-3 py-1 tracking-wider mb-1">
                  {prismFilter === 'All' ? 'GLOBAL REGISTRY' : prismFilter.toUpperCase()}
                </div>

                <div className="space-y-[1.5px]">
                  {filterTickersList.map((tickerItemRaw, idx) => {
                    const tickerItem = tickerItemRaw as any;
                    const isActive = idx === globalSearchIndex;
                    const isTkActive = selectedAsset.ticker === tickerItem.ticker;
                    
                    return (
                      <button
                        key={tickerItem.isContract || tickerItem.isNav || tickerItem.isTool ? tickerItem.id : tickerItem.ticker}
                        type="button"
                        onClick={() => {
                          if (tickerItem.isContract) {
                            useContractStore.setState({
                              activeTab: 'auditor',
                              auditSearchQuery: tickerItem.contract,
                              expandedAuditId: tickerItem.id
                            });
                          } else if (tickerItem.isNav) {
                            useContractStore.setState({
                              activeTab: tickerItem.targetTab,
                              auditSearchQuery: '',
                              expandedAuditId: null
                            });
                          } else if (tickerItem.isTool) {
                            if (tickerItem.id === 'svi-solver') {
                              useContractStore.setState({
                                activeTab: 'pinpoint',
                                auditSearchQuery: '',
                                expandedAuditId: null
                              });
                            } else if (tickerItem.id === 'gamma-surface') {
                              useContractStore.setState({
                                activeTab: 'skyvision',
                                auditSearchQuery: '',
                                expandedAuditId: null
                              });
                            } else if (tickerItem.id === 'vpin-tracker') {
                              useContractStore.setState({
                                activeTab: 'dealerflow',
                                auditSearchQuery: '',
                                expandedAuditId: null
                              });
                            }
                          } else {
                            const targetAsset = ASSET_LIST.find(a => a.ticker === tickerItem.ticker);
                            if (targetAsset) {
                              setSelectedAsset(targetAsset);
                              useContractStore.setState({
                                auditSearchQuery: '',
                                expandedAuditId: null
                              });
                            }
                          }
                          setIsGlobalSearchOpen(false);
                        }}
                        className={`w-full flex items-center justify-between text-left px-4 py-3 rounded-md transition-all border outline-none focus:outline-none cursor-pointer ${
                          isActive 
                            ? 'bg-[#18181c] border-zinc-800' 
                            : 'bg-transparent border-transparent'
                        }`}
                        onMouseEnter={() => setGlobalSearchIndex(idx)}
                      >
                        <div className="flex items-center gap-3.5 flex-1 min-w-0 pr-2">
                          <span className={`text-[12px] font-black tracking-wider shrink-0 ${isActive ? 'text-[#38bdf8]' : isTkActive ? 'text-emerald-450' : 'text-zinc-300'}`}>
                            {tickerItem.isContract ? tickerItem.contract : tickerItem.ticker}
                          </span>
                          <span className="text-[10px] text-zinc-500 uppercase font-medium truncate">
                            {tickerItem.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2.5 shrink-0">
                          <span className="text-[10px] font-bold text-zinc-400 font-mono">
                            {tickerItem.isContract || tickerItem.isTool || tickerItem.isNav ? tickerItem.pnl : `$${tickerItem.price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                          </span>
                          <ChevronRight className={`w-3.5 h-3.5 transition-colors ${isActive ? 'text-white' : 'text-zinc-700'}`} />
                        </div>
                      </button>
                    );
                  })}
                  {filterTickersList.length === 0 && (
                    <div className="text-zinc-650 font-mono text-[9px] text-center uppercase py-8 tracking-widest">
                      No matching records found
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-black/40 px-4 py-2 border-t border-zinc-900 flex justify-between items-center text-[7.5px] text-zinc-650 uppercase tracking-wider font-semibold font-mono">
                <span>USE KEYBOARD ARROWS ↑↓ AND ENTER</span>
                <span>{keybinds.prismMenu?.replace('cmd', typeof window !== 'undefined' && navigator.userAgent.includes('Mac') ? '⌘' : 'Ctrl').toUpperCase()} TO TOGGLE</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
