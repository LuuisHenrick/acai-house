/**
 * Utilitários para detecção e otimização de mídia
 */

export interface MediaInfo {
  type: 'image' | 'gif' | 'video';
  isAnimated: boolean;
  shouldRenderAsVideo: boolean;
  optimizedUrl: string;
}

/**
 * Analisa uma URL de mídia e retorna informações sobre como renderizá-la
 */
export function analyzeMediaUrl(url: string): MediaInfo {
  const lowerUrl = url.toLowerCase();
  
  // Detectar tipo de arquivo
  const isGif = lowerUrl.endsWith('.gif') || lowerUrl.includes('.gif?');
  const isVideo = lowerUrl.endsWith('.mp4') || lowerUrl.endsWith('.webm') || lowerUrl.includes('.mp4?') || lowerUrl.includes('.webm?');
  
  let type: 'image' | 'gif' | 'video' = 'image';
  let isAnimated = false;
  let shouldRenderAsVideo = false;
  
  if (isGif) {
    type = 'gif';
    isAnimated = true;
    shouldRenderAsVideo = true; // GIFs devem ser renderizados como vídeo para performance
  } else if (isVideo) {
    type = 'video';
    isAnimated = true;
    shouldRenderAsVideo = true;
  }
  
  // Otimizar URL se for do Supabase e não for GIF/vídeo
  let optimizedUrl = url;
  if (url.includes('supabase.co') && !isGif && !isVideo) {
    optimizedUrl = `${url}?width=1920&quality=80`;
  }
  
  return {
    type,
    isAnimated,
    shouldRenderAsVideo,
    optimizedUrl
  };
}

/**
 * Componente para renderizar mídia otimizada (imagem, GIF como vídeo, ou vídeo)
 */
export interface OptimizedMediaProps {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  loading?: 'lazy' | 'eager';
  onError?: (e: React.SyntheticEvent) => void;
  fallbackSrc?: string;
}

export function OptimizedMedia({
  src,
  alt,
  className = '',
  style,
  loading = 'lazy',
  onError,
  fallbackSrc = 'https://images.unsplash.com/photo-1596463119248-53c8d33d2739?auto=format&fit=crop&q=80'
}: OptimizedMediaProps) {
  const mediaInfo = analyzeMediaUrl(src);
  
  if (mediaInfo.shouldRenderAsVideo) {
    return (
      <video
        className={className}
        style={style}
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        onError={onError}
      >
        <source src={src} type={mediaInfo.type === 'gif' ? 'image/gif' : 'video/mp4'} />
        {/* Fallback para navegadores que não suportam */}
        <img
          src={fallbackSrc}
          alt={alt}
          className={className}
          style={style}
          loading={loading}
        />
      </video>
    );
  }
  
  return (
    <img
      src={mediaInfo.optimizedUrl}
      alt={alt}
      className={className}
      style={style}
      loading={loading}
      onError={onError || ((e) => {
        e.currentTarget.src = fallbackSrc;
      })}
    />
  );
}

/**
 * Hook para detectar se uma URL é de mídia animada
 */
export function useMediaType(url: string) {
  return React.useMemo(() => analyzeMediaUrl(url), [url]);
}

/**
 * Valida se um arquivo é um formato de mídia suportado
 */
export function validateMediaFile(file: File): { isValid: boolean; error?: string } {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  const maxSize = 5 * 1024 * 1024; // 5MB
  
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `Formato não suportado. Use: ${allowedTypes.join(', ')}`
    };
  }
  
  if (file.size > maxSize) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    return {
      isValid: false,
      error: `Arquivo muito grande (${sizeMB}MB). Máximo: 5MB`
    };
  }
  
  return { isValid: true };
}

/**
 * Otimiza URLs de mídia baseado no contexto de uso
 */
export function getOptimizedMediaUrl(url: string, context: 'thumbnail' | 'card' | 'modal' | 'hero' = 'card'): string {
  if (!url || !url.includes('supabase.co')) return url;
  
  // Não otimizar GIFs para preservar animação
  if (url.toLowerCase().includes('.gif')) return url;
  
  const optimizations = {
    thumbnail: 'width=150&quality=60',
    card: 'width=400&quality=70',
    modal: 'width=800&quality=80',
    hero: 'width=1920&quality=80'
  };
  
  return `${url}?${optimizations[context]}`;
}