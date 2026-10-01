import React, { useState, useEffect, useMemo } from 'react';
import { Channel, ChannelCategory } from '../types';
import { FALLBACK_CHANNELS } from '../data/fallbackChannels';
import { VideoPlayer } from './VideoPlayer';
import { 
  Search, 
  Star, 
  Tv, 
  Plus, 
  RefreshCw, 
  X,
  Satellite
} from 'lucide-react';

const CATEGORIES: ChannelCategory[] = [
  'Tümü',
  'Türksat Canlı',
  'Ulusal',
  'Haber',
  'Spor',
  'Belgesel',
  'Müzik',
  'Çocuk',
  'Favoriler',
];

export const LiveTv: React.FC = () => {
  const [channels, setChannels] = useState<Channel[]>(FALLBACK_CHANNELS);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(FALLBACK_CHANNELS[0] || null);
  const [activeCategory, setActiveCategory] = useState<ChannelCategory>('Türksat Canlı');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('teslaplay_favorite_channels');
      return saved ? JSON.parse(saved) : ['trt1', 'trthaber', 'szctv', 'ntv', 'trtspor'];
    } catch {
      return ['trt1', 'trthaber', 'szctv', 'ntv', 'trtspor'];
    }
  });

  const [isCinemaMode, setIsCinemaMode] = useState<boolean>(false);
  const [isFetchingDynamic, setIsFetchingDynamic] = useState<boolean>(false);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelUrl, setNewChannelUrl] = useState('');
  const [newChannelType, setNewChannelType] = useState<'youtube' | 'hls'>('youtube');
  const [newChannelCategory, setNewChannelCategory] = useState<'Ulusal' | 'Haber' | 'Spor' | 'Belgesel' | 'Müzik' | 'Çocuk' | 'Genel'>('Genel');

  useEffect(() => {
    try {
      localStorage.setItem('teslaplay_favorite_channels', JSON.stringify(favorites));
    } catch (err) {
      console.error('Failed to save favorites:', err);
    }
  }, [favorites]);

  useEffect(() => {
    try {
      const savedCustom = localStorage.getItem('teslaplay_custom_channels');
      if (savedCustom) {
        const parsed: Channel[] = JSON.parse(savedCustom);
        setChannels(prev => [...prev, ...parsed]);
      }
    } catch (err) {
      console.error('Failed to load custom channels:', err);
    }
  }, []);

  const fetchDynamicStreams = async () => {
    setIsFetchingDynamic(true);
    try {
      const [channelsRes, streamsRes] = await Promise.all([
        fetch('https://iptv-org.github.io/api/channels.json'),
        fetch('https://iptv-org.github.io/api/streams.json'),
      ]);

      if (!channelsRes.ok || !streamsRes.ok) {
        throw new Error('IPTV-ORG API yanıt vermedi.');
      }

      const allChannels: Array<{ id: string; name: string; country: string; logo?: string; categories?: string[] }> = await channelsRes.json();
      const allStreams: Array<{ channel: string; url: string; status?: string }> = await streamsRes.json();

      const trChannelsMap = new Map<string, { name: string; logo?: string; category?: string }>();
      allChannels.forEach(c => {
        if (c.country === 'TR') {
          trChannelsMap.set(c.id, {
            name: c.name,
            logo: c.logo,
            category: c.categories && c.categories.length > 0 ? c.categories[0] : 'Ulusal'
          });
        }
      });

      const dynamicChannels: Channel[] = [];
      allStreams.forEach((stream, index) => {
        if (stream.url && stream.url.includes('.m3u8') && trChannelsMap.has(stream.channel)) {
          const info = trChannelsMap.get(stream.channel)!;
          dynamicChannels.push({
            id: `dyn_${stream.channel}_${index}`,
            name: info.name,
            logo: info.logo || 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=100&auto=format&fit=crop&q=60',
            category: 'Ulusal',
            streamUrl: stream.url,
            country: 'TR',
            preferredEngine: 'hls',
            description: 'IPTV-Org Dinamik Akış',
          });
        }
      });

      if (dynamicChannels.length > 0) {
        setChannels(prev => {
          const existingIds = new Set(prev.map(c => c.id));
          const uniqueNew = dynamicChannels.filter(c => !existingIds.has(c.id));
          return [...prev, ...uniqueNew];
        });
      }
    } catch (err) {
      console.warn('Dinamik akış çekilemedi, yerleşik Türksat kataloğu devrede:', err);
    } finally {
      setIsFetchingDynamic(false);
    }
  };

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(fId => fId !== id) : [...prev, id]
    );
  };

  const handleAddChannel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelName || !newChannelUrl) return;

    const isYt = newChannelType === 'youtube' || newChannelUrl.includes('youtube.com') || newChannelUrl.includes('youtu.be');
    let ytId = '';
    if (isYt) {
      const match = newChannelUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|live\/))([\w-]{11})/);
      ytId = match ? match[1] : newChannelUrl;
    }

    const newChan: Channel = {
      id: `custom_${Date.now()}`,
      name: newChannelName,
      logo: 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=100&auto=format&fit=crop&q=60',
      category: newChannelCategory,
      streamUrl: isYt ? '' : newChannelUrl,
      youtubeId: isYt ? ytId : undefined,
      youtubeLiveUrl: isYt && newChannelUrl.includes('embed') ? newChannelUrl : undefined,
      preferredEngine: isYt ? 'youtube' : 'hls',
      country: 'TR',
      isCustom: true,
      description: 'Kullanıcı Özel Yayını',
    };

    const updated = [...channels, newChan];
    setChannels(updated);
    setSelectedChannel(newChan);

    try {
      const customs = updated.filter(c => c.isCustom);
      localStorage.setItem('teslaplay_custom_channels', JSON.stringify(customs));
    } catch (err) {
      console.error(err);
    }

    setNewChannelName('');
    setNewChannelUrl('');
    setShowAddModal(false);
  };

  const filteredChannels = useMemo(() => {
    return channels.filter(channel => {
      if (activeCategory === 'Favoriler') {
        if (!favorites.includes(channel.id)) return false;
      } else if (activeCategory === 'Türksat Canlı') {
        if (!channel.turksatFreq && channel.country !== 'TR') return false;
      } else if (activeCategory !== 'Tümü') {
        if (channel.category !== activeCategory) return false;
      }

      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchesName = channel.name.toLowerCase().includes(q);
        const matchesFreq = channel.turksatFreq?.toLowerCase().includes(q) || false;
        const matchesDesc = channel.description?.toLowerCase().includes(q) || false;
        return matchesName || matchesFreq || matchesDesc;
      }

      return true;
    });
  }, [channels, activeCategory, favorites, searchQuery]);

  const currentIndex = selectedChannel 
    ? filteredChannels.findIndex(c => c.id === selectedChannel.id)
    : -1;

  const handleNextChannel = () => {
    if (filteredChannels.length === 0) return;
    const nextIdx = (currentIndex + 1) % filteredChannels.length;
    setSelectedChannel(filteredChannels[nextIdx]);
  };

  const handlePrevChannel = () => {
    if (filteredChannels.length === 0) return;
    const prevIdx = (currentIndex - 1 + filteredChannels.length) % filteredChannels.length;
    setSelectedChannel(filteredChannels[prevIdx]);
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden p-3 sm:p-4 gap-4 bg-black">
      
      <div className={`transition-all duration-300 flex flex-col ${
        isCinemaMode ? 'w-full h-full' : 'w-full lg:w-[70%] h-[50vh] lg:h-full'
      }`}>
        <VideoPlayer 
          channel={selectedChannel}
          onNextChannel={handleNextChannel}
          onPrevChannel={handlePrevChannel}
          isCinemaMode={isCinemaMode}
          onToggleCinemaMode={() => setIsCinemaMode(!isCinemaMode)}
        />
      </div>

      {!isCinemaMode && (
        <div className="w-full lg:w-[30%] h-full flex flex-col bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl">
          
          <div className="p-3 bg-neutral-900 border-b border-neutral-800 flex flex-col gap-2.5">
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Satellite className="w-5 h-5 text-tesla-red" />
                <span className="font-bold text-sm text-white tracking-wide">
                  Türksat & Canlı TV ({filteredChannels.length})
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={fetchDynamicStreams}
                  disabled={isFetchingDynamic}
                  className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors touch-active disabled:opacity-50"
                  title="Dinamik IPTV Akışlarını Tara"
                >
                  <RefreshCw className={`w-4 h-4 ${isFetchingDynamic ? 'animate-spin text-tesla-red' : ''}`} />
                </button>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-2.5 py-1.5 rounded-xl bg-tesla-red hover:bg-red-700 text-white text-xs font-semibold flex items-center gap-1 transition-colors touch-active"
                  title="Özel Kanal / Akış Ekle"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Kanal Ekle</span>
                </button>
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Kanal veya Türksat frekansı ara..."
                className="w-full h-11 pl-10 pr-9 bg-neutral-950 border border-neutral-700 focus:border-tesla-red text-white text-sm rounded-xl outline-none placeholder:text-neutral-500 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar select-none">
              {CATEGORIES.map(cat => {
                const isActive = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all touch-active flex items-center gap-1.5 border ${
                      isActive
                        ? 'bg-tesla-red border-red-600 text-white shadow-md'
                        : 'bg-neutral-800/80 hover:bg-neutral-800 border-neutral-700 text-neutral-300'
                    }`}
                  >
                    {cat === 'Favoriler' && <Star className="w-3.5 h-3.5 fill-current" />}
                    {cat === 'Türksat Canlı' && <Satellite className="w-3.5 h-3.5" />}
                    <span>{cat}</span>
                  </button>
                );
              })}
            </div>

          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {filteredChannels.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-center p-4 text-neutral-500">
                <Tv className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-xs">Aramanıza veya filtreye uygun kanal bulunamadı.</p>
              </div>
            ) : (
              filteredChannels.map(channel => {
                const isSelected = selectedChannel?.id === channel.id;
                const isFav = favorites.includes(channel.id);
                const hasYt = Boolean(channel.youtubeId || channel.youtubeLiveUrl);

                return (
                  <div
                    key={channel.id}
                    onClick={() => setSelectedChannel(channel)}
                    className={`w-full p-2.5 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all touch-active ${
                      isSelected
                        ? 'bg-neutral-800 border-tesla-red shadow-lg'
                        : 'bg-neutral-900/60 hover:bg-neutral-800/80 border-neutral-800/80'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative w-11 h-11 rounded-lg bg-neutral-950 p-1 flex items-center justify-center border border-neutral-800 flex-shrink-0">
                        <img 
                          src={channel.logo} 
                          alt={channel.name}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>

                      <div className="min-w-0 flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-sm font-bold truncate ${isSelected ? 'text-white' : 'text-neutral-200'}`}>
                            {channel.name}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-neutral-400 mt-0.5 truncate">
                          <span className="text-tesla-red font-medium">{channel.category}</span>
                          {channel.turksatFreq && (
                            <span className="truncate opacity-75">{channel.turksatFreq.split('(')[0]}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {hasYt && (
                        <span 
                          className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-950/60 text-red-400 border border-red-900/40"
                          title="YouTube Stealth TV Aktif"
                        >
                          YT Canlı
                        </span>
                      )}

                      <button
                        onClick={(e) => toggleFavorite(channel.id, e)}
                        className={`p-2 rounded-lg touch-active transition-colors ${
                          isFav ? 'text-amber-400 hover:text-amber-300' : 'text-neutral-600 hover:text-neutral-400'
                        }`}
                        title={isFav ? 'Favorilerden Çıkar' : 'Favorilere Ekle'}
                      >
                        <Star className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
                      </button>
                    </div>

                  </div>
                );
              })
            )}
          </div>

          <div className="p-2.5 bg-neutral-950 border-t border-neutral-800 text-[11px] text-neutral-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Türksat Canlı Yayınlar Aktif
            </span>
            <span className="text-neutral-400">TeslaPlay v2.0</span>
          </div>

        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-tesla-red" />
                Özel Kanal Ekle
              </h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddChannel} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Kanal Adı
                </label>
                <input
                  type="text"
                  required
                  placeholder="Örn: TRT World HD"
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                  className="w-full h-11 px-3 bg-neutral-950 border border-neutral-700 rounded-xl text-white text-sm outline-none focus:border-tesla-red"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Yayın Türü
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewChannelType('youtube')}
                    className={`py-2 text-xs font-bold rounded-xl border transition-colors ${
                      newChannelType === 'youtube'
                        ? 'bg-tesla-red text-white border-red-600'
                        : 'bg-neutral-800 text-neutral-300 border-neutral-700'
                    }`}
                  >
                    YouTube Canlı Yayın
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewChannelType('hls')}
                    className={`py-2 text-xs font-bold rounded-xl border transition-colors ${
                      newChannelType === 'hls'
                        ? 'bg-neutral-700 text-white border-neutral-600'
                        : 'bg-neutral-800 text-neutral-300 border-neutral-700'
                    }`}
                  >
                    HLS .m3u8 Akışı
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  {newChannelType === 'youtube' ? 'YouTube Video ID / Canlı Link' : 'HLS Akış URL (.m3u8)'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={newChannelType === 'youtube' ? 'Örn: gCNeDWCI0Q8 veya https://youtube.com/live/...' : 'https://.../stream.m3u8'}
                  value={newChannelUrl}
                  onChange={(e) => setNewChannelUrl(e.target.value)}
                  className="w-full h-11 px-3 bg-neutral-950 border border-neutral-700 rounded-xl text-white text-sm outline-none focus:border-tesla-red"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Kategori
                </label>
                <select
                  value={newChannelCategory}
                  onChange={(e) => setNewChannelCategory(e.target.value as any)}
                  className="w-full h-11 px-3 bg-neutral-950 border border-neutral-700 rounded-xl text-white text-sm outline-none focus:border-tesla-red"
                >
                  <option value="Ulusal">Ulusal</option>
                  <option value="Haber">Haber</option>
                  <option value="Spor">Spor</option>
                  <option value="Belgesel">Belgesel</option>
                  <option value="Müzik">Müzik</option>
                  <option value="Çocuk">Çocuk</option>
                  <option value="Genel">Genel</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-sm rounded-xl touch-active"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-tesla-red hover:bg-red-700 text-white font-semibold text-sm rounded-xl touch-active"
                >
                  Kaydet ve Başlat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
