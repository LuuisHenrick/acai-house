import React, { useState, useEffect } from 'react';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';

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
  product_categories?: {
    name: string;
    slug: string;
  };
}

interface ProductCardProps {
  product: Product;
  onClick: () => void;
}

export default function ProductCard({ product, onClick }: ProductCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Get all active images, sorted by display_order
  const activeImages = product.images
    ?.filter(img => img.is_active)
    ?.sort((a, b) => a.display_order - b.display_order) || [];

  // Fallback to a default image if no images are available
  const images = activeImages.length > 0 
    ? activeImages 
    : [{ 
        id: 'default', 
        image_url: 'https://images.unsplash.com/photo-1596463119248-53c8d33d2739?auto=format&fit=crop&q=80',
        alt_text: product.name,
        display_order: 1,
        is_primary: true,
        is_active: true
      }];

  const hasMultipleImages = images.length > 1;

  // Auto-advance carousel every 5 seconds when not hovered
  useEffect(() => {
    if (!hasMultipleImages || isHovered) return;

    const interval = setInterval(() => {
      setCurrentImageIndex(prev => (prev + 1) % images.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [hasMultipleImages, isHovered, images.length]);

  const goToPrevious = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex(prev => prev === 0 ? images.length - 1 : prev - 1);
  };

  const goToNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex(prev => (prev + 1) % images.length);
  };

  const goToImage = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex(index);
  };

  const getMinPrice = () => {
    if (product.sizes.length === 0) return 0;
    return Math.min(...product.sizes.map(s => s.price));
  };

  return (
    <div
      className="bg-white rounded-lg shadow-lg overflow-hidden transform hover:scale-105 transition-all duration-300 cursor-pointer group"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden">
        {/* Main Image */}
        <div className="relative w-full h-full">
          <img
            src={images[currentImageIndex].image_url}
            alt={images[currentImageIndex].alt_text || product.name}
            className="w-full h-full object-cover transition-opacity duration-500"
            style={{ 
              objectFit: 'cover',
              objectPosition: 'center'
            }}
            onError={(e) => {
              e.currentTarget.src = 'https://images.unsplash.com/photo-1596463119248-53c8d33d2739?auto=format&fit=crop&q=80';
            }}
          />
          
          {/* Gradient overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>

        {/* Navigation arrows (only show if multiple images and hovered) */}
        {hasMultipleImages && isHovered && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 p-2 rounded-full shadow-lg transition-all duration-200 opacity-0 group-hover:opacity-100"
              aria-label="Imagem anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 p-2 rounded-full shadow-lg transition-all duration-200 opacity-0 group-hover:opacity-100"
              aria-label="Próxima imagem"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}

        {/* Image indicators (dots) */}
        {hasMultipleImages && (
          <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-2">
            {images.map((_, index) => (
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
            {currentImageIndex + 1}/{images.length}
          </div>
        )}

        {/* Add to cart button overlay */}
        <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
            className="bg-purple-600 text-white p-2 rounded-full hover:bg-purple-700 transition-colors duration-200 shadow-lg"
            aria-label="Adicionar ao carrinho"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-6">
        <h3 className="text-xl font-semibold mb-2 text-gray-900 line-clamp-2">
          {product.name}
        </h3>
        <p className="text-gray-600 mb-4 text-sm line-clamp-3 leading-relaxed">
          {product.description}
        </p>
        
        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            {product.sizes.length > 0 && (
              <>
                <span className="text-lg font-bold text-purple-600">
                  A partir de R$ {getMinPrice().toFixed(2)}
                </span>
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
}