import React, { useState } from 'react';
import { FileText, Wand2, ClipboardList, FileUp, Loader2 } from 'lucide-react';

interface ProtocolInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  onPdfDrop: (file: File) => void;
  isParsingPdf?: boolean;
  isGloveMode?: boolean;
  onLoadDemo?: () => void;
}

const ProtocolInput: React.FC<ProtocolInputProps> = ({ value, onChange, disabled, onPdfDrop, isParsingPdf, isGloveMode, onLoadDemo }) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && !isParsingPdf) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (disabled || isParsingPdf) return;

    const file = e.dataTransfer.files?.[0];
    if (file && file.type === 'application/pdf') {
      onPdfDrop(file);
    }
  };

  return (
    <div 
      className="glass-panel flex flex-col h-full rounded-2xl overflow-hidden transition-all duration-300 hover:border-white/20 group relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Card Header */}
      <div className={`border-b border-white/5 flex justify-between items-center bg-white/5 ${isGloveMode ? 'p-4' : 'px-4 py-3'}`}>
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
             <ClipboardList className="h-4 w-4" />
          </div>
          <h2 className="text-sm font-bold text-slate-200 tracking-wide font-mono uppercase">Protocol Editor</h2>
        </div>
        {onLoadDemo && (
          <button
            onClick={onLoadDemo}
            disabled={disabled || isParsingPdf}
            className={`
              text-xs flex items-center space-x-1 text-emerald-300 hover:text-white font-bold bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_10px_rgba(16,185,129,0.1)] hover:shadow-[0_0_15px_rgba(16,185,129,0.3)]
              ${isGloveMode ? 'px-6 py-3' : 'px-3 py-1.5'}
            `}
          >
            <Wand2 className="h-3.5 w-3.5" />
            <span className="uppercase tracking-wider">See Example Failure</span>
          </button>
        )}
      </div>

      {/* Editor Area */}
      <div className="flex-grow relative flex">
        {/* Line Numbers Gutter */}
        <div className="w-10 bg-slate-950/30 border-r border-white/5 pt-4 flex flex-col items-center text-slate-600 text-xs font-mono select-none">
          <div>1</div>
          <div>2</div>
          <div>3</div>
          <div>4</div>
          <div>5</div>
          <div>6</div>
          <div>...</div>
        </div>

        {/* Text Area */}
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled || isParsingPdf}
          placeholder="// Paste protocol or Drop PDF here..."
          className="flex-1 w-full h-full resize-none bg-transparent p-4 text-sm font-mono text-slate-300 leading-relaxed outline-none placeholder:text-slate-600 focus:bg-white/[0.02] transition-colors"
          spellCheck={false}
          style={{ fontFamily: '"JetBrains Mono", monospace' }}
        />
        
        {/* Status Indicator */}
        <div className="absolute bottom-2 right-2 text-[10px] text-slate-500 font-mono px-2 py-1 bg-slate-950/80 rounded border border-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          {value.length} chars
        </div>
      </div>

      {/* PDF Drop Overlay with Scanner Animation */}
      {(isDragOver || isParsingPdf) && (
        <div className="absolute inset-0 z-20 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center border-2 border-indigo-500/50 border-dashed m-2 rounded-xl transition-all overflow-hidden">
          
          {/* Scanner Light Bar Animation */}
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
             <div className="h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent w-full absolute shadow-[0_0_20px_rgba(99,102,241,0.8)] animate-[scan_2s_linear_infinite]"></div>
          </div>

          {isParsingPdf ? (
            <>
              <div className="relative z-10 bg-slate-900/80 p-6 rounded-2xl border border-indigo-500/30 text-center">
                 <Loader2 className="h-10 w-10 text-indigo-400 animate-spin mx-auto mb-3" />
                 <h3 className="text-lg font-bold text-white mb-1 font-mono tracking-tight">Paper-to-Pipeline</h3>
                 <p className="text-xs text-indigo-300 font-mono uppercase">Extracting Methods...</p>
              </div>
            </>
          ) : (
            <>
              <FileUp className="h-12 w-12 text-indigo-400 mb-4 animate-bounce relative z-10" />
              <h3 className="text-lg font-bold text-white mb-1 font-mono relative z-10">Drop PDF Paper Here</h3>
              <p className="text-sm text-slate-400 text-center max-w-[200px] relative z-10">
                AI will extract the protocol & reagents.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ProtocolInput;