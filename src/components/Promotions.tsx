import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Timer, Gift, Share2, ShoppingBag, Shield, Truck, Tag, Copy, Check } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { supabase, testSupabaseConnection, isSupabaseConfigured } from '../lib/supabase';
import toast from 'react-hot-toast';
import Spinner from './Spinner';

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
    <div className="flex items-center space-x-2 sm:space-x-4">
      <Timer className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
      <div className="flex space-x-1 sm:space-x-2">
        <div className="bg-purple-600 text-white px-2 py-1 sm:px-3 sm:py-2 rounded-lg text-xs sm:text-sm">
          {String(timeLeft.days).padStart(2, '0')}d
        </div>
        <div className="bg-purple-600 text-white px-2 py-1 sm:px-3 sm:py-2 rounded-lg text-xs sm:text-sm">
          {String(timeLeft.hours).padStart(2, '0')}h
        </div>
        <div className="bg-purple-600 text-white px-2 py-1 sm:px-3 sm:py-2 rounded-lg text-xs sm:text-sm">
          {String(timeLeft.minutes).padStart(2, '0')}m
        </div>
        <div className="bg-purple-600 text-white px-2 py-1 sm:px-3 sm:py-2 rounded-lg text-xs sm:text-sm">
          {String(timeLeft.seconds).padStart(2, '0')}s
        </div>
      </div>
    </div>
  );
}

const Promotions = React.memo(() => {
  const { addToCart, applyCoupon, setIsCartOpen } = useCart();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSupabaseAvailable, setIsSupabaseAvailable] = useState(false);

  useEffect(() => {
    loadPromotions();
  }, []);

  const loadPromotions = useCallback(async () => {
    try {
      // Verificar se o Supabase está configurado
      if (!isSupabaseConfigured()) {
        console.warn('Supabase is not properly configured, hiding promotions section');
        setPromotions([]);
        setIsSupabaseAvailable(false);
        setIsLoading(false);
        return;
      }

      // Testar a conexão com timeout reduzido
      const connectionOk = await testSupabaseConnection(3000);
      setIsSupabaseAvailable(connectionOk);
      
      if (!connectionOk) {
        console.warn('Supabase connection failed, hiding promotions section');
        setPromotions([]);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .eq('active', true)
        .lte('start_date', new Date().toISOString())
        .gte('end_date', new Date().toISOString())
        .order('is_flash', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading promotions:', error);
        
        // Verificar se é erro de tabela não encontrada
        if (error.code === 'PGRST116' || error.message.includes('relation') || error.message.includes('does not exist')) {
          console.warn('Promotions table not found, hiding promotions section');
          setPromotions([]);
          return;
        }
        
        // Outros erros - não mostrar toast para não incomodar o usuário
        console.warn('Error loading promotions, hiding section:', error.message);
        setPromotions([]);
        return;
      }

      setPromotions(data || []);
    } catch (error) {
      console.error('Unexpected error loading promotions:', error);
      
      // Não mostrar toast para erros de conexão para não incomodar o usuário
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.warn('Network error loading promotions, hiding section');
      } else {
        console.warn('Unexpected error loading promotions, hiding section');
      }
      
      setPromotions([]);
      setIsSupabaseAvailable(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleShare = useCallback((promotion: Promotion) => {
    const text = `Aproveite esta promoção incrível na Açaí House! ${promotion.title} por apenas R$ ${promotion.promo_price.toFixed(2)}! ${window.location.href}#promotions`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Promoção Açaí House',
        text: text,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(text);
      toast.success('Link copiado para a área de transferência!');
    }
  }, []);

  const copyCode = useCallback((code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success('Cupom copiado!');
    setTimeout(() => setCopiedCode(null), 2000);
  }, []);

  const handleApplyPromotion = useCallback(async (promo: Promotion) => {
    if (promo.coupon_code) {
      // Se a promoção tem cupom, aplicar o cupom e abrir o carrinho
      await applyCoupon(promo.coupon_code);
      setIsCartOpen(true);
    } else {
      // Se não tem cupom, adicionar produto diretamente ao carrinho com preço promocional
      addToCart({
        id: promo.id,
        name: promo.title,
        price: promo.promo_price,
        image: promo.image_url || 'https://images.unsplash.com/photo-1596463119248-53c8d33d2739?auto=format&fit=crop&q=80'
      }, 'M', []);
      
      toast.success(`${promo.title} adicionado ao carrinho com desconto!`);
    }
  }, [applyCoupon, setIsCartOpen, addToCart]);

  const optimizeImageUrl = useCallback((url: string) => {
    if (url.includes('supabase.co')) {
      return `${url}?width=600&quality=80`;
    }
    return url;
  }, []);

  if (isLoading) {
    return (
      <section id="promotions" className="py-12 sm:py-20 bg-gradient-to-b from-purple-50 to-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center h-64">
            <Spinner size="lg" />
          </div>
        </div>
      </section>
    );
  }

  if (promotions.length === 0) {
    return null; // Don't show the section if there are no active promotions
  }

  return (
    <section id="promotions" className="py-12 sm:py-20 bg-gradient-to-b from-purple-50 to-white">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            🔥 Ofertas Imperdíveis!
          </h2>
          <p className="text-lg sm:text-xl text-gray-600">
            Aproveite nossas promoções especiais por tempo limitado
          </p>
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8 mb-8 sm:mb-12">
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg text-center">
            <Truck className="h-8 w-8 sm:h-12 sm:w-12 text-purple-600 mx-auto mb-4" />
            <h3 className="text-base sm:text-lg font-semibold mb-2">Frete Grátis</h3>
            <p className="text-sm sm:text-base text-gray-600">Em pedidos acima de R$ 50,00</p>
          </div>
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg text-center">
            <Gift className="h-8 w-8 sm:h-12 sm:w-12 text-purple-600 mx-auto mb-4" />
            <h3 className="text-base sm:text-lg font-semibold mb-2">Brinde Especial</h3>
            <p className="text-sm sm:text-base text-gray-600">Em compras acima de R$ 100,00</p>
          </div>
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg text-center">
            <Shield className="h-8 w-8 sm:h-12 sm:w-12 text-purple-600 mx-auto mb-4" />
            <h3 className="text-base sm:text-lg font-semibold mb-2">Satisfação Garantida</h3>
            <p className="text-sm sm:text-base text-gray-600">Qualidade em cada pedido</p>
          </div>
        </div>

        {/* Promotions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {promotions.map(promo => (
            <div key={promo.id} className="bg-white rounded-lg shadow-xl overflow-hidden">
              <div className="relative">
                <img
                  src={optimizeImageUrl(promo.image_url || 'https://images.unsplash.com/photo-1596463119248-53c8d33d2739?auto=format&fit=crop&q=80')}
                  alt={promo.title}
                  className="w-full h-48 sm:h-64 object-cover"
                  loading="lazy"
                />
                {promo.is_flash && (
                  <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-semibold animate-pulse">
                    Promoção Relâmpago!
                  </div>
                )}
                <div className="absolute top-4 right-4 bg-purple-600 text-white px-3 py-1 sm:px-4 sm:py-2 rounded-full text-base sm:text-lg font-bold">
                  -{promo.discount_percentage}%
                </div>
              </div>

              <div className="p-4 sm:p-6">
                <h3 className="text-xl sm:text-2xl font-bold mb-2">{promo.title}</h3>
                <p className="text-gray-600 mb-4 text-sm sm:text-base">{promo.description}</p>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-4 sm:space-y-0">
                  <div>
                    <span className="text-gray-400 line-through text-base sm:text-lg">
                      R$ {promo.original_price.toFixed(2)}
                    </span>
                    <span className="text-2xl sm:text-3xl font-bold text-purple-600 ml-3">
                      R$ {promo.promo_price.toFixed(2)}
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <CountdownTimer endDate={promo.end_date} />
                  </div>
                </div>

                {promo.coupon_code && (
                  <div className="bg-purple-50 p-3 sm:p-4 rounded-lg mb-6">
                    <p className="text-sm text-purple-600 mb-2 flex items-center">
                      <Tag className="h-4 w-4 mr-2" />
                      Use o cupom:
                    </p>
                    <div className="flex items-center justify-between bg-white border-2 border-purple-200 rounded-lg p-2">
                      <code className="text-base sm:text-lg font-mono font-bold text-purple-600">
                        {promo.coupon_code}
                      </code>
                      <button
                        onClick={() => copyCode(promo.coupon_code!)}
                        className="text-purple-600 hover:text-purple-700 text-sm font-semibold flex items-center"
                      >
                        {copiedCode === promo.coupon_code ? (
                          <>
                            <Check className="h-4 w-4 mr-1" />
                            Copiado!
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4 mr-1" />
                            Copiar
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4">
                  <button
                    onClick={() => handleApplyPromotion(promo)}
                    className="w-full sm:flex-1 bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition flex items-center justify-center"
                  >
                    {promo.coupon_code ? (
                      <>
                        <Tag className="h-5 w-5 mr-2" />
                        Aplicar Cupom
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="h-5 w-5 mr-2" />
                        Aproveitar Agora
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleShare(promo)}
                    className="p-3 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition"
                    aria-label="Compartilhar promoção"
                  >
                    <Share2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Social Proof */}
        <div className="mt-12 sm:mt-16 text-center bg-purple-900 text-white py-8 sm:py-12 px-4 rounded-2xl">
          <h3 className="text-xl sm:text-2xl font-bold mb-4">
            Mais de 10.000 clientes já aproveitaram nossas promoções!
          </h3>
          <p className="text-purple-200 text-base sm:text-lg">
            Junte-se a milhares de clientes satisfeitos e aproveite as melhores ofertas de açaí da região
          </p>
        </div>
      </div>
    </section>
  );
});

Promotions.displayName = 'Promotions';

export default Promotions;