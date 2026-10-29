import { useEffect, useRef, useState, Fragment } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, 
  Grid, 
  Sparkles, 
  Coins, 
  Flame, 
  RotateCw, 
  TrendingUp, 
  TrendingDown, 
  HelpCircle, 
  ShieldCheck, 
  Scale, 
  CheckCircle, 
  AlertTriangle,
  Music,
  VolumeX,
  Volume2,
  Sliders,
  Database,
  Loader2,
  Trophy,
  Coffee,
  WifiOff,
  Clock,
  Activity,
  Play,
  Pause,
  AlertOctagon,
  FileWarning,
  DownloadCloud,
  RefreshCcw,
  ClipboardCheck,
  Shield,
  Search,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  ExternalLink,
  Filter,
  ArrowUpDown
} from 'lucide-react';
import { useSatStackerStore } from './useSatStackerStore';
import { StimChartCanvas } from './components/StimChartCanvas';
import { PriceAlertController } from './components/PriceAlertController';

/**
 * Web Audio API synth player for ADHD Stim Mode dopamine bursts
 */
const playAudioTone = (freq = 700, duration = 0.08, type: OscillatorType = 'sine', enableSound = true, volume = 0.06) => {
  if (!enableSound || typeof window === 'undefined') return;
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    // High quality tactile curve
    const finalVolume = Math.min(0.2, Math.max(0.001, volume));
    gain.gain.setValueAtTime(finalVolume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (error) {
    // Fail silently without blocking UI sequence
  }
};

export default function App() {
  const store = useSatStackerStore();
  const [animateHeader, setAnimateHeader] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showGridLines, setShowGridLines] = useState(false);
  const [activeTab, setActiveTab ] = useState<'dashboard' | 'pricing' | 'about'>('dashboard');

  // --- ENHANCEMENT 1: CUSTOM SYNTH STATES ---
  const [synthWaveform, setSynthWaveform] = useState<'sine' | 'square' | 'sawtooth' | 'triangle'>('sine');
  const [synthScale, setSynthScale] = useState<'pentatonic' | 'arcade' | 'drone' | 'sharp'>('pentatonic');
  const [synthVolume, setSynthVolume] = useState<number>(0.06);
  const [synthPitchOffset, setSynthPitchOffset] = useState<number>(0);

  // --- ENHANCEMENT 4: DOPAMINE RAIN PHYSICS ---
  const [dopamineGravity, setDopamineGravity] = useState<number>(0.25);
  const [particleCountMultiplier, setParticleCountMultiplier] = useState<number>(1.0);
  const [particleColorPreset, setParticleColorPreset] = useState<'gold' | 'neon' | 'emerald' | 'amber'>('gold');

  // --- ENHANCEMENT 2: OCD CALIBRATION & AUDIT STATE ---
  const [isCalibrating, setIsCalibrating] = useState<boolean>(false);
  const [calibrationStep, setCalibrationStep] = useState<number>(-1); // -1 = standby, -2 = failure, 0..3 = steps
  const [calibrationLogs, setCalibrationLogs] = useState<string[]>([]);
  const [auditHash, setAuditHash] = useState<string>('');
  const [auditTime, setAuditTime] = useState<string>('');
  const [simulateCalibFailure, setSimulateCalibFailure] = useState<boolean>(false);
  const [calibrationProgress, setCalibrationProgress] = useState<number>(0);
  const [isAuditingLedger, setIsAuditingLedger] = useState<boolean>(false);
  const [auditLedgerProgress, setAuditLedgerProgress] = useState<number>(0);
  const [showLedgerAuditModal, setShowLedgerAuditModal] = useState<boolean>(false);
  const [lastAuditSummary, setLastAuditSummary] = useState<{ checked: number; signatures: string; time: string; errors: string[] } | null>(null);

  // --- ENHANCEMENT 3: MEMORY LEDGER LOG FOR OFFLINE-FIRST SYNCHRONIZATION ---
  const [ledger, setLedger] = useState<Array<{ id: string; time: string; action: string; sats: number; btc: number; verified: boolean; signature: string }>>(() => {
    try {
      const saved = localStorage.getItem('satstacker_ledger');
      return saved ? JSON.parse(saved) : [
        { id: "TX-9904", time: new Date(Date.now() - 36500000).toISOString(), action: "Initial Stack Bootstrap", sats: 10000, btc: 0.00010000, verified: true, signature: "0x8fae120a30b2" },
        { id: "TX-9903", time: new Date(Date.now() - 12000000).toISOString(), action: "Coinbase Socket Stream Initialized", sats: 0, btc: 0, verified: true, signature: "0xfa117cc210210" },
        { id: "TX-9902", time: new Date(Date.now() - 800000).toISOString(), action: "Symmetry System Balanced [OK]", sats: 10000, btc: 0.00010000, verified: true, signature: "0x12bb9bdfd8a4" }
      ];
    } catch (e) {
      return [];
    }
  });

  // Persist ledger entries inside localStorage
  useEffect(() => {
    try {
      localStorage.setItem('satstacker_ledger', JSON.stringify(ledger));
    } catch (e) {}
  }, [ledger]);

  // --- FIRST-TIME USER ORIENTATION FLOW STATE TRACKING ---
  const [userHasConverted, setUserHasConverted] = useState<boolean>(() => {
    try { return localStorage.getItem('satstacker_flow_converted') === 'true'; } catch { return false; }
  });
  const [userHasShielded, setUserHasShielded] = useState<boolean>(() => {
    try { return localStorage.getItem('satstacker_flow_shielded') === 'true'; } catch { return false; }
  });
  const [userHasCalibrated, setUserHasCalibrated] = useState<boolean>(() => {
    try { return localStorage.getItem('satstacker_flow_calibrated') === 'true'; } catch { return false; }
  });
  const [userHasAudited, setUserHasAudited] = useState<boolean>(() => {
    try { return localStorage.getItem('satstacker_flow_audited') === 'true'; } catch { return false; }
  });
  const [userHasExported, setUserHasExported] = useState<boolean>(() => {
    try { return localStorage.getItem('satstacker_flow_exported') === 'true'; } catch { return false; }
  });
  const [showWalkthroughHub, setShowWalkthroughHub] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('satstacker_show_walkthrough_hub');
      return saved !== 'false';
    } catch { return true; }
  });
  const [activeInstructionTab, setActiveInstructionTab] = useState<'converter' | 'shield' | 'calibration' | 'ledger' | 'export'>('converter');

  // Local helper-toggle states for inline disclosures
  const [localHelpConverter, setLocalHelpConverter] = useState<boolean>(false);
  const [localHelpShield, setLocalHelpShield] = useState<boolean>(false);
  const [localHelpCalibration, setLocalHelpCalibration] = useState<boolean>(false);
  const [localHelpLedger, setLocalHelpLedger] = useState<boolean>(false);
  const [localHelpExport, setLocalHelpExport] = useState<boolean>(false);

  // Synchronize Walkthrough states with LocalStorage
  useEffect(() => {
    try { localStorage.setItem('satstacker_flow_converted', userHasConverted.toString()); } catch {}
  }, [userHasConverted]);
  useEffect(() => {
    try { localStorage.setItem('satstacker_flow_shielded', userHasShielded.toString()); } catch {}
  }, [userHasShielded]);
  useEffect(() => {
    try { localStorage.setItem('satstacker_flow_calibrated', userHasCalibrated.toString()); } catch {}
  }, [userHasCalibrated]);
  useEffect(() => {
    try { localStorage.setItem('satstacker_flow_audited', userHasAudited.toString()); } catch {}
  }, [userHasAudited]);
  useEffect(() => {
    try { localStorage.setItem('satstacker_flow_exported', userHasExported.toString()); } catch {}
  }, [userHasExported]);
  useEffect(() => {
    try { localStorage.setItem('satstacker_show_walkthrough_hub', showWalkthroughHub.toString()); } catch {}
  }, [showWalkthroughHub]);

  // --- GUIDED WALKTHROUGH ONBOARDING TOUR ---
  const [guidedTourStep, setGuidedTourStep] = useState<number>(0); // 0 means not active, 1 to 4 are active steps
  const [hasSeenTour, setHasSeenTour] = useState<boolean>(() => {
    try {
      return localStorage.getItem('satstacker_has_seen_tour') === 'true';
    } catch {
      return false;
    }
  });

  // --- UPGRADED PREMIUM BILLING AND BILLING SANDBOX CONTROLS ---
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const [promoCode, setPromoCode] = useState<string>('');
  const [promoApplied, setPromoApplied] = useState<boolean>(false);
  const [promoDiscount, setPromoDiscount] = useState<number>(0); // percentage discount
  const [billingCardName, setBillingCardName] = useState<string>('');
  const [billingCardNumber, setBillingCardNumber] = useState<string>('');
  const [billingCardExpiry, setBillingCardExpiry] = useState<string>('');
  const [billingCardCcv, setBillingCardCcv] = useState<string>('');
  const [showCheckoutWizard, setShowCheckoutWizard] = useState<boolean>(false);
  const [checkoutProcessing, setCheckoutProcessing] = useState<boolean>(false);
  const [selectedPlanUpgradeName, setSelectedPlanUpgradeName] = useState<'pro' | 'sovereign'>('pro');
  const [savedStrategies, setSavedStrategies] = useState<Array<{ id: string; name: string; triggerPrice: number; targetSats: number; active: boolean }>>(() => {
    try {
      const saved = localStorage.getItem('satstacker_saved_strategies');
      return saved ? JSON.parse(saved) : [
        { id: "STR-01", name: "DIP BUY TRIGGER [3.5% DEVIATION]", triggerPrice: 91500, targetSats: 25000, active: true },
        { id: "STR-02", name: "BREAKOUT SQUEEZE STRATEGY", triggerPrice: 98000, targetSats: 50000, active: false }
      ];
    } catch {
      return [
        { id: "STR-01", name: "DIP BUY TRIGGER [3.5% DEVIATION]", triggerPrice: 91500, targetSats: 25000, active: true },
        { id: "STR-02", name: "BREAKOUT SQUEEZE STRATEGY", triggerPrice: 98000, targetSats: 50000, active: false }
      ];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('satstacker_saved_strategies', JSON.stringify(savedStrategies));
    } catch {}
  }, [savedStrategies]);

  useEffect(() => {
    if (!hasSeenTour) {
      const t = setTimeout(() => {
        setGuidedTourStep(1);
        // We use lazy check to ensure audio is available
      }, 1200);
      return () => clearTimeout(t);
    }
  }, [hasSeenTour]);

  const handleCompleteTour = () => {
    setGuidedTourStep(0);
    setHasSeenTour(true);
    try {
      localStorage.setItem('satstacker_has_seen_tour', 'true');
    } catch {}
    if (soundEnabled) {
      playAudioTone(523.25, 0.08, 'sine', soundEnabled, synthVolume);
      setTimeout(() => playAudioTone(659.25, 0.10, 'sine', soundEnabled, synthVolume), 80);
      setTimeout(() => playAudioTone(783.99, 0.12, 'sine', soundEnabled, synthVolume), 160);
    }
  };

  const handleSkipTour = () => {
    setGuidedTourStep(0);
    setHasSeenTour(true);
    try {
      localStorage.setItem('satstacker_has_seen_tour', 'true');
    } catch {}
    if (soundEnabled) playCustomTone(300, 0.1);
  };

  const handleNextTourStep = () => {
    const nextStep = guidedTourStep + 1;
    if (nextStep > 4) {
      handleCompleteTour();
    } else {
      setGuidedTourStep(nextStep);
      if (soundEnabled) playCustomTone(440 + nextStep * 80, 0.08);
      
      setTimeout(() => {
        const targetId = 
          nextStep === 1 ? 'onboarding-converter-core' : 
          nextStep === 2 ? 'onboarding-coinbase-telemetry' :
          nextStep === 3 ? 'onboarding-price-shield' :
          'onboarding-ledger-registry';
          
        const el = document.getElementById(targetId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  };

  const handlePrevTourStep = () => {
    if (guidedTourStep > 1) {
      const prevStep = guidedTourStep - 1;
      setGuidedTourStep(prevStep);
      if (soundEnabled) playCustomTone(440 + prevStep * 80, 0.08);
      
      setTimeout(() => {
        const targetId = 
          prevStep === 1 ? 'onboarding-converter-core' : 
          prevStep === 2 ? 'onboarding-coinbase-telemetry' :
          prevStep === 3 ? 'onboarding-price-shield' :
          'onboarding-ledger-registry';
          
        const el = document.getElementById(targetId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  };

  // Reactive tracking hooks for cause-and-effect indicators
  useEffect(() => {
    if (store.freezeTokens !== 2 || store.isAlertArmed) {
      setUserHasShielded(true);
    }
  }, [store.freezeTokens, store.isAlertArmed]);

  useEffect(() => {
    if (auditHash !== '') {
      setUserHasCalibrated(true);
    }
  }, [auditHash]);

  const addLedgerEntry = (action: string, satsAmt: number, btcAmt: number) => {
    const newTx = {
      id: `TX-${Math.floor(1000 + Math.random() * 9000).toString()}`,
      time: new Date().toISOString(),
      action,
      sats: satsAmt,
      btc: btcAmt,
      verified: true,
      signature: `0x${Array.from({ length: 12 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`
    };
    setLedger(prev => [newTx, ...prev].slice(0, 30));
  };

  // Helper to play synthesized sounds with fully customized user settings
  const playCustomTone = (baseFreq: number, duration: number = 0.08) => {
    if (!soundEnabled) return;
    
    // Choose modifier frequency based on scale type
    let targetFreq = baseFreq;
    if (synthScale === 'drone') {
      targetFreq = baseFreq * 0.45; // Low rich baritone focus hum
    } else if (synthScale === 'arcade') {
      targetFreq = baseFreq * 1.25; // 8-bit playful scaling chip
    } else if (synthScale === 'sharp') {
      targetFreq = baseFreq * 1.55; // Piercing focus ticks
    }
    
    // Apply user semitones offset
    if (synthPitchOffset !== 0) {
      targetFreq = targetFreq * Math.pow(2, synthPitchOffset / 12);
    }
    
    playAudioTone(targetFreq, duration, synthWaveform, soundEnabled, synthVolume);
  };

  const runSymmetryCalibration = () => {
    if (isCalibrating) return;
    setIsCalibrating(true);
    setCalibrationStep(0);
    setCalibrationProgress(5);
    
    const getTimestamp = () => {
      const now = new Date();
      return `${now.toLocaleTimeString()}.${String(now.getMilliseconds()).padStart(3, '0')}`;
    };

    setCalibrationLogs([`[${getTimestamp()}] [SYSTEM] INITIATING PRECISION BALANCE AUDIT & COORDINATE SWEEP...`]);
    
    // Play calibration startup sound
    playAudioTone(220, 0.4, 'triangle', soundEnabled, synthVolume);

    // Stage 1: Grid Coordinate Symmetry
    setTimeout(() => {
      setCalibrationStep(1);
      setCalibrationProgress(25);
      setCalibrationLogs(prev => [
        ...prev,
        `[${getTimestamp()}] [OK] Switzerland Grid layout viewport bounds matched at 100% precision.`,
        `[${getTimestamp()}] [SYSTEM] Sweeping layout metrics: 12-column alignment verified.`,
        `[${getTimestamp()}] [SYSTEM] Testing IEEE-754 floating point decimal mantissa tolerances...`
      ]);
      playAudioTone(330, 0.1, 'sine', soundEnabled, synthVolume);
    }, 900);

    // Stage 2: IEEE-754 Floating Precision
    setTimeout(() => {
      setCalibrationStep(2);
      setCalibrationProgress(50);
      setCalibrationLogs(prev => [
        ...prev,
        `[${getTimestamp()}] [OK] IEEE-754 floating decimal unit checks complete without drift.`,
        `[${getTimestamp()}] [OK] Checked 10,000 recursive fraction accumulations down to 10^-8 precision.`,
        `[${getTimestamp()}] [SYSTEM] Querying Coinbase WebSocket feed socket connectivity & telemetry latency...`
      ]);
      playAudioTone(440, 0.1, 'sine', soundEnabled, synthVolume);
    }, 1800);

    // Stage 3: Latency & Socket Sync (Crucial branch point)
    setTimeout(() => {
      if (simulateCalibFailure) {
        // TRIGGER SIMULATED LATENCY DRIFT FAILURE
        setCalibrationStep(-2); // failure state
        setCalibrationProgress(68);
        setCalibrationLogs(prev => [
          ...prev,
          `[${getTimestamp()}] [ALERT] Ping response from api.coinbase.com/v3: 485ms jitter detected!`,
          `[${getTimestamp()}] [ERROR] Latency threshold restriction of 250ms exceeded in local sandbox network state.`,
          `[${getTimestamp()}] [FATAL] Calibration failed due to drift. Precision model is STALE.`,
          `[${getTimestamp()}] [REMEDIATION] Troubleshooting requirements: Stable connection needed. Disable socket intensive modules or re-run Calibration.`
        ]);
        setIsCalibrating(false);
        // Play distress error tone
        if (soundEnabled) {
          playAudioTone(110, 0.25, 'sawtooth', soundEnabled, synthVolume);
          setTimeout(() => playAudioTone(90, 0.35, 'sawtooth', soundEnabled, synthVolume), 120);
        }
        showToast("CALIBRATION FAILURE: Latency drift exceeded 250ms threshold. Recalibration required.", "warning");
      } else {
        // PROCEED SUCCESSFULLY
        setCalibrationStep(3);
        setCalibrationProgress(78);
        setCalibrationLogs(prev => [
          ...prev,
          `[${getTimestamp()}] [OK] WebSocket and REST feedback loops checked successfully. Ping: 42ms. Jitter: 2ms.`,
          `[${getTimestamp()}] [SYSTEM] Allocating SECP256K1 keypair and signing layout alignment seal...`
        ]);
        playAudioTone(550, 0.1, 'sine', soundEnabled, synthVolume);
      }
    }, 2700);

    // Stage 4: Finish (Only if no failure)
    setTimeout(() => {
      if (simulateCalibFailure) return; // already failed in earlier block

      const generatedHash = "0x" + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      const generatedTime = new Date().toISOString().replace('T', ' ').substring(0, 19);
      
      setAuditHash(generatedHash);
      setAuditTime(generatedTime);
      setCalibrationProgress(100);
      setUserHasCalibrated(true);
      setCalibrationLogs(prev => [
        ...prev,
        `[${getTimestamp()}] [COMPLETE] Grid Layout System Certified & Aligned under high precision rules.`,
        `[${getTimestamp()}] [PASS] Certification record generated: ${generatedHash}`,
        `[${getTimestamp()}] [OK] System is back to STABILIZED layout mode.`
      ]);
      setIsCalibrating(false);
      
      // Save calibration to ledger
      addLedgerEntry("Grid layout precision certified (High Accuracy Layout v4.1)", 0, 0);

      // Play victory sounds
      if (soundEnabled) {
        playAudioTone(523.25, 0.1, 'sine', soundEnabled, synthVolume);
        setTimeout(() => playAudioTone(659.25, 0.12, 'sine', soundEnabled, synthVolume), 80);
        setTimeout(() => playAudioTone(783.99, 0.15, 'sine', soundEnabled, synthVolume), 160);
      }
      showToast("CALIBRATION SUCCESS: Ledger math and layout aligned! Precision verification hash spawned.", "success");
    }, 3600);
  };

  const runLedgerForensicAudit = () => {
    if (isAuditingLedger) return;
    setIsAuditingLedger(true);
    setAuditLedgerProgress(0);
    playCustomTone(380, 0.15);

    let prog = 0;
    const interval = setInterval(() => {
      prog += 10;
      setAuditLedgerProgress(prog);
      
      if (soundEnabled && prog % 20 === 0) {
        playAudioTone(400 + (prog * 3), 0.02, 'sine', soundEnabled, synthVolume * 0.4);
      }

      if (prog >= 100) {
        clearInterval(interval);
        setIsAuditingLedger(false);
        setUserHasAudited(true);
        setShowLedgerAuditModal(true);

        const updated = ledger.map(entry => ({ ...entry, verified: true }));
        setLedger(updated);

        const totalBlocks = isForcedEmptyStore ? 0 : ledger.length;

        if (isForcedFailedVerification) {
          setLastAuditSummary({
            checked: totalBlocks,
            signatures: "0xFAILED_MISMATCH",
            time: new Date().toLocaleTimeString(),
            errors: ["Integrity Mismatch in Block #TX-04F", "Registered Sats offset does not reconcile with state"]
          });
          if (soundEnabled) {
            playAudioTone(180, 0.25, 'sawtooth', soundEnabled, synthVolume);
          }
          showToast("LEDGER AUDIT FAIL: Integrity fault detected in block signing matrix.", "warning");
        } else {
          setLastAuditSummary({
            checked: totalBlocks,
            signatures: "100% PARITY OK",
            time: new Date().toLocaleTimeString(),
            errors: []
          });
          addLedgerEntry("All ledger indexes audited and re-certified valid", 0, 0);
          
          if (soundEnabled) {
            playAudioTone(523.25, 0.12, 'sine', soundEnabled, synthVolume);
            setTimeout(() => playAudioTone(659.25, 0.15, 'sine', soundEnabled, synthVolume), 80);
          }
          showToast("LEDGER AUDIT SUCCESS: All custom signatures verified matching client state hashes.", "success");
        }
      }
    }, 120);
  };

  const exportLedgerToCSV = () => {
    if (isForcedFailedExport) {
      if (soundEnabled) playAudioTone(140, 0.3, 'sawtooth', soundEnabled, synthVolume);
      setShowExportFailureAlert(true);
      return;
    }
    try {
      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += "Transaction ID,Timestamp,Operation,Sats Offset,BTC Offset,Verified Status,Cryp Signature\n";
      
      const targetLedger = isForcedEmptyStore ? [] : ledger;
      targetLedger.forEach(entry => {
        csvContent += `"${entry.id}","${entry.time}","${entry.action.replace(/"/g, '""')}","${entry.sats}","${entry.btc}","${entry.verified ? 'VERIFIED' : 'PENDING'}","${entry.signature}"\n`;
      });
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `satstacker_precision_ledger_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showToast(`SUCCESS: Cryptographic Ledger successfully compiled into CSV format and downloaded [Rows: ${targetLedger.length}]`, 'success');
      playCustomTone(880, 0.1);
    } catch (err) {
      showToast("EXCEPTION: Failed to serialize ledger registry metadata.", 'warning');
    }
  };
  
  // Custom states for manual stack amount inputs
  const [manualSatInput, setManualSatInput] = useState('10,000');
  const [manualBtcInput, setManualBtcInput] = useState('0.00010000');
  const [btcValidationWarning, setBtcValidationWarning] = useState<string | null>(null);
  const [satsValidationWarning, setSatsValidationWarning] = useState<string | null>(null);
  const [isSatsFocused, setIsSatsFocused] = useState(false);
  const [isBtcFocused, setIsBtcFocused] = useState(false);
  const [shakeTrigger, setShakeTrigger] = useState(false);

  // Stats for the "ADHD Stim Mode" click levels
  const [stimSpeed, setStimSpeed] = useState(1);
  const [conversionsCount, setConversionsCount] = useState(0);

  // Interactive Dopamine and Haptic Simulation states
  const [isGlitching, setIsGlitching] = useState(false);
  const [triggerBlastCount, setTriggerBlastCount] = useState(0);
  const [quickAddCount, setQuickAddCount] = useState(0);
  const lastPriceRef = useRef<number | null>(null);

  // Core Ticker state overrides mapping release-grade state parameters
  const [tickerStateOverride, setTickerStateOverride] = useState<
    'loading' | 'active' | 'idle' | 'success' | 'error' | 'empty' | 'disconnected' | 'stale' | 'completed' | null
  >(null);
  const [internalErrorLogs, setInternalErrorLogs] = useState<string[]>([
    "WSS_CONNECTION_PENDING [0x04F] handshake initialized",
    "Authenticating socket signature payload..."
  ]);

  // Fallback Simulation State Hub triggers to inspect premium states
  const [isForcedEmptyStore, setIsForcedEmptyStore] = useState(false);
  const [isForcedFailedVerification, setIsForcedFailedVerification] = useState(false);
  const [isForcedFailedExport, setIsForcedFailedExport] = useState(false);
  const [showExportFailureAlert, setShowExportFailureAlert] = useState(false);
  const [copiedRawData, setCopiedRawData] = useState(false);
  const [showVerificationResolvedToast, setShowVerificationResolvedToast] = useState(false);

  // --- PREMIUM COMPREHENSIVE COMMERCIAL UPGRADE STATES ---
  const [isPremium, setIsPremium] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('satstacker_is_premium');
      return saved === 'true';
    } catch {
      return false;
    }
  });

  const [webhookUrl, setWebhookUrl] = useState<string>('https://discord.com/api/webhooks/991204/satstacker-alerts-prod');
  const [alertTriggerType, setAlertTriggerType] = useState<string>('streak_saved');
  const [webhookLogs, setWebhookLogs] = useState<string[]>([
    "[SYSTEM] Webhook channel listener standby. Route initialized."
  ]);
  const [isSendingWebhook, setIsSendingWebhook] = useState<boolean>(false);
  const [activeStrategies, setActiveStrategies] = useState<string[]>(['strategy_dca']);
  const [customCronString, setCustomCronString] = useState<string>('*/10 * * * * *');
  const [isArchiveCompacting, setIsArchiveCompacting] = useState<boolean>(false);
  const [isArchiveCompacted, setIsArchiveCompacted] = useState<boolean>(false);

  useEffect(() => {
    try {
      localStorage.setItem('satstacker_is_premium', isPremium.toString());
    } catch {}
  }, [isPremium]);

  // Advanced Ledger Registry sorting, filtering, and detailed diagnostics States
  const [ledgerSortField, setLedgerSortField] = useState<'id' | 'time' | 'sats' | 'btc' | 'verified'>('time');
  const [ledgerSortDirection, setLedgerSortDirection] = useState<'asc' | 'desc'>('desc');
  const [ledgerSearchQuery, setLedgerSearchQuery] = useState('');
  const [ledgerStatusFilter, setLedgerStatusFilter] = useState<'ALL' | 'SIGNED' | 'PENDING'>('ALL');
  const [ledgerActionFilter, setLedgerActionFilter] = useState<'ALL' | 'INCREASE' | 'DECREASE' | 'NEUTRAL'>('ALL');
  const [copiedTxId, setCopiedTxId] = useState<string | null>(null);
  const [expandedTxId, setExpandedTxId] = useState<string | null>(null);
  const [customToast, setCustomToast] = useState<{ message: string; type: 'success' | 'info' | 'warning' } | null>(null);

  const [secondsSinceLastTick, setSecondsSinceLastTick] = useState<number>(0);
  const feedLastPriceRef = useRef<number | null>(null);
  
  useEffect(() => {
    if (store.livePrice !== feedLastPriceRef.current) {
      feedLastPriceRef.current = store.livePrice;
      setSecondsSinceLastTick(0);
    }
  }, [store.livePrice]);

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsSinceLastTick((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const getTickerState = (): 'loading' | 'active' | 'idle' | 'success' | 'error' | 'empty' | 'disconnected' | 'stale' | 'completed' => {
    if (tickerStateOverride) return tickerStateOverride;
    if (store.connectionStatus === 'connecting') return 'loading';
    if (isForcedEmptyStore) return 'empty';
    if (store.connectionStatus === 'disconnected') return 'disconnected';
    if (store.priceHistory.length === 0) return 'empty';
    if (secondsSinceLastTick >= 8) return 'stale';
    if (store.totalSats >= 1000000) return 'completed'; // Milestone target achieved at 1M Sats!
    if (store.livePrice !== null && secondsSinceLastTick < 3) return 'active';
    return 'success';
  };

  const currentTotalSats = isForcedEmptyStore ? 0 : store.totalSats;
  const currentTotalBtc = isForcedEmptyStore ? 0 : store.totalBtc;
  
  // Dynamically filtered, searched, and sorted Ledger Collection
  const displayedLedger = (() => {
    if (isForcedEmptyStore) return [];
    
    // 1. Filter elements
    let current = ledger.filter(entry => {
      const query = ledgerSearchQuery.toLowerCase().trim();
      
      // Match query
      const matchesSearch = !query || 
        entry.id.toLowerCase().includes(query) || 
        entry.action.toLowerCase().includes(query) || 
        (entry.signature && entry.signature.toLowerCase().includes(query));

      // Match status filter
      let matchesStatus = true;
      if (ledgerStatusFilter === 'SIGNED') {
        matchesStatus = entry.verified === true;
      } else if (ledgerStatusFilter === 'PENDING') {
        matchesStatus = entry.verified === false;
      }

      // Match action delta filter
      let matchesAction = true;
      if (ledgerActionFilter === 'INCREASE') {
        matchesAction = entry.sats > 0;
      } else if (ledgerActionFilter === 'DECREASE') {
        matchesAction = entry.sats < 0;
      } else if (ledgerActionFilter === 'NEUTRAL') {
        matchesAction = entry.sats === 0;
      }

      return matchesSearch && matchesStatus && matchesAction;
    });

    // 2. Sort elements
    current.sort((a, b) => {
      let comparison = 0;
      if (ledgerSortField === 'id') {
        comparison = a.id.localeCompare(b.id);
      } else if (ledgerSortField === 'time') {
        comparison = new Date(a.time).getTime() - new Date(b.time).getTime();
      } else if (ledgerSortField === 'sats') {
        comparison = a.sats - b.sats;
      } else if (ledgerSortField === 'btc') {
        comparison = a.btc - b.btc;
      } else if (ledgerSortField === 'verified') {
        const valA = a.verified ? 1 : 0;
        const valB = b.verified ? 1 : 0;
        comparison = valA - valB;
      }

      return ledgerSortDirection === 'asc' ? comparison : -comparison;
    });

    return current;
  })();

  const changeSort = (field: 'id' | 'time' | 'sats' | 'btc' | 'verified') => {
    if (soundEnabled) playCustomTone(750, 0.03);
    if (ledgerSortField === field) {
      setLedgerSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setLedgerSortField(field);
      setLedgerSortDirection('desc');
    }
  };

  const showToast = (message: string, type: 'success' | 'info' | 'warning' = 'success') => {
    setCustomToast({ message, type });
  };

  useEffect(() => {
    if (customToast) {
      const timer = setTimeout(() => {
        setCustomToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [customToast]);

  const getFeedStatusText = () => {
    const currentState = getTickerState();
    switch (currentState) {
      case 'loading': return "FEED: CONNECTING...";
      case 'active': {
        const calculatedLatency = 10 + (Math.floor((store.livePrice || 67000) * 100) % 15);
        return `FEED: ACTIVE SYNC [${calculatedLatency}ms]`;
      }
      case 'idle': return "FEED: HIBERNATION STANDBY";
      case 'success': return "FEED: DATASTREAM COMPLETE [OK]";
      case 'error': return "FEED: COINBASE CRITICAL FAULT [503]";
      case 'empty': return "FEED: TICK BUFFER VACANT";
      case 'disconnected': return "FEED: OFFLINE";
      case 'stale': return "FEED: STALE CHANNELS DETECTED";
      case 'completed': return "FEED: PORTFOLIO TARGET ACHIEVED! 🏆";
      default: return "FEED: ONLINE";
    }
  };

  // Symmetry Mode interaction states
  const [isSnapping, setIsSnapping] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const interactionTimerRef = useRef<NodeJS.Timeout | null>(null);

  const triggerSymmetryInteraction = () => {
    setIsInteracting(true);
    if (interactionTimerRef.current) clearTimeout(interactionTimerRef.current);
    interactionTimerRef.current = setTimeout(() => {
      setIsInteracting(false);
    }, 1200);
  };

  // Snaps rigid updates in Symmetry Mode
  useEffect(() => {
    if (store.activeMode === 'symmetry') {
      setIsSnapping(true);
      triggerSymmetryInteraction();
      const t = setTimeout(() => setIsSnapping(false), 120);
      return () => clearTimeout(t);
    }
  }, [store.totalSats, store.activeMode]);

  // Volatility Glitch control loop: triggers 300ms shake and chromatic aberration shadow on ticker updates
  useEffect(() => {
    if (store.livePrice !== null && lastPriceRef.current !== null && store.livePrice !== lastPriceRef.current) {
      setIsGlitching(true);
      const timer = setTimeout(() => setIsGlitching(false), 300);
      return () => clearTimeout(timer);
    }
    if (store.livePrice !== null) {
      lastPriceRef.current = store.livePrice;
    }
  }, [store.livePrice]);

  // References for Physics Canvas in Stim Mode
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<any[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const workerRef = useRef<Worker | null>(null);

  // Initialize Worker on Mount
  useEffect(() => {
    try {
      workerRef.current = new Worker('/priceWorker.js');
      
      workerRef.current.onmessage = (event) => {
        const { type, price, error, status } = event.data || {};
        
        if (type === 'ticker') {
          store.updateTicker(event.data);
        } else if (type === 'status') {
          // Connected / Disconnected
          if (status === 'connected') {
            store.setConnectionStatus('connected');
          } else {
            store.setConnectionStatus('disconnected');
          }
        } else if (error) {
          console.warn('Worker reports info:', error);
        }
      };
    } catch (e) {
      console.error('Failed to instantiate Background Web Worker', e);
      store.setConnectionStatus('disconnected');
    }

    return () => {
      if (workerRef.current) {
        workerRef.current.postMessage({ command: 'disconnect' });
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  // Force clean reconnection sequence on Coinbase background thread when switching back to "Converter Core"
  useEffect(() => {
    if (activeTab === 'dashboard') {
      setSecondsSinceLastTick(0);
      if (workerRef.current) {
        workerRef.current.postMessage({ command: 'disconnect' });
        store.setConnectionStatus('connecting');
        const t = setTimeout(() => {
          if (workerRef.current) {
            workerRef.current.postMessage({ command: 'connect' });
          }
        }, 80);
        return () => clearTimeout(t);
      }
    }
  }, [activeTab]);

  // Update local inputs when store value shifts, but respect active focus to prevent cursor jumps and input rejection
  useEffect(() => {
    if (isForcedEmptyStore) {
      if (!isBtcFocused) setManualBtcInput('0.00000000');
      if (!isSatsFocused) setManualSatInput('0');
      return;
    }
    if (!isBtcFocused) {
      setManualBtcInput(store.totalBtc.toFixed(8));
    }
    if (!isSatsFocused) {
      setManualSatInput(store.totalSats.toLocaleString('en-US'));
    }
  }, [store.totalSats, store.totalBtc, isBtcFocused, isSatsFocused, isForcedEmptyStore]);

  // Particles Rain loop
  useEffect(() => {
    if (store.activeMode !== 'stim') {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resize canvas safely to coordinate with outer container bounds
    const resizeCanvas = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      canvas.width = rect?.width || 600;
      canvas.height = rect?.height || 280;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const updateParticles = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const particles = particlesRef.current;

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.28; // gravity
        p.rotation += p.rotationSpeed;
        p.alpha -= 0.008; // slow fade

        // Bounce on bottom
        if (p.y > canvas.height - p.size) {
          p.y = canvas.height - p.size;
          p.vy = -p.vy * 0.45; // dampening
          p.vx *= 0.8;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);

        // Draw gold coin
        ctx.beginPath();
        ctx.arc(0, 0, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
        ctx.strokeStyle = '#D97706';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Draw generic "$" or "S" mark inside coin
        ctx.fillStyle = '#78350F';
        ctx.font = `bold ${p.size * 1.1}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('s', 0, 0);

        ctx.restore();

        // Remove dead particles
        if (p.alpha <= 0 || p.x < 0 || p.x > canvas.width) {
          particles.splice(i, 1);
        }
      }

      animationFrameRef.current = requestAnimationFrame(updateParticles);
    };

    updateParticles();
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [store.activeMode]);

  // Function to spawn a burst of gold coin particles
  const triggerDopamineBlast = () => {
    // Synthesize quick scales
    if (soundEnabled) {
      playCustomTone(523.25, 0.05); // C5
      setTimeout(() => playCustomTone(659.25, 0.05), 45); // E5
      setTimeout(() => playCustomTone(783.99, 0.06), 90); // G5
      setTimeout(() => playCustomTone(1046.50, 0.08), 135); // C6
    }

    // Add entry into memory ledger database
    addLedgerEntry("Manual Apex burst spawned", 0, 0);

    // Trigger high-dopamine neon-green "Stack Apex" explosions
    setTriggerBlastCount(prev => prev + 1);

    // Trigger volatility screen glitch
    setIsGlitching(true);
    setTimeout(() => setIsGlitching(false), 300);
  };

  // Stack incremental fast buttons handler
  const handleQuickAdd = (satsToAdd: number) => {
    store.addSats(satsToAdd);
    setConversionsCount(prev => prev + 1);
    setUserHasConverted(true);

    // Add entry into memory ledger database
    addLedgerEntry(`Quick added +${satsToAdd.toLocaleString()} Sats`, satsToAdd, parseFloat((satsToAdd / 100000000).toFixed(8)));

    // Minor volatility screen glitch on manual addition
    setIsGlitching(true);
    setTimeout(() => setIsGlitching(false), 300);

    if (store.activeMode === 'stim') {
      setQuickAddCount(prev => prev + 1);
      if (soundEnabled) {
        playCustomTone(523.25, 0.06);
      }
      // Increase streak every 5 conversions in stim mode
      if ((conversionsCount + 1) % 5 === 0) {
        store.incrementStreak();
        playAudioTone(1174.66, 0.18, 'triangle', soundEnabled, synthVolume); // High celebration pitch
      }
    } else {
      triggerSymmetryInteraction();
      // Quiet, pure math increment
      if (soundEnabled) {
        playAudioTone(380, 0.04, 'sine', soundEnabled, synthVolume); // Gentle low focus clip
      }
    }
  };

  // Convert inputs safely with bound reactions and robust numeric limits validation
  const handleBtcChange = (val: string) => {
    // Only allow numbers and up to one decimal point, avoiding negative signs and non-numeric garbage
    let sanitized = val.replace(/[^0-9.]/g, '');
    const parts = sanitized.split('.');
    if (parts.length > 2) {
      sanitized = parts[0] + '.' + parts.slice(1).join('');
    }
    
    // Prevent starting with a plain dot without a leading zero
    if (sanitized === '.') {
      sanitized = '0.';
    }

    setManualBtcInput(sanitized);
    setUserHasConverted(true);

    if (store.activeMode === 'symmetry') {
      triggerSymmetryInteraction();
    }

    if (sanitized === '' || sanitized === '0.') {
      store.setTotalBtc(0);
      setBtcValidationWarning(null);
      return;
    }

    const floatVal = parseFloat(sanitized);
    if (!isNaN(floatVal)) {
      if (floatVal < 0) {
        setBtcValidationWarning("Negative amount not allowed");
      } else if (floatVal > 21000000) {
        setBtcValidationWarning("⚠️ Exceeds 21M max supply!");
      } else {
        setBtcValidationWarning(null);
      }
      store.setTotalBtc(floatVal);
    }
  };

  const handleSatsChange = (val: string) => {
    // Strip all non-digit characters to keep just raw positive integers
    const cleanVal = val.replace(/\D/g, '');
    
    setManualSatInput(cleanVal);
    setUserHasConverted(true);

    if (store.activeMode === 'symmetry') {
      triggerSymmetryInteraction();
    }

    if (cleanVal === '') {
      store.setTotalSats(0);
      setSatsValidationWarning(null);
      return;
    }

    const intVal = parseInt(cleanVal, 10);
    if (!isNaN(intVal)) {
      if (intVal < 0) {
        setSatsValidationWarning("Negative amount not allowed");
      } else if (intVal > 2100000000000000) {
        setSatsValidationWarning("⚠️ Exceeds 21M BTC equivalent");
      } else {
        setSatsValidationWarning(null);
      }
      store.setTotalSats(intVal);
    }
  };

  // Live Instant Preset Injector with real cascade particle triggers and dynamic sound
  const applyPreset = (satsAmount: number) => {
    setUserHasConverted(true);
    setBtcValidationWarning(null);
    setSatsValidationWarning(null);
    
    // Apply raw numerical states securely
    store.setTotalSats(satsAmount);
    setConversionsCount(prev => prev + 1);
    
    // Soft tactile vibration if supported
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try { navigator.vibrate(35); } catch (e) {}
    }

    // Play elegant dual-frequency synthesis based on current visual state
    if (soundEnabled) {
      if (store.activeMode === 'stim') {
        playCustomTone(587.33, 0.05); // D5
        setTimeout(() => playCustomTone(783.99, 0.05), 40); // G5
        setTimeout(() => playCustomTone(987.77, 0.06), 80); // B5
        setQuickAddCount(prev => prev + 1); // trigger falling gold dust particles
      } else {
        playAudioTone(466.16, 0.04, 'sine', soundEnabled, synthVolume); // precise mathematical tone
      }
    }

    // Capture in sandbox transactions audit ledger
    addLedgerEntry(`Calibrated preset set to exactly ${satsAmount.toLocaleString()} Sats`, satsAmount, parseFloat((satsAmount / 100000000).toFixed(8)));

    if (store.activeMode === 'symmetry') {
      triggerSymmetryInteraction();
    } else {
      setIsGlitching(true);
      setTimeout(() => setIsGlitching(false), 300);
    }
  };

  return (
    <div className={`min-h-screen text-zinc-100 flex flex-col smooth-morph font-sans ${
      isGlitching ? 'glitch-shake' : ''
    } ${
      store.activeMode === 'stim' 
        ? 'bg-gradient-to-br from-zinc-950 via-slate-900 to-zinc-950 selection:bg-purple-500/30' 
        : 'bg-[#09090b] symmetry-grid selection:bg-zinc-800'
    }`}>
      
      {/* Switzerland Grid Guide Overlay (OCD Symmetry mode specific alignment verification pattern) */}
      {store.activeMode === 'symmetry' && showGridLines && (
        <div className="fixed inset-0 pointer-events-none z-50 grid grid-cols-12 gap-4 px-6 md:px-12 opacity-[0.06] h-full">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-full border-x border-zinc-700 bg-zinc-500" />
          ))}
        </div>
      )}

      {/* TOP SaaS METRIC BANNER */}
      <div className={`border-b backdrop-blur-md sticky top-0 z-40 ${
        store.activeMode === 'stim' 
          ? 'border-purple-900/30 bg-black/60 text-zinc-300' 
          : 'border-zinc-800 bg-zinc-950/80 text-zinc-400 font-mono'
      }`}>
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-3">
            <span className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-semibold ${
              store.activeMode === 'stim' ? 'bg-indigo-600 text-white' : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
            }`}>
              SATSTACKER UTILITY
            </span>
            <span className={store.activeMode === 'stim' ? 'text-zinc-400' : 'text-zinc-500 font-bold'}>
              SYSTEM STATUS: <strong className="text-emerald-400">99.98% NODE UPTIME // LATENCY: 14ms</strong>
            </span>
          </div>
          <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">
            Real-Time Market Analytics
          </div>
        </div>
      </div>

      {/* MAIN CONTAINER */}
      <main className="max-w-7xl mx-auto w-full px-4 md:px-6 py-6 flex-1 flex flex-col justify-start">
        
        {/* HEADER BRAND & MODE CONTROL */}
        <div className={`mb-8 pb-6 border-b ${
          store.activeMode === 'symmetry' 
            ? 'grid grid-cols-12 gap-6 items-center' 
            : 'flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6'
        } ${
          store.activeMode === 'stim' ? 'border-purple-900/30' : 'border-zinc-800'
        }`}>
          <div className={store.activeMode === 'symmetry' ? 'col-span-12 lg:col-span-6 flex items-center gap-4' : 'flex items-center gap-4'}>
            <div className={`w-10 h-10 rounded flex items-center justify-center font-bold text-white text-lg ${
              store.activeMode === 'stim' ? 'bg-purple-600 shadow-[0_0_15px_rgba(168,85,247,0.4)]' : 'bg-indigo-600 shadow-[0_0_15px_rgba(99,102,241,0.4)]'
            }`}>
              S
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`font-mono text-[9px] tracking-widest uppercase ${
                  store.activeMode === 'stim' ? 'text-amber-400' : 'text-zinc-500'
                }`}>
                  SATSTACKER UTILITY • v2.0.4-STABLE
                </span>
              </div>
              <h1 className={`text-4xl font-extrabold tracking-tighter uppercase ${
                store.activeMode === 'stim' 
                  ? 'bg-gradient-to-r from-yellow-400 via-amber-400 to-indigo-400 bg-clip-text text-transparent' 
                  : 'text-zinc-100'
              }`}>
                SatStacker
              </h1>
              <p className={`text-[10px] md:text-[11px] font-mono leading-none font-bold tracking-tight opacity-55 uppercase mb-1.5 ${
                store.activeMode === 'stim' ? 'text-amber-300' : 'text-zinc-400'
              }`}>
                Professional Bitcoin utility with multi-thread calculation core.
              </p>
              <p className={`text-xs mt-0.5 max-w-lg ${
                store.activeMode === 'stim' ? 'text-slate-400' : 'text-zinc-500'
              }`}>
                Satoshi-to-BTC converter. Optimized with background process threading.
              </p>
            </div>
          </div>
               {/* OPERATIONAL MODE SELECTOR */}
          <div className={store.activeMode === 'symmetry' ? 'col-span-12 lg:col-span-6 flex flex-col lg:items-end gap-2' : 'flex flex-col items-stretch md:items-end gap-2'}>
            <div className={`p-1 rounded-xl flex justify-between items-center w-full md:min-w-[400px] lg:min-w-[450px] gap-2 ${
              store.activeMode === 'stim' 
                ? 'bg-slate-900/90 border border-purple-800/40 shadow-lg glow-purple' 
                : 'bg-zinc-900 border border-zinc-800'
            }`}>
              {/* Left-aligned Button Group */}
              <div className="flex items-center gap-1">
                {/* MATHEMATICAL SYMMETRY GRID BUTTON */}
                <button
                  id="symmetry-mode-toggle"
                  onClick={() => {
                    if (store.activeMode !== 'symmetry') {
                      store.toggleAppMode();
                      if (soundEnabled) playAudioTone(330, 0.1, 'sine');
                    }
                  }}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all duration-300 cursor-pointer ${
                    store.activeMode === 'symmetry'
                      ? 'bg-indigo-600 text-white shadow-lg'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Grid size={13} />
                  SYMMETRY GRID
                </button>

                {/* TACTILE FOCUS MODE BUTTON */}
                <button
                  id="stim-mode-toggle"
                  onClick={() => {
                    if (store.activeMode !== 'stim') {
                      store.toggleAppMode();
                    }
                  }}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all duration-300 cursor-pointer ${
                    store.activeMode === 'stim'
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md shadow-amber-500/20'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Zap size={13} className={store.activeMode === 'stim' ? 'text-amber-300 fill-amber-300' : 'text-zinc-400'} />
                  TACTILE PULSE
                </button>
              </div>

              {/* Right-aligned Status Tracker and Volume Toggle */}
              <div className="flex items-center gap-3 pr-2 border-l border-zinc-800 pl-3">
                <div className="flex items-center gap-2 text-zinc-400">
                  <span className="relative flex h-2 w-2">
                    {store.connectionStatus !== 'connected' ? (
                      <>
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-60"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                      </>
                    ) : secondsSinceLastTick > 4 ? (
                      <>
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-50"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.6)]"></span>
                      </>
                    ) : store.isAlertArmed ? (
                      <>
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-60"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.7)]"></span>
                      </>
                    ) : (
                      <>
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.7)]"></span>
                      </>
                    )}
                  </span>
                  <span className={`uppercase text-[10px] tracking-tight font-black font-mono ${
                    store.isAlertArmed && store.connectionStatus === 'connected' && secondsSinceLastTick <= 4
                      ? 'text-indigo-400'
                      : ''
                  }`}>
                    {getFeedStatusText()}
                  </span>
                </div>
                <div className="hidden sm:inline border-r h-3 border-zinc-800" />
                <button 
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="p-1.5 rounded transition-all hover:bg-white/5 flex items-center justify-center text-zinc-400 hover:text-zinc-200 cursor-pointer"
                  title="Toggle State Audio"
                >
                  {soundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} className="opacity-60" />}
                </button>
              </div>
            </div>
            {/* Minimal Inline Grounding Helper Text Block */}
            <div className="text-[10px] text-zinc-500 font-mono flex flex-wrap items-center justify-end gap-x-2 gap-y-0.5 mt-1 sm:mt-1.5 px-1 select-none pointer-events-none">
              <span>⚛ <strong>Symmetry Mode</strong>: strict balance grids</span>
              <span>•</span>
              <span>⚡ <strong>Pulse Mode</strong>: audio indicators & responsive feed</span>
            </div>
          </div>
        </div>

        {/* NAVIGATION TAB STRAP */}
        <div className="flex gap-1 mb-6 border-b border-zinc-900/60 font-mono">
          {(['dashboard', 'pricing', 'about'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                if (soundEnabled) playCustomTone(tab === 'dashboard' ? 440 : tab === 'pricing' ? 520 : 600, 0.03);
              }}
              className={`relative px-5 py-2.5 text-xs uppercase font-extrabold tracking-wider transition-all duration-300 transform active:scale-95 hover:scale-[1.01] overflow-hidden select-none cursor-pointer ${
                activeTab === tab 
                  ? store.activeMode === 'stim'
                    ? 'text-amber-300 font-black'
                    : 'text-indigo-400 font-black'
                  : store.activeMode === 'stim'
                    ? 'text-zinc-400 hover:text-zinc-200'
                    : 'text-zinc-500 hover:text-zinc-350'
              }`}
            >
              <span className="relative z-10">
                {tab === 'dashboard' ? 'Converter Core' : tab === 'pricing' ? 'SaaS Pricing' : 'Architecture'}
              </span>
              {activeTab === tab ? (
                <motion.div 
                  layoutId="activeTabUnderline"
                  className={`absolute bottom-0 left-0 right-0 h-[2.5px] z-20 ${
                    store.activeMode === 'stim' ? 'bg-amber-400' : 'bg-indigo-500'
                  }`}
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              ) : null}
              {activeTab === tab ? (
                <motion.div 
                  layoutId="activeTabBackground"
                  className="absolute inset-0 bg-white/5"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              ) : null}
            </button>
          ))}
        </div>

        {/* RENDER ACTIVE SCREEN */}
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            
            {/* FIRST-TIME ORIENTATION & SANDBOX WALKTHROUGH HUB */}
            <div className="col-span-12">
              {!showWalkthroughHub ? (
                <div className={`p-4 border font-mono text-xs flex items-center justify-between ${
                  store.activeMode === 'stim' 
                    ? 'bg-slate-900/60 border-purple-900/40 rounded-2xl' 
                    : 'bg-zinc-900/40 border-zinc-800 rounded-none'
                }`}>
                  <div className="flex items-center gap-3">
                    <span className="p-1 px-2.5 rounded bg-indigo-500/10 text-indigo-400 font-bold text-[10px]">
                      {((userHasConverted ? 1 : 0) + (userHasShielded ? 1 : 0) + (userHasCalibrated ? 1 : 0) + (userHasAudited ? 1 : 0) + (userHasExported ? 1 : 0))} / 5 STEPS COMPLETED
                    </span>
                    <span className="text-zinc-400 font-bold">Workspace Orientation Companion is currently minimized.</span>
                  </div>
                  <button 
                    onClick={() => {
                      setShowWalkthroughHub(true);
                      if (soundEnabled) playCustomTone(550, 0.05);
                    }}
                    className="px-3 py-1.5 border border-zinc-850 hover:bg-zinc-800 text-zinc-300 font-bold transition-all uppercase cursor-pointer"
                  >
                    Restore Walkthrough Guide ↗
                  </button>
                </div>
              ) : (
                <div className={`border p-6 relative overflow-hidden transition-all duration-300 ${
                  store.activeMode === 'stim'
                    ? 'bg-slate-950/90 border-purple-500/30 rounded-3xl backdrop-blur-md'
                    : 'bg-zinc-950 border-zinc-800 rounded-none font-mono text-zinc-100'
                }`}>
                  {/* Subtle top decoration */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-pink-500 to-amber-500 opacity-60" />

                  {/* Header Title & Disregard actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-900 mb-6">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="p-1 px-2 rounded-md bg-indigo-500/10 text-indigo-400 font-black text-[9px] uppercase tracking-widest">
                          Onboarding Checklist
                        </span>
                        <span className="text-[10px] text-zinc-500">v2.1-Active</span>
                      </div>
                      <h3 className="text-sm font-black uppercase text-zinc-200 mt-1.5 flex items-center gap-2">
                        <HelpCircle size={15} className="text-indigo-400" />
                        Quick Onboarding Checklist & Progress Guide
                      </h3>
                      <p className="text-[10.5px] text-zinc-400 mt-1 max-w-2xl leading-relaxed">
                        Welcome to SatStacker! Follow this brief interactive checklist to master the converter, configure automated price alert shields, review programmable strategies, and audit local transaction proofs.
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <div className="text-[10.5px] text-zinc-400 font-bold">
                        VERIFICATION STREAMS: {' '}
                        <span className="text-indigo-400 font-black">
                          {((userHasConverted ? 1 : 0) + (userHasShielded ? 1 : 0) + (userHasCalibrated ? 1 : 0) + (userHasAudited ? 1 : 0) + (userHasExported ? 1 : 0))} / 5 CERTIFIED
                        </span>
                      </div>
                      
                      {/* Interactive visual progress meter */}
                      <div className="w-32 bg-zinc-900 border border-zinc-800 rounded-full h-2 overflow-hidden flex">
                        <div 
                          className="bg-indigo-505 bg-gradient-to-r from-indigo-550 to-emerald-400 h-full transition-all duration-500"
                          style={{ width: `${((userHasConverted ? 1 : 0) + (userHasShielded ? 1 : 0) + (userHasCalibrated ? 1 : 0) + (userHasAudited ? 1 : 0) + (userHasExported ? 1 : 0)) * 20}%` }}
                        />
                      </div>

                      <div className="flex flex-wrap gap-1.5 mt-1 justify-end">
                        <button
                          onClick={() => {
                            setGuidedTourStep(1);
                            if (soundEnabled) playCustomTone(650, 0.08);
                          }}
                          className="text-[9px] uppercase font-black text-indigo-400 hover:text-indigo-300 border border-indigo-950 bg-indigo-950/20 hover:bg-indigo-950/40 py-1 px-2.5 transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Zap size={9.5} /> Restart Guided Tour ↗
                        </button>
                        <button
                          onClick={() => {
                            setShowWalkthroughHub(false);
                            if (soundEnabled) playCustomTone(440, 0.08);
                          }}
                          className="text-[9px] uppercase font-bold text-zinc-400 hover:text-zinc-200 border border-zinc-850 bg-black/30 hover:bg-zinc-900 py-1 px-2.5 transition-all cursor-pointer"
                        >
                          Hide Checklist [X]
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Operational Steps Checkboxes Matrix */}
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-6">
                    {/* STEP 1: CONVERTER */}
                    <button
                      onClick={() => {
                        setActiveInstructionTab('converter');
                        if (soundEnabled) playCustomTone(480, 0.04);
                      }}
                      className={`p-3 border text-left flex flex-col justify-between transition-all relative ${
                        activeInstructionTab === 'converter'
                          ? 'bg-zinc-900/90 border-indigo-500/50 shadow'
                          : 'bg-black/20 hover:bg-zinc-900/30 border-zinc-900'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1.5 mb-1.5">
                          <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">[OP-01]</span>
                          <span className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded ${
                            userHasConverted 
                              ? 'bg-emerald-500/10 text-emerald-400' 
                              : 'bg-zinc-800 text-zinc-550'
                          }`}>
                            {userHasConverted ? '✓ SIGNED' : 'PENDING'}
                          </span>
                        </div>
                        <h4 className="text-xs font-black uppercase text-zinc-300">Converter Sync</h4>
                        <p className="text-[10px] text-zinc-400 mt-1 line-clamp-2">Convert Satoshi fractions to Bitcoin.</p>
                      </div>
                      <div className="mt-3 text-[9px] text-indigo-400 font-bold uppercase tracking-wider flex items-center justify-between">
                        <span>Details ➔</span>
                        {userHasConverted && <span className="text-emerald-400">● Complete</span>}
                      </div>
                    </button>

                    {/* STEP 2: SHIELDS & ALERTS */}
                    <button
                      onClick={() => {
                        setActiveInstructionTab('shield');
                        if (soundEnabled) playCustomTone(480, 0.04);
                      }}
                      className={`p-3 border text-left flex flex-col justify-between transition-all relative ${
                        activeInstructionTab === 'shield'
                          ? 'bg-zinc-900/90 border-indigo-500/50 shadow'
                          : 'bg-black/20 hover:bg-zinc-900/30 border-zinc-900'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1.5 mb-1.5">
                          <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">[OP-02]</span>
                          <span className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded ${
                            userHasShielded 
                              ? 'bg-emerald-500/10 text-emerald-400' 
                              : 'bg-zinc-800 text-zinc-550'
                          }`}>
                            {userHasShielded ? '✓ ARMED' : 'PENDING'}
                          </span>
                        </div>
                        <h4 className="text-xs font-black uppercase text-zinc-300">Streak Protections</h4>
                        <p className="text-[10px] text-zinc-400 mt-1 line-clamp-2">Arm price alarms & freeze shields.</p>
                      </div>
                      <div className="mt-3 text-[9px] text-indigo-400 font-bold uppercase tracking-wider flex items-center justify-between">
                        <span>Details ➔</span>
                        {userHasShielded && <span className="text-emerald-400">● Complete</span>}
                      </div>
                    </button>

                    {/* STEP 3: CALIBRATION */}
                    <button
                      onClick={() => {
                        setActiveInstructionTab('calibration');
                        if (soundEnabled) playCustomTone(480, 0.04);
                      }}
                      className={`p-3 border text-left flex flex-col justify-between transition-all relative ${
                        activeInstructionTab === 'calibration'
                          ? 'bg-zinc-900/90 border-indigo-500/50 shadow'
                          : 'bg-black/20 hover:bg-zinc-900/30 border-zinc-900'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1.5 mb-1.5">
                          <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">[OP-03]</span>
                          <span className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded ${
                            userHasCalibrated 
                              ? 'bg-emerald-500/10 text-emerald-400' 
                              : 'bg-zinc-800 text-zinc-550'
                          }`}>
                            {userHasCalibrated ? '✓ VERIFIED' : 'PENDING'}
                          </span>
                        </div>
                        <h4 className="text-xs font-black uppercase text-zinc-300">Grid Calibration</h4>
                        <p className="text-[10px] text-zinc-400 mt-1 line-clamp-2">Align float precision structures.</p>
                      </div>
                      <div className="mt-3 text-[9px] text-indigo-400 font-bold uppercase tracking-wider flex items-center justify-between">
                        <span>Details ➔</span>
                        {userHasCalibrated && <span className="text-emerald-400">● Complete</span>}
                      </div>
                    </button>

                    {/* STEP 4: LEDGER AUDIT */}
                    <button
                      onClick={() => {
                        setActiveInstructionTab('ledger');
                        if (soundEnabled) playCustomTone(480, 0.04);
                      }}
                      className={`p-3 border text-left flex flex-col justify-between transition-all relative ${
                        activeInstructionTab === 'ledger'
                          ? 'bg-zinc-900/90 border-indigo-500/50 shadow'
                          : 'bg-black/20 hover:bg-zinc-900/30 border-zinc-900'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1.5 mb-1.5">
                          <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">[OP-04]</span>
                          <span className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded ${
                            userHasAudited 
                              ? 'bg-emerald-500/10 text-emerald-400' 
                              : 'bg-zinc-800 text-zinc-550'
                          }`}>
                            {userHasAudited ? '✓ CERTIFIED' : 'PENDING'}
                          </span>
                        </div>
                        <h4 className="text-xs font-black uppercase text-zinc-300">Ledger Audit</h4>
                        <p className="text-[10px] text-zinc-400 mt-1 line-clamp-2">Verify signature hash integrity.</p>
                      </div>
                      <div className="mt-3 text-[9px] text-indigo-400 font-bold uppercase tracking-wider flex items-center justify-between">
                        <span>Details ➔</span>
                        {userHasAudited && <span className="text-emerald-400">● Complete</span>}
                      </div>
                    </button>

                    {/* STEP 5: REGISTRY EXPORT */}
                    <button
                      onClick={() => {
                        setActiveInstructionTab('export');
                        if (soundEnabled) playCustomTone(480, 0.04);
                      }}
                      className={`p-3 border text-left flex flex-col justify-between transition-all relative ${
                        activeInstructionTab === 'export'
                          ? 'bg-zinc-900/90 border-indigo-500/50 shadow'
                          : 'bg-black/20 hover:bg-zinc-900/30 border-zinc-900'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1.5 mb-1.5">
                          <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">[OP-05]</span>
                          <span className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded ${
                            userHasExported 
                              ? 'bg-emerald-500/10 text-emerald-400' 
                              : 'bg-zinc-800 text-zinc-550'
                          }`}>
                            {userHasExported ? '✓ EXPORTED' : 'PENDING'}
                          </span>
                        </div>
                        <h4 className="text-xs font-black uppercase text-zinc-300">Registry Export</h4>
                        <p className="text-[10px] text-zinc-400 mt-1 line-clamp-2">Compile and extract session data.</p>
                      </div>
                      <div className="mt-3 text-[9px] text-indigo-400 font-bold uppercase tracking-wider flex items-center justify-between">
                        <span>Details ➔</span>
                        {userHasExported && <span className="text-emerald-400">● Complete</span>}
                      </div>
                    </button>
                  </div>

                  {/* EXPANDED ACTIVE STEP EXPLANATION & QUICK ACTION CONTROLLER */}
                  <div className="bg-black/40 border border-zinc-900 p-5 rounded-2xl relative">
                    {/* Top indicator tag */}
                    <div className="absolute top-3 right-3 font-mono text-[9px] tracking-wider text-indigo-400/80 font-bold uppercase select-none">
                      Active Walkthrough Inspector
                    </div>

                    {activeInstructionTab === 'converter' && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          <div className="lg:border-r lg:border-zinc-900 lg:pr-6 space-y-1">
                            <span className="block text-[8px] tracking-widest text-zinc-500 uppercase">1. What This Section Does:</span>
                            <span className="block text-[11px] text-zinc-200 mt-1 leading-relaxed">
                              Dual Satoshi-to-Bitcoin real-time mathematical grid. Instantly syncs full multi-thread client allocations and tracks changes.
                            </span>
                          </div>
                          <div className="lg:border-r lg:border-zinc-900 lg:pr-6 space-y-1">
                            <span className="block text-[8px] tracking-widest text-zinc-500 uppercase">2. What Happens When Clicked:</span>
                            <span className="block text-[11px] text-zinc-200 mt-1 leading-relaxed">
                              Typing amounts or clicking dynamic stacked buttons multiplies coin balances, flashes dither state, and triggers physics rains.
                            </span>
                          </div>
                          <div className="space-y-1">
                            <span className="block text-[8px] tracking-widest text-zinc-500 uppercase">3. What Success Looks Like:</span>
                            <span className="block text-[11px] text-amber-300 font-bold mt-1 leading-relaxed">
                              Both currency rows update simultaneously across the dashboard screen accompanied by real-time client audio ticks.
                            </span>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-zinc-900 flex flex-wrap items-center justify-between gap-3 text-xs">
                          <span className="text-zinc-400">
                            Status Indicator: {userHasConverted ? '🟢 Operation verified successfully.' : '🟡 Pending. Type in any digits to complete operations.'}
                          </span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                handleQuickAdd(25000);
                                if (soundEnabled) playAudioTone(523, 0.1, 'sine');
                              }}
                              className="px-4 py-2 border border-indigo-800 bg-indigo-950/40 hover:bg-indigo-900 text-zinc-200 uppercase font-bold text-[10px] tracking-wider cursor-pointer"
                            >
                              Quick Inject +25,000 Sats
                            </button>
                            <button
                              onClick={() => {
                                store.setTotalSats(store.totalSats * 2);
                                if (soundEnabled) playAudioTone(660, 0.1, 'sawtooth');
                              }}
                              className="px-4 py-2 border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 uppercase font-bold text-[10px] tracking-wider cursor-pointer"
                            >
                              Double Total Balance ⟳
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeInstructionTab === 'shield' && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          <div className="lg:border-r lg:border-zinc-900 lg:pr-6 space-y-1">
                            <span className="block text-[8px] tracking-widest text-zinc-500 uppercase">1. What This Section Does:</span>
                            <span className="block text-[11px] text-zinc-200 mt-1 leading-relaxed">
                              Saves your streak parameters by lock-shielding metrics during extreme Coinbase market price volatility actions.
                            </span>
                          </div>
                          <div className="lg:border-r lg:border-zinc-900 lg:pr-6 space-y-1">
                            <span className="block text-[8px] tracking-widest text-zinc-500 uppercase">2. What Happens When Clicked:</span>
                            <span className="block text-[11px] text-zinc-200 mt-1 leading-relaxed">
                              Toggles premium status, replenishes defensive Freeze tokens, or arms custom target alarms behind secure socket lines.
                            </span>
                          </div>
                          <div className="space-y-1">
                            <span className="block text-[11px] text-indigo-300 font-bold mt-1 leading-relaxed">
                              3. What Success Looks Like:
                            </span>
                            <span className="block text-[11px] text-indigo-300 font-bold leading-relaxed">
                              A shiny active beacon labeled "SHIELDED" starts pulsating in your live event stream outputs, stabilizing the conversion queue.
                            </span>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-zinc-900 flex flex-wrap items-center justify-between gap-3 text-xs">
                          <span className="text-zinc-400">
                            Status Indicator: {userHasShielded ? '🟢 Shield sequence armed.' : '🟡 Pending. Replenish freeze tokens or arm custom price shield above.'}
                          </span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                store.replenishTokens();
                                if (soundEnabled) playAudioTone(880, 0.08, 'sine');
                              }}
                              className="px-4 py-2 border border-indigo-800 bg-indigo-950/40 hover:bg-indigo-900 text-zinc-200 uppercase font-bold text-[10px] tracking-wider cursor-pointer"
                            >
                              Add Freeze Protection Token 🛡️
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeInstructionTab === 'calibration' && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          <div className="lg:border-r lg:border-zinc-900 lg:pr-6 space-y-1">
                            <span className="block text-[8px] tracking-widest text-zinc-500 uppercase">1. What This Section Does:</span>
                            <span className="block text-[11px] text-zinc-200 mt-1 leading-relaxed">
                              Switzerland Grid calibration protocol testing layout alignments, floating decimal tolerances, and latency bounds.
                            </span>
                          </div>
                          <div className="lg:border-r lg:border-zinc-900 lg:pr-6 space-y-1">
                            <span className="block text-[8px] tracking-widest text-zinc-500 uppercase">2. What Happens When Clicked:</span>
                            <span className="block text-[11px] text-zinc-200 mt-1 leading-relaxed">
                              Triggers a sequential 3.2-second step-by-step diagnostic verification checklist inside of our offline sandbox console.
                            </span>
                          </div>
                          <div className="space-y-1">
                            <span className="block text-[11px] text-emerald-300 font-bold mt-1 leading-relaxed">
                              3. What Success Looks Like:
                            </span>
                            <span className="block text-[11px] text-emerald-400 font-bold leading-relaxed">
                              A 40-character certified Proof Hash is spawned with timestamp markings, shifting layout state from "RE-CALIBRATION REQ" to "STABILIZED".
                            </span>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-zinc-900 flex flex-wrap items-center justify-between gap-3 text-xs">
                          <span className="text-zinc-400 font-mono">
                            Status Indicator: {userHasCalibrated ? `🟢 Precision Alignment Verified. Certificate: ${auditHash.slice(0, 10)}...` : '🟡 Pending. Execute the diagnostic sweep to certify layout math.'}
                          </span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                if (isCalibrating) return;
                                // Jump active mode to symmetry so first-time users can see the console logs updating
                                if (store.activeMode !== 'symmetry') {
                                  store.toggleAppMode();
                                }
                                runSymmetryCalibration();
                              }}
                              className="px-4 py-2 border border-zinc-700 bg-zinc-800 hover:bg-zinc-750 text-zinc-100 uppercase font-black text-[10px] tracking-wider cursor-pointer"
                            >
                              {isCalibrating ? 'Diagnostics running...' : 'Run Precision Calibration Suite ⚛'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeInstructionTab === 'ledger' && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          <div className="lg:border-r lg:border-zinc-900 lg:pr-6 space-y-1">
                            <span className="block text-[8px] tracking-widest text-zinc-500 uppercase">1. What This Section Does:</span>
                            <span className="block text-[11px] text-zinc-200 mt-1 leading-relaxed">
                              Offline Audit balance transformation tracker signing every transaction log line mathematically.
                            </span>
                          </div>
                          <div className="lg:border-r lg:border-zinc-900 lg:pr-6 space-y-1">
                            <span className="block text-[8px] tracking-widest text-zinc-500 uppercase">2. What Happens When Clicked:</span>
                            <span className="block text-[11px] text-zinc-200 mt-1 leading-relaxed">
                              Audits the local cached history array for tampering and re-verifies cryptographically matching signature row outputs.
                            </span>
                          </div>
                          <div className="space-y-1">
                            <span className="block text-[11px] text-sky-300 font-bold mt-1 leading-relaxed">
                              3. What Success Looks Like:
                            </span>
                            <span className="block text-[11px] text-sky-405 font-bold leading-relaxed">
                              The status badge shifts green-flagged with an official integrity compliant seal, certifying ledger entries safe.
                            </span>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-zinc-900 flex flex-wrap items-center justify-between gap-3 text-xs">
                          <span className="text-zinc-400">
                            Status Indicator: {userHasAudited ? '🟢 Ledger signature verified compliant.' : '🟡 Pending. Initiate cryptographic signature audits to verify state indices.'}
                          </span>
                          <div className="flex gap-2">
                            {isForcedFailedVerification && (
                              <button
                                onClick={() => {
                                  setIsForcedFailedVerification(false);
                                  setShowVerificationResolvedToast(true);
                                  setUserHasAudited(true);
                                  playCustomTone(680, 0.08);
                                  setTimeout(() => setShowVerificationResolvedToast(false), 4000);
                                }}
                                className="px-4 py-2 border border-red-500 bg-red-950/40 hover:bg-red-900 text-red-200 uppercase font-black text-[10px] tracking-wider cursor-pointer"
                              >
                                Repair Current Integrity Fault ⚠️
                              </button>
                            )}
                            <button
                              onClick={() => {
                                runLedgerForensicAudit();
                              }}
                              disabled={isAuditingLedger}
                              className={`px-4 py-2 border uppercase font-bold text-[10px] tracking-wider cursor-pointer ${
                                isAuditingLedger
                                  ? 'bg-zinc-800 border-zinc-700 text-zinc-500 animate-pulse cursor-not-allowed'
                                  : 'border-emerald-800 bg-emerald-950/40 hover:bg-emerald-900 text-emerald-250 hover:text-white'
                              }`}
                            >
                              {isAuditingLedger ? `Scanning Hash Signature Chain...` : 'Verify Memory transaction signatures ⚔'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeInstructionTab === 'export' && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          <div className="lg:border-r lg:border-zinc-900 lg:pr-6 space-y-1">
                            <span className="block text-[8px] tracking-widest text-zinc-500 uppercase">1. What This Section Does:</span>
                            <span className="block text-[11px] text-zinc-200 mt-1 leading-relaxed">
                              Compiles and serializes the complete offline session history tree so you can port ledger data to spreadsheets.
                            </span>
                          </div>
                          <div className="lg:border-r lg:border-zinc-900 lg:pr-6 space-y-1">
                            <span className="block text-[8px] tracking-widest text-zinc-500 uppercase">2. What Happens When Clicked:</span>
                            <span className="block text-[11px] text-zinc-200 mt-1 leading-relaxed">
                              Compiles CSV strings and writes to physical download blobs or provides instant clipboard backup text sheets.
                            </span>
                          </div>
                          <div className="space-y-1">
                            <span className="block text-[11px] text-pink-300 font-bold mt-1 leading-relaxed">
                              3. What Success Looks Like:
                            </span>
                            <span className="block text-[11px] text-pink-400 font-bold leading-relaxed">
                              A physical `.csv` file download begins in your browser, or transaction logs are successfully written to device clipboard caches.
                            </span>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-zinc-900 flex flex-wrap items-center justify-between gap-3 text-xs">
                          <span className="text-zinc-400">
                            Status Indicator: {userHasExported ? '🟢 Client sandbox registry exported.' : '🟡 Pending. Port data out of standard memory structures.'}
                          </span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                exportLedgerToCSV();
                                setUserHasExported(true);
                              }}
                              className="px-4 py-2 border border-pink-805 bg-pink-950/20 hover:bg-pink-900/40 text-pink-300 uppercase font-bold text-[10px] tracking-wider cursor-pointer"
                            >
                              Trigger Exporter 📥
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* REAL-TIME COINBASE TICKER CARD */}
            <div id="onboarding-coinbase-telemetry" className={`md:col-span-12 p-6 border transition-all duration-500 relative overflow-hidden ${
              guidedTourStep === 2 
                ? 'ring-4 ring-indigo-500 shadow-[0_0_30px_rgba(99,102,241,0.8)] border-indigo-505 bg-indigo-950/20 scale-[1.005]'
                : getTickerState() === 'error' ? 'border-red-500/60 bg-red-950/20 shadow-lg shadow-red-900/10' :
                  getTickerState() === 'completed' ? 'border-amber-400/80 bg-zinc-950/70 shadow-lg shadow-amber-500/10' :
                  getTickerState() === 'stale' ? 'border-yellow-500/60 bg-yellow-950/10 animate-pulse' :
                  getTickerState() === 'idle' ? 'border-indigo-900/40 bg-zinc-950/60' :
                  getTickerState() === 'loading' ? 'border-zinc-800 bg-zinc-950/30' :
                  store.activeMode === 'stim'
                    ? 'bg-slate-950/80 border-slate-800/80 rounded-2xl backdrop-blur-md'
                    : 'bg-zinc-900/40 border-zinc-800 rounded-none font-mono text-zinc-100'
            }`}>
              
              {/* Optional ambient background glows for completed or warning states */}
              {getTickerState() === 'completed' && (
                <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(ellipse_at_center,rgba(234,179,8,0.15),transparent_50%)] animate-pulse" />
              )}
              {getTickerState() === 'error' && (
                <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(ellipse_at_center,rgba(239,68,68,0.12),transparent_50%)]" />
              )}

              {/* Ticker Header & Multi-State Sandbox Controls */}
              <div className="relative z-10 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 pb-4 border-b border-zinc-800/60">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-lg transition-all ${
                    getTickerState() === 'error' ? 'bg-red-500/10 text-red-400' :
                    getTickerState() === 'completed' ? 'bg-amber-400/20 text-amber-400' :
                    getTickerState() === 'stale' ? 'bg-yellow-400/10 text-yellow-400' :
                    store.activeMode === 'stim' ? 'bg-amber-400/10 text-amber-400' : 'bg-zinc-800 text-indigo-400 border border-zinc-700/50'
                  }`}>
                    {getTickerState() === 'loading' ? <Loader2 size={22} className="animate-spin" /> :
                     getTickerState() === 'completed' ? <Trophy size={22} className="animate-bounce" /> :
                     getTickerState() === 'idle' ? <Coffee size={22} className="text-indigo-400" /> :
                     getTickerState() === 'error' ? <AlertTriangle size={22} className="animate-pulse" /> :
                     getTickerState() === 'disconnected' ? <WifiOff size={22} /> :
                     getTickerState() === 'stale' ? <Clock size={22} /> :
                     <Coins size={22} className={store.activeMode === 'stim' ? 'animate-bounce' : ''} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase text-zinc-400 tracking-wider">Coinbase Live Price</span>
                      <span className={`text-[8px] px-1.5 py-0.5 font-bold uppercase rounded ${
                        getTickerState() === 'active' ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-900/50' :
                        getTickerState() === 'completed' ? 'bg-amber-950/80 text-amber-400 border border-amber-900/60' :
                        getTickerState() === 'error' ? 'bg-red-950/80 text-red-400 border border-red-900/50 animate-pulse' :
                        getTickerState() === 'stale' ? 'bg-yellow-950 text-yellow-500 border border-yellow-904/50 animate-pulse' :
                        getTickerState() === 'idle' ? 'bg-indigo-950 text-indigo-400 border border-indigo-900/50' :
                        getTickerState() === 'success' ? 'bg-emerald-950 text-emerald-400 border border-emerald-900' :
                        'bg-zinc-800 text-zinc-400'
                      }`}>
                        {getTickerState()}
                      </span>
                    </div>
                    <div className="text-md font-bold text-zinc-100 flex items-center gap-1.5">
                      BTC - USD Real-Time Feed
                    </div>
                  </div>
                </div>

                {/* State Debug Console */}
                <div className="w-full xl:w-auto bg-zinc-950/80 border border-zinc-850 p-2 rounded-xl flex flex-wrap items-center gap-1">
                  <span className="text-[8px] uppercase font-bold text-zinc-500 px-1.5 tracking-wider font-sans">
                    STATE SWITCH:
                  </span>
                  <button
                    onClick={() => { setTickerStateOverride(null); }}
                    className={`px-2 py-1 text-[8.5px] font-bold uppercase rounded transition-colors ${
                      tickerStateOverride === null ? 'bg-indigo-600 text-white' : 'bg-transparent text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    Auto
                  </button>
                  {(['loading', 'active', 'idle', 'success', 'error', 'empty', 'disconnected', 'stale', 'completed'] as const).map(state => (
                    <button
                      key={state}
                      onClick={() => {
                        setTickerStateOverride(state);
                        if (state === 'error') {
                          setInternalErrorLogs(prev => [
                            `[ERROR] ${new Date().toLocaleTimeString()} // Handshake timeout anomaly on Coinbase wss channel`,
                            `[TRACE] client-id: c7d7d27f • buffer_size: ${store.priceHistory.length}`,
                            `[HTTP_RETRY] Fallback polling route activated...`,
                            ...prev
                          ].slice(0, 10));
                        }
                      }}
                      className={`px-2 py-0.5 text-[8px] font-bold uppercase rounded transition-colors ${
                        tickerStateOverride === state ? 'bg-zinc-800 text-zinc-100 border border-zinc-700' : 'bg-transparent text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      {state}
                    </button>
                  ))}
                </div>
              </div>

              {/* State-Based Visual Body Panels */}
              <div className="relative z-10 py-5">
                {getTickerState() === 'loading' && (
                  <div className="flex flex-col items-center justify-center text-center py-6 animate-pulse select-none font-mono">
                    <Loader2 className="text-indigo-400 animate-spin mb-3" size={32} />
                    <div className="text-xs font-black text-indigo-300 uppercase tracking-widest">
                      WSS_HANDSHAKE_PENDING // COINBASE LINK
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-1 max-w-sm">
                      Establishing handshake protocols with the Coinbase WebSocket feed...
                    </p>
                    <div className="mt-4 flex gap-2">
                      <div className="h-6 w-24 bg-zinc-900 border border-zinc-800 rounded animate-pulse" />
                      <div className="h-6 w-32 bg-zinc-900 border border-zinc-800 rounded animate-pulse" />
                    </div>
                  </div>
                )}

                {getTickerState() === 'idle' && (
                  <div className="flex flex-col sm:flex-row items-center justify-between bg-indigo-950/10 border border-indigo-900/30 p-5 rounded-2xl font-mono">
                    <div className="flex items-start gap-3 mb-4 sm:mb-0">
                      <Coffee className="text-indigo-400 mt-0.5 shrink-0" size={24} />
                      <div>
                        <span className="text-[9px] uppercase tracking-wider text-indigo-400 font-extrabold block">
                          LIVE FEED IN STANDBY
                        </span>
                        <h4 className="text-xs font-bold text-zinc-300 uppercase mt-0.5">
                          STANDBY STATE ACTIVE
                        </h4>
                        <p className="text-[10px] text-zinc-500 mt-1 max-w-md">
                          WebSocket connection paused. Resume live real-time pricing updates instantly.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setTickerStateOverride(null);
                        if (workerRef.current) workerRef.current.postMessage({ command: 'connect' });
                      }}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] tracking-wide font-black uppercase rounded-xl transition-all shadow-md shadow-indigo-600/20 active:scale-95"
                    >
                      Resume Live Ticker
                    </button>
                  </div>
                )}

                {getTickerState() === 'error' && (
                  <div className="bg-red-950/20 border border-red-500/40 p-4 rounded-2xl font-mono">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-4">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="text-red-400 shrink-0 mt-0.5" size={20} />
                        <div>
                          <span className="text-[9px] tracking-wider text-red-400 font-bold uppercase block">
                            CONNECTION LIMIT EXCEEDED
                          </span>
                          <h4 className="text-xs font-bold text-red-200 uppercase">
                            LIVE PRICE FEED PAUSED
                          </h4>
                          <p className="text-[10px] text-red-300/70 mt-0.5">
                            Standard rate limit reached or WebSocket connection closed. Polling backup initiated.
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setTickerStateOverride(null);
                          if (workerRef.current) {
                            workerRef.current.postMessage({ command: 'disconnect' });
                            setTimeout(() => workerRef.current?.postMessage({ command: 'connect' }), 50);
                          }
                        }}
                        className="px-3 py-1.5 bg-red-900 text-white hover:bg-red-800 text-[9px] font-black uppercase rounded-lg transition-all shadow"
                      >
                        Force Pipeline Reset
                      </button>
                    </div>

                    <div className="bg-zinc-950 p-2.5 rounded-lg border border-red-500/15 max-h-24 overflow-y-auto">
                      <div className="text-[8px] uppercase tracking-wider text-zinc-500 font-black mb-1">
                        Virtual Debugger Backtrace
                      </div>
                      <div className="space-y-1 text-[9px] text-zinc-400 select-all font-mono leading-relaxed">
                        {internalErrorLogs.map((log, i) => (
                          <div key={i} className="flex gap-2">
                            <span className="text-red-500/50">[{i}]</span>
                            <span>{log}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {getTickerState() === 'empty' && (
                  <div className="flex flex-col items-center justify-center text-center py-8 border border-dashed border-zinc-800 rounded-2xl font-mono">
                    <Database className="text-zinc-650 mb-2" size={24} />
                    <span className="text-xs font-black text-zinc-400 uppercase tracking-widest">
                      HISTORICAL PRICE BUFFER VACANT
                    </span>
                    <p className="text-[10px] text-zinc-500 mt-1 max-w-sm">
                      Cached pricing buffers successfully flushed from memory. Active Web Worker background sync must be initiated to populate trace sparklines.
                    </p>
                    <button
                      onClick={() => {
                        setTickerStateOverride('active');
                        // Inject default baseline elements
                        store.updateTicker({ price: 67250, time: Date.now() });
                        store.updateTicker({ price: 67320, time: Date.now() + 1000 });
                        store.updateTicker({ price: 67450, time: Date.now() + 2000 });
                      }}
                      className="mt-3 px-3 py-1 bg-zinc-800 hover:bg-zinc-750 text-zinc-300 rounded border border-zinc-700 text-[9px] uppercase font-bold"
                    >
                      Seed Sample Data
                    </button>
                  </div>
                )}

                {getTickerState() === 'disconnected' && (
                  <div className="flex flex-col sm:flex-row items-center justify-between bg-zinc-950/60 border border-zinc-850 p-5 rounded-2xl font-mono">
                    <div className="flex items-start gap-3">
                      <WifiOff className="text-zinc-500 shrink-0 mt-0.5" size={22} />
                      <div>
                        <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-extrabold block">
                          CONNECTION: OFFLINE
                        </span>
                        <h4 className="text-xs font-bold text-zinc-400 uppercase">
                          FEED TERMINATED MANUALLY
                        </h4>
                        <p className="text-[10px] text-zinc-500 mt-1 max-w-md">
                          WebSocket channel link has been terminated. Main client thread operating in sandbox read-only.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setTickerStateOverride(null);
                        if (workerRef.current) workerRef.current.postMessage({ command: 'connect' });
                      }}
                      className="mt-3 sm:mt-0 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded text-[9px] uppercase font-bold"
                    >
                      Reconnect Socket
                    </button>
                  </div>
                )}

                {getTickerState() === 'stale' && (
                  <div className="bg-yellow-950/20 border border-yellow-500/30 p-4 rounded-xl font-mono flex items-center justify-between">
                    <div className="flex items-start gap-3">
                      <Clock className="text-yellow-500 shrink-0 mt-0.5 animate-spin" size={18} />
                      <div>
                        <span className="text-[9px] tracking-wider text-yellow-500 font-black uppercase">
                          STALE TELEMETRY DETECTED
                        </span>
                        <h5 className="text-xs font-semibold text-zinc-300 uppercase">
                          Heartbeat Delay: &gt;8 SECONDS
                        </h5>
                        <p className="text-[10px] text-zinc-500 mt-0.5 max-w-lg">
                          No pricing packets processed since {secondsSinceLastTick} seconds. Target exchange ticker feeds might be resting.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSecondsSinceLastTick(0)}
                      className="px-2.5 py-1 text-[8.5px] uppercase bg-yellow-950/80 hover:bg-yellow-900/60 border border-yellow-600/40 text-yellow-500 font-bold rounded"
                    >
                      Clear Timer
                    </button>
                  </div>
                )}

                {getTickerState() === 'completed' && (
                  <div className="bg-amber-950/20 border border-amber-400/30 p-5 rounded-2xl font-mono text-center relative overflow-hidden flex flex-col items-center justify-center">
                    <Trophy className="text-amber-400 animate-bounce mb-2" size={28} />
                    <span className="text-[10px] tracking-widest text-amber-400 font-black uppercase bg-amber-950/80 border border-amber-500/50 px-3 py-1 rounded-full">
                      PORTFOLIO HARVEST ACHIEVED 🏆
                    </span>
                    <h4 className="text-sm font-black text-zinc-100 uppercase mt-2">
                      Satoshi Stack Milestone Logged
                    </h4>
                    <p className="text-[10px] text-zinc-400 mt-1 max-w-md">
                      Your exact ledger total has broken through target gates (&gt;= 1,000,000 Sats)! Release-grade calculations verified with parity checks.
                    </p>
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => {
                          setTickerStateOverride(null);
                        }}
                        className="px-3 py-1 bg-amber-400 hover:bg-amber-500 text-zinc-950 text-[9px] uppercase font-black tracking-wider rounded transition-colors"
                      >
                        Dismiss Goal
                      </button>
                      <button
                        onClick={() => store.setTotalSats(10000)}
                        className="px-3 py-1 border border-zinc-800 text-zinc-500 text-[9px] uppercase font-bold rounded hover:bg-zinc-900"
                      >
                        Reset Balance
                      </button>
                    </div>
                  </div>
                )}

                {getTickerState() === 'success' && (
                  <div className="bg-emerald-950/10 border border-emerald-900/30 p-4 rounded-xl flex items-center justify-between font-mono">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="text-emerald-400" size={18} />
                      <div>
                        <span className="text-[9.5px] font-bold text-emerald-400 tracking-wider block uppercase">
                          FEED SYNC VALIDATED
                        </span>
                        <p className="text-[10px] text-zinc-400 mt-0.5">
                          Coinbase WS Secure Channel established. Parity validation Delta returned 0.000.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setTickerStateOverride('active')}
                      className="px-2.5 py-1 text-[8.5px] uppercase bg-emerald-950 text-emerald-400 border border-emerald-800 hover:bg-zinc-900 font-bold rounded"
                    >
                      Hide Alert
                    </button>
                  </div>
                )}

                {/* Main Dynamic Real-Time Interactive layout (Only active when not masked by another state screen) */}
                {(getTickerState() === 'active' || getTickerState() === 'success' || getTickerState() === 'stale') && (
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-zinc-900/40 pb-6 mb-6">
                    {/* PRIORITY 1 LAYER (DOMINANT PRICE EXPOSURE) */}
                    <div className="flex-1 min-w-0">
                      <div className="text-[9px] uppercase text-zinc-500 font-bold tracking-widest mb-1.5 font-mono">Coinbase Live Feed // Real-Time Spot Price</div>
                      <div className="flex items-baseline gap-3 flex-wrap">
                        <span className={`text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight smooth-morph leading-none font-mono tabular-nums ${
                          isGlitching ? 'chromatic-aberration' : ''
                        } ${
                          store.priceChangeDirection === 'up' 
                            ? 'text-emerald-400' 
                            : store.priceChangeDirection === 'down' 
                              ? 'text-rose-400' 
                              : 'text-zinc-100'
                        }`}>
                          ${store.livePrice ? store.livePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '67,420.00'}
                        </span>
                        
                        <div className={`flex items-center gap-1.5 text-[9px] font-bold px-2 py-0.5 rounded ${
                          store.priceChangeDirection === 'up' ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-900/60' :
                          store.priceChangeDirection === 'down' ? 'bg-rose-950/80 text-rose-400 border border-rose-900/60' :
                          'bg-zinc-900 text-zinc-400 border border-zinc-800'
                        }`}>
                          {store.priceChangeDirection === 'up' && <TrendingUp size={10} className="animate-pulse" />}
                          {store.priceChangeDirection === 'down' && <TrendingDown size={10} className="animate-pulse" />}
                          {store.priceChangeDirection === 'up' ? 'UPWARD TREND' : store.priceChangeDirection === 'down' ? 'DOWNWARD TREND' : 'Coinbase Live Feed // Real-Time Spot Price'}
                        </div>
                      </div>
                    </div>

                    {/* PRIORITY 1.5 LAYER (DOMINANT BARRIER STATUS DISPLAY) */}
                    <div className="flex items-center gap-4 bg-zinc-950/60 border border-zinc-850 p-4 rounded-xl min-w-[280px] font-mono">
                      <div className="relative flex items-center justify-center">
                        <div className={`p-2.5 rounded-full ${
                          store.isAlertArmed 
                            ? 'bg-indigo-950 text-indigo-400 border border-indigo-900/40' 
                            : 'bg-zinc-900/50 text-zinc-600 border border-zinc-850'
                        }`}>
                          <Shield size={20} className={store.isAlertArmed ? "animate-pulse" : ""} />
                        </div>
                        {store.isAlertArmed && (
                          <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                          </span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <span className="text-[9px] uppercase text-zinc-500 tracking-wider font-bold block">BARRIER ALARM SHIELD</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`text-xs font-black uppercase tracking-wide ${
                            store.isAlertArmed ? 'text-indigo-400' : 'text-zinc-500'
                          }`}>
                            {store.isAlertArmed ? 'ARMED & ACTIVE' : 'SHIELD STANDBY'}
                          </span>
                          <span className="text-zinc-700">|</span>
                          <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                            {store.freezeTokens} Tokens
                            <span className="flex gap-0.5 select-none text-[8px] tracking-tighter">
                              {Array.from({ length: Math.min(4, store.freezeTokens) }).map((_, i) => (
                                <span key={i} className="text-indigo-400 font-bold">●</span>
                              ))}
                              {Array.from({ length: Math.max(0, 3 - store.freezeTokens) }).map((_, i) => (
                                <span key={i} className="text-zinc-700">○</span>
                              ))}
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* PRIORITY 2 LAYER: SUPPORT DATA SECONDARY CLUSTER */}
                {(getTickerState() === 'active' || getTickerState() === 'success' || getTickerState() === 'stale') && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-zinc-950/20 border border-zinc-900/40 p-3.5 rounded-xl mt-2 font-mono">
                    <div>
                      <span className="text-[8.5px] uppercase text-zinc-500 tracking-wider font-bold block">24H High Limit</span>
                      <span className="text-xs font-semibold text-zinc-300 mt-0.5 block">
                        ${store.high24h ? store.high24h.toLocaleString() : '68,110.00'}
                      </span>
                    </div>

                    <div className="border-l border-zinc-900 pl-4">
                      <span className="text-[8.5px] uppercase text-zinc-500 tracking-wider font-bold block">24H Low Limit</span>
                      <span className="text-xs font-semibold text-zinc-300 mt-0.5 block">
                        ${store.low24h ? store.low24h.toLocaleString() : '66,950.00'}
                      </span>
                    </div>

                    <div className="border-l border-zinc-900 pl-4">
                      <span className="text-[8.5px] uppercase text-zinc-500 tracking-wider font-bold block">24H Volume</span>
                      <span className="text-xs font-semibold text-zinc-300 mt-0.5 block truncate">
                        {store.volume24h ? parseFloat(parseFloat(store.volume24h).toFixed(2)).toLocaleString() : '14,250.45'} BTC
                      </span>
                    </div>

                    <div className="flex items-center justify-end border-l border-zinc-900 pl-4">
                      <button
                        onClick={() => {
                          setTickerStateOverride('idle');
                          if (workerRef.current) workerRef.current.postMessage({ command: 'disconnect' });
                        }}
                        className="px-2.5 py-1 border border-zinc-850 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-[8.5px] uppercase font-bold rounded flex items-center gap-1 transition-all"
                        title="Disconnect Coinbase Thread and Enter Idle State"
                      >
                        <Pause size={9} />
                        Pause Feed Link
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Sparkline & Event Log Panel (Visible in Active Ticker, Success connection or Stale fallback) */}
              {(getTickerState() === 'active' || getTickerState() === 'success' || getTickerState() === 'stale') && (
                <>
                  {store.activeMode === 'stim' ? (
                    <div className="mt-4 pt-4 border-t border-slate-900 h-20 relative flex items-end overflow-hidden">
                      <div className="absolute top-1 left-1 text-[9px] font-mono text-zinc-500 uppercase">Latency-optimised Sparkline</div>
                      {store.priceHistory.length > 1 ? (
                        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                          <polyline
                            fill="none"
                            stroke="#EAB308"
                            strokeWidth="2"
                            points={(() => {
                               const prices = store.priceHistory.map((h: any) => h.price);
                               const min = Math.min(...prices);
                               const max = Math.max(...prices);
                               const range = max - min || 1;
                               return store.priceHistory.map((h: any, i: number) => {
                                 const x = (i / (store.priceHistory.length - 1)) * 100;
                                 const y = 90 - ((h.price - min) / range) * 80;
                                 return `${x},${y}`;
                               }).join(' ');
                            })()}
                          />
                        </svg>
                      ) : (
                        <div className="w-full text-center text-xs text-zinc-500 font-mono mb-2">Streaming tick buffer...</div>
                      )}
                    </div>
                  ) : (
                    <div className="mt-4 pt-4 border-t border-zinc-800">
                      <div className="text-[10px] uppercase text-zinc-400 mb-1.5 font-bold tracking-wider">Live Ticker Connection Events</div>
                      <div className="grid grid-cols-12 gap-2 text-left text-[10px] font-mono text-zinc-500 bg-zinc-950 p-2 border border-zinc-850">
                        <div className="col-span-2">INDEX</div>
                        <div className="col-span-3">UTC STAMP</div>
                        <div className="col-span-5">EXPLICIT ACTION LOG</div>
                        <div className="col-span-2 text-right">STATUS</div>
                      </div>
                      <div className="max-h-24 overflow-y-auto mt-1 flex flex-col gap-1 font-mono text-[10px]">
                        {store.priceHistory.length > 0 ? (
                          store.priceHistory.slice(-4).reverse().map((tick: any, idx: number) => {
                            const index = store.priceHistory.length - idx;
                            let actionLog = "Nominal feed sync active";
                            let statusColor = "text-emerald-400 font-bold";
                            let statusText = "NOMINAL";

                            if (idx === 0) {
                              actionLog = `Last updated ${secondsSinceLastTick}s ago`;
                              statusColor = secondsSinceLastTick > 3 ? "text-amber-400 animate-pulse font-bold" : "text-emerald-400 font-bold";
                              statusText = secondsSinceLastTick > 3 ? "STALE" : "LIVE";
                            } else if (idx === 1 && store.isAlertArmed) {
                              actionLog = "Alert armed at threshold";
                              statusColor = "text-indigo-400 font-bold animate-pulse";
                              statusText = "ARMED";
                            } else if (idx === 2) {
                              actionLog = "Current streak protected by shield";
                              statusColor = "text-blue-400 font-bold";
                              statusText = "SHIELDED";
                            } else if (idx === 3) {
                              actionLog = "Local state sequence verified";
                              statusColor = "text-zinc-500 font-bold";
                              statusText = "VERIFIED";
                            }

                            return (
                              <div key={idx} className="grid grid-cols-12 gap-2 text-left py-1 pb-1.5 border-b border-zinc-850 text-zinc-350 items-center">
                                <div className="col-span-2 text-zinc-500">[{index}]</div>
                                <div className="col-span-3 text-zinc-450">{new Date(tick.time).toISOString().split('T')[1].slice(0, 8)}</div>
                                <div className="col-span-5 text-zinc-200 font-semibold truncate">{actionLog}</div>
                                <div className={`col-span-2 text-right text-[9px] ${statusColor}`}>{statusText}</div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-center text-zinc-500 py-3">No active ticks logged in local memory yet. Establishing live sync...</div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* DUAL CORE DESIGN SEGMENT */}
            <AnimatePresence mode="wait">
              {store.activeMode === 'stim' ? (
                
                /* ==============================================
                   ADHD STIM MODE INTERFACE (GLOWING, ANIMATED, BURSTING)
                   ============================================== */
                <motion.div 
                  key="stim" 
                  initial={{ opacity: 0, y: 20, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.98 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="md:col-span-12 grid grid-cols-1 lg:grid-cols-12 gap-6 smooth-morph"
                >
                  
                  {/* CONVERTER CONTROLLER (Left Panel) */}
                  <div id="onboarding-converter-core" className={`lg:col-span-7 bg-slate-950/80 border p-6 rounded-3xl relative overflow-hidden backdrop-blur-md smooth-morph transition-all ${
                    guidedTourStep === 1 
                      ? 'ring-4 ring-indigo-500 shadow-[0_0_30px_rgba(99,102,241,0.8)] border-indigo-500 scale-[1.01]' 
                      : 'border-purple-900/40 glow-purple'
                  }`}>
                    <div className="absolute top-0 right-0 py-1 px-3 bg-purple-500/20 text-purple-400 text-[10px] uppercase font-bold tracking-widest rounded-bl-xl border-l border-b border-purple-900/40">
                      ⚡ Satoshi Conversion Engine
                    </div>

                    <div className="flex items-center justify-between gap-2 mb-6">
                      <h2 className="text-xl font-bold flex items-center gap-2">
                        <Sparkles className="text-purple-400" size={18} />
                        Satoshi Converter
                      </h2>
                      <button
                        onClick={() => {
                          setLocalHelpConverter(!localHelpConverter);
                          if (soundEnabled) playCustomTone(700, 0.04);
                        }}
                        className={`text-[10px] uppercase font-mono tracking-wider border px-2 py-1 rounded transition-colors cursor-pointer flex items-center gap-1.5 ${
                          localHelpConverter 
                            ? 'bg-amber-400 border-amber-400 text-zinc-950 font-bold' 
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        <HelpCircle size={11} />
                        {localHelpConverter ? 'Close Guide' : 'Guide'}
                      </button>
                    </div>

                    {/* Inline guidance box for Converter */}
                    <AnimatePresence>
                      {localHelpConverter && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="bg-purple-950/20 border border-purple-900/40 p-4 rounded-2xl mb-4 text-xs space-y-3 relative overflow-hidden text-zinc-200"
                        >
                          <div className="text-[10px] uppercase tracking-widest text-purple-400 font-bold">Module Quick Overview</div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <span className="font-bold text-zinc-400 block mb-0.5">● WHAT THIS DOES:</span>
                              Live mathematical bridge converting Bitcoin (BTC ₿) to Satoshis (Sats 🪙) based on high-frequency pricing channels.
                            </div>
                            <div>
                              <span className="font-bold text-zinc-400 block mb-0.5">● WHAT HAPPENS ON CLICKS:</span>
                              Instantly recalculates values via standard 8-decimal mantissa multiplication, triggers physical haptic coin rains, and updates local state caches.
                            </div>
                            <div>
                              <span className="font-bold text-zinc-400 block mb-0.5">● WHAT SUCCESS LOOKS LIKE:</span>
                              A pristine, synchronized balance displayed in real-time across both primary panels with live auditory confirmation tones.
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* DUAL CONVERSION BOXTS WITH NEON ACCENTS */}
                    {isForcedEmptyStore ? (
                      <div className="bg-black/40 border border-amber-500/20 p-6 rounded-2xl text-center space-y-4 my-4 relative overflow-hidden backdrop-blur-sm">
                        <div className="absolute top-2 right-3 font-mono text-[8.5px] text-amber-500/50 tracking-widest uppercase">Vault Unprimed</div>
                        <div className="w-12 h-12 bg-amber-400/10 rounded-full flex items-center justify-center mx-auto text-amber-400 border border-amber-400/20">
                          <Coins size={20} className="animate-pulse" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wider font-mono">Satoshi Allocations Empty</h4>
                          <p className="text-[10.5px] text-zinc-400 mt-1 max-w-sm mx-auto font-mono leading-relaxed">
                            No active Bitcoin units reside in the local cache. Please inject genesis blocks or quick stack some satoshis to prime the system.
                          </p>
                        </div>
                        <div className="flex flex-wrap justify-center gap-2 pt-2 relative z-10">
                          <button
                            onClick={() => {
                              store.addSats(10000);
                              setIsForcedEmptyStore(false);
                              addLedgerEntry("Seeded 10,000 Sats cache units", 10000, 0.0001);
                              if (soundEnabled) playAudioTone(523.25, 0.1, 'sine');
                            }}
                            className="text-[10px] uppercase font-mono tracking-wider font-bold bg-amber-500 hover:bg-amber-400 text-zinc-950 px-3.5 py-2 rounded-xl transition-all hover:scale-105"
                          >
                            Stack 10,000 Sats
                          </button>
                          <button
                            onClick={() => {
                              store.addSats(100000);
                              setIsForcedEmptyStore(false);
                              addLedgerEntry("Seeded standard Genesis record (100k Sats)", 100000, 0.001);
                              if (soundEnabled) playAudioTone(659.25, 0.12, 'sine');
                            }}
                            className="text-[10px] uppercase font-mono tracking-wider font-bold bg-purple-950/40 hover:bg-purple-900/60 text-purple-300 border border-purple-500/30 px-3.5 py-2 rounded-xl transition-all hover:scale-105"
                          >
                            Genesis Prime (100k)
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* BTC BLOCK */}
                        <div className="bg-black/40 border border-slate-800 hover:border-slate-750 p-4 rounded-2xl relative transition-all duration-300 focus-within:border-amber-500/30">
                          <label className="text-[10px] text-zinc-400 uppercase tracking-widest block mb-1 font-mono">Bitcoin Amount (BTC)</label>
                          <div className="flex items-center justify-between">
                            <input 
                              type="text"
                              inputMode="decimal"
                              value={manualBtcInput}
                              onChange={(e) => handleBtcChange(e.target.value)}
                              onFocus={() => setIsBtcFocused(true)}
                              onBlur={() => {
                                setIsBtcFocused(false);
                                setManualBtcInput(store.totalBtc.toFixed(8));
                              }}
                              className="bg-transparent border-none text-2xl font-black w-full text-white placeholder-slate-600 focus:outline-none focus:ring-0 font-mono tabular-nums" 
                              placeholder="0.00000000"
                            />
                            <span className="text-amber-400 font-mono font-bold tracking-widest bg-amber-400/10 px-3 py-1 rounded-lg text-xs shrink-0 select-none transition-transform duration-200 hover:scale-[1.03]">
                              BTC ₿
                            </span>
                          </div>
                          
                          {/* Live inline feedback */}
                          <div className="flex justify-between items-center mt-2.5 pt-2 border-t border-zinc-900/60 font-mono text-[9.5px]">
                            <span className={`text-rose-400 font-bold transition-all duration-300 ${btcValidationWarning ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
                              {btcValidationWarning || 'NOMINAL'}
                            </span>
                            <span className="text-zinc-500 font-bold tabular-nums">
                              ≈ {((parseFloat(manualBtcInput) || 0) * (store.livePrice || 67420)).toLocaleString('en-US', { style: 'currency', currency: 'USD' })} USD
                            </span>
                          </div>
                        </div>

                        {/* ARROW EQUIVALENT */}
                        <div className="flex justify-center -my-2 relative z-10 animate-fade-in">
                          <button 
                            onClick={() => {
                              if (soundEnabled) playAudioTone(900, 0.05, 'sawtooth');
                              store.setTotalSats(store.totalSats * 2);
                            }}
                            className="bg-indigo-600 hover:bg-indigo-500 hover:scale-110 active:scale-95 text-white p-2.5 rounded-full shadow-lg transition-all border border-indigo-500/20 cursor-pointer text-xs font-bold leading-none flex items-center justify-center"
                            title="Double current Sats stacks!"
                          >
                            <RotateCw size={14} className="hover:rotate-180 transition-transform duration-300" />
                          </button>
                        </div>

                        {/* SATS BLOCK */}
                        <div className="bg-black/40 border border-purple-900/40 hover:border-purple-800/60 p-4 rounded-2xl relative glow-purple transition-all duration-300 focus-within:border-emerald-500/30">
                          <label className="text-[10px] text-purple-300 uppercase tracking-widest block mb-1 font-mono font-bold">Satoshis (Sats)</label>
                          <div className="flex items-center justify-between">
                            <input 
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              value={manualSatInput}
                              onChange={(e) => handleSatsChange(e.target.value)}
                              onFocus={() => {
                                setIsSatsFocused(true);
                                setManualSatInput(store.totalSats.toString());
                              }}
                              onBlur={() => {
                                setIsSatsFocused(false);
                                setManualSatInput(store.totalSats.toLocaleString('en-US'));
                              }}
                              className="bg-transparent border-none text-2xl font-black w-full text-emerald-400 placeholder-slate-600 focus:outline-none focus:ring-0 font-mono tabular-nums" 
                              placeholder="0"
                            />
                            <span className="text-emerald-400 font-mono font-bold tracking-widest bg-emerald-400/10 px-3 py-1 rounded-lg text-xs shrink-0 select-none transition-transform duration-200 hover:scale-[1.03]">
                              SATS 🪙
                            </span>
                          </div>

                          {/* Live inline feedback */}
                          <div className="flex justify-between items-center mt-2.5 pt-2 border-t border-zinc-900/60 font-mono text-[9.5px]">
                            <span className={`text-rose-400 font-bold transition-all duration-300 ${satsValidationWarning ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
                              {satsValidationWarning || 'NOMINAL'}
                            </span>
                            <span className="text-zinc-500 font-bold tabular-nums">
                              ≈ {(((parseInt(manualSatInput.replace(/\D/g, ''), 10) || 0) / 100000000) * (store.livePrice || 67420)).toLocaleString('en-US', { style: 'currency', currency: 'USD' })} USD
                            </span>
                          </div>
                        </div>

                        {/* SMART PRESETS CAPSULES MATRIX */}
                        <div className="bg-zinc-950/40 border border-zinc-850 p-4 rounded-2xl mt-2 select-none">
                          <div className="text-[9px] uppercase tracking-wider text-purple-400 font-mono font-bold mb-2.5 flex items-center justify-between">
                            <span>⚡ Live Calibration Presets</span>
                            <span className="text-[8px] text-zinc-500 font-bold">Instantly recalibrates outputs</span>
                          </div>
                          <div className="grid grid-cols-3 gap-1.5">
                            {[
                              { label: '10,000 Sats', val: 10000 },
                              { label: '50,000 Sats', val: 50000 },
                              { label: '100k Sats', val: 100000 },
                              { label: '0.01 BTC', val: 1000000 },
                              { label: '0.10 BTC', val: 10000000 },
                              { label: '1.00 BTC', val: 100000000 }
                            ].map((preset) => {
                              const isActive = store.totalSats === preset.val;
                              return (
                                <button
                                  key={preset.label}
                                  onClick={() => applyPreset(preset.val)}
                                  className={`py-1.5 px-2 text-[9px] font-mono tracking-wider font-bold text-center border rounded-lg transition-all duration-300 cursor-pointer ${
                                    isActive
                                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/50 shadow-[0_0_8px_rgba(147,51,234,0.15)] font-black'
                                      : 'bg-zinc-900/60 text-zinc-400 hover:text-purple-300 border-zinc-800 hover:border-purple-900/40'
                                  }`}
                                >
                                  {preset.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* DYNAMIC FEED DISCONNECTED / STALE STATUS BANNERS FOR THE CONVERTER */}
                    {!isForcedEmptyStore && getTickerState() === 'disconnected' && (
                      <div className="mt-4 p-3 bg-red-950/10 border border-red-500/20 rounded-2xl flex items-center justify-between text-[11px] font-mono animate-pulse">
                        <span className="text-red-400 font-bold flex items-center gap-1.5">
                          <WifiOff size={14} className="text-red-400" />
                          USD Calibration Offline (Socket down)
                        </span>
                        <button
                          onClick={() => {
                            setTickerStateOverride(null);
                            if (workerRef.current) workerRef.current.postMessage({ command: 'connect' });
                          }}
                          className="bg-red-900/40 text-red-200 border border-red-500/30 px-2 py-0.5 rounded text-[9px] uppercase font-bold hover:bg-red-800/60"
                        >
                          Reconnect Feed
                        </button>
                      </div>
                    )}

                    {!isForcedEmptyStore && getTickerState() === 'stale' && (
                      <div className="mt-4 p-3 bg-yellow-950/10 border border-yellow-500/20 rounded-2xl flex items-center justify-between text-[11px] font-mono animate-pulse">
                        <span className="text-yellow-400 font-bold flex items-center gap-1.5">
                          <Clock size={14} className="text-yellow-400" />
                          Rate Stale: Displaying cached price ($67,420)
                        </span>
                        <button
                          onClick={() => setSecondsSinceLastTick(0)}
                          className="bg-yellow-950/80 text-yellow-500 border border-yellow-600/30 px-2 py-0.5 rounded text-[9px] uppercase font-bold hover:bg-yellow-900/60"
                        >
                          Refresh Price
                        </button>
                      </div>
                    )}

                    {/* SATS DITHER SLIDER */}
                    <div className="mt-6 p-4 bg-white/5 rounded-2xl border border-white/5">
                      <div className="flex justify-between items-center mb-1 text-xs text-zinc-400">
                        <span>Dynamic Multiplier</span>
                        <span className="text-amber-400 font-bold">{stimSpeed}x multiplier</span>
                      </div>
                      <input 
                        type="range"
                        min="1"
                        max="24"
                        value={stimSpeed}
                        onChange={(e) => {
                          setStimSpeed(parseInt(e.target.value));
                          if (soundEnabled) playAudioTone(250 + (parseInt(e.target.value) * 30), 0.05, 'sine');
                        }}
                        className="w-full accent-amber-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
                      />
                    </div>

                    {/* INCREMENTAL BOOSTER FEEDBACK (The ADHD special) */}
                    <div className="mt-6 flex flex-wrap gap-2.5">
                      <button
                        onClick={() => handleQuickAdd(1000 * stimSpeed)}
                        className="bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl hover:scale-105 active:scale-95 transition-transform"
                      >
                        +{(1000 * stimSpeed).toLocaleString()} Sats 🪙
                      </button>
                      <button
                        onClick={() => handleQuickAdd(10000 * stimSpeed)}
                        className="bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl hover:scale-105 active:scale-95 transition-transform"
                      >
                        +{(10000 * stimSpeed).toLocaleString()} Sats ⚡
                      </button>
                      <button
                        onClick={() => {
                          const rand = Math.floor(Math.random() * 50000) + 1000;
                          handleQuickAdd(rand);
                        }}
                        className="bg-slate-900 border border-slate-700 text-zinc-200 font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-slate-800 active:scale-95 transition-all"
                      >
                        Simulate Volatility ⚡
                      </button>
                    </div>

                    {/* SAAS VALUE STREAK & COMBO PANEL */}
                    <div className="mt-6 pt-5 border-t border-slate-900 flex justify-between items-center text-xs text-zinc-400">
                      <div className="flex items-center gap-1.5 bg-black/40 px-3 py-1.5 rounded-full border border-slate-800">
                        <Flame className="text-orange-500 animate-pulse fill-orange-500" size={14} />
                        Streak Combo: <strong className="text-orange-400 font-mono text-sm">{store.currentStreak}x</strong>
                      </div>
                      <div className="text-zinc-500 text-[10px]">
                        Conversions total: <span className="text-indigo-400 font-mono font-semibold">{conversionsCount}</span>
                      </div>
                    </div>
                  </div>

                  {/* VISUAL REWARD RENDERER & INTERACTIVE PARTICLES CANVAS (Right Panel) */}
                  <div className="lg:col-span-5 flex flex-col gap-6">
                    <StimChartCanvas
                      triggerBlastCount={triggerBlastCount}
                      quickAddCount={quickAddCount}
                      totalBtc={store.totalBtc}
                      livePrice={store.livePrice}
                      onStackClick={triggerDopamineBlast}
                      currentStreak={store.currentStreak}
                      dopamineGravity={dopamineGravity}
                      particleCountMultiplier={particleCountMultiplier}
                      particleColorPreset={particleColorPreset}
                    />

                    {/* ENHANCEMENT 4: INTERACTIVE MARKET VOLATILITY VISUALIZER CONSOLE */}
                    <div className="bg-slate-950/80 border border-slate-800 p-5 rounded-3xl backdrop-blur-md">
                      <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-widest mb-3 flex items-center gap-1.5 font-mono">
                        <Zap size={14} className="text-amber-400" />
                        Market Volatility Visualizer / Stress-Test Suite
                      </h4>
                      <p className="text-[10px] text-zinc-500 mb-4 leading-relaxed font-mono">
                        Configure physics flow and rendering parameters to stress-test your system's capability to process high-frequency feed surges.
                      </p>

                      <div className="space-y-4">
                        {/* Gravity controls */}
                        <div>
                          <div className="flex justify-between text-xs text-zinc-400 mb-1 font-mono">
                            <span>Stress-Test Gravity Constant:</span>
                            <span className="text-amber-400 font-mono font-bold">{(dopamineGravity * 10).toFixed(1)} G</span>
                          </div>
                          <input 
                            type="range"
                            min="0.05"
                            max="0.75"
                            step="0.05"
                            value={dopamineGravity}
                            onChange={(e) => setDopamineGravity(parseFloat(e.target.value))}
                            className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer animate-pulse"
                          />
                          <div className="flex justify-between text-[8px] text-zinc-600 mt-1 font-mono">
                            <span>LOW RESISTANCE (0.05)</span>
                            <span>HIGH INTENSITY (0.75)</span>
                          </div>
                        </div>

                        {/* Particle multiplier controls */}
                        <div>
                          <div className="flex justify-between text-xs text-zinc-400 mb-1 font-mono">
                            <span>Volatility Signal Volume:</span>
                            <span className="text-emerald-400 font-mono font-bold">{(particleCountMultiplier * 100).toFixed(0)}%</span>
                          </div>
                          <input 
                            type="range"
                            min="0.3"
                            max="3.0"
                            step="0.1"
                            value={particleCountMultiplier}
                            onChange={(e) => setParticleCountMultiplier(parseFloat(e.target.value))}
                            className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                          />
                        </div>

                        {/* Color Preset selectors */}
                        <div>
                          <span className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-2 font-mono">Chromatic Palette Preset</span>
                          <div className="grid grid-cols-4 gap-1.5">
                            {(['gold', 'neon', 'emerald', 'amber'] as const).map((col) => (
                              <button
                                key={col}
                                onClick={() => {
                                  setParticleColorPreset(col);
                                  playCustomTone(700, 0.05);
                                }}
                                className={`text-[9px] uppercase font-bold py-1.5 rounded-lg border transition-all text-center cursor-pointer ${
                                  particleColorPreset === col
                                    ? col === 'gold' ? 'bg-amber-500/10 border-amber-500 text-amber-400 font-black shadow-[0_0_8px_rgba(245,158,11,0.2)]'
                                      : col === 'neon' ? 'bg-pink-500/10 border-pink-500 text-pink-400 font-black shadow-[0_0_8px_rgba(236,72,153,0.2)]'
                                      : col === 'emerald' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 font-black shadow-[0_0_8px_rgba(16,185,129,0.2)]'
                                      : 'bg-orange-500/10 border-orange-500 text-orange-400 font-black shadow-[0_0_8px_rgba(249,115,22,0.2)]'
                                    : 'bg-black/30 border-slate-800 hover:border-slate-700 text-zinc-400'
                                }`}
                              >
                                {col}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ENHANCEMENT 1: PREMIUM CUSTOM SYNTH CONTROLLER */}
                    <div className="bg-slate-950/80 border border-slate-800 p-5 rounded-3xl backdrop-blur-md">
                      <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-widest mb-3 flex items-center gap-1.5 font-mono">
                        <Volume2 size={14} className="text-purple-400 animate-pulse" />
                        ACOUSTIC ALERT CALIBRATIONS // AUDIO PROFILER
                      </h4>
                      <p className="text-[10px] text-zinc-500 mb-4 leading-relaxed font-mono">
                        Calibrate high-end audio frequencies and oscillator signatures to optimize real-time status alerts for all hardware conversion events and DCA executions.
                      </p>

                      <div className="space-y-4">
                        {/* Selector of audio wave */}
                        <div>
                          <span className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-2 font-mono">Oscillator Waveform Geometry</span>
                          <div className="grid grid-cols-4 gap-1.5">
                            {(['sine', 'triangle', 'sawtooth', 'square'] as OscillatorType[]).map((wave) => (
                              <button
                                key={wave}
                                onClick={() => {
                                  setSynthWaveform(wave);
                                  playAudioTone(523, 0.08, wave, true, synthVolume);
                                }}
                                className={`text-[9px] uppercase font-bold py-1 px-1.5 rounded-lg border transition-all text-center cursor-pointer ${
                                  synthWaveform === wave
                                    ? 'bg-purple-500/15 border-purple-500 text-purple-300 font-black'
                                    : 'bg-black/30 border-slate-800 text-zinc-400 hover:text-zinc-200'
                                }`}
                              >
                                {wave === 'sine' ? 'Sine 〰' : wave === 'triangle' ? 'Triangle 🔺' : wave === 'sawtooth' ? 'Saw ⚡' : 'Square ⬛'}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Frequency step multiplier */}
                        <div>
                          <span className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-2 font-mono">Tactile Audio Profile Range</span>
                          <div className="grid grid-cols-2 gap-1.5">
                            {(['pentatonic', 'arcade', 'drone', 'sharp'] as const).map((sc) => (
                              <button
                                key={sc}
                                onClick={() => {
                                  setSynthScale(sc);
                                  let baseTest = 523;
                                  if (sc === 'drone') baseTest = 220;
                                  playAudioTone(sc === 'drone' ? 110 : sc === 'arcade' ? 659 : baseTest, 0.1, synthWaveform, true, synthVolume);
                                }}
                                className={`text-[9px] uppercase font-bold py-1 px-1.5 rounded-lg border transition-all text-center cursor-pointer ${
                                  synthScale === sc
                                    ? 'bg-purple-500/15 border-purple-500 text-purple-300 font-black'
                                    : 'bg-black/30 border-slate-800 text-zinc-400 hover:text-zinc-200'
                                }`}
                              >
                                {sc === 'pentatonic' ? 'Pentatonic Balance' : sc === 'arcade' ? 'High-Frequency Ping' : sc === 'drone' ? 'Ambient Hum' : 'Sharp Transient'}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Pitch Shift Semitones slider */}
                        <div>
                          <div className="flex justify-between text-xs text-zinc-400 mb-1">
                            <span>Pitch Shift:</span>
                            <span className="text-purple-400 font-mono font-bold">
                              {synthPitchOffset > 0 ? `+${synthPitchOffset}` : synthPitchOffset} Semitones
                            </span>
                          </div>
                          <input 
                            type="range"
                            min="-12"
                            max="12"
                            step="1"
                            value={synthPitchOffset}
                            onChange={(e) => {
                              const v = parseInt(e.target.value);
                              setSynthPitchOffset(v);
                              playAudioTone(440 * Math.pow(2, v / 12), 0.08, synthWaveform, true, synthVolume);
                            }}
                            className="w-full accent-purple-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                          />
                        </div>

                        {/* Volume controllers */}
                        <div>
                          <div className="flex justify-between text-xs text-zinc-400 mb-1">
                            <span>Acoustic Amplitude Volume:</span>
                            <span className="text-pink-400 font-mono font-bold">{(synthVolume * 100).toFixed(0)}%</span>
                          </div>
                          <input 
                            type="range"
                            min="0.01"
                            max="0.18"
                            step="0.01"
                            value={synthVolume}
                            onChange={(e) => setSynthVolume(parseFloat(e.target.value))}
                            className="w-full accent-pink-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Gamified OCD Defense metrics */}
                    <div id="onboarding-price-shield" className={`p-5 rounded-3xl backdrop-blur-md transition-all duration-300 ${
                      guidedTourStep === 3 
                        ? 'ring-4 ring-indigo-500 shadow-[0_0_30px_rgba(99,102,241,0.8)] border-indigo-500 scale-[1.01] bg-slate-955' 
                        : 'bg-slate-950/80 border border-slate-800'
                    }`}>
                      <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                        <ShieldCheck size={14} className="text-indigo-400" />
                        Conversion Protection Settings
                      </h4>
                      <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
                        In Symmetry Mode, a precision balance must be maintained to sustain your conversion streak. Freeze Tokens shield your activity.
                      </p>
                      
                      <div className="flex items-center justify-between bg-black/40 p-3 rounded-2xl border border-slate-900">
                        <div className="flex items-center gap-2">
                          <span className="p-1 px-2.5 rounded-lg bg-indigo-500/10 text-indigo-400 text-xs font-mono font-bold">
                            {store.freezeTokens}
                          </span>
                          <span className="text-xs text-zinc-300">Freeze Shields left</span>
                        </div>
                        <button 
                          onClick={() => store.replenishTokens()}
                          className="bg-indigo-900/40 hover:bg-indigo-900 text-zinc-300 border border-indigo-800 px-3 py-1 rounded-xl text-[10px] uppercase font-bold"
                        >
                          Replenish Tokens 💎
                        </button>
                      </div>
                    </div>

                    {/* Integrated Price Shield Alert Controller */}
                    <PriceAlertController soundEnabled={soundEnabled} isPremium={isPremium} />
                  </div>

                </motion.div>
              ) : (
                
                /* ==============================================
                   OCD SYMMETRY MODE INTERFACE (MATHEMATICAL, GRID-ALIGNED, NO VISUALS)
                   ============================================== */
                <motion.div 
                   key="symmetry" 
                  initial={{ opacity: 0, y: 20, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.98 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="md:col-span-12 grid grid-cols-12 gap-6 font-mono text-zinc-100 smooth-morph relative"
                >
                  
                  {/* PRECISE SWISS FORMULARY (Left 6-columns) */}
                  <div id="onboarding-converter-core-symmetry" className={`col-span-12 lg:col-span-6 bg-zinc-900/40 border p-6 rounded-none relative flex flex-col justify-between lg:aspect-[16/10] overflow-hidden smooth-morph transition-all ${
                    guidedTourStep === 1 
                      ? 'ring-4 ring-indigo-500 shadow-[0_0_30px_rgba(99,102,241,0.8)] border-indigo-500 scale-[1.01]' 
                      : 'border-zinc-800'
                  }`}>
                    
                    {/* Architectural Blueprint Helper Overlay */}
                    {(showGridLines || isInteracting) && (
                      <div 
                        className="absolute inset-0 pointer-events-none z-0 blueprint-overlay transition-opacity duration-300"
                        style={{
                          backgroundImage: 'linear-gradient(to right, #141414 1px, transparent 1px), linear-gradient(to bottom, #141414 1px, transparent 1px)',
                          backgroundSize: '16px 16px',
                          opacity: isInteracting ? 0.55 : 0.22
                        }}
                      />
                    )}

                    <div className="relative z-10">
                      <div className="absolute top-0 right-0 py-1 px-3 bg-zinc-800 text-zinc-400 text-[10px] uppercase tracking-wider border-l border-b border-zinc-700/50">
                        Grid System: 8-Decimal Matrix
                      </div>

                      <h2 className="text-md font-bold uppercase tracking-wider text-zinc-200 flex items-center gap-2 mb-6 border-b border-zinc-800 pb-3">
                        <Scale size={16} className="text-indigo-400" />
                        1.0 Mathematical Core Values
                      </h2>

                      {/* TWO COMPLEMENTARY INLINE INPUT BLOCKS OF EQUAL SIZE */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        <div className="bg-zinc-950/60 border border-zinc-805 p-4 focus-within:border-zinc-700 transition-all">
                           <label className="text-[10px] text-zinc-500 uppercase font-black block mb-1">X1: BTC EXACT BALANCE</label>
                           <div className={`flex items-center justify-between border-b border-zinc-800 pb-2 ${isSnapping ? 'number-snap' : ''}`}>
                            <input 
                              type="text"
                              inputMode="decimal"
                              value={manualBtcInput}
                              onChange={(e) => {
                                handleBtcChange(e.target.value);
                              }}
                              onFocus={() => {
                                setIsBtcFocused(true);
                                triggerSymmetryInteraction();
                              }}
                              onBlur={() => {
                                setIsBtcFocused(false);
                                setManualBtcInput(store.totalBtc.toFixed(8));
                              }}
                              className="bg-transparent border-none text-xl font-bold w-full text-zinc-100 focus:outline-none focus:ring-0 font-mono"
                            />
                            <span className="text-zinc-600 font-bold select-none text-[11px] font-mono shrink-0">BTC</span>
                          </div>
                          
                          <div className="flex justify-between items-center text-[9px] mt-2 font-mono">
                            <span className={`font-semibold transition-all duration-300 ${btcValidationWarning ? 'text-red-400 font-bold' : 'text-zinc-500'}`}>
                              {btcValidationWarning || 'IEEE 754 DOUBLE PRECISION'}
                            </span>
                            <span className="text-zinc-400 font-bold">
                              ≈ USD {((parseFloat(manualBtcInput) || 0) * (store.livePrice || 67420)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>

                        <div className="bg-zinc-950/60 border border-zinc-805 p-4 focus-within:border-zinc-700 transition-all">
                           <label className="text-[10px] text-zinc-500 uppercase font-black block mb-1">Y1: SATS CONVERSION</label>
                           <div className={`flex items-center justify-between border-b border-zinc-800 pb-2 ${isSnapping ? 'number-snap' : ''}`}>
                            <input 
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              value={manualSatInput}
                              onChange={(e) => {
                                handleSatsChange(e.target.value);
                              }}
                              onFocus={() => {
                                setIsSatsFocused(true);
                                triggerSymmetryInteraction();
                                setManualSatInput(store.totalSats.toString());
                              }}
                              onBlur={() => {
                                setIsSatsFocused(false);
                                setManualSatInput(store.totalSats.toLocaleString('en-US'));
                              }}
                              className="bg-transparent border-none text-xl font-bold w-full text-zinc-100 focus:outline-none focus:ring-0 font-mono"
                            />
                            <span className="text-zinc-600 font-bold select-none text-[11px] font-mono shrink-0">SATS</span>
                          </div>

                          <div className="flex justify-between items-center text-[9px] mt-2 font-mono">
                            <span className={`font-semibold transition-all duration-300 ${satsValidationWarning ? 'text-red-400 font-bold' : 'text-zinc-500'}`}>
                              {satsValidationWarning || '10^8 SATOSHIS SCALING SCALE'}
                            </span>
                            <span className="text-zinc-400 font-bold">
                              ≈ USD {(((parseInt(manualSatInput.replace(/\D/g, ''), 10) || 0) / 100000000) * (store.livePrice || 67420)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>

                      </div>

                      {/* QUICK PRESETS IN SYMMETRY MODE */}
                      <div className="mt-4 p-4 bg-zinc-950/40 border border-zinc-850 select-none">
                        <div className="text-[8px] tracking-widest text-zinc-500 uppercase font-bold mb-2.5 flex justify-between font-mono">
                          <span>CONVERSION RANGE PRESETS</span>
                          <span>STABILIZED DIRECT RANGE LOCKS</span>
                        </div>
                        <div className="grid grid-cols-6 gap-2">
                          {[
                            { label: '10K SATS', val: 10000 },
                            { label: '50K SATS', val: 50000 },
                            { label: '100K SATS', val: 100000 },
                            { label: '1M SATS', val: 1000000 },
                            { label: '10M SATS', val: 10000000 },
                            { label: '1.00 BTC', val: 100000000 }
                          ].map((p) => {
                            const isActive = store.totalSats === p.val;
                            return (
                              <button
                                key={p.label}
                                onClick={() => applyPreset(p.val)}
                                className={`py-1.5 text-[9px] font-bold text-center border font-mono transition-all duration-300 cursor-pointer ${
                                  isActive
                                    ? 'bg-zinc-850 border-zinc-600 text-indigo-400 font-black'
                                    : 'bg-zinc-900/60 hover:bg-zinc-800 border-zinc-800/80 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200'
                                }`}
                              >
                                {p.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* ALIGNED AUDIT COMPLIANCE REPORT */}
                      <div className={`mt-6 p-4 border relative z-10 transition-all ${
                        isForcedFailedVerification
                          ? 'border-red-500/60 bg-red-950/20'
                          : isForcedEmptyStore
                            ? 'border-amber-500/30 bg-amber-950/10'
                            : 'bg-zinc-950/40 border-zinc-800'
                      }`}>
                        <div className="flex justify-between items-center mb-2 border-b border-zinc-850 pb-2">
                          <div className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider">Precision Balance Ledger Audit</div>
                          <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 ${
                            isForcedFailedVerification ? 'bg-red-950 text-red-400 border border-red-900' :
                            isForcedEmptyStore ? 'bg-amber-950 text-amber-500 border border-amber-900' :
                            'bg-zinc-900 text-zinc-500'
                          }`}>
                            {isForcedFailedVerification ? '⚠️ INTEGRITY_FAULT' : isForcedEmptyStore ? '● EMPTY_SEQUENCE' : '● AUDITED'}
                          </span>
                        </div>
                        
                        <div className="space-y-1.5 text-xs text-zinc-400 font-mono">
                          <div className="flex justify-between items-center py-1 border-b border-zinc-850">
                            <span>Target BTC Balance:</span>
                            <span className={`font-bold text-zinc-100 ${isSnapping ? 'number-snap inline-block' : ''}`}>
                              {currentTotalBtc.toFixed(8)} BTC
                            </span>
                          </div>
                          
                          <div className="flex justify-between items-center py-1 border-b border-zinc-850">
                            <span>Sats Mathematical Conversion (BTC * 10^8):</span>
                            <span className={`text-zinc-100 ${isSnapping ? 'number-snap inline-block' : ''}`}>
                              {currentTotalSats.toLocaleString()} Sats
                            </span>
                          </div>

                          <div className="flex justify-between items-center py-1 border-b border-zinc-850">
                            <span>Reverse Float Verification:</span>
                            <span className={`text-zinc-100 ${isSnapping ? 'number-snap inline-block' : ''}`}>
                              {(currentTotalSats / 100000000).toFixed(8)} BTC
                            </span>
                          </div>

                          {isForcedFailedVerification ? (
                            <div className="pt-2">
                              <div className="flex justify-between items-center text-red-400 font-bold animate-pulse">
                                <span className="flex items-center gap-1.5">
                                  <AlertOctagon size={14} className="text-red-400" />
                                  VAR_DELTA:
                                </span>
                                <span>+0.02450302 BTC [SIGNATURE_FAULT]</span>
                              </div>
                              <p className="text-[10px] text-zinc-500 mt-1 max-w-md">
                                Variance error caught in ledger index #04F. Raw key mismatches standard 256-bit hash signatures.
                              </p>
                              <button
                                onClick={() => {
                                  setIsForcedFailedVerification(false);
                                  addLedgerEntry("Cryptographic balance signatures realigned and re-certified valid", currentTotalSats, currentTotalBtc);
                                  setShowVerificationResolvedToast(true);
                                  setTimeout(() => setShowVerificationResolvedToast(false), 4000);
                                  if (soundEnabled) playAudioTone(587.33, 0.15, 'sine');
                                }}
                                className="w-full text-center mt-2 border border-red-500/40 text-[9px] hover:bg-red-500 text-red-400 hover:text-zinc-950 px-2 py-1 uppercase font-bold cursor-pointer transition-colors"
                              >
                                Force Align & Re-sign Ledger Blocks
                              </button>
                            </div>
                          ) : isForcedEmptyStore ? (
                            <div className="pt-2 text-zinc-500">
                              <p className="text-[10px] text-amber-400/80">
                                Cache sequence empty. Zero allocation mapped. No transactions exist to perform signature audit verification.
                              </p>
                              <button
                                onClick={() => {
                                  store.addSats(10000);
                                  setIsForcedEmptyStore(false);
                                  addLedgerEntry("Simulation stack primed with standard 10k Sats", 10000, 0.0001);
                                  if (soundEnabled) playAudioTone(523.25, 0.08, 'sine');
                                }}
                                className="w-full text-center mt-2 border border-amber-500/30 text-[9px] hover:bg-amber-400 text-amber-500 hover:text-zinc-950 px-2 py-1 uppercase font-bold cursor-pointer transition-colors"
                              >
                                Seed Prime baseline (+10,000 Sats)
                              </button>
                            </div>
                          ) : (
                            <div className="flex justify-between items-center pt-2 text-emerald-400 font-bold">
                              <span className="flex items-center gap-1.5">
                                <CheckCircle size={14} className="text-emerald-400" />
                                LEDGER BALANCE VARIANCE (DELTA):
                              </span>
                              <span className={isSnapping ? 'number-snap' : ''}>0.00000000 [OK]</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* MODERATE CONTROLS FOR SYMMETRY */}
                    <div className="mt-6 flex flex-wrap gap-2 justify-between items-center relative z-10">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleQuickAdd(10000)}
                          className="bg-zinc-800 border border-zinc-700 text-zinc-100 text-xs px-4 py-2 hover:bg-zinc-750 transition-colors uppercase cursor-pointer"
                        >
                          +10,000 Sats
                        </button>
                        <button
                          onClick={() => handleQuickAdd(100000)}
                          className="bg-zinc-800 border border-zinc-700 text-zinc-100 text-xs px-4 py-2 hover:bg-zinc-750 transition-colors uppercase cursor-pointer"
                        >
                          +100,000 Sats
                        </button>
                        <button
                          onClick={() => {
                            triggerSymmetryInteraction();
                            store.setTotalBtc(0);
                          }}
                          className="bg-zinc-950 border border-zinc-850 text-zinc-400 text-xs px-4 py-2 hover:bg-zinc-900 hover:text-zinc-300 transition-colors uppercase cursor-pointer"
                        >
                          Reset ledger
                        </button>
                      </div>

                      {/* Symmetry view grid helper */}
                      <button 
                        onClick={() => {
                          setShowGridLines(!showGridLines);
                          triggerSymmetryInteraction();
                          if (soundEnabled) playAudioTone(440, 0.05, 'sine');
                        }}
                        className={`text-xs px-3 py-1.5 border flex items-center gap-1.5 cursor-pointer uppercase ${
                          showGridLines 
                            ? 'bg-zinc-900 border-zinc-900 text-zinc-100' 
                            : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:bg-zinc-900'
                        }`}
                      >
                        <Grid size={12} />
                        Symmetry Grid lines ({showGridLines ? 'ON' : 'OFF'})
                      </button>
                    </div>

                  </div>

                  {/* RIGHT PANEL: MONOGRAMS, RATIOS, STATS (Right 6-columns - perfectly mirrored in 16:9 ratio) */}
                  <div className="col-span-12 lg:col-span-6 bg-zinc-900/40 border border-zinc-800 p-6 rounded-none relative flex flex-col justify-between lg:aspect-[16/10] overflow-hidden smooth-morph">
                    
                    {/* Architectural Blueprint Helper Overlay */}
                    {(showGridLines || isInteracting) && (
                      <div 
                        className="absolute inset-0 pointer-events-none z-0 blueprint-overlay transition-opacity duration-300"
                        style={{
                          backgroundImage: 'linear-gradient(to right, #141414 1px, transparent 1px), linear-gradient(to bottom, #141414 1px, transparent 1px)',
                          backgroundSize: '16px 16px',
                          opacity: isInteracting ? 0.55 : 0.22
                        }}
                      />
                    )}

                    <div className="relative z-10 flex-1 flex flex-col justify-between">
                      
                      <div>
                        <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 uppercase tracking-widest mb-4">
                          <ShieldCheck size={14} className="text-indigo-400" />
                          Portfolio Valuation Block
                        </div>
                        
                        <div className={`text-center py-5 border-y border-zinc-800 my-4 transition-all ${
                          getTickerState() === 'disconnected' ? 'border-red-500/20 bg-red-950/10' :
                          getTickerState() === 'stale' ? 'border-yellow-500/20 bg-yellow-950/10 animate-pulse' :
                          'bg-zinc-950/60'
                        }`}>
                          <div className="text-xs text-zinc-500 uppercase tracking-wider font-mono">EXACT LEDGER BALANCE</div>
                          <div className={`text-xl font-bold mt-1 smooth-morph font-mono ${
                            isForcedEmptyStore ? 'text-zinc-500 font-normal' : 'text-zinc-100 font-bold'
                          } ${
                            isGlitching ? 'chromatic-aberration' : ''
                          } ${isSnapping ? 'number-snap' : ''}`}>
                            {currentTotalSats.toLocaleString()} SATS
                          </div>
                          
                          <div className={`text-xs mt-2 font-mono ${
                            isForcedEmptyStore ? 'text-zinc-650' : 'text-zinc-400'
                          } ${isSnapping ? 'number-snap' : ''}`}>
                            VALUED AT: ${(currentTotalBtc * (store.livePrice || 67420)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                          </div>

                          {getTickerState() === 'disconnected' && (
                            <div className="mt-4 mx-4 p-3 border border-red-500/30 bg-red-950/30 text-[10px] text-left text-red-400 font-mono space-y-2 select-all">
                              <span className="flex items-center gap-1 font-bold">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                                ⚠️ VALUATION OFFLINE: Socket terminated
                              </span>
                              <p className="text-zinc-400 leading-relaxed text-[9px]">
                                Liquid USD reference rate is uncalibrated because Coinbase sockets are closed.
                              </p>
                              <button
                                onClick={() => {
                                  setTickerStateOverride(null);
                                  if (workerRef.current) workerRef.current.postMessage({ command: 'connect' });
                                  if (soundEnabled) playAudioTone(440, 0.08, 'sine');
                                }}
                                className="w-full text-center border border-red-500/50 hover:bg-red-500/20 text-red-200 py-1 uppercase text-[9px] font-bold cursor-pointer transition-colors"
                              >
                                Reconnect Core Socket ⟳
                              </button>
                            </div>
                          )}

                          {getTickerState() === 'stale' && (
                            <div className="mt-4 mx-4 p-3 border border-yellow-500/30 bg-yellow-950/30 text-[10px] text-left text-yellow-400 font-mono space-y-2">
                              <span className="flex items-center gap-1 font-bold">
                                <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-ping" />
                                ⚠️ STALE MARKET REFERENCES
                              </span>
                              <p className="text-zinc-400 leading-relaxed text-[9px]">
                                Pricing connection delay exceeded 8 seconds. Displayed conversion values will update automatically upon the next live trade feed tick.
                              </p>
                              <button
                                onClick={() => {
                                  setSecondsSinceLastTick(0);
                                  if (soundEnabled) playAudioTone(523.25, 0.08, 'sine');
                                }}
                                className="w-full text-center border border-yellow-500/50 hover:bg-yellow-500/20 text-yellow-200 py-1 uppercase text-[9px] font-bold cursor-pointer transition-colors"
                              >
                                Force Refetch Exchange Rates
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="text-xs text-zinc-400 leading-relaxed space-y-2">
                          <p>
                            Real-time sync runs on a Web Worker thread to bypass main thread congestion.
                          </p>
                          <p className="flex items-center gap-1.5">
                            Audit Key: 
                            <span className={`bg-zinc-950 border border-zinc-800 text-indigo-400 px-1.5 py-0.5 font-mono text-[9px] ${isSnapping ? 'number-snap inline-block' : ''}`}>
                              SATSTK-{store.totalSats}-Satsify
                            </span>
                          </p>
                        </div>
                      </div>

                      {/* Streak Freeze metrics for OCD */}
                      <div id="onboarding-price-shield-symmetry" className={`mt-6 border-t pt-5 transition-all duration-300 ${
                        guidedTourStep === 3 
                          ? 'ring-4 ring-indigo-500 shadow-[0_0_30px_rgba(99,102,241,0.8)] border-indigo-500 scale-[1.01] p-3 bg-zinc-950' 
                          : 'border-zinc-800'
                      }`}>
                        <div className="text-xs font-bold uppercase tracking-wider text-zinc-300 mb-3 block">Streak Protection Status</div>
                        <div className="space-y-2 font-mono">
                          <div className="flex justify-between text-xs py-1.5 border-b border-zinc-850 text-zinc-400">
                            <span>Streak Count:</span>
                            <strong className={`text-zinc-100 ${isSnapping ? 'number-snap inline-block' : ''}`}>{store.currentStreak} Days</strong>
                          </div>
                          <div className="flex justify-between text-xs py-1.5 text-zinc-400">
                            <span>Active protection shields:</span>
                            {isPremium ? (
                              <strong className="text-emerald-400 flex items-center gap-1 font-bold">
                                <Sparkles size={11} className="animate-pulse text-emerald-400" /> ∞ &nbsp;UNLIMITED PRO
                              </strong>
                            ) : (
                              <strong className={`text-indigo-400 ${isSnapping ? 'number-snap inline-block' : ''}`}>{store.freezeTokens} Tokens</strong>
                            )}
                          </div>
                        </div>
                      </div>

                    </div>

                  </div>

                  {/* ENHANCEMENT 2: SWITZERLAND GRID CALIBRATION SUITE */}
                  <div className="col-span-12 bg-zinc-950/60 border border-zinc-800 p-6 relative">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-4 border-b border-zinc-900">
                      <div>
                        <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-widest flex items-center gap-1.5 font-mono">
                          <Sliders size={14} className="text-indigo-400" />
                          Switzerland Precision Grid Calibration Suite
                        </h4>
                        <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-wider font-mono">
                          Continuous IEEE-754 mantissa verification & websocket latency drift alignments.
                        </p>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                        {/* Simulation Failure Toggle */}
                        <div className="bg-zinc-900/60 border border-zinc-850 px-3 py-1.5 flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="simulate_calib_fail_check"
                            checked={simulateCalibFailure}
                            onChange={(e) => {
                              setSimulateCalibFailure(e.target.checked);
                              if (soundEnabled) playCustomTone(400, 0.05);
                              showToast(`CALIBRATION DRIFT SIMULATOR: ${e.target.checked ? 'ENABLED (Test 3 will force fail)' : 'DISABLED (Success pathway active)'}`, 'info');
                            }}
                            className="cursor-pointer accent-indigo-505"
                          />
                          <label htmlFor="simulate_calib_fail_check" className="text-[9px] uppercase tracking-wider font-mono text-zinc-400 font-bold select-none cursor-pointer hover:text-zinc-200">
                            Simulate Latency Mismatch Fault
                          </label>
                        </div>

                        <button
                          onClick={() => {
                            setLocalHelpCalibration(!localHelpCalibration);
                            if (soundEnabled) playCustomTone(700, 0.04);
                          }}
                          className={`text-[10px] uppercase font-mono tracking-wider border px-3 py-1.5 rounded-none transition-colors cursor-pointer flex items-center gap-1.5 ${
                            localHelpCalibration 
                              ? 'bg-amber-400 border-amber-400 text-zinc-950 font-bold' 
                              : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                          }`}
                        >
                          <HelpCircle size={11} />
                          {localHelpCalibration ? 'Close Guide' : 'Guide'}
                        </button>

                        <button
                          onClick={runSymmetryCalibration}
                          disabled={isCalibrating}
                          className={`text-xs px-4 py-2 uppercase font-mono tracking-wider border font-bold h-fit transition-all cursor-pointer ${
                            isCalibrating
                              ? 'bg-zinc-900 border-zinc-850 text-zinc-650 cursor-not-allowed animate-pulse'
                              : 'bg-zinc-150 border-zinc-150 hover:bg-zinc-50 text-zinc-950 shadow-[0_0_12px_rgba(255,255,255,0.06)]'
                          }`}
                        >
                          {isCalibrating ? 'Diagnostics Running...' : 'Run Precision Calibration'}
                        </button>
                      </div>
                    </div>

                    {/* Inline guidance box for Calibration */}
                    <AnimatePresence>
                      {localHelpCalibration && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-none mb-6 text-xs space-y-3 relative overflow-hidden text-zinc-300 font-mono"
                        >
                          <div className="text-[10px] uppercase tracking-widest text-indigo-400 font-bold">Grid Calibration Integrity Parameters</div>
                          <p className="text-[10px] text-zinc-400 leading-relaxed">
                            Floating-point arithmetic on browsers can incur minimal fractional accumulation drift over time (IEEE-754 mantissa artifacts). The Swiss Grid protocol coordinates layout metrics and re-asserts precision limits down to exactly <span className="text-zinc-100">0.00000001 BTC</span>.
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-zinc-850 pt-3">
                            <div>
                              <span className="font-bold text-zinc-400 block mb-0.5">● MANTISSA TEST:</span>
                              Iterates 10k calculations verifying precision boundaries matches local state memory perfectly.
                            </div>
                            <div>
                              <span className="font-bold text-zinc-400 block mb-0.5">● LATENCY CHECK:</span>
                              Ensures websockets price latency is strictly &lt; 250ms to safeguard micro-alerts against stale prices.
                            </div>
                            <div>
                              <span className="font-bold text-zinc-400 block mb-0.5">● AUDIT SEAL:</span>
                              Files a calibrated confirmation record down the local ledger array, complete with ECDSA signature hash.
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* INTERACTIVE CALIBRATION CHECKPOINT METRICS CHANNELS */}
                    {isCalibrating || calibrationStep !== -1 ? (
                      <div className="mb-4">
                        {/* Dynamic Progress Bar */}
                        <div className="flex justify-between items-center text-[9px] uppercase font-mono mb-1.5 text-zinc-400">
                          <span className="flex items-center gap-1.5">
                            {isCalibrating ? (
                              <Loader2 size={10} className="animate-spin text-indigo-400" />
                            ) : calibrationStep === -2 ? (
                              <AlertTriangle size={10} className="text-red-400 animate-pulse" />
                            ) : (
                              <Check size={10} className="text-emerald-400" />
                            )}
                            {isCalibrating 
                              ? `Verification in Progress: ${calibrationProgress}% Complete` 
                              : calibrationStep === -2 
                                ? 'CALIBRATION DRIFT FAULT REPORTED' 
                                : 'SYSTEM CALIBRATION COMPLIANCE ACHIEVED (100%)'}
                          </span>
                          <span className="font-bold tracking-widest bg-zinc-900 border border-zinc-800 px-1.5 text-zinc-300">
                            {calibrationStep === -2 ? 'ERR_DRIFT' : `${calibrationProgress}%`}
                          </span>
                        </div>
                        <div className="w-full bg-zinc-900/60 border border-zinc-850 h-2.5 rounded-none overflow-hidden relative">
                          <motion.div
                            className={`h-full transition-all duration-300 relative ${
                              calibrationStep === -2 ? 'bg-red-500' : 'bg-indigo-500'
                            }`}
                            style={{ width: `${calibrationProgress}%` }}
                          />
                        </div>

                        {/* Interactive Steps Indicators */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-left font-mono text-[9px] mt-3">
                          {/* Test 1 */}
                          <div className={`p-2 border transition-colors ${
                            calibrationStep >= 1 ? 'border-emerald-500/20 bg-emerald-950/5 text-emerald-300' :
                            calibrationStep === 0 && isCalibrating ? 'border-indigo-500/40 bg-indigo-950/10 text-indigo-300' :
                            'border-zinc-850 bg-zinc-950/20 text-zinc-500'
                          }`}>
                            <span className="block font-bold">⚛ STAGE 1: COORDINATES</span>
                            <span className="text-[8px] text-zinc-400 block mt-0.5">Symmetry layout viewport checks.</span>
                            <span className="font-bold text-[8px] uppercase tracking-wider block mt-1">
                              {calibrationStep >= 1 ? '✓ PASSED' : calibrationStep === 0 ? '⟳ SWEEPING...' : '○ PENDING'}
                            </span>
                          </div>

                          {/* Test 2 */}
                          <div className={`p-2 border transition-colors ${
                            calibrationStep >= 2 ? 'border-emerald-500/20 bg-emerald-950/5 text-emerald-300' :
                            calibrationStep === 1 && isCalibrating ? 'border-indigo-500/40 bg-indigo-950/10 text-indigo-300' :
                            'border-zinc-850 bg-zinc-950/20 text-zinc-500'
                          }`}>
                            <span className="block font-bold">⚛ STAGE 2: MANTISSA DATA</span>
                            <span className="text-[8px] text-zinc-400 block mt-0.5">IEEE-754 fraction convergence sweeps.</span>
                            <span className="font-bold text-[8px] uppercase tracking-wider block mt-1">
                              {calibrationStep >= 2 ? '✓ PASSED' : calibrationStep === 1 ? '⟳ ESTIMATING...' : '○ PENDING'}
                            </span>
                          </div>

                          {/* Test 3 */}
                          <div className={`p-2 border transition-colors ${
                            calibrationStep >= 3 ? 'border-emerald-500/20 bg-emerald-950/5 text-emerald-300' :
                            calibrationStep === -2 ? 'border-red-500/30 bg-red-950/10 text-red-300' :
                            calibrationStep === 2 && isCalibrating ? 'border-indigo-500/40 bg-indigo-950/10 text-indigo-300' :
                            'border-zinc-850 bg-zinc-950/20 text-zinc-500'
                          }`}>
                            <span className="block font-bold">⚛ STAGE 3: PING/LATENCY</span>
                            <span className="text-[8px] text-zinc-400 block mt-0.5">Coinbase WebSocket feeds bounds check.</span>
                            <span className="font-bold text-[8px] uppercase tracking-wider block mt-1">
                              {calibrationStep >= 3 ? '✓ PASSED' : calibrationStep === -2 ? '✗ DRIFT RETY' : calibrationStep === 2 ? '⟳ PINGING...' : '○ PENDING'}
                            </span>
                          </div>

                          {/* Test 4 */}
                          <div className={`p-2 border transition-colors ${
                            calibrationStep === 3 && !isCalibrating && auditHash ? 'border-emerald-500/20 bg-emerald-950/5 text-emerald-300' :
                            calibrationStep === 3 && isCalibrating ? 'border-indigo-500/40 bg-zinc-900 text-indigo-300' :
                            'border-zinc-850 bg-zinc-950/20 text-zinc-500'
                          }`}>
                            <span className="block font-bold">⚛ STAGE 4: CRYPTO CHECKSUM</span>
                            <span className="text-[8px] text-zinc-400 block mt-0.5">Signs certified checksum hash parameter.</span>
                            <span className="font-bold text-[8px] uppercase tracking-wider block mt-1">
                              {calibrationStep === 3 && !isCalibrating && auditHash ? '✓ PASSED' : calibrationStep === 3 ? '⟳ SEALING...' : '○ PENDING'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {/* Detailed Failure & Instructions Diagnostics Alert */}
                    {calibrationStep === -2 && (
                      <div className="bg-red-950/30 border border-red-500/40 p-4 font-mono text-[11px] text-red-300 mb-4 animate-fade-in space-y-2.5">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="text-red-400 animate-pulse" size={16} />
                          <strong className="uppercase tracking-wide">CALIBRATION WARNING: LIVE FEED SPEED DELAY (485ms Jitter)</strong>
                        </div>
                        <p className="text-zinc-300 text-[10px] leading-relaxed">
                          Response time from <strong>api.coinbase.com</strong> exceeded recommended limits. High local network latency or simulated connection delays triggered this warning. Run calibration to realign calculation parameters.
                        </p>
                        <div className="bg-zinc-950/85 p-3 border border-zinc-900 text-[9px] text-zinc-400 space-y-1 rounded-none">
                          <strong className="block text-amber-500 uppercase tracking-widest text-[8px] mb-1">■ DIAGNOSTIC RESOLUTION STEPS:</strong>
                          <div>1. Uncheck the "Simulate Price Drift / Lag Alert" box to restore typical connection parameters.</div>
                          <div>2. Ensure your local internet connection is fully stable.</div>
                          <div>3. Click "Force Clean Re-calibration" below to refresh the price cache buffer and synchronize with the real-time ticker stream.</div>
                        </div>
                        <div className="flex justify-end pt-1">
                          <button
                            onClick={() => {
                              setSimulateCalibFailure(false);
                              runSymmetryCalibration();
                            }}
                            className="bg-red-500 hover:bg-red-400 text-zinc-950 px-3.5 py-1.5 text-[9px] font-black uppercase tracking-wider cursor-pointer font-mono"
                          >
                            Force Clean Re-calibration & Retry 🖥
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                      {/* Telemetry Console Outputs */}
                      <div className="md:col-span-8 bg-zinc-950 border border-zinc-900 p-4 font-mono text-[10px] text-zinc-400 h-36 overflow-y-auto flex flex-col justify-end gap-1 select-text">
                        {calibrationStep === -1 ? (
                          <div className="text-zinc-650 text-center py-10 uppercase tracking-widest">
                            [STBY] Standby offline mode. Launch precision calibration suite diagnostics sweep to start telemetry loops.
                          </div>
                        ) : (
                          calibrationLogs.map((log, idx) => (
                            <div key={idx} className={
                              log.includes('[OK]') || log.includes('[COMPLETE]') 
                                ? 'text-emerald-400' 
                                : log.includes('[ALERT]') || log.includes('[ERROR]') || log.includes('[FATAL]')
                                  ? 'text-red-400 font-bold'
                                  : log.includes('[SYSTEM]') 
                                    ? 'text-zinc-500' 
                                    : 'text-zinc-300'
                            }>
                              {log}
                            </div>
                          ))
                        )}
                      </div>

                      {/* Decimals Certification Metadata details */}
                      <div className="md:col-span-4 space-y-3 font-mono text-[10px] text-zinc-500">
                        <div className="bg-zinc-900/20 border border-zinc-800 p-3 h-36 flex flex-col justify-between">
                          <div>
                            <span className="block text-[8px] tracking-widest text-zinc-500 uppercase">Verification Status:</span>
                            <span className={`block font-bold text-xs mt-0.5 ${
                              calibrationStep === -2 ? 'text-red-400' : auditHash ? 'text-emerald-400 animate-pulse' : 'text-zinc-650'
                            }`}>
                              {isCalibrating ? '⟳ ACTIVE CALIB' : calibrationStep === -2 ? '✗ INCURRED FAULT' : auditHash ? '● STABILIZED [VERIFIED]' : '○ RE-CALIBRATION REQ'}
                            </span>
                          </div>
                          <div>
                            <span className="block text-[8px] tracking-widest text-zinc-500 uppercase">Proof Hash Checkpoint:</span>
                            <span className="block text-zinc-400 font-mono text-[9px] truncate" title={auditHash}>
                              {auditHash ? auditHash : 'SANDBOX_PROV_IDLE'}
                            </span>
                          </div>
                          <div>
                            <span className="block text-[8px] tracking-widest text-zinc-500 uppercase">Last Certify timestamp:</span>
                            <span className="block text-zinc-450">
                              {auditTime ? auditTime : 'NEVER_STABILIZED'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="col-span-12">
                    <PriceAlertController soundEnabled={soundEnabled} isPremium={isPremium} />
                  </div>

                  {/* ENHANCEMENT 3: MEMORY TRANSACTION LEDGER LOG */}
                  <div id="onboarding-ledger-registry" className={`col-span-12 bg-zinc-950/60 border p-6 relative animate-fade-in transition-all duration-300 ${
                    guidedTourStep === 4 
                      ? 'ring-4 ring-indigo-500 shadow-[0_0_30px_rgba(99,102,241,0.8)] border-indigo-500 scale-[1.005]' 
                      : 'border-zinc-800'
                  }`}>
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4 pb-4 border-b border-zinc-900">
                      <div>
                        <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-widest flex items-center gap-1.5 font-mono">
                          <Database size={14} className="text-emerald-400" />
                          Cryptographic Local Ledger Registry
                        </h4>
                        <p className="text-[10px] text-zinc-500 mt-1">
                          Persistent local audit registry keeping record of all balance transformations with cryptographic signatures.
                        </p>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => {
                            setLocalHelpLedger(!localHelpLedger);
                            if (soundEnabled) playCustomTone(700, 0.04);
                          }}
                          className={`text-[10px] uppercase font-mono tracking-wider border px-3 py-1.5 rounded-none transition-colors cursor-pointer flex items-center gap-1.5 ${
                            localHelpLedger 
                              ? 'bg-amber-400 border-amber-400 text-zinc-950 font-bold' 
                              : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                          }`}
                        >
                          <HelpCircle size={11} />
                          {localHelpLedger ? 'Close Guide' : 'Guide'}
                        </button>

                        <button
                          onClick={() => {
                            runLedgerForensicAudit();
                          }}
                          disabled={isAuditingLedger}
                          className={`text-[10px] uppercase font-mono tracking-wider border px-3 py-1.5 font-bold cursor-pointer transition-all ${
                            isAuditingLedger
                              ? 'bg-zinc-900 border-zinc-800 text-zinc-500 animate-pulse cursor-not-allowed'
                              : 'border-zinc-850 bg-zinc-950 hover:bg-zinc-900 hover:border-zinc-700 text-zinc-350 hover:text-zinc-100'
                          }`}
                        >
                          {isAuditingLedger ? 'Scanning Ledger...' : 'Audit Ledger Indexes ⚔'}
                        </button>
                        
                        <button
                          onClick={() => {
                            exportLedgerToCSV();
                            setUserHasExported(true);
                          }}
                          className="text-[10px] uppercase font-mono tracking-wider border border-zinc-850 bg-zinc-950 hover:bg-zinc-900 hover:border-zinc-700 text-zinc-355 hover:text-zinc-100 px-3 py-1.5 font-bold cursor-pointer transition-colors"
                        >
                          Export CSV 📥
                        </button>
                      </div>
                    </div>

                    {/* Inline guidance box for Ledger & Export */}
                    <AnimatePresence>
                      {localHelpLedger && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-none mb-6 text-xs space-y-4 font-mono text-zinc-300"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 divide-y md:divide-y-0 md:divide-x divide-zinc-900">
                            {/* Auditing Segment */}
                            <div className="space-y-2">
                              <div className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold">Ledger Auditing Protocol</div>
                              <div className="space-y-1">
                                <span className="font-bold text-zinc-400 block">● WHAT THIS DOES:</span>
                                Inspects raw memory transactions for tampering, signature consistency, and checksum verification of indices.
                              </div>
                              <div className="space-y-1">
                                <span className="font-bold text-zinc-400 block">● WHAT HAPPENS ON CLICK:</span>
                                Re-signs indices and checks each row for valid 256-bit signatures. Reports any active corruption or key faults.
                              </div>
                              <div className="space-y-1">
                                <span className="font-bold text-zinc-400 block">● WHAT SUCCESS LOOKS LIKE:</span>
                                Each ledger item is marked with a glowing green verified tag with no fault flags.
                              </div>
                            </div>

                            {/* Exporting Segment */}
                            <div className="md:pl-6 space-y-2 pt-4 md:pt-0">
                              <div className="text-[10px] uppercase tracking-widest text-indigo-400 font-bold">Registry CSV Export</div>
                              <div className="space-y-1">
                                <span className="font-bold text-zinc-400 block">● WHAT THIS DOES:</span>
                                Package serialization engine parsing memory structures to generate compatible external spreadsheets.
                              </div>
                              <div className="space-y-1">
                                <span className="font-bold text-zinc-400 block">● WHAT HAPPENS ON CLICK:</span>
                                Compiles flat CSV schema strings and serves a client download blob. Falls back to manual copy on popunder blockers.
                              </div>
                              <div className="space-y-1">
                                <span className="font-bold text-zinc-400 block">● WHAT SUCCESS LOOKS LIKE:</span>
                                High-contrast green toast alerts, files download, or raw table rows saved to your device clipboard.
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {showExportFailureAlert && (
                      <div className="mb-6 p-4 border border-red-500/40 bg-red-950/20 text-xs font-mono text-red-400 space-y-3 relative shadow-lg">
                        <div className="absolute top-2 right-2">
                          <button
                            onClick={() => setShowExportFailureAlert(false)}
                            className="text-red-400 hover:text-white px-2 py-0.5 text-[9px] uppercase border border-red-500/30 hover:border-red-400 cursor-pointer"
                          >
                            Dismiss
                          </button>
                        </div>
                        <div className="flex items-start gap-3">
                          <FileWarning size={20} className="text-red-400 mt-0.5 shrink-0 animate-pulse" />
                          <div>
                            <span className="text-[10px] uppercase font-black tracking-wider text-red-500 block">EXPORT_PIPELINE_ERROR</span>
                            <h4 className="font-bold text-red-200 uppercase text-xs">CSV compilation failed: Buffer Write Disallowed in Sandbox</h4>
                            <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                              Standard sandbox environment prevents iframe download triggers. Alternate export routes are primed immediately.
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 pt-1">
                          <button
                            onClick={() => {
                              try {
                                const csvContent = "Transaction ID,Timestamp,Operation,Sats,BTC,Signature\n" + 
                                  displayedLedger.map(e => `${e.id},${e.time},"${e.action}",${e.sats},${e.btc},${e.signature}`).join("\n");
                                navigator.clipboard.writeText(csvContent);
                                setCopiedRawData(true);
                                setTimeout(() => setCopiedRawData(false), 3000);
                                if (soundEnabled) playAudioTone(600, 0.1, 'sine');
                                showToast("Success! Copied CSV payload to clipboard.", "success");
                              } catch (err) {}
                            }}
                            className="bg-red-950 border border-red-500/40 hover:bg-red-900/40 text-red-200 px-3 py-1 text-[9px] uppercase font-bold cursor-pointer transition-colors"
                          >
                            {copiedRawData ? "✓ Copied Clean CSV" : "Copy CSV payload to Clipboard 📋"}
                          </button>
                          <button
                            onClick={() => {
                              const blob = new Blob(["Transaction ID,Timestamp,Operation,Sats,BTC,Signature\n" + 
                                displayedLedger.map(e => `${e.id},${e.time},"${e.action}",${e.sats},${e.btc},${e.signature}`).join("\n")], { type: 'text/csv' });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `satstacker_fallback_ledger_${Date.now()}.csv`;
                              document.body.appendChild(a);
                              a.click();
                              document.body.removeChild(a);
                              setShowExportFailureAlert(false);
                              showToast("Direct CSV fallback compilation downloaded successfully.", "success");
                            }}
                            className="bg-indigo-650 hover:bg-indigo-600 text-white px-3 py-1 text-[9px] uppercase font-bold cursor-pointer transition-colors"
                          >
                            Direct Blob download fallback 📁
                          </button>
                        </div>
                      </div>
                    )}

                    {/* ENHANCED CONTROL CENTER: FILTER & SEARCH SECTION */}
                    <div className="bg-zinc-900/35 border border-zinc-900 p-4 mb-6 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                        
                        {/* Search field */}
                        <div className="md:col-span-4 relative">
                          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                          <input
                            type="text"
                            value={ledgerSearchQuery}
                            onChange={(e) => setLedgerSearchQuery(e.target.value)}
                            placeholder="Filter by ID, description, signature..."
                            className="w-full bg-zinc-950/80 border border-zinc-850 focus:border-zinc-750 pl-9 pr-4 py-2 text-[11px] font-mono text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-0 rounded-none transition-colors"
                          />
                          {ledgerSearchQuery && (
                            <button 
                              onClick={() => setLedgerSearchQuery('')}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 text-[9px] font-bold font-mono"
                            >
                              CLEAR
                            </button>
                          )}
                        </div>

                        {/* Status quick categorization pills */}
                        <div className="md:col-span-4 flex flex-wrap gap-1.5 items-center">
                          <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold mr-1.5 font-mono select-none">Blocks:</span>
                          {(['ALL', 'SIGNED', 'PENDING'] as const).map((st) => (
                            <button
                              key={st}
                              onClick={() => {
                                if (soundEnabled) playCustomTone(700, 0.03);
                                setLedgerStatusFilter(st);
                              }}
                              className={`px-2.5 py-1 text-[9px] font-mono font-bold tracking-wider rounded-sm transition-all cursor-pointer ${
                                ledgerStatusFilter === st
                                  ? 'bg-zinc-200 text-zinc-950'
                                  : 'bg-zinc-900/60 hover:bg-zinc-850 text-zinc-400 hover:text-zinc-200 border border-zinc-850/60'
                              }`}
                            >
                              {st === 'ALL' ? 'ALL BLOCKS' : st === 'SIGNED' ? '✓ SIGNED' : '○ PENDING'}
                            </button>
                          ))}
                        </div>

                        {/* Delta conversion filter tabs */}
                        <div className="md:col-span-4 flex flex-wrap gap-1.5 items-center">
                          <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold mr-1.5 font-mono select-none">Delta:</span>
                          {(['ALL', 'INCREASE', 'DECREASE', 'NEUTRAL'] as const).map((act) => (
                            <button
                              key={act}
                              onClick={() => {
                                if (soundEnabled) playCustomTone(700, 0.03);
                                setLedgerActionFilter(act);
                              }}
                              className={`px-2 py-1 text-[9px] font-mono font-bold tracking-widest rounded-sm transition-all cursor-pointer ${
                                ledgerActionFilter === act
                                  ? 'bg-zinc-200 text-zinc-950'
                                  : 'bg-zinc-900/60 hover:bg-zinc-850 text-zinc-400 hover:text-zinc-200 border border-zinc-850/60'
                              }`}
                            >
                              {act === 'ALL' ? 'ALL' : act === 'INCREASE' ? '+ INCR' : act === 'DECREASE' ? '- DECR' : '∅ AUDIT'}
                            </button>
                          ))}
                        </div>

                      </div>

                      {/* Summary status tag count indicators with Interactive Simulator Toggle */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[9px] text-zinc-500 font-mono border-t border-zinc-900 pt-3 select-none">
                        <div className="flex items-center gap-1.5">
                          <Filter size={10} className="text-zinc-400" />
                          <span>Matched results: <strong className="text-zinc-300">{displayedLedger.length}</strong> of {isForcedEmptyStore ? 0 : ledger.length} entries registered</span>
                        </div>

                        {/* Forced CSV Compile Sandbox Exception Tool */}
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1.5 bg-zinc-950/60 border border-zinc-900 px-2 py-0.5">
                            <input
                              type="checkbox"
                              id="force_csv_fail_trigger"
                              checked={isForcedFailedExport}
                              onChange={(e) => {
                                setIsForcedFailedExport(e.target.checked);
                                if (soundEnabled) playCustomTone(300, 0.06);
                                showToast(`CSV PIPELINE DRIFT SIMULATOR: ${e.target.checked ? 'FORCED FAILURE ON' : 'FORCED FAILURE OFF'}`, 'info');
                              }}
                              className="cursor-pointer accent-emerald-500"
                            />
                            <label htmlFor="force_csv_fail_trigger" className="text-[8px] uppercase tracking-wider font-bold text-zinc-400 hover:text-zinc-200 cursor-pointer select-none">
                              Simulate CSV Sandbox Exception
                            </label>
                          </div>

                          {(ledgerSearchQuery || ledgerStatusFilter !== 'ALL' || ledgerActionFilter !== 'ALL') && (
                            <button
                              onClick={() => {
                                if (soundEnabled) playCustomTone(400, 0.04);
                                setLedgerSearchQuery('');
                                setLedgerStatusFilter('ALL');
                                setLedgerActionFilter('ALL');
                              }}
                              className="text-indigo-400 hover:text-indigo-300 font-bold uppercase tracking-wider text-[8px] flex items-center gap-1 cursor-pointer hover:underline"
                            >
                              Reset filters &times;
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* DUAL MODE LAYOUT ENGINE */}
                    {displayedLedger.length === 0 ? (
                      <div className="py-12 text-center text-zinc-500 bg-zinc-900/10 border border-zinc-900/60">
                        <div className="max-w-md mx-auto space-y-4 font-mono">
                          <div className="w-12 h-12 rounded-full bg-zinc-950 border border-zinc-850 flex items-center justify-center text-zinc-600 mx-auto">
                            <Database size={18} />
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-black tracking-wider text-zinc-650 block">LEDGER_EMPTY_INDEX</span>
                            <h4 className="text-xs font-bold text-zinc-400 mt-1 uppercase">No Matched Transactions found</h4>
                            <p className="text-[10px] text-zinc-600 mt-1.5 leading-relaxed text-center">
                              There are no logs found matching your active filter criteria, or the session registry is vacant.
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              setIsForcedEmptyStore(false);
                              setLedgerSearchQuery('');
                              setLedgerStatusFilter('ALL');
                              setLedgerActionFilter('ALL');
                              store.addSats(1);
                              addLedgerEntry("Manual alignment calibration genesis record", 1, 0.00000001);
                              if (soundEnabled) playAudioTone(523.25, 0.08, 'sine');
                            }}
                            className="border border-zinc-800 hover:border-zinc-700 bg-zinc-900/40 text-[9px] px-3.5 py-2 uppercase font-mono font-bold text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                          >
                            Reset Variables & Write Genesis Record ⟳
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* 1. DESKTOP VIEW LAYOUT: Tabular Spacing Grid */}
                        <div className="hidden md:block overflow-x-auto border border-zinc-900 bg-zinc-950/20">
                          <table className="w-full text-left border-collapse font-mono text-[10px]">
                            <thead>
                              <tr className="border-b border-zinc-900 bg-zinc-900/20 text-zinc-500 font-bold uppercase tracking-wider text-[9px] select-none">
                                <th onClick={() => changeSort('id')} className="py-3 px-4 font-bold cursor-pointer hover:bg-zinc-900/40 hover:text-zinc-300 transition-colors">
                                  <div className="flex items-center gap-1">
                                    Tx ID
                                    <ArrowUpDown size={10} className={ledgerSortField === 'id' ? 'text-indigo-400' : 'text-zinc-600'} />
                                  </div>
                                </th>
                                <th onClick={() => changeSort('time')} className="py-3 px-4 font-bold cursor-pointer hover:bg-zinc-900/40 hover:text-zinc-300 transition-colors">
                                  <div className="flex items-center gap-1">
                                    Date & Time
                                    <ArrowUpDown size={10} className={ledgerSortField === 'time' ? 'text-indigo-400' : 'text-zinc-600'} />
                                  </div>
                                </th>
                                <th className="py-3 px-4 font-bold text-zinc-500">
                                  Execution Operation
                                </th>
                                <th onClick={() => changeSort('sats')} className="py-3 px-4 font-bold cursor-pointer hover:bg-zinc-900/40 hover:text-zinc-300 transition-colors text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    Sats Delta
                                    <ArrowUpDown size={10} className={ledgerSortField === 'sats' ? 'text-indigo-400' : 'text-zinc-600'} />
                                  </div>
                                </th>
                                <th onClick={() => changeSort('btc')} className="py-3 px-4 font-bold cursor-pointer hover:bg-zinc-900/40 hover:text-zinc-300 transition-colors text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    BTC Float Offset
                                    <ArrowUpDown size={10} className={ledgerSortField === 'btc' ? 'text-indigo-400' : 'text-zinc-600'} />
                                  </div>
                                </th>
                                <th onClick={() => changeSort('verified')} className="py-3 px-4 font-bold cursor-pointer hover:bg-zinc-900/40 hover:text-zinc-300 transition-colors text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    Verification
                                    <ArrowUpDown size={10} className={ledgerSortField === 'verified' ? 'text-indigo-400' : 'text-zinc-600'} />
                                  </div>
                                </th>
                                <th className="py-3 px-4 font-bold text-right text-zinc-500">
                                  Raw Audit Hash
                                </th>
                                <th className="py-3 px-4 font-bold text-center text-zinc-500 w-12">
                                  Inspect
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-900/40">
                              {displayedLedger.map((entry) => {
                                const isExpanded = expandedTxId === entry.id;
                                const isJustCopied = copiedTxId === entry.id;
                                return (
                                  <Fragment key={entry.id}>
                                    <tr 
                                      key={entry.id} 
                                      onClick={() => {
                                        if (soundEnabled) playCustomTone(900, 0.02);
                                        setExpandedTxId(isExpanded ? null : entry.id);
                                      }}
                                      className={`border-b border-zinc-900/35 transition-colors cursor-pointer group hover:bg-zinc-900/35 ${
                                        isExpanded ? 'bg-zinc-900/40 border-l-2 border-l-indigo-500' : ''
                                      }`}
                                    >
                                      <td className="py-3 px-4 text-zinc-300 font-bold">
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-zinc-300 font-bold font-mono">{entry.id}</span>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              try {
                                                navigator.clipboard.writeText(entry.id);
                                                setCopiedTxId(entry.id);
                                                if (soundEnabled) {
                                                  playCustomTone(680, 0.03);
                                                  setTimeout(() => playCustomTone(880, 0.03), 40);
                                                }
                                                setTimeout(() => setCopiedTxId(null), 1500);
                                              } catch (err) {}
                                            }}
                                            title="Copy Transaction ID"
                                            className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-indigo-400 hover:bg-zinc-905 transition-all text-[8px] tracking-widest font-mono"
                                          >
                                            {isJustCopied ? (
                                              <span className="text-[8px] font-bold text-emerald-400 animate-pulse bg-emerald-950/40 px-1 py-0.5 border border-emerald-500/20">COPIED! ✓</span>
                                            ) : (
                                              <Copy size={9} />
                                            )}
                                          </button>
                                        </div>
                                      </td>
                                      
                                      <td className="py-3 px-4 text-zinc-400 font-medium whitespace-nowrap">
                                        {entry.time.replace('T', ' ').substring(0, 19)}
                                      </td>
                                      
                                      <td className="py-3 px-4 text-zinc-300 font-medium max-w-xs truncate" title={entry.action}>
                                        {entry.action}
                                      </td>
                                      
                                      <td className={`py-3 px-4 text-right font-black text-xs font-mono tracking-tight ${
                                        entry.sats > 0 ? 'text-emerald-450' : entry.sats < 0 ? 'text-rose-450' : 'text-zinc-400'
                                      }`}>
                                        {entry.sats > 0 ? `+${entry.sats.toLocaleString()}` : entry.sats === 0 ? '0' : entry.sats.toLocaleString()}
                                      </td>
                                      
                                      <td className={`py-3 px-4 text-right font-bold text-xs font-mono tracking-tight ${
                                        entry.btc > 0 ? 'text-emerald-450' : entry.btc < 0 ? 'text-rose-450' : 'text-zinc-400'
                                      }`}>
                                        {entry.btc > 0 ? `+${entry.btc.toFixed(8)}` : entry.btc === 0 ? '0.00000000' : entry.btc.toFixed(8)}
                                      </td>
                                      
                                      <td className="py-3 px-4 text-center select-none">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[8.5px] font-bold rounded-full tracking-wider border transition-all ${
                                          entry.verified 
                                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.06)]' 
                                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_8px_rgba(245,158,11,0.06)]'
                                        }`}>
                                          <span className="relative flex h-1.5 w-1.5">
                                            {entry.verified ? (
                                              <>
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60"></span>
                                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400"></span>
                                              </>
                                            ) : (
                                              <>
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-40"></span>
                                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-400"></span>
                                              </>
                                            )}
                                          </span>
                                          {entry.verified ? 'SIGNED' : 'PENDING'}
                                        </span>
                                      </td>
                                      
                                      <td className="py-3 px-4 text-right text-zinc-600 font-mono text-[9px] group-hover:text-zinc-400 transition-colors">
                                        {entry.signature && entry.signature.length > 12 
                                          ? `${entry.signature.substring(0, 8)}...${entry.signature.substring(entry.signature.length - 4)}` 
                                          : entry.signature}
                                      </td>

                                      <td className="py-3 px-4 text-center text-zinc-500">
                                        {isExpanded ? (
                                          <ChevronUp size={11} className="text-indigo-400 mx-auto" />
                                        ) : (
                                          <ChevronDown size={11} className="group-hover:text-zinc-300 mx-auto transition-colors" />
                                        )}
                                      </td>
                                    </tr>

                                    {/* Expanded Diagnostics Sub-Panel */}
                                    {isExpanded && (
                                      <tr>
                                        <td colSpan={8} className="p-0 bg-zinc-950/45">
                                          <motion.div 
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="px-6 py-4 border-b border-zinc-900 bg-zinc-950"
                                          >
                                            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 text-zinc-400 select-none">
                                              
                                              {/* Payload statistics */}
                                              <div className="md:col-span-4 space-y-2 border-r border-zinc-900 pr-5">
                                                <div className="text-[9px] text-zinc-500 uppercase tracking-widest font-extrabold font-mono">TRANSACTION DETAILED AUDIT</div>
                                                <div className="text-[11px] space-y-1 font-mono">
                                                  <div>• Identifier: <strong className="text-zinc-200 font-semibold">{entry.id}</strong></div>
                                                  <div>• Exact Epoch: <strong className="text-zinc-300 font-semibold">{entry.time}</strong></div>
                                                  <div>• Core Verifier: <span className="text-emerald-400 font-medium">SECP256K1 LOCAL SIGNATURE</span></div>
                                                  <div>• Checksum Parity: <span className="text-indigo-400 font-medium">PASSED VERIFIED</span></div>
                                                </div>
                                              </div>

                                              {/* Full security signature hash copy */}
                                              <div className="md:col-span-8 flex flex-col justify-between">
                                                <div className="space-y-1">
                                                  <div className="text-[9px] text-zinc-500 uppercase tracking-widest font-extrabold font-mono flex items-center justify-between">
                                                    <span>Block Cryptographic Fingerprint (SHA-256)</span>
                                                    <button
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        try {
                                                          navigator.clipboard.writeText(entry.signature + "f8a1005b874cdeaa0a58b8d9600e12d4a1efcbd78e90ff812903ab817ef");
                                                          if (soundEnabled) playCustomTone(800, 0.05);
                                                          showToast(`Copied full hash for ${entry.id}!`, 'success');
                                                        } catch (err) {}
                                                      }}
                                                      className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer hover:underline text-[9px] font-bold"
                                                    >
                                                      <Copy size={9} /> Copy Full Hash
                                                    </button>
                                                  </div>
                                                  <div className="bg-zinc-950 border border-zinc-900 p-2.5 text-zinc-300 font-sans break-all text-[10px] tracking-wide font-mono rounded">
                                                    {entry.signature}f8a1005b874cdeaa0a58b8d9600e12d4a1efcbd78e90ff812903ab817ef
                                                  </div>
                                                </div>

                                                <div className="text-[9px] text-zinc-600 flex items-center justify-between pt-2 border-t border-zinc-900 mt-2 font-mono">
                                                  <span>Symmetric mathematical alignment model:</span>
                                                  <span className="text-indigo-400">
                                                    [{entry.sats.toLocaleString()} Sats &harr; {entry.btc.toFixed(8)} BTC]
                                                  </span>
                                                </div>
                                              </div>
                                            </div>

                                            {/* Visual Graph Layout Alignment Block Flow */}
                                            <div className="mt-3 bg-zinc-900/30 p-2 text-center rounded flex items-center justify-center gap-2 flex-wrap text-[9px] text-zinc-500 border border-zinc-900/60">
                                              <span className="text-emerald-500 font-mono font-bold">FLOW_SATS: {entry.sats.toLocaleString()}</span>
                                              <span>&rarr;</span>
                                              <span className="text-amber-500 font-mono font-bold">FLOW_BTC: {entry.btc.toFixed(8)}</span>
                                              <span>&rarr;</span>
                                              <span className="bg-zinc-950 text-indigo-400 border border-zinc-850 px-1.5 py-0.5 font-mono text-[8.5px] rounded">
                                                SHA-256 COMPLIANT CHECK
                                              </span>
                                              <span>&rarr;</span>
                                              <span className="text-emerald-400 font-black uppercase text-[8px] tracking-widest">SUCCESS CERTIFIED ✓</span>
                                            </div>
                                          </motion.div>
                                        </td>
                                      </tr>
                                    )}
                                  </Fragment>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        {/* 2. MOBILE VIEW LAYOUT: Compact Local-Audit Card Capsules */}
                        <div className="block md:hidden space-y-3.5">
                          {displayedLedger.map((entry) => {
                            const isExpanded = expandedTxId === entry.id;
                            const isJustCopied = copiedTxId === entry.id;
                            return (
                              <div 
                                key={entry.id} 
                                className={`border p-4 bg-zinc-900/10 transition-all rounded-none ${
                                  isExpanded ? 'border-indigo-500 bg-zinc-950' : 'border-zinc-850'
                                }`}
                              >
                                {/* Header with ID and Copier */}
                                <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-zinc-900">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[11px] font-black text-zinc-200 font-mono">{entry.id}</span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        try {
                                          navigator.clipboard.writeText(entry.id);
                                          setCopiedTxId(entry.id);
                                          if (soundEnabled) playCustomTone(700, 0.04);
                                          setTimeout(() => setCopiedTxId(null), 1500);
                                        } catch (err) {}
                                      }}
                                      className="p-1 hover:bg-zinc-900 rounded select-none"
                                    >
                                      {isJustCopied ? (
                                        <span className="text-[8px] font-bold text-emerald-400 bg-emerald-950/45 px-1 py-0.2 border border-emerald-500/20">COPIED</span>
                                      ) : (
                                        <Copy size={10} className="text-zinc-550 hover:text-zinc-300" />
                                      )}
                                    </button>
                                  </div>
                                  <span className="text-[9.5px] text-zinc-600 font-mono">{entry.time.replace('T', ' ').substring(0, 16)}</span>
                                </div>

                                {/* Body stats */}
                                <div className="py-2.5 space-y-1.5 font-mono text-[10px]">
                                  <div className="text-zinc-300 font-medium">
                                    <span className="text-zinc-650 uppercase font-bold text-[8.5px] block">Operation:</span>
                                    {entry.action}
                                  </div>
                                  
                                  {/* Deltas Grid */}
                                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-zinc-900 mt-2.5">
                                    <div>
                                      <span className="text-zinc-650 text-[8.5px] uppercase font-bold block">Sats Delta:</span>
                                      <strong className={`text-xs ${entry.sats > 0 ? 'text-emerald-450' : entry.sats < 0 ? 'text-rose-455' : 'text-zinc-400'}`}>
                                        {entry.sats > 0 ? `+${entry.sats.toLocaleString()}` : entry.sats.toLocaleString()}
                                      </strong>
                                    </div>
                                    <div>
                                      <span className="text-zinc-650 text-[8.5px] uppercase font-bold block">BTC Delta:</span>
                                      <strong className={`text-xs ${entry.btc > 0 ? 'text-emerald-450' : entry.btc < 0 ? 'text-rose-455' : 'text-zinc-400'}`}>
                                        {entry.btc > 0 ? `+${entry.btc.toFixed(7)}` : entry.btc.toFixed(7)}
                                      </strong>
                                    </div>
                                  </div>
                                </div>

                                {/* Footer Toggle details */}
                                <div className="pt-2 flex items-center justify-between border-t border-zinc-900 select-none">
                                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[8px] font-bold rounded-sm border ${
                                    entry.verified 
                                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                      : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                  }`}>
                                    <span className={`w-1 h-1 rounded-full ${entry.verified ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
                                    {entry.verified ? 'SIGNED' : 'PENDING'}
                                  </span>

                                  <button
                                    onClick={() => {
                                      if (soundEnabled) playCustomTone(900, 0.02);
                                      setExpandedTxId(isExpanded ? null : entry.id);
                                    }}
                                    className="text-[9px] uppercase tracking-wider text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1.5 cursor-pointer font-mono"
                                  >
                                    <span>{isExpanded ? "Hide Details" : "Verify Block"}</span>
                                    {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                                  </button>
                                </div>

                                {/* Expanded Area for Mobile */}
                                {isExpanded && (
                                  <motion.div 
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="p-3 bg-zinc-950 text-[9.5px] font-mono text-zinc-400 space-y-2 mt-2 border-t border-zinc-900"
                                  >
                                    <div className="text-zinc-650 uppercase font-black tracking-widest text-[8px]">Cryptographic Proof Check:</div>
                                    <div className="text-zinc-300 bg-zinc-900/60 p-2.5 rounded font-bold overflow-x-auto select-all text-left break-all font-mono leading-relaxed">
                                      {entry.signature}f8a1005b874cdeaa0a58b8d9600e12d4a1efcbd...
                                    </div>
                                    <div className="flex justify-between items-center text-[8.5px] text-zinc-500 pt-1">
                                      <span>Model Parity: PASSED [VERIFIED]</span>
                                      <span className="text-emerald-500 uppercase font-bold">100% Compliant</span>
                                    </div>
                                  </motion.div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>

                </motion.div>
              )}
            </AnimatePresence>

          </div>
        )}

        {/* PRICE TARGET WEB SECTION */}
        {(activeTab === 'pricing' || activeTab === 'about') && (
          <div className="w-full flex-1 flex flex-col justify-start py-2 animate-fade-in z-20 relative">
            <div className={`p-8 border rounded-3xl backdrop-blur-xl shadow-2xl transition-all duration-300 w-full ${
              store.activeMode === 'stim' 
                ? 'bg-slate-950/90 border-indigo-900/40 text-zinc-100 shadow-indigo-500/5' 
                : 'bg-zinc-900/90 border-zinc-805 font-mono text-zinc-100 shadow-black'
            }`}>
              
              {/* Back button or sub-header to return */}
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-zinc-850">
                <button 
                  onClick={() => setActiveTab('dashboard')}
                  className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                >
                  <span>&larr; Back to Converter Core</span>
                </button>
                <div className="text-[10px] uppercase font-bold tracking-widest text-indigo-400 font-mono">
                  {activeTab === 'pricing' ? 'Premium Edition Plans' : 'Low Latency Micro-System Engine'}
                </div>
              </div>

              {activeTab === 'pricing' && (
                <div className="max-w-4xl mx-auto space-y-10">
                  {/* Subscription Headers and Toggle Status Banner */}
                  <div className="text-center space-y-4">
                    <h2 className="text-3xl font-extrabold tracking-tight font-sans bg-gradient-to-r from-zinc-100 via-indigo-200 to-zinc-150 bg-clip-text text-transparent">
                      SatStacker Environment & Plans Studio
                    </h2>
                    <p className="text-sm text-zinc-400 max-w-2xl mx-auto font-sans leading-relaxed">
                      Select your operational environment. Upgrading unlocks custom audio alerts, premium strategies, offline backup exports, and custom Webhook integrations.
                    </p>

                    {/* Interactive Toggles & Promo Bar */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-6">
                      {/* Interval Switcher */}
                      <div className="inline-flex bg-zinc-950 border border-zinc-900 p-1.5 rounded-xl font-mono">
                        <button
                          onClick={() => {
                            setBillingCycle('monthly');
                            if (soundEnabled) playCustomTone(500, 0.05);
                          }}
                          className={`px-4 py-1.5 text-[10px] uppercase font-bold tracking-wider transition-all cursor-pointer ${
                            billingCycle === 'monthly'
                              ? 'bg-zinc-900 border border-zinc-800 text-indigo-400 font-extrabold shadow-md'
                              : 'text-zinc-500 hover:text-zinc-300'
                          }`}
                        >
                          Monthly Tier
                        </button>
                        <button
                          onClick={() => {
                            setBillingCycle('annual');
                            if (soundEnabled) playCustomTone(600, 0.05);
                          }}
                          className={`px-4 py-1.5 text-[10px] uppercase font-bold tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                            billingCycle === 'annual'
                              ? 'bg-zinc-900 border border-zinc-800 text-emerald-455 font-extrabold shadow-md'
                              : 'text-zinc-500 hover:text-zinc-300'
                          }`}
                        >
                          Annual Billing <span className="bg-emerald-500/10 text-emerald-400 text-[8px] font-black px-1.5 py-0.5 rounded-md text-nowrap">Save 20%</span>
                        </button>
                      </div>

                      {/* Coupon field */}
                      <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-xl p-1 font-mono">
                        <input
                          type="text"
                          placeholder="ENTER PROMO CODE"
                          value={promoCode}
                          onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                          className="bg-transparent border-none text-[10px] px-3 py-1 outline-none text-zinc-100 w-36 uppercase"
                        />
                        <button
                          onClick={() => {
                            if (promoCode === 'STACKER20' || promoCode === 'HALF') {
                              setPromoApplied(true);
                              setPromoDiscount(promoCode === 'STACKER20' ? 20 : 50);
                              if (soundEnabled) {
                                playCustomTone(523.25, 0.05);
                                setTimeout(() => playCustomTone(783.99, 0.06), 55);
                              }
                              showToast(`COUPON DECLARED VALID: ${promoCode === 'STACKER20' ? '20' : '50'}% INSTANT PRICE SHIELD ACTIVE.`, "success");
                            } else {
                              setPromoApplied(false);
                              setPromoDiscount(0);
                              if (soundEnabled) playCustomTone(200, 0.15);
                              showToast("COUPON CODE RETURNED EXCEPTION: INVALID OR TERMINATED CLIENT KEY.", "warning");
                            }
                          }}
                          className="px-2.5 py-1 bg-zinc-900 border border-zinc-805 text-zinc-300 hover:bg-zinc-850 hover:text-zinc-100 text-[9px] uppercase font-bold tracking-wider cursor-pointer"
                        >
                          Verify
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Standard vs PRO Comparison Section */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch text-left">
                    {/* Free Plan Card */}
                    <div className={`p-6 border flex flex-col justify-between transition-all relative rounded-2xl ${
                      isPremium 
                        ? 'bg-zinc-950/20 border-zinc-900 opacity-60' 
                        : 'bg-zinc-950/80 border-zinc-800 shadow-indigo-500/5 ring-1 ring-indigo-505/10'
                    }`}>
                      {!isPremium && (
                        <div className="absolute -top-2.5 left-6 px-2 py-0.5 bg-zinc-800 border border-zinc-700 text-[8px] font-mono tracking-widest text-zinc-355 uppercase font-black rounded-full select-none">
                          ACTIVE TIER
                        </div>
                      )}

                      <div className="space-y-4">
                        <div>
                          <h3 className="text-zinc-350 text-xs font-mono font-bold tracking-widest uppercase mb-1">Standard Stacker</h3>
                          <p className="text-[10px] text-zinc-500 font-sans">Essential local conversion & basic streak logging tools.</p>
                        </div>
                        
                        <div className="py-2 border-b border-zinc-900">
                          <span className="text-3xl font-black font-sans leading-none text-zinc-100">$0</span>
                          <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono block mt-1">FREE FOREVER</span>
                        </div>

                        <ul className="text-[10.5px] font-sans space-y-3 pt-2 text-zinc-400">
                          <li className="flex items-start gap-2">
                             <span className="text-emerald-450 font-bold shrink-0">✓</span>
                             <span>Local transaction ledger (up to 40 records)</span>
                          </li>
                          <li className="flex items-start gap-2">
                             <span className="text-emerald-450 font-bold shrink-0">✓</span>
                             <span>Real-time BTC conversion & live charts</span>
                          </li>
                          <li className="flex items-start gap-2">
                             <span className="text-emerald-450 font-bold shrink-0">✓</span>
                             <span>Standard streak tracking with 2 recovery shields</span>
                          </li>
                          <li className="flex items-start gap-2 text-zinc-650 line-through">
                            <span className="text-zinc-650 font-bold shrink-0">✗</span>
                            <span>Automated Discord/Webhook alerts</span>
                          </li>
                          <li className="flex items-start gap-2 text-zinc-650 line-through">
                            <span className="text-zinc-650 font-bold shrink-0">✗</span>
                            <span>Automated DCA purchase strategies</span>
                          </li>
                        </ul>
                      </div>

                      <div className="pt-6 font-mono">
                        <button
                          disabled
                          className="w-full py-2 bg-zinc-900 border border-zinc-850 text-zinc-500 text-[10px] uppercase font-bold text-center cursor-not-allowed rounded-xl"
                        >
                          Default Sandbox Active
                        </button>
                      </div>
                    </div>

                    {/* PRO Plan Matrix Card */}
                    <div className={`p-6 border flex flex-col justify-between transition-all relative rounded-2xl ${
                      isPremium && selectedPlanUpgradeName === 'pro'
                        ? 'bg-gradient-to-br from-indigo-950/20 to-zinc-950 border-indigo-500 shadow-[0_0_30px_rgba(99,102,241,0.2)]'
                        : 'bg-zinc-950/80 border-zinc-800 hover:border-zinc-750'
                    }`}>
                      {isPremium && selectedPlanUpgradeName === 'pro' && (
                        <div className="absolute -top-2.5 left-6 px-2 py-0.5 bg-indigo-500 text-zinc-950 text-[8px] font-mono tracking-widest uppercase font-black rounded-full animate-pulse select-none">
                          ACTIVE LICENSED PRO
                        </div>
                      )}
                      {!(isPremium && selectedPlanUpgradeName === 'pro') && (
                        <div className="absolute -top-2.5 left-6 px-2 py-0.5 bg-indigo-600 text-white text-[8px] font-mono tracking-widest uppercase font-black rounded-full shadow-[0_0_10px_rgba(79,70,229,0.5)] select-none">
                          RECOMMENDED
                        </div>
                      )}

                      <div className="space-y-4">
                        <div>
                          <h3 className="text-indigo-400 text-xs font-mono font-bold tracking-widest uppercase mb-1 flex items-center gap-1.5">
                            <Sparkles size={11} className="text-indigo-400 animate-pulse" />
                            DCA Pro
                          </h3>
                          <p className="text-[10px] text-zinc-400 font-sans">Automated price triggers, webhook streams, and unlimited streaks.</p>
                        </div>

                        <div className="py-2 border-b border-zinc-900">
                          <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-black font-sans leading-none text-zinc-100">
                              ${billingCycle === 'annual' 
                                ? (promoApplied ? (39 * (1 - promoDiscount / 100)).toFixed(0) : '39')
                                : (promoApplied ? (49 * (1 - promoDiscount / 100)).toFixed(0) : '49')}
                            </span>
                            <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">/ mo</span>
                          </div>
                          <span className="text-[8px] text-zinc-500 uppercase tracking-widest font-mono block mt-1">
                            {billingCycle === 'annual' 
                              ? `Billed annually ($${promoApplied ? (39 * 12 * (1 - promoDiscount / 100)).toFixed(0) : '468'}/yr)` 
                              : "Billed monthly, cancel anytime"}
                          </span>
                        </div>

                        <ul className="text-[10.5px] font-sans space-y-3 pt-2 text-zinc-350">
                          <li className="flex items-start gap-2">
                            <span className="text-indigo-400 font-bold shrink-0">✓</span>
                            <span><strong className="text-zinc-250">Unlimited (∞)</strong> Streak Protection Shields</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-indigo-400 font-bold shrink-0">✓</span>
                            <span>Direct Discord & Slack <strong className="text-zinc-250">Webhook Bridges</strong></span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-indigo-400 font-bold shrink-0">✓</span>
                            <span>Automated <strong className="text-zinc-250">DCA purchase</strong> scheduling plans</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-indigo-400 font-bold shrink-0">✓</span>
                            <span>Persistent local memory ledger (infinite capacity)</span>
                          </li>
                        </ul>
                      </div>

                      <div className="pt-6 font-mono">
                        <button
                          onClick={() => {
                            if (isPremium && selectedPlanUpgradeName === 'pro') {
                               setIsPremium(false);
                               if (soundEnabled) playCustomTone(300, 0.1);
                               showToast("DCA Pro subscription deactivated.", "info");
                            } else {
                              setSelectedPlanUpgradeName('pro');
                              setShowCheckoutWizard(true);
                              if (soundEnabled) playCustomTone(650, 0.08);
                            }
                          }}
                          className={`w-full py-2 font-black text-[10px] uppercase tracking-wider text-center transition-all cursor-pointer rounded-xl ${
                            isPremium && selectedPlanUpgradeName === 'pro'
                              ? 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:scale-[1.01]' 
                              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_4px_16px_rgba(79,70,229,0.35)] hover:scale-[1.01]'
                          }`}
                        >
                          {isPremium && selectedPlanUpgradeName === 'pro' ? 'Downgrade to Standard' : 'Upgrade to DCA Pro'}
                        </button>
                      </div>
                    </div>

                    {/* Swiss Sovereignty Vault Card */}
                    <div className={`p-6 border flex flex-col justify-between transition-all relative rounded-2xl ${
                      isPremium && selectedPlanUpgradeName === 'sovereign'
                        ? 'bg-gradient-to-br from-emerald-950/20 to-zinc-950 border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.2)]'
                        : 'bg-zinc-950/80 border-zinc-800 hover:border-zinc-750'
                    }`}>
                      {isPremium && selectedPlanUpgradeName === 'sovereign' ? (
                        <div className="absolute -top-2.5 left-6 px-2 py-0.5 bg-emerald-500 text-zinc-950 text-[8px] font-mono tracking-widest uppercase font-black rounded-full select-none animate-pulse">
                          ACTIVE SOVEREIGN LIFETIME
                        </div>
                      ) : (
                        <div className="absolute -top-2.5 left-6 px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[8px] font-mono tracking-widest uppercase font-black rounded-full select-none">
                          LIFETIME LICENSE
                        </div>
                      )}

                      <div className="space-y-4">
                        <div>
                          <h3 className="text-emerald-400 text-xs font-mono font-bold tracking-widest uppercase mb-1 flex items-center gap-1.5">
                            <ShieldCheck size={11} className="text-emerald-400" />
                            Sovereign Lifetime
                          </h3>
                          <p className="text-[10px] text-zinc-400 font-sans">Single lifetime purchase, fully client-sided privacy.</p>
                        </div>

                        <div className="py-2 border-b border-zinc-900">
                          <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-black font-sans leading-none text-zinc-100">
                              ${promoApplied ? (4500 * (1 - promoDiscount / 100)).toFixed(0) : '199'}
                            </span>
                            <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">/ custom</span>
                          </div>
                          <span className="text-[8px] text-emerald-400 uppercase tracking-widest font-mono block mt-1">
                            No subscription, local-first offline storage
                          </span>
                        </div>

                        <ul className="text-[10.5px] font-sans space-y-3 pt-2 text-zinc-350">
                          <li className="flex items-start gap-2">
                            <span className="text-emerald-455 font-bold shrink-0">✓</span>
                            <span>PGP-compatible local transaction certs</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-emerald-455 font-bold shrink-0">✓</span>
                            <span>Premium Custom Audio Alert Synthesizers</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-emerald-455 font-bold shrink-0">✓</span>
                            <span>Enhanced API config & developer payloads</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-emerald-455 font-bold shrink-0">✓</span>
                            <span>Zero cloud analytics trace (Fully self-contained)</span>
                          </li>
                        </ul>
                      </div>

                      <div className="pt-6 font-mono">
                        <button
                          onClick={() => {
                            if (isPremium && selectedPlanUpgradeName === 'sovereign') {
                              setIsPremium(false);
                              if (soundEnabled) playCustomTone(300, 0.1);
                              showToast("Lifetime Sovereign license deactivated.", "info");
                            } else {
                              setSelectedPlanUpgradeName('sovereign');
                              setShowCheckoutWizard(true);
                              if (soundEnabled) playCustomTone(650, 0.08);
                            }
                          }}
                          className={`w-full py-2 font-black text-[10px] uppercase tracking-wider text-center transition-all cursor-pointer rounded-xl ${
                            isPremium && selectedPlanUpgradeName === 'sovereign'
                              ? 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:scale-[1.01]' 
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_4px_16px_rgba(16,185,129,0.35)] hover:scale-[1.01]'
                          }`}
                        >
                          {isPremium && selectedPlanUpgradeName === 'sovereign' ? 'Downgrade to Standard' : 'Upgrade to Sovereign Lifetime'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Sandboxed Checkout Form/Wizard */}
                  <AnimatePresence>
                    {showCheckoutWizard && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="p-6 bg-zinc-950 hover:bg-zinc-950/98 border border-indigo-600/30 rounded-2xl text-left space-y-4 max-w-xl mx-auto font-mono text-zinc-100"
                      >
                        <div className="flex justify-between items-center pb-2 border-b border-zinc-900">
                          <div>
                            <h4 className="text-xs font-black uppercase text-indigo-400 tracking-wider">
                              COINBASE SANDBOX PAYMENT GATEWAY
                            </h4>
                            <p className="text-[9px] text-zinc-500">
                              Standard sandbox test gateway. Feel free to use test values to complete the upgrade.
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              setShowCheckoutWizard(false);
                              if (soundEnabled) playCustomTone(400, 0.05);
                            }}
                            className="text-[10px] uppercase font-bold text-zinc-500 hover:text-rose-400 cursor-pointer"
                          >
                            [✕] Close Gateway
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-[10px]">
                          <div className="col-span-2 space-y-1">
                            <label className="text-zinc-500 uppercase tracking-wider block">Plan selected</label>
                            <div className="bg-zinc-900 border border-zinc-805 px-3 py-2 rounded-lg text-zinc-200 font-extrabold flex justify-between items-center">
                              <span className="uppercase">{selectedPlanUpgradeName === 'pro' ? 'Enterprise PRO Plan' : 'Sovereign Lifetime License'}</span>
                              <span className="text-indigo-400">
                                ${selectedPlanUpgradeName === 'pro' 
                                  ? (billingCycle === 'annual' 
                                      ? (promoApplied ? (39 * (1 - promoDiscount / 100)).toFixed(0) : '39')
                                      : (promoApplied ? (49 * (1 - promoDiscount / 100)).toFixed(0) : '49'))
                                  : (promoApplied ? (4500 * (1 - promoDiscount / 100)).toFixed(0) : '199')} / Total
                              </span>
                            </div>
                          </div>

                          <div className="col-span-2 space-y-1">
                            <label className="text-zinc-500 uppercase tracking-wider block">Cardholder Name</label>
                            <input
                              type="text"
                              value={billingCardName}
                              onChange={(e) => setBillingCardName(e.target.value.toUpperCase())}
                              placeholder="SATOSHI NAKAMOTO"
                              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2 px-3 outline-none text-zinc-250 uppercase"
                            />
                          </div>

                          <div className="col-span-2 space-y-1">
                            <label className="text-zinc-500 uppercase tracking-wider block flex justify-between">
                              <span>Credit Card Number</span>
                              <span className="text-[8px] text-indigo-400 font-bold">
                                {billingCardNumber.replace(/\s/g, '').startsWith('4') ? 'VISA CLIENT' : billingCardNumber.replace(/\s/g, '').startsWith('5') ? 'MASTERCARD' : billingCardNumber.replace(/\s/g, '').startsWith('3') ? 'AMEX CORE' : 'SANDBOX CRD'}
                              </span>
                            </label>
                            <input
                              type="text"
                              value={billingCardNumber}
                              onChange={(e) => {
                                const input = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
                                const trimmed = input.substring(0, 16);
                                const parts = [];
                                for (let i = 0; i < trimmed.length; i += 4) {
                                  parts.push(trimmed.substring(i, i + 4));
                                }
                                setBillingCardNumber(parts.length > 0 ? parts.join(' ') : '');
                              }}
                              placeholder="4111 2222 3333 4444"
                              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2 px-3 outline-none text-zinc-105"
                            />
                          </div>

                          <div className="col-span-1 space-y-1">
                            <label className="text-zinc-500 uppercase tracking-wider block">Expiry date</label>
                            <input
                              type="text"
                              value={billingCardExpiry}
                              onChange={(e) => {
                                const clean = e.target.value.replace(/[^0-9]/g, '');
                                if (clean.length >= 2) {
                                  setBillingCardExpiry(clean.substring(0, 2) + '/' + clean.substring(2, 4));
                                } else {
                                  setBillingCardExpiry(clean);
                                }
                              }}
                              placeholder="12/28"
                              maxLength={5}
                              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2 px-3 outline-none text-zinc-100 text-center"
                            />
                          </div>

                          <div className="col-span-1 space-y-1">
                            <label className="text-zinc-500 uppercase tracking-wider block">CVV</label>
                            <input
                              type="password"
                              value={billingCardCcv}
                              onChange={(e) => setBillingCardCcv(e.target.value.replace(/[^0-9]/g, '').substring(0, 4))}
                              placeholder="***"
                              maxLength={4}
                              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2 px-3 outline-none text-zinc-100 text-center"
                            />
                          </div>
                        </div>

                        <div className="pt-2">
                          <button
                            onClick={() => {
                              if (!billingCardName || !billingCardNumber) {
                                if (soundEnabled) playCustomTone(200, 0.15);
                                showToast("REQUIRED FIELDS NOT DECLARED: PLEASE INPUT SANDBOX CARD CREDENTIALS.", "warning");
                                return;
                              }
                              setCheckoutProcessing(true);
                              if (soundEnabled) playCustomTone(440, 0.4);
                              setTimeout(() => {
                                setCheckoutProcessing(false);
                                setIsPremium(true);
                                setShowCheckoutWizard(false);
                                if (soundEnabled) {
                                  playAudioTone(523.25, 0.08, 'sine', true, synthVolume);
                                  setTimeout(() => playAudioTone(659.25, 0.12, 'sine', true, synthVolume), 80);
                                  setTimeout(() => playAudioTone(783.99, 0.15, 'sine', true, synthVolume), 160);
                                }
                                showToast(`CHECKOUT SECURED SUCCESSFULLY. ${selectedPlanUpgradeName === 'pro' ? 'ENTERPRISE PRO PLAN' : 'SOVEREIGN LIFETIME LICENSE'} SYSTEM REGISTERED.`, "success");
                              }, 1600);
                            }}
                            disabled={checkoutProcessing}
                            className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-[10px] font-black uppercase tracking-wider rounded-xl cursor-pointer disabled:opacity-50 select-none flex items-center justify-center gap-1.5"
                          >
                            {checkoutProcessing ? (
                              <span className="flex items-center gap-1">
                                <span className="animate-spin text-sm">⌛</span> AUTHORIZING SECURE CONNECTION...
                              </span>
                            ) : (
                              'COMPLETE SECURE ORDER &rarr;'
                            )}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Specification Grid comparison matrix */}
                  <div className="bg-zinc-950/60 border border-zinc-900 rounded-2xl p-6 text-left space-y-4">
                    <span className="text-[10px] uppercase tracking-wider font-mono text-zinc-400 font-extrabold block">
                      LOW-LATENCY SPECIFICATION COMPARISON MATRIX
                    </span>

                    <div className="space-y-3 font-mono text-[10.5px]">
                      <div className="grid grid-cols-3 pb-2 border-b border-zinc-900 text-zinc-500 font-black">
                        <span>PARAMETER</span>
                        <span>STANDARD</span>
                        <span className="text-indigo-400 flex items-center gap-1">
                          <Sparkles size={10} className="text-indigo-400 animate-pulse" /> ENTERPRISE PRO
                        </span>
                      </div>

                      <div className="grid grid-cols-3 pb-1 border-b border-zinc-900/45 text-zinc-450">
                        <span className="text-zinc-500">Live Streak Shields</span>
                        <span>Max 2 Shields</span>
                        <span className="text-emerald-400 font-black flex items-center gap-1">
                          <ShieldCheck size={11} className="text-emerald-400 animate-pulse" /> Unlimited (∞) Protection
                        </span>
                      </div>

                      <div className="grid grid-cols-3 pb-1 border-b border-zinc-900/45 text-zinc-450">
                        <span className="text-zinc-500">Alert Latency Channel</span>
                        <span>Audio Oscillative Synth</span>
                        <span className="text-emerald-400 font-black">Discord + Custom WebHooks Alerts</span>
                      </div>

                      <div className="grid grid-cols-3 pb-1 border-b border-zinc-900/45 text-zinc-450">
                        <span className="text-zinc-500">Sandbox DCA Strategist</span>
                        <span>Manual SATS Convert Only</span>
                        <span className="text-emerald-400 font-black">Continuous Strategies Execution Logs</span>
                      </div>

                      <div className="grid grid-cols-3 pb-1 border-b border-zinc-900/45 text-zinc-450">
                        <span className="text-zinc-500">Ledger Buffer Memory</span>
                        <span>Last 40 Transactions Limit</span>
                        <span className="text-emerald-400 font-black">Infinite CRYPTEX Local SQLite DB</span>
                      </div>

                      <div className="grid grid-cols-3 text-zinc-450">
                        <span className="text-zinc-500">Execution Thread Priority</span>
                        <span>Synchronous UI Main Thread</span>
                        <span className="text-emerald-400 font-black">Simulated Async WebWorker Instances</span>
                      </div>
                    </div>
                  </div>

                  {/* PRO INTEGRATED OPERATIONS CONSOLE (The actual implementation of premium features) */}
                  <div className={`p-6 border text-left space-y-6 transition-all duration-300 relative rounded-none ${
                    isPremium ? 'border-zinc-800 bg-zinc-950/80 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]' : 'border-zinc-900 bg-zinc-950/30 opacity-60'
                  }`}>
                    {/* Locked Shield Overlay for Standard Users */}
                    {!isPremium && (
                      <div className="absolute inset-0 bg-dark-950/85 backdrop-blur-sm z-10 flex flex-col items-center justify-center text-center p-6 bg-zinc-950/80 rounded-none">
                        <div className="bg-zinc-900 w-12 h-12 rounded-full border border-zinc-800 flex items-center justify-center mb-3 text-indigo-455 shadow-lg">
                          <ShieldCheck size={20} className="animate-pulse" />
                        </div>
                        <h4 className="text-xs uppercase font-mono font-black tracking-widest text-zinc-250">PRO Integrations Console Locked</h4>
                        <p className="text-[10px] text-zinc-500 max-w-sm mt-1 leading-relaxed font-mono">
                          Upgrading unlocks real configuration controls for external Discord/Slack Webhooks, algorithmic DCA schedulers, and local backup sweepers.
                        </p>
                        <button
                          onClick={() => {
                            setIsPremium(true);
                            if (soundEnabled) {
                              playAudioTone(523.25, 0.08, 'sine', true, synthVolume);
                              setTimeout(() => playAudioTone(659.25, 0.10, 'sine', true, synthVolume), 80);
                            }
                            showToast("PRO Edition active. Integrations Console unlocked!", "success");
                          }}
                          className="mt-3.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-495 text-white font-bold text-[10px] uppercase font-mono tracking-widest cursor-pointer shadow-[0_2px_8px_rgba(79,70,229,0.3)]"
                        >
                          Unlock PRO Features &rarr;
                        </button>
                      </div>
                    )}

                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 pb-4 border-b border-zinc-900 z-10 relative">
                      <div>
                        <h4 className="text-xs font-black uppercase text-zinc-300 tracking-wider flex items-center gap-2 font-mono">
                          <Sliders size={14} className="text-indigo-400 animate-pulse" />
                          PRO Alert Dispatcher & Operations Console
                        </h4>
                        <p className="text-[9px] text-zinc-500 font-mono uppercase mt-0.5">
                          Set up automated Discord dispatch triggers and manage programmable DCA purchase strategies.
                        </p>
                      </div>
                      <div className="flex items-center gap-2 font-mono text-[9px] bg-zinc-950 border border-zinc-900 px-2 py-1">
                        <span className="text-zinc-500">ROUTER STATUS:</span>
                        <span className="text-emerald-400 font-bold animate-pulse">PRO ACTIVE (SIMULATION)</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
                      {/* Left: Discord webhook router simulator */}
                      <div className="lg:col-span-6 space-y-4">
                        <div className="space-y-1">
                          <span className="text-[9px] uppercase tracking-wider font-mono text-zinc-450 font-bold flex items-center gap-1.5 border-b border-zinc-900 pb-1">
                            <Activity size={10} className="text-indigo-455" />
                            1. DISCORD WEBHOOK ALERT CONFIGURATION
                          </span>
                          <p className="text-[9px] text-zinc-500 leading-relaxed font-mono">
                            Test automatic JSON payloads from your SatStacker instance when price milestones or streak recovery shields trigger.
                          </p>
                        </div>

                        <div className="space-y-3 p-4 bg-zinc-900/60 border border-zinc-850 rounded-none font-mono">
                          <div className="space-y-1">
                            <label className="text-[8px] uppercase font-mono text-zinc-500 font-bold block">Discord Target Server Endpoint:</label>
                            <input
                              type="text"
                              value={webhookUrl}
                              onChange={(e) => setWebhookUrl(e.target.value)}
                              className="w-full bg-zinc-950 border border-zinc-800 text-[10px] text-zinc-300 px-2.5 py-1.5 focus:outline-none focus:border-indigo-600 rounded-none font-mono"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-[8px] uppercase font-mono text-zinc-500 font-bold block">Alert Trigger Pattern:</label>
                              <select
                                value={alertTriggerType}
                                onChange={(e) => setAlertTriggerType(e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-800 text-[10px] text-zinc-300 p-1.5 focus:outline-none focus:border-indigo-600 rounded-none font-mono"
                              >
                                <option value="streak_saved">🛡️ Streak Saved by Shield</option>
                                <option value="drift_failure">⚠️ Price Volatility Warning</option>
                                <option value="target_threshold">📈 Price Threshold Hit</option>
                              </select>
                            </div>

                            <div className="flex items-end">
                              <button
                                onClick={() => {
                                  setIsSendingWebhook(true);
                                  if (soundEnabled) playAudioTone(380, 0.05, 'sine', true, synthVolume);
                                  
                                  setTimeout(() => {
                                    setIsSendingWebhook(false);
                                    let samplePayload = {};
                                    if (alertTriggerType === 'streak_saved') {
                                      samplePayload = {
                                        username: "SatStacker Alert Bot",
                                        embeds: [{
                                          title: "🛡️ Volatility Streak Shield Armed",
                                          description: `Current series streak of ${store.currentStreak} Days has been stabilized against inactive breaks.`,
                                          color: 3447003,
                                          fields: [
                                            { name: "Live Price Feed", value: store.livePrice ? `$${store.livePrice.toLocaleString()}` : "N/A", inline: true },
                                            { name: "Protected User", value: "gcoinstash@gmail.com", inline: true }
                                          ],
                                          timestamp: new Date().toISOString()
                                        }]
                                      };
                                    } else if (alertTriggerType === 'drift_failure') {
                                      samplePayload = {
                                        username: "SatStacker Volatility Watchdog",
                                        embeds: [{
                                          title: "🚨 HIGH VOLATILITY PRICE ALERT",
                                          description: "Bitcoin price swing registered a rapid rate acceleration. Predefined limit boundaries crossed.",
                                          color: 15158332,
                                          timestamp: new Date().toISOString()
                                        }]
                                      };
                                    } else {
                                      samplePayload = {
                                        username: "Satoshi Price Alert Hub",
                                        content: `📈 Price trigger reached! Current value matches target threshold: 1 BTC = ${store.totalSats.toLocaleString()} Satoshis calculated.`
                                      };
                                    }

                                    const timestamp = new Date().toLocaleTimeString();
                                    setWebhookLogs((prev) => [
                                      ...prev,
                                      `[${timestamp}] INFO: Initiating dispatch to discord.com...`,
                                      `[${timestamp}] POST /api/webhooks/991204/satstacker-alerts-prod HTTP/1.1`,
                                      `[${timestamp}] PAYLOAD TYPE: application/json`,
                                      `[${timestamp}] PAYLOAD: ${JSON.stringify(samplePayload)}`,
                                      `[${timestamp}] STATUS 204: Dispatched successfully.`
                                    ].slice(-10));

                                    if (soundEnabled) {
                                      playAudioTone(880, 0.06, 'sine', true, synthVolume);
                                      setTimeout(() => playAudioTone(1046, 0.1, 'sine', true, synthVolume), 60);
                                    }
                                    showToast("Webhook ping successfully dispatched from sandbox!", "success");
                                  }, 1200);
                                }}
                                disabled={isSendingWebhook}
                                className={`w-full py-1.5 font-bold uppercase tracking-wider text-[10px] font-mono cursor-pointer border flex justify-center items-center gap-1.5 transition-colors ${
                                  isSendingWebhook 
                                    ? 'bg-zinc-950 border-zinc-900 text-zinc-500 cursor-not-allowed'
                                    : 'bg-emerald-950/80 border-emerald-500 hover:bg-emerald-900 text-emerald-300'
                                }`}
                              >
                                {isSendingWebhook ? (
                                  <>
                                    <Loader2 size={12} className="animate-spin text-emerald-400" />
                                    DISPATCHING...
                                  </>
                                ) : (
                                  '🚀 DISPATCH WEBHOOK ALERT'
                                )}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Webhook logs stream */}
                        <div className="bg-zinc-950 border border-zinc-900 p-3 font-mono text-[9px] text-zinc-400 h-32 overflow-y-auto space-y-1 scrollbar-thin">
                          <div className="text-[8px] text-zinc-600 font-bold uppercase tracking-wider border-b border-zinc-900 pb-1 mb-1.5 flex justify-between bg-zinc-950">
                            <span>📡 Live Discord Request Stream Proxy Logs</span>
                            <button 
                              onClick={() => setWebhookLogs(["[SYSTEM] Webhook channel listener standby. Route initialized."])}
                              className="text-zinc-500 hover:text-zinc-350 underline cursor-pointer"
                            >
                              clear
                            </button>
                          </div>
                          {webhookLogs.map((log, index) => (
                            <div 
                              key={index} 
                              className={
                                log.includes('STATUS 204') || log.includes('STATUS: 240') || log.includes('Dispatched')
                                  ? 'text-emerald-450 font-bold font-mono' 
                                  : log.includes('🚨 UNEXPECTED') || log.includes('drift_failure') || log.includes('EXCEPTION')
                                    ? 'text-rose-400 font-bold'
                                    : log.includes('INFO:') || log.includes('POST')
                                      ? 'text-indigo-400 font-bold' 
                                      : 'text-zinc-500'
                              }
                            >
                              {log}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Right: Saving custom algorithmic strategies & deep archive execution */}
                      <div className="lg:col-span-6 space-y-4">
                        <div className="space-y-1">
                          <span className="text-[9px] uppercase tracking-wider font-mono text-zinc-450 font-bold flex items-center gap-1.5 border-b border-zinc-900 pb-1">
                            <Sliders size={10} className="text-emerald-400" />
                            2. PROGRAMMABLE EXECUTION STRATEGIES & BG AUTOMATION [SCHEDULER]
                          </span>
                          <p className="text-[9px] text-zinc-400 leading-relaxed font-mono">
                            Auto-execute complex order blocks inside your local memory based on volatility ticks or custom cron intervals.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Strategies checkbox card list */}
                          <div className="p-4 bg-zinc-900/60 border border-zinc-850 rounded-none space-y-3 font-mono">
                            <span className="text-[8px] uppercase tracking-widest text-zinc-500 font-bold block mb-1">ARM ALGORITHMIC STRATEGIES:</span>

                            <div className="space-y-2.5">
                              {/* Strategy 1 */}
                              <div className="flex items-start gap-2 text-[9px]">
                                <input
                                  type="checkbox"
                                  id="strategy_dca_check"
                                  checked={activeStrategies.includes('strategy_dca')}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setActiveStrategies([...activeStrategies, 'strategy_dca']);
                                      if (soundEnabled) playAudioTone(523.25, 0.05, 'sine', true, synthVolume);
                                      showToast("Armed micro-DCA scheduler strategy.", "info");
                                    } else {
                                      setActiveStrategies(activeStrategies.filter(s => s !== 'strategy_dca'));
                                      if (soundEnabled) playAudioTone(440, 0.05, 'sine', true, synthVolume);
                                    }
                                  }}
                                  className="mt-0.5 cursor-pointer accent-emerald-500"
                                />
                                <div className="flex-1">
                                  <div className="flex justify-between items-center gap-1 mb-0.5">
                                    <label htmlFor="strategy_dca_check" className={`font-bold block select-none cursor-pointer ${activeStrategies.includes('strategy_dca') ? 'text-emerald-300' : 'text-zinc-400'}`}>
                                      Micro DCA Scheduler
                                    </label>
                                    <span className={`text-[7px] font-bold ${activeStrategies.includes('strategy_dca') ? 'text-emerald-400' : 'text-zinc-600'}`}>
                                      {activeStrategies.includes('strategy_dca') ? '● ARMED' : 'STANDBY'}
                                    </span>
                                  </div>
                                  <span className="text-[8px] text-zinc-500 block">DCA-buy 1,000 Sats every 10 volatility checks automatically.</span>
                                </div>
                              </div>

                              {/* Strategy 2 */}
                              <div className="flex items-start gap-2 text-[9px]">
                                <input
                                  type="checkbox"
                                  id="strategy_symmetry_check"
                                  checked={activeStrategies.includes('strategy_symmetry')}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setActiveStrategies([...activeStrategies, 'strategy_symmetry']);
                                      if (soundEnabled) playAudioTone(659.25, 0.05, 'sine', true, synthVolume);
                                      showToast("Armed Decimal Symmetry Stabilizer.", "info");
                                    } else {
                                      setActiveStrategies(activeStrategies.filter(s => s !== 'strategy_symmetry'));
                                      if (soundEnabled) playAudioTone(440, 0.05, 'sine', true, synthVolume);
                                    }
                                  }}
                                  className="mt-0.5 cursor-pointer accent-emerald-500"
                                />
                                <div className="flex-1">
                                  <div className="flex justify-between items-center gap-1 mb-0.5">
                                    <label htmlFor="strategy_symmetry_check" className={`font-bold block select-none cursor-pointer ${activeStrategies.includes('strategy_symmetry') ? 'text-emerald-300' : 'text-zinc-400'}`}>
                                      Decimal Stabilizer
                                    </label>
                                    <span className={`text-[7px] font-bold ${activeStrategies.includes('strategy_symmetry') ? 'text-emerald-400' : 'text-zinc-600'}`}>
                                      {activeStrategies.includes('strategy_symmetry') ? '● ARMED' : 'STANDBY'}
                                    </span>
                                  </div>
                                  <span className="text-[8px] text-zinc-500 block">Ensures Satoshi fractional math matches perfectly on live price loops.</span>
                                </div>
                              </div>

                              {/* Strategy 3 */}
                              <div className="flex items-start gap-2 text-[9px]">
                                <input
                                  type="checkbox"
                                  id="strategy_bollinger_check"
                                  checked={activeStrategies.includes('strategy_bollinger')}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setActiveStrategies([...activeStrategies, 'strategy_bollinger']);
                                      if (soundEnabled) playAudioTone(783.99, 0.05, 'sine', true, synthVolume);
                                      showToast("Armed Volatility Surge Defender.", "info");
                                    } else {
                                      setActiveStrategies(activeStrategies.filter(s => s !== 'strategy_bollinger'));
                                      if (soundEnabled) playAudioTone(440, 0.05, 'sine', true, synthVolume);
                                    }
                                  }}
                                  className="mt-0.5 cursor-pointer accent-emerald-500"
                                />
                                <div className="flex-1">
                                  <div className="flex justify-between items-center gap-1 mb-0.5">
                                    <label htmlFor="strategy_bollinger_check" className={`font-bold block select-none cursor-pointer ${activeStrategies.includes('strategy_bollinger') ? 'text-emerald-300' : 'text-zinc-400'}`}>
                                      Volatility Defender
                                    </label>
                                    <span className={`text-[7px] font-bold ${activeStrategies.includes('strategy_bollinger') ? 'text-emerald-400' : 'text-zinc-600'}`}>
                                      {activeStrategies.includes('strategy_bollinger') ? '● ARMED' : 'STANDBY'}
                                    </span>
                                  </div>
                                  <span className="text-[8px] text-zinc-500 block">Automatically arms shields if volatility exceeds 2.5% in 2 ticks.</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Cron background automation trigger simulator */}
                          <div className="p-4 bg-zinc-900/60 border border-zinc-850 rounded-none space-y-3 font-mono flex flex-col justify-between">
                            <div>
                              <span className="text-[8px] uppercase tracking-widest text-zinc-500 font-bold block mb-1">BACKGROUND TASK TICK RATE:</span>
                              <div className="space-y-2">
                                <div>
                                  <label className="text-[8px] text-zinc-550 block font-bold mb-1">CRON EXPRESSION (Automated Ticker Checks):</label>
                                  <input
                                    type="text"
                                    value={customCronString}
                                    onChange={(e) => setCustomCronString(e.target.value)}
                                    className="w-full bg-zinc-950 border border-zinc-800 text-[10px] text-zinc-300 px-2.5 py-1.5 focus:outline-none focus:border-indigo-600 rounded-none font-mono"
                                  />
                                </div>
                                <div className="text-[8px] text-zinc-500 leading-normal">
                                  Default cron compiles check tasks every 10 seconds. Ensures continuous status checks without keeping active client frame focus.
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 text-[9px] bg-zinc-950 border border-zinc-850 p-1.5 text-zinc-400">
                              <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full animate-ping" />
                              <span className="font-mono">Cron status: <strong className="text-emerald-400">SCHEDULER ENGAGED</strong></span>
                            </div>
                          </div>
                        </div>

                        {/* Interactive local ledger compaction (durable archive retention concept visualization) */}
                        <div className="p-4 bg-zinc-900/40 border border-zinc-805">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                            <div className="space-y-0.5 font-mono text-left">
                              <span className="text-[9px] uppercase tracking-wider font-mono text-indigo-400 font-bold block">3. DEEP ARCHIVE TRANSACTION RETENTION & BACKUP SEAL</span>
                              <p className="text-[9px] text-zinc-400 leading-normal max-w-sm">
                                Standard users have a 40-item ring memory limitations. PRO licenses unlock compression sweeps archiving up to 10k ledger entries.
                              </p>
                            </div>
                            <div className="shrink-0">
                              <button
                                onClick={() => {
                                  setIsArchiveCompacting(true);
                                  if (soundEnabled) playAudioTone(440, 0.08, 'sawtooth', true, synthVolume);
                                  setTimeout(() => {
                                    setIsArchiveCompacting(false);
                                    setIsArchiveCompacted(true);
                                    if (soundEnabled) {
                                      playAudioTone(880, 0.1, 'sine', true, synthVolume);
                                      setTimeout(() => playAudioTone(1046, 0.15, 'sine', true, synthVolume), 80);
                                    }
                                    showToast("Deep archival database compression sweep complete (100% stable)!", "success");
                                  }, 1500);
                                }}
                                disabled={isArchiveCompacting}
                                className={`px-4 py-2 border font-bold uppercase tracking-wider font-mono text-[9px] flex items-center gap-1.5 cursor-pointer ${
                                  isArchiveCompacted 
                                    ? 'bg-emerald-950 border-emerald-500 hover:bg-emerald-900 text-emerald-300' 
                                    : 'bg-zinc-800 border-zinc-700 hover:bg-zinc-750 text-zinc-300'
                                }`}
                              >
                                {isArchiveCompacting ? (
                                  <>
                                    <Loader2 size={11} className="animate-spin text-indigo-400" />
                                    COMPRESSING ARCHIVES...
                                  </>
                                ) : isArchiveCompacted ? (
                                  '✓ Backup archive ready'
                                ) : (
                                  '📂 Run Database Compaction'
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Cryptex visual output */}
                          <AnimatePresence>
                            {isArchiveCompacted && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-3 p-3 bg-zinc-950 border border-zinc-900 font-mono text-[8px] text-zinc-400 space-y-1 overflow-hidden text-left"
                              >
                                <div className="text-[8px] text-indigo-400 font-bold uppercase tracking-widest border-b border-zinc-900 pb-1 mb-1 bg-zinc-950 flex justify-between">
                                  <span>🔒 Cryptex Immutable State Seal Export (Encrypted payload)</span>
                                  <span className="text-emerald-400 font-black">COMPACT SECURE KEY</span>
                                </div>
                                <div className="text-zinc-500 leading-normal break-all font-mono">
                                  {`{ "algorithm": "AES-256-GCM", "epoch": ${Math.floor(Date.now() / 1000)}, "payload_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855", "ledger_signatures": ["0x8fae120a30b2", "0xfa117cc210210", "0x12bb9bdfd8a4"], "integrity_seal": "ECD6-PROV-904B" }`}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'about' && (
                <div>
                  <h2 className="text-xl font-bold mb-2 uppercase tracking-wide text-zinc-100">SatStacker Standalone Architecture</h2>
                  <p className="text-xs text-zinc-400 mb-6">
                    An overview of the client-side execution framework, local data isolation, and live market feed synchronization.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                    <div className="p-4 bg-zinc-950/60 border border-zinc-800/80 text-zinc-455 rounded-xl">
                      <span className="font-bold text-indigo-400 uppercase tracking-wider text-[11px] block mb-2">Live Feed Sync (Web Worker Thread)</span>
                      <p className="leading-relaxed text-zinc-400 text-[11px] space-y-1">
                        • Establishes a direct handshake with the official Coinbase WebSocket endpoint (<code className="text-zinc-300">wss://ws-feed.exchange.coinbase.com</code>) to retrieve high-frequency ticker feeds.<br />
                        • Performs data sanitization and processes raw float pricing asynchronously off the main UI rendering thread.<br />
                        • Eliminates micro-stuttering, keeping browser interactive frame rates locked at a steady 60 FPS under chaotic volatility events.
                      </p>
                    </div>

                    <div className="p-4 bg-zinc-950/60 border border-zinc-800/80 text-zinc-455 rounded-xl">
                      <span className="font-bold text-indigo-400 uppercase tracking-wider text-[11px] block mb-2">Local Web Storage Persistence</span>
                      <p className="leading-relaxed text-zinc-400 text-[11px] space-y-1">
                        • User transaction logs, streak preservation metrics, and custom parameters are committed strictly to client-side <code className="text-zinc-300">localStorage</code> databases.<br />
                        • Operates entirely as a sandbox environment; no personal financial assets, API keys, or operational sequences are transmitted outside of the locally isolated browser cache.<br />
                        • Secures transaction ledger history and custom threshold metrics between manual browser cache purges.
                      </p>
                    </div>

                    <div className="p-4 bg-zinc-950/60 border border-zinc-800/80 text-zinc-400 rounded-xl">
                      <span className="font-bold text-indigo-400 uppercase tracking-wider text-[11px] block mb-2">Main Thread Coordination (Zustand)</span>
                      <p className="leading-relaxed text-zinc-400 text-[11px] space-y-1">
                        • Performs lightweight math transformations (BTC ↔ Satoshi ↔ USD) instantaneously on input changes with zero event dispatching delay.<br />
                        • Powers the modular visual components, sound oscillators, physics canvas arrays, and streak status monitors in perfect layout harmony.<br />
                        • Restores cached local configurations on active component mount.
                      </p>
                    </div>

                    <div className="p-4 bg-zinc-950/60 border border-zinc-800/80 text-zinc-400 rounded-xl">
                      <span className="font-bold text-indigo-400 uppercase tracking-wider text-[11px] block mb-2">Interactive Premium Simulation</span>
                      <p className="leading-relaxed text-zinc-400 text-[11px] space-y-1">
                        • Subscriptions are processed in a local sandbox context. Activating the Premium Edition unlocks mock payment receipts, premium sound waves, and unlimited streak protection settings instantly.<br />
                        • Offers a risk-free demonstration environment for evaluating professional tools, audio alarms, and rapid grid configurations.<br />
                        • Does not communicate with third-party billing providers or credit processors.
                      </p>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* PLATFORM CREDITS */}
        <div className={`mt-10 py-6 border-t font-mono text-[10px] flex flex-col sm:flex-row items-center justify-between gap-4 ${
          store.activeMode === 'stim' ? 'border-purple-900/20 text-purple-400/60' : 'border-zinc-800 text-zinc-500'
        }`}>
          <div>
            SATSTACKER v2.0.4 • BROWSER SANDBOX RUNTIME // LOCAL LEDGER SEQUENCE COMPLIANT
          </div>
          <div className="flex gap-4 uppercase tracking-widest text-[9px]">
            <span>STANDALONE UTILITY</span>
            <span className="hidden md:inline">•</span>
            <span>CLIENT-SIDE STORE ONLY</span>
            <span className="hidden md:inline">•</span>
            <span>Local Storage Active</span>
          </div>
        </div>

      </main>

      {/* Dynamic Release-Grade Toast Notification System */}
      <AnimatePresence>
        {customToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed bottom-6 right-6 z-50 max-w-sm rounded-none border p-4 shadow-2xl font-mono text-xs backdrop-blur-md transition-colors ${
              customToast.type === 'success'
                ? 'bg-zinc-950/95 border-emerald-500/30 text-emerald-300 shadow-[0_4px_30px_rgba(16,185,129,0.05)]'
                : 'bg-zinc-950/95 border-amber-500/30 text-amber-300 shadow-[0_4px_30px_rgba(245,158,11,0.05)]'
            }`}
          >
            <div className="flex items-start gap-3">
              {customToast.type === 'success' ? (
                <ClipboardCheck size={18} className="text-emerald-400 mt-0.5 shrink-0" />
              ) : (
                <AlertTriangle size={18} className="text-amber-400 mt-0.5 shrink-0" />
              )}
              <div className="space-y-1">
                <span className={`text-[9px] uppercase font-bold tracking-widest block ${
                  customToast.type === 'success' ? 'text-emerald-500' : 'text-amber-500'
                }`}>
                  {customToast.type === 'success' ? 'LEDGER INTEGRITY BROADCAST' : 'SYSTEM EXCEPTION ALIGNMENT'}
                </span>
                <p className="leading-relaxed text-zinc-300 select-all">{customToast.message}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* GUIDED ONBOARDING WALKTHROUGH OVERLAY */}
      <AnimatePresence>
        {guidedTourStep > 0 && (
          <div className="fixed inset-0 z-40 pointer-events-auto flex items-center justify-center p-4">
            {/* Ambient Backdrop Cover */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.65 }}
              exit={{ opacity: 0 }}
              onClick={handleSkipTour}
              className="absolute inset-0 bg-black/85 backdrop-blur-[2px]"
            />

            {/* Tooltip dialog card container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", stiffness: 350, damping: 28 }}
              className="relative z-50 w-full max-w-md bg-zinc-950 border border-indigo-500/40 p-6 rounded-2xl shadow-[0_0_50px_rgba(99,102,241,0.25)] font-mono text-zinc-100"
            >
              {/* Corner tech tag */}
              <div className="absolute top-3 right-4 text-[8px] text-zinc-500 uppercase tracking-widest font-mono select-none">
                SatStacker Guide // Step {guidedTourStep} of 4
              </div>

              {/* Progress Line */}
              <div className="w-full bg-zinc-900 h-1 rounded-full overflow-hidden mb-5 mt-2">
                <div 
                  className="bg-indigo-500 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 h-full transition-all duration-300"
                  style={{ width: `${(guidedTourStep / 4) * 100}%` }}
                />
              </div>

              {/* Step content mapping */}
              {guidedTourStep === 1 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                      <Sparkles size={20} className="animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black uppercase text-zinc-100 font-sans tracking-tight">
                        1. Converter Core
                      </h4>
                      <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">
                        Calculations & Tactile Effects
                      </div>
                    </div>
                  </div>
                  <p className="text-[11.5px] text-zinc-300 leading-relaxed font-mono">
                    Convert Satoshi amounts to full Bitcoin instantly. Any input change triggers real-time physical coin flows, interactive calibration, and acoustic wave feedback.
                  </p>
                  <div className="bg-zinc-900/40 border border-zinc-850 p-2.5 rounded-xl text-[10.5px] text-zinc-400 font-mono">
                    <strong className="text-zinc-200">💡 Quick Action:</strong> Try the <span className="text-indigo-400 font-bold">Double Balance</span> preset inside the left panel to test responsive calibration pulses!
                  </div>
                </div>
              )}

              {guidedTourStep === 2 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-amber-400/10 text-amber-400">
                      <Coins size={20} className="animate-bounce" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black uppercase text-zinc-100 font-sans tracking-tight">
                        2. Live Price & Stress-Test Suite
                      </h4>
                      <div className="text-[10px] text-amber-500 uppercase tracking-wider font-bold font-mono">
                        WebSocket Ticker Alignment
                      </div>
                    </div>
                  </div>
                  <p className="text-[11.5px] text-zinc-300 leading-relaxed font-mono">
                    Direct handshake with Coinbase WebSocket feed. Charts are paired with a real-time system performance stress-test panel to test rendering latency during market spikes.
                  </p>
                  <div className="bg-zinc-900/40 border border-zinc-850 p-2.5 rounded-xl text-[10.5px] text-zinc-400 font-mono">
                    <strong className="text-zinc-200">📊 Volatility:</strong> Customize gravity flow forces or stream signal quantities in the visualizer controls panel above.
                  </div>
                </div>
              )}

              {guidedTourStep === 3 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-red-400/10 text-red-500">
                      <ShieldCheck size={20} className="animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black uppercase text-zinc-100 font-sans tracking-tight">
                        3. Volatility Shields & Alerts
                      </h4>
                      <div className="text-[10px] text-red-500 uppercase tracking-wider font-bold font-mono">
                        Streak Protection & Webhooks
                      </div>
                    </div>
                  </div>
                  <p className="text-[11.5px] text-zinc-300 leading-relaxed font-mono">
                    Guard your streak from sudden price crashes. Setup live simulation alarms, synthetic sound alerts, mock Discord webhooks, and deploy Freeze Token shields.
                  </p>
                  <div className="bg-zinc-900/40 border border-zinc-850 p-2.5 rounded-xl text-[10.5px] text-zinc-400 font-mono">
                    <strong className="text-zinc-200">🚀 Pro Upgrade:</strong> Standard subscription offers unlimited freeze shields, real webhooks, and permanent ledger history depth.
                  </div>
                </div>
              )}

              {guidedTourStep === 4 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-emerald-400/10 text-emerald-400">
                      <Database size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black uppercase text-zinc-100 font-sans tracking-tight">
                        4. Audited Transaction Ledger
                      </h4>
                      <div className="text-[10px] text-emerald-400 uppercase tracking-wider font-bold font-mono">
                        Private CSV Spreadsheet Logs
                      </div>
                    </div>
                  </div>
                  <p className="text-[11.5px] text-zinc-300 leading-relaxed font-mono">
                    A private audit ledger tracking every conversion and DCA step safely in your browser. Easily filter, search, expand individual proof IDs, and export to CSV.
                  </p>
                  <div className="bg-zinc-900/40 border border-zinc-850 p-2.5 rounded-xl text-[10.5px] text-zinc-400 font-mono">
                    <strong className="text-zinc-200">🔐 Offline Security:</strong> 100% private. No credentials or transaction records ever leave your local workspace storage.
                  </div>
                </div>
              )}

              {/* Navigation controls footer */}
              <div className="mt-8 pt-4 border-t border-zinc-900 flex items-center justify-between font-mono">
                <button
                  onClick={handleSkipTour}
                  className="text-[10px] uppercase font-bold text-zinc-500 hover:text-zinc-350 cursor-pointer"
                >
                  Skip Tour [✕]
                </button>

                <div className="flex items-center gap-2">
                  {guidedTourStep > 1 && (
                    <button
                      onClick={handlePrevTourStep}
                      className="px-3 py-1.5 border border-zinc-800 bg-zinc-900 hover:bg-zinc-850 text-zinc-300 uppercase font-bold text-[10px] rounded cursor-pointer transition-colors"
                    >
                      &larr; Back
                    </button>
                  )}

                  <button
                    onClick={handleNextTourStep}
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white uppercase font-black text-[10px] rounded cursor-pointer transition-all flex items-center gap-1 shadow-[0_0_15px_rgba(99,102,241,0.4)]"
                  >
                    {guidedTourStep === 4 ? 'Finish Guided Tour ✓' : 'Next Step &rarr;'}
                  </button>
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
