import React, { useState, useEffect } from 'react';
import { ActiveTab } from './types';
import { Navbar } from './components/Navbar';
import { LiveTv } from './components/LiveTv';
import { AppLauncher } from './components/AppLauncher';
import { FullscreenModal } from './components/FullscreenModal';
import { WifiOff } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('tv');
  const [isFullscreenModalOpen, setIsFullscreenModalOpen] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-black text-white font-sans">
      
      {!isOnline && (
        <div className="bg-amber-600/90 text-white text-xs px-4 py-2 flex items-center justify-center gap-2 font-medium">
          <WifiOff className="w-4 h-4" />
          <span>Araç internet bağlantısı kesildi. Çevrimdışı önbellek modu devrede.</span>
        </div>
      )}

      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenFullscreenModal={() => setIsFullscreenModalOpen(true)}
      />

      <main className="flex-1 overflow-hidden relative flex flex-col">
        {activeTab === 'tv' && <LiveTv />}
        {activeTab === 'apps' && <AppLauncher initialCategory="all" />}
        {activeTab === 'games' && <AppLauncher initialCategory="games" />}
      </main>

      <FullscreenModal
        isOpen={isFullscreenModalOpen}
        onClose={() => setIsFullscreenModalOpen(false)}
      />

    </div>
  );
};

export default App;
