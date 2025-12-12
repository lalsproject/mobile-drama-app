import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Drama } from '../types';
import { DramaCard } from '../components/DramaCard';
import { Search as SearchIcon, Loader2, X, Image as ImageIcon } from 'lucide-react';

export const Search: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Drama[]>([]);
  const [suggestions, setSuggestions] = useState<Drama[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const navigate = useNavigate();

  // Debounced suggestion fetch
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.trim().length > 1 && !hasSearched) {
        try {
          const res = await api.getSuggestions(query);
          if (res.data && Array.isArray(res.data.suggestList)) {
            setSuggestions(res.data.suggestList);
            setShowSuggestions(true);
          }
        } catch (error) {
          console.error("Suggestion error", error);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query, hasSearched]);

  const loadData = async (keyword: string, currentPage: number) => {
    if (!keyword.trim()) return;

    if (currentPage === 1) {
      setLoading(true);
      setHasSearched(true);
      setShowSuggestions(false);
      setSuggestions([]);
    } else {
      setLoadingMore(true);
    }

    try {
      const res = await api.search(keyword, currentPage);
      const list = res.data?.list || [];
      const isMore = res.data?.isMore ?? (list.length > 0);
      setHasMore(isMore);

      if (currentPage === 1) {
        setResults(list);
      } else {
        setResults(prev => [...prev, ...list]);
      }

      setLoading(false);
      setLoadingMore(false);
    } catch (error) {
      console.error(error);

      console.log(`Page ${currentPage} failed, skipping to ${currentPage + 1}...`);

      setTimeout(() => {
        setPage(currentPage + 1);
        loadData(keyword, currentPage + 1);
      }, 500);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadData(query, 1);
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadData(query, nextPage);
  };

  const handleSuggestionClick = (drama: Drama) => {
    navigate(`/play/${drama.bookId}`, { state: { drama } });
  };

  const handleDramaClick = (drama: Drama) => {
    navigate(`/play/${drama.bookId}`, { state: { drama } });
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setHasSearched(false);
    setSuggestions([]);
    setShowSuggestions(false);
    setPage(1);
    setHasMore(true);
  };

  return (
    <div className="pb-24 pt-4 px-4 min-h-screen bg-[#0f0f0f]">
      <form onSubmit={handleSearchSubmit} className="sticky top-0 z-20 bg-[#0f0f0f] py-2 mb-2">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setHasSearched(false);
            }}
            placeholder="Search drama, genre..."
            className="w-full bg-gray-800 text-white pl-10 pr-10 py-3 rounded-full outline-none focus:ring-2 focus:ring-red-500/50 transition-all placeholder:text-gray-500"
            autoComplete="off"
          />
          <SearchIcon className="absolute left-3.5 top-3.5 text-gray-400" size={20} />
          {query && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-3 top-3 p-0.5 bg-gray-700 rounded-full"
            >
              <X size={16} className="text-gray-300" />
            </button>
          )}
        </div>
      </form>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute left-4 right-4 z-10 bg-gray-800 rounded-xl shadow-2xl border border-gray-700 overflow-hidden">
          {suggestions.map((drama, index) => (
            <button
              key={`${drama.bookId}-${index}`}
              onClick={() => handleSuggestionClick(drama)}
              className="w-full text-left px-4 py-2 border-b border-gray-700/50 last:border-0 hover:bg-gray-700 flex items-center gap-3 text-sm text-gray-200"
            >
              <div className="w-8 h-12 bg-gray-900 rounded overflow-hidden flex-shrink-0">
                <img src={drama.cover} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
                <p className="font-medium line-clamp-1">{drama.bookName}</p>
                <p className="text-xs text-gray-500 line-clamp-1">{drama.introduction}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center mt-20">
          <Loader2 className="animate-spin text-red-500" size={32} />
        </div>
      ) : (
        <>
          {hasSearched ? (
            results.length === 0 ? (
              <div className="text-center text-gray-500 mt-20">
                <p>No results found for "{query}"</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
                  {results.map((drama, index) => (
                    <DramaCard
                      key={`${drama.bookId}-${index}`}
                      drama={drama}
                      onClick={handleDramaClick}
                    />
                  ))}
                </div>

                {/* Load More */}
                {results.length > 0 && hasMore && (
                  <div className="mt-8 flex justify-center">
                    <button
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                      className="bg-gray-800 text-white px-6 py-2 rounded-full text-sm font-medium flex items-center gap-2 hover:bg-gray-700 disabled:opacity-50"
                    >
                      {loadingMore ? <Loader2 className="animate-spin" size={16} /> : <Loader2 size={16} className="opacity-0" />} {/* Icon placeholder */}
                      Load More
                    </button>
                  </div>
                )}
              </>
            )
          ) : (
            !query && (
              <div className="mt-8 text-gray-500 flex flex-col items-center">
                <SearchIcon size={48} className="opacity-20 mb-4" />
                <p className="text-sm">Explore thousands of dramas</p>
              </div>
            )
          )}
        </>
      )}
    </div>
  );
};
