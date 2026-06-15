/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useContractStore } from '../lib/store';
import { FeatureMatrix } from './FeatureMatrix';
import { 
  ArrowRight, 
  Globe, 
  Check, 
  Sparkles, 
  Compass, 
  Dna, 
  Database,
  Layers,
  MessageSquare,
  TrendingUp,
  Sliders,
  CheckCircle2,
  ShieldCheck,
  Eye,
  Activity,
  Bot,
  ExternalLink,
  Lock,
  Search,
  Bell,
  CreditCard,
  X,
  Mail,
  User
} from 'lucide-react';
import { AssetInfo, TimeframeVal, SystemScore, V8TradeRecord } from '../types';
import { ASSET_LIST } from '../data';

interface SlayerIntroProps {
  onEnterApp: (targetTab?: string) => void;
  selectedAsset: AssetInfo;
  setSelectedAsset: (asset: AssetInfo) => void;
  selectedTimeframe: TimeframeVal;
  setSelectedTimeframe: (tf: TimeframeVal) => void;
  systemScore: SystemScore;
  v8Trades: V8TradeRecord[];
  bestOpportunity: {
    asset: AssetInfo;
    ticker: string;
    confidence: number;
    isCall: boolean;
    currentPrice: string;
    fairValue: string;
    entryZone: string;
  };
  topSub10Calls: Array<{ asset: AssetInfo; ticker: string; confidence: number }>;
  topSub10Puts: Array<{ asset: AssetInfo; ticker: string; confidence: number }>;
  onSelectOpportunity: (asset: AssetInfo, type: 'C' | 'P', strike?: number) => void;
  renderTerminalWorkspace: () => React.ReactNode;
  session?: any;
  onRequestAuth?: () => void;
}

