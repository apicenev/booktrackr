const OPEN_LIBRARY = "https://openlibrary.org";
const FIELDS = "key,title,author_name,cover_i,number_of_pages_median,first_publish_year";
const RESULT_LIMIT = 20;

// Open Library often takes 2-10 s to answer. Trending changes once a day, so
// it is cached across visits; searches are cached for the browser session.
const TRENDING_CACHE_KEY = "booktrackr:trending:v1";
const TRENDING_MAX_AGE_MS = 6 * 60 * 60 * 1000;
const searchCache = new Map<string, ExploreBook[]>();

/** A book as returned by Open Library search/trending, normalised for the UI. */
export interface ExploreBook {
  key: string;
  title: string;
  authors: string[];
  coverId?: number;
  pages?: number;
  firstPublishYear?: number;
}

interface OpenLibraryDoc {
  key: string;
  title: string;
  author_name?: string[];
  cover_i?: number;
  number_of_pages_median?: number;
  first_publish_year?: number;
}

const toExploreBook = (doc: OpenLibraryDoc): ExploreBook => ({
  key: doc.key,
  title: doc.title,
  authors: doc.author_name ?? [],
  coverId: doc.cover_i,
  pages: doc.number_of_pages_median,
  firstPublishYear: doc.first_publish_year,
});

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`Open Library request failed with status ${response.status}`);
  }
  return (await response.json()) as T;
}

interface CachedTrending {
  savedAt: number;
  books: ExploreBook[];
}

/** Last trending result from any earlier visit (possibly stale), or null. */
export function getCachedTrending(now = Date.now()): { books: ExploreBook[]; fresh: boolean } | null {
  try {
    const raw = localStorage.getItem(TRENDING_CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw) as CachedTrending;
    if (!Array.isArray(cached.books)) return null;
    return { books: cached.books, fresh: now - cached.savedAt < TRENDING_MAX_AGE_MS };
  } catch {
    return null; // storage unavailable or corrupt: just fetch
  }
}

export async function getTrendingBooks(signal?: AbortSignal): Promise<ExploreBook[]> {
  const data = await getJson<{ works: OpenLibraryDoc[] }>(
    `${OPEN_LIBRARY}/trending/daily.json?limit=${RESULT_LIMIT}&fields=${FIELDS}`,
    signal
  );
  const books = data.works.map(toExploreBook);
  try {
    localStorage.setItem(
      TRENDING_CACHE_KEY,
      JSON.stringify({ savedAt: Date.now(), books } satisfies CachedTrending)
    );
  } catch {
    // Caching is best-effort.
  }
  return books;
}

export function getCachedSearch(query: string): ExploreBook[] | undefined {
  return searchCache.get(query.trim().toLowerCase());
}

export async function searchBooks(query: string, signal?: AbortSignal): Promise<ExploreBook[]> {
  const params = new URLSearchParams({
    q: query,
    fields: FIELDS,
    limit: String(RESULT_LIMIT),
  });
  const data = await getJson<{ docs: OpenLibraryDoc[] }>(
    `${OPEN_LIBRARY}/search.json?${params}`,
    signal
  );
  const books = data.docs.map(toExploreBook);
  searchCache.set(query.trim().toLowerCase(), books);
  return books;
}
