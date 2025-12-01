import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { api } from '../services/api';
import { Chapter, Drama } from '../types';
import { ArrowLeft, List, Loader2, AlertCircle } from 'lucide-react';

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
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<any>(null);

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
            // Check if we need to start at a specific index (future feature), default 0
            loadVideo(id, 0);
          } else {
            setError("No episodes available for this drama.");
          }
        } else {
           // Some APIs return success: true but empty lists or slightly different structures
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
    }

    try {
      const res = await api.getWatchLink(bookId, index);
      const data = res.data;
      
      if (data) {
        // Priority: Default marked quality -> Main URL
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
        video.play().catch(() => console.log("Autoplay blocked by browser policy"));
      });
      hls.on(window.Hls.Events.ERROR, (event: any, data: any) => {
        if (data.fatal) {
           console.warn("HLS Fatal Error:", data);
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
      video.play().catch(() => console.log("Autoplay blocked by browser policy"));
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
    <div className="min-h-screen bg-[#0f0f0f] pb-10">
      {/* Sticky Video Player */}
      <div className="sticky top-0 w-full aspect-video bg-black z-20 shadow-xl">
        <div className="absolute top-4 left-4 z-30">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 bg-black/50 backdrop-blur-md rounded-full text-white hover:bg-black/70 transition"
          >
            <ArrowLeft size={20} />
          </button>
        </div>
        
        {loadingVideo && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/80">
            <Loader2 className="animate-spin text-red-500" size={32} />
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
            className="w-full h-full object-contain"
            controls
            playsInline
            poster={drama?.cover || drama?.coverWap}
            // Removing crossOrigin attribute often helps with opaque responses from CDNs
          />
        )}
      </div>

      {/* Info Section */}
      <div className="px-4 py-4">
        <h1 className="text-xl font-bold text-white mb-2">{drama?.bookName || "Unknown Drama"}</h1>
        <div className="flex flex-wrap gap-2 text-xs text-gray-400 mb-4">
          <span>{chapters.length} Chapters</span>
          {drama?.playCount && (
             <>
               <span>•</span>
               <span>{drama.playCount} Plays</span>
             </>
          )}
          {(drama?.tags || drama?.tagNames || []).map((tag, i) => (
             <span key={i} className="bg-gray-800 text-gray-300 px-2 py-0.5 rounded">
               {tag}
             </span>
          ))}
        </div>
        <p className="text-sm text-gray-400 line-clamp-3 mb-6">
          {drama?.introduction || "Description is not available for this title."}
        </p>

        {/* Chapter List */}
        <div className="flex items-center gap-2 mb-4 text-white">
          <List size={20} />
          <h2 className="font-bold">Episodes</h2>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
          {chapters.map((chapter) => {
            const isPlaying = chapter.chapterIndex === currentChapterIndex;
            return (
              <button
                key={chapter.chapterId}
                onClick={() => id && loadVideo(id, chapter.chapterIndex)}
                className={`
                  aspect-square rounded-lg flex flex-col items-center justify-center text-sm font-semibold transition-all relative overflow-hidden
                  ${isPlaying 
                    ? 'bg-red-600 text-white ring-2 ring-red-400 ring-offset-2 ring-offset-[#0f0f0f]' 
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}
                `}
              >
                {/* Loading Indicator inside the active chapter button if loading */}
                {isPlaying && loadingVideo ? (
                    <Loader2 size={20} className="animate-spin" />
                ) : (
                    <span>{chapter.chapterIndex + 1}</span>
                )}
                
                {chapter.isCharge === 1 && (
                  <div className="absolute top-0 right-0 w-2 h-2 bg-yellow-500 rounded-full m-1" title="Premium" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};