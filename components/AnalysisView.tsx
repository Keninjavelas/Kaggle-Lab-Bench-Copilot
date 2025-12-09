import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Loader2, AlertTriangle, CheckCircle2, ArrowRight, ThumbsUp, ThumbsDown, Send, Volume2, StopCircle, Bot, Sparkles, RotateCcw, FileText, Download, Award, Zap } from 'lucide-react';
import { AnalysisStatus } from '../types';
import { generateLabReport } from '../services/reportService';
import confetti from 'canvas-confetti';

interface AnalysisViewProps {
  status: AnalysisStatus;
  result: string | null;
  protocol: string;
  imagePreview: string | null;
  onApplyFix?: (protocol: string) => void;
  onUndo?: () => void;
  canUndo?: boolean;
  baseFilename?: string;
}

const AnalysisView: React.FC<AnalysisViewProps> = ({ status, result, protocol, imagePreview, onApplyFix, onUndo, canUndo, baseFilename }) => {
  const [feedback, setFeedback] = useState<'helpful' | 'not_helpful' | null>(null);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [showStamp, setShowStamp] = useState(false);
  const [showAchievement, setShowAchievement] = useState(false);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (status === AnalysisStatus.ANALYZING) {
      setFeedback(null);
      setComment('');
      setSubmitted(false);
      handleStopSpeaking();
      setShowStamp(false);
      setShowAchievement(false);
    }
  }, [status]);

  useEffect(() => {
    return () => {
      handleStopSpeaking();
    };
  }, []);

  const handleStopSpeaking = () => {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  const handleSpeak = () => {
    if (!result) return;

    if (isSpeaking) {
      handleStopSpeaking();
      return;
    }

    const cleanText = result
      .replace(/[*#`]/g, '')
      .replace(/corrected_protocol/g, 'corrected protocol');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    speechRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  const handleSubmitFeedback = () => {
    console.log('User Feedback:', { type: feedback, comment });
    setSubmitted(true);
  };

  const handleGenerateReport = async () => {
    if (!result) return;
    setIsGeneratingReport(true);
    
    try {
      await generateLabReport(protocol, result, imagePreview, baseFilename);
      
      // Trigger Stamp Animation
      setShowStamp(true);
      setTimeout(() => {
        setShowStamp(false);
        // Trigger Achievement after stamp fades
        triggerAchievement();
      }, 2500); 

    } catch (error) {
      console.error("Report Generation Failed", error);
      alert("Failed to generate report.");
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const playSuccessSound = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();

      const oscillators = [
        { freq: 523.25, type: 'sine', delay: 0 }, // C5
        { freq: 659.25, type: 'sine', delay: 0.1 }, // E5
        { freq: 783.99, type: 'sine', delay: 0.2 }, // G5
        { freq: 1046.50, type: 'sine', delay: 0.3 } // C6
      ];

      oscillators.forEach(({ freq, type, delay }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = type as OscillatorType;
        osc.frequency.value = freq;
        
        gain.gain.setValueAtTime(0, ctx.currentTime + delay);
        gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + delay + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.8);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + 1);
      });
    } catch (e) {
      console.error("Audio playback failed", e);
    }
  };

  const triggerAchievement = () => {
    playSuccessSound();

    // Use specific canvas
    const canvas = document.getElementById('confetti-canvas') as HTMLCanvasElement;
    if (!canvas) return;

    // Create a function scoped to this canvas
    const myConfetti = confetti.create(canvas, { resize: true });

    const count = 200;
    const defaults = { origin: { y: 0.7 } };

    function fire(particleRatio: number, opts: any) {
      myConfetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio)
      });
    }

    fire(0.25, { spread: 26, startVelocity: 55, colors: ['#F59E0B', '#FCD34D'] });
    fire(0.2, { spread: 60, colors: ['#10B981', '#34D399'] });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8, colors: ['#8B5CF6', '#A78BFA'] });
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
    fire(0.1, { spread: 120, startVelocity: 45 });

    setShowAchievement(true);
    // Auto-hide after 8 seconds
    setTimeout(() => setShowAchievement(false), 8000);
  };

  if (status === AnalysisStatus.IDLE) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8">
        <div className="w-20 h-20 bg-slate-800/30 rounded-full flex items-center justify-center mb-6 shadow-xl border border-white/5 backdrop-blur-sm">
          <Bot className="h-10 w-10 text-slate-600" />
        </div>
        <h3 className="text-lg font-bold text-slate-300 mb-2 font-mono uppercase tracking-wide">Mascot is Dormant</h3>
        <p className="max-w-[260px] text-xs text-slate-500 leading-relaxed font-mono">
          System Standby. Upload data to initiate.
        </p>
      </div>
    );
  }

  if (status === AnalysisStatus.ANALYZING) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-violet-500 blur-2xl opacity-20 animate-pulse rounded-full"></div>
          <div className="bg-slate-900 rounded-full p-4 border border-violet-500/30 relative z-10 shadow-[0_0_30px_rgba(139,92,246,0.3)]">
            <Loader2 className="h-10 w-10 text-violet-400 animate-spin" />
          </div>
        </div>
        <h3 className="text-lg font-bold text-violet-200 animate-pulse font-mono tracking-wide">PROCESSING DATA...</h3>
        <div className="flex flex-col gap-2 mt-4 w-full max-w-[200px]">
          <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-violet-500/50 animate-[shimmer_2s_infinite] w-1/2 rounded-full"></div>
          </div>
          <p className="text-[10px] text-center text-slate-500 font-mono uppercase">Reasoning engine active</p>
        </div>
      </div>
    );
  }

  if (status === AnalysisStatus.ERROR) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8">
        <div className="bg-red-500/10 p-4 rounded-full mb-4 border border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
          <AlertTriangle className="h-8 w-8 text-red-400" />
        </div>
        <h3 className="text-lg font-bold text-red-400 font-mono uppercase">Analysis Failed</h3>
        <p className="text-sm text-red-300/70 mt-2 text-center max-w-[250px]">
           Something went wrong. Please check your image format and try again.
        </p>
      </div>
    );
  }

  const components = {
    code(props: any) {
      const { className, children, ...rest } = props;
      const match = /language-(\w+)/.exec(className || '');
      const isCorrectedProtocol = match && match[1] === 'corrected_protocol';

      if (isCorrectedProtocol) {
        return (
          <div className="my-4 rounded-xl overflow-hidden border border-green-500/30 bg-slate-900/50 shadow-lg">
            <div className="bg-green-900/20 px-4 py-2 flex items-center justify-between border-b border-green-500/20">
              <span className="text-xs font-bold text-green-400 uppercase tracking-wider flex items-center gap-2 font-mono">
                <Sparkles className="h-3 w-3" /> Proposed Fix
              </span>
              {onApplyFix && (
                <button
                  onClick={() => onApplyFix(String(children).replace(/\n$/, ''))}
                  className="group flex items-center space-x-1.5 bg-green-600 hover:bg-green-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-lg shadow-green-900/20 transition-all hover:scale-105 font-mono"
                >
                  <span>APPLY FIX</span>
                  <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                </button>
              )}
            </div>
            <div className="p-4 overflow-x-auto custom-scrollbar bg-black/20">
               <pre className="text-xs font-mono text-green-100/90 whitespace-pre-wrap leading-relaxed">{children}</pre>
            </div>
          </div>
        );
      }
      return <code className={`${className} bg-slate-800 rounded px-1.5 py-0.5 text-xs font-mono text-indigo-300 border border-slate-700`} {...rest}>{children}</code>;
    },
    h1: ({node, ...props}) => <h1 className="text-lg font-bold text-white mb-3 mt-5 border-b border-white/10 pb-2 font-mono uppercase" {...props} />,
    h2: ({node, ...props}) => <h2 className="text-base font-bold text-green-400 mb-2 mt-4 flex items-center gap-2 font-mono uppercase" {...props} />,
    h3: ({node, ...props}) => <h3 className="text-sm font-bold text-slate-200 mb-1 mt-3" {...props} />,
    p: ({node, ...props}) => <p className="text-sm text-slate-300 leading-relaxed mb-3" {...props} />,
    ul: ({node, ...props}) => <ul className="list-disc list-outside ml-4 space-y-1 mb-4 text-sm text-slate-300 marker:text-green-500" {...props} />,
    li: ({node, ...props}) => <li className="pl-1" {...props} />,
    strong: ({node, ...props}) => <strong className="text-green-200 font-semibold" {...props} />,
  };

  return (
    <div className="flex flex-col h-full bg-transparent relative">
      
      {/* Bio-Glass Stamp Animation Overlay (Electric Violet) */}
      {showStamp && (
        <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
           <div className="relative">
              {/* The Mascot Stamping */}
              <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 animate-[bounce_0.5s_ease-out_reverse]">
                  <div className="w-16 h-16 bg-violet-600 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(139,92,246,0.8)] border border-violet-400/50">
                    <Bot className="h-10 w-10 text-white" />
                  </div>
              </div>

              {/* The Seal */}
              <div className="bg-violet-500/20 text-violet-300 border-4 border-violet-500 p-6 rounded-xl transform -rotate-12 animate-[bounce_0.5s_ease-out] shadow-[0_0_50px_rgba(139,92,246,0.4)] backdrop-blur-md relative z-10 mt-8">
                  <div className="text-3xl font-black font-mono tracking-widest border-b-2 border-violet-500 mb-2 text-violet-200">VERIFIED</div>
                  <div className="flex items-center justify-center space-x-2 text-sm font-bold uppercase text-violet-300">
                    <CheckCircle2 className="h-5 w-5" />
                    <span>Safety Checked</span>
                  </div>
              </div>
           </div>
        </div>
      )}

      {/* Enhanced Achievement Unlocked Modal */}
      {showAchievement && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 animate-in zoom-in-75 duration-500 w-full max-w-sm pointer-events-none">
           <div className="relative group">
              {/* Glow Effects */}
              <div className="absolute -inset-1 bg-gradient-to-r from-amber-400 via-orange-500 to-yellow-500 rounded-3xl blur-xl opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
              
              <div className="relative bg-slate-900/90 ring-1 ring-white/10 rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center backdrop-blur-3xl border border-white/5 overflow-hidden">
                
                {/* Background Shimmer */}
                <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/10 via-transparent to-violet-500/10 pointer-events-none"></div>

                {/* Holographic Badge */}
                <div className="relative mb-5">
                   <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-yellow-300 rounded-full blur-xl opacity-40 animate-pulse"></div>
                   <div className="relative w-28 h-28 bg-gradient-to-b from-white/10 to-white/5 rounded-full flex items-center justify-center border border-white/20 backdrop-blur-md shadow-[0_0_30px_rgba(245,158,11,0.5)]">
                      <Award className="h-14 w-14 text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.8)]" />
                      {/* Spinning Ring */}
                      <div className="absolute inset-0 border-t-2 border-amber-300/50 rounded-full animate-spin"></div>
                   </div>
                </div>
                
                <h4 className="text-amber-400 text-xs font-bold uppercase tracking-[0.2em] font-mono mb-2">Achievement Unlocked</h4>
                <div className="text-white font-black text-3xl mb-1 tracking-tight drop-shadow-lg">The Golden Pipette</div>
                <p className="text-amber-200/80 text-sm mb-6 font-medium">You saved $50 in reagents today!</p>
                
                {/* XP Bar Animation */}
                <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden relative mb-2 shadow-inner border border-white/5">
                   {/* Using keyframe animation fillBar defined in index.html */}
                   <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-400 to-emerald-500 animate-[fillBar_1.5s_ease-out_forwards] shadow-[0_0_10px_rgba(52,211,153,0.5)]" style={{width: '85%'}}></div>
                </div>
                <div className="flex justify-between w-full text-[10px] font-mono text-slate-400 uppercase font-bold px-1">
                   <span>Science XP</span>
                   <span className="text-green-400 flex items-center gap-1"><Zap className="h-3 w-3 fill-current" /> +500 XP</span>
                </div>

             </div>
           </div>
        </div>
      )}

      {/* Messages Area - Styled as a Holographic Chat Bubble */}
      <div className="flex-grow p-4 sm:p-6 overflow-y-auto space-y-6 custom-scrollbar">
        
        {/* Mascot's Message Bubble */}
        <div className="flex gap-4 group">
          <div className="flex-shrink-0 mt-1">
             <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-700 flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.3)] ring-1 ring-white/10">
                <Bot className="h-6 w-6 text-white" />
             </div>
          </div>
          
          <div className="flex-1 min-w-0">
             <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-xs font-bold text-violet-400 uppercase tracking-widest font-mono">Petri // Culture</span>
                <span className="text-[10px] text-slate-500 font-mono">{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
             </div>
             
             <div className="glass-panel p-5 rounded-2xl rounded-tl-none relative overflow-hidden border-violet-500/20 shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
                {/* Decoration */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-violet-500/10 to-transparent rounded-bl-full pointer-events-none"></div>
                
                {/* Content */}
                <div className="prose prose-sm prose-invert max-w-none relative z-10">
                  <ReactMarkdown components={components as any}>{result || ''}</ReactMarkdown>
                </div>

                {/* Audio Controls */}
                <div className="mt-4 pt-3 border-t border-white/5 flex justify-end">
                   <button
                    onClick={handleSpeak}
                    className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${isSpeaking ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25' : 'bg-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-700'}`}
                  >
                    {isSpeaking ? (
                      <>
                        <StopCircle className="h-3 w-3 animate-pulse" />
                        <span>Stop Audio</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="h-3 w-3" />
                        <span>Read Aloud</span>
                      </>
                    )}
                  </button>
                </div>
             </div>
          </div>
        </div>

      </div>

      {/* Footer / Feedback / Actions */}
      <div className="p-4 bg-slate-900/80 backdrop-blur-xl border-t border-white/5 flex flex-col gap-3">
        
        {/* Undo Action */}
        {canUndo && onUndo && (
          <button
            onClick={onUndo}
            className="w-full flex items-center justify-center space-x-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 py-2.5 rounded-lg border border-amber-500/20 hover:border-amber-500/40 transition-all text-xs font-bold font-mono uppercase tracking-wide group shadow-lg shadow-amber-900/10"
          >
            <RotateCcw className="h-3.5 w-3.5 group-hover:-rotate-90 transition-transform" />
            <span>Undo Last Fix</span>
          </button>
        )}

        {status === AnalysisStatus.COMPLETED && (
          <div className="space-y-3">
            {/* Generate Report Button */}
            <button
              onClick={handleGenerateReport}
              disabled={isGeneratingReport}
              className="w-full flex items-center justify-center space-x-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 py-2.5 rounded-lg border border-indigo-500/30 hover:border-indigo-500/50 transition-all text-xs font-bold font-mono uppercase tracking-wide group shadow-lg shadow-indigo-900/10"
            >
              {isGeneratingReport ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Printing...</span>
                </>
              ) : (
                <>
                  <Download className="h-3.5 w-3.5" />
                  <span>Download Verified Report</span>
                </>
              )}
            </button>

            {/* Feedback */}
            <div className="bg-slate-800/30 rounded-xl p-1 border border-white/5 flex flex-col">
              {!feedback ? (
                <div className="flex items-center justify-between px-3 py-2">
                  <span className="text-xs text-slate-400 font-mono">Rate diagnosis:</span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setFeedback('helpful')} className="p-2 hover:bg-green-500/10 rounded-lg text-slate-400 hover:text-green-400 transition-all hover:scale-110">
                      <ThumbsUp className="h-4 w-4" />
                    </button>
                    <div className="w-px h-4 bg-slate-700"></div>
                    <button onClick={() => setFeedback('not_helpful')} className="p-2 hover:bg-red-500/10 rounded-lg text-slate-400 hover:text-red-400 transition-all hover:scale-110">
                      <ThumbsDown className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : !submitted ? (
                <div className="flex p-1 animate-in slide-in-from-bottom-2">
                  <input
                    type="text"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Any details?"
                    className="flex-grow bg-slate-950/50 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-green-500 transition-colors"
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmitFeedback()}
                    autoFocus
                  />
                  <button
                    onClick={handleSubmitFeedback}
                    className="ml-2 bg-green-600 hover:bg-green-500 text-white px-3 rounded-lg transition-colors flex items-center justify-center"
                  >
                    <Send className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center py-2 text-xs font-medium text-green-400 font-mono">
                  <CheckCircle2 className="h-3 w-3 mr-1.5" /> Feedback recorded
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalysisView;