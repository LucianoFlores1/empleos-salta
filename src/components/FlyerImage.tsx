import { useState, useEffect } from 'react';

interface FlyerImageProps {
  src: string;
  alt: string;
  /** clases del contenedor (definen el tamaño, ej. "absolute inset-0" o "h-full w-full") */
  className?: string;
  /** clases extra para la imagen en primer plano (ej. animaciones de hover) */
  imgClassName?: string;
  loading?: 'lazy' | 'eager';
  /** tamaño del cartel de fallback */
  fallbackSize?: 'sm' | 'lg';
  /**
   * 'fill'    → llena un contenedor de tamaño fijo (cards): fondo borroso + flyer contenido.
   * 'natural' → respeta el alto natural del flyer (página de detalle).
   */
  mode?: 'fill' | 'natural';
}

/**
 * Muestra un flyer de tamaño/relación de aspecto arbitrarios de forma uniforme:
 * un fondo borroso (el mismo flyer en `object-cover`) y el flyer completo
 * (`object-contain`) por encima. Así nunca se recorta ni deforma.
 * Si la imagen falla, muestra el cartel "Oferta obsoleta".
 */
export default function FlyerImage({
  src,
  alt,
  className = '',
  imgClassName = '',
  loading = 'lazy',
  fallbackSize = 'sm',
  mode = 'fill',
}: FlyerImageProps) {
  const [failed, setFailed] = useState(false);

  // Reintentar cuando cambia la fuente (ej. al editar el Drive ID)
  useEffect(() => setFailed(false), [src]);

  if (failed || !src) {
    const big = fallbackSize === 'lg';
    return (
      <div className={`flex items-center justify-center bg-surface ${big ? 'min-h-[300px] p-8' : ''} ${className}`}>
        <div
          className={`bg-brand-soft aspect-square flex flex-col items-center justify-center text-center shadow-md rotate-2 relative border border-[#E8D099] ${
            big ? 'w-3/4 max-w-[250px]' : 'w-3/4 max-w-[140px]'
          }`}
        >
          <div className="w-3 h-3 rounded-full bg-red-600 absolute -top-1.5 shadow-[0_2px_4px_rgba(0,0,0,0.4)]" />
          <span className={`font-black text-brand uppercase tracking-widest leading-tight ${big ? 'text-2xl' : 'text-sm'}`}>
            Oferta<br />Obsoleta
          </span>
        </div>
      </div>
    );
  }

  if (mode === 'natural') {
    return (
      <img
        src={src}
        alt={alt}
        loading={loading}
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className={`w-full h-auto object-contain ${imgClassName}`}
      />
    );
  }

  return (
    <div className={`relative overflow-hidden bg-surface ${className}`}>
      {/* Fondo borroso: el mismo flyer, recortado y difuminado (decorativo) */}
      <img
        src={src}
        alt=""
        aria-hidden="true"
        loading="lazy"
        decoding="async"
        fetchPriority="low"
        referrerPolicy="no-referrer"
        className="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl opacity-50 saturate-150"
      />
      {/* Flyer completo, siempre visible sin recorte */}
      <img
        src={src}
        alt={alt}
        loading={loading}
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className={`relative z-10 w-full h-full object-contain ${imgClassName}`}
      />
    </div>
  );
}