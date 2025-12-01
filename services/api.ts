import { ApiResponse, DramaListData, SuggestionData, ChapterListData, WatchResponse } from '../types';

const BASE_API_URL = "https://sapi.dramabox.be/api";

// Helper to validate if an object looks like the API response we expect
const isValidResponse = (data: any): boolean => {
  return data && typeof data === 'object' && (data.success === true || data.data !== undefined);
};

const fetchWithFallback = async (endpoint: string) => {
  const targetUrl = `${BASE_API_URL}${endpoint}`;
  
  // Strategies are now async functions that return the parsed data directly
  const strategies = [
    // Strategy 1: AllOrigins /get (JSON Wrapped)
    // This is the most robust method because it returns a valid JSON object 
    // containing the text response, avoiding "Unexpected token <" errors on 403/404s.
    async () => {
      const encodedUrl = encodeURIComponent(targetUrl);
      const response = await fetch(`https://api.allorigins.win/get?url=${encodedUrl}`);
      if (!response.ok) throw new Error(`AllOrigins HTTP error: ${response.status}`);
      
      const wrapper = await response.json();
      if (!wrapper.contents) throw new Error("AllOrigins returned empty content");
      
      const data = JSON.parse(wrapper.contents);
      if (!isValidResponse(data)) throw new Error("Invalid API response format");
      return data;
    },

    // Strategy 2: CorsProxy.io (Direct Proxy)
    async () => {
      const encodedUrl = encodeURIComponent(targetUrl);
      const response = await fetch(`https://corsproxy.io/?${encodedUrl}`);
      if (!response.ok) throw new Error(`CorsProxy HTTP error: ${response.status}`);
      
      // We check text first to catch HTML errors before JSON parsing
      const text = await response.text();
      try {
        const data = JSON.parse(text);
        if (!isValidResponse(data)) throw new Error("Invalid API response format");
        return data;
      } catch (e) {
        // If parsing fails, it's likely HTML error page
        throw new Error(`CorsProxy returned non-JSON: ${text.substring(0, 50)}...`);
      }
    },

    // Strategy 3: CodeTabs (Fallback)
    async () => {
      const encodedUrl = encodeURIComponent(targetUrl);
      const response = await fetch(`https://api.codetabs.com/v1/proxy?quest=${encodedUrl}`);
      if (!response.ok) throw new Error(`CodeTabs HTTP error: ${response.status}`);
      
      const data = await response.json();
      if (!isValidResponse(data)) throw new Error("Invalid API response format");
      return data;
    }
  ];

  let lastError;

  for (const strategy of strategies) {
    try {
      const data = await strategy();
      return data;
    } catch (error) {
      console.warn(`Fetch strategy failed for ${endpoint}:`, error);
      lastError = error;
    }
  }

  console.error("All fetch strategies failed for", endpoint, lastError);
  throw lastError || new Error("Network request failed after multiple attempts");
};

export const api = {
  getForYou: async (page: number = 1) => {
    return fetchWithFallback(`/foryou/${page}`) as Promise<ApiResponse<DramaListData>>;
  },
  
  getNewReleases: async (page: number = 1) => {
    return fetchWithFallback(`/new/${page}`) as Promise<ApiResponse<DramaListData>>;
  },
  
  getRank: async (page: number = 1) => {
    return fetchWithFallback(`/rank/${page}`) as Promise<ApiResponse<DramaListData>>;
  },

  search: async (keyword: string, page: number = 1) => {
    return fetchWithFallback(`/search/${encodeURIComponent(keyword)}/${page}`) as Promise<ApiResponse<DramaListData>>;
  },

  getSuggestions: async (keyword: string) => {
    return fetchWithFallback(`/suggest/${encodeURIComponent(keyword)}`) as Promise<ApiResponse<SuggestionData>>;
  },

  getChapters: async (bookId: string | number) => {
    return fetchWithFallback(`/chapters/${bookId}`) as Promise<ApiResponse<ChapterListData>>;
  },

  getWatchLink: async (bookId: string | number, chapterIndex: number) => {
    return fetchWithFallback(`/watch/${bookId}/${chapterIndex}?source=search_result`) as Promise<ApiResponse<WatchResponse>>;
  }
};