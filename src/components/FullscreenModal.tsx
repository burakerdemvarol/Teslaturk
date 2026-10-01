import React, { useState } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  MonitorPlay, 
  Info,
  Maximize2,
  ExternalLink
} from 'lucide-react';

interface FullscreenModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FullscreenModal: React.FC<FullscreenModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.href : 'https://teslaplay-portal.vercel.app';
  const teslaRedirectUrl = `https://www.youtube.com/redirect?q=${encodeURIComponent(currentUrl)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(teslaRedirectUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleDirectFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(err);
      });
    }
    onClose();
  };

  const handleOpenTheaterLink = () => {
    window.location.href = teslaRedirectUrl;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none">
      <div className="bg-neutral-900 border border-neutral-700 rounded-3xl w-full max-w-2xl p-6 sm:p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
        
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-tesla-red/20 border border-tesla-red/40 flex items-center justify-center text-tesla-red">
              <MonitorPlay className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Tesla Sinema (Tam Ekran) Modu</h3>
              <p className="text-xs text-neutral-400">Tarayıcı adres çubuğunu ve kenarlıkları gizleyin</p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white flex items-center justify-center touch-active"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-2xl mb-6 flex items-start gap-3">
          <Info className="w-5 h-5 text-tesla-red flex-shrink-0 mt-0.5" />
          <div className="text-xs text-neutral-300 leading-relaxed">
            <strong className="text-white">Tesla Theater Hilesi Nedir?</strong> Tesla araç içi Chromium tarayıcısında üst adres çubuğu normalde kapanmaz. Ancak YouTube Sinema uygulaması üzerinden bir yönlendirme açıldığında, Tesla ekranı <strong>100% tam ekran (immersive)</strong> moduna geçer ve araç içi sinema deneyimi sunar.
          </div>
        </div>

        <div className="space-y-4 mb-6">
          <h4 className="text-sm font-bold text-neutral-200 uppercase tracking-wider">
            Nasıl Kullanılır? (3 Kolay Yöntem)
          </h4>

          <div className="p-4 bg-neutral-950/60 border border-neutral-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 font-bold text-sm text-white">
                <span className="w-6 h-6 rounded-full bg-tesla-red text-white flex items-center justify-center text-xs">1</span>
                <span>Bu Cihazda Doğrudan Sinema Modunu Başlat</span>
              </div>
              <p className="text-xs text-neutral-400 mt-1 pl-8">
                Tesla'nızın ekranındaysanız, aşağıdaki butona basarak YouTube üzerinden tam ekran başlatın.
              </p>
            </div>
            <button
              onClick={handleOpenTheaterLink}
              className="px-4 py-3 min-h-[48px] bg-tesla-red hover:bg-red-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 touch-active whitespace-nowrap shadow-lg"
            >
              <ExternalLink className="w-4 h-4" />
              Sinema Moduna Geç
            </button>
          </div>

          <div className="p-4 bg-neutral-950/60 border border-neutral-800 rounded-2xl flex flex-col gap-2.5">
            <div className="flex items-center gap-2 font-bold text-sm text-white">
              <span className="w-6 h-6 rounded-full bg-neutral-700 text-neutral-200 flex items-center justify-center text-xs">2</span>
              <span>Telefondan Tesla Uygulamasına Gönder</span>
            </div>
            <p className="text-xs text-neutral-400 pl-8 leading-relaxed">
              Aşağıdaki özel bağlantıyı kopyalayın ve telefonunuzdaki <strong>Tesla Uygulaması</strong> ile paylaşın. Araç kapısını açtığınızda portal doğrudan tam ekran açılacaktır.
            </p>

            <div className="pl-8 flex flex-col sm:flex-row gap-2 mt-1">
              <input
                type="text"
                readOnly
                value={teslaRedirectUrl}
                className="flex-1 h-11 px-3 bg-neutral-900 border border-neutral-700 rounded-xl text-xs text-neutral-300 font-mono outline-none select-all"
              />
              <button
                onClick={handleCopy}
                className={`h-11 px-4 min-h-[48px] rounded-xl text-xs font-bold flex items-center justify-center gap-2 touch-active transition-colors ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-neutral-800 hover:bg-neutral-700 text-white'
                }`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Kopyalandı!' : 'Linki Kopyala'}</span>
              </button>
            </div>
          </div>

          <div className="p-4 bg-neutral-950/60 border border-neutral-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 font-bold text-sm text-white">
                <span className="w-6 h-6 rounded-full bg-neutral-700 text-neutral-200 flex items-center justify-center text-xs">3</span>
                <span>Standart Tarayıcı Tam Ekranı</span>
              </div>
              <p className="text-xs text-neutral-400 mt-1 pl-8">
                HTML5 Fullscreen API kullanarak mevcut pencereyi tam ekrana alır.
              </p>
            </div>
            <button
              onClick={handleDirectFullscreen}
              className="px-4 py-3 min-h-[48px] bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 touch-active whitespace-nowrap"
            >
              <Maximize2 className="w-4 h-4" />
              Tam Ekranı Aç
            </button>
          </div>

        </div>

        <div className="pt-4 border-t border-neutral-800 flex items-center justify-between">
          <span className="text-[11px] text-neutral-400">
            İpucu: Bu sayfayı Tesla tarayıcısında sık kullanılanlara (Favorites) ekleyin.
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold rounded-xl touch-active"
          >
            Tamam
          </button>
        </div>

      </div>
    </div>
  );
};
