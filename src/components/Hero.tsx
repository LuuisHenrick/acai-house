import React from 'react';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { OptimizedMedia } from '../utils/mediaUtils';

export default function Hero() {
  const { settings } = useSiteSettings();

  const backgroundImage = settings.hero_background_url;
  };
  return (
    <div id="hero" className="relative h-screen">
      {/* Background Media Otimizada */}
      <OptimizedMedia
        src={backgroundImage}
        alt="Açaí House Background"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ 
          objectFit: 'cover',
          objectPosition: 'center'
        }}
        loading="eager"
        fallbackSrc="/Banner Acai House 3.png"
      />
      
      {/* Overlay escuro */}
      <div className="absolute inset-0 bg-black bg-opacity-30"></div>
      
      <div className="relative h-full flex items-center justify-center text-center text-white px-4">
        <div className="max-w-3xl">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 drop-shadow-lg">
            Açaí House o melhor da região Oeste!
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl mb-6 sm:mb-8 drop-shadow-md">
            Deliciosas combinações de açaí com as melhores frutas e complementos
          </p>
          <button
            onClick={() => {
              const menuElement = document.getElementById('menu');
              if (menuElement) {
                menuElement.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className="inline-block bg-purple-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full text-base sm:text-lg font-semibold hover:bg-purple-700 transition transform hover:scale-105 shadow-lg"
          >
            Ver Cardápio
          </button>
        </div>
      </div>
    </div>
  );
}