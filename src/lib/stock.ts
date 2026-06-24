export interface StockPhoto {
  url: string;
  avgColor?: string;
  photographer?: string;
  photographerUrl?: string;
  alt?: string;
}

// Cache por query a nivel módulo: todas las cards de una misma categoría
// comparten el mismo fetch (una sola llamada a Pexels por categoría).
const cache = new Map<string, Promise<StockPhoto[]>>();

function fetchList(query: string): Promise<StockPhoto[]> {
  let promise = cache.get(query);
  if (!promise) {
    promise = fetch(`/api/stock-image?q=${encodeURIComponent(query)}`)
      .then(r => (r.ok ? r.json() : Promise.reject(new Error(`stock ${r.status}`))))
      .then(d => (d.photos as StockPhoto[]) || [])
      .catch(err => {
        cache.delete(query); // permitir reintento más tarde
        throw err;
      });
    cache.set(query, promise);
  }
  return promise;
}

/**
 * Devuelve una foto para `query`. `seed` (ej. el id del empleo) varía cuál
 * foto del set se elige, para que dos ofertas de la misma categoría no salgan
 * siempre idénticas. Devuelve null si no hay resultados o falla.
 */
export async function fetchStockPhoto(query: string, seed = ''): Promise<StockPhoto | null> {
  try {
    const photos = await fetchList(query);
    if (!photos.length) return null;
    let h = 0;
    for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
    return photos[h % photos.length];
  } catch {
    return null;
  }
}