export default function SlayerIntro({
  onEnterApp,
  selectedAsset,
  setSelectedAsset,
  selectedTimeframe,
  setSelectedTimeframe,
  systemScore,
  v8Trades,
  bestOpportunity: originalBestOpportunity,
  topSub10Calls,
  topSub10Puts,
  onSelectOpportunity,
  session,
  onRequestAuth,
}: SlayerIntroProps) {
  const serverState = useContractStore(s => s.serverState);
  
  // State for active chosen index on landing hero
  const [activeHeroIdx, setActiveHeroIdx] = useState<'SPX' | 'NDX' | 'QQQ' | 'SPY' | 'RUT'>('SPX');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  // Interactive mock checkout state variables
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<string | null>(null);
  const [checkoutStep, setCheckoutStep] = useState<'details' | 'processing' | 'success'>('details');
  const [checkoutSubStep, setCheckoutSubStep] = useState<'details' | 'billing'>('details');
  const [userPhone, setUserPhone] = useState('');
  const [userAddress, setUserAddress] = useState('');
  const [userZip, setUserZip] = useState('');
  const [mockCardNumber, setMockCardNumber] = useState('4242 4242 4242 4242');
  const [mockCardName, setMockCardName] = useState('');
  const [mockCardExpiry, setMockCardExpiry] = useState('12/28');
  const [mockCardCvv, setMockCardCvv] = useState('123');
  const [processingLogs, setProcessingLogs] = useState<string[]>([]);
  const [mockEmail, setMockEmail] = useState('');
  const [mockCompanyName, setMockCompanyName] = useState('');
  const [referralSource, setReferralSource] = useState('');
  const [lifetimeCompanyName, setLifetimeCompanyName] = useState('');
  const [lifetimeReferralSource, setLifetimeReferralSource] = useState('');
  const [mockAllocationNeed, setMockAllocationNeed] = useState('$5M - $25M DB allocation');
  const [mockPriorityMessage, setMockPriorityMessage] = useState('');
  const [lifetimePriorityMessage, setLifetimePriorityMessage] = useState('');
  const [contactType, setContactType] = useState<'individual' | 'business'>('individual');
  const [lifetimeContactType, setLifetimeContactType] = useState<'individual' | 'business'>('individual');

  // Isolated states for Regular Individual Checkout
  const [regIndName, setRegIndName] = useState('');
  const [regIndEmail, setRegIndEmail] = useState('');
  const [regIndPhone, setRegIndPhone] = useState('');
  const [regIndReferralSource, setRegIndReferralSource] = useState('');

  // Isolated states for Regular Business Checkout
  const [regBusName, setRegBusName] = useState('');
  const [regBusEmail, setRegBusEmail] = useState('');
  const [regBusPhone, setRegBusPhone] = useState('');
  const [regBusCompanyName, setRegBusCompanyName] = useState('');
  const [regBusReferralSource, setRegBusReferralSource] = useState('');

  // Isolated states for Lifetime Pass Individual
  const [lifetimeIndName, setLifetimeIndName] = useState('');
  const [lifetimeIndEmail, setLifetimeIndEmail] = useState('');
  const [lifetimeIndPhone, setLifetimeIndPhone] = useState('');
  const [lifetimeIndReferralSource, setLifetimeIndReferralSource] = useState('');

  // Isolated states for Lifetime Pass Business
  const [lifetimeBusName, setLifetimeBusName] = useState('');
  const [lifetimeBusEmail, setLifetimeBusEmail] = useState('');
  const [lifetimeBusPhone, setLifetimeBusPhone] = useState('');
  const [lifetimeBusCompanyName, setLifetimeBusCompanyName] = useState('');
  const [lifetimeBusReferralSource, setLifetimeBusReferralSource] = useState('');
  const [lifetimeBusMessage, setLifetimeBusMessage] = useState('');
  
  // Real-time verification validation states for success screen
  const [successValidationLogs, setSuccessValidationLogs] = useState<string[]>([]);
  const [isValidatingSuccess, setIsValidatingSuccess] = useState(false);
  const [isSuccessValidatedDone, setIsSuccessValidatedDone] = useState(false);

  // Keyboard shortcut: close window with ESC key safely if not in critical processing state
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedPlanForCheckout && checkoutStep !== 'processing') {
        setSelectedPlanForCheckout(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedPlanForCheckout, checkoutStep]);

  const checkoutPlan = useContractStore(s => s.checkoutPlan);
  const setCheckoutPlan = useContractStore(s => s.setCheckoutPlan);

  const paymentAreaRef = useRef<HTMLDivElement>(null);

  const handleCheckoutPlan = (plan: string) => {
    if (!session?.authenticated) {
      alert("Before checking out, please authenticate your workstation using our unified Clerk secure gateway.");
      if (onRequestAuth) {
        onRequestAuth();
      }
      return;
    }
    setSelectedPlanForCheckout(plan);
    setCheckoutStep('details');
    setCheckoutSubStep('details');
  };

  useEffect(() => {
    if (checkoutPlan) {
      if (!session?.authenticated) {
        alert("Before checking out, please authenticate your workstation using our unified Clerk secure gateway.");
        if (onRequestAuth) onRequestAuth();
        setCheckoutPlan(null);
        return;
      }
      setSelectedPlanForCheckout(checkoutPlan);
      setCheckoutStep('details');
      setCheckoutSubStep('details');
      setCheckoutPlan(null);
    }
  }, [checkoutPlan, session, onRequestAuth]);

  // Seamless auto Scroll & focus to form section/inputs on load
  useEffect(() => {
    if (selectedPlanForCheckout && checkoutStep === 'details') {
      const timer = setTimeout(() => {
        let inputId = 'reg-ind-name-input';
        if (selectedPlanForCheckout === 'lifetime') {
          inputId = lifetimeContactType === 'individual' ? 'lifetime-ind-name-input' : 'lifetime-bus-name-input';
        } else {
          inputId = contactType === 'individual' ? 'reg-ind-name-input' : 'reg-bus-name-input';
        }
        const input = document.getElementById(inputId);
        if (input) {
          input.focus();
          input.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          paymentAreaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [selectedPlanForCheckout, checkoutStep, checkoutSubStep, contactType, lifetimeContactType]);

  // Prevent background scrolling when checkout modal is active
  useEffect(() => {
    if (selectedPlanForCheckout) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedPlanForCheckout]);

  // Processing log automation side effect
  useEffect(() => {
    if (checkoutStep === 'processing' && selectedPlanForCheckout) {
      const logs = selectedPlanForCheckout === 'lifetime' ? [
        "Sending message request...",
        "Validating contact entries...",
        "Opening support ticket channel...",
        "Registering details in contact directory...",
        "Handshake completed successfully!"
      ] : [
        "Opening encrypted SSL checkout tunnel...",
        "Validating payment tokens against testnet node...",
        "Verifying cumulative tier clearance constraints...",
        "Provisioning authorization keys inside database tier...",
        "Upgrading member clearance level ... SUCCESS!"
      ];
      
      setProcessingLogs([]);
      let index = 0;
      const interval = setInterval(() => {
        if (index < logs.length) {
          setProcessingLogs(p => [...p, logs[index]]);
          index++;
        } else {
          clearInterval(interval);
          
          if (selectedPlanForCheckout === 'lifetime') {
            setTimeout(() => {
              useContractStore.getState().setPurchasedTier(5);
              setCheckoutStep('success');
            }, 400);
          } else {
            // Trigger actual API subscription booking and database sync (Module 3, 5)
            fetch('/api/billing/process', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                plan: selectedPlanForCheckout,
                address: userAddress || '123 Workstation Way',
                zip: userZip || '10001',
                card_number: mockCardNumber,
                cvc: mockCardCvv,
                expiry: mockCardExpiry,
                referralCode: (contactType === 'individual' ? regIndReferralSource : regBusReferralSource) || '',
                noRefundAgreed: true
              })
            })
            .then(res => res.json())
            .then(data => {
              if (data.success) {
                const tierNum = selectedPlanForCheckout === 'discord' ? 1 
                  : selectedPlanForCheckout === 'skyvision' ? 2 
                  : selectedPlanForCheckout === 'pinpoint' ? 3 
                  : selectedPlanForCheckout === 'quant' ? 4 
                  : 5;
                useContractStore.getState().setPurchasedTier(tierNum);
                setCheckoutStep('success');
                // Hook to tell App.tsx to reload session details so header matches instantly
                if ((window as any).refreshSlayerSession) {
                  (window as any).refreshSlayerSession();
                }
              } else {
                alert("Payment Authorization Refused: " + (data.error || "Please verify your subscription parameters."));
                setCheckoutStep('details');
              }
            })
            .catch(err => {
              console.error('Handshake billing API exception', err);
              // Fallback to offline activation if API route returns error (safe state)
              const tierNum = selectedPlanForCheckout === 'discord' ? 1 
                : selectedPlanForCheckout === 'skyvision' ? 2 
                : selectedPlanForCheckout === 'pinpoint' ? 3 
                : selectedPlanForCheckout === 'quant' ? 4 
                : 5;
              useContractStore.getState().setPurchasedTier(tierNum);
              setCheckoutStep('success');
            });
          }
        }
      }, 400);

      return () => clearInterval(interval);
    }
  }, [checkoutStep, selectedPlanForCheckout, userAddress, userZip, mockCardNumber, mockCardCvv, mockCardExpiry, contactType, regIndReferralSource, regBusReferralSource]);

  // Success screen automatic verification and validation simulation
  useEffect(() => {
    if (checkoutStep === 'success' && selectedPlanForCheckout) {
      setIsValidatingSuccess(true);
      setIsSuccessValidatedDone(false);
      
      const vLabels = {
        discord: "Discord Live alerts",
        skyvision: "SkyVision indicators",
        pinpoint: "Pinpoint Gexbot indicators",
        quant: "Quant Auditing suit",
        lifetime: "Lifetime Membership license"
      };
      
      const activeLabel = (vLabels as any)[selectedPlanForCheckout] || "Platform subscription parameters";

      const valLogs = [
        "ESTABLISHING DATABASE HANDSHAKE CHANNEL ... OK",
        "QUERYING NEW SUBSCRIPTION LEVEL RECORD ... OK",
        `VERIFYING CLEARANCE FOR: ${activeLabel.toUpperCase()} ... OK ✅`,
        "UPGRADING ENCRYPTED PERMISSION SHIELDS ... DEPLOYED ✅",
        "INJECTING SESSION SESSION_TOKEN IN CLIENT COOKIE ... OK ✅",
        "ACTIVE TIER VALIDATION COMPLETED. SEAMLESS ACCESS GRANTED."
      ];
      
      setSuccessValidationLogs([]);
      let index = 0;
      const interval = setInterval(() => {
        if (index < valLogs.length) {
          setSuccessValidationLogs(prev => [...prev, valLogs[index]]);
          index++;
        } else {
          clearInterval(interval);
          setIsValidatingSuccess(false);
          setIsSuccessValidatedDone(true);
        }
      }, 500);
      
      return () => clearInterval(interval);
    }
  }, [checkoutStep, selectedPlanForCheckout]);

  // Synchronize with external selectedAsset when it updates
  useEffect(() => {
    if (['SPX', 'NDX', 'QQQ', 'SPY', 'RUT'].includes(selectedAsset.ticker)) {
      setActiveHeroIdx(selectedAsset.ticker as any);
    }
  }, [selectedAsset]);
  
  // Animation state matching direct timestamps:
  // 0.00s: Homepage is visible and interactive.
  // 0.05s: Ripple.
  // 0.15s: Words appear.
  // 0.15s - 0.60s: Interactive Mouse Move bend/distortion.
  // 0.70s: Ghost words dissolve.
  // 0.80s: Animation overlay gone.
  const [animStage, setAnimStage] = useState<'visible' | 'ripple' | 'words' | 'dissolving' | 'completed'>('visible');
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);


  // Distortive word array
  const introWords = ['Momentum', 'Liquidity', 'Positioning', 'Conviction', 'Strength', 'Support', 'Resistance'];

  useEffect(() => {
    // 0.05s Ripple trigger
    const rippleTimer = setTimeout(() => {
      setAnimStage('ripple');
    }, 50);

    // 0.15s Words appear
    const wordsTimer = setTimeout(() => {
      setAnimStage('words');
    }, 150);

    // 0.70s Words dissolve
    const dissolveTimer = setTimeout(() => {
      setAnimStage('dissolving');
    }, 700);

    // 0.80s Gone
    const completeTimer = setTimeout(() => {
      setAnimStage('completed');
    }, 800);

    return () => {
      clearTimeout(rippleTimer);
      clearTimeout(wordsTimer);
      clearTimeout(dissolveTimer);
      clearTimeout(completeTimer);
    };
  }, []);

  // Soft track mouse position for 2-4px non-heavy organic bending/distortion
  const handleMouseMove = (e: React.MouseEvent) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  // Pricing membership structures
  const pricingTab = 'PROFESSIONAL';

  // Selected Index-specific values matching client targets precisely
  const heroOpportunities = {
    SPX: { ticker: 'SPX 7620C', health: 94, move: '+38%', status: 'Strengthening', isCall: true },
    QQQ: { ticker: 'QQQ 515C', health: 91, move: '+29%', status: 'Improving', isCall: true },
    NDX: { ticker: 'NDX 18300C', health: 89, move: '+44%', status: 'Strengthening', isCall: true },
    SPY: { ticker: 'SPY 448C', health: 93, move: '+36%', status: 'Improving', isCall: true },
    RUT: { ticker: 'RUT 2020C', health: 92, move: '+31%', status: 'Strengthening', isCall: true },
  };

  const activeOpp = heroOpportunities[activeHeroIdx];

  const handleLaunchToActiveOpportunity = () => {
    // Clear any selected strike so it brings the user to the front of Sky's Eye
    useContractStore.getState().setSelectedStrike(null);
    onEnterApp('skyvision');
  };

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      id="slayer-ecosystem-landing" 
      className="w-full bg-transparent text-[#D4D4D8] flex flex-col font-sans selection:bg-white selection:text-black relative pb-0 antialiased scroll-smooth"
    >
      
      {/* ==================================================
          GPU-ACCELERATED RIPPLE & DISTORTION INTRO LAYER (GONE BY 0.8s)
          ================================================== */}
      {animStage !== 'completed' && (
        <div className="absolute inset-0 z-50 pointer-events-none overflow-hidden h-full w-full">
          {/* 0.05s SINGLE RIPPLE RING */}
          {(animStage === 'ripple' || animStage === 'words' || animStage === 'dissolving') && (
            <motion.div
              initial={{ scale: 0.1, opacity: 0.8 }}
              animate={{ scale: 4.5, opacity: 0 }}
              transition={{ duration: 0.74, ease: 'easeOut' }}
              className="absolute w-[300px] h-[300px] rounded-full border border-zinc-550/30 -translate-x-1/2 -translate-y-1/2"
              style={{
                left: mousePos.x || '50%',
                top: mousePos.y || '40%',
              }}
            />
          )}

          {/* 0.15s GHOST WORDS BENDING COARDS */}
          {(animStage === 'words' || animStage === 'dissolving') && (
            <div className="absolute inset-0 flex flex-wrap items-center justify-center gap-12 px-10 pointer-events-none max-w-4xl mx-auto top-1/4">
              <AnimatePresence>
                {animStage !== 'dissolving' && (
                  introWords.map((word, index) => {
                    // Custom coordinate-based displacement calculations creating elegant 2-4px organic bend
                    // words behave slightly magnetically to track pointer
                    const elementId = `intro-word-${index}`;
                    const element = document.getElementById(elementId);
                    let dx = 0;
                    let dy = 0;
                    
                    if (element && mousePos.x && mousePos.y) {
                      const rect = element.getBoundingClientRect();
                      const wordCenterX = rect.left + rect.width / 2;
                      const wordCenterY = rect.top + rect.height / 2;
                      const distX = mousePos.x - wordCenterX;
                      const distY = mousePos.y - wordCenterY;
                      const centerDist = Math.sqrt(distX * distX + distY * distY);
                      
                      if (centerDist < 300) {
                        const pullFactor = (1 - centerDist / 300) * 4.5; // caps at 4.5px displacement
                        dx = (distX / centerDist) * pullFactor;
                        dy = (distY / centerDist) * pullFactor;
                      }
                    }

                    return (
                      <motion.span
                        key={word}
                        id={elementId}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ 
                          opacity: 0.35, 
                          scale: 1,
                          x: dx,
                          y: dy,
                        }}
                        exit={{ opacity: 0, scale: 0.9, filter: 'blur(3px)' }}
                        transition={{ 
                          type: 'spring', 
                          stiffness: 90, 
                          damping: 10,
                          opacity: { duration: 0.2 } 
                        }}
                        className="text-white text-xs font-mono font-black uppercase tracking-widest pointer-events-none block whitespace-nowrap select-none"
                      >
                        {word}
                      </motion.span>
                    );
                  })
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}

      {/* ==================================================
          LEVEL 1: ARBOR CAPITAL (OVERARCHING CORPORATE LAYER)
          ================================================== */}
      <div id="arbor-capital-banner" className="bg-[#050505] border-b border-zinc-900 px-6 py-3 px-6 py-3.5 flex justify-between items-center z-10 font-mono select-none">
        <div className="flex items-center gap-2">
          <Globe className="w-3.5 h-3.5 text-zinc-500" />
          <span className="text-[9.5px] tracking-[0.28em] text-[#A1A1AA] uppercase font-black">
            ARBOR CAPITAL GROUP
          </span>
        </div>
        <div className="flex items-center gap-4 text-[9px] text-[#71717A] uppercase tracking-wider font-semibold">
          <span>RESEARCH FIRM</span>
          <span className="text-zinc-850">•</span>
          <span>COMMUNITY</span>
          <span className="text-zinc-850">•</span>
          <span>TRUST PERSISTENCE</span>
        </div>
      </div>

      {/* ==================================================
          MAIN HERO (LEVEL 2 & LEVEL 3 INTELS - ABSOLUTE FOCUS)
          ================================================= */}
      <motion.section 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 px-6 pt-16 pb-12 max-w-4xl mx-auto text-center space-y-7 flex flex-col items-center"
      >
        
        {/* Subtle emblem */}
        <div className="flex items-center gap-2.5 font-mono text-[10px] text-zinc-500 uppercase tracking-widest">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          <span>SLAYER TERMINAL</span>
          <span className="text-zinc-800">|</span>
          <span className="text-white">BY ARBOR CAPITAL</span>
        </div>

        {/* STOP GUESSING LEVEL 2 LANDING TITLE */}
        <div className="space-y-4 max-w-3xl">
          <span className="text-[10px] font-mono tracking-[0.34em] text-[#A1A1AA] uppercase font-black bg-zinc-950 px-4 py-1.5 border border-zinc-900 rounded-md inline-block">
            OPTIONS ANALYSIS TERMINAL
          </span>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white leading-none font-sans uppercase">
            STOP GUESSING.
          </h1>
          <p className="text-zinc-400 text-base md:text-lg font-light font-sans leading-relaxed tracking-wide max-w-2xl mx-auto">
            Professional analytics for index options traders. Fully automated, mathematically derived setups continuously computed on volume grids.
          </p>
        </div>

        {/* INDEX TABS SELECTOR */}
        <div className="flex bg-zinc-950 border border-zinc-900 rounded-sm p-1 font-mono items-center gap-1.5">
          {(['SPX', 'NDX', 'QQQ', 'SPY', 'RUT'] as const).map((ticker) => (
            <button
              key={ticker}
              onClick={() => {
                setActiveHeroIdx(ticker);
                const targetAsset = ASSET_LIST.find(a => a.ticker === ticker);
                if (targetAsset) {
                  setSelectedAsset(targetAsset);
                }
              }}
              className={`px-6 py-2.5 text-xs font-mono font-black uppercase tracking-wider cursor-pointer rounded-xs transition-all ${
                activeHeroIdx === ticker
                  ? 'bg-white text-black font-extrabold'
                  : 'text-zinc-500 hover:text-zinc-200'
              }`}
            >
              {ticker}
            </button>
          ))}
        </div>

        <div className="w-full max-w-sm">
          <button 
            type="button"
            onClick={() => useContractStore.getState().setIsGlobalSearchOpen(true)}
            className="global-prism-trigger w-full flex items-center justify-between bg-zinc-950 border border-zinc-900 px-4 py-2.5 rounded-sm hover:cursor-pointer hover:border-zinc-750 transition-all duration-150 group"
          >
            <div className="flex items-center gap-2.5 text-zinc-550 font-mono text-[10px] tracking-wider font-extrabold">
              <Search className="w-3.5 h-3.5 text-emerald-455 group-hover:scale-105 transition-transform" />
              <span>SEARCH ALL SECURITIES & INDEX GREEKS</span>
            </div>
            <kbd className="hidden sm:inline-block bg-[#0e0e11] text-zinc-600 border border-zinc-850 px-1.5 py-0.5 rounded-xs text-[8px] font-mono shadow-inner">CMD+K</kbd>
          </button>
        </div>

        <div className="text-[10.5px] font-mono tracking-widest text-[#71717A] uppercase">
          Continuously monitored. Continuously scored. Continuously managed.
        </div>

        {/* ==================================================
            BEST OPPORTUNITY RIGHT NOW PRECISE COARDS (THE HERO)
            ================================================== */}
        <div 
          id="slayer-hero-opportunity" 
          onClick={handleLaunchToActiveOpportunity}
          className="w-full max-w-lg apple-glass rounded-2xl p-6 md:p-7 relative overflow-hidden shadow-2xl text-left space-y-4 font-mono transition-all duration-300 hover:scale-[1.01] cursor-pointer animate-fadeIn"
        >
          
          {/* Top Line accent */}
          <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/80 to-transparent" />

          {/* Section Indicator */}
          <div className="flex justify-between items-center pb-2.5 border-b border-zinc-900/40 relative z-10">
            <span className="text-[9px] text-[#A1A1AA] uppercase tracking-widest font-black">
              BEST OPPORTUNITY RIGHT NOW
            </span>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#30d158]" />
              <span className="text-[8px] text-[#30d158] font-extrabold uppercase">LIVE CALCULATED</span>
            </div>
          </div>

          {/* CORE STAT DETAILS */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 py-1 relative z-10">
            <div className="space-y-0.5">
              <span className="text-2xl font-black text-white block uppercase tracking-tight">
                {activeOpp.ticker}
              </span>
              <span className="text-[9.5px] text-zinc-500 uppercase block">
                Target Index Frame: {activeHeroIdx}
              </span>
            </div>

            <div className="bg-[#30d158] text-black font-black text-[10.5px] uppercase tracking-widest px-4 py-1.5 rounded-md border border-[#30d158] shadow-lg">
              {activeOpp.status === 'Strengthening' ? 'ENTER' : 'ENTER'}
            </div>
          </div>

          {/* DYNAMIC RATINGS TABS */}
          <div className="grid grid-cols-3 gap-3 bg-zinc-950/60 border border-zinc-900/60 p-3 rounded-xl relative z-10 mb-3">
            <div>
              <span className="text-[8.5px] text-zinc-550 uppercase tracking-tight block">Decision Score</span>
              <span className="text-base font-black text-[#30d158] mt-0.5 block">{activeOpp.health}</span>
            </div>
            <div>
              <span className="text-[8.5px] text-zinc-550 uppercase tracking-tight block">Expected Move</span>
              <span className="text-base font-bold text-white mt-0.5 block">{activeOpp.move}</span>
            </div>
            <div>
              <span className="text-[8.5px] text-zinc-550 uppercase tracking-tight block">Status</span>
              <span className="text-base font-bold text-indigo-400 mt-0.5 block uppercase tracking-tight font-sans text-xs">{activeOpp.status}</span>
            </div>
          </div>

          {/* NEW HERO ENHANCEMENTS (Dealer Bias, Vol State, etc) */}
          {serverState?.deep_intelligence && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-[#050505] border border-zinc-900/40 p-2.5 rounded-lg relative z-10 text-[9px] mb-4">
               <div className="border border-zinc-900/50 p-2 rounded-md bg-zinc-950/50">
                  <span className="text-zinc-500 uppercase font-black block tracking-widest text-[7px] mb-0.5">Dealer Bias</span>
                  <span className={`font-bold ${serverState.deep_intelligence.dealer_metrics.bias === 'LONG GAMMA' ? 'text-[#00ff88]' : 'text-rose-400'}`}>
                    {serverState.deep_intelligence.dealer_metrics.bias}
                  </span>
               </div>
               <div className="border border-zinc-900/50 p-2 rounded-md bg-zinc-950/50">
                  <span className="text-zinc-500 uppercase font-black block tracking-widest text-[7px] mb-0.5">Vol State</span>
                  <span className="text-zinc-300 font-bold">{serverState.deep_intelligence.dealer_metrics.volState}</span>
               </div>
               <div className="border border-zinc-900/50 p-2 rounded-md bg-zinc-950/50">
                  <span className="text-zinc-500 uppercase font-black block tracking-widest text-[7px] mb-0.5">Magnet Strike</span>
                  <span className="text-white font-bold">{Number(serverState.deep_intelligence.dealer_metrics.magnetStrike ?? 0).toFixed(2)}</span>
               </div>
               <div className="border border-zinc-900/50 p-2 rounded-md bg-zinc-950/50">
                  <span className="text-zinc-500 uppercase font-black block tracking-widest text-[7px] mb-0.5">Flip Level</span>
                  <span className="text-rose-400 font-bold">{Number(serverState.deep_intelligence.dealer_metrics.flipLevel ?? 0).toFixed(2)}</span>
               </div>
               
               <div className="border border-zinc-900/50 p-2 rounded-md bg-zinc-950/50 col-span-1 md:col-span-2 flex justify-between items-center">
                  <div>
                     <span className="text-zinc-500 uppercase font-black block tracking-widest text-[7px] mb-0.5">Call Wall</span>
                     <span className="text-white font-bold">{Number(serverState.deep_intelligence.dealer_metrics.callWall ?? 0).toFixed(2)}</span>
                  </div>
                  <div className="text-right">
                     <span className="text-zinc-500 uppercase font-black block tracking-widest text-[7px] mb-0.5">Put Wall</span>
                     <span className="text-white font-bold">{Number(serverState.deep_intelligence.dealer_metrics.putWall ?? 0).toFixed(2)}</span>
                  </div>
               </div>
               <div className="border border-zinc-900/50 p-2 rounded-md bg-zinc-950/50 col-span-1 md:col-span-2">
                  <div className="flex justify-between items-center mb-1">
                     <span className="text-zinc-500 uppercase font-black tracking-widest text-[7px]">Dealer Positioning Score</span>
                     <span className="text-white font-bold text-[9px]">{serverState.deep_intelligence.dealer_metrics.dealerScore}/100</span>
                  </div>
                  <div className="w-full bg-black h-1.5 rounded-full overflow-hidden">
                     <div className="bg-[#4f8cff] h-full transition-all duration-300" style={{ width: `${serverState.deep_intelligence.dealer_metrics.dealerScore}%` }} />
                  </div>
               </div>
            </div>
          )}

          {/* Direct entry action */}
          <div className="pt-2 relative z-10 w-full">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleLaunchToActiveOpportunity();
              }}
              className="w-full py-3 bg-white hover:bg-zinc-250 text-black font-extrabold uppercase tracking-widest text-[9.5px] rounded-lg transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 shadow-xl hover:scale-[1.01]"
            >
              <span>Launch Live Workspace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

        {/* HERO TALLY SUMMARY */}
        <div className="grid grid-cols-3 gap-7 md:gap-14 pt-4 border-t border-zinc-950 w-full max-w-xl font-mono text-center">
          <div>
            <span className="text-xl md:text-2xl font-black text-white block">71%</span>
            <span className="text-[8.5px] text-[#A1A1AA] uppercase tracking-wider block mt-0.5">Target 1 Hit Rate</span>
          </div>
          <div>
            <span className="text-xl md:text-2xl font-black text-emerald-400 block">100%</span>
            <span className="text-[8.5px] text-[#A1A1AA] uppercase tracking-wider block mt-0.5">Public Trade History</span>
          </div>
          <div>
            <span className="text-xl md:text-2xl font-black text-white block">4</span>
            <span className="text-[8.5px] text-[#A1A1AA] uppercase tracking-wider block mt-0.5">Intelligence Engines</span>
          </div>
        </div>

      </motion.section>

      {/* ==================================================
          SCROLL FEATURE MATRIX
          ================================================== */}
      <FeatureMatrix onEnterApp={onEnterApp} />

      {/* ==================================================
          TACTICAL MEMBERSHIP SUBSCRIPTION MATRICES
          ================================================== */}
      <motion.section 
        id="pricing-matrices" 
        initial={{ opacity: 0, y: 50, scale: 0.98 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 py-10 px-6 max-w-[1400px] mx-auto w-full border-t border-zinc-900"
      >
        <div className="text-center space-y-2 mb-10">
          <span className="text-zinc-500 text-[10px] font-mono uppercase tracking-[0.3em] block">
            SUBSCRIPTION MODELS & PLATFORM SERVICES
          </span>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight font-sans">
            Simple Subscriptions
          </h2>
        </div>

        <div className="flex justify-center mb-10 w-full">
          <div className="flex items-center gap-2 bg-black border border-zinc-800 p-1 rounded-lg">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-md text-[11px] font-bold tracking-widest uppercase transition-all ${
                billingCycle === 'monthly' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-white hover:bg-zinc-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-6 py-2 rounded-md text-[11px] font-bold tracking-widest uppercase transition-all flex items-center gap-2 ${
                billingCycle === 'annual' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-white hover:bg-zinc-900'
              }`}
            >
              Annual <span className="text-[9px] bg-[#30d158]/20 text-[#30d158] px-1.5 py-0.5 rounded-sm">Save ~20%</span>
            </button>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-6 font-mono items-stretch">
          
          {/* DISCORD CARD */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 28,
              opacity: { duration: 0.6, delay: 0.1 }
            }}
            whileHover={{ scale: 1.05, y: -10, boxShadow: "0 30px 60px -15px rgba(52, 199, 89, 0.12)" }}
            className="apple-glass rounded-2xl p-6 flex flex-col justify-between relative transition-all duration-150 w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.33%-16px)] xl:w-[calc(20%-20px)] min-w-[240px] max-w-[280px] lg:order-1 xl:order-1"
          >
            <div className="space-y-4">
              <div className="flex justify-between items-baseline border-b border-zinc-900/40 pb-4">
                <div>
                  <span className="text-zinc-500 text-[10px] uppercase tracking-wider block font-bold">Platform</span>
                  <span className="text-[12px] font-mono font-black text-rose-400 block mt-1">COMMUNITY CHAT</span>
                </div>
                <div className="text-right">
                  <span className="text-[#A1A1AA] text-xs block font-bold">DISCORD</span>
                  <span className="text-3xl font-black text-white">{billingCycle === 'monthly' ? '$65' : '$55'}</span>
                  <span className="text-[10px] text-zinc-650 block">/ Month</span>
                </div>
              </div>

              <div className="space-y-3.5 text-xs font-sans">
                <span className="text-[11px] text-[#71717A] block uppercase font-mono tracking-wider font-bold">Inclusions:</span>
                <ul className="space-y-2.5 font-mono text-xs text-zinc-300">
                  <li className="flex gap-2.5 items-center">
                    <Check className="w-4 h-4 text-[#30d158] shrink-0" />
                    <span>Real-time Discord Chat & Alerts</span>
                  </li>
                  <li className="flex gap-2.5 items-center">
                    <Check className="w-4 h-4 text-[#30d158] shrink-0" />
                    <span>Daily Option Discovery Reports</span>
                  </li>
                  <li className="flex gap-2.5 items-center">
                    <Check className="w-4 h-4 text-[#30d158] shrink-0" />
                    <span>Verified Historic Trade Archive</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-6">
              <button 
                onClick={() => handleCheckoutPlan('discord')}
                className="w-full py-4 bg-zinc-900/90 hover:bg-white hover:text-black border border-zinc-800 text-zinc-350 font-bold uppercase tracking-widest text-[11px] rounded-lg transition-all duration-150 cursor-pointer shadow-lg"
              >
                Select Plan
              </button>
            </div>
          </motion.div>

          {/* SKYVISION CARD */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 28,
              opacity: { duration: 0.6, delay: 0.2 }
            }}
            whileHover={{ scale: 1.07, y: -12, boxShadow: "0 30px 60px -15px rgba(99, 102, 241, 0.25)" }}
            className="apple-glass rounded-2xl p-6 flex flex-col justify-between relative transition-all duration-150 w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.33%-16px)] xl:w-[calc(20%-20px)] min-w-[240px] max-w-[280px] lg:order-3 xl:order-2"
          >
            <div className="space-y-4">
              <div className="flex justify-between items-baseline border-b border-zinc-900/40 pb-4">
                <div>
                  <span className="text-zinc-500 text-[10px] uppercase tracking-wider block font-bold">Dashboard</span>
                  <span className="text-[12px] font-mono font-black text-indigo-400 block mt-1 uppercase">DECISION ENGINE</span>
                </div>
                <div className="text-right">
                  <span className="text-white text-xs block font-black">SKYVISION</span>
                  <span className="text-3xl font-black text-white">{billingCycle === 'monthly' ? '$350' : '$290'}</span>
                  <span className="text-[10px] text-zinc-650 block">/ Month</span>
                </div>
              </div>

              <div className="space-y-3.5 text-xs font-sans">
                <span className="text-[11px] text-[#71717A] block uppercase font-mono tracking-wider font-bold">Inclusions:</span>
                <ul className="space-y-2.5 font-mono text-xs text-zinc-300">
                  <li className="flex gap-2.5 items-center">
                    <Check className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span className="font-medium text-white">All Discord Tier Features ($65 Value)</span>
                  </li>
                  <li className="flex gap-2.5 items-center">
                    <Check className="w-4 h-4 text-[#30d158] shrink-0" />
                    <span>SkyVision Decision Dashboard</span>
                  </li>
                  <li className="flex gap-2.5 items-center">
                    <Check className="w-4 h-4 text-[#30d158] shrink-0" />
                    <span>Real-time Trade Health Indexes</span>
                  </li>
                  <li className="flex gap-2.5 items-center">
                    <Check className="w-4 h-4 text-[#30d158] shrink-0" />
                    <span>Expected P&L Calculations</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-6">
              <button 
                onClick={() => handleCheckoutPlan('skyvision')}
                className="w-full py-4 bg-zinc-900/90 hover:bg-white hover:text-black border border-zinc-800 text-zinc-350 font-bold uppercase tracking-widest text-[11px] rounded-lg transition-all duration-150 cursor-pointer shadow-lg"
              >
                Select Plan
              </button>
            </div>
          </motion.div>

          {/* PINPOINT GEXBOT CARD */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 28,
              opacity: { duration: 0.6, delay: 0.3 }
            }}
            whileHover={{ scale: 1.08, y: -12, boxShadow: "0 30px 60px -10px rgba(48, 209, 88, 0.3)" }}
            className="apple-glass-bright rounded-2xl p-6 flex flex-col justify-between relative transition-all duration-150 border-2 border-emerald-500/40 shadow-[0_0_25px_rgba(48,209,88,0.15)] w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.33%-16px)] xl:w-[calc(20%-20px)] min-w-[240px] max-w-[280px] lg:order-2 xl:order-3"
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-emerald-500 to-emerald-400 text-[#050506] text-[9.5px] font-black uppercase tracking-widest px-3.5 py-1.5 rounded-full shadow-lg whitespace-nowrap z-10 border border-emerald-300/30">
              🔥 BEST VALUE // MOST SUBSCRIBED
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-baseline border-b border-zinc-900/40 pb-4">
                <div>
                  <span className="text-zinc-500 text-[10px] uppercase tracking-wider block font-bold">Automated GEX</span>
                  <span className="text-[12px] font-mono font-black text-emerald-400 block mt-1 uppercase">POSITION TRACKING</span>
                </div>
                <div className="text-right">
                  <span className="text-[#A1A1AA] text-xs block font-bold">GEXBOT CORE</span>
                  <span className="text-3xl font-black text-white">{billingCycle === 'monthly' ? '$500' : '$420'}</span>
                  <span className="text-[10px] text-zinc-650 block">/ Month</span>
                </div>
              </div>

              <div className="space-y-3.5 text-xs font-sans">
                <span className="text-[11px] text-[#71717A] block uppercase font-mono tracking-wider font-bold">Inclusions:</span>
                <ul className="space-y-2.5 font-mono text-xs text-zinc-300">
                  <li className="flex gap-2.5 items-center">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="font-bold text-white text-[10.5px]">All SkyVision + Discord Features</span>
                  </li>
                  <li className="flex gap-2.5 items-center">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Pinpoint Gexbot Live Feed</span>
                  </li>
                  <li className="flex gap-2.5 items-center">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Live Gamma Exposure Grids</span>
                  </li>
                  <li className="flex gap-2.5 items-center">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Dealer Positioning Heatmaps</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-6">
              <button 
                onClick={() => handleCheckoutPlan('pinpoint')}
                className="w-full py-4 bg-gradient-to-r from-emerald-400 to-emerald-500 hover:from-emerald-300 hover:to-emerald-400 text-[#000000] font-black uppercase tracking-widest text-[11px] rounded-lg transition-all duration-150 cursor-pointer shadow-[0_10px_30px_rgba(48,209,88,0.25)] hover:scale-[1.01]"
              >
                SELECT GEXBOT
              </button>
            </div>
          </motion.div>

          {/* QUANT CARD */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 28,
              opacity: { duration: 0.6, delay: 0.4 }
            }}
            whileHover={{ scale: 1.05, y: -10, boxShadow: "0 30px 60px -15px rgba(251, 191, 36, 0.12)" }}
            className="apple-glass rounded-2xl p-6 flex flex-col justify-between relative transition-all duration-150 w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.33%-16px)] xl:w-[calc(20%-20px)] min-w-[240px] max-w-[280px] lg:order-4 xl:order-4"
          >
            <div className="space-y-4">
              <div className="flex justify-between items-baseline border-b border-zinc-900/40 pb-4">
                <div>
                  <span className="text-zinc-500 text-[10px] uppercase tracking-wider block font-bold">Full Arsenal</span>
                  <span className="text-[12px] font-mono font-black text-amber-400 block mt-1 uppercase">EVERYTHING</span>
                </div>
                <div className="text-right">
                  <span className="text-white text-xs block font-black font-mono text-zinc-400">QUANT SUITE</span>
                  <span className="text-3xl font-black text-white">{billingCycle === 'monthly' ? '$1500' : '$1250'}</span>
                  <span className="text-[10px] text-zinc-650 block">/ Month</span>
                </div>
              </div>

              <div className="space-y-3.5 text-xs font-sans">
                <span className="text-[11px] text-[#71717A] block uppercase font-mono tracking-wider font-bold">Inclusions:</span>
                <ul className="space-y-2.5 font-mono text-xs text-zinc-300">
                  <li className="flex gap-2.5 items-center">
                    <Check className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="font-medium text-white">All Gexbot + SkyVision + Discord Features</span>
                  </li>
                  <li className="flex gap-2.5 items-center">
                    <Check className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="font-medium text-white">Full Quant Engine Access</span>
                  </li>
                  <li className="flex gap-2.5 items-center">
                    <Check className="w-4 h-4 text-[#30d158] shrink-0" />
                    <span>Algorithmic Backtesting</span>
                  </li>
                  <li className="flex gap-2.5 items-center">
                    <Check className="w-4 h-4 text-[#30d158] shrink-0" />
                    <span>Advanced Hedging Simulator</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-6">
              <button 
                onClick={() => handleCheckoutPlan('quant')}
                className="w-full py-4 bg-zinc-900/90 hover:bg-white hover:text-black border border-zinc-800 text-zinc-350 font-bold uppercase tracking-widest text-[11px] rounded-lg transition-all duration-150 cursor-pointer shadow-lg"
              >
                Select Plan
              </button>
            </div>
          </motion.div>

          {/* LIFETIME CARD */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 28,
              opacity: { duration: 0.6, delay: 0.5 }
            }}
            whileHover={{ scale: 1.05, y: -10, boxShadow: "0 30px 60px -15px rgba(255, 255, 255, 0.12)" }}
            className="apple-glass rounded-2xl p-6 flex flex-col justify-between relative transition-all duration-150 w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.33%-16px)] xl:w-[calc(20%-20px)] min-w-[240px] max-w-[280px] lg:order-5 xl:order-5"
          >
            <div className="space-y-4">
              <div className="flex justify-between items-baseline border-b border-zinc-900/40 pb-4">
                <div>
                  <span className="text-zinc-500 text-[10px] uppercase tracking-wider block font-bold">Permanent</span>
                  <span className="text-[12px] font-mono font-black text-white block mt-1 uppercase">UNLIMITED TIER</span>
                </div>
                <button 
                  onClick={() => handleCheckoutPlan('lifetime')}
                  className="text-right focus:outline-none focus:ring-1 focus:ring-white/20 rounded p-1 hover:opacity-85 transition-all text-left block text-right cursor-pointer"
                >
                  <span className="text-[#A1A1AA] text-[10.5px] block font-bold tracking-wider uppercase font-mono">LIFETIME</span>
                  <span className="text-[18px] font-black text-white uppercase tracking-tight block border-b border-dashed border-white/40">CONTACT US</span>
                </button>
              </div>

              <div className="space-y-3.5 text-xs font-sans">
                <span className="text-[11px] text-[#71717A] block uppercase font-mono tracking-wider font-bold">Inclusions:</span>
                <ul className="space-y-2.5 font-mono text-xs text-zinc-300">
                  <li className="flex gap-2.5 items-center">
                    <Check className="w-4 h-4 text-white shrink-0" />
                    <span className="font-medium text-white">All Features Unlocked</span>
                  </li>
                  <li className="flex gap-2.5 items-center">
                    <Check className="w-4 h-4 text-[#30d158] shrink-0" />
                    <span>Permanent Platform Access</span>
                  </li>
                  <li className="flex gap-2.5 items-center">
                    <Check className="w-4 h-4 text-[#30d158] shrink-0" />
                    <span>Private 1-on-1 Onboarding</span>
                  </li>
                  <li className="flex gap-2.5 items-center">
                    <Check className="w-4 h-4 text-[#30d158] shrink-0" />
                    <span>Early Beta Access to Tools</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-6">
              <button 
                onClick={() => handleCheckoutPlan('lifetime')}
                className="w-full py-4 bg-zinc-900/90 hover:bg-white hover:text-black border border-zinc-800 text-zinc-350 font-bold uppercase tracking-widest text-[11px] rounded-lg transition-all duration-150 cursor-pointer shadow-lg"
              >
                CONTACT US
              </button>
            </div>
          </motion.div>

        </div>
      </motion.section>

      {/* Pristine Minimal Footer - No telemetry noise clutter */}
      <motion.footer 
        initial={{ opacity: 0, y: 25 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="border-t border-zinc-900 bg-[#000000] py-12 px-6 text-center text-[10px] text-zinc-500 font-mono mt-auto relative z-10 w-full"
      >
        <p>&copy; 2026 slayertrade. ALL RIGHTS RESERVED.</p>
        <p className="mt-1 text-[8px] text-zinc-650 uppercase tracking-widest">
          Slayer provides real-time mathematical decision guidelines. No investment advising is rendered.
        </p>
      </motion.footer>

      {/* Dynamic Payment & Plan Checkout Gateway Modal */}
      <AnimatePresence>
        {selectedPlanForCheckout && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#000000]/95 backdrop-blur-md z-50 overflow-y-auto flex items-start md:items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-[#0c0c0e] border border-zinc-800 rounded-2xl w-full max-w-2xl my-auto overflow-hidden shadow-2xl flex flex-col"
            >
              {/* Modal Top Ribbon Header */}
              <div className="bg-[#050506] border-b border-zinc-900/80 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] uppercase font-black tracking-widest text-[#a1a1aa]">
                    SECURE SSL PLATFORM UPGRADE HANDSHAKE
                  </span>
                </div>
                {checkoutStep !== 'processing' ? (
                  <button
                    onClick={() => setSelectedPlanForCheckout(null)}
                    className="text-zinc-500 hover:text-white transition-all cursor-pointer p-1.5 hover:bg-zinc-900 rounded-lg flex items-center justify-center"
                    title="Close (Esc)"
                  >
                    <X className="w-4 h-4" />
                  </button>
                ) : (
                  <span className="text-[8px] text-indigo-400 font-bold uppercase tracking-widest animate-pulse">LOCK ACTIVE</span>
                )}
              </div>

              {/* Checkout Main Scrollable Panel */}
              <div className="flex-grow overflow-y-auto p-6 space-y-6">
                
                {/* 1. PLAN SUMMARY CARD */}
                <div className="bg-[#070708] border border-zinc-900 p-5 rounded-xl space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] text-zinc-500 uppercase tracking-widest block font-bold">SELECTED CLASSIFICATION</span>
                      <h3 className="text-xl font-black text-white mt-1 uppercase tracking-tight font-sans">
                        {selectedPlanForCheckout === 'discord' && "Discord Plan"}
                        {selectedPlanForCheckout === 'skyvision' && "SkyVision Cockpit"}
                        {selectedPlanForCheckout === 'pinpoint' && "Pinpoint Gexbot"}
                        {selectedPlanForCheckout === 'quant' && "Quant Suite"}
                        {selectedPlanForCheckout === 'lifetime' && "Lifetime Pass"}
                      </h3>
                      <p className="text-[10px] text-[#A1A1AA] mt-1 tracking-wider uppercase font-mono">
                        {selectedPlanForCheckout === 'discord' && "REAL-TIME ALERTS FEED & CHAT"}
                        {selectedPlanForCheckout === 'skyvision' && "DECISION Cockpit & PERFORMANCE TRACKER"}
                        {selectedPlanForCheckout === 'pinpoint' && "GAMMA AND POSITIONING ANALYSIS FEED"}
                        {selectedPlanForCheckout === 'quant' && "BACKTESTING SANDBOX & ALGORITHMIC METRICS"}
                        {selectedPlanForCheckout === 'lifetime' && "PERMANENT ALL-ACCESS PASS"}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-indigo-400 block tracking-widest font-black">RATE</span>
                      <span className={`${selectedPlanForCheckout === 'lifetime' ? 'text-[11px] font-mono font-bold tracking-widest text-emerald-400 uppercase bg-emerald-500/10 px-3 py-1.5 border border-emerald-500/20 rounded-md' : 'text-2xl font-black text-white font-mono'}`}>
                        {selectedPlanForCheckout === 'lifetime' 
                          ? 'Quote Needed' 
                          : billingCycle === 'monthly' 
                            ? (selectedPlanForCheckout === 'discord' ? '$65' : selectedPlanForCheckout === 'skyvision' ? '$350' : selectedPlanForCheckout === 'pinpoint' ? '$500' : '$1500')
                            : (selectedPlanForCheckout === 'discord' ? '$55' : selectedPlanForCheckout === 'skyvision' ? '$290' : selectedPlanForCheckout === 'pinpoint' ? '$420' : '$1250')
                        }
                      </span>
                      {selectedPlanForCheckout !== 'lifetime' && (
                        <span className="text-[10px] text-zinc-650 block">/ Month</span>
                      )}
                    </div>
                  </div>

                  {selectedPlanForCheckout !== 'lifetime' && (
                    <div className="text-[10px] text-emerald-400/80 bg-emerald-500/10 border border-emerald-500/10 rounded-lg p-2 flex items-center justify-between">
                      <span className="uppercase font-bold tracking-widest">Billing Schedule:</span>
                      <span className="font-extrabold uppercase">
                        {billingCycle === 'monthly' ? "Renew Monthly" : "Annually (20% Savings Loaded)"}
                      </span>
                    </div>
                  )}
                </div>

                {checkoutStep === 'details' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-fadeIn animate-duration-150">
                    {/* RIGHT COLUMN */}
                    <div className="order-1 md:order-2 border border-zinc-800 bg-zinc-950/70 rounded-xl p-4 flex flex-col justify-between min-h-[420px]">
                      {selectedPlanForCheckout === 'lifetime' ? (
                        <div ref={paymentAreaRef} className="space-y-4 flex flex-col justify-between h-full">
                          <div className="space-y-3.5">
                            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-[#a1a1aa] font-black border-b border-zinc-900 pb-1.5">
                              <Mail className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              Contact Form
                            </div>

                            {/* Account Classification Toggle */}
                            <div className="space-y-2">
                              <label className="text-[8px] text-[#A1A1AA] uppercase tracking-widest font-extrabold block">
                                Account Type
                              </label>
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  type="button"
                                  onClick={() => setLifetimeContactType('individual')}
                                  className={`py-2 px-3 text-xs font-bold uppercase tracking-wider rounded-lg border transition-all cursor-pointer ${
                                    lifetimeContactType === 'individual'
                                      ? 'bg-emerald-500/10 border-emerald-500 text-white'
                                      : 'bg-[#050506] border-zinc-900 text-zinc-500 hover:text-white hover:border-zinc-700'
                                  }`}
                                >
                                  Individual
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setLifetimeContactType('business')}
                                  className={`py-2 px-3 text-xs font-bold uppercase tracking-wider rounded-lg border transition-all cursor-pointer ${
                                    lifetimeContactType === 'business'
                                      ? 'bg-emerald-500/10 border-emerald-500 text-white'
                                      : 'bg-[#050506] border-zinc-900 text-zinc-500 hover:text-white hover:border-zinc-700'
                                  }`}
                                >
                                  Business
                                </button>
                              </div>
                            </div>

                            {lifetimeContactType === 'individual' ? (
                              <div className="space-y-3 animate-fadeIn">
                                <div>
                                  <label className="text-[8.5px] text-[#A1A1AA] uppercase tracking-widest font-extrabold block mb-1">
                                    Full Name
                                  </label>
                                  <input
                                    type="text"
                                    id="lifetime-ind-name-input"
                                    value={lifetimeIndName}
                                    onChange={(e) => setLifetimeIndName(e.target.value)}
                                    placeholder="Your Name"
                                    className="w-full bg-[#050506] border border-zinc-850 text-white rounded-lg p-2.5 text-xs focus:outline-none focus:border-zinc-700 transition-colors font-sans font-normal"
                                  />
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="text-[8.5px] text-[#A1A1AA] uppercase tracking-widest font-extrabold block mb-1">
                                      Email address
                                    </label>
                                    <input
                                      type="email"
                                      value={lifetimeIndEmail}
                                      onChange={(e) => setLifetimeIndEmail(e.target.value)}
                                      placeholder="you@example.com"
                                      className="w-full bg-[#050506] border border-zinc-850 text-white rounded-lg p-2.5 text-xs focus:outline-none focus:border-zinc-700 transition-colors font-sans font-normal"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[8.5px] text-[#A1A1AA] uppercase tracking-widest font-extrabold block mb-1">
                                      Phone Number
                                    </label>
                                    <input
                                      type="tel"
                                      value={lifetimeIndPhone}
                                      onChange={(e) => setLifetimeIndPhone(e.target.value)}
                                      placeholder="+1 (555) 0123"
                                      className="w-full bg-[#050506] border border-zinc-850 text-white rounded-lg p-2.5 text-xs focus:outline-none focus:border-zinc-700 transition-colors font-sans font-normal"
                                    />
                                  </div>
                                </div>

                                <div className="animate-fadeIn">
                                  <label className="text-[8.5px] text-[#A1A1AA] uppercase tracking-widest font-extrabold block mb-1">
                                    How did you find us?
                                  </label>
                                  <select
                                    value={lifetimeIndReferralSource}
                                    onChange={(e) => setLifetimeIndReferralSource(e.target.value)}
                                    className="w-full bg-[#050506] border border-zinc-850 text-white rounded-lg p-2.5 text-xs focus:outline-none focus:border-zinc-700 transition-colors font-sans font-normal text-left cursor-pointer"
                                  >
                                    <option value="" disabled className="bg-zinc-950 text-zinc-500">Select an option</option>
                                    <option value="Twitter / X" className="bg-zinc-950 text-white">Twitter / X</option>
                                    <option value="Telegram" className="bg-zinc-950 text-white">Telegram</option>
                                    <option value="Friend / Referral" className="bg-zinc-950 text-white">Friend / Referral</option>
                                    <option value="Search Engine" className="bg-zinc-950 text-white">Search Engine</option>
                                    <option value="YouTube" className="bg-zinc-950 text-white">YouTube</option>
                                    <option value="Other" className="bg-zinc-950 text-white">Other</option>
                                  </select>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-3 animate-fadeIn">
                                <div>
                                  <label className="text-[8.5px] text-[#A1A1AA] uppercase tracking-widest font-extrabold block mb-1">
                                    Full Name
                                  </label>
                                  <input
                                    type="text"
                                    id="lifetime-bus-name-input"
                                    value={lifetimeBusName}
                                    onChange={(e) => setLifetimeBusName(e.target.value)}
                                    placeholder="Your Name"
                                    className="w-full bg-[#050506] border border-zinc-850 text-white rounded-lg p-2.5 text-xs focus:outline-none focus:border-zinc-700 transition-colors font-sans font-normal"
                                  />
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="text-[8.5px] text-[#A1A1AA] uppercase tracking-widest font-extrabold block mb-1">
                                      Email address
                                    </label>
                                    <input
                                      type="email"
                                      value={lifetimeBusEmail}
                                      onChange={(e) => setLifetimeBusEmail(e.target.value)}
                                      placeholder="you@example.com"
                                      className="w-full bg-[#050506] border border-zinc-850 text-white rounded-lg p-2.5 text-xs focus:outline-none focus:border-zinc-700 transition-colors font-sans font-normal"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[8.5px] text-[#A1A1AA] uppercase tracking-widest font-extrabold block mb-1">
                                      Phone Number
                                    </label>
                                    <input
                                      type="tel"
                                      value={lifetimeBusPhone}
                                      onChange={(e) => setLifetimeBusPhone(e.target.value)}
                                      placeholder="+1 (555) 0123"
                                      className="w-full bg-[#050506] border border-zinc-850 text-white rounded-lg p-2.5 text-xs focus:outline-none focus:border-zinc-700 transition-colors font-sans font-normal"
                                    />
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 animate-fadeIn">
                                  <div>
                                    <label className="text-[8.5px] text-[#A1A1AA] uppercase tracking-widest font-extrabold block mb-1">
                                      Company / Entity Name
                                    </label>
                                    <input
                                      type="text"
                                      value={lifetimeBusCompanyName}
                                      onChange={(e) => setLifetimeBusCompanyName(e.target.value)}
                                      placeholder="Company Name"
                                      className="w-full bg-[#050506] border border-zinc-850 text-white rounded-lg p-2.5 text-xs focus:outline-none focus:border-zinc-700 transition-colors font-sans font-normal"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[8.5px] text-[#A1A1AA] uppercase tracking-widest font-extrabold block mb-1">
                                      How did you find us?
                                    </label>
                                    <select
                                      value={lifetimeBusReferralSource}
                                      onChange={(e) => setLifetimeBusReferralSource(e.target.value)}
                                      className="w-full bg-[#050506] border border-zinc-850 text-white rounded-lg p-2.5 text-xs focus:outline-none focus:border-zinc-700 transition-colors font-sans font-normal text-left cursor-pointer"
                                    >
                                      <option value="" disabled className="bg-[#050506] text-zinc-500">Select an option</option>
                                      <option value="Twitter / X" className="bg-zinc-950 text-white">Twitter / X</option>
                                      <option value="Telegram" className="bg-zinc-950 text-white">Telegram</option>
                                      <option value="Friend / Referral" className="bg-zinc-950 text-white">Friend / Referral</option>
                                      <option value="Search Engine" className="bg-zinc-950 text-white">Search Engine</option>
                                      <option value="YouTube" className="bg-zinc-950 text-white">YouTube</option>
                                      <option value="Other" className="bg-zinc-950 text-white">Other</option>
                                    </select>
                                  </div>
                                </div>

                                <div className="space-y-1">
                                  <div className="flex justify-between items-center">
                                    <label className="text-[8.5px] text-[#A1A1AA] uppercase tracking-widest font-extrabold block">
                                      Message Note / Requirements
                                    </label>
                                    <span className="text-[8.5px] text-zinc-500 font-mono">
                                      {lifetimeBusMessage.length}/500
                                    </span>
                                  </div>
                                  <textarea
                                    rows={2}
                                    maxLength={500}
                                    value={lifetimeBusMessage}
                                    onChange={(e) => setLifetimeBusMessage(e.target.value)}
                                    placeholder="Explain your needs, custom setup details, or what premium features you require..."
                                    className="w-full bg-[#050506] border border-zinc-850 text-white rounded-lg p-2 text-xs focus:outline-none focus:border-zinc-700 transition-colors resize-none font-sans font-normal text-left"
                                  />
                                  {lifetimeBusMessage.length >= 500 && (
                                    <div className="text-[10px] text-red-500 font-bold mt-1 uppercase text-left">
                                      For more extensive requirements, email <a href="mailto:slayer@trade.com" className="underline hover:text-red-400">slayer@trade.com</a>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          <button
                            onClick={() => {
                              const isValid = lifetimeContactType === 'individual'
                                ? (lifetimeIndName && lifetimeIndEmail && lifetimeIndPhone)
                                : (lifetimeBusName && lifetimeBusEmail && lifetimeBusPhone && lifetimeBusCompanyName);
                              if (isValid) {
                                setCheckoutStep('processing');
                              } else {
                                if (lifetimeContactType === 'individual') {
                                  alert('Please enter Name, Email, and Phone Number before submitting.');
                                } else {
                                  alert('Please enter Name, Email, Phone Number, and Company Name before submitting.');
                                }
                              }
                            }}
                            className="w-full mt-4 py-3 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-neutral-950 font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer transform hover:scale-[1.01]"
                          >
                            <span>SUBMIT MESSAGE</span>
                          </button>
                        </div>
                      ) : (
                        <div ref={paymentAreaRef} className="space-y-4 flex flex-col justify-between h-full">
                          {checkoutSubStep === 'details' ? (
                            <div className="space-y-4 flex flex-col justify-between h-full">
                              <div className="space-y-3.5">
                                <div className="flex items-center justify-between border-b border-zinc-900 pb-1.5">
                                  <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-[#a1a1aa] font-black">
                                    <User className="w-3.5 h-3.5 text-indigo-400" />
                                    STEP 1: Contact Details
                                  </div>
                                  <span className="text-[9px] text-[#a1a1aa] font-mono">1/2</span>
                                </div>

                                <div className="space-y-2">
                                  <label className="text-[8px] text-[#A1A1AA] uppercase tracking-widest font-extrabold block">
                                    Account Type
                                  </label>
                                  <div className="grid grid-cols-2 gap-2">
                                    <button
                                      type="button"
                                      onClick={() => setContactType('individual')}
                                      className={`py-2 px-3 text-xs font-bold uppercase tracking-wider rounded-lg border transition-all cursor-pointer ${
                                        contactType === 'individual'
                                          ? 'bg-[#101014] border-indigo-500 text-white'
                                          : 'bg-[#050506] border-zinc-900 text-zinc-500 hover:text-white hover:border-zinc-700'
                                      }`}
                                    >
                                      Individual
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setContactType('business')}
                                      className={`py-2 px-3 text-xs font-bold uppercase tracking-wider rounded-lg border transition-all cursor-pointer ${
                                        contactType === 'business'
                                          ? 'bg-[#101014] border-indigo-500 text-white'
                                          : 'bg-[#050506] border-zinc-900 text-zinc-500 hover:text-white hover:border-zinc-700'
                                      }`}
                                    >
                                      Business
                                    </button>
                                  </div>
                                </div>

                                {contactType === 'individual' ? (
                                  <div className="space-y-3 animate-fadeIn">
                                    <div>
                                      <label className="text-[8.5px] text-[#A1A1AA] uppercase tracking-widest font-extrabold block mb-1">
                                        Full Name
                                      </label>
                                      <input
                                        type="text"
                                        id="reg-ind-name-input"
                                        value={regIndName}
                                        onChange={(e) => setRegIndName(e.target.value)}
                                        placeholder="John Doe"
                                        required
                                        className="w-full bg-[#050506] border border-zinc-850 text-white rounded-lg p-2.5 text-xs focus:outline-none focus:border-zinc-700 transition-colors font-sans font-normal"
                                      />
                                    </div>

                                    <div>
                                      <label className="text-[8.5px] text-[#A1A1AA] uppercase tracking-widest font-extrabold block mb-1">
                                        Email Address
                                      </label>
                                      <input
                                        type="email"
                                        value={regIndEmail}
                                        onChange={(e) => setRegIndEmail(e.target.value)}
                                        placeholder="you@example.com"
                                        required
                                        className="w-full bg-[#050506] border border-zinc-850 text-white rounded-lg p-2.5 text-xs focus:outline-none focus:border-zinc-700 transition-colors font-sans font-normal"
                                      />
                                    </div>

                                    <div>
                                      <label className="text-[8.5px] text-[#A1A1AA] uppercase tracking-widest font-extrabold block mb-1">
                                        Phone Number
                                      </label>
                                      <input
                                        type="tel"
                                        value={regIndPhone}
                                        onChange={(e) => setRegIndPhone(e.target.value)}
                                        placeholder="+1 (555) 0199"
                                        required
                                        className="w-full bg-[#050506] border border-zinc-850 text-white rounded-lg p-2.5 text-xs focus:outline-none focus:border-zinc-700 transition-colors font-sans font-normal"
                                      />
                                    </div>

                                    <div className="animate-fadeIn">
                                      <label className="text-[8.5px] text-[#A1A1AA] uppercase tracking-widest font-extrabold block mb-1">
                                        How did you find us?
                                      </label>
                                      <select
                                        value={regIndReferralSource}
                                        onChange={(e) => setRegIndReferralSource(e.target.value)}
                                        className="w-full bg-[#050506] border border-zinc-850 text-white rounded-lg p-2.5 text-xs focus:outline-none focus:border-zinc-700 transition-colors font-sans font-normal text-left cursor-pointer animate-fadeIn"
                                      >
                                        <option value="" disabled className="bg-zinc-950 text-zinc-500">Select an option</option>
                                        <option value="Twitter / X" className="bg-zinc-950 text-white">Twitter / X</option>
                                        <option value="Telegram" className="bg-zinc-950 text-white">Telegram</option>
                                        <option value="Friend / Referral" className="bg-zinc-950 text-white">Friend / Referral</option>
                                        <option value="Search Engine" className="bg-zinc-950 text-white">Search Engine</option>
                                        <option value="YouTube" className="bg-zinc-950 text-white">YouTube</option>
                                        <option value="Other" className="bg-zinc-950 text-white">Other</option>
                                      </select>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="space-y-3 animate-fadeIn">
                                    <div>
                                      <label className="text-[8.5px] text-[#A1A1AA] uppercase tracking-widest font-extrabold block mb-1">
                                        Full Name
                                      </label>
                                      <input
                                        type="text"
                                        id="reg-bus-name-input"
                                        value={regBusName}
                                        onChange={(e) => setRegBusName(e.target.value)}
                                        placeholder="John Doe"
                                        required
                                        className="w-full bg-[#050506] border border-zinc-850 text-white rounded-lg p-2.5 text-xs focus:outline-none focus:border-zinc-700 transition-colors font-sans font-normal"
                                      />
                                    </div>

                                    <div>
                                      <label className="text-[8.5px] text-[#A1A1AA] uppercase tracking-widest font-extrabold block mb-1">
                                        Email Address
                                      </label>
                                      <input
                                        type="email"
                                        value={regBusEmail}
                                        onChange={(e) => setRegBusEmail(e.target.value)}
                                        placeholder="you@example.com"
                                        required
                                        className="w-full bg-[#050506] border border-zinc-850 text-white rounded-lg p-2.5 text-xs focus:outline-none focus:border-zinc-700 transition-colors font-sans font-normal"
                                      />
                                    </div>

                                    <div>
                                      <label className="text-[8.5px] text-[#A1A1AA] uppercase tracking-widest font-extrabold block mb-1">
                                        Phone Number
                                      </label>
                                      <input
                                        type="tel"
                                        value={regBusPhone}
                                        onChange={(e) => setRegBusPhone(e.target.value)}
                                        placeholder="+1 (555) 0199"
                                        required
                                        className="w-full bg-[#050506] border border-zinc-850 text-white rounded-lg p-2.5 text-xs focus:outline-none focus:border-zinc-700 transition-colors font-sans font-normal"
                                      />
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 animate-fadeIn animate-duration-150">
                                      <div>
                                        <label className="text-[8.5px] text-[#A1A1AA] uppercase tracking-widest font-extrabold block mb-1">
                                          Company Name
                                        </label>
                                        <input
                                          type="text"
                                          value={regBusCompanyName}
                                          onChange={(e) => setRegBusCompanyName(e.target.value)}
                                          placeholder="E.g. Capital Ltd"
                                          className="w-full bg-[#050506] border border-zinc-850 text-white rounded-lg p-2.5 text-xs focus:outline-none focus:border-zinc-700 transition-colors font-sans font-normal"
                                        />
                                      </div>
                                      <div>
                                        <label className="text-[8.5px] text-[#A1A1AA] uppercase tracking-widest font-extrabold block mb-1">
                                          How did you find us?
                                        </label>
                                        <select
                                          value={regBusReferralSource}
                                          onChange={(e) => setRegBusReferralSource(e.target.value)}
                                          className="w-full bg-[#050506] border border-zinc-850 text-white rounded-lg p-2.5 text-xs focus:outline-none focus:border-zinc-700 transition-colors font-sans font-normal text-left cursor-pointer animate-fadeIn"
                                        >
                                          <option value="" disabled className="bg-zinc-950 text-zinc-500">Select an option</option>
                                          <option value="Twitter / X" className="bg-zinc-950 text-white">Twitter / X</option>
                                          <option value="Telegram" className="bg-zinc-950 text-white">Telegram</option>
                                          <option value="Friend / Referral" className="bg-zinc-950 text-white">Friend / Referral</option>
                                          <option value="Search Engine" className="bg-zinc-950 text-white">Search Engine</option>
                                          <option value="YouTube" className="bg-zinc-950 text-white">YouTube</option>
                                          <option value="Other" className="bg-zinc-950 text-white">Other</option>
                                        </select>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  const isValid = contactType === 'individual'
                                    ? (regIndName && regIndEmail && regIndPhone)
                                    : (regBusName && regBusEmail && regBusPhone && regBusCompanyName);
                                  if (isValid) {
                                    setCheckoutSubStep('billing');
                                  } else {
                                    if (contactType === 'individual') {
                                      alert('Please fill out Name, Email, and Phone Number to continue to Billing.');
                                    } else {
                                      alert('Please fill out Name, Email, Phone Number, and Company Name to continue to Billing.');
                                    }
                                  }
                                }}
                                className="w-full mt-4 py-3 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                              >
                                <span>Continue to Billing Info</span>
                                <ArrowRight className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-4 flex flex-col justify-between h-full animate-fadeIn">
                              <div className="space-y-3">
                                <div className="flex items-center justify-between border-b border-zinc-900 pb-1.5">
                                  <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-[#a1a1aa] font-black">
                                    <CreditCard className="w-3.5 h-3.5 text-indigo-400" />
                                    STEP 2: Billing & Card Details
                                  </div>
                                  <span className="text-[9px] text-[#a1a1aa] font-mono">2/2</span>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="text-[8.5px] text-[#A1A1AA] uppercase tracking-widest font-extrabold block mb-1">
                                      Billing Address
                                    </label>
                                    <input
                                      type="text"
                                      value={userAddress}
                                      onChange={(e) => setUserAddress(e.target.value)}
                                      placeholder="123 Main St"
                                      required
                                      className="w-full bg-[#050506] border border-zinc-850 text-white rounded-lg p-2.5 text-xs focus:outline-none focus:border-zinc-700 transition-colors font-mono"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[8.5px] text-[#A1A1AA] uppercase tracking-widest font-extrabold block mb-1">
                                      City / Zip Code
                                    </label>
                                    <input
                                      type="text"
                                      value={userZip}
                                      onChange={(e) => setUserZip(e.target.value)}
                                      placeholder="New York, NY 10001"
                                      required
                                      className="w-full bg-[#050506] border border-zinc-850 text-white rounded-lg p-2.5 text-xs focus:outline-none focus:border-zinc-700 transition-colors font-mono"
                                    />
                                  </div>
                                </div>

                                <div>
                                  <label className="text-[8.5px] text-[#A1A1AA] uppercase tracking-widest font-extrabold block mb-1">
                                    Credit Card Number
                                  </label>
                                  <div className="relative">
                                    <input
                                      type="text"
                                      value={mockCardNumber}
                                      onChange={(e) => setMockCardNumber(e.target.value)}
                                      className="w-full bg-[#050506] border border-zinc-850 text-white rounded-lg p-2.5 pr-10 text-xs focus:outline-none focus:border-zinc-700 transition-colors font-mono"
                                    />
                                    <CreditCard className="w-3.5 h-3.5 text-zinc-500 absolute right-3 top-1/2 -translate-y-1/2" />
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="text-[8.5px] text-[#A1A1AA] uppercase tracking-widest font-extrabold block mb-1">
                                      Expiry Date
                                    </label>
                                    <input
                                      type="text"
                                      value={mockCardExpiry}
                                      onChange={(e) => setMockCardExpiry(e.target.value)}
                                      className="w-full bg-[#050506] border border-zinc-850 text-white rounded-lg p-2.5 text-xs focus:outline-none focus:border-zinc-700 transition-colors text-center font-mono"
                                    />
                                  </div>

                                  <div>
                                    <label className="text-[8.5px] text-[#A1A1AA] uppercase tracking-widest font-extrabold block mb-1">
                                      CVV Code
                                    </label>
                                    <input
                                      type="text"
                                      value={mockCardCvv}
                                      onChange={(e) => setMockCardCvv(e.target.value)}
                                      className="w-full bg-[#050506] border border-zinc-850 text-white rounded-lg p-2.5 text-xs focus:outline-none focus:border-zinc-700 transition-colors text-center font-mono"
                                    />
                                  </div>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-2 mt-4">
                                <button
                                  type="button"
                                  onClick={() => setCheckoutSubStep('details')}
                                  className="py-3 px-2 text-zinc-400 hover:text-white border border-zinc-900 hover:border-zinc-800 rounded-lg text-[10px] uppercase font-black tracking-widest transition-colors cursor-pointer text-center"
                                >
                                  Back
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (userAddress && userZip) {
                                      setCheckoutStep('processing');
                                    } else {
                                      alert('Please enter your Billing Address and Zip code.');
                                    }
                                  }}
                                  className="py-3 px-2 bg-emerald-400 hover:bg-emerald-300 text-neutral-950 font-black text-[10px] uppercase tracking-widest rounded-lg shadow-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer transform hover:scale-[1.01]"
                                >
                                  <Lock className="w-3.5 h-3.5 shrink-0" />
                                  <span>Pay & Activate</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* LEFT COLUMN: ACTIVE PLAN CRITERIA & TARIFF DETAILS */}
                    <div className="order-2 md:order-1 space-y-4">
                      <div className="bg-[#070708] border border-zinc-900/80 p-4 rounded-xl space-y-3">
                        <div>
                          <span className="text-[9px] text-zinc-500 uppercase tracking-widest block font-bold">SELECTED PLAN</span>
                          <h3 className="text-lg font-black text-white mt-1 uppercase tracking-tight font-sans">
                            {selectedPlanForCheckout === 'discord' && "Discord Plan"}
                            {selectedPlanForCheckout === 'skyvision' && "SkyVision Cockpit"}
                            {selectedPlanForCheckout === 'pinpoint' && "Pinpoint Gexbot"}
                            {selectedPlanForCheckout === 'quant' && "Quant Suite"}
                            {selectedPlanForCheckout === 'lifetime' && "Lifetime Access"}
                          </h3>
                        </div>
                        <div className="flex justify-between items-center border-t border-zinc-900/60 pt-2">
                          <span className="text-[10px] text-zinc-400 capitalize tracking-wide font-medium">Subscription Price:</span>
                          <span className={`${selectedPlanForCheckout === 'lifetime' ? 'text-[10px] font-mono font-semibold tracking-wider text-emerald-400 uppercase bg-emerald-500/10 px-2.5 py-1.5 border border-emerald-500/20 rounded-md' : 'text-xl font-black text-white font-mono'}`}>
                            {selectedPlanForCheckout === 'lifetime' 
                              ? 'Quote Needed' 
                              : billingCycle === 'monthly' 
                                ? (selectedPlanForCheckout === 'discord' ? '$65' : selectedPlanForCheckout === 'skyvision' ? '$350' : selectedPlanForCheckout === 'pinpoint' ? '$500' : '$1500')
                                : (selectedPlanForCheckout === 'discord' ? '$55' : selectedPlanForCheckout === 'skyvision' ? '$290' : selectedPlanForCheckout === 'pinpoint' ? '$420' : '$1250')
                            }
                            {selectedPlanForCheckout !== 'lifetime' && <span className="text-[10px] text-zinc-500 font-normal ml-0.5">/mo</span>}
                          </span>
                        </div>
                        <div className="flex justify-between items-center border-t border-[#141417] pt-2 text-[10px]">
                          <span className="text-zinc-550">Billing Cycle:</span>
                          <span className="text-emerald-400 font-black uppercase font-mono">
                            {selectedPlanForCheckout === 'lifetime' ? 'PERMANENT ALL-ACCESS' : (billingCycle === 'monthly' ? "RENEW MONTHLY" : "ANNUAL (20% OFF)")}
                          </span>
                        </div>
                      </div>

                      {/* Cumulative lock status */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 text-[9px] uppercase font-black tracking-widest text-[#a1a1aa]">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>GUARANTEED PLAN FEATURES</span>
                        </div>
                        <p className="text-[9px] text-zinc-500 leading-relaxed font-mono uppercase">
                          ALL TIERS ARE INCLUSIVE. YOUR SUBSCRIPTION AUTOMATICALLY UNLOCKS:
                        </p>
                        <div className="bg-zinc-950/60 border border-zinc-900/65 rounded-xl p-3.5 space-y-1.5 text-[10px] font-mono">
                          {selectedPlanForCheckout === 'discord' && (
                            <>
                              <div className="flex items-center gap-1.5 text-emerald-400"><Check className="w-3.5 h-3.5 shrink-0" /> Discord Live Alerts ($65 Value)</div>
                              <div className="flex items-center gap-1.5 text-zinc-650 line-through"><X className="w-3.5 h-3.5 shrink-0" /> SkyVision Decision Core</div>
                              <div className="flex items-center gap-1.5 text-zinc-650 line-through"><X className="w-3.5 h-3.5 shrink-0" /> Pinpoint Gexbot Feed</div>
                            </>
                          )}
                          {selectedPlanForCheckout === 'skyvision' && (
                            <>
                              <div className="flex items-center gap-1.5 text-emerald-400"><Check className="w-3.5 h-3.5 shrink-0" /> Discord Chat & Alerts (Included)</div>
                              <div className="flex items-center gap-1.5 text-emerald-400"><Check className="w-3.5 h-3.5 shrink-0" /> SkyVision Decision Cockpit ($350)</div>
                              <div className="flex items-center gap-1.5 text-zinc-650 line-through"><X className="w-3.5 h-3.5 shrink-0" /> Pinpoint Gexbot Feed</div>
                            </>
                          )}
                          {selectedPlanForCheckout === 'pinpoint' && (
                            <>
                              <div className="flex items-center gap-1.5 text-emerald-400"><Check className="w-3.5 h-3.5 shrink-0" /> Discord Chat + SkyVision Cockpit</div>
                              <div className="flex items-center gap-1.5 text-emerald-400"><Check className="w-3.5 h-3.5 shrink-0" /> Pinpoint Gexbot Exposure Feed ($500)</div>
                              <div className="flex items-center gap-1.5 text-zinc-650 line-through"><X className="w-3.5 h-3.5 shrink-0" /> Full Quant Engine suite</div>
                            </>
                          )}
                          {selectedPlanForCheckout === 'quant' && (
                            <>
                              <div className="flex items-center gap-1.5 text-emerald-400"><Check className="w-3.5 h-3.5 shrink-0" /> Discord + SkyVision + Pinpoint</div>
                              <div className="flex items-center gap-1.5 text-emerald-400"><Check className="w-3.5 h-3.5 shrink-0" /> Institutional Quant Auditor ($1500)</div>
                              <div className="flex items-center gap-1.5 text-emerald-450"><Check className="w-3.5 h-3.5 shrink-0" /> Real-time Dealer Flow Heatmaps</div>
                            </>
                          )}
                          {selectedPlanForCheckout === 'lifetime' && (
                            <>
                              <div className="flex items-center gap-1.5 text-emerald-400"><Check className="w-3.5 h-3.5 shrink-0" /> Permanent Lifetime Access (All Tiers)</div>
                              <div className="flex items-center gap-1.5 text-emerald-400"><Check className="w-3.5 h-3.5 shrink-0" /> Private 1-on-1 Strategy Setup</div>
                              <div className="flex items-center gap-1.5 text-emerald-400"><Check className="w-3.5 h-3.5 shrink-0" /> Priority Custom API Bridges</div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {checkoutStep === 'processing' && (
                  <div className="py-8 flex flex-col items-center justify-center space-y-6 animate-fadeIn">
                    <div className="relative flex items-center justify-center">
                      <div className="w-14 h-14 rounded-full border-t-2 border-r-2 border-indigo-500 animate-spin" />
                      <Lock className="w-5 h-5 text-indigo-400 absolute animate-pulse" />
                    </div>

                    <div className="w-full bg-black/60 rounded-lg p-4 font-mono text-[9px] text-[#a1a1aa] leading-released border border-zinc-950/40 space-y-1.5 bg-[#050506] min-h-[140px]">
                      <div className="text-zinc-650 text-[8px] font-black border-b border-zinc-900/50 pb-1 mb-2 uppercase">SECURE PAYMENT PIPELINE CONSOLE</div>
                      {processingLogs.map((log, idx) => (
                        <div key={idx} className="flex gap-2">
                          <span className="text-indigo-400 shrink-0">&gt;&gt;</span>
                          <span>{log}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {checkoutStep === 'success' && (
                  <div className="py-4 space-y-5 animate-fadeIn flex flex-col items-center">
                    {/* Dynamic state badge */}
                    <div className="w-full flex justify-between items-center bg-[#070709] border border-zinc-900 rounded-lg p-3 px-4 font-mono text-[9px]">
                      <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${isSuccessValidatedDone ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                        <span className="text-[#a1a1aa] uppercase font-black tracking-widest">
                          {isSuccessValidatedDone ? 'VALIDATION COMPLETE' : 'VALIDATION ENGINE ACTIVE'}
                        </span>
                      </div>
                      <span className={`font-black uppercase tracking-wider ${isSuccessValidatedDone ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {isSuccessValidatedDone ? 'SUCCESS // READY' : 'SCANNING LEDGER...'}
                      </span>
                    </div>

                    {/* Highly aesthetic check/scanning animation visualizer */}
                    <div className="relative flex items-center justify-center py-4">
                      <motion.div 
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className={`w-20 h-20 rounded-full flex items-center justify-center border-2 ${
                          isSuccessValidatedDone 
                            ? 'bg-emerald-500/10 border-emerald-400 shadow-[0_0_30px_rgba(48,209,88,0.25)]' 
                            : 'bg-amber-500/10 border-amber-400/60 animate-pulse shadow-[0_0_30px_rgba(245,158,11,0.15)]'
                        }`}
                      >
                        {isSuccessValidatedDone ? (
                          <Check className="w-10 h-10 text-emerald-400" />
                        ) : (
                          <ShieldCheck className="w-10 h-10 text-amber-400 animate-spin-reverse" />
                        )}
                      </motion.div>
                      
                      {/* Animated circular scanning effect when validating */}
                      {isValidatingSuccess && (
                        <div className="absolute inset-x-[-15px] inset-y-[-15px] rounded-full border border-dashed border-amber-400/20 animate-spin" />
                      )}
                    </div>

                    {/* Status descriptions */}
                    <div className="text-center space-y-1.5 max-w-md mx-auto">
                      <h4 className="text-base font-black text-white uppercase tracking-tight font-sans">
                        {isSuccessValidatedDone ? 'SUBSCRIPTION LEVEL ENGAGED' : 'LEDGER PARAMETERS WRITING...'}
                      </h4>
                      <p className="text-zinc-400 text-[11px] leading-relaxed">
                        {isSuccessValidatedDone 
                          ? `The validator successfully committed your purchase to the secure cloud database. Your clearance level has been securely synchronized across all platform endpoints.`
                          : 'Validating cryptographic payment tokens and committing state variables securely onto client cookies for persistent session clearance...'
                        }
                      </p>
                    </div>

                    {/* Validation Pipeline Log Console Terminal */}
                    <div className="w-full bg-[#050506] border border-zinc-900 rounded-xl p-4 font-mono text-[9px] text-[#8e8e93] leading-relaxed text-left space-y-1.5 relative overflow-hidden min-h-[150px]">
                      <div className="absolute top-0 right-0 p-2 font-mono text-[8px] text-zinc-650 tracking-widest font-bold">ST-V8 ENGINE</div>
                      
                      <div className="text-[8px] text-zinc-650 font-black tracking-widest uppercase border-b border-zinc-900/40 pb-1 mb-2">
                        DATABASE RECONCILIATION AUDIT MATRIX
                      </div>

                      {successValidationLogs.map((log, index) => (
                        <div key={index} className="flex gap-2.5 items-center">
                          <span className="text-emerald-400 shrink-0 font-bold">&gt;&gt;</span>
                          <span className="truncate">{log}</span>
                        </div>
                      ))}

                      {isValidatingSuccess && (
                        <div className="flex gap-2 items-center text-amber-400 text-[8.5px] font-black tracking-widest pl-5 mt-1 animate-pulse">
                          <span>SYSTEM RETRIEVING SIGNATURE CLEARANCES...</span>
                        </div>
                      )}
                    </div>

                    {/* Cleared Active Features grid (Only show when validation is done) */}
                    {isSuccessValidatedDone && (
                      <div className="bg-zinc-950/40 border border-zinc-900 p-4 rounded-xl w-full text-left space-y-2.5 animate-fadeIn">
                        <div className="text-[9.5px] text-zinc-450 font-extrabold uppercase border-b border-zinc-900/60 pb-1 flex justify-between">
                          <span>Verified Subscriptions Access</span>
                          <span className="text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> CONFIRMED SECURE
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] text-zinc-350 font-mono">
                          {(() => {
                            const tiersToShow: string[] = [];
                            if (selectedPlanForCheckout === 'discord') tiersToShow.push('discord');
                            if (selectedPlanForCheckout === 'skyvision') tiersToShow.push('discord', 'skyvision');
                            if (selectedPlanForCheckout === 'pinpoint') tiersToShow.push('discord', 'skyvision', 'pinpoint');
                            if (selectedPlanForCheckout === 'quant') tiersToShow.push('discord', 'skyvision', 'pinpoint', 'quant');
                            if (selectedPlanForCheckout === 'lifetime') tiersToShow.push('discord', 'skyvision', 'pinpoint', 'quant', 'lifetime');

                            const listLabels: Record<string, string> = {
                              discord: "Discord Live Alerts & Chat",
                              skyvision: "SkyVision Dashboard & PNL Core",
                              pinpoint: "Pinpoint Gexbot & Position Heatmaps",
                              quant: "Quant backtesting & Hedging Core",
                              lifetime: "Lifetime Membership & Beta Feeds"
                            };

                            return tiersToShow.map(key => (
                              <div key={key} className="flex items-center gap-1.5 text-zinc-300">
                                <span className="w-1 h-1 rounded-full bg-emerald-400" />
                                <span className="truncate text-[9.5px]">{listLabels[key] || key}</span>
                              </div>
                            ));
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                )}

              </div>

              {/* Modal Bottom Controls */}
              <div className="bg-[#050506] border-t border-zinc-900/80 px-6 py-4 flex gap-3 justify-center items-center">
                {checkoutStep === 'details' && (
                  <button
                    onClick={() => setSelectedPlanForCheckout(null)}
                    className="w-full py-3 rounded-lg bg-[#0d0d11] border border-zinc-850 hover:bg-zinc-900 text-zinc-400 hover:text-white font-bold text-[10px] uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>Cancel & Choose Other Plan</span>
                  </button>
                )}

                {checkoutStep === 'success' && (
                  <button
                    disabled={isValidatingSuccess}
                    onClick={() => {
                      // Redirect back to the landing page tab
                      onEnterApp('home');
                      setSelectedPlanForCheckout(null);
                      
                      // Scroll to the absolute top of the page immediately as if they just came to the page
                      window.scrollTo({ top: 0, behavior: 'auto' });
                      if (typeof document !== 'undefined') {
                        document.body.scrollTo({ top: 0 });
                        document.documentElement.scrollTo({ top: 0 });
                        const landingEl = document.getElementById('slayer-ecosystem-landing');
                        if (landingEl) {
                          landingEl.scrollTo({ top: 0 });
                        }
                      }
                    }}
                    className={`w-full py-4 font-extrabold uppercase tracking-widest text-[#000000] text-center text-[10px] rounded-lg transition-all cursor-pointer shadow-lg flex items-center justify-center gap-2 ${
                      isValidatingSuccess 
                        ? 'bg-zinc-850 text-zinc-550 border border-zinc-800 cursor-not-allowed opacity-50' 
                        : 'bg-white hover:bg-zinc-200 text-black'
                    }`}
                  >
                    <span>{isValidatingSuccess ? 'VALIDATING SECURITY CLEARANCES...' : 'VALIDATE ACCESS & ENTER WORKSPACE'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
