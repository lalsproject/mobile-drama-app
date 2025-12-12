# Update API DramaBox - Dokumentasi

## Perubahan yang Dilakukan

### 1. File `services/api.ts`
**Perubahan Utama:**
- ✅ Mengganti BASE_URL dari `https://sapi.dramabox.be/api` menjadi `https://dramabox.sansekai.my.id/api/dramabox`
- ✅ Menghapus sistem CORS proxy (AllOrigins, CorsProxy.io, CodeTabs) karena API baru sudah mendukung CORS
- ✅ Menyederhanakan fungsi fetch dengan `fetchFromAPI()` yang lebih sederhana
- ✅ Menghapus parameter `page` dari semua endpoint karena API baru tidak mendukung pagination
- ✅ Menambahkan endpoint baru: `getPopularSearch()` dan `getStream()`

**Endpoint API Baru:**
```typescript
// Rekomendasi untukmu
api.getForYou() // GET /foryou

// Drama terbaru
api.getNewReleases() // GET /latest

// Drama trending
api.getRank() // GET /trending

// Pencarian populer
api.getPopularSearch() // GET /populersearch

// Mencari drama
api.search(keyword) // GET /search?query={keyword}

// Stream links
api.getStream(bookId) // GET /stream?bookId={bookId}

// Fungsi legacy (kompatibilitas)
api.getSuggestions(keyword) -> menggunakan search()
api.getChapters(bookId) -> menggunakan getStream()
api.getWatchLink(bookId, chapterIndex) -> menggunakan getStream() + filter
```

### 2. File `pages/Home.tsx`
**Perubahan Utama:**
- ✅ Menghapus parameter `page` dari `loadData()`
- ✅ Menghapus state yang tidak diperlukan: `page`, `hasMore`, `loadingMore`
- ✅ Menghapus fungsi `handleLoadMore()` karena tidak ada pagination
- ✅ Menghapus tombol "Load More"
- ✅ Mengubah parsing response untuk mendukung format data baru

**Struktur Data API Baru:**
```json
// Response dari /foryou, /latest, /trending
[
  {
    "cardType": 3,
    "tagCardVo": {
      "tagId": 1411,
      "tagName": "Intrik Keluarga",
      "tagBooks": [
        {
          "bookId": "42000000722",
          "bookName": "Bunga Mekar dari Air Mata",
          "coverWap": "https://...",
          ...
        }
      ]
    }
  },
  {
    "bookId": "42000001023",
    "bookName": "Drama Title",
    "coverWap": "https://...",
    "chapterCount": 74,
    "introduction": "...",
    "tags": [...],
    ...
  }
]

// Response dari /search?query=pewaris
[
  {
    "bookId": "42000000562",
    "bookName": "Pewaris Tanpa Memori",
    "introduction": "...",
    "cover": "https://...",
    "protagonist": "...",
    "tagNames": [...],
    ...
  }
]

// Response dari /stream?bookId=41000116666
[
  {
    "chapterId": "700035830",
    "chapterIndex": 0,
    "chapterName": "EP 1",
    "cdnList": [
      {
        "cdnDomain": "hwztvideo.dramaboxdb.com",
        "videoPathList": [
          {
            "quality": 720,
            "videoPath": "https://...",
            "isDefault": 1
          }
        ]
      }
    ],
    "chapterImg": "https://...",
    "isCharge": 0
  }
]
```

## Dampak pada Fitur Aplikasi

### ✅ Yang Masih Berfungsi:
- Menampilkan daftar drama di tab "For You"
- Menampilkan daftar drama di tab "New Release"
- Navigasi ke halaman detail drama
- Struktur data drama kompatibel dengan komponen yang ada

### ❌ Yang Tidak Berfungsi Lagi:
- Pagination / Load More (API baru mengembalikan semua data sekaligus)
- Filter berdasarkan halaman

### 🔄 Yang Perlu Diupdate (Opsional):
- Halaman trending (buat tab baru atau halaman terpisah)
- Halaman pencarian populer
- Halaman detail drama untuk menggunakan endpoint `/stream` yang baru
- Video player untuk menggunakan format CDN list yang baru

## Cara Testing

1. Jalankan aplikasi dengan `npm run dev`
2. Buka halaman Home
3. Cek apakah drama muncul di tab "For You"
4. Pindah ke tab "New Release"
5. Cek apakah drama muncul
6. Klik salah satu drama untuk ke halaman detail

## Catatan Penting

- API baru **tidak mendukung pagination**, semua data dikembalikan dalam satu request
- Beberapa drama dikemas dalam format `tagCardVo.tagBooks`, kode sudah di-handle untuk extract drama dari format ini
- API baru **sudah support CORS** sehingga tidak perlu proxy lagi
- Endpoint `/stream` mengembalikan **semua chapter sekaligus** dengan informasi lengkap termasuk CDN list
