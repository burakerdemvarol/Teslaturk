import React, { useState } from 'react';
import { AppItem, AppCategory } from '../types';
import { X, Plus, Globe } from 'lucide-react';

interface AddAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddApp: (app: AppItem) => void;
}

export const AddAppModal: React.FC<AddAppModalProps> = ({ isOpen, onClose, onAddApp }) => {
  type AppFormCategory = Exclude<AppCategory, 'all'>;
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState<AppFormCategory>('streaming');
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !url) return;

    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`;
    }

    const domain = new URL(formattedUrl).hostname;
    const defaultIcon = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;

    const newApp: AppItem = {
      id: `custom_app_${Date.now()}`,
      name,
      url: formattedUrl,
      icon: defaultIcon,
      category,
      description: description || domain,
      isCustom: true,
      bgColor: 'from-neutral-900 to-neutral-950',
    };

    onAddApp(newApp);
    setName('');
    setUrl('');
    setDescription('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-neutral-900 border border-neutral-700 rounded-2xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-tesla-red" />
            <h3 className="text-lg font-bold text-white">Özel Uygulama / Web Sitesi Ekle</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              Uygulama veya Web Sitesi Adı
            </label>
            <input
              type="text"
              required
              placeholder="Örn: Plex, Jellyfin veya Web Radyo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-11 px-3 bg-neutral-950 border border-neutral-700 rounded-xl text-white text-sm outline-none focus:border-tesla-red"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              URL Bağlantısı
            </label>
            <input
              type="text"
              required
              placeholder="https://app.example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full h-11 px-3 bg-neutral-950 border border-neutral-700 rounded-xl text-white text-sm outline-none focus:border-tesla-red font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              Kategori
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as AppFormCategory)}
              className="w-full h-11 px-3 bg-neutral-950 border border-neutral-700 rounded-xl text-white text-sm outline-none focus:border-tesla-red"
            >
              <option value="streaming">Medya & Video Akışı</option>
              <option value="utilities">Araçlar & Yol Yardım</option>
              <option value="games">Retro & Web Oyunları</option>
              <option value="custom">Özel Bağlantılar</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              Açıklama (İsteğe Bağlı)
            </label>
            <input
              type="text"
              placeholder="Kısa açıklama..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full h-11 px-3 bg-neutral-950 border border-neutral-700 rounded-xl text-white text-sm outline-none focus:border-tesla-red"
            />
          </div>

          <div className="flex gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-sm rounded-xl touch-active"
            >
              İptal
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-tesla-red hover:bg-red-700 text-white font-semibold text-sm rounded-xl touch-active flex items-center justify-center gap-1.5 shadow-lg"
            >
              <Plus className="w-4 h-4" />
              Ekle
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
