import React, { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import { Channel } from '../types';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  RotateCcw, 
  Radio, 
  ShieldCheck, 
  AlertCircle,
  Tv,
  Layers,
  Sparkles,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface VideoPlayerProps {
  channel: Channel | null;
  onNextChannel?: () => void;
  onPrevChannel?: () => void;
  isCinemaMode: boolean;
  onToggleCinemaMode: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  channel,
  onNextChannel,
  onPrevChannel,
  isCinemaMode,
  onToggleCinemaMode,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(1);
  const [showControls, setShowControls] = useState<boolean>(true);
  const [activeEngine, setActiveEngine] = useState<'youtube' | 'hls'>('youtube');
  const [hasError, setHasError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isUsingCorsProxy, setIsUsingCorsProxy] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!channel) return;
    const preferred = channel.preferredEngine || (channel.youtubeId || channel.youtubeLiveUrl ? 'youtube' : 'hls');
    setActiveEngine(preferred);
    setHasError(false);
    setErrorMessage('');
    setIsUsingCorsProxy(false);
    setIsLoading(true);
    setIsPlaying(true);
  }, [channel]);

  const resetControlsTimeout = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 4500);
  }, []);

  useEffect(() => {
    resetControlsTimeout();
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [resetControlsTimeout]);

  const initHls = useCallback((url: string, useProxy: boolean = false) => {
    const video = videoRef.current;
    if (!video) return;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    setIsLoading(true);
    setHasError(false);

    let streamSrc = url;
    if (useProxy) {
      streamSrc = `https://corsproxy.io/?${encodeURIComponent(url)}`;
      setIsUsingCorsProxy(true);
    }

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 60,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
      });

      hlsRef.current = hls;
      hls.loadSource(streamSrc);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
        video.play().catch(() => {
          setIsPlaying(false);
        });
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              if (!useProxy) {
                initHls(url, true);
              } else {
                setHasError(true);
                setErrorMessage('Ağ/CORS Hatası: Yayın akışı yüklenemedi. YouTube motoruna geçebilirsiniz.');
                setIsLoading(false);
              }
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              hls.destroy();
              setHasError(true);
              setErrorMessage('Yayın formatı desteklenmiyor veya akış sonlandırılmış.');
              setIsLoading(false);
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamSrc;
      video.addEventListener('loadedmetadata', () => {
        setIsLoading(false);
        video.play().catch(() => setIsPlaying(false));
      });
      video.addEventListener('error', () => {
        if (!useProxy) {
          initHls(url, true);
        } else {
          setHasError(true);
          setErrorMessage('Yayın oynatılamıyor.');
          setIsLoading(false);
        }
      });
    } else {
      setHasError(true);
      setErrorMessage('Tarayıcınız HLS video formatını desteklemiyor.');
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeEngine === 'hls' && channel?.streamUrl) {
      initHls(channel.streamUrl, false);
    } else {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [activeEngine, channel, initHls]);

  const sendYouTubeCommand = (func: string, args: any = '') => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event: 'command', func, args }),
        '*'
      );
    }
  };

  const togglePlayPause = () => {
    if (activeEngine === 'hls' && videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    } else if (activeEngine === 'youtube') {
      if (isPlaying) {
        sendYouTubeCommand('pauseVideo');
        setIsPlaying(false);
      } else {
        sendYouTubeCommand('playVideo');
        setIsPlaying(true);
      }
    }
    resetControlsTimeout();
  };

  const toggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    if (activeEngine === 'hls' && videoRef.current) {
      videoRef.current.muted = nextMute;
    } else if (activeEngine === 'youtube') {
      sendYouTubeCommand(nextMute ? 'mute' : 'unMute');
    }
    resetControlsTimeout();
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (activeEngine === 'hls' && videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
    } else if (activeEngine === 'youtube') {
      sendYouTubeCommand('setVolume', [Math.round(val * 100)]);
      if (val === 0) {
        sendYouTubeCommand('mute');
      } else {
        sendYouTubeCommand('unMute');
      }
    }
    setIsMuted(val === 0);
    resetControlsTimeout();
  };

  const reloadStream = () => {
    setHasError(false);
    setErrorMessage('');
    setIsLoading(true);
    if (activeEngine === 'hls' && channel?.streamUrl) {
      initHls(channel.streamUrl, false);
    } else if (activeEngine === 'youtube' && iframeRef.current) {
      const src = iframeRef.current.src;
      iframeRef.current.src = '';
      setTimeout(() => {
        if (iframeRef.current) iframeRef.current.src = src;
        setIsLoading(false);
      }, 200);
    }
    resetControlsTimeout();
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        console.error('Fullscreen error:', err);
      });
    } else {
      document.exitFullscreen().catch(err => {
        console.error('Exit fullscreen error:', err);
      });
    }
    resetControlsTimeout();
  };

  const getYouTubeEmbedUrl = (): string => {
    if (!channel) return '';
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://teslaplay.portal';
    
    if (channel.youtubeLiveUrl) {
      const url = new URL(channel.youtubeLiveUrl);
      url.searchParams.set('autoplay', '1');
      url.searchParams.set('mute', isMuted ? '1' : '0');
      url.searchParams.set('controls', '0');
      url.searchParams.set('modestbranding', '1');
      url.searchParams.set('rel', '0');
      url.searchParams.set('showinfo', '0');
      url.searchParams.set('iv_load_policy', '3');
      url.searchParams.set('playsinline', '1');
      url.searchParams.set('enablejsapi', '1');
      url.searchParams.set('origin', origin);
      return url.toString();
    }

    if (channel.youtubeId) {
      return `https://www.youtube-nocookie.com/embed/${channel.youtubeId}?autoplay=1&mute=${isMuted ? '1' : '0'}&controls=0&modestbranding=1&rel=0&showinfo=0&iv_load_policy=3&playsinline=1&enablejsapi=1&origin=${encodeURIComponent(origin)}`;
    }

    return '';
  };

  if (!channel) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-black border border-neutral-800 rounded-2xl p-8 text-center text-neutral-400">
        <Tv className="w-16 h-16 text-neutral-600 mb-4 animate-bounce" />
        <h3 className="text-xl font-bold text-white mb-2">Kanal Seçilmedi</h3>
        <p className="max-w-md text-sm text-neutral-400">
          İzlemek istediğiniz kanala sağdaki Türksat kanal listesinden dokunun. Kesintisiz yayın otomatik başlayacaktır.
        </p>
      </div>
    );
  }

  const hasYouTube = Boolean(channel.youtubeId || channel.youtubeLiveUrl);

  return (
    <div 
      ref={containerRef}
      onMouseMove={resetControlsTimeout}
      onTouchStart={resetControlsTimeout}
      className={`relative w-full h-full bg-black rounded-2xl overflow-hidden border border-neutral-800 flex flex-col select-none group ${
        isCinemaMode ? 'fixed inset-0 z-50 rounded-none border-none' : ''
      }`}
    >
      <div className="relative flex-1 w-full h-full bg-black overflow-hidden flex items-center justify-center">
        
        {activeEngine === 'youtube' && hasYouTube && (
          <div className="absolute inset-0 w-full h-full overflow-hidden bg-black">
            <iframe
              ref={iframeRef}
              src={getYouTubeEmbedUrl()}
              title={channel.name}
              className="w-full h-full scale-[1.03] origin-center border-0 pointer-events-auto"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              onLoad={() => setIsLoading(false)}
            />

            <div 
              onClick={resetControlsTimeout}
              className="absolute inset-0 z-10 cursor-pointer bg-transparent"
              title="Ekran Menüsünü Aç"
            />
          </div>
        )}

        {activeEngine === 'hls' && (
          <video
            ref={videoRef}
            playsInline
            autoPlay
            className="w-full h-full object-contain bg-black"
            onClick={resetControlsTimeout}
          />
        )}

        {isLoading && !hasError && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm pointer-events-none">
            <div className="w-12 h-12 rounded-full border-4 border-neutral-700 border-t-tesla-red animate-spin mb-3" />
            <span className="text-sm font-semibold tracking-wide text-neutral-200">
              Yayın Yükleniyor ({channel.name})...
            </span>
            <span className="text-xs text-neutral-400 mt-1">
              Motor: {activeEngine === 'youtube' ? 'YouTube Stealth TV' : 'HLS Akış'}
            </span>
          </div>
        )}

        {hasError && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/90 p-6 text-center">
            <AlertCircle className="w-14 h-14 text-tesla-red mb-3" />
            <h4 className="text-lg font-bold text-white mb-1">Yayın Akışında Sorun Oluştu</h4>
            <p className="text-xs text-neutral-400 max-w-md mb-5">{errorMessage}</p>
            <div className="flex flex-wrap gap-3 justify-center">
              {hasYouTube && activeEngine !== 'youtube' && (
                <button
                  onClick={() => setActiveEngine('youtube')}
                  className="px-5 py-3 min-h-[48px] bg-tesla-red hover:bg-red-700 text-white text-sm font-semibold rounded-xl flex items-center gap-2 shadow-lg touch-active"
                >
                  <Sparkles className="w-4 h-4" />
                  YouTube Canlı Yayına Geç (Önerilen)
                </button>
              )}
              {activeEngine !== 'hls' && channel.streamUrl && (
                <button
                  onClick={() => setActiveEngine('hls')}
                  className="px-5 py-3 min-h-[48px] bg-neutral-800 hover:bg-neutral-700 text-white text-sm font-semibold rounded-xl flex items-center gap-2 touch-active"
                >
                  <Radio className="w-4 h-4" />
                  HLS (.m3u8) Akışını Dene
                </button>
              )}
              <button
                onClick={reloadStream}
                className="px-5 py-3 min-h-[48px] bg-neutral-800 hover:bg-neutral-700 text-white text-sm font-semibold rounded-xl flex items-center gap-2 touch-active"
              >
                <RotateCcw className="w-4 h-4" />
                Tekrar Dene
              </button>
            </div>
          </div>
        )}

        <div 
          className={`absolute top-0 inset-x-0 z-30 p-4 bg-gradient-to-b from-black/90 via-black/50 to-transparent transition-opacity duration-300 flex items-center justify-between ${
            showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <div className="flex items-center gap-3">
            <img 
              src={channel.logo} 
              alt={channel.name} 
              className="w-10 h-10 object-contain bg-neutral-900/90 rounded-lg p-1 border border-neutral-700"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">{channel.name}</h2>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-600/90 text-white uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse-dot" />
                  CANLI
                </span>
                {channel.turksatFreq && (
                  <span className="hidden sm:inline-block px-2 py-0.5 rounded-md text-[10px] font-medium bg-neutral-800 text-neutral-300 border border-neutral-700">
                    {channel.turksatFreq}
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-400 line-clamp-1">{channel.description || channel.category}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-neutral-900/90 backdrop-blur-md rounded-xl p-1 border border-neutral-700">
              {hasYouTube && (
                <button
                  onClick={() => setActiveEngine('youtube')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    activeEngine === 'youtube' 
                      ? 'bg-tesla-red text-white shadow' 
                      : 'text-neutral-400 hover:text-white'
                  }`}
                  title="YouTube 24/7 Canlı Yayın Motoru (Kesintisiz & Güncel)"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">YouTube</span> Gizli TV
                </button>
              )}
              {channel.streamUrl && (
                <button
                  onClick={() => setActiveEngine('hls')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    activeEngine === 'hls' 
                      ? 'bg-neutral-700 text-white shadow' 
                      : 'text-neutral-400 hover:text-white'
                  }`}
                  title="Doğrudan IPTV HLS .m3u8 Akışı"
                >
                  <Radio className="w-3.5 h-3.5" />
                  <span>HLS .m3u8</span>
                </button>
              )}
            </div>

            {isUsingCorsProxy && (
              <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-[10px] font-mono rounded border border-yellow-500/30">
                CORS Proxy
              </span>
            )}
          </div>
        </div>

        {showControls && (
          <div className="absolute inset-y-0 inset-x-2 z-20 flex items-center justify-between pointer-events-none">
            {onPrevChannel && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPrevChannel();
                  resetControlsTimeout();
                }}
                className="w-12 h-12 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-md pointer-events-auto border border-neutral-700/60 touch-active transition-all"
                title="Önceki Kanal"
              >
                <ChevronLeft className="w-7 h-7" />
              </button>
            )}
            {onNextChannel && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onNextChannel();
                  resetControlsTimeout();
                }}
                className="w-12 h-12 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-md pointer-events-auto border border-neutral-700/60 touch-active transition-all ml-auto"
                title="Sonraki Kanal"
              >
                <ChevronRight className="w-7 h-7" />
              </button>
            )}
          </div>
        )}

        <div 
          className={`absolute bottom-0 inset-x-0 z-30 p-4 bg-gradient-to-t from-black/95 via-black/70 to-transparent transition-opacity duration-300 ${
            showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <div className="flex items-center justify-between gap-4 max-w-4xl mx-auto">
            
            <div className="flex items-center gap-2">
              <button
                onClick={togglePlayPause}
                className="w-12 h-12 min-w-[48px] min-h-[48px] rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white flex items-center justify-center touch-active transition-colors border border-neutral-700"
                title={isPlaying ? 'Durdur' : 'Oynat'}
              >
                {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}
              </button>

              <button
                onClick={reloadStream}
                className="w-12 h-12 min-w-[48px] min-h-[48px] rounded-xl bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 hover:text-white flex items-center justify-center touch-active transition-colors border border-neutral-700/60"
                title="Yayını Yeniden Başlat"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-3 bg-neutral-900/80 backdrop-blur-md px-4 py-2 rounded-xl border border-neutral-800">
              <button
                onClick={toggleMute}
                className="w-9 h-9 flex items-center justify-center text-neutral-300 hover:text-white touch-active"
                title={isMuted ? 'Sesi Aç' : 'Sesi Kapat'}
              >
                {isMuted || volume === 0 ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-24 sm:w-32 h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-tesla-red"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onToggleCinemaMode}
                className={`px-3 py-2 min-h-[48px] rounded-xl text-xs font-semibold flex items-center gap-2 border touch-active transition-colors ${
                  isCinemaMode 
                    ? 'bg-tesla-red border-red-600 text-white' 
                    : 'bg-neutral-800/90 border-neutral-700 text-neutral-300 hover:text-white'
                }`}
                title="Kanal Listesini Gizle / Sinema Görünümü"
              >
                <Layers className="w-5 h-5" />
                <span className="hidden sm:inline">Sinema</span>
              </button>

              <button
                onClick={toggleFullscreen}
                className="w-12 h-12 min-w-[48px] min-h-[48px] rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white flex items-center justify-center touch-active transition-colors border border-neutral-700"
                title="Tam Ekran"
              >
                <Maximize2 className="w-5 h-5" />
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
