import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Drama } from '../types';
import { Loader2, Trophy, ChevronDown, RefreshCw } from 'lucide-react';

export const Trending: React.FC = () => {
  const [dramas, setDramas] = useState<Drama[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const navigate = useNavigate();

  const loadData = async (currentPage: number) => {
    if (currentPage === 1) {
      setLoading(true);
      setError(false);
    } else {
      setLoadingMore(true);
    }

    try {
      const res = await api.getRank(currentPage);
      // Access res.data.list
      const list = res.data?.list || [];
      const isMore = res.data?.isMore ?? (list.length > 0);
      setHasMore(isMore);

      if (currentPage === 1) {
        setDramas(list);
      } else {
        setDramas(prev => [...prev, ...list]);
      }
    } catch (error) {
      console.error(error);
      if (currentPage === 1) setError(true);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadData(1);
  }, []);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadData(nextPage);
  };

  const handleDramaClick = (drama: Drama) => {
    navigate(`/play/${drama.bookId}`, { state: { drama } });
  };

  return (
    <div className="pb-24 pt-4 px-4 min-h-screen bg-[#0f0f0f]">
      <div className="flex items-center gap-2 mb-6 sticky top-0 z-10 bg-[#0f0f0f]/95 py-2">
        <Trophy className="text-yellow-500" size={24} />
        <h1 className="text-xl font-bold text-white">Global Ranking</h1>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-[50vh]">
          <Loader2 className="animate-spin text-red-500" size={32} />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center h-[50vh] text-gray-400 gap-4">
          <p>Failed to load rankings</p>
          <button 
            onClick={() => loadData(1)}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-full text-sm font-medium hover:bg-red-700 transition"
          >
            <RefreshCw size={16} /> Retry
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {dramas.map((drama, index) => (
            <div 
              key={`${drama.bookId}-${index}`} 
              className="flex gap-4 p-3 bg-gray-900/50 rounded-lg active:bg-gray-800 transition-colors cursor-pointer"
              onClick={() => handleDramaClick(drama)}
            >
              <div className="relative w-24 flex-shrink-0 aspect-[2/3]">
                <img 
                  src={drama.cover || drama.coverWap} 
                  className="w-full h-full object-cover rounded-md" 
                  alt={drama.bookName} 
                />
                <div className={`absolute -top-1 -left-1 w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${index < 3 ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-white'}`}>
                  {index + 1}
                </div>
              </div>
              <div className="flex-1 py-1">
                <h3 className="font-bold text-white mb-1 line-clamp-2">{drama.bookName}</h3>
                <div className="flex flex-wrap gap-2 mb-2">
                  {(drama.tags || []).slice(0, 3).map((tag, i) => (
                    <span key={i} className="text-[10px] bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-gray-500 line-clamp-2">{drama.introduction || 'No description available.'}</p>
                {drama.playCount && (
                    <p className="text-[10px] text-red-500 mt-2 font-medium">{drama.playCount} Plays</p>
                )}
              </div>
            </div>
          ))}

          {/* Load More Button */}
          {dramas.length > 0 && hasMore && (
            <div className="mt-4 flex justify-center">
              <button 
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="w-full py-3 bg-gray-900 text-gray-400 rounded-lg text-sm font-medium flex justify-center items-center gap-2 hover:bg-gray-800 active:scale-95 transition-all"
              >
                {loadingMore ? <Loader2 className="animate-spin" size={16} /> : <ChevronDown size={16} />}
                Show More Results
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
