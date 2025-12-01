import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Search, Flame } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-md border-t border-white/10 px-6 py-3 flex justify-around items-center z-50 pb-safe">
      <button 
        onClick={() => navigate('/')}
        className={`flex flex-col items-center gap-1 ${isActive('/') ? 'text-red-500' : 'text-gray-400'}`}
      >
        <Home size={24} />
        <span className="text-[10px] font-medium">Home</span>
      </button>

      <button 
        onClick={() => navigate('/trending')}
        className={`flex flex-col items-center gap-1 ${isActive('/trending') ? 'text-red-500' : 'text-gray-400'}`}
      >
        <Flame size={24} />
        <span className="text-[10px] font-medium">Hot</span>
      </button>

      <button 
        onClick={() => navigate('/search')}
        className={`flex flex-col items-center gap-1 ${isActive('/search') ? 'text-red-500' : 'text-gray-400'}`}
      >
        <Search size={24} />
        <span className="text-[10px] font-medium">Search</span>
      </button>
    </div>
  );
};
