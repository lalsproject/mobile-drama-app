import { ApiResponse, DramaListData, SuggestionData, ChapterListData, WatchResponse } from '../types';

// Menggunakan API baru dari dramabox.sansekai.my.id
const BASE_API_URL = "https://dramabox.sansekai.my.id/api/dramabox";

// Fungsi helper untuk fetch data dari API
const fetchFromAPI = async (endpoint: string) => {
  try {
    const url = `${BASE_API_URL}${endpoint}`;
    console.log('Fetching from:', url);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API fetch error:', error);
    throw error;
  }
};

export const api = {
  // Mendapatkan drama rekomendasi untukmu (For You)
  getForYou: async () => {
    return fetchFromAPI('/foryou');
  },

  // Mendapatkan drama terbaru (Latest/New Releases)
  getNewReleases: async () => {
    return fetchFromAPI('/latest');
  },

  // Mendapatkan drama trending (Rank/Trending)
  getRank: async () => {
    return fetchFromAPI('/trending');
  },

  // Mendapatkan pencarian populer
  getPopularSearch: async () => {
    return fetchFromAPI('/populersearch');
  },

  // Mencari drama berdasarkan query
  search: async (keyword: string) => {
    return fetchFromAPI(`/search?query=${encodeURIComponent(keyword)}`);
  },

  // Mendapatkan link streaming untuk sebuah drama
  getStream: async (bookId: string | number) => {
    return fetchFromAPI(`/stream?bookId=${bookId}`);
  },

  // Fungsi legacy untuk kompatibilitas dengan kode yang sudah ada
  getSuggestions: async (keyword: string) => {
    // Menggunakan search sebagai pengganti suggestions
    return api.search(keyword);
  },

  getChapters: async (bookId: string | number) => {
    // Menggunakan stream endpoint untuk mendapatkan chapters
    return api.getStream(bookId);
  },

  getWatchLink: async (bookId: string | number, chapterIndex: number) => {
    // Mendapatkan semua streaming links, lalu filter berdasarkan chapterIndex
    const streamData = await api.getStream(bookId);
    if (Array.isArray(streamData)) {
      const chapter = streamData.find((ch: any) => ch.chapterIndex === chapterIndex);
      return chapter || null;
    }
    return null;
  }
};