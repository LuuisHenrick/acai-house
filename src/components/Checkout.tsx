import React, { useState } from 'react';
import { X, CreditCard, Wallet, QrCode } from 'lucide-react';
import { useCart } from '../context/CartContext';

interface CheckoutForm {
  name: string;
  phone: string;
  email: string;
  deliveryType: 'delivery' | 'pickup';
  address?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  paymentMethod: 'credit' | 'cash' | 'pix';
  needChange: boolean;
  changeAmount?: string;
}

export default function Checkout() {
  const { isCheckoutOpen, setIsCheckoutOpen, total, items, clearCart } = useCart();
  const [form, setForm] = useState<CheckoutForm>({
    name: '',
    phone: '',
    email: '',
    deliveryType: 'delivery',
    paymentMethod: 'credit',
    needChange: false
  });

  if (!isCheckoutOpen) return null;

  const formatOrderForWhatsApp = () => {
    const paymentMethods = {
      credit: 'Cartão de Crédito',
      cash: 'Dinheiro',
      pix: 'PIX'
    };

    let message = '🍨 *NOVO PEDIDO* 🍨\n\n';
    
    // Dados do Cliente
    message += '*DADOS DO CLIENTE*\n';
    message += `Nome: ${form.name}\n`;
    message += `Telefone: ${form.phone}\n`;
    message += `Email: ${form.email}\n\n`;

    // Tipo de Entrega
    message += '*ENTREGA*\n';
    message += `Tipo: ${form.deliveryType === 'delivery' ? 'Entrega' : 'Retirada'}\n`;
    
    // Endereço (se for entrega)
    if (form.deliveryType === 'delivery' && form.address) {
      message += `Endereço: ${form.address}\n`;
      message += `Número: ${form.number}\n`;
      if (form.complement) message += `Complemento: ${form.complement}\n`;
      message += `Bairro: ${form.neighborhood}\n\n`;
    }

    // Itens do Pedido
    message += '*ITENS DO PEDIDO*\n';
    items.forEach(item => {
      message += `• ${item.quantity}x ${item.name} (${item.size})\n`;
      if (item.toppings.length > 0) {
        message += '  *Adicionais:*\n';
        item.toppings.forEach((topping: any) => {
          message += `    - ${topping.name} (+R$ ${topping.price.toFixed(2)})\n`;
        });
      }
      const itemTotal = (item.price + item.toppings.reduce((sum: number, t: any) => sum + t.price, 0)) * item.quantity;
      message += `  Subtotal: R$ ${itemTotal.toFixed(2)}\n\n`;
    });
    message += `\n*Total: R$ ${total.toFixed(2)}*\n\n`;

    // Pagamento
    message += '*PAGAMENTO*\n';
    message += `Método: ${paymentMethods[form.paymentMethod]}\n`;
    if (form.paymentMethod === 'cash' && form.needChange) {
      message += `Troco para: R$ ${form.changeAmount}\n`;
    }

    return encodeURIComponent(message);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Formata a mensagem e redireciona para o WhatsApp
    const message = formatOrderForWhatsApp();
    const whatsappUrl = `https://wa.me/5531993183738?text=${message}`;
    
    // Limpa o carrinho e fecha o checkout
    clearCart();
    setIsCheckoutOpen(false);
    
    // Abre o WhatsApp em uma nova aba
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto">
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-xl font-semibold">Finalizar Pedido</h2>
            <button
              onClick={() => setIsCheckoutOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-full transition"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Dados Pessoais */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Dados Pessoais</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Nome completo"
                  required
                  className="w-full p-3 border rounded-lg"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                />
                <input
                  type="tel"
                  placeholder="Telefone"
                  required
                  className="w-full p-3 border rounded-lg"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                />
                <input
                  type="email"
                  placeholder="E-mail"
                  required
                  className="w-full p-3 border rounded-lg md:col-span-2"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </div>

            {/* Tipo de Entrega */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Tipo de Entrega</h3>
              <div className="flex gap-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="deliveryType"
                    value="delivery"
                    checked={form.deliveryType === 'delivery'}
                    onChange={e => setForm({ ...form, deliveryType: e.target.value as 'delivery' | 'pickup' })}
                    className="text-purple-600"
                  />
                  <span>Entrega</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                     name="deliveryType"
                    value="pickup"
                    checked={form.deliveryType === 'pickup'}
                    onChange={e => setForm({ ...form, deliveryType: e.target.value as 'delivery' | 'pickup' })}
                    className="text-purple-600"
                  />
                  <span>Retirada</span>
                </label>
              </div>
            </div>

            {/* Endereço (apenas se for entrega) */}
            {form.deliveryType === 'delivery' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Endereço de Entrega</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Endereço"
                    required
                    className="w-full p-3 border rounded-lg md:col-span-2"
                    value={form.address}
                    onChange={e => setForm({ ...form, address: e.target.value })}
                  />
                  <input
                    type="text"
                    placeholder="Número"
                    required
                    className="w-full p-3 border rounded-lg"
                    value={form.number}
                    onChange={e => setForm({ ...form, number: e.target.value })}
                  />
                  <input
                    type="text"
                    placeholder="Complemento"
                    className="w-full p-3 border rounded-lg"
                    value={form.complement}
                    onChange={e => setForm({ ...form, complement: e.target.value })}
                  />
                  <input
                    type="text"
                    placeholder="Bairro"
                    required
                    className="w-full p-3 border rounded-lg md:col-span-2"
                    value={form.neighborhood}
                    onChange={e => setForm({ ...form, neighborhood: e.target.value })}
                  />
                </div>
              </div>
            )}

            {/* Forma de Pagamento */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Forma de Pagamento</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="credit"
                    checked={form.paymentMethod === 'credit'}
                    onChange={e => setForm({ ...form, paymentMethod: e.target.value as 'credit' | 'cash' | 'pix' })}
                    className="text-purple-600"
                  />
                  <div className="ml-2 flex items-center">
                    <CreditCard className="h-5 w-5 mr-2" />
                    <span>Cartão</span>
                  </div>
                </label>
                <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cash"
                    checked={form.paymentMethod === 'cash'}
                    onChange={e => setForm({ ...form, paymentMethod: e.target.value as 'credit' | 'cash' | 'pix' })}
                    className="text-purple-600"
                  />
                  <div className="ml-2 flex items-center">
                    <Wallet className="h-5 w-5 mr-2" />
                    <span>Dinheiro</span>
                  </div>
                </label>
                <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="pix"
                    checked={form.paymentMethod === 'pix'}
                    onChange={e => setForm({ ...form, paymentMethod: e.target.value as 'credit' | 'cash' | 'pix' })}
                    className="text-purple-600"
                  />
                  <div className="ml-2 flex items-center">
                    <QrCode className="h-5 w-5 mr-2" />
                    <span>PIX</span>
                  </div>
                </label>
              </div>

              {/* Troco (apenas se for dinheiro) */}
              {form.paymentMethod === 'cash' && (
                <div className="mt-4 space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={form.needChange}
                      onChange={e => setForm({ ...form, needChange: e.target.checked })}
                      className="text-purple-600"
                    />
                    <span>Precisa de troco?</span>
                  </label>
                  {form.needChange && (
                    <input
                      type="text"
                      placeholder="Troco para quanto?"
                      className="w-full p-3 border rounded-lg"
                      value={form.changeAmount}
                      onChange={e => setForm({ ...form, changeAmount: e.target.value })}
                    />
                  )}
                </div>
              )}
            </div>

            {/* Resumo do Pedido */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Resumo do Pedido</h3>
              <div className="space-y-2">
                {items.map(item => (
                  <div key={`${item.id}-${item.size}`} className="space-y-1">
                    <div className="flex justify-between">
                      <span>{item.quantity}x {item.name} ({item.size})</span>
                      <span>R$ {(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                    {item.toppings.length > 0 && (
                      <div className="pl-4 text-sm text-gray-600">
                        <p>Adicionais:</p>
                        {item.toppings.map((topping: any) => (
                          <div key={topping.id} className="flex justify-between">
                            <span>{topping.name}</span>
                            <span>+R$ {(topping.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                <div className="border-t pt-2 font-bold">
                  <div className="flex justify-between">
                    <span>Total</span>
                    <span>R$ {total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold
                hover:bg-purple-700 transition"
            >
              Confirmar Pedido
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}