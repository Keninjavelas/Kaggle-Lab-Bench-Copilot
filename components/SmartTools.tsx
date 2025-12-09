import React, { useState, useEffect, useRef } from 'react';
import { LabTimer, LogEntry, ReagentCheckResult, RoastResult, CostAnalysis } from '../types';
import { Play, Pause, RotateCcw, Mic, Square, CheckCircle2, AlertTriangle, ScanLine, FlaskConical, Clock, FileSpreadsheet, Gavel, DollarSign, Flame, Loader2, RefreshCw, FileUp, Grip, HelpCircle, Info } from 'lucide-react';
import { fileToBase64, checkReagent, structureLog, roastProtocol, estimateCost } from '../services/geminiService';

interface SmartToolsProps {
  timers: LabTimer[];
  setTimers: React.Dispatch<React.SetStateAction<LabTimer[]>>;
  logs: LogEntry[];
  setLogs: React.Dispatch<React.SetStateAction<LogEntry[]>>;
  protocol: string;
  isGloveMode?: boolean;
  onPdfDrop?: (file: File) => void;
  isParsingPdf?: boolean;
}

const SmartTools: React.FC<SmartToolsProps> = ({ timers, setTimers, logs, setLogs, protocol, isGloveMode, onPdfDrop, isParsingPdf }) => {
  const [isListening, setIsListening] = useState(false);
  const [reagentStatus, setReagentStatus] = useState<'idle' | 'scanning' | 'safe' | 'unsafe'>('idle');
  const [reagentResult, setReagentResult] = useState<ReagentCheckResult | null>(null);
  
  // New features state
  const [roastStatus, setRoastStatus] = useState<'idle' | 'loading' | 'done'>('idle');
  const [roastResult, setRoastResult] = useState<RoastResult | null>(null);
  const [costStatus, setCostStatus] = useState<'idle' | 'loading' | 'done'>('idle');
  const [costResult, setCostResult] = useState<CostAnalysis | null>(null);
  
  // Help System State
  const [activeInfo, setActiveInfo] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const [isPdfDragOver, setIsPdfDragOver] = useState(false);

  // Auto-calculate cost when protocol changes (debounced)
  useEffect(() => {
    const fetchCost = async () => {
      if (protocol.length > 50) {
        setCostStatus('loading');
        const analysis = await estimateCost(protocol);
        setCostResult(analysis);
        setCostStatus('done');
      } else {
        setCostResult(null);
        setCostStatus('idle');
      }
    };
    
    const timeoutId = setTimeout(fetchCost, 3000); // Debounce 3s
    return () => clearTimeout(timeoutId);
  }, [protocol]);

  // Timer Logic
  useEffect(() => {
    const interval = setInterval(() => {
      setTimers(prev => prev.map(timer => {
        if (timer.isRunning && timer.remainingSeconds > 0) {
          return { ...timer, remainingSeconds: timer.remainingSeconds - 1 };
        } else if (timer.isRunning && timer.remainingSeconds === 0) {
          return { ...timer, isRunning: false, isCompleted: true };
        }
        return timer;
      }));
    }, 1000);
    return () => clearInterval(interval);
  }, [setTimers]);

  const toggleTimer = (id: string) => {
    setTimers(prev => prev.map(t => t.id === id ? { ...t, isRunning: !t.isRunning } : t));
  };

  const resetTimer = (id: string) => {
    setTimers(prev => prev.map(t => t.id === id ? { ...t, isRunning: false, remainingSeconds: t.durationSeconds, isCompleted: false } : t));
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Voice Logic
  const toggleListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Browser does not support Speech Recognition.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      setIsListening(true);
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);

      recognition.onresult = async (event: any) => {
        const transcript = event.results[0][0].transcript;
        
        const tempId = Date.now().toString();
        // Optimistic UI update
        setLogs(prev => [{
            id: tempId,
            timestamp: new Date().toLocaleTimeString(),
            action: "Processing...",
            planned: "Listening...",
            actual: "...",
            observation: transcript
        }, ...prev]);

        // Call Gemini
        const structured = await structureLog(transcript);
        
        // Update Log
        setLogs(prev => prev.map(log => log.id === tempId ? {
            ...log,
            action: structured.action,
            planned: structured.planned,
            actual: structured.actual,
            observation: structured.observation
        } : log));
      };

      recognition.onerror = (event: any) => {
        console.error("Speech Recognition Error", event.error);
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    }
  };

  // Reagent Logic
  const handleReagentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setReagentStatus('scanning');
    try {
      const base64 = await fileToBase64(file);
      const result = await checkReagent(protocol, base64, file.type);
      setReagentResult(result);
      setReagentStatus(result.safe ? 'safe' : 'unsafe');
    } catch (err) {
      setReagentStatus('unsafe');
      setReagentResult({ safe: false, message: "Scan failed." });
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Roast Logic
  const handleRoast = async () => {
    if (!protocol) return;
    setRoastStatus('loading');
    const result = await roastProtocol(protocol);
    setRoastResult(result);
    setRoastStatus('done');
  };

  // PDF Drop Logic
  const handlePdfDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isParsingPdf) setIsPdfDragOver(true);
  };
  const handlePdfDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsPdfDragOver(false);
  };
  const handlePdfDropLocal = (e: React.DragEvent) => {
    e.preventDefault();
    setIsPdfDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type === 'application/pdf' && onPdfDrop) {
      onPdfDrop(file);
    }
  };
  const handlePdfSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onPdfDrop) onPdfDrop(file);
    if (pdfInputRef.current) pdfInputRef.current.value = '';
  };

  const toggleHelp = (key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveInfo(activeInfo === key ? null : key);
  };

  const InfoOverlay: React.FC<{text: string, onClose: () => void}> = ({text, onClose}) => (
    <div className="absolute inset-0 z-50 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200 backdrop-blur-sm">
      <div className="p-3 bg-indigo-500/10 rounded-full mb-3">
        <Info className="h-6 w-6 text-indigo-400" />
      </div>
      <p className="text-xs text-slate-300 leading-relaxed mb-4 font-mono max-w-[200px]">{text}</p>
      <button 
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        className="text-[10px] bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg uppercase font-bold tracking-wide transition-colors"
      >
        Got it
      </button>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-transparent p-0.5">
      
      {/* Header */}
      <div className="flex items-center space-x-2 mb-4 text-slate-400">
         <Grip className="h-4 w-4" />
         <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-slate-300">Co-Pilot Dashboard</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 auto-rows-min">
        
        {/* 0. Paper-to-Pipeline (Full Width) */}
        <section className="col-span-full">
          <div 
            className={`
              glass-panel rounded-xl p-4 flex items-center justify-between relative overflow-hidden transition-all duration-300 group
              ${isPdfDragOver || isParsingPdf ? 'border-violet-500 shadow-[0_0_20px_rgba(139,92,246,0.5)] bg-slate-800/80' : 'border-slate-700/50 hover:border-violet-400/50 hover:bg-white/5'}
            `}
            onDragOver={handlePdfDragOver}
            onDragLeave={handlePdfDragLeave}
            onDrop={handlePdfDropLocal}
            onClick={() => pdfInputRef.current?.click()}
          >
             {activeInfo === 'paper' && (
                <InfoOverlay 
                  text="Drag & drop PDF papers here. AI extracts 'Materials & Methods' to auto-build your protocol checklist." 
                  onClose={() => setActiveInfo(null)} 
                />
             )}

             {/* Scanner Light Animation (Electric Violet) */}
             {(isPdfDragOver || isParsingPdf) && (
               <div className="absolute top-0 left-0 w-full h-full bg-violet-500/10 z-10 pointer-events-none">
                 <div className="absolute top-0 left-0 w-full h-1 bg-violet-400 shadow-[0_0_15px_rgba(139,92,246,1)] animate-[scan_2s_linear_infinite]"></div>
               </div>
             )}

             <div className="flex items-center space-x-3">
                <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                   <FileUp className={`h-5 w-5 ${isParsingPdf ? 'animate-bounce' : ''}`} />
                </div>
                <div>
                   <h4 className="text-xs font-bold text-slate-200 font-mono uppercase">Paper-to-Pipeline</h4>
                   <p className="text-[10px] text-slate-500">{isParsingPdf ? 'Scanning...' : 'Drop PDF or Click'}</p>
                </div>
             </div>
             <div className="flex items-center gap-3">
                {isParsingPdf && <Loader2 className="h-4 w-4 text-violet-400 animate-spin" />}
                <button onClick={(e) => toggleHelp('paper', e)} className="text-slate-600 hover:text-indigo-400 transition-colors p-1">
                  <HelpCircle className="h-4 w-4" />
                </button>
             </div>
             <input type="file" ref={pdfInputRef} onChange={handlePdfSelect} accept="application/pdf" className="hidden" />
          </div>
        </section>

        {/* 1. Smart Chrono */}
        <section className="col-span-1 flex flex-col relative">
          <div className="glass-panel p-3 rounded-xl flex-1 flex flex-col min-h-[140px] relative overflow-hidden">
             {activeInfo === 'timers' && (
                <InfoOverlay 
                  text="AI scans your protocol for time-dependent steps (incubations, spins) and creates tracked timers." 
                  onClose={() => setActiveInfo(null)} 
                />
             )}
             <div className="flex items-center justify-between mb-3 text-indigo-300">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <h3 className="text-[10px] font-bold uppercase tracking-wider font-mono">Timers</h3>
                </div>
                <button onClick={(e) => toggleHelp('timers', e)} className="text-slate-600 hover:text-indigo-400 transition-colors">
                  <HelpCircle className="h-3 w-3" />
                </button>
             </div>
             <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar max-h-[150px]">
                {timers.length === 0 ? (
                    <div className="text-center py-4 text-[10px] text-slate-600 italic font-mono">
                        // Auto-detects durations
                    </div>
                ) : (
                    timers.map(timer => (
                        <div key={timer.id} className="bg-slate-900/50 p-2 rounded-lg flex items-center justify-between border border-white/5">
                            <div className="flex-1 min-w-0 mr-2">
                                <div className="text-[10px] text-slate-400 truncate font-mono uppercase leading-tight">{timer.label}</div>
                                <div className={`font-mono text-sm font-bold ${timer.isCompleted ? 'text-green-400' : 'text-slate-100'}`}>
                                    {formatTime(timer.remainingSeconds)}
                                </div>
                            </div>
                            {!timer.isCompleted ? (
                                <button 
                                  onClick={() => toggleTimer(timer.id)} 
                                  className={`rounded p-1.5 transition-all ${timer.isRunning ? 'bg-amber-500/20 text-amber-400' : 'bg-green-500/20 text-green-400'}`}
                                >
                                    {timer.isRunning ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                                </button>
                            ) : (
                                <button onClick={() => resetTimer(timer.id)} className="rounded p-1.5 bg-slate-700 text-slate-400 hover:text-white">
                                    <RotateCcw className="h-3 w-3" />
                                </button>
                            )}
                        </div>
                    ))
                )}
             </div>
          </div>
        </section>

        {/* 3. Resource Monitor (Cost) */}
        <section className="col-span-1 flex flex-col">
          <div className="glass-panel p-3 rounded-xl flex-1 flex flex-col min-h-[140px] relative overflow-hidden">
             {activeInfo === 'cost' && (
                <InfoOverlay 
                  text="Estimates the 'Burn Rate' of your experiment based on reagent prices to prevent budget overruns." 
                  onClose={() => setActiveInfo(null)} 
                />
             )}
            <div className="flex items-center justify-between mb-3 text-indigo-300">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4" />
                  <h3 className="text-[10px] font-bold uppercase tracking-wider font-mono">Burn Rate</h3>
                </div>
                <button onClick={(e) => toggleHelp('cost', e)} className="text-slate-600 hover:text-indigo-400 transition-colors">
                  <HelpCircle className="h-3 w-3" />
                </button>
            </div>
            
            <div className="flex-1 flex flex-col justify-center">
               {costStatus === 'loading' ? (
                  <div className="flex justify-center"><Loader2 className="h-4 w-4 animate-spin text-slate-500" /></div>
               ) : costResult && costResult.totalCost !== "N/A" ? (
                  <div>
                     <div className="text-center mb-2">
                        <span className="text-2xl font-bold text-emerald-400 font-mono tracking-tight">{costResult.totalCost}</span>
                        <div className="text-[10px] text-slate-500 uppercase">Est. Cost / Run</div>
                     </div>
                     {costResult.riskySteps.length > 0 && (
                        <div className="bg-amber-500/10 border border-amber-500/20 rounded p-1.5 flex items-center space-x-2">
                           <Flame className="h-3 w-3 text-amber-500" />
                           <div className="min-w-0">
                               <div className="text-[10px] font-bold text-amber-400 uppercase font-mono truncate">{costResult.riskySteps[0].reagent}</div>
                           </div>
                        </div>
                     )}
                  </div>
               ) : (
                 <div className="text-[10px] text-slate-600 text-center italic font-mono">// No cost data</div>
               )}
            </div>
          </div>
        </section>

        {/* 2. Peer Review (The Roast) */}
        <section className="col-span-1">
          <div className="glass-panel p-3 rounded-xl min-h-[160px] flex flex-col relative overflow-hidden">
             {activeInfo === 'roast' && (
                <InfoOverlay 
                  text="Simulates a critical Peer Reviewer (#2) to spot flaws in logic, controls, or sample size." 
                  onClose={() => setActiveInfo(null)} 
                />
             )}
             <div className="flex items-center justify-between mb-3 text-indigo-300 relative z-10">
                <div className="flex items-center space-x-2">
                  <Gavel className="h-4 w-4" />
                  <h3 className="text-[10px] font-bold uppercase tracking-wider font-mono">Review</h3>
                </div>
                <button onClick={(e) => toggleHelp('roast', e)} className="text-slate-600 hover:text-indigo-400 transition-colors relative z-20">
                  <HelpCircle className="h-3 w-3" />
                </button>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center relative z-10">
                {roastStatus === 'idle' && (
                  <button 
                    onClick={handleRoast}
                    disabled={protocol.length < 20}
                    className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[10px] font-bold text-slate-300 py-2 uppercase tracking-wide transition-colors"
                  >
                     Request Critique
                  </button>
                )}

                {roastStatus === 'loading' && <Loader2 className="h-5 w-5 text-indigo-400 animate-spin" />}

                {roastStatus === 'done' && roastResult && (
                   <div className="text-center w-full">
                       <div className="inline-block bg-slate-950/50 px-2 py-0.5 rounded text-[10px] font-mono font-bold text-slate-400 border border-white/5 mb-1">
                          Score: <span className={roastResult.score < 5 ? 'text-red-400' : 'text-green-400'}>{roastResult.score}/10</span>
                       </div>
                       <p className="text-[10px] font-bold text-slate-200 mb-1 leading-tight line-clamp-2">{roastResult.verdict}</p>
                       <p className="text-[10px] text-slate-500 italic line-clamp-2 mb-2">"{roastResult.critique}"</p>
                       <button onClick={handleRoast} className="text-[9px] text-indigo-300 hover:text-white underline uppercase font-bold flex items-center justify-center gap-1 mx-auto">
                          <RefreshCw className="h-2.5 w-2.5" /> Retry
                       </button>
                   </div>
                )}
            </div>
          </div>
        </section>

        {/* 4. Reagent Check (Safety Scan) */}
        <section className="col-span-1">
          <div className="glass-panel p-3 rounded-xl min-h-[160px] flex flex-col relative group overflow-hidden">
            {activeInfo === 'safety' && (
                <InfoOverlay 
                  text="Scans reagent bottles via camera to verify Name, Concentration, and Expiry against the protocol." 
                  onClose={() => setActiveInfo(null)} 
                />
             )}
            <div className="flex items-center justify-between mb-3 text-indigo-300">
                <div className="flex items-center space-x-2">
                  <FlaskConical className="h-4 w-4" />
                  <h3 className="text-[10px] font-bold uppercase tracking-wider font-mono">Safety Scan</h3>
                </div>
                <button onClick={(e) => toggleHelp('safety', e)} className="text-slate-600 hover:text-indigo-400 transition-colors">
                  <HelpCircle className="h-3 w-3" />
                </button>
            </div>
            
            <div className="flex-1 flex flex-col justify-center">
                {reagentStatus === 'idle' && (
                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="cursor-pointer bg-white/5 hover:bg-white/10 border border-dashed border-slate-600 rounded-lg flex flex-col items-center justify-center h-20 transition-colors"
                    >
                        <ScanLine className="h-5 w-5 text-indigo-400 mb-1" />
                        <span className="text-[9px] text-slate-400 font-bold uppercase font-mono">Scan Label</span>
                    </div>
                )}

                {reagentStatus === 'scanning' && (
                     <div className="flex flex-col items-center">
                         <Loader2 className="h-5 w-5 text-indigo-400 animate-spin mb-1" />
                         <span className="text-[9px] text-indigo-300 font-mono animate-pulse">Analyzing...</span>
                     </div>
                )}

                {(reagentStatus === 'safe' || reagentStatus === 'unsafe') && reagentResult && (
                    <div className={`p-2 rounded border ${reagentStatus === 'safe' ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'} text-left`}>
                        <div className={`flex items-center gap-2 mb-1 ${reagentStatus === 'safe' ? 'text-green-400' : 'text-red-400'}`}>
                            {reagentStatus === 'safe' ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                            <h4 className="text-[10px] font-bold font-mono uppercase truncate">{reagentResult.bottleName || 'Reagent'}</h4>
                        </div>
                        
                        <p className={`text-[9px] mb-2 font-medium leading-relaxed ${reagentStatus === 'safe' ? 'text-green-200/80' : 'text-red-200/80'}`}>
                           {reagentResult.message}
                        </p>

                        <div className="flex justify-between text-[9px] text-slate-400 font-mono mb-2 bg-black/20 p-1.5 rounded">
                           <div className="flex flex-col">
                             <span className="text-[8px] uppercase opacity-50">Expires</span>
                             <span className={reagentStatus === 'unsafe' && (reagentResult.expiryDate?.includes('Expired') || reagentResult.message.toLowerCase().includes('expired')) ? 'text-red-300 font-bold' : ''}>
                               {reagentResult.expiryDate || 'N/A'}
                             </span>
                           </div>
                           <div className="flex flex-col text-right">
                             <span className="text-[8px] uppercase opacity-50">Conc.</span>
                             <span className={reagentStatus === 'unsafe' && (reagentResult.message.toLowerCase().includes('concentration')) ? 'text-red-300 font-bold' : ''}>
                               {reagentResult.concentration || 'N/A'}
                             </span>
                           </div>
                        </div>
                        <button onClick={() => setReagentStatus('idle')} className="w-full text-[9px] bg-slate-900/50 hover:bg-slate-900 text-slate-400 py-1.5 rounded border border-white/5 transition-colors uppercase font-bold tracking-wider">Scan Next</button>
                    </div>
                )}
            </div>
            <input type="file" ref={fileInputRef} onChange={handleReagentUpload} accept="image/*" className="hidden" />
          </div>
        </section>

        {/* 5. Voice Log (Full Width) */}
        <section className="col-span-full">
          <div className="glass-panel rounded-xl flex flex-col overflow-hidden min-h-[200px] relative">
             {activeInfo === 'logs' && (
                <InfoOverlay 
                  text="Hands-free logging. Tap the mic and dictate observations. AI formats them into a table." 
                  onClose={() => setActiveInfo(null)} 
                />
             )}
             {/* Header */}
             <div className="flex items-center justify-between p-3 border-b border-white/5 bg-white/[0.02]">
                <div className="flex items-center space-x-2 text-indigo-300">
                    <FileSpreadsheet className="h-4 w-4" />
                    <h3 className="text-xs font-bold uppercase tracking-wider font-mono">Lab Log</h3>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                      onClick={toggleListening}
                      className={`
                        rounded-full flex items-center justify-center border transition-all
                        ${isListening 
                          ? 'bg-red-500 text-white animate-pulse border-red-400 w-8 h-8' 
                          : 'bg-slate-800 text-slate-400 hover:text-white border-white/5 w-6 h-6'}
                      `}
                  >
                      {isListening ? <Square className="h-3 w-3 fill-current" /> : <Mic className="h-3 w-3" />}
                  </button>
                  <button onClick={(e) => toggleHelp('logs', e)} className="text-slate-600 hover:text-indigo-400 transition-colors">
                    <HelpCircle className="h-3 w-3" />
                  </button>
                </div>
            </div>
             
             {/* Log Entries */}
             <div className="flex-1 p-2 space-y-1.5 overflow-y-auto custom-scrollbar max-h-[160px]">
                 {logs.length === 0 ? (
                    <div className="text-center py-8 text-[10px] text-slate-600 italic font-mono">
                        Tap mic to dictate notes...
                    </div>
                 ) : (
                    logs.map(log => (
                        <div key={log.id} className="grid grid-cols-12 gap-2 text-[10px] border-b border-white/5 pb-1.5 last:border-0 font-mono animate-in slide-in-from-top-1">
                            <div className="col-span-3 font-bold text-indigo-300 truncate">{log.action}</div>
                            <div className="col-span-4 text-slate-400 truncate flex flex-col">
                                <span>P: {log.planned}</span>
                                <span className="text-slate-200">A: {log.actual}</span>
                            </div>
                            <div className="col-span-5 text-slate-500 italic truncate">{log.observation}</div>
                        </div>
                    ))
                 )}
             </div>
          </div>
        </section>

      </div>
    </div>
  );
};

export default SmartTools;