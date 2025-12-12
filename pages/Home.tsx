import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Drama } from '../types';
import { DramaCard } from '../components/DramaCard';
import { Loader2, RefreshCw } from 'lucide-react';

export const Home: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'foryou' | 'new'>('foryou');
  const [dramas, setDramas] = useState<Drama[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const navigate = useNavigate();

  const loadData = async (isNewTab: boolean = false) => {
    setLoading(true);
    setError(false);

    try {
      let res;
      if (activeTab === 'foryou') {
        res = await api.getForYou();
      } else {
        res = await api.getNewReleases();
      }

      // API baru mengembalikan array langsung
      let list: Drama[] = [];

      if (Array.isArray(res)) {
        // Jika response langsung berupa array
        list = res;
      } else if (res.data?.list) {
        // Fallback untuk format lama
        list = res.data.list;
      }

      // Proses data berdasarkan struktur API baru
      const processedList = list.map((item: any) => {
        // Cek apakah ini tagCard format
        if (item.cardType === 3 && item.tagCardVo) {
          // Ambil drama dari tagCardVo.tagBooks
          return item.tagCardVo.tagBooks || [];
        }
        // Atau drama biasa
        return item;
      }).flat(); // Flatten array jika ada nested arrays

      setDramas(processedList);
      setLoading(false);
    } catch (error) {
      console.error("Home Load Error:", error);
      setError(true);
      setLoading(false);
    }
  };

  useEffect(() => {
    setDramas([]);
    loadData(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

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
            onClick={() => loadData()}
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

          {/* Load More tidak diperlukan karena API baru mengembalikan semua data sekaligus */}
        </>
      )}
    </div>
  );
};