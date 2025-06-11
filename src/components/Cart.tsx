import React, { useState } from 'react';
import { X, Minus, Plus, ShoppingBag, Edit2 } from 'lucide-react';
import { useCart } from '../context/CartContext';

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

  const toggleTopping = (topping: typeof toppings[0]) => {
    setSelectedToppings(current => {
      const exists = current.find(t => t.id === topping.id);
      if (exists) {
        return current.filter(t => t.id !== topping.id);
      }
      return [...current, topping];
    });
  };

  const handleSave = () => {
    updateToppings(item.id, selectedToppings);
    onClose();
  };

  const calculateTotal = () => {
    const toppingsTotal = selectedToppings.reduce((sum, topping) => sum + topping.price, 0);
    return item.price + toppingsTotal;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold">Editar Adicionais</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
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
                      checked={selectedToppings.some(t => t.id === topping.id)}
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
                R$ {calculateTotal().toFixed(2)}
              </span>
            </div>

            <button
              onClick={handleSave}
              className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold
                hover:bg-purple-700 transition"
            >
              Salvar Alterações
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
    total
  } = useCart();

  const [editingItem, setEditingItem] = useState<any>(null);

  const handleCheckout = () => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  const calculateItemTotal = (item: any) => {
    const toppingsTotal = item.toppings.reduce((sum: number, topping: any) => sum + topping.price, 0);
    return (item.price + toppingsTotal) * item.quantity;
  };

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
                {items.map((item) => (
                  <div key={`${item.id}-${item.size}`} className="bg-white p-4 rounded-lg shadow">
                    <div className="flex items-center space-x-4">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-20 h-20 object-cover rounded"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold">{item.name}</h3>
                        <p className="text-sm text-gray-500">Tamanho: {item.size}</p>
                        
                        {/* Toppings */}
                        {item.toppings.length > 0 && (
                          <div className="mt-1 text-sm text-gray-600">
                            <p>Adicionais:</p>
                            <ul className="list-disc list-inside">
                              {item.toppings.map((topping: any) => (
                                <li key={topping.id} className="text-sm">
                                  {topping.name} (+R$ {topping.price.toFixed(2)})
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <p className="text-purple-600 font-semibold mt-2">
                          R$ {calculateItemTotal(item).toFixed(2)}
                        </p>
                        
                        <div className="flex items-center space-x-2 mt-2">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="p-1 hover:bg-gray-100 rounded-full transition"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="p-1 hover:bg-gray-100 rounded-full transition"
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
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t p-4">
            <div className="flex justify-between items-center mb-4">
              <span className="font-semibold">Total</span>
              <span className="text-xl font-bold text-purple-600">
                R$ {total.toFixed(2)}
              </span>
            </div>
            <button
              onClick={handleCheckout}
              disabled={items.length === 0}
              className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold
                hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
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