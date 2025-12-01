import React from 'react';
import { Drama } from '../types';
import { Play } from 'lucide-react';

interface DramaCardProps {
  drama: Drama;
  onClick: (drama: Drama) => void;
}

export const DramaCard: React.FC<DramaCardProps> = ({ drama, onClick }) => {
  // Normalize cover image (Rank sometimes uses coverWap)
  const imageUrl = drama.cover || drama.coverWap || '';

  return (
    <div 
      className="relative group cursor-pointer" 
      onClick={() => onClick(drama)}
    >
      <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-gray-800">
        <img 
          src={imageUrl} 
          alt={drama.bookName}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-100" />
        
        {/* Play Icon Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-red-600/90 p-3 rounded-full backdrop-blur-sm">
            <Play size={20} fill="white" className="text-white ml-1" />
          </div>
        </div>

        {/* Play Count Badge */}
        {drama.playCount && (
          <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
            <Play size={8} fill="currentColor" />
            {drama.playCount}
          </div>
        )}

        <div className="absolute bottom-2 left-2 right-2">
          <h3 className="text-white text-sm font-bold line-clamp-2 leading-tight">
            {drama.bookName}
          </h3>
          {drama.chapterCount ? (
             <p className="text-gray-300 text-[10px] mt-1">
               {drama.chapterCount} Eps
             </p>
          ) : null}
        </div>
      </div>
    </div>
  );
};
