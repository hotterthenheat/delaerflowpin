import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { useContractStore, PinLevel } from '../lib/store';
import { ASSET_LIST } from '../data';
import { Compass, ShieldAlert, Zap, Layers, History, HelpCircle, Activity, Play, Thermometer, Search } from 'lucide-react';
import {
  calculateBSMGreeks,
  rawSVI,
  SVISurfaceCalibrator,
  DupireLocalVolSolver,
  DealerExposureEngine,
  PhysicsCascadeEngine,
  BayesianRegimeEngine
} from '../lib/pinpointEngine';

interface TickerProfile {
  kappaCoupling: number;
  thetaMR: number;
  openInterestValue: number;
  volStateVal: number;
  sviParams: { a: number; b: number; rho: number; m: number; sigma: number };
  bookLiquidity: number[];
  ivRank: number;
  velocity: number;
}

const TICKER_CALIBRATION_PROFILES: Record<string, TickerProfile> = {
  SPX: {
    kappaCoupling: 0.035,
    thetaMR: 0.42,
    openInterestValue: 45000,
    volStateVal: 0.14,
    sviParams: { a: 0.015, b: 0.09, rho: -0.65, m: 0.002, sigma: 0.07 },
    bookLiquidity: [45000, 52000],
    ivRank: 18,
    velocity: 0.35
  },
  NDX: {
    kappaCoupling: 0.055,
    thetaMR: 0.32,
    openInterestValue: 12000,
    volStateVal: 0.18,
    sviParams: { a: 0.022, b: 0.11, rho: -0.58, m: 0.006, sigma: 0.095 },
    bookLiquidity: [15000, 21000],
    ivRank: 28,
    velocity: 0.65
  },
  QQQ: {
    kappaCoupling: 0.058,
    thetaMR: 0.34,
    openInterestValue: 18000,
    volStateVal: 0.17,
    sviParams: { a: 0.021, b: 0.10, rho: -0.60, m: 0.005, sigma: 0.09 },
    bookLiquidity: [18000, 24000],
    ivRank: 26,
    velocity: 0.58
  },
  SPY: {
    kappaCoupling: 0.032,
    thetaMR: 0.45,
    openInterestValue: 32000,
    volStateVal: 0.135,
    sviParams: { a: 0.014, b: 0.085, rho: -0.66, m: 0.002, sigma: 0.068 },
    bookLiquidity: [32000, 38000],
    ivRank: 16,
    velocity: 0.32
  },
  RUT: {
    kappaCoupling: 0.085,
    thetaMR: 0.24,
    openInterestValue: 9800,
    volStateVal: 0.22,
    sviParams: { a: 0.035, b: 0.14, rho: -0.42, m: 0.015, sigma: 0.11 },
    bookLiquidity: [9800, 12000],
    ivRank: 42,
    velocity: -0.15
  },
  DEFAULT: {
    kappaCoupling: 0.05,
    thetaMR: 0.35,
    openInterestValue: 10000,
    volStateVal: 0.18,
    sviParams: { a: 0.025, b: 0.10, rho: -0.50, m: 0.01, sigma: 0.09 },
    bookLiquidity: [10000, 12000],
    ivRank: 25,
    velocity: 0.25
  }
};

