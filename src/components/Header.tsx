import React, { useState } from 'react';
import { ShoppingCart, Menu, X, Package } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useSiteSettings } from '../context/SiteSettingsContext';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { items, setIsCartOpen } = useCart();
  const { settings } = useSiteSettings();
  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const handleLogoError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.style.display = 'none';
    // Show fallback icon
    const fallback = e.currentTarget.nextElementSibling as HTMLElement;
    if (fallback) {
      fallback.style.display = 'block';
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-purple-900 text-white shadow-lg z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-3">
            <div className="relative">
              <img
                src={settings.logo_url}
                alt={settings.logo_alt_text}
                className="h-10 w-10 object-contain rounded-lg"
                onError={handleLogoError}
              />
              <Package 
                className="h-10 w-10 text-purple-200 hidden" 
                style={{ display: 'none' }}
              />
            </div>
            <div className="font-bold text-2xl">
              {settings.site_name}
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            <a href="#" className="hover:text-purple-200 transition">Início</a>
            <a href="#menu" className="hover:text-purple-200 transition">Cardápio</a>
            <a href="#promotions" className="hover:text-purple-200 transition">Promoções</a>
            <a href="#about" className="hover:text-purple-200 transition">Sobre Nós</a>
            <a href="#contact" className="hover:text-purple-200 transition">Contato</a>
          </nav>

          {/* Cart Icon */}
          <div className="flex items-center">
            <button 
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 hover:bg-purple-800 rounded-full transition"
            >
              <ShoppingCart className="h-6 w-6" />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 hover:bg-purple-800 rounded-lg transition"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <a href="#" className="block px-3 py-2 hover:bg-purple-800 rounded-md">Início</a>
              <a href="#menu" className="block px-3 py-2 hover:bg-purple-800 rounded-md">Cardápio</a>
              <a href="#promotions" className="block px-3 py-2 hover:bg-purple-800 rounded-md">Promoções</a>
              <a href="#about" className="block px-3 py-2 hover:bg-purple-800 rounded-md">Sobre Nós</a>
              <a href="#contact" className="block px-3 py-2 hover:bg-purple-800 rounded-md">Contato</a>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}