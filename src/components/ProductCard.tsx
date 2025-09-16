import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { OptimizedMedia, getOptimizedMediaUrl } from '../utils/mediaUtils';

interface ProductImage {
  id: string;
  image_url: string;
  alt_text: string;
  display_order: number;
  is_primary: boolean;
  is_active: boolean;
}

interface ProductSize {
  id: string;
  size_name: string;
  size_label: string;
  price: number;
  active: boolean;
}

interface Product {
  id: string;
  name: string;
  description: string;
  category_id: string;
  active: boolean;
  sizes: ProductSize[];
  images: ProductImage[];
  is_on_promotion?: boolean;
  promo_price?: number;
  promo_coupon_code?: string;
  promo_end_date?: string;
  product_categories?: {
    name: string;
    slug: string;
  };
}

interface ProductCardProps {
  product: Product;
  onClick: () => void;
}

const ProductCard = React.memo(({ product, onClick }: ProductCardProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Get all active images, sorted by display_order
  const activeImages = useMemo(() => {
    const images = product.images
      ?.filter(img => img.is_active)
      ?.sort((a, b) => a.display_order - b.display_order) || [];

    // Fallback to a default image if no images are available
    return images.length > 0 
      ? images 
      : [{ 
          id: 'default', 
          image_url: 'https://images.unsplash.com/photo-1596463119248-53c8d33d2739?auto=format&fit=crop&q=80',
          alt_text: product.name,
          display_order: 1,
          is_primary: true,
          is_active: true
        }];
  }, [product.images, product.name]);

  const hasMultipleImages = activeImages.length > 1;

  // Auto-advance carousel every 5 seconds when not hovered
  useEffect(() => {
    if (!hasMultipleImages || isHovered) return;

    const interval = setInterval(() => {
      setCurrentImageIndex(prev => (prev + 1) % activeImages.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [hasMultipleImages, isHovered, activeImages.length]);

  // Touch handlers for swipe navigation
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd || !hasMultipleImages) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      setCurrentImageIndex(prev => (prev + 1) % activeImages.length);
    }
    if (isRightSwipe) {
      setCurrentImageIndex(prev => prev === 0 ? activeImages.length - 1 : prev - 1);
    }
  }, [touchStart, touchEnd, hasMultipleImages, activeImages.length]);

  const goToPrevious = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex(prev => prev === 0 ? activeImages.length - 1 : prev - 1);
  }, [activeImages.length]);

  const goToNext = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex(prev => (prev + 1) % activeImages.length);
  }, [activeImages.length]);

  const goToImage = useCallback((index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex(index);
  }, []);

  const getMinPrice = useCallback(() => {
    if (product.sizes.length === 0) return 0;
    
    // Se está em promoção e tem preço promocional, usar o preço promocional
    if (product.is_on_promotion && product.promo_price && product.promo_end_date) {
      const promoEndDate = new Date(product.promo_end_date);
      if (promoEndDate > new Date()) {
        return product.promo_price;
      }
    }
    
    return Math.min(...product.sizes.map(s => s.price));
  }, [product.sizes, product.is_on_promotion, product.promo_price, product.promo_end_date]);

  const isPromotionActive = useCallback(() => {
    if (!product.is_on_promotion || !product.promo_end_date) return false;
    return new Date(product.promo_end_date) > new Date();
  }, [product.is_on_promotion, product.promo_end_date]);

  const getOriginalMinPrice = useCallback(() => {
    if (product.sizes.length === 0) return 0;
    return Math.min(...product.sizes.map(s => s.price));
  }, [product.sizes]);

  const optimizeImageUrl = useCallback((url: string) => {
    return getOptimizedMediaUrl(url, 'card');
  }, []);

  const currentImage = activeImages[currentImageIndex];

  return (
    <div
      className="bg-white rounded-lg shadow-lg overflow-hidden transform hover:scale-105 transition-all duration-300 cursor-pointer group w-full"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <div 
        className="relative aspect-square overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Main Image */}
        <div className="relative w-full h-full">
          <OptimizedMedia
            // Renderizar GIF como vídeo para melhor performance
            <video
              className="w-full h-full object-cover transition-opacity duration-500"
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              style={{ 
                objectFit: 'cover',
                objectPosition: 'center'
              }}
            >
              <source src={currentImage.image_url} type="video/mp4" />
              {/* Fallback para navegadores que não suportam */}
              <img
                src={optimizeImageUrl(currentImage.image_url)}
                alt={currentImage.alt_text || product.name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </video>
          ) : (
            // Renderizar imagens estáticas normalmente
            <img
              src={optimizeImageUrl(currentImage.image_url)}
              alt={currentImage.alt_text || product.name}
              className="w-full h-full object-cover transition-opacity duration-500"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.src = 'https://images.unsplash.com/photo-1596463119248-53c8d33d2739?auto=format&fit=crop&q=80&width=400&quality=70';
              }}
            />
          )}
          
          {/* Gradient overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>

        {/* Navigation arrows (only show if multiple images and hovered on desktop) */}
        {hasMultipleImages && isHovered && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 p-2 rounded-full shadow-lg transition-all duration-200 opacity-0 group-hover:opacity-100 hidden sm:block"
              aria-label="Imagem anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 p-2 rounded-full shadow-lg transition-all duration-200 opacity-0 group-hover:opacity-100 hidden sm:block"
              aria-label="Próxima imagem"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}

        {/* Image indicators (dots) */}
        {hasMultipleImages && (
          <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-2">
            {activeImages.map((_, index) => (
              <button
                key={index}
                onClick={(e) => goToImage(index, e)}
                className={`w-2 h-2 rounded-full transition-all duration-200 ${
                  index === currentImageIndex
                    ? 'bg-white scale-125'
                    : 'bg-white/60 hover:bg-white/80'
                }`}
                aria-label={`Ir para imagem ${index + 1}`}
              />
            ))}
          </div>
        )}

        {/* Image counter */}
        {hasMultipleImages && (
          <div className="absolute top-3 right-3 bg-black/70 text-white px-2 py-1 rounded-full text-xs font-medium">
            {currentImageIndex + 1}/{activeImages.length}
          </div>
        )}

        {/* Add to cart button overlay */}
        <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={(e) => {
            fallbackSrc="https://images.unsplash.com/photo-1596463119248-53c8d33d2739?auto=format&fit=crop&q=80&width=400&quality=70"
            className="bg-purple-600 text-white p-2 rounded-full hover:bg-purple-700 transition-colors duration-200 shadow-lg"
            aria-label="Adicionar ao carrinho"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {/* Promotion Badge */}
        {isPromotionActive() && (
          <div className="absolute top-3 right-3 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold animate-pulse">
            PROMOÇÃO
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4 sm:p-6">
        <h3 className="text-lg sm:text-xl font-semibold mb-2 text-gray-900 line-clamp-2">
          {product.name}
        </h3>
        <p className="text-gray-600 mb-4 text-sm line-clamp-3 leading-relaxed">
          {product.description}
        </p>
        
        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            {product.sizes.length > 0 && (
              <>
                {isPromotionActive() ? (
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-400 line-through">
                        R$ {getOriginalMinPrice().toFixed(2)}
                      </span>
                      <span className="text-lg font-bold text-red-600">
                        R$ {getMinPrice().toFixed(2)}
                      </span>
                    </div>
                    <span className="text-xs text-red-600 font-medium">
                      Economia de R$ {(getOriginalMinPrice() - getMinPrice()).toFixed(2)}
                    </span>
                  </div>
                ) : (
                  <span className="text-lg font-bold text-purple-600">
                    A partir de R$ {getMinPrice().toFixed(2)}
                  </span>
                )}
                <span className="text-xs text-gray-500">
                  {product.sizes.length} tamanho{product.sizes.length > 1 ? 's' : ''} disponível{product.sizes.length > 1 ? 'eis' : ''}
                </span>
              </>
            )}
          </div>
          
          <button 
            className="bg-purple-600 text-white p-3 rounded-full hover:bg-purple-700 transition-colors duration-200 shadow-lg hover:shadow-xl transform hover:scale-110"
            aria-label="Ver detalhes do produto"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;