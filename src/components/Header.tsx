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

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsMenuOpen(false);
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
                className="h-8 w-8 sm:h-10 sm:w-10 object-contain rounded-lg"
                loading="lazy"
                onError={handleLogoError}
              />
              <Package 
                className="h-8 w-8 sm:h-10 sm:w-10 text-purple-200 hidden" 
                style={{ display: 'none' }}
              />
            </div>
            <div className="font-bold text-lg sm:text-2xl truncate">
              {settings.site_name}
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            <button onClick={() => scrollToSection('hero')} className="hover:text-purple-200 transition">Início</button>
            <button onClick={() => scrollToSection('menu')} className="hover:text-purple-200 transition">Cardápio</button>
            <button onClick={() => scrollToSection('about')} className="hover:text-purple-200 transition">Sobre Nós</button>
            <button onClick={() => scrollToSection('contact')} className="hover:text-purple-200 transition">Contato</button>
          </nav>

          {/* Cart Icon */}
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 hover:bg-purple-800 rounded-full transition"
              aria-label="Abrir carrinho"
            >
              <ShoppingCart className="h-6 w-6" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center min-w-[20px]">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </button>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 hover:bg-purple-800 rounded-lg transition"
                aria-label="Menu"
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-purple-800">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <button 
                onClick={() => scrollToSection('hero')} 
                className="block w-full text-left px-3 py-2 hover:bg-purple-800 rounded-md transition"
              >
                Início
              </button>
              <button 
                onClick={() => scrollToSection('menu')} 
                className="block w-full text-left px-3 py-2 hover:bg-purple-800 rounded-md transition"
              >
                Cardápio
              </button>
              <button 
                onClick={() => scrollToSection('about')} 
                className="block w-full text-left px-3 py-2 hover:bg-purple-800 rounded-md transition"
              >
                Sobre Nós
              </button>
              <button 
                onClick={() => scrollToSection('contact')} 
                className="block w-full text-left px-3 py-2 hover:bg-purple-800 rounded-md transition"
              >
                Contato
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}