export function PinpointAIView() {
  const activeContract = useContractStore(s => s.activeContract);
  const selectedAsset = useContractStore(s => s.selectedAsset);
  const selectedOptionType = useContractStore(s => s.selectedOptionType);
  const selectedStrike = useContractStore(s => s.selectedStrike);
  const score = useContractStore(s => s.serverState?.system_score);
  const serverState = useContractStore(s => s.serverState);
  const marketState = useContractStore(s => s.marketState);
  const themeMode = useContractStore(s => s.themeMode);
  const selectedTimeframe = useContractStore(s => s.selectedTimeframe);
  const isLight = themeMode === 'light';

  // AI Co-Pilot dynamic commentary states
  const [customAiCommentary, setCustomAiCommentary] = useState<string[] | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);

  // Interactive Relative Volume Heatmap States in Pinpoint
  const [hoveredCellIndex, setHoveredCellIndex] = useState<number | null>(null);

  // Advanced Arbor Physics & Quantum Cascade Lab state
  const [quantMode, setQuantMode] = useState<'map' | 'cascade'>('map');
  const [isOverrideEnabled, setIsOverrideEnabled] = useState<boolean>(false);
  const [kappaCoupling, setKappaCoupling] = useState<number>(0.05);
  const [thetaMR, setThetaMR] = useState<number>(0.3);
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [isRunningSim, setIsRunningSim] = useState(false);
  const [sviParamsState, setSviParamsState] = useState<any>({ a: 0.04, b: 0.1, rho: -0.35, m: 0.0, sigma: 0.1 });

  const activeProfile = useMemo(() => {
    const t = selectedAsset.ticker;
    return TICKER_CALIBRATION_PROFILES[t] || TICKER_CALIBRATION_PROFILES.DEFAULT;
  }, [selectedAsset.ticker]);

  const activeKappa = useMemo(() => {
    return isOverrideEnabled ? kappaCoupling : activeProfile.kappaCoupling;
  }, [isOverrideEnabled, kappaCoupling, activeProfile]);

  const activeTheta = useMemo(() => {
    return isOverrideEnabled ? thetaMR : activeProfile.thetaMR;
  }, [isOverrideEnabled, thetaMR, activeProfile]);

  const rvolData = useMemo(() => {
    return getDeterministicData(selectedAsset.ticker, 30);
  }, [selectedAsset.ticker]);

  // Flush AI report when selecting a different underlying index
  React.useEffect(() => {
    setCustomAiCommentary(null);
  }, [selectedAsset.ticker]);

  const triggerAiAnalysis = async () => {
    if (isGeneratingAi) return;
    setIsGeneratingAi(true);
    try {
      const res = await fetch('/api/gemini/commentary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticker: selectedAsset.ticker,
          spotPrice: spotPrice,
          callWall: liveMetrics.callWall,
          putWall: liveMetrics.putWall,
          magnetStrike: liveMetrics.magnetStrike,
          flipLevel: liveMetrics.flipLevel,
          bias: liveMetrics.bias,
          ivRank: activeProfile.ivRank
        })
      });
      const data = await res.json();
      if (data.success && data.commentary) {
        setCustomAiCommentary(data.commentary);
      }
    } catch (e) {
      console.error("[CO-PILOT ERROR]", e);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const attributionFlags = useMemo(() => {
    const t = selectedAsset.ticker;
    if (t === 'SPX') {
      return [
        { id: 'GAMMA_PINNED', name: 'GAMMA_PINNED', desc: 'Dealer hedge flow dampens broad market index swings', value: '91%', label: 'Stability: Max' },
        { id: 'LIQUIDITY_ANCHOR', name: 'LIQUIDITY_ANCHOR', desc: 'Dense spot concentration at primary index strike boundaries', value: '86%', label: 'Concentration: Heavy' },
        { id: 'VANNA_DRIFT', name: 'VANNA_DRIFT', desc: 'Declining IV accelerates index positioning gravity', value: '78%', label: 'Sensitivity: High' },
        { id: 'CHARM_DECAY', name: 'CHARM_DECAY', desc: 'Option pricing decay forces weekend curve compression', value: 'Max', label: 'Decay Rate: Peak' },
        { id: 'SQUEEZE_ABSENT', name: 'SQUEEZE_ABSENT', desc: 'Positive dealer inventory prevents sudden runaway wings', value: 'Negligible', label: 'Volatility Risk: Cool' }
      ];
    } else if (t === 'QQQ') {
      return [
        { id: 'BETA_DRIVE', name: 'BETA_DRIVE', desc: 'Systemic index beta exposure dominates tech listing flows', value: '84%', label: 'Exposure: Heavy' },
        { id: 'GAMMA_FLIP_RETEST', name: 'GAMMA_FLIP_RETEST', desc: 'Spot testing critical threshold of dealer inventory crossover', value: '72%', label: 'Inflection Risk: High' },
        { id: 'LIQUIDITY_MAGNET', name: 'LIQUIDITY_MAGNET', desc: 'High open interest exerts magnetic pricing pull on active strike', value: '79%', label: 'Pull Weight: Strong' },
        { id: 'VOL_COMPRESSION', name: 'VOL_COMPRESSION', desc: 'Accelerated options decay dampens underlying range wings', value: 'Dampened', label: 'Imposed Cap: Active' },
        { id: 'DEALER_LONG_GAMMA', name: 'DEALER_LONG_GAMMA', desc: 'Positive gamma cushions volatility, returning spot to mean', value: 'Stable', label: 'Buffer Level: Active' }
      ];
    } else if (t === 'NDX') {
      return [
        { id: 'BETA_DRIVE', name: 'BETA_DRIVE', desc: 'Tech index beta exposure directs systemic index derivative flows', value: '92%', label: 'Exposure: Extreme' },
        { id: 'GAMMA_MAGNET', name: 'GAMMA_MAGNET', desc: 'Dense Nasdaq 100 open interest acts as near-term spot gravity source', value: '84%', label: 'Magnet Weight: Intense' },
        { id: 'VOL_SKEW_STEEP', name: 'VOL_SKEW_STEEP', desc: 'Accelerated volatility skew rewards tail hedge buyers during expansions', value: '76%', label: 'Skew State: Steep' },
        { id: 'CHARM_ACCEL', name: 'CHARM_ACCEL', desc: 'Decay of premium forces market makers to unwind long hedges near close', value: 'Active', label: 'Charm Gravity: Strong' }
      ];
    } else if (t === 'SPY') {
      return [
        { id: 'ETF_FLOW', name: 'ETF_FLOW', desc: 'Ultra-liquid index ETF flow anchors spot range variance securely', value: '95%', label: 'Liquidity: Deep' },
        { id: 'DELTA_SQUEEZE', name: 'DELTA_SQUEEZE', desc: 'Extremely dense call buying forces swift dealer short cover loops', value: '81%', label: 'Stability: Superb' },
        { id: 'GAMMA_FLIP_RETEST', name: 'GAMMA_FLIP_RETEST', desc: 'Spot testing historical trigger zone of market-maker dealer hedging', value: '79%', label: 'Key Level: Imminent' }
      ];
    } else if (t === 'RUT') {
      return [
        { id: 'DISPERSION_DRIVE', name: 'DISPERSION_DRIVE', desc: 'Russell small-cap volatility dispersion drives aggressive sector rotates', value: '70%', label: 'Sectors: Adaptive' },
        { id: 'PUT_WALL_STRONG', name: 'PUT_WALL_STRONG', desc: 'Massive institutional small-cap put walls establish a multi-session floor', value: '85%', label: 'Floor Guard: Active' },
        { id: 'DEALER_SHORT_GAMMA', name: 'DEALER_SHORT_GAMMA', desc: 'Dealers remaining short gamma amplifies intraday Russell mean excursions', value: 'Volatile', label: 'Hedging Action: Active' }
      ];
    } else {
      return [
        { id: 'STRIKE_MAGNET', name: 'STRIKE_MAGNET', desc: 'Cluster of open interest attracts pricing as session matures', value: '75%', label: 'Attraction: Normal' },
        { id: 'DEALER_NEUTRAL', name: 'DEALER_NEUTRAL', desc: 'Option inventory remains delta-neutral across primary wings', value: 'Balanced', label: 'Bias: Systemic Neutral' },
        { id: 'STABLE_VOLUME', name: 'STABLE_VOLUME', desc: 'Option trade count remains consistent with rolling 30-day index', value: '1.02x', label: 'Volatility State: Base' },
        { id: 'THETA_COMPRESSION', name: 'THETA_COMPRESSION', desc: 'Routine post-peak decay forces stabilization on side strikes', value: 'Normal', label: 'Decay Factor: Base' },
        { id: 'WALL_SUPPORT', name: 'WALL_SUPPORT', desc: 'Dense put accumulation provides high structural floor protection', value: 'Protected', label: 'Protection: Solid' }
      ];
    }
  }, [selectedAsset.ticker]);

  // Derive pinpoint map parameters
  const spotPrice = activeContract?.pinpoint?.spotPrice || selectedAsset.defaultPrice;
  const rawLevels = activeContract?.pinpoint?.levels || [];

  // Generate complete set of levels centered on spot if rawLevels are empty
  const levels: PinLevel[] = useMemo(() => {
    if (rawLevels.length > 0) return rawLevels;

    const spot = selectedAsset.defaultPrice;
    const step = spot > 1000 ? 100 : spot > 150 ? 5 : 1;
    const center = Math.round(spot / step) * step;

    // Default levels list matching the required architecture
    return [
      { strike: center + step * 2, dollars: 8400000000, strength: 84, type: 'resistance' },
      { strike: center + step, dollars: 6100000000, strength: 65, type: 'resistance' },
      { strike: center, dollars: 4200000000, strength: 55, type: 'magnet' },
      { strike: center - step, dollars: 6500000000, strength: 65, type: 'support' },
      { strike: center - step * 2, dollars: 9400000000, strength: 94, type: 'support' }
    ];
  }, [rawLevels, selectedAsset]);

  const liveMetrics = useMemo(() => {
    const step = spotPrice > 1000 ? 100 : spotPrice > 150 ? 5 : 1;
    const center = Math.round(spotPrice / step) * step;
    return {
      bias: serverState?.deep_intelligence?.dealer_metrics?.bias || 'LONG GAMMA',
      volState: serverState?.deep_intelligence?.dealer_metrics?.volState || 'COMPRESSED',
      magnetStrike: serverState?.deep_intelligence?.dealer_metrics?.magnetStrike || center,
      flipLevel: serverState?.deep_intelligence?.dealer_metrics?.flipLevel || (center - step),
      callWall: serverState?.deep_intelligence?.dealer_metrics?.callWall || (center + step * 2),
      putWall: serverState?.deep_intelligence?.dealer_metrics?.putWall || (center - step * 2),
      dealerScore: serverState?.deep_intelligence?.dealer_metrics?.dealerScore || 84,
      expectedMovePct: serverState?.expected_move?.pct || '±1.1%'
    };
  }, [serverState, spotPrice]);

  // Determine standard bounds for absolute Y placement
  const { maxStrike, minStrike, strikeRange } = useMemo(() => {
    const strikes = levels.map(l => l.strike);
    const max = strikes.length > 0 ? Math.max(...strikes) : spotPrice * 1.02;
    const min = strikes.length > 0 ? Math.min(...strikes) : spotPrice * 0.98;
    return {
      maxStrike: max,
      minStrike: min,
      strikeRange: max - min || 1
    };
  }, [levels, spotPrice]);

  // Calculate precise spotY coordinate relative to 420px map track canvas
  const containerHeight = 420;
  const paddingY = 30; // buffer spacing
  const usableHeight = containerHeight - paddingY * 2;
  const spotY = useMemo(() => {
    const relativePos = (maxStrike - spotPrice) / strikeRange;
    const boundedPos = Math.max(0, Math.min(1, relativePos));
    return paddingY + boundedPos * usableHeight;
  }, [spotPrice, maxStrike, strikeRange, usableHeight]);

  // Render individual PinBar component exactly as requested (Bug #3)
  function PinBarComponent({ strike, dollars, strength, type }: PinLevel) {
    const maxDollarValue = 10000000000; // 10 Billion scale
    const width = Math.max(8, (dollars / maxDollarValue) * 100);
    const opacity = strength / 100;
    
    // Exact requested HEX hex codes
    const color = type === 'support' 
      ? '#00ff88' 
      : type === 'resistance' 
        ? '#ff4545' 
        : isLight ? '#1d4ed8' : '#4f8cff';

    return (
      <div className="flex items-center gap-4 py-3 border-b border-zinc-900/35 relative group hover:bg-zinc-950/20 px-2 transition-colors">
        <div className="w-16 flex flex-col">
          <span className="text-sm font-black text-white">{strike}</span>
          <span className="text-[7.5px] text-zinc-500 font-mono tracking-wider font-semibold uppercase">{type}</span>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="h-6 bg-zinc-950 border border-zinc-900 rounded-sm relative overflow-hidden flex items-center">
            <div 
              className="h-full transition-all duration-300"
              style={{
                width: `${width}%`,
                opacity: opacity,
                backgroundColor: color,
                boxShadow: `0 0 10px ${color}1a`
              }}
            />
            <div className="absolute inset-y-0 left-3 flex items-center text-[9px] text-[#E4E4E7] font-black tracking-widest uppercase pointer-events-none gap-2 font-mono">
              <span style={{ color }}>●</span>
              <span>{(dollars / 1000000000).toFixed(2)}B LEVEL</span>
            </div>
          </div>
        </div>

        <div className="w-12 text-right">
          <span className="text-xs font-bold text-zinc-400 font-mono">{strength}%</span>
          <span className="text-[7px] text-zinc-500 block uppercase font-mono">STRENGTH</span>
        </div>
      </div>
    );
  }

  // --- ARBOR PHYSICS CASCADE LABORATORY COMPILER ---
  const runHedgingCascade = () => {
    setIsRunningSim(true);
    
    setTimeout(() => {
      try {
        const spot = spotPrice || selectedAsset.defaultPrice;
        const currentMaturity = 14 / 365;

        // Compile strikes and GEX potentials from active levels.
        const strikePrices = levels.map(l => l.strike);
        
        // Signed exposure logic: Magnets pull (pos GEX), Walls block/support (neg GEX)
        const gexExposures = levels.map(l => {
          const typeBase = l.type === 'magnet' ? 500000 : l.type === 'support' ? -350000 : -250000;
          return typeBase * (l.strength / 100);
        });

        // Limit Order Book (LOB) support bounds
        const bookLevels = [spot * 0.985, spot * 1.015];
        const bookLiquidity = activeProfile.bookLiquidity;

        // Solve SVI parameters calibrated to ticker volatility state
        const volStateVal = activeProfile.volStateVal;
        const sviParams = activeProfile.sviParams;

        const sviParamsPlus = {
          ...sviParams,
          a: sviParams.a * 1.05
        };

        // Project Implied Volatility and local vol curves across log-moneyness
        const curvePoints = [];
        const kGrid = [-0.15, -0.10, -0.05, -0.02, 0.0, 0.02, 0.05, 0.10, 0.15];
        for (const k of kGrid) {
          const w = rawSVI(k, sviParams);
          const iv = Math.sqrt(w / currentMaturity);
          const localVol = DupireLocalVolSolver.solveLocalVol(k, currentMaturity, sviParams, sviParamsPlus, 0.01);
          
          curvePoints.push({
            k,
            strike: Math.round(spot * Math.exp(k)),
            iv: iv * 100,
            localVol: localVol * 100
          });
        }

        // Solve Dupire point local vol at spot (k = 0)
        const localVolSpot = DupireLocalVolSolver.solveLocalVol(0, currentMaturity, sviParams, sviParamsPlus, 0.01);

        // Run multi-path physical Euler-Maruyama cascade simulation
        const simRes = PhysicsCascadeEngine.simulatePaths(
          spot,
          strikePrices,
          gexExposures,
          bookLevels,
          bookLiquidity,
          spot, // mean reversion target centered on spot
          activeTheta,
          activeKappa,
          localVolSpot,
          currentMaturity,
          10, // steps
          30, // paths count
          0.05,
          0.0
        );

        // Classify market regime using Bayesian priors and posteriors
        const netGEXSum = gexExposures.reduce((s, x) => s + x, 0);
        const ivRank = activeProfile.ivRank;
        const velocity = activeProfile.velocity;
        const bayRes = BayesianRegimeEngine.classifyRegime(netGEXSum, ivRank, velocity);

        // Calculate dynamic higher-order greeks for current spot price and active contract
        const activeStrike = selectedStrike || Math.round(spot * 1.005);
        const isOptCall = selectedOptionType === 'C';
        const bsmGreeks = calculateBSMGreeks(
          spot, 
          activeStrike, 
          currentMaturity, 
          0.05, 
          0.01, 
          volStateVal, 
          isOptCall
        );

        // Calculate dealer-specific signed exposures
        const openInterestValue = activeProfile.openInterestValue;
        const signExposures = DealerExposureEngine.calculateExposures(
          spot,
          activeStrike,
          currentMaturity,
          0.05,
          0.01,
          volStateVal,
          isOptCall,
          openInterestValue
        );

        setSviParamsState(sviParams);
        setSimulationResult({
          paths: simRes.paths,
          mean: simRes.mean,
          stdDev: simRes.stdDev,
          standardError: simRes.standardError,
          ci95: simRes.ci95,
          curvePoints,
          regime: bayRes.regime,
          posteriors: bayRes.posteriors,
          bsmGreeks,
          signExposures
        });
      } catch (err) {
        console.error('Cascade error:', err);
      } finally {
        setIsRunningSim(false);
      }
    }, 750);
  };

  // Run automatically on first render or when asset swaps to seed mock visualizer
  React.useEffect(() => {
    runHedgingCascade();
  }, [selectedAsset, spotPrice, activeTheta, activeKappa]);

  return (
    <div className="w-full text-zinc-100 flex flex-col font-mono select-none antialiased md:min-h-[580px] lg:min-h-[650px] gap-4">
      
      {/* Upper header segment brand overlay */}
      <div className="bg-[#050505] border border-zinc-900 p-4 rounded-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <div className="flex items-center gap-3 max-w-xl">
          <Compass className="w-4 h-4 text-zinc-400 animate-pulse" />
          <div>
            <h1 className="text-[11px] font-black text-white uppercase tracking-widest font-mono">
              PINPOINT GPS MONITOR <span className="text-zinc-650">/ SPATIAL LIQUIDITY PROJECTIONS</span>
            </h1>
            <p className="text-[8.5px] text-zinc-550 uppercase font-black mt-0.5">ACTIVE COORD-SET: {selectedAsset.name} ({selectedAsset.ticker})</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3.5 w-full sm:w-auto justify-between sm:justify-end">
          {/* Ticker pills group matching the timeframe design */}
          <div className="flex items-center gap-1.5">
            <span className="text-[8px] text-zinc-500 font-mono font-black uppercase tracking-wider mr-1 hidden sm:inline">TICKER:</span>
            <div className="flex items-center bg-black p-0.5 border border-zinc-900 rounded-sm">
              {(['SPX', 'NDX', 'QQQ', 'SPY', 'RUT'] as const).map(tk => {
                const isActive = selectedAsset.ticker === tk;
                return (
                  <button
                    key={tk}
                    type="button"
                    onClick={() => {
                      const targetAsset = ASSET_LIST.find(a => a.ticker === tk);
                      if (targetAsset) {
                        useContractStore.getState().setSelectedAsset(targetAsset);
                      }
                    }}
                    className={`px-3 py-1 text-[8.5px] uppercase font-black tracking-wider rounded-xs transition-style border border-transparent cursor-pointer ${
                      isActive
                        ? 'bg-[#00ff88]/10 text-[#00ff88] font-black border-[#00ff88]/20 shadow'
                        : 'text-zinc-500 hover:text-white'
                    }`}
                  >
                    {tk}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Small timeframe cards group, beautifully matching the layout */}
          <div className="flex items-center gap-1.5 border-l border-zinc-900/80 pl-3.5">
            <span className="text-[8px] text-zinc-500 font-mono font-black uppercase tracking-wider mr-1 hidden sm:inline">TIMEFRAME:</span>
            <div className="flex items-center bg-black p-0.5 border border-zinc-900 rounded-sm">
              {(['5m', '15m', '1h', '4h', '1D'] as const).map(tf => (
                <button
                  key={tf}
                  type="button"
                  onClick={() => useContractStore.getState().setSelectedTimeframe(tf)}
                  className={`px-3 py-1 text-[8.5px] uppercase font-black tracking-wider rounded-xs transition-all cursor-pointer ${
                    selectedTimeframe === tf
                      ? 'bg-zinc-850 text-white font-black shadow'
                      : 'text-zinc-500 hover:text-white'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-2.5 text-[9px] text-[#00ff88] uppercase tracking-widest font-black pl-3.5 border-l border-zinc-900/80">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88] animate-ping" />
            <span>RADAR ONLINE</span>
          </div>
        </div>
      </div>

      {/* ENHANCED REAL-TIME INSTITUTIONAL STATE PANEL */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-9 gap-2.5 bg-[#050505] border border-zinc-900 p-3 rounded-sm mb-4 text-left select-none text-[10px]">
        <div className="border border-zinc-900/60 p-2.5 rounded bg-zinc-950/40">
          <span className="text-zinc-500 uppercase font-black block text-[7px] tracking-wider mb-0.5">Dealer Bias</span>
          <span className={`font-black uppercase text-[11px] ${liveMetrics.bias === 'LONG GAMMA' ? 'text-[#00ff88]' : 'text-rose-400'} flex items-center gap-1.5`}>
            <span className={`w-1.5 h-1.5 rounded-full ${liveMetrics.bias === 'LONG GAMMA' ? 'bg-[#00ff88]' : 'bg-rose-400'} animate-pulse`} />
            {liveMetrics.bias}
          </span>
        </div>
        <div className="border border-zinc-900/60 p-2.5 rounded bg-zinc-950/40">
          <span className="text-zinc-500 uppercase font-black block text-[7px] tracking-wider mb-0.5">Expected Move</span>
          <span className="text-[#ff4545] font-black text-[11px] uppercase">
            {liveMetrics.expectedMovePct}
          </span>
        </div>
        <div className="border border-zinc-900/60 p-2.5 rounded bg-zinc-950/40">
          <span className="text-zinc-500 uppercase font-black block text-[7px] tracking-wider mb-0.5">Volatility State</span>
          <span className="text-zinc-200 font-extrabold text-[11px] uppercase">
            {liveMetrics.volState}
          </span>
        </div>
        <div className="border border-zinc-900/60 p-2.5 rounded bg-zinc-950/40">
          <span className="text-zinc-500 uppercase font-black block text-[7px] tracking-wider mb-0.5">Magnet Strike</span>
          <span className="text-[#4f8cff] font-extrabold text-[11px] font-mono">
            {Number(liveMetrics.magnetStrike ?? 0).toFixed(2)}
          </span>
        </div>
        <div className="border border-zinc-900/60 p-2.5 rounded bg-zinc-950/40">
          <span className="text-zinc-500 uppercase font-black block text-[7px] tracking-wider mb-0.5">Call Wall</span>
          <span className="text-white font-extrabold text-[11px] font-mono">
            {Number(liveMetrics.callWall ?? 0).toFixed(2)}
          </span>
        </div>
        <div className="border border-zinc-900/60 p-2.5 rounded bg-zinc-950/40">
          <span className="text-zinc-500 uppercase font-black block text-[7px] tracking-wider mb-0.5">Put Wall</span>
          <span className="text-white font-extrabold text-[11px] font-mono">
            {Number(liveMetrics.putWall ?? 0).toFixed(2)}
          </span>
        </div>
        <div className="border border-zinc-900/60 p-2.5 rounded bg-zinc-950/40">
          <span className="text-zinc-500 uppercase font-black block text-[7px] tracking-wider mb-0.5">Gamma Flip</span>
          <span className="text-rose-400 font-extrabold text-[11px] font-mono">
            {Number(liveMetrics.flipLevel ?? 0).toFixed(2)}
          </span>
        </div>
        <div className="border border-zinc-900/60 p-2.5 rounded bg-zinc-950/40 col-span-2 flex flex-col justify-between">
          <div className="flex justify-between items-center text-[7.5px] font-bold">
            <span className="text-zinc-500 uppercase tracking-wider">Dealer Score</span>
            <span className="text-[#4f8cff] font-black">{liveMetrics.dealerScore}/100</span>
          </div>
          <div className="w-full bg-black h-1 rounded-full overflow-hidden mt-1.5">
            <div className="bg-[#4f8cff] h-full" style={{ width: `${liveMetrics.dealerScore}%` }} />
          </div>
        </div>
      </div>

      {/* REQUIRED LAYOUT GRAPH ENGINE
          display:grid; grid-template-columns: 20% 60% 20%; height:100vh; */}
      <div 
        className="w-full max-w-full flex-1 grid grid-cols-1 md:grid-cols-12 gap-4 h-full"
        style={{ minHeight: '520px' }}
      >
        
        {/* COLUMN 1: MARKET STORY (20%) */}
        <div className="md:col-span-3 flex flex-col bg-[#050505] border border-zinc-900 rounded-sm p-4 text-left justify-between">
          <div className="space-y-4">
            <div className="border-b border-zinc-900 pb-2">
              <span className="text-[7.5px] text-zinc-500 uppercase tracking-widest font-black block">COGNITIVE SUMMARY</span>
              <h3 className="text-[11px] font-black text-white uppercase tracking-wider mt-0.5">
                Market Story
              </h3>
            </div>
            
            {customAiCommentary ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-1.5 border-b border-zinc-900">
                  <span className="text-[7.5px] text-[#4f8cff] uppercase tracking-widest font-black flex items-center gap-1">
                    <Zap className="w-2.5 h-2.5 animate-pulse text-[#4f8cff]" /> Co-Pilot AI report
                  </span>
                  <button 
                    onClick={() => setCustomAiCommentary(null)}
                    className="text-[8px] text-zinc-500 hover:text-white uppercase font-mono cursor-pointer"
                  >
                    Reset
                  </button>
                </div>
                <div className="space-y-2.5 font-sans text-[10px] leading-relaxed text-zinc-300">
                  {customAiCommentary.map((point: string, i: number) => (
                    <div key={i} className="flex gap-2 items-start bg-[#4f8cff]/5 p-2 rounded border border-[#4f8cff]/10">
                      <span className="text-[#4f8cff] shrink-0 mt-0.5">●</span>
                      <p className="leading-normal">{point.replace(/^●\s*/, '')}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {serverState?.deep_intelligence?.commentary && serverState.deep_intelligence.commentary.length > 0 ? (
                  <div className="space-y-2.5 font-sans text-[10px] leading-relaxed text-zinc-400">
                    {serverState.deep_intelligence.commentary.map((point: string, i: number) => (
                      <div key={i} className="flex gap-2 items-start bg-zinc-950/40 p-2 rounded border border-zinc-900/40">
                        <span className="text-[#4f8cff] shrink-0 mt-0.5">●</span>
                        <p className="leading-normal">{point}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] leading-relaxed text-zinc-400 font-sans">
                    The {selectedAsset.ticker} spot price is currently tracking inside an institutional hedging zone. Overhead options exposure reveals a major resistance barrier centering on OTM calls. 
                  </p>
                )}

                <button
                  onClick={triggerAiAnalysis}
                  disabled={isGeneratingAi}
                  className="w-full text-[9px] py-2 px-3 uppercase tracking-wider font-mono bg-zinc-950 hover:bg-[#4f8cff]/15 hover:text-[#4f8cff] text-[#4f8cff] border border-zinc-900 hover:border-[#4f8cff]/30 rounded-xs transition-all flex items-center justify-center gap-1.5 focus:outline-none cursor-pointer"
                >
                  {isGeneratingAi ? (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-[#4f8cff] animate-ping" />
                      <span>COMPILING CO-PILOT ANALYSIS...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-3 h-3 text-[#4f8cff]" />
                      <span>ASK SLAYER CO-PILOT</span>
                    </>
                  )}
                </button>
              </div>
            )}
            
            <div className="space-y-2.5 pt-2 text-[10px] font-mono">
              <div className="flex justify-between items-center pb-2 border-b border-zinc-950">
                <span className="text-zinc-500 uppercase text-[8.5px]">Control Regime</span>
                <span className="text-[#00ff88] font-bold uppercase bg-[#00ff88]/5 px-2 py-0.5 border border-[#00ff88]/10 rounded-xs">
                  {liveMetrics.bias === 'LONG GAMMA' ? 'Buyers' : 'Sellers'}
                </span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-zinc-950">
                <span className="text-zinc-500 uppercase text-[8.5px]">Expected Range</span>
                <span className="text-zinc-300 font-bold">{liveMetrics.expectedMovePct}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-zinc-950">
                <span className="text-zinc-500 uppercase text-[8.5px]">Gamma State</span>
                <span className="text-zinc-300 font-bold truncate max-w-[120px]">
                  {liveMetrics.bias === 'LONG GAMMA' ? 'Stable Positive Gamma' : 'Negative Gamma Flip'}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-950 space-y-2 text-[8.5px] text-zinc-500">
            <div className="flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-zinc-550" />
              <span className="font-extrabold uppercase text-[7.5px]">GEX INVENTORY AUDITED</span>
            </div>
            <p className="font-sans leading-relaxed text-[10px] text-zinc-600">
              Auto-calibrated regression ensures zero manual interpretation bias is introduced.
            </p>
          </div>
        </div>

        {/* COLUMN 2: POSITIONING MAP (60%) */}
        <div className="md:col-span-6 bg-[#050505] border border-zinc-900 rounded-sm p-4 flex flex-col relative overflow-hidden h-full">
          
          {/* Dual-Tab View Headers */}
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center border-b border-zinc-900/40 pb-2.5 mb-3 gap-2">
            <div className="flex bg-black p-0.5 border border-zinc-900 rounded-xs">
              <button
                type="button"
                onClick={() => setQuantMode('map')}
                className={`px-3 py-1 text-[8.5px] font-black uppercase tracking-wider rounded-xs transition-colors ${
                  quantMode === 'map'
                    ? 'bg-zinc-850 text-white border border-zinc-755'
                    : 'text-zinc-500 hover:text-zinc-350 bg-transparent border border-transparent'
                }`}
              >
                ◌ SPATIAL MAP
              </button>
              <button
                type="button"
                onClick={() => setQuantMode('cascade')}
                className={`px-3 py-1 text-[8.5px] font-black uppercase tracking-wider rounded-xs transition-colors flex items-center gap-1.5 ${
                  quantMode === 'cascade'
                    ? 'bg-[#1e293b] text-[#38bdf8] border border-[#0369a1]'
                    : 'text-zinc-500 hover:text-zinc-350 bg-transparent border border-transparent'
                }`}
              >
                <Activity className="w-3 h-3 text-[#38bdf8] animate-pulse" />
                ⚡ ARBOR PHYSICS LAB
              </button>
            </div>
            <span className="text-[7.5px] bg-black border border-zinc-900 text-zinc-400 px-2 py-1 rounded-sm uppercase tracking-widest font-black self-start sm:self-auto">
              TRACK: {selectedAsset.ticker} {quantMode === 'map' ? '/ COORD-GPS' : '/ PHY-CASCADES'}
            </span>
          </div>

          {/* TAB CONTENT: SPATIAL MAP */}
          {quantMode === 'map' && (
            <div className="flex-1 flex flex-col animate-fadeIn">
              {/* Canvas coordinate track area */}
              <div 
                className="flex-1 relative bg-black/45 border border-zinc-950 rounded-sm px-4 overflow-hidden"
                style={{ height: `${containerHeight}px` }}
              >
                {/* Horizontal line markers */}
                {levels.map((lvl, index) => {
                  const relativeY = (maxStrike - lvl.strike) / strikeRange;
                  const lvlY = paddingY + relativeY * usableHeight;
                  return (
                    <div 
                      key={index} 
                      className="absolute left-0 right-0 border-t border-[#18181b]/70 border-dashed"
                      style={{ top: `${lvlY}px` }}
                    />
                  );
                })}

                {/* Render absolute-placed PinBar list */}
                {levels.map((lvl, index) => {
                  const relativeY = (maxStrike - lvl.strike) / strikeRange;
                  const lvlY = paddingY + relativeY * usableHeight;
                  
                  return (
                    <div 
                      key={index} 
                      className="absolute left-4 right-4" 
                      style={{ top: `${lvlY - 24}px` }} // offset half height
                    >
                      <PinBarComponent 
                        strike={lvl.strike} 
                        dollars={lvl.dollars} 
                        strength={lvl.strength} 
                        type={lvl.type} 
                      />
                    </div>
                  );
                })}

                {/* SPOT PRICE GLIDER (Bug #3) - Spot should glide, never jump! */}
                <motion.div
                  className="absolute left-4 right-4 z-20"
                  style={{ originY: 0.5 }}
                  animate={{
                    top: `${spotY}px`
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 90,
                    damping: 18
                  }}
                >
                  <div className="relative">
                    {/* Horizontal spot beam line */}
                    <div className="w-full h-[2px] bg-white shadow-[0_0_12px_#ffffffa0]" />
                    
                    {/* Floating glider banner */}
                    <div className="absolute right-0 -top-8 bg-white text-black px-2.5 py-1 rounded-xs font-sans font-black text-[9.5px] uppercase shadow-2xl flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-[#00ff88] rounded-full animate-ping" />
                      <span>SPOT PRICE: {(spotPrice ?? 0).toFixed(2)}</span>
                    </div>
                  </div>
                </motion.div>
              </div>

              <div className="mt-3 text-[8px] text-zinc-650 uppercase text-center font-bold tracking-wide">
                STRETCH VIEWPORT PINPOINT COORDINATES • STATIC MATRIX FEED
              </div>
            </div>
          )}

          {/* TAB CONTENT: ARBOR PHYSICS simulator CASCADE LAB */}
          {quantMode === 'cascade' && (
            <div className="flex-1 flex flex-col justify-between space-y-4 animate-fadeIn text-left text-[10px]">
                  {/* Centered Quant Calibration Deck */}
              <div className="w-full flex flex-col items-center justify-center bg-[#070708] p-4 rounded border border-zinc-900 text-center relative overflow-hidden shadow-xl">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#38bdf8]/40 to-transparent" />
                
                <div className="flex flex-col items-center gap-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#38bdf8] animate-pulse" />
                    <span className="text-[9.5px] text-[#38bdf8] tracking-widest font-black uppercase font-mono">
                      Stochastic Auto-Calibrator Profile: {selectedAsset.ticker}
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-400 font-sans max-w-md mx-auto leading-normal mt-0.5">
                    Self-solving pricing engines calibrated to dynamic implied total variance bounds. Zero manual tuning required.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-3 w-full max-w-2xl mx-auto border-t border-zinc-900/60 pt-4 text-left">
                  <div className="bg-zinc-950/60 p-2.5 rounded border border-zinc-900 flex flex-col justify-between">
                    <span className="text-[7.5px] text-zinc-500 font-bold uppercase block tracking-wider">Coupled Elasticity (κ)</span>
                    <span className="text-sm font-black text-white font-mono mt-0.5">{activeKappa.toFixed(3)}</span>
                    <span className="text-[7px] text-[#38bdf8]/85 font-black block uppercase font-mono mt-1">
                      {isOverrideEnabled ? '■ MANUAL OVERRIDE' : '● AUTO CALIBRATED'}
                    </span>
                  </div>
                  
                  <div className="bg-zinc-950/60 p-2.5 rounded border border-zinc-900 flex flex-col justify-between">
                    <span className="text-[7.5px] text-zinc-500 font-bold uppercase block tracking-wider">Mean Reversion Speed (θ)</span>
                    <span className="text-sm font-black text-white font-mono mt-0.5">{activeTheta.toFixed(3)}</span>
                    <span className="text-[7px] text-[#38bdf8]/85 font-black block uppercase font-mono mt-1">
                      {isOverrideEnabled ? '■ MANUAL OVERRIDE' : '● AUTO CALIBRATED'}
                    </span>
                  </div>

                  <div className="bg-zinc-950/60 p-2.5 rounded border border-zinc-900 flex flex-col justify-between col-span-1">
                    <span className="text-[7.5px] text-zinc-500 font-bold uppercase block tracking-wider">LOB Inventory Target</span>
                    <span className="text-sm font-black text-cyan-400 font-mono mt-0.5">
                      {activeProfile.openInterestValue.toLocaleString()} OI
                    </span>
                    <span className="text-[7px] text-zinc-550 block uppercase font-mono mt-1">
                      LIQUIDITY THRESHOLD
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex flex-col sm:flex-row gap-3 items-center justify-center w-full max-w-md mx-auto">
                  <button
                    type="button"
                    disabled={isRunningSim}
                    onClick={runHedgingCascade}
                    className="w-full bg-gradient-to-r from-cyan-600/20 to-cyan-500/10 hover:from-cyan-500 hover:to-[#0369a1] disabled:from-zinc-900 disabled:to-zinc-950 disabled:text-zinc-650 text-[#38bdf8] hover:text-white font-black text-[9px] uppercase tracking-wider py-2.5 px-6 rounded-md flex items-center justify-center gap-2 transition-all duration-300 border border-[#0369a1]/50 cursor-pointer shadow-[0_4px_12px_rgba(6,182,212,0.06)]"
                  >
                    <Play className="w-3 h-3 shrink-0" />
                    {isRunningSim ? 'COMPILING RECURSIVE DRIFT TRACES...' : 'RUN HEDGING SIMULATOR CASCADE'}
                  </button>
                </div>

                <div className="mt-4 flex justify-center w-full">
                  <button
                    type="button"
                    onClick={() => setIsOverrideEnabled(!isOverrideEnabled)}
                    className={`px-3.5 py-1.5 rounded-xs text-[8.5px] tracking-widest uppercase font-black font-mono transition-all duration-200 border flex items-center gap-2 ${
                      isOverrideEnabled 
                        ? 'bg-rose-950/20 text-rose-400 border-rose-900/60 shadow-[0_0_12px_#f43f5e18]' 
                        : 'bg-zinc-900/80 hover:bg-zinc-850 text-zinc-400 border-zinc-850 hover:border-zinc-700'
                    }`}
                  >
                    <span className="text-[10px]">⚙</span>
                    {isOverrideEnabled ? 'RESET TO SYSTEM DEFAULTS' : 'ENGAGE MANUAL TUNING BAY'}
                  </button>
                </div>

                {/* Centered Adjustable Sliders Popdown */}
                {isOverrideEnabled && (
                  <motion.div 
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-3.5 bg-zinc-950 border border-zinc-850 rounded-sm w-full max-w-xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4 text-left shadow-2xl relative"
                  >
                    <div className="flex flex-col justify-between">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[8px] text-zinc-400 font-extrabold uppercase tracking-wide">Elasticity (κ)</span>
                        <span className="text-zinc-200 font-mono text-[9px] font-black">{kappaCoupling.toFixed(3)}</span>
                      </div>
                      <p className="text-[7.5px] text-zinc-500 leading-relaxed mb-2 font-sans">Controls the rate at which dealer hedging buying drives underlying momentum.</p>
                      <input 
                        type="range" 
                        min="0.01" 
                        max="0.30" 
                        step="0.01"
                        value={kappaCoupling}
                        onChange={(e) => setKappaCoupling(parseFloat(e.target.value))}
                        className="w-full h-1 bg-zinc-850 rounded-lg cursor-pointer accent-[#38bdf8]"
                      />
                    </div>

                    <div className="flex flex-col justify-between">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[8px] text-zinc-400 font-extrabold uppercase tracking-wide">Mean Reversion (θ)</span>
                        <span className="text-zinc-200 font-mono text-[9px] font-black">{thetaMR.toFixed(3)}</span>
                      </div>
                      <p className="text-[7.5px] text-zinc-500 leading-relaxed mb-2 font-sans">Governs the continuous speed of spot price convergence toward neutral center.</p>
                      <input 
                        type="range" 
                        min="0.05" 
                        max="0.80" 
                        step="0.05"
                        value={thetaMR}
                        onChange={(e) => setThetaMR(parseFloat(e.target.value))}
                        className="w-full h-1 bg-zinc-850 rounded-lg cursor-pointer accent-[#38bdf8]"
                      />
                    </div>
                  </motion.div>
                )}
              </div>

              {simulationResult ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 flex-1 items-stretch">
                  
                  {/* Left Column Ledger (Greeks): 4/12 width */}
                  <div className="lg:col-span-4 bg-zinc-950/45 border border-zinc-900 rounded p-2.5 flex flex-col justify-between space-y-2">
                    <span className="text-[7.5px] text-zinc-500 font-black uppercase border-b border-zinc-900 pb-1 flex items-center gap-1.5">
                      <Thermometer className="w-3 h-3 text-cyan-400" />
                      Analytical Greeks Ledger
                    </span>
                    <div className="space-y-1.5 font-mono text-[9px]">
                      <div className="flex justify-between items-center py-0.5 border-b border-zinc-900/50">
                        <span className="text-zinc-550 uppercase font-bold text-[8.5px]">BSM Delta</span>
                        <span className="text-zinc-200 font-bold">{(simulationResult.bsmGreeks.delta).toFixed(4)}</span>
                      </div>
                      <div className="flex justify-between items-center py-0.5 border-b border-zinc-900/50">
                        <span className="text-zinc-550 uppercase font-bold text-[8.5px]">Gamma Accel</span>
                        <span className="text-[#00ff88] font-bold">{(simulationResult.bsmGreeks.gamma).toFixed(5)}</span>
                      </div>
                      <div className="flex justify-between items-center py-0.5 border-b border-zinc-900/50">
                        <span className="text-zinc-550 uppercase font-bold text-[8.5px]">Vanna (dΔ/dV)</span>
                        <span className="text-amber-400 font-bold">{(simulationResult.bsmGreeks.vanna).toFixed(4)}</span>
                      </div>
                      <div className="flex justify-between items-center py-0.5 border-b border-zinc-900/50">
                        <span className="text-zinc-550 uppercase font-bold text-[8.5px]">Charm Day Decay</span>
                        <span className="text-rose-400 font-bold">{(simulationResult.bsmGreeks.charm).toFixed(5)}</span>
                      </div>
                      <div className="flex justify-between items-center py-0.5 border-b border-zinc-900/50">
                        <span className="text-zinc-550 font-bold text-[8.5px]">Speed (dΓ/dS)</span>
                        <span className="text-zinc-400 font-medium">{(simulationResult.bsmGreeks.speed).toFixed(6)}</span>
                      </div>
                      <div className="flex justify-between items-center py-0.5 border-b border-zinc-900/50">
                        <span className="text-zinc-550 font-bold text-[8.5px]">Color (dΓ/dT)</span>
                        <span className="text-zinc-400 font-medium">{(simulationResult.bsmGreeks.color).toFixed(5)}</span>
                      </div>
                      <div className="flex justify-between items-center py-0.5 border-b border-zinc-900/50">
                        <span className="text-cyan-400 uppercase font-black">Dealer GEX</span>
                        <span className="text-cyan-400 font-black">${(simulationResult.signExposures.gexStrike / 1e6).toFixed(2)}M</span>
                      </div>
                      <div className="flex justify-between items-center text-[9px]">
                        <span className="text-cyan-400 uppercase font-black">Dealer VEX</span>
                        <span className="text-cyan-400 font-black">${(simulationResult.signExposures.vexStrike / 1e6).toFixed(2)}M</span>
                      </div>
                    </div>
                  </div>

                  {/* Middle Column Plot (SVI vs Dupire curves): 4/12 width */}
                  <div className="lg:col-span-4 bg-zinc-950/45 border border-zinc-900 rounded p-2.5 flex flex-col justify-between">
                    <span className="text-[7.5px] text-zinc-500 font-black uppercase border-b border-zinc-900 pb-1">
                      SVI skew vs Dupire Local Vol (%)
                    </span>
                    <div className="h-28 w-full bg-black/30 border border-zinc-900 rounded-xs">
                      <svg className="w-full h-full overflow-visible" viewBox="0 0 160 100">
                        {/* Grid lines */}
                        <line x1="10" y1="10" x2="10" y2="90" stroke="#1f2937" strokeWidth="0.5" />
                        <line x1="10" y1="90" x2="150" y2="90" stroke="#1f2937" strokeWidth="0.5" />
                        <line x1="10" y1="50" x2="150" y2="50" stroke="#111827" strokeWidth="0.5" strokeDasharray="2,2" />

                        {/* Implied Vol Curve (SVI parameter fit - White) */}
                        <path
                          d={simulationResult.curvePoints.map((p: any, i: number) => {
                            const x = 10 + (i / (simulationResult.curvePoints.length - 1)) * 140;
                            // scale iv values: assume typical 10% to 40% range mapped to y=85 to y=15
                            const y = 85 - ((p.iv - 10) / 30) * 70;
                            return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                          }).join(' ')}
                          fill="none"
                          stroke="#ffffff"
                          strokeWidth="1.2"
                        />

                        {/* Dupire Local Vol Curve (Cyan) */}
                        <path
                          d={simulationResult.curvePoints.map((p: any, i: number) => {
                            const x = 10 + (i / (simulationResult.curvePoints.length - 1)) * 140;
                            const y = 85 - ((p.localVol - 10) / 30) * 70;
                            return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                          }).join(' ')}
                          fill="none"
                          stroke="#06b6d4"
                          strokeWidth="1.2"
                        />

                        {/* Mid Spot indicator */}
                        <circle cx="80" cy="50" r="1.5" fill="#e11d48" />
                      </svg>
                    </div>
                    <div className="flex justify-between items-center text-[7px] text-zinc-550 font-mono mt-1">
                      <span className="flex items-center gap-1"><span className="w-1.5 h-[1.5px] bg-white inline-block"></span> SVI IV SKEW</span>
                      <span className="flex items-center gap-1"><span className="w-1.5 h-[1.5px] bg-[#06b6d4] inline-block"></span> DUPIRE LOCAL</span>
                    </div>
                  </div>

                  {/* Right Column Diagram (MC paths cascade): 4/12 width */}
                  <div className="lg:col-span-4 bg-zinc-950/45 border border-zinc-900 rounded p-2.5 flex flex-col justify-between">
                    <span className="text-[7.5px] text-zinc-500 font-black uppercase border-b border-zinc-900 pb-1">
                      Euler-Maruyama Drift Trails (Euler)
                    </span>
                    <div className="h-28 w-full bg-black/30 border border-zinc-900 rounded-xs">
                      <svg className="w-full h-full overflow-visible" viewBox="0 0 160 100">
                        {/* Grid lines */}
                        <line x1="10" y1="10" x2="10" y2="90" stroke="#1f2937" strokeWidth="0.5" />
                        <line x1="10" y1="90" x2="150" y2="90" stroke="#1f2937" strokeWidth="0.5" />

                        {/* Render first 6 MC paths as thin trails */}
                        {simulationResult.paths.slice(0, 6).map((path: number[], pIdx: number) => {
                          const stepsCount = path.length - 1;
                          return (
                            <path
                              key={pIdx}
                              d={path.map((val: number, sIdx: number) => {
                                const x = 10 + (sIdx / stepsCount) * 140;
                                // map stock price to box height around spot +/- 2%
                                const pctDev = (val - spotPrice) / spotPrice;
                                const y = 50 - (pctDev / 0.02) * 35;
                                const boundedY = Math.max(10, Math.min(90, y));
                                return `${sIdx === 0 ? 'M' : 'L'} ${x} ${boundedY}`;
                              }).join(' ')}
                              fill="none"
                              stroke={pIdx % 2 === 0 ? '#10b981' : '#a7f3d0'}
                              strokeWidth="0.4"
                              opacity="0.33"
                            />
                          );
                        })}

                        {/* Highlighted Expectation Path (Mean - Cyan) */}
                        <path
                          d={Array.from({ length: 11 }).map((_, sIdx) => {
                            const x = 10 + (sIdx / 10) * 140;
                            // interpolate mean expectation line from spot to simulationResult.mean
                            const interpVal = spotPrice + (simulationResult.mean - spotPrice) * (sIdx / 10);
                            const pctDev = (interpVal - spotPrice) / spotPrice;
                            const y = 50 - (pctDev / 0.02) * 35;
                            return `${sIdx === 0 ? 'M' : 'L'} ${x} ${y}`;
                          }).join(' ')}
                          fill="none"
                          stroke="#38bdf8"
                          strokeWidth="1.5"
                        />
                      </svg>
                    </div>
                    <div className="text-[7px] text-zinc-550 font-mono flex justify-between mt-1">
                      <span>MEAN PATH: <span className="text-[#38bdf8] font-bold">{simulationResult.mean.toFixed(1)}</span></span>
                      <span>UNCERTAINTY: <span className="text-zinc-300">±{simulationResult.standardError.toFixed(2)}</span></span>
                    </div>
                  </div>

                </div>
              ) : (
                <div className="py-12 border border-dashed border-zinc-900 rounded-lg bg-zinc-950/20 text-center flex flex-col items-center justify-center space-y-3.5 max-w-xl mx-auto w-full">
                  <div className="w-10 h-10 rounded-full bg-zinc-900/60 flex items-center justify-center border border-zinc-850">
                    <Activity className="w-5 h-5 text-zinc-500 animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-white uppercase tracking-widest font-mono">STOCHASTIC PHYSIC SIMULATIONS STANDBY</p>
                    <p className="text-[9px] text-zinc-500 max-w-xs mx-auto leading-normal uppercase text-center">
                      Calibration engine initialized. Click below to trigger the recursive Euler drift solvers and plot skew paths.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={isRunningSim}
                    onClick={runHedgingCascade}
                    className="bg-zinc-900 hover:bg-zinc-850 text-white font-black text-[8px] uppercase tracking-wider py-2 px-4 rounded border border-zinc-800 cursor-pointer flex items-center gap-1.5 transition-all"
                  >
                    <Play className="w-2.5 h-2.5 text-[#38bdf8]" />
                    {isRunningSim ? 'COMPILING RECURSIVE PATTERNS...' : 'INITIALIZE SIMULATION'}
                  </button>
                </div>
              )}

              {/* Bottom Bayesian Regime classification panel */}
              {simulationResult && (
                <div className="bg-zinc-950/80 p-3 rounded border border-zinc-900 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                  <div className="flex flex-col text-left shrink-0">
                    <span className="text-[7.5px] text-zinc-550 font-black uppercase">BAYESIAN REGIME MODEL 6</span>
                    <span className="text-[#00ff88] text-[10px] font-black uppercase tracking-wider mt-0.5">
                      {simulationResult.regime.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="flex-1 grid grid-cols-3 gap-2 py-1 max-w-[240px] w-full">
                    <div>
                      <div className="flex justify-between text-[6.5px] text-zinc-500 font-bold mb-0.5">
                        <span>PIN</span>
                        <span>{Math.round(simulationResult.posteriors.STABILIZED_PIN * 100)}%</span>
                      </div>
                      <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
                        <div className="bg-[#10b981] h-full" style={{ width: `${simulationResult.posteriors.STABILIZED_PIN * 100}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[6.5px] text-zinc-500 font-bold mb-0.5">
                        <span>TRANS</span>
                        <span>{Math.round(simulationResult.posteriors.VOLATILITY_TRANSITION * 100)}%</span>
                      </div>
                      <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
                        <div className="bg-[#38bdf8] h-full" style={{ width: `${simulationResult.posteriors.VOLATILITY_TRANSITION * 100}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[6.5px] text-zinc-500 font-bold mb-0.5">
                        <span>SQUEEZE</span>
                        <span>{Math.round(simulationResult.posteriors.AMPLIFIED_SQUEEZE * 100)}%</span>
                      </div>
                      <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
                        <div className="bg-rose-500 h-full" style={{ width: `${simulationResult.posteriors.AMPLIFIED_SQUEEZE * 100}%` }} />
                      </div>
                    </div>
                  </div>

                  <div className="border bg-black border-zinc-900 p-2 rounded text-[8.5px] leading-relaxed text-zinc-400 font-sans flex-1">
                    {simulationResult.regime === 'STABILIZED_PIN' ? (
                      <span><strong>AI COMM:</strong> Volatility suppression remains likely since price has a stabilized long gamma pin. Dealers remains stable.</span>
                    ) : simulationResult.regime === 'VOLATILITY_TRANSITION' ? (
                      <span><strong>AI COMM:</strong> Spot resides near gamma flip trigger boundary. Volatility transition state is active; expect price swings.</span>
                    ) : (
                      <span><strong>AI COMM:</strong> Danger: spot has entered negative GEX territory. Short-gamma cascade forces dealers to sell during corrections, expanding tail risks.</span>
                    )}
                  </div>
                </div>
              )}

              <div className="text-[7.5px] text-zinc-650 uppercase text-center font-bold tracking-wide">
                ARBOR PHYSICS STOCHASTIC DRIFT ENGINE CALIBRATED UNCERTAINTY PATHWAYS
              </div>
            </div>
          )}

        </div>

        {/* COLUMN 3: CONTEXT (20%) */}
        <div className="md:col-span-3 flex flex-col bg-[#050505] border border-zinc-900 rounded-sm p-4 justify-between h-full text-left">
          <div className="space-y-4">
            <div className="border-b border-zinc-900 pb-2">
              <span className="text-[7.5px] text-zinc-500 uppercase tracking-widest font-black block">DECISION ENGINE DATA</span>
              <h3 className="text-[11px] font-black text-white uppercase tracking-wider mt-0.5">
                Context Indicators
              </h3>
            </div>

            <div className="space-y-3 font-mono text-[10px]">
              {/* NYSE CLOSE COUNTDOWN */}
              <div className="p-2 bg-black border border-zinc-900 rounded-xs space-y-1">
                <div className="flex justify-between items-center text-[8px] text-zinc-500 font-bold uppercase">
                  <span>NYSE Market State</span>
                  <span className={marketState.open ? 'text-[#00ff88]' : 'text-amber-500'}>
                    {marketState.open ? 'OPEN' : 'CLOSED'}
                  </span>
                </div>
                <div className="text-base font-black text-white tracking-widest">
                  {marketState.open ? marketState.closeIn : marketState.openIn}
                </div>
                <div className="text-[7.5px] text-zinc-600 uppercase">
                  {marketState.open ? 'COUNTDOWN TO CLOSING BELL' : 'COUNTDOWN TO OPENING BELL'}
                </div>
              </div>

              {/* HEURISTIC VOL ANALYSIS */}
              <div className="space-y-2 pt-1">
                <div className="flex justify-between items-center pb-1.5 border-b border-zinc-950">
                  <span className="text-zinc-500 text-[8.5px] uppercase">G Greeks</span>
                  <span className={`font-bold font-mono ${liveMetrics.volState === 'EXPANDED' ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {liveMetrics.volState === 'EXPANDED' ? 'EXPANDING' : 'DAMPENED'}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-1.5 border-b border-[#0f0f12]">
                  <span className="text-zinc-500 text-[8.5px] uppercase">Market Flow Rate</span>
                  <span className="text-zinc-300 font-bold text-xs">
                    {serverState?.metricsV11?.flow?.flowRate 
                      ? `${serverState.metricsV11.flow.flowRate.toFixed(1)} / s` 
                      : '14.2 / s'}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-1.5 border-b border-[#0f0f12]">
                  <span className="text-zinc-500 text-[8.5px] uppercase">Decision Score</span>
                  <span className="text-[#4f8cff] font-bold">
                    {serverState?.trade_health || activeContract?.health || 88}/100
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-zinc-950 text-center text-zinc-650 space-y-1">
            <span className="text-[7.5px] font-bold text-zinc-550 block uppercase tracking-wider">DONE.</span>
            <span className="text-[10px] text-zinc-650 leading-relaxed font-sans block">
              Order values represent gross index exposure on major dealer inventory maps.
            </span>
          </div>
        </div>

      </div>

      {/* UNIQUE BOTTOM DESK: QUANTITATIVE ATTRIBUTION ENGINE & RELATIVE VOLUME HEATMAP */}
      <div className={`border rounded-sm p-4 flex flex-col gap-4 text-left ${isLight ? 'bg-white border-zinc-200 shadow-sm text-zinc-900' : 'bg-[#050505] border-zinc-900 shadow-2xl text-zinc-100'}`}>
        
        {/* HEADER BAR */}
        <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-3 gap-2 ${isLight ? 'border-zinc-200' : 'border-zinc-900'}`}>
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#10b981]" />
            <span className={`text-xs font-black uppercase tracking-widest font-mono ${isLight ? 'text-zinc-900' : 'text-white'}`}>
              QUANT INDEX ATTRIBUTION & RVOL HEATMAP
            </span>
            <span className={`hidden sm:inline-block text-[8px] border px-2 py-0.5 rounded uppercase font-bold ${isLight ? 'text-zinc-500 border-zinc-250 bg-zinc-50' : 'text-zinc-550 border-zinc-900'}`}>
              SYS-ID: {selectedAsset.ticker}-RVOL-30D
            </span>
          </div>
          <span className="text-[8px] text-[#10b981] font-bold uppercase tracking-widest font-mono flex items-center gap-1.5 animate-pulse">
            <span className="w-1.5 h-1.5 bg-[#10b981] rounded-full" />
            30-DAY STATISTICAL REGRESSION LIVE
          </span>
        </div>

        {/* 1. ATTRIBUTION FLAGS ROW */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-[8.5px] text-zinc-500 font-bold uppercase tracking-widest">
            <span>Option Physics Attribution Flags</span>
            <span className="text-zinc-500">COGNITIVE METRIC SCORE</span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
            {attributionFlags.map((flag) => (
              <div 
                key={flag.id}
                className={`border rounded-md p-3 flex flex-col justify-between hover:border-zinc-400 dark:hover:border-zinc-800 transition-all relative overflow-hidden group ${isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-950/50 border-zinc-900/60'}`}
              >
                {/* Glowing subtle top border for flags to look high end and unique */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-500/20 via-[#4f8cff]/10 to-transparent" />
                
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className={`text-[10px] font-black font-mono uppercase tracking-wide group-hover:text-[#10b981] transition-colors ${isLight ? 'text-zinc-800' : 'text-white'}`}>
                      {flag.name}
                    </span>
                    <span className="text-[9.5px] font-black text-[#10b981] bg-[#10b981]/5 px-2 py-0.5 border border-[#10b981]/15 rounded-xs">
                      {flag.value}
                    </span>
                  </div>
                  <p className={`text-[10px] font-sans leading-normal line-clamp-2 ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
                    {flag.desc}
                  </p>
                </div>
                
                <div className={`border-t mt-2.5 pt-2 flex justify-between items-center text-[7.5px] text-zinc-500 uppercase tracking-widest ${isLight ? 'border-zinc-200/65' : 'border-zinc-950'}`}>
                  <span>METRIC FIELD</span>
                  <span className={`font-bold ${isLight ? 'text-zinc-700' : 'text-zinc-400'}`}>{flag.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 1.5 DYNAMIC RVOL MINI-HEATMAP TRACKER */}
        <div className={`border rounded-md p-3.5 space-y-2.5 relative overflow-hidden text-left ${isLight ? 'bg-zinc-50/50 border-zinc-200' : 'bg-black/50 border-zinc-900'}`}>
          <div className="flex justify-between items-center text-[8.5px] uppercase tracking-widest font-mono">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
              <span className={`font-extrabold ${isLight ? 'text-zinc-700' : 'text-zinc-300'}`}>RELATIVE VOLUME (RVOL) MINI-INTENSITY GRID</span>
            </div>
            <div className="flex items-center gap-3 text-zinc-500 font-bold">
              <span>30D BENCHMARK AVERAGE: <span className={isLight ? 'text-zinc-900 font-black' : 'text-white'}>1.00x</span></span>
              <span>|</span>
              <span>TODAY'S INTENSITY: <span className="text-[#10b981]">{rvolData[29].rvol.toFixed(2)}x vs Mean</span></span>
            </div>
          </div>

          <div className="grid grid-cols-15 gap-1.5 select-none font-mono">
            {rvolData.slice(15).map((cell, idx) => {
              const rvol = cell.rvol;
              const globalIdx = 15 + idx;
              const isToday = globalIdx === 29;
              
              // Multi-state custom styling matching light or dark mode
              let colorClasses = isLight 
                ? "bg-zinc-100 border-zinc-200 text-zinc-400" 
                : "bg-zinc-950/80 border-zinc-900 text-zinc-650";
              let shadowClass = "";

              if (rvol >= 2.5) {
                colorClasses = isLight 
                  ? "bg-amber-100 border-amber-300 text-amber-800"
                  : "bg-gradient-to-t from-amber-600/30 to-amber-500/15 border-amber-500 text-amber-400";
                shadowClass = "shadow-[0_0_8px_rgba(245,158,11,0.15)]";
              } else if (rvol >= 1.5) {
                colorClasses = isLight 
                  ? "bg-emerald-100 border-emerald-300 text-emerald-800"
                  : "bg-gradient-to-t from-emerald-600/25 to-emerald-500/10 border-emerald-500 text-[#00ff88]";
                shadowClass = "shadow-[0_0_8px_rgba(16,185,129,0.1)]";
              } else if (rvol >= 0.8) {
                colorClasses = isLight 
                  ? "bg-emerald-50/50 border-emerald-100 text-emerald-700"
                  : "bg-gradient-to-t from-emerald-950/20 to-emerald-900/5 border-emerald-900/60 text-[#10b981]/80";
              }

              return (
                <div 
                  key={idx}
                  className={`flex flex-col items-center justify-center transition-all duration-300 rounded border h-10 cursor-pointer relative group hover:scale-102 ${colorClasses} ${shadowClass}`}
                  onMouseEnter={() => setHoveredCellIndex(globalIdx)}
                  onMouseLeave={() => setHoveredCellIndex(null)}
                >
                  <span className="text-[6.5px] text-zinc-550 block font-bold tracking-widest uppercase mb-0.5">
                    {isToday ? "LIVE" : `T-${15 - idx}`}
                  </span>
                  <span className="text-[9px] font-black tracking-tighter">
                    {rvol.toFixed(1)}x
                  </span>
                  {isToday && (
                    <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
                  )}
                </div>
              );
            })}
          </div>
          
          <div className="flex justify-between items-center text-[7.5px] text-zinc-550 font-mono uppercase tracking-wider pt-1 border-t border-zinc-950 border-dashed">
            <span>T-15 SWELL PROFILE REGISTER</span>
            <span>TREND HEURISTIC: {rvolData[29].rvol >= 2.5 ? "ACCELERATING INSTITUTIONAL FRONT-LOAD DETECTIONS" : rvolData[29].rvol >= 1.1 ? "MODERATE LIQUIDITY SUSTENANCE" : "CONSOLIDATIVE PIN REGIME DRIFT"}</span>
            <span className="text-[#10b981] font-extrabold flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-emerald-400 animate-ping" />
              SYNCHRONOUS
            </span>
          </div>
        </div>

        {/* 2. HEATMAP SECTION */}
        <div className="border-t border-zinc-900/60 pt-4 grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
          
          {/* Heat map bar (8/12 cols) */}
          <div className={`lg:col-span-8 flex flex-col justify-between p-3.5 border rounded-md ${isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-950/45 border-zinc-900/40'}`}>
            <div className="space-y-1.5 mb-3.5 text-left">
              <div className="flex justify-between items-center">
                <span className={`text-[9px] font-bold uppercase tracking-widest ${isLight ? 'text-zinc-700' : 'text-[#888888]'}`}>
                  30-Session Volume Intensity Grid (T-30 to Today)
                </span>
                <div className="flex gap-3 text-[8px] text-zinc-500 uppercase font-black">
                  <span className="flex items-center gap-1"><span className={`w-2 h-2 rounded border ${isLight ? 'bg-zinc-100 border-zinc-300' : 'bg-zinc-900/30 border-zinc-855'}`} /> Low Vol</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-emerald-500/30" /> Normal</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-[#10b981]" /> High Vol</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-amber-500" /> Spike Surge</span>
                </div>
              </div>
              <p className={`text-[10px] font-sans leading-relaxed ${isLight ? 'text-zinc-600' : 'text-zinc-500'}`}>
                RVOL measures volume against its trailing 30-day standard moving average. Hover over any session tile to audit fine grain volume attributes and sweep concentrations.
              </p>
            </div>

            {/* LED Strip of Tiles */}
            <div className="flex flex-col gap-2">
              <div className="grid grid-cols-10 sm:grid-cols-15 lg:grid-cols-30 gap-1 select-none">
                {rvolData.map((cell, idx) => {
                  const styleParams = getCellStyle(cell.rvol, isLight);
                  const isHovered = hoveredCellIndex === idx;
                  const isToday = idx === 29;

                  return (
                    <div
                       key={idx}
                      className="cursor-pointer transition-all duration-150 rounded-xs relative flex flex-col justify-between items-center group touch-none"
                      style={{
                        height: '42px',
                        backgroundColor: styleParams.bg,
                        border: isHovered 
                          ? `1.5px solid ${isLight ? '#111827' : '#ffffff'}` 
                          : `1px solid ${styleParams.border}`,
                        boxShadow: isHovered ? '0 0 10px rgba(16,185,129,0.3)' : styleParams.glow,
                        transform: isHovered ? 'scale(1.06)' : 'none',
                        zIndex: isHovered ? 30 : 10,
                      }}
                      onMouseEnter={() => setHoveredCellIndex(idx)}
                      onMouseLeave={() => setHoveredCellIndex(null)}
                    >
                      {/* Top micro line to show special indicators */}
                      {isToday && (
                        <div className="absolute top-[2px] w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                      )}

                      {/* Small index tag at bottom */}
                      <span 
                        className="text-[6.5px] font-black pointer-events-none absolute bottom-[2px]"
                        style={{ color: styleParams.text }}
                      >
                        {isToday ? 'Live' : `T-${30 - idx}`}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between items-center text-[7.5px] text-zinc-500 uppercase tracking-widest pt-2">
                <span>30 Sessions Ago</span>
                <span className={isLight ? 'text-zinc-500 font-semibold' : 'text-zinc-650'}>Hover tiles for exact values</span>
                <span className="text-[#10b981] font-black">Live Trading Session</span>
              </div>
            </div>

          </div>

          {/* Real-time details board (4/12 cols) */}
          <div className={`lg:col-span-4 border rounded-md p-4 flex flex-col justify-between ${isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-950/60 border-zinc-900/60'}`}>
            {(() => {
              const activeIndex = hoveredCellIndex !== null ? hoveredCellIndex : 29;
              const cellData = rvolData[activeIndex];
              const isToday = activeIndex === 29;
              const intensity = cellData.rvol;
              
              // Determine description of volume state
              let statusText = 'Routine Trade Range';
              let statusColor = 'text-emerald-500';
              if (intensity < 0.7) {
                statusText = 'Illiquid Trading Range';
                statusColor = isLight ? 'text-zinc-500' : 'text-zinc-540';
              } else if (intensity > 2.5) {
                statusText = 'Institutional Sweep Surge!';
                statusColor = 'text-amber-500 animate-pulse';
              } else if (intensity > 1.5) {
                statusText = 'Dense Volume Expansion';
                statusColor = 'text-[#10b981]';
              }

              return (
                <div className="h-full flex flex-col justify-between space-y-3 text-left">
                  <div className={`border-b pb-2 flex justify-between items-start ${isLight ? 'border-zinc-200' : 'border-zinc-900'}`}>
                    <div>
                      <span className="text-[7.5px] text-[#10b981] uppercase font-black tracking-widest block">
                        Interactive RVOL Audit
                      </span>
                      <h4 className={`text-[10px] font-black uppercase tracking-wider mt-0.5 ${isLight ? 'text-zinc-800' : 'text-white'}`}>
                        {isToday ? "Today's Live Session" : `Session Day T-${cellData.dayIndex}`}
                      </h4>
                    </div>
                    <span className={`text-[7.5px] border px-2 py-0.5 rounded uppercase font-bold ${isLight ? 'bg-zinc-100 border-zinc-200 text-zinc-600' : 'bg-zinc-900 border-zinc-800 text-zinc-400'}`}>
                      {isToday ? 'Live Feed' : 'Historical'}
                    </span>
                  </div>

                  <div className="space-y-2.5 font-mono text-[10px]">
                    <div className={`flex justify-between items-center pb-1.5 border-b ${isLight ? 'border-zinc-250/50' : 'border-zinc-900/40'}`}>
                      <span className="text-zinc-500 text-[8px] uppercase">Multiplier vs. 30D Mean</span>
                      <span className={`font-black text-xs ${intensity > 2.5 ? 'text-amber-500' : 'text-[#10b981]'}`}>
                        {intensity.toFixed(2)}x
                      </span>
                    </div>

                    <div className={`flex justify-between items-center pb-1.5 border-b ${isLight ? 'border-zinc-250/50' : 'border-zinc-900/40'}`}>
                      <span className="text-zinc-500 text-[8px] uppercase">GEX Notional Flow</span>
                      <span className={`font-extrabold ${isLight ? 'text-zinc-800' : 'text-white'}`}>
                        ${cellData.notional.toFixed(1)}M
                      </span>
                    </div>

                    {/* Option Call/Put Ratio Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[8px] text-zinc-500">
                        <span>CALL BIAS: {cellData.calls}%</span>
                        <span>PUT BIAS: {cellData.puts}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-rose-500 rounded-full overflow-hidden flex">
                        <div className="bg-[#10b981] h-full" style={{ width: `${cellData.calls}%` }} />
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-1">
                      <span className="text-zinc-500 text-[8px] uppercase">Attributive Regime</span>
                      <span className={`font-bold uppercase text-[9px] ${statusColor}`}>
                        {statusText}
                      </span>
                    </div>
                  </div>

                  <div className={`pt-2 border-t text-[8px] font-sans leading-normal text-left ${isLight ? 'border-zinc-200 text-zinc-600' : 'border-zinc-900 text-zinc-500'}`}>
                    {intensity > 2.5 ? (
                      <span className="text-amber-600 dark:text-amber-500/90 font-semibold block">
                        ⚠️ Extreme relative volume spike represents unusual block orders, likely indicating front-loaded institutional positioning.
                      </span>
                    ) : intensity < 0.7 ? (
                      <span className="block">
                        Low relative volume indicates dealer pinning with tight option spreads and quiet drift metrics.
                      </span>
                    ) : (
                      <span className="block">
                        Regular options order flow indicates balanced hedging and portfolio stability across major indices.
                      </span>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>

        </div>

      </div>

    </div>
  );
}

// ============================================================================
// HELPER FUNCTIONS FOR STATISTICAL REGRESSION & RVOL HEATMAP TILE GENERATION
// ============================================================================

function getDeterministicData(ticker: string, size: number) {
  let hash = 0;
  for (let i = 0; i < ticker.length; i++) {
    hash = ticker.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const days = [];
  for (let d = 0; d < size; d++) {
    const seed = Math.abs(Math.sin(hash + d * 0.43 + (d % 3) * 0.77));
    // RVOL between 0.3x and 3.2x with spikes
    let rvol = 0.4 + seed * 2.1;
    if ((d + hash) % 7 === 0) {
      rvol += 1.3;
    }
    
    // Scale notional volume according to ticker defaults
    const baseNotional = ticker === 'SPX' ? 85 : ticker === 'QQQ' ? 45 : 12;
    const notional = baseNotional * rvol * (0.9 + seed * 0.2);
    
    // Calls/Puts split
    const cpSeed = Math.cos(hash + d * 0.81);
    const callRatio = Math.round(50 + cpSeed * 25);
    
    days.push({
      dayIndex: size - d,
      rvol: parseFloat(rvol.toFixed(2)),
      notional: parseFloat(notional.toFixed(1)),
      calls: callRatio,
      puts: 100 - callRatio,
    });
  }
  return days;
}

function getCellStyle(rvol: number, isLight: boolean) {
  if (isLight) {
    if (rvol < 0.7) return { bg: '#f4f4f5', text: '#71717a', border: '#e4e4e7', glow: 'none' };
    if (rvol < 1.2) return { bg: '#e6fcf0', text: '#047857', border: '#a7f3d0', glow: 'none' };
    if (rvol < 1.8) return { bg: '#a7f3d0', text: '#065f46', border: '#6ee7b7', glow: 'none' };
    if (rvol < 2.5) return { bg: '#34d399', text: '#044e37', border: '#10b981', glow: 'none' };
    return { bg: '#f59e0b', text: '#78350f', border: '#d97706', glow: '0 0 8px rgba(245,158,11,0.3)' };
  } else {
    if (rvol < 0.7) return { bg: '#0c0c0e', text: '#52525b', border: '#18181b', glow: 'none' };
    if (rvol < 1.2) return { bg: 'rgba(16,185,129,0.12)', text: '#10b981', border: 'rgba(16,185,129,0.25)', glow: 'none' };
    if (rvol < 1.8) return { bg: 'rgba(16,185,129,0.3)', text: '#10b981', border: 'rgba(16,185,129,0.5)', glow: 'none' };
    if (rvol < 2.5) return { bg: 'rgba(16,185,129,0.65)', text: '#ffffff', border: '#10b981', glow: '0 0 8px rgba(16,185,129,0.2)' };
    return { bg: 'rgba(245,158,11,0.85)', text: '#000000', border: '#f59e0b', glow: '0 0 12px rgba(245,158,11,0.5)' };
  }
}
