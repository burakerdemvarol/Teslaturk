import React, { useState, useEffect } from 'react';
import { ActiveTab } from '../types';
import { 
  Tv, 
  LayoutGrid, 
  Gamepad2, 
  Maximize, 
  Clock, 
  RotateCcw,
  Satellite
} from 'lucide-react';

interface NavbarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onOpenFullscreenModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  onOpenFullscreenModal,
}) => {
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString('tr-TR', {
          hour: '2-digit',
          minute: '2-digit',
        })
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 bg-black border-b border-neutral-800 px-4 sm:px-6 flex items-center justify-between select-none">
      
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => onTabChange('tv')}>
          <div className="w-9 h-9 rounded-xl bg-tesla-red flex items-center justify-center text-white shadow-lg shadow-red-900/30">
            <Tv className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-base sm:text-lg tracking-wider text-white">TESLA<span className="text-tesla-red">PLAY</span></span>
              <span className="hidden sm:inline-block px-1.5 py-0.2 rounded text-[10px] font-bold bg-neutral-800 text-neutral-300 border border-neutral-700">
                PRO
              </span>
            </div>
            <p className="text-[10px] text-neutral-400 font-medium leading-none hidden sm:block">
              Türksat Canlı TV & Multimedya
            </p>
          </div>
        </div>
      </div>

      <nav className="flex items-center gap-1 bg-neutral-900/90 p-1 rounded-2xl border border-neutral-800">
        <button
          onClick={() => onTabChange('tv')}
          className={`px-4 sm:px-5 py-2 min-h-[44px] rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all touch-active ${
            activeTab === 'tv'
              ? 'bg-tesla-red text-white shadow-md'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Satellite className="w-4 h-4" />
          <span>Canlı TV</span>
        </button>

        <button
          onClick={() => onTabChange('apps')}
          className={`px-4 sm:px-5 py-2 min-h-[44px] rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all touch-active ${
            activeTab === 'apps'
              ? 'bg-tesla-red text-white shadow-md'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <LayoutGrid className="w-4 h-4" />
          <span>Uygulamalar</span>
        </button>

        <button
          onClick={() => onTabChange('games')}
          className={`px-4 sm:px-5 py-2 min-h-[44px] rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all touch-active ${
            activeTab === 'games'
              ? 'bg-tesla-red text-white shadow-md'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Gamepad2 className="w-4 h-4" />
          <span className="hidden sm:inline">Retro</span> Oyunlar
        </button>
      </nav>

      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300">
          <Clock className="w-4 h-4 text-tesla-red" />
          <span className="text-xs font-mono font-bold">{time}</span>
        </div>

        <button
          onClick={onOpenFullscreenModal}
          className="h-11 px-3 sm:px-4 bg-neutral-900 hover:bg-neutral-800 text-white border border-neutral-700 hover:border-tesla-red rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 touch-active transition-all shadow-md group"
          title="Tesla Sinema (Tam Ekran) Modunu Aç"
        >
          <Maximize className="w-4 h-4 text-tesla-red group-hover:scale-110 transition-transform" />
          <span className="hidden sm:inline">Sinema Modu</span>
        </button>

        <button
          onClick={() => window.location.reload()}
          className="w-11 h-11 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 flex items-center justify-center touch-active transition-colors"
          title="Sayfayı Yenile"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

    </header>
  );
};
