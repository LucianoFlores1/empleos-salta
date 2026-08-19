import { useState, useEffect } from 'react';
import { Job } from '../types';
import { categoryToStockQuery } from '../utils';
import { fetchStockPhoto, StockPhoto } from '../lib/stock';

/** Si el flyer carga con menos de este ancho, se considera baja resolución. */
const MIN_FLYER_WIDTH = 380;

interface CardCoverProps {
  job: Job;
  /** clases extra para el flyer real (ej. zoom al hover) */
  imgClassName?: string;
}

/**
 * Imagen de la card de oferta:
 * - Muestra el flyer real (fondo borroso + flyer completo, sin recorte).
 * - Si el flyer falla o carga en baja resolución, genera una "portada":
 *   foto de Pexels relacionada a la categoría + degradado de marca + el título.
 */
export default function CardCover({ job, imgClassName = '' }: CardCoverProps) {
  const flyerUrl = job.previewUrl || `https://drive.google.com/thumbnail?id=${job.driveId || job.id}&sz=w400`;
  const [useCover, setUseCover] = useState(false);
  const [photo, setPhoto] = useState<StockPhoto | null>(null);

  useEffect(() => {
    if (!useCover) return;
    let active = true;
    fetchStockPhoto(categoryToStockQuery(job.category), job.id).then(p => {
      if (active) setPhoto(p);
    });
    return () => {
      active = false;
    };
  }, [useCover, job.category, job.id]);

  if (useCover) {
    // Portada limpia: solo la foto de Pexels (el badge de categoría y el título
    // del cuerpo del card hacen el resto). Sin degradado de marca ni título encima.
    return (
      <div className="relative w-full h-full overflow-hidden bg-surface">
        {photo ? (
          <img
            src={photo.url}
            alt=""
            aria-hidden="true"
            loading="lazy"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover animate-[fadeIn_0.4s_ease]"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-surface to-line" />
        )}
        {/* leve oscurecido inferior solo para que el badge de categoría se lea */}
        <div className="absolute inset-0 bg-black/5" />
      </div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden bg-surface">
      {/* Fondo borroso del propio flyer */}
      <img
        src={flyerUrl}
        alt=""
        aria-hidden="true"
        loading="lazy"
        decoding="async"
        fetchPriority="low"
        referrerPolicy="no-referrer"
        className="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl opacity-50 saturate-150"
      />
      {/* Flyer completo, sin recorte */}
      <img
        src={flyerUrl}
        alt={job.title}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => setUseCover(true)}
        onLoad={(e) => {
          const w = e.currentTarget.naturalWidth;
          if (w && w < MIN_FLYER_WIDTH) setUseCover(true);
        }}
        className={`relative z-10 w-full h-full object-contain ${imgClassName}`}
      />
    </div>
  );
}