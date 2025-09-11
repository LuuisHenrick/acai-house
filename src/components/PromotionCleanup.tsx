import React, { useEffect } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Componente para limpeza automática de promoções expiradas
 * Executa a verificação a cada 5 minutos quando a aplicação está ativa
 */
export default function PromotionCleanup() {
  useEffect(() => {
    const cleanupExpiredPromotions = async () => {
      try {
        // Chamar a função do banco de dados para limpar promoções expiradas
        const { error } = await supabase.rpc('cleanup_expired_promotions');
        
        if (error) {
          console.error('Error cleaning up expired promotions:', error);
        } else {
          console.log('Expired promotions cleanup completed');
        }
      } catch (error) {
        console.error('Error in promotion cleanup:', error);
      }
    };

    // Executar limpeza imediatamente
    cleanupExpiredPromotions();

    // Configurar limpeza automática a cada 5 minutos
    const interval = setInterval(cleanupExpiredPromotions, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  // Este componente não renderiza nada visível
  return null;
}