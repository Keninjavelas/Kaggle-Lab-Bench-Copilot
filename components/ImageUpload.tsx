import React, { useRef } from 'react';
import { Upload, X, ScanEye } from 'lucide-react';

interface ImageUploadProps {
  previewUrl: string | null;
  onFileSelect: (file: File) => void;
  onClear: () => void;
  disabled: boolean;
  isAnalyzing?: boolean;
  isGloveMode?: boolean;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ previewUrl, onFileSelect, onClear, disabled, isAnalyzing, isGloveMode }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleContainerClick = () => {
    if (!disabled && !previewUrl) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div 
      className={`
        glass-panel flex flex-col h-full rounded-2xl overflow-hidden min-h-[350px] transition-all duration-300 hover:border-white/20 relative group
        ${isAnalyzing ? 'ring-2 ring-violet-500/50 shadow-[0_0_30px_rgba(139,92,246,0.2)]' : ''}
      `}
    >
      
      {/* Header */}
      <div className={`border-b border-white/5 flex justify-between items-center bg-white/5 relative z-10 ${isGloveMode ? 'p-4' : 'px-4 py-3'}`}>
        <div className="flex items-center space-x-2">
          <div className={`p-1.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 ${isAnalyzing ? 'animate-pulse' : ''}`}>
             <ScanEye className="h-4 w-4" />
          </div>
          <h2 className="text-sm font-bold text-slate-200 tracking-wide font-mono uppercase">Result Viewer</h2>
        </div>
        {previewUrl && !disabled && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
            className={`
              text-xs text-red-400 hover:text-white hover:bg-red-500/80 font-medium flex items-center space-x-1 rounded-lg transition-all border border-transparent hover:border-red-400/50
              ${isGloveMode ? 'px-6 py-3' : 'px-2.5 py-1.5'}
            `}
          >
            <X className="h-3 w-3" />
            <span>Eject</span>
          </button>
        )}
      </div>

      <div 
        className={`flex-grow relative ${!previewUrl && !disabled ? 'cursor-pointer' : ''}`}
        onClick={handleContainerClick}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
          disabled={disabled}
        />

        {previewUrl ? (
          <div className="absolute inset-0 bg-slate-950 flex items-center justify-center p-4 overflow-hidden">
             {/* UV Glow Effect Background */}
             <div className="absolute inset-0 bg-indigo-600/10 animate-pulse"></div>
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent"></div>
             
             {/* The Image */}
            <img 
              src={previewUrl} 
              alt="Experiment Result" 
              className={`
                relative max-w-full max-h-full object-contain rounded-lg shadow-[0_0_50px_rgba(99,102,241,0.25)] border border-indigo-500/30 z-10 transition-all duration-1000
                ${isAnalyzing ? 'scale-105 brightness-110 drop-shadow-[0_0_15px_rgba(139,92,246,0.6)]' : ''}
              `}
            />
            
            {/* Overlay grid for "Analysis" feel */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>
            
            {/* Scanner Line Animation */}
            {isAnalyzing && (
              <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-violet-400 shadow-[0_0_15px_rgba(139,92,246,1)] animate-[scan_2s_linear_infinite]"></div>
              </div>
            )}

          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center m-4 rounded-xl border-2 border-dashed border-slate-700/50 group-hover:border-indigo-500/30 group-hover:bg-indigo-500/5 transition-all duration-300">
            <div className="bg-slate-800 p-5 rounded-2xl mb-4 shadow-lg group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 border border-white/5">
              <Upload className="h-8 w-8 text-slate-500 group-hover:text-white transition-colors" />
            </div>
            <p className="text-base font-bold text-slate-300 mb-1 group-hover:text-indigo-200 font-mono">DROP RESULT IMAGE</p>
            <p className="text-xs text-slate-500 max-w-[200px] leading-relaxed">
              Upload gel electrophoresis, plate, or microscopy (JPG/PNG)
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUpload;