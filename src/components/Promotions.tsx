import React, { useState, useEffect } from 'react';
import { Timer, Gift, Share2, ShoppingBag, Shield, Truck } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { supabase } from '../lib/supabase';

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

function CountdownTimer({ endDate }: { endDate: string }) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const end = new Date(endDate).getTime();
      const now = new Date().getTime();
      const distance = end - now;

      if (distance < 0) {
        clearInterval(timer);
        return;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000)
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [endDate]);

  return (
    <div className="flex items-center space-x-4">
      <Timer className="h-6 w-6 text-purple-600" />
      <div className="flex space-x-2">
        <div className="bg-purple-600 text-white px-3 py-2 rounded-lg">
          {String(timeLeft.days).padStart(2, '0')}d
        </div>
        <div className="bg-purple-600 text-white px-3 py-2 rounded-lg">
          {String(timeLeft.hours).padStart(2, '0')}h
        </div>
        <div className="bg-purple-600 text-white px-3 py-2 rounded-lg">
          {String(timeLeft.minutes).padStart(2, '0')}m
        </div>
        <div className="bg-purple-600 text-white px-3 py-2 rounded-lg">
          {String(timeLeft.seconds).padStart(2, '0')}s
        </div>
      </div>
    </div>
  );
}

export default function Promotions() {
  const { addToCart } = useCart();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPromotions();
  }, []);

  const loadPromotions = async () => {
    try {
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .eq('active', true)
        .lte('start_date', new Date().toISOString())
        .gte('end_date', new Date().toISOString())
        .order('is_flash', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPromotions(data || []);
    } catch (error) {
      console.error('Error loading promotions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = (promotion: Promotion) => {
    const text = `Aproveite esta promoção incrível na Açaí House! ${promotion.title} por apenas R$ ${promotion.promo_price.toFixed(2)}! ${window.location.href}#promotions`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Promoção Açaí House',
        text: text,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(text);
      alert('Link copiado para a área de transferência!');
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  if (isLoading) {
    return (
      <section id="promotions" className="py-20 bg-gradient-to-b from-purple-50 to-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin h-8 w-8 border-4 border-purple-600 border-t-transparent rounded-full"></div>
          </div>
        </div>
      </section>
    );
  }

  if (promotions.length === 0) {
    return null; // Don't show the section if there are no active promotions
  }

  return (
    <section id="promotions" className="py-20 bg-gradient-to-b from-purple-50 to-white">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            🔥 Ofertas Imperdíveis!
          </h2>
          <p className="text-xl text-gray-600">
            Aproveite nossas promoções especiais por tempo limitado
          </p>
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center">
            <Truck className="h-12 w-12 text-purple-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Frete Grátis</h3>
            <p className="text-gray-600">Em pedidos acima de R$ 50,00</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg text-center">
            <Gift className="h-12 w-12 text-purple-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Brinde Especial</h3>
            <p className="text-gray-600">Em compras acima de R$ 100,00</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg text-center">
            <Shield className="h-12 w-12 text-purple-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Satisfação Garantida</h3>
            <p className="text-gray-600">Qualidade em cada pedido</p>
          </div>
        </div>

        {/* Promotions Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {promotions.map(promo => (
            <div key={promo.id} className="bg-white rounded-lg shadow-xl overflow-hidden">
              <div className="relative">
                <img
                  src={promo.image_url || 'https://images.unsplash.com/photo-1596463119248-53c8d33d2739?auto=format&fit=crop&q=80'}
                  alt={promo.title}
                  className="w-full h-64 object-cover"
                />
                {promo.is_flash && (
                  <div className="absolute top-4 left-4 bg-red-500 text-white px-4 py-2 rounded-full text-sm font-semibold animate-pulse">
                    Promoção Relâmpago!
                  </div>
                )}
                <div className="absolute top-4 right-4 bg-purple-600 text-white px-4 py-2 rounded-full text-lg font-bold">
                  -{promo.discount_percentage}%
                </div>
              </div>

              <div className="p-6">
                <h3 className="text-2xl font-bold mb-2">{promo.title}</h3>
                <p className="text-gray-600 mb-4">{promo.description}</p>

                <div className="flex items-center justify-between mb-6">
                  <div>
                    <span className="text-gray-400 line-through text-lg">
                      R$ {promo.original_price.toFixed(2)}
                    </span>
                    <span className="text-3xl font-bold text-purple-600 ml-3">
                      R$ {promo.promo_price.toFixed(2)}
                    </span>
                  </div>
                  <CountdownTimer endDate={promo.end_date} />
                </div>

                {promo.coupon_code && (
                  <div className="bg-purple-50 p-4 rounded-lg mb-6">
                    <p className="text-sm text-purple-600 mb-2">Use o cupom:</p>
                    <div className="flex items-center justify-between bg-white border-2 border-purple-200 rounded-lg p-2">
                      <code className="text-lg font-mono font-bold text-purple-600">
                        {promo.coupon_code}
                      </code>
                      <button
                        onClick={() => copyCode(promo.coupon_code!)}
                        className="text-purple-600 hover:text-purple-700 text-sm font-semibold"
                      >
                        {copiedCode === promo.coupon_code ? 'Copiado!' : 'Copiar'}
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => addToCart({
                      id: promo.id,
                      name: promo.title,
                      price: promo.promo_price,
                      image: promo.image_url || 'https://images.unsplash.com/photo-1596463119248-53c8d33d2739?auto=format&fit=crop&q=80'
                    }, 'M', [])}
                    className="flex-1 bg-purple-600 text-white py-3 rounded-lg font-semibold
                      hover:bg-purple-700 transition flex items-center justify-center"
                  >
                    <ShoppingBag className="h-5 w-5 mr-2" />
                    Aproveitar Agora
                  </button>
                  <button
                    onClick={() => handleShare(promo)}
                    className="p-3 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition"
                  >
                    <Share2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Social Proof */}
        <div className="mt-16 text-center bg-purple-900 text-white py-12 px-4 rounded-2xl">
          <h3 className="text-2xl font-bold mb-4">
            Mais de 10.000 clientes já aproveitaram nossas promoções!
          </h3>
          <p className="text-purple-200 text-lg">
            Junte-se a milhares de clientes satisfeitos e aproveite as melhores ofertas de açaí da região
          </p>
        </div>
      </div>
    </section>
  );
}