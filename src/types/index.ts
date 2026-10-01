export type ChannelCategory = 
  | 'Tümü'
  | 'Türksat Canlı'
  | 'Ulusal'
  | 'Haber'
  | 'Spor'
  | 'Belgesel'
  | 'Müzik'
  | 'Çocuk'
  | 'Favoriler';

export interface Channel {
  id: string;
  name: string;
  logo: string;
  category: 'Ulusal' | 'Haber' | 'Spor' | 'Belgesel' | 'Müzik' | 'Çocuk' | 'Eğlence' | 'Genel';
  streamUrl: string;
  youtubeId?: string; // YouTube Live stream video id or live stream handle
  youtubeLiveUrl?: string; // Direct YouTube Live embed URL
  turksatFreq?: string; // Türksat 4A/5B official frequency
  country: string;
  preferredEngine?: 'youtube' | 'hls';
  description?: string;
  isCustom?: boolean;
}

export type AppCategory = 'all' | 'streaming' | 'utilities' | 'games' | 'custom';

export interface AppItem {
  id: string;
  name: string;
  url: string;
  icon: string;
  category: 'streaming' | 'utilities' | 'games' | 'custom';
  description?: string;
  bgColor?: string;
  isEmbeddable?: boolean;
  isCustom?: boolean;
}

export type ActiveTab = 'tv' | 'apps' | 'games';
