import React from 'react';
import { Sprout, Hand } from 'lucide-react';

interface HeaderProps {
  isGloveMode: boolean;
  setIsGloveMode: (value: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({ isGloveMode, setIsGloveMode }) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-slate-900/70 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand */}
        <div className="flex items-center space-x-3 group cursor-pointer">
          <div className="relative">
            <div className="absolute inset-0 bg-green-500 blur-lg opacity-20 group-hover:opacity-40 transition-opacity"></div>
            <div className="relative bg-gradient-to-br from-green-500 to-emerald-700 p-2 rounded-lg shadow-lg border border-white/10">
              <Sprout className="h-6 w-6 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100 tracking-tight group-hover:text-green-400 transition-colors font-mono">Lab Bench Co-Pilot</h1>
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">v2.5 // Bio-Glass HUD</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-4">
          
          {/* Glove Mode Toggle */}
          <button 
            onClick={() => setIsGloveMode(!isGloveMode)}
            className={`
              flex items-center space-x-2 px-3 py-1.5 rounded-full border transition-all duration-300
              ${isGloveMode 
                ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.3)]' 
                : 'bg-slate-800/50 border-white/5 text-slate-500 hover:text-slate-300'}
            `}
          >
            <Hand className={`h-4 w-4 ${isGloveMode ? 'fill-indigo-500/50' : ''}`} />
            <span className="text-xs font-bold uppercase tracking-wide">Glove Mode</span>
            <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${isGloveMode ? 'bg-indigo-500' : 'bg-slate-700'}`}>
               <div className={`h-3 w-3 rounded-full bg-white shadow-sm transition-transform ${isGloveMode ? 'translate-x-4' : 'translate-x-0'}`}></div>
            </div>
          </button>

          {/* System Status */}
          <div className="hidden md:flex items-center space-x-2 text-xs font-medium bg-slate-950/50 px-3 py-1.5 rounded-full border border-slate-800 backdrop-blur-sm">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
            <span className="text-slate-300 font-mono">ONLINE</span>
          </div>

        </div>
      </div>
    </header>
  );
};

export default Header;