import React, { useState, useCallback, useEffect } from 'react';
import Header from './components/Header';
import ProtocolInput from './components/ProtocolInput';
import ImageUpload from './components/ImageUpload';
import AnalysisView from './components/AnalysisView';
import SmartTools from './components/SmartTools';
import { AnalysisStatus, LabTimer, LogEntry } from './types';
import { analyzeExperiment, fileToBase64, extractTimers, parsePdfToProtocol } from './services/geminiService';
import { Sparkles, Play, Sprout, X } from 'lucide-react';

const DEMO_PROTOCOL = `Experiment: PCR Amplification of Gene X
1. Thaw reagents on ice.
2. Mix 50µl reaction:
   - 10µl 5x Buffer
   - 2µl dNTPs
   - 5µl Primer A & B
   - 1µl Taq Polymerase
   - 30µl Template DNA (extracted yesterday, left on bench overnight)
   - 2µl Water
3. Cycle: 95°C (30s) -> 55°C (30s) -> 72°C (60s) for 35 cycles.
4. Run on 1% agarose gel at 100V.`;

// A small base64 gradient to simulate a smeary gel image for the demo
const DEMO_IMAGE_BASE64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="; // Placeholder 1x1 pixel

const App: React.FC = () => {
  const [protocol, setProtocol] = useState<string>('');
  const [protocolHistory, setProtocolHistory] = useState<string[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [status, setStatus] = useState<AnalysisStatus>(AnalysisStatus.IDLE);
  const [result, setResult] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isParsingPdf, setIsParsingPdf] = useState(false);
  const [isGloveMode, setIsGloveMode] = useState(false);
  const [baseFilename, setBaseFilename] = useState<string>("Experiment_Protocol");
  const [imageError, setImageError] = useState(false);
  
  // Smart Tools State
  const [timers, setTimers] = useState<LabTimer[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  // Canvas Resize Logic
  useEffect(() => {
    const canvas = document.getElementById('confetti-canvas') as HTMLCanvasElement;
    if (canvas) {
      const resize = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      };
      
      // Resize initially and on window resize
      resize();
      window.addEventListener('resize', resize);
      
      return () => window.removeEventListener('resize', resize);
    }
  }, []);

  // Auto-extract timers when protocol changes (debounced or on blur ideal, here doing on effect with check)
  useEffect(() => {
    const fetchTimers = async () => {
      if (protocol.length > 50) {
        const extracted = await extractTimers(protocol);
        const newTimers: LabTimer[] = extracted.map((t: any, i: number) => ({
          id: `timer-${i}`,
          label: t.label,
          durationSeconds: t.durationSeconds,
          remainingSeconds: t.durationSeconds,
          isRunning: false,
          isCompleted: false
        }));
        setTimers(newTimers);
      }
    };
    
    const timeoutId = setTimeout(fetchTimers, 2000); // Debounce 2s
    return () => clearTimeout(timeoutId);
  }, [protocol]);

  useEffect(() => {
    if (status === AnalysisStatus.COMPLETED) {
      setIsSidebarOpen(true);
    }
  }, [status]);

  const handleFileSelect = (file: File) => {
    setImageFile(file);
    const objectUrl = URL.createObjectURL(file);
    setImagePreview(objectUrl);
  };

  const handleClearImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
  };

  const handlePdfDrop = async (file: File) => {
    setIsParsingPdf(true);
    setBaseFilename(file.name);
    try {
      const base64 = await fileToBase64(file);
      const extractedProtocol = await parsePdfToProtocol(base64);
      setProtocol(extractedProtocol);
      // Tools are now visible, no need to switch tabs
    } catch (error) {
      console.error("PDF Error", error);
      alert("Failed to parse PDF.");
    } finally {
      setIsParsingPdf(false);
    }
  };

  const handleLoadDemo = async () => {
    // Set Protocol
    setProtocol(DEMO_PROTOCOL);
    
    // Set Demo Image (Convert base64 data URI to File object for consistency)
    try {
      const res = await fetch(DEMO_IMAGE_BASE64);
      const blob = await res.blob();
      const file = new File([blob], "demo_gel_smear.png", { type: "image/png" });
      setImageFile(file);
      setImagePreview(DEMO_IMAGE_BASE64);
    } catch (e) {
      console.error("Demo Load Error", e);
    }
  };

  const handleAnalyze = useCallback(async () => {
    if (!imageFile || !protocol.trim()) return;

    setStatus(AnalysisStatus.ANALYZING);
    setResult(null);
    setIsSidebarOpen(true);

    try {
      const base64Image = await fileToBase64(imageFile);
      const analysisText = await analyzeExperiment(protocol, base64Image, imageFile.type);
      setResult(analysisText);
      setStatus(AnalysisStatus.COMPLETED);
    } catch (error) {
      console.error(error);
      setStatus(AnalysisStatus.ERROR);
    }
  }, [imageFile, protocol]);

  const handleApplyFix = (newProtocol: string) => {
    setProtocolHistory(prev => [...prev, protocol]);
    setProtocol(newProtocol);
  };

  const handleUndo = () => {
    if (protocolHistory.length === 0) return;
    const previous = protocolHistory[protocolHistory.length - 1];
    setProtocol(previous);
    setProtocolHistory(prev => prev.slice(0, -1));
  };

  const canAnalyze = !!imageFile && !!protocol.trim() && status !== AnalysisStatus.ANALYZING;

  return (
    <div 
      className="h-screen flex flex-col overflow-hidden text-slate-200 font-sans selection:bg-violet-500/30"
      style={isGloveMode ? { zoom: '1.25' } as any : {}}
    >
      {/* Confetti Canvas - Managed globally to sit on top via Z-Index 9998 */}
      <canvas id="confetti-canvas"></canvas>

      <Header isGloveMode={isGloveMode} setIsGloveMode={setIsGloveMode} />

      {/* Main Container */}
      <div className="flex flex-1 overflow-hidden pt-16 relative">
        
        {/* Workspace - Smart Push Layout */}
        <main 
          className={`
            flex-1 flex flex-col min-w-0 transition-all duration-500 ease-[cubic-bezier(0.25,0.8,0.25,1)] relative z-10
            ${isSidebarOpen ? 'xl:mr-[30vw] mr-[450px]' : 'mr-0'}
          `}
        >
          <div className="h-full overflow-y-auto custom-scrollbar p-4 sm:p-6 lg:p-8 pb-32">
            <div className="max-w-[1600px] mx-auto w-full">
              
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 min-h-[500px]">
                
                {/* LEFT COLUMN: Protocol Editor */}
                <div className="xl:col-span-7 flex flex-col h-full min-h-[500px]">
                   <ProtocolInput 
                    value={protocol} 
                    onChange={setProtocol} 
                    disabled={status === AnalysisStatus.ANALYZING} 
                    onPdfDrop={handlePdfDrop}
                    isParsingPdf={isParsingPdf}
                    isGloveMode={isGloveMode}
                    onLoadDemo={handleLoadDemo}
                  />
                </div>

                {/* RIGHT COLUMN: Command Center (Image + Tools) */}
                <div className="xl:col-span-5 flex flex-col gap-6">
                  
                  {/* Row 1: Image Viewer */}
                  <div className="h-[350px] flex-shrink-0">
                    <ImageUpload 
                      previewUrl={imagePreview} 
                      onFileSelect={handleFileSelect} 
                      onClear={handleClearImage}
                      disabled={status === AnalysisStatus.ANALYZING}
                      isAnalyzing={status === AnalysisStatus.ANALYZING}
                      isGloveMode={isGloveMode}
                    />
                  </div>

                  {/* Row 2: Smart Tools Dashboard */}
                  <div className="flex-1 min-h-[400px]">
                     <SmartTools 
                        timers={timers} 
                        setTimers={setTimers}
                        logs={logs}
                        setLogs={setLogs}
                        protocol={protocol}
                        isGloveMode={isGloveMode}
                        onPdfDrop={handlePdfDrop}
                        isParsingPdf={isParsingPdf}
                      />
                  </div>

                </div>

              </div>

            </div>
          </div>

          {/* Floating Control Deck */}
          <div className={`absolute bottom-8 left-1/2 transform -translate-x-1/2 w-full max-w-md px-4 z-20 pointer-events-none transition-all duration-500 ${isSidebarOpen ? 'xl:-translate-x-[calc(50%+15vw)]' : ''}`}>
             <div className="pointer-events-auto">
              <button
                onClick={handleAnalyze}
                disabled={!canAnalyze}
                className={`
                  w-full rounded-2xl font-bold text-lg shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl border flex items-center justify-center space-x-3 transition-all transform hover:-translate-y-1 active:scale-95 font-mono tracking-wide
                  ${canAnalyze 
                    ? 'bg-indigo-600/90 border-indigo-500/50 text-white hover:shadow-[0_0_30px_rgba(99,102,241,0.5)]' 
                    : 'bg-slate-900/80 text-slate-500 cursor-not-allowed border-white/10'}
                  ${isGloveMode ? 'py-6 text-xl' : 'py-4'}
                `}
              >
                {status === AnalysisStatus.ANALYZING ? (
                  <>
                    <span className="relative flex h-3 w-3 mr-1">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-violet-500"></span>
                    </span>
                    <span>DIAGNOSING...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className={`h-5 w-5 ${canAnalyze ? 'text-indigo-200' : 'text-slate-600'}`} />
                    <span>RUN DIAGNOSTICS</span>
                    {canAnalyze && <Play className="h-4 w-4 ml-1 opacity-60" />}
                  </>
                )}
              </button>
             </div>
          </div>
        </main>

        {/* Mascot Rail / Sidebar - Smart Slide-Out */}
        <aside 
          className={`
            fixed right-0 top-16 bottom-0 z-40
            bg-slate-900/60 backdrop-blur-xl border-l border-white/10 shadow-2xl
            transition-all duration-500 ease-[cubic-bezier(0.25,0.8,0.25,1)] flex flex-col
            ${isSidebarOpen ? 'xl:w-[30vw] w-[450px] translate-x-0 opacity-100' : 'xl:w-[30vw] w-[450px] translate-x-full opacity-0 pointer-events-none'}
          `}
        >
          {/* Sidebar Content */}
          <div className="h-full flex flex-col w-full">
            
            {/* Sidebar Header */}
            <div className={`border-b border-white/5 flex items-center justify-between bg-white/[0.02] ${isGloveMode ? 'h-20 px-4' : 'h-14 px-4'}`}>
              <div className="flex items-center space-x-2 text-indigo-300">
                  <div className="p-1.5 bg-indigo-500/10 rounded-lg">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <span className="font-bold font-mono tracking-wide uppercase text-sm">Diagnosis & Fix</span>
              </div>

              <button 
                onClick={() => setIsSidebarOpen(false)}
                className={`hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors ${isGloveMode ? 'p-3' : 'p-1.5'}`}
              >
                <X className={isGloveMode ? "h-6 w-6" : "h-4 w-4"} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto overflow-x-hidden relative">
                <AnalysisView 
                  status={status} 
                  result={result} 
                  protocol={protocol}
                  imagePreview={imagePreview}
                  onApplyFix={handleApplyFix}
                  onUndo={handleUndo}
                  canUndo={protocolHistory.length > 0}
                  baseFilename={baseFilename}
                />
            </div>
          </div>
        </aside>

        {/* Mascot FAB (Floating Action Button) - Toggles Diagnosis Sidebar */}
        <button
          id="mascot-container"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className={`
            h-14 w-14 rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.3)] border border-white/10
            flex items-center justify-center overflow-hidden
            transition-all duration-300 hover:scale-110 active:scale-95
            ${isSidebarOpen 
              ? 'bg-slate-800 text-slate-400 rotate-90 opacity-0 pointer-events-none scale-0' 
              : 'bg-gradient-to-br from-green-500 to-emerald-600 text-white opacity-100 scale-100'}
          `}
          aria-label="Toggle Petri"
        >
          {/* Glow Effect */}
          <div className="absolute inset-0 bg-green-400 blur-lg opacity-30 animate-pulse rounded-2xl"></div>
          
          {/* Mascot Image with Fallback */}
          {!imageError ? (
            <div className="relative z-10 p-2">
               {/* Using the standard Sprout icon effectively as a placeholder image representation, 
                   but structuring it to fail gracefully if we switched to a real <img> tag */}
               <Sprout className="h-7 w-7" />
               {/* 
                  Hidden logic: if we were loading an external image:
                  <img src="/mascot.png" onError={() => setImageError(true)} alt="Petri" />
               */}
            </div>
          ) : (
             <div className="relative z-10 text-2xl" role="img" aria-label="Mascot Fallback">
               🦠
             </div>
          )}
          
          {/* Notification Dot */}
          {status === AnalysisStatus.COMPLETED && !isSidebarOpen && (
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 border-2 border-slate-950 rounded-full animate-bounce z-20"></span>
          )}
        </button>

      </div>
    </div>
  );
};

export default App;