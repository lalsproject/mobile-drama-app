export interface Drama {
  bookId: string;
  bookName: string;
  cover: string;
  coverWap?: string; // Sometimes used in Rank
  introduction?: string;
  tags?: string[]; // Used in ForYou
  tagNames?: string[]; // Used in Search
  chapterCount?: number;
  playCount?: string; // e.g. "18.3M"
  score?: number;
}

export interface Chapter {
  chapterId: string | number;
  chapterIndex: number;
  isCharge: number; // 0 or 1
  isPay?: number;
  chapterSizeVoList?: {
    quality: number;
    size: number;
  }[];
}

export interface WatchResponse {
  bookId: string;
  chapterIndex: number;
  videoUrl: string;
  cover: string;
  qualities?: {
    quality: number;
    videoPath: string;
    isDefault: number;
  }[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: any;
}

export interface DramaListData {
  list: Drama[];
  total?: number;
  isMore?: boolean;
}

export interface SuggestionData {
  suggestList: Drama[];
}

export interface ChapterListData {
  chapterList: Chapter[];
}
