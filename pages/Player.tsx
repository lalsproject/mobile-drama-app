import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { api } from '../services/api';
import { Chapter, Drama } from '../types';
import { ArrowLeft, List, Loader2, AlertCircle, ChevronDown, ChevronUp, Play, Pause, SkipForward, SkipBack, Maximize, Minimize } from 'lucide-react';

// Declare Hls global from the script tag in index.html
declare global {
  interface Window {
    Hls: any;
  }
}

export const Player: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [drama, setDrama] = useState<Drama | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [loadingVideo, setLoadingVideo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEpisodes, setShowEpisodes] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<any>(null);
  const touchStart = useRef<number | null>(null);
  const touchEnd = useRef<number | null>(null);

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    touchEnd.current = null;
    touchStart.current = e.targetTouches[0].clientY;
  }

  const onTouchMove = (e: React.TouchEvent) => {
    touchEnd.current = e.targetTouches[0].clientY;
  }

  const onTouchEnd = () => {
    if (!touchStart.current || !touchEnd.current) return;
    const distance = touchStart.current - touchEnd.current;
    const isUpSwipe = distance > minSwipeDistance;
    const isDownSwipe = distance < -minSwipeDistance;

    if (isUpSwipe) {
      setShowEpisodes(true);
    }
    if (isDownSwipe && showEpisodes) {
      setShowEpisodes(false);
    }
  }

  useEffect(() => {
    if (!id) return;

    // Use passed state for metadata if available
    if (location.state?.drama) {
      setDrama(location.state.drama);
    }

    const fetchDetails = async () => {
      try {
        const res = await api.getChapters(id);
        if (res.data && res.data.chapterList) {
          setChapters(res.data.chapterList);

          if (res.data.chapterList.length > 0) {
            loadVideo(id, 0);
          } else {
            setError("No episodes available for this drama.");
          }
        } else {
          if (res.success && (!res.data || !res.data.chapterList)) {
            setError("Drama content is not currently available.");
          } else {
            setError("Failed to load chapter list.");
          }
        }
      } catch (err) {
        console.error("Chapter fetch error:", err);
        setError("Network error: Failed to load episodes. Please check your connection.");
      } finally {
        setLoadingMeta(false);
      }
    };
    fetchDetails();

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullScreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullScreenChange);
    };
  }, []);

  const loadVideo = async (bookId: string, index: number) => {
    setLoadingVideo(true);
    setCurrentChapterIndex(index);
    setError(null);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.removeAttribute('src');
      videoRef.current.load();
      setIsPlaying(false);
    }

    try {
      const res = await api.getWatchLink(bookId, index);
      const data = res.data;

      if (data) {
        let targetUrl = data.videoUrl;

        if (data.qualities && Array.isArray(data.qualities)) {
          const defaultQuality = data.qualities.find(q => q.isDefault === 1);
          if (defaultQuality && defaultQuality.videoPath) {
            targetUrl = defaultQuality.videoPath;
          }
        }

        if (targetUrl) {
          playUrl(targetUrl);
        } else {
          throw new Error("No playable video stream found.");
        }
      } else {
        throw new Error("Server returned invalid video data.");
      }
    } catch (err) {
      console.error("Video fetch error:", err);
      setError("Unable to play this episode. It might be locked or unavailable.");
    } finally {
      setLoadingVideo(false);
    }
  };

  const playUrl = (url: string) => {
    const video = videoRef.current;
    if (!video) return;

    const isHls = url.includes('.m3u8');

    if (isHls && window.Hls && window.Hls.isSupported()) {
      const hls = new window.Hls({
        debug: false,
        enableWorker: true,
      });
      hlsRef.current = hls;
      hls.loadSource(url);
      hls.attachMedia(video);
      hls.on(window.Hls.Events.MANIFEST_PARSED, () => {
        video.play().then(() => setIsPlaying(true)).catch(() => console.log("Autoplay blocked"));
      });
      hls.on(window.Hls.Events.ERROR, (event: any, data: any) => {
        if (data.fatal) {
          switch (data.type) {
            case window.Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case window.Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              hls.destroy();
              break;
          }
        }
      });
    } else {
      video.src = url;
      video.load();
      video.play().then(() => setIsPlaying(true)).catch(() => console.log("Autoplay blocked"));
    }
  };

  const handleVideoEnded = () => {
    if (currentChapterIndex < chapters.length - 1) {
      loadVideo(id!, currentChapterIndex + 1);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const toggleFullScreen = () => {
    const video = videoRef.current;
    const container = containerRef.current;

    // iOS Safari / Chrome on iOS specific
    if (video && typeof (video as any).webkitEnterFullscreen === 'function') {
      (video as any).webkitEnterFullscreen();
      return;
    }

    // Standard API
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  if (loadingMeta) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="animate-spin text-red-500" size={40} />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-black overflow-hidden group"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Full Screen Video Player */}
      <div className="absolute inset-0 z-0">
        {loadingVideo && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/50">
            <Loader2 className="animate-spin text-red-500" size={40} />
          </div>
        )}

        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-gray-900 text-white p-4 text-center">
            <AlertCircle className="text-red-500 mb-2" size={32} />
            <p className="text-sm">{error}</p>
            <button
              onClick={() => id && loadVideo(id, currentChapterIndex)}
              className="mt-4 px-4 py-2 bg-gray-700 rounded-full text-xs hover:bg-gray-600"
            >
              Retry
            </button>
          </div>
        ) : (
          <video
            ref={videoRef}
            className="w-full h-full object-contain bg-black"
            playsInline
            poster={drama?.cover || drama?.coverWap}
            onEnded={handleVideoEnded}
            onClick={togglePlay}
          />
        )}
      </div>

      {/* Top Controls */}
      <div className="absolute top-0 left-0 right-0 p-4 z-20 bg-gradient-to-b from-black/70 to-transparent flex justify-between items-center">
        <button
          onClick={() => navigate(-1)}
          className="p-2 bg-black/30 backdrop-blur-md rounded-full text-white hover:bg-black/50 transition"
        >
          <ArrowLeft size={24} />
        </button>
        <div className="text-white font-semibold text-sm drop-shadow-md">
          Ep {currentChapterIndex + 1}
        </div>
        <div className="w-10" /> {/* Spacer */}
      </div>

      {/* Center Play/Pause Overlay (optional, fades out) */}
      {!isPlaying && !loadingVideo && !error && (
        <div
          className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none"
        >
          <div className="bg-black/40 p-4 rounded-full backdrop-blur-sm">
            <Play size={48} className="text-white fill-white" />
          </div>
        </div>
      )}

      {/* Bottom Controls / Info */}
      <div className={`absolute bottom-0 left-0 right-0 p-4 z-20 bg-gradient-to-t from-black/90 via-black/50 to-transparent transition-opacity duration-300 ${showEpisodes ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <div className="mb-4">
          <h1 className="text-white font-bold text-lg drop-shadow-md">{drama?.bookName}</h1>
          <p className="text-gray-300 text-xs line-clamp-2 drop-shadow-md">{drama?.introduction}</p>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex gap-4 items-center">
            <button
              onClick={() => id && currentChapterIndex > 0 && loadVideo(id, currentChapterIndex - 1)}
              disabled={currentChapterIndex === 0}
              className="text-white disabled:opacity-30"
            >
              <SkipBack size={24} />
            </button>
            <button onClick={togglePlay} className="text-white">
              {isPlaying ? <Pause size={24} /> : <Play size={24} />}
            </button>
            <button
              onClick={() => id && currentChapterIndex < chapters.length - 1 && loadVideo(id, currentChapterIndex + 1)}
              disabled={currentChapterIndex === chapters.length - 1}
              className="text-white disabled:opacity-30"
            >
              <SkipForward size={24} />
            </button>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={toggleFullScreen}
              className="text-white hover:text-gray-300 transition"
            >
              {isFullScreen ? <Minimize size={24} /> : <Maximize size={24} />}
            </button>

            <button
              onClick={() => setShowEpisodes(true)}
              className="flex flex-col items-center text-white animate-bounce"
            >
              <ChevronUp size={20} />
              <span className="text-xs font-medium">Episodes</span>
            </button>
          </div>
        </div>
      </div>

      {/* Episode List Bottom Sheet */}
      <div
        className={`fixed inset-x-0 bottom-0 z-30 bg-[#1a1a1a] rounded-t-2xl transition-transform duration-300 ease-out transform ${showEpisodes ? 'translate-y-0' : 'translate-y-full'}`}
        style={{ maxHeight: '70vh' }}
      >
        <div
          className="w-full h-12 flex items-center justify-center border-b border-gray-800 relative cursor-pointer"
          onClick={() => setShowEpisodes(false)}
        >
          <div className="w-12 h-1.5 bg-gray-600 rounded-full absolute top-3" />
          <span className="mt-4 text-xs text-gray-400">Swipe down to close</span>
        </div>

        <div className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(70vh - 48px)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-bold text-lg">Episodes</h2>
            <span className="text-gray-400 text-sm">{chapters.length} Total</span>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
            {chapters.map((chapter) => {
              const isCurrent = chapter.chapterIndex === currentChapterIndex;
              return (
                <button
                  key={chapter.chapterId}
                  onClick={() => {
                    if (id) loadVideo(id, chapter.chapterIndex);
                    // Optional: Close sheet on selection
                    // setShowEpisodes(false);
                  }}
                  className={`
                    aspect-square rounded-lg flex flex-col items-center justify-center text-sm font-semibold relative overflow-hidden transition-colors
                    ${isCurrent
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}
                  `}
                >
                  {isCurrent && loadingVideo ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <span>{chapter.chapterIndex + 1}</span>
                  )}

                  {chapter.isCharge === 1 && (
                    <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-yellow-500 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Backdrop for Bottom Sheet */}
      {showEpisodes && (
        <div
          className="fixed inset-0 bg-black/60 z-20"
          onClick={() => setShowEpisodes(false)}
        />
      )}
    </div>
  );
};