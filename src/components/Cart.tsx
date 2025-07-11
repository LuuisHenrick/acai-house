import React, { useState, useCallback, useMemo } from 'react';
import { X, Minus, Plus, ShoppingBag, Edit2, Tag, Trash2, Gift } from 'lucide-react';
import { useCart } from '../context/CartContext';
import Spinner from './Spinner';

interface EditToppingsModalProps {
  item: any;
  onClose: () => void;
}

const toppings = [
  { id: 'leite-po', name: 'Leite em pó', price: 2.00 },
  { id: 'pacoca', name: 'Paçoca', price: 2.50 },
  { id: 'leite-condensado', name: 'Leite condensado', price: 3.00 },
  { id: 'granola', name: 'Granola extra', price: 2.00 },
  { id: 'morango', name: 'Morango', price: 3.50 },
  { id: 'banana', name: 'Banana', price: 2.00 }
];

function EditToppingsModal({ item, onClose }: EditToppingsModalProps) {
  const { updateToppings } = useCart();
  const [selectedToppings, setSelectedToppings] = useState(item.toppings);
  const [isLoading, setIsLoading] = useState(false);

  const toggleTopping = useCallback((topping: typeof toppings[0]) => {
    setSelectedToppings((current: any[]) => {
      const exists = current.find(t => t.id === topping.id);
      if (exists) {
        return current.filter(t => t.id !== topping.id);
      }
      return [...current, topping];
    });
  }, []);

  const handleSave = useCallback(async () => {
    setIsLoading(true);
    try {
      await updateToppings(item.id, selectedToppings);
      onClose();
    } catch (error) {
      console.error('Error updating toppings:', error);
    } finally {
      setIsLoading(false);
    }
  }, [item.id, selectedToppings, updateToppings, onClose]);

  const calculateTotal = useMemo(() => {
    const toppingsTotal = selectedToppings.reduce((sum: number, topping: any) => sum + topping.price, 0);
    return item.price + toppingsTotal;
  }, [selectedToppings, item.price]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold">Editar Adicionais</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4">
          <div className="mb-6">
            <h4 className="font-semibold mb-3">Adicionais</h4>
            <div className="space-y-3">
              {toppings.map(topping => (
                <label
                  key={topping.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                >
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedToppings.some((t: any) => t.id === topping.id)}
                      onChange={() => toggleTopping(topping)}
                      className="h-5 w-5 text-purple-600 rounded"
                    />
                    <span className="ml-3">{topping.name}</span>
                  </div>
                  <span className="text-purple-600 font-medium">
                    +R$ {topping.price.toFixed(2)}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-semibold">Total por unidade</span>
              <span className="text-xl font-bold text-purple-600">
                R$ {calculateTotal.toFixed(2)}
              </span>
            </div>

            <button
              onClick={handleSave}
              disabled={isLoading}
              className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-50 flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <Spinner size="sm" color="white" className="mr-2" />
                  Salvando...
                </>
              ) : (
                'Salvar Alterações'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Cart() {
  const {
    items,
    isCartOpen,
    setIsCartOpen,
    setIsCheckoutOpen,
    updateQuantity,
    removeFromCart,
    total,
    appliedPromotion,
    couponError,
    applyCoupon,
    removeCoupon
  } = useCart();

  const [editingItem, setEditingItem] = useState<any>(null);
  const [couponCode, setCouponCode] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  const handleCheckout = useCallback(() => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  }, [setIsCartOpen, setIsCheckoutOpen]);

  const calculateItemTotal = useCallback((item: any) => {
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
    
    const toppingsTotal = item.toppings.reduce((sum: number, topping: any) => sum + topping.price, 0);
    return (itemPrice + toppingsTotal) * item.quantity;
  }, [appliedPromotion]);

  const calculateOriginalItemTotal = useCallback((item: any) => {
    const toppingsTotal = item.toppings.reduce((sum: number, topping: any) => sum + topping.price, 0);
    return (item.price + toppingsTotal) * item.quantity;
  }, []);

  const handleApplyCoupon = useCallback(async () => {
    if (!couponCode.trim()) return;
    
    setIsApplyingCoupon(true);
    try {
      await applyCoupon(couponCode);
      setCouponCode('');
    } finally {
      setIsApplyingCoupon(false);
    }
  }, [couponCode, applyCoupon]);

  const { originalTotal, savings } = useMemo(() => {
    const originalTotal = items.reduce((sum, item) => calculateOriginalItemTotal(item), 0);
    const savings = originalTotal - total;
    return { originalTotal, savings };
  }, [items, calculateOriginalItemTotal, total]);

  const optimizeImageUrl = useCallback((url: string) => {
    if (url.includes('supabase.co')) {
      return `${url}?width=200&quality=70`;
    }
    return url;
  }, []);

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-lg">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">Carrinho</h2>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-full transition"
              aria-label="Fechar carrinho"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-4">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <ShoppingBag className="h-12 w-12 mb-2" />
                <p>Seu carrinho está vazio</p>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item, index) => {
                  const itemKey = `${item.id}-${item.size}-${JSON.stringify(item.toppings)}`;
                  const originalItemTotal = calculateOriginalItemTotal(item);
                  const currentItemTotal = calculateItemTotal(item);
                  const hasDiscount = originalItemTotal > currentItemTotal;
                  
                  return (
                    <div key={itemKey} className="bg-white p-4 rounded-lg shadow border">
                      <div className="flex items-center space-x-4">
                        <img
                          src={optimizeImageUrl(item.image)}
                          alt={item.name}
                          className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded"
                          loading="lazy"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate">{item.name}</h3>
                          <p className="text-sm text-gray-500">Tamanho: {item.size}</p>
                          
                          {/* Toppings */}
                          {item.toppings.length > 0 && (
                            <div className="mt-1 text-sm text-gray-600">
                              <p>Adicionais:</p>
                              <ul className="list-disc list-inside">
                                {item.toppings.map((topping: any) => (
                                  <li key={topping.id} className="text-sm truncate">
                                    {topping.name} (+R$ {topping.price.toFixed(2)})
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Price with discount indicator */}
                          <div className="mt-2">
                            {hasDiscount ? (
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-400 line-through">
                                  R$ {originalItemTotal.toFixed(2)}
                                </span>
                                <span className="text-purple-600 font-semibold">
                                  R$ {currentItemTotal.toFixed(2)}
                                </span>
                                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                  -{appliedPromotion?.discount_percentage}%
                                </span>
                              </div>
                            ) : (
                              <span className="text-purple-600 font-semibold">
                                R$ {currentItemTotal.toFixed(2)}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-2 mt-2">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="p-1 hover:bg-gray-100 rounded-full transition"
                              aria-label="Diminuir quantidade"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="w-8 text-center">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="p-1 hover:bg-gray-100 rounded-full transition"
                              aria-label="Aumentar quantidade"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setEditingItem(item)}
                              className="p-1 hover:bg-gray-100 rounded-full transition ml-2"
                              title="Editar adicionais"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="ml-2 text-red-500 hover:text-red-600 transition"
                              aria-label="Remover item"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Coupon Section */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-3 flex items-center">
                    <Tag className="h-5 w-5 mr-2 text-purple-600" />
                    Cupom de Desconto
                  </h4>
                  
                  {appliedPromotion ? (
                    <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-green-800">
                            Cupom {appliedPromotion.coupon_code} aplicado!
                          </p>
                          <p className="text-sm text-green-600">
                            {appliedPromotion.discount_percentage}% de desconto em {appliedPromotion.product_name}
                          </p>
                        </div>
                        <button
                          onClick={removeCoupon}
                          className="text-red-500 hover:text-red-700 transition"
                          title="Remover cupom"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          placeholder="Digite o código do cupom"
                          className="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          onKeyPress={(e) => e.key === 'Enter' && handleApplyCoupon()}
                        />
                        <button
                          onClick={handleApplyCoupon}
                          disabled={!couponCode.trim() || isApplyingCoupon}
                          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        >
                          {isApplyingCoupon ? (
                            <Spinner size="sm" color="white" />
                          ) : (
                            'Aplicar'
                          )}
                        </button>
                      </div>
                      
                      {couponError && (
                        <div className="bg-red-50 border border-red-200 text-red-600 p-2 rounded text-sm">
                          {couponError}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t p-4">
            {savings > 0 && (
              <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-green-800 font-medium flex items-center">
                    <Gift className="h-4 w-4 mr-2" />
                    Você está economizando:
                  </span>
                  <span className="text-green-600 font-bold">
                    R$ {savings.toFixed(2)}
                  </span>
                </div>
              </div>
            )}
            
            <div className="flex justify-between items-center mb-4">
              <span className="font-semibold">Total</span>
              <div className="text-right">
                {savings > 0 && (
                  <div className="text-sm text-gray-400 line-through">
                    R$ {originalTotal.toFixed(2)}
                  </div>
                )}
                <span className="text-xl font-bold text-purple-600">
                  R$ {total.toFixed(2)}
                </span>
              </div>
            </div>
            <button
              onClick={handleCheckout}
              disabled={items.length === 0}
              className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Finalizar Pedido
            </button>
          </div>
        </div>
      </div>

      {editingItem && (
        <EditToppingsModal
          item={editingItem}
          onClose={() => setEditingItem(null)}
        />
      )}
    </div>
  );
}