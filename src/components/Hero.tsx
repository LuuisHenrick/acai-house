import React from 'react';
import { useSiteSettings } from '../context/SiteSettingsContext';

export default function Hero() {
  const { settings } = useSiteSettings();

  return (
    <div className="relative h-screen">
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-500"
        style={{
          backgroundImage: `url("${settings.hero_background_url}")`,
        }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-50"></div>
      </div>
      
      <div className="relative h-full flex items-center justify-center text-center text-white px-4">
        <div className="max-w-3xl">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Açaí House o melhor da região Oeste!
          </h1>
          <p className="text-xl md:text-2xl mb-8">
            Deliciosas combinações de açaí com as melhores frutas e complementos
          </p>
          <a
            href="#menu"
            className="inline-block bg-purple-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-purple-700 transition transform hover:scale-105"
          >
            Ver Cardápio
          </a>
        </div>
      </div>
    </div>
  );
}