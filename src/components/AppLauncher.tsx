import React, { useState, useEffect } from 'react';
import { AppItem, AppCategory } from '../types';
import { DEFAULT_APPS } from '../data/defaultApps';
import { AddAppModal } from './AddAppModal';
import { 
  Play, 
  ExternalLink, 
  Plus, 
  Gamepad2, 
  Tv, 
  Compass, 
  Bookmark, 
  Trash2, 
  X,
  Search
} from 'lucide-react';

interface AppLauncherProps {
  initialCategory?: AppCategory;
}

export const AppLauncher: React.FC<AppLauncherProps> = ({ initialCategory = 'all' }) => {
  const [apps, setApps] = useState<AppItem[]>(() => {
    try {
      const saved = localStorage.getItem('teslaplay_custom_apps');
      const customApps: AppItem[] = saved ? JSON.parse(saved) : [];
      return [...DEFAULT_APPS, ...customApps];
    } catch {
      return DEFAULT_APPS;
    }
  });

  const [activeCategory, setActiveCategory] = useState<AppCategory>(initialCategory);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [embeddedApp, setEmbeddedApp] = useState<AppItem | null>(null);

  useEffect(() => {
    if (initialCategory) {
      setActiveCategory(initialCategory);
    }
  }, [initialCategory]);

  const saveCustomApps = (allApps: AppItem[]) => {
    try {
      const customs = allApps.filter(a => a.isCustom);
      localStorage.setItem('teslaplay_custom_apps', JSON.stringify(customs));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddApp = (newApp: AppItem) => {
    const updated = [...apps, newApp];
    setApps(updated);
    saveCustomApps(updated);
  };

  const handleDeleteCustomApp = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = apps.filter(a => a.id !== id);
    setApps(updated);
    saveCustomApps(updated);
  };

  const handleLaunchApp = (app: AppItem) => {
    if (app.isEmbeddable) {
      setEmbeddedApp(app);
    } else {
      window.open(app.url, '_blank', 'noopener,noreferrer');
    }
  };

  const filteredApps = apps.filter(app => {
    if (activeCategory !== 'all' && app.category !== activeCategory) {
      return false;
    }
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      return (
        app.name.toLowerCase().includes(q) ||
        (app.description && app.description.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-black overflow-y-auto p-4 sm:p-6 max-w-7xl mx-auto w-full select-none">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
            {activeCategory === 'games' ? (
              <>
                <Gamepad2 className="w-7 h-7 text-tesla-red" />
                Retro & Dokunmatik Web Oyunları
              </>
            ) : (
              <>
                <Compass className="w-7 h-7 text-tesla-red" />
                Medya & Uygulama Merkezi
              </>
            )}
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            {activeCategory === 'games'
              ? 'Şarj olurken veya beklerken araç ekranında oynanabilir HTML5 retro oyunlar.'
              : 'Tesla dokunmatik ekranı için optimize edilmiş web servisleri, araçlar ve canlı radarlar.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Uygulama ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 pl-10 pr-4 bg-neutral-900 border border-neutral-700 focus:border-tesla-red text-white text-sm rounded-xl outline-none"
            />
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="h-11 px-4 bg-tesla-red hover:bg-red-700 text-white text-sm font-semibold rounded-xl flex items-center gap-2 touch-active shadow-lg transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Özel Ekle</span>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 no-scrollbar">
        {[
          { id: 'all', label: 'Tüm Servisler', icon: Compass },
          { id: 'streaming', label: 'Medya & Video', icon: Tv },
          { id: 'utilities', label: 'Araçlar & Radar', icon: Bookmark },
          { id: 'games', label: 'Retro Oyunlar', icon: Gamepad2 },
          { id: 'custom', label: 'Özel Bağlantılar', icon: Plus },
        ].map(cat => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id as AppCategory)}
              className={`px-4 py-2.5 min-h-[48px] rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all touch-active whitespace-nowrap border ${
                isActive
                  ? 'bg-tesla-red border-red-600 text-white shadow-lg'
                  : 'bg-neutral-900 hover:bg-neutral-800 border-neutral-800 text-neutral-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4 flex-1">
        {filteredApps.map(app => {
          return (
            <div
              key={app.id}
              onClick={() => handleLaunchApp(app)}
              className={`group relative p-4 rounded-2xl bg-neutral-900/80 hover:bg-neutral-800/90 border border-neutral-800 hover:border-neutral-600 transition-all cursor-pointer flex flex-col justify-between min-h-[140px] touch-active shadow-md hover:shadow-xl overflow-hidden`}
            >
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-xl bg-neutral-950 p-2 flex items-center justify-center border border-neutral-800/80 group-hover:scale-105 transition-transform">
                  <img
                    src={app.icon}
                    alt={app.name}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>

                {app.isCustom ? (
                  <button
                    onClick={(e) => handleDeleteCustomApp(app.id, e)}
                    className="p-1.5 rounded-lg text-neutral-500 hover:text-red-400 hover:bg-neutral-800/60 transition-colors"
                    title="Sil"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                ) : (
                  <div className="p-1.5 rounded-lg text-neutral-500 group-hover:text-neutral-300">
                    <ExternalLink className="w-4 h-4" />
                  </div>
                )}
              </div>

              <div className="mt-3">
                <h4 className="text-sm sm:text-base font-bold text-white group-hover:text-tesla-red transition-colors line-clamp-1">
                  {app.name}
                </h4>
                <p className="text-[11px] text-neutral-400 line-clamp-1 mt-0.5">
                  {app.description || app.url}
                </p>
              </div>

              <div className="absolute bottom-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-tesla-red to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          );
        })}
      </div>

      {embeddedApp && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black">
          <div className="h-14 px-4 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={embeddedApp.icon} alt="" className="w-6 h-6 object-contain" />
              <span className="font-bold text-sm text-white">{embeddedApp.name}</span>
              <span className="text-xs text-neutral-400 hidden sm:inline">Gömülü Dokunmatik Mod</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => window.open(embeddedApp.url, '_blank')}
                className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold flex items-center gap-1.5"
                title="Yeni Sekmede Aç"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Harici Aç</span>
              </button>
              <button
                onClick={() => setEmbeddedApp(null)}
                className="w-10 h-10 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white flex items-center justify-center touch-active"
                title="Kapat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 w-full h-full bg-black">
            <iframe
              src={embeddedApp.url}
              title={embeddedApp.name}
              className="w-full h-full border-0"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            />
          </div>
        </div>
      )}

      <AddAppModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddApp={handleAddApp}
      />

    </div>
  );
};
