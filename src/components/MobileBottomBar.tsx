import React from 'react';
import { ArrowUp, ShoppingCart, Home, Package } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function MobileBottomBar() {
  const { items, setIsCartOpen } = useCart();
  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40 md:hidden">
      <div className="grid grid-cols-3 h-16">
        {/* Home */}
        <button
          onClick={() => scrollToSection('hero')}
          className="flex flex-col items-center justify-center space-y-1 hover:bg-gray-50 transition"
          aria-label="Início"
        >
          <Home className="h-5 w-5 text-gray-600" />
          <span className="text-xs text-gray-600">Início</span>
        </button>

        {/* Cardápio */}
        <button
          onClick={() => scrollToSection('menu')}
          className="flex flex-col items-center justify-center space-y-1 hover:bg-gray-50 transition"
          aria-label="Cardápio"
        >
          <Package className="h-5 w-5 text-gray-600" />
          <span className="text-xs text-gray-600">Cardápio</span>
        </button>

        {/* Carrinho */}
        <button
          onClick={() => setIsCartOpen(true)}
          className="flex flex-col items-center justify-center space-y-1 hover:bg-gray-50 transition relative"
          aria-label="Carrinho"
        >
          <div className="relative">
            <ShoppingCart className="h-5 w-5 text-gray-600" />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center min-w-[16px]">
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
          </div>
          <span className="text-xs text-gray-600">Carrinho</span>
        </button>

        {/* Voltar ao topo */}
        <button
          onClick={scrollToTop}
          className="flex flex-col items-center justify-center space-y-1 hover:bg-gray-50 transition"
          aria-label="Voltar ao topo"
        >
          <ArrowUp className="h-5 w-5 text-gray-600" />
          <span className="text-xs text-gray-600">Topo</span>
        </button>
      </div>
    </div>
  );
}