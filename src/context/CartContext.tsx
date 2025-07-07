import React, { createContext, useContext, useState } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface Topping {
  id: string;
  name: string;
  price: number;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  size: string;
  image: string;
  toppings: Topping[];
}

interface Promotion {
  id: string;
  title: string;
  description: string;
  product_name: string;
  original_price: number;
  promo_price: number;
  discount_percentage: number;
  coupon_code?: string;
  start_date: string;
  end_date: string;
  image_url: string;
  is_flash: boolean;
  active: boolean;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: any, size: string, toppings: Topping[]) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  updateToppings: (id: string, toppings: Topping[]) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
  isCheckoutOpen: boolean;
  setIsCheckoutOpen: (isOpen: boolean) => void;
  total: number;
  appliedPromotion: Promotion | null;
  couponError: string | null;
  applyCoupon: (couponCode: string) => Promise<void>;
  removeCoupon: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [appliedPromotion, setAppliedPromotion] = useState<Promotion | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  const addToCart = (product: any, size: string, toppings: Topping[]) => {
    setItems(currentItems => {
      const existingItemIndex = currentItems.findIndex(
        item => 
          item.id === product.id && 
          item.size === size && 
          JSON.stringify(item.toppings) === JSON.stringify(toppings)
      );

      if (existingItemIndex >= 0) {
        return currentItems.map((item, index) =>
          index === existingItemIndex
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...currentItems, {
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        size,
        image: product.image,
        toppings
      }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (id: string) => {
    setItems(currentItems => currentItems.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    setItems(currentItems =>
      currentItems.map(item =>
        item.id === id ? { ...item, quantity: Math.max(0, quantity) } : item
      ).filter(item => item.quantity > 0)
    );
  };

  const updateToppings = (id: string, toppings: Topping[]) => {
    setItems(currentItems =>
      currentItems.map(item =>
        item.id === id ? { ...item, toppings } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
    setAppliedPromotion(null);
    setCouponError(null);
  };

  const applyCoupon = async (couponCode: string) => {
    if (!couponCode.trim()) {
      setCouponError('Por favor, insira um código de cupom');
      return;
    }

    setCouponError(null);

    try {
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .eq('active', true)
        .eq('coupon_code', couponCode.toUpperCase())
        .lte('start_date', new Date().toISOString())
        .gte('end_date', new Date().toISOString())
        .single();

      if (error || !data) {
        setCouponError('Cupom inválido ou expirado');
        return;
      }

      // Verificar se há produtos no carrinho que correspondem à promoção
      const hasMatchingProduct = items.some(item => 
        item.name.toLowerCase().includes(data.product_name.toLowerCase()) ||
        data.product_name.toLowerCase().includes(item.name.toLowerCase())
      );

      if (!hasMatchingProduct) {
        setCouponError(`Este cupom é válido apenas para ${data.product_name}`);
        return;
      }

      setAppliedPromotion(data);
      toast.success(`Cupom ${couponCode} aplicado! Desconto de ${data.discount_percentage}%`);
    } catch (error) {
      console.error('Error applying coupon:', error);
      setCouponError('Erro ao validar cupom. Tente novamente.');
    }
  };

  const removeCoupon = () => {
    setAppliedPromotion(null);
    setCouponError(null);
    toast.success('Cupom removido');
  };

  const calculateItemPrice = (item: CartItem) => {
    let itemPrice = item.price;
    
    // Aplicar desconto se houver promoção ativa para este produto
    if (appliedPromotion) {
      const isPromotionProduct = 
        item.name.toLowerCase().includes(appliedPromotion.product_name.toLowerCase()) ||
        appliedPromotion.product_name.toLowerCase().includes(item.name.toLowerCase());
      
      if (isPromotionProduct) {
        itemPrice = appliedPromotion.promo_price;
      }
    }
    
    return itemPrice;
  };

  const total = items.reduce((sum, item) => {
    const toppingsTotal = item.toppings.reduce((acc, topping) => acc + topping.price, 0);
    const itemPrice = calculateItemPrice(item);
    return sum + (itemPrice + toppingsTotal) * item.quantity;
  }, 0);

  const originalTotal = items.reduce((sum, item) => {
    const toppingsTotal = item.toppings.reduce((acc, topping) => acc + topping.price, 0);
    return sum + (item.price + toppingsTotal) * item.quantity;
  }, 0);

  const savings = originalTotal - total;

  return (
    <CartContext.Provider value={{
      items,
      addToCart,
      removeFromCart,
      updateQuantity,
      updateToppings,
      clearCart,
      isCartOpen,
      setIsCartOpen,
      isCheckoutOpen,
      setIsCheckoutOpen,
      total,
      appliedPromotion,
      couponError,
      applyCoupon,
      removeCoupon
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}