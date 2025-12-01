import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Drama } from '../types';
import { DramaCard } from '../components/DramaCard';
import { Loader2, Plus, RefreshCw } from 'lucide-react';

export const Home: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'foryou' | 'new'>('foryou');
  const [dramas, setDramas] = useState<Drama[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const navigate = useNavigate();

  const loadData = async (currentPage: number, isNewTab: boolean = false) => {
    if (currentPage === 1) {
      setLoading(true);
      setError(false);
    } else {
      setLoadingMore(true);
    }

    try {
      let res;
      if (activeTab === 'foryou') {
        res = await api.getForYou(currentPage);
      } else {
        res = await api.getNewReleases(currentPage);
      }
      
      const list = res.data?.list || [];
      const isMore = res.data?.isMore ?? (list.length > 0);
      setHasMore(isMore);

      if (currentPage === 1) {
        setDramas(list);
      } else {
        setDramas(prev => [...prev, ...list]);
      }
    } catch (error) {
      console.error("Home Load Error:", error);
      if (currentPage === 1) setError(true);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    setPage(1);
    setDramas([]);
    loadData(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

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
      {/* Header */}
      <div className="flex items-center gap-6 mb-6 sticky top-0 z-10 bg-[#0f0f0f]/95 py-2 backdrop-blur-sm">
        <h1 className="text-2xl font-black text-red-600 tracking-tighter">DRAMABOX</h1>
        <div className="flex gap-4">
          <button 
            onClick={() => setActiveTab('foryou')}
            className={`text-sm font-semibold transition-colors ${activeTab === 'foryou' ? 'text-white border-b-2 border-red-500' : 'text-gray-500'}`}
          >
            For You
          </button>
          <button 
            onClick={() => setActiveTab('new')}
            className={`text-sm font-semibold transition-colors ${activeTab === 'new' ? 'text-white border-b-2 border-red-500' : 'text-gray-500'}`}
          >
            New Release
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center items-center h-[50vh]">
          <Loader2 className="animate-spin text-red-500" size={32} />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center h-[50vh] text-gray-400 gap-4">
          <p>Unable to load dramas</p>
          <button 
            onClick={() => loadData(1)}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-full text-sm font-medium hover:bg-red-700 transition"
          >
            <RefreshCw size={16} /> Retry
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {dramas.map((drama, index) => (
              <DramaCard 
                key={`${drama.bookId}-${index}`} 
                drama={drama} 
                onClick={handleDramaClick} 
              />
            ))}
          </div>

          {/* Load More */}
          {dramas.length > 0 && hasMore && (
            <div className="mt-8 flex justify-center">
              <button 
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="bg-gray-800 text-white px-6 py-2 rounded-full text-sm font-medium flex items-center gap-2 hover:bg-gray-700 disabled:opacity-50"
              >
                {loadingMore ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
                Load More
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};