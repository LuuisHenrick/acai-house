/*
  # Adicionar Campos de Promoção aos Produtos

  1. Alterações na Tabela Products
    - Adicionar campos de promoção diretamente na tabela products
    - is_on_promotion (boolean) - Flag para indicar se está em promoção
    - promo_price (numeric) - Preço promocional
    - promo_coupon_code (text) - Código do cupom específico do produto
    - promo_end_date (timestamptz) - Data de expiração da promoção

  2. Função de Limpeza Automática
    - Função para verificar e limpar promoções expiradas
    - Será executada automaticamente ou via cron job

  3. Índices para Performance
    - Índices para consultas de promoções ativas
*/

-- Adicionar campos de promoção à tabela products
DO $$
BEGIN
  -- is_on_promotion
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'is_on_promotion'
  ) THEN
    ALTER TABLE products ADD COLUMN is_on_promotion boolean DEFAULT false;
  END IF;

  -- promo_price
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'promo_price'
  ) THEN
    ALTER TABLE products ADD COLUMN promo_price numeric CHECK (promo_price >= 0);
  END IF;

  -- promo_coupon_code
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'promo_coupon_code'
  ) THEN
    ALTER TABLE products ADD COLUMN promo_coupon_code text;
  END IF;

  -- promo_end_date
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'promo_end_date'
  ) THEN
    ALTER TABLE products ADD COLUMN promo_end_date timestamptz;
  END IF;
END $$;

-- Função para limpar promoções expiradas
CREATE OR REPLACE FUNCTION cleanup_expired_promotions()
RETURNS void AS $$
BEGIN
  UPDATE products 
  SET 
    is_on_promotion = false,
    promo_price = null,
    promo_coupon_code = null,
    promo_end_date = null,
    updated_at = now()
  WHERE 
    is_on_promotion = true 
    AND promo_end_date IS NOT NULL 
    AND promo_end_date < now();
    
  -- Log quantos produtos foram atualizados
  RAISE NOTICE 'Cleaned up expired promotions for % products', 
    (SELECT count(*) FROM products WHERE is_on_promotion = false AND promo_end_date < now());
END;
$$ LANGUAGE plpgsql;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_products_promotion_active 
  ON products(is_on_promotion, promo_end_date) 
  WHERE is_on_promotion = true;

CREATE INDEX IF NOT EXISTS idx_products_coupon_code 
  ON products(promo_coupon_code) 
  WHERE promo_coupon_code IS NOT NULL;

-- Trigger para validar dados de promoção
CREATE OR REPLACE FUNCTION validate_product_promotion()
RETURNS TRIGGER AS $$
BEGIN
  -- Se está em promoção, validar campos obrigatórios
  IF NEW.is_on_promotion = true THEN
    -- Preço promocional é obrigatório
    IF NEW.promo_price IS NULL OR NEW.promo_price <= 0 THEN
      RAISE EXCEPTION 'Preço promocional é obrigatório quando produto está em promoção';
    END IF;
    
    -- Data de fim é obrigatória
    IF NEW.promo_end_date IS NULL THEN
      RAISE EXCEPTION 'Data de fim da promoção é obrigatória';
    END IF;
    
    -- Data de fim deve ser no futuro
    IF NEW.promo_end_date <= now() THEN
      RAISE EXCEPTION 'Data de fim da promoção deve ser no futuro';
    END IF;
    
    -- Preço promocional deve ser menor que o preço normal (baseado no menor tamanho)
    IF EXISTS (
      SELECT 1 FROM product_sizes 
      WHERE product_id = NEW.id 
      AND active = true 
      AND price <= NEW.promo_price
    ) THEN
      RAISE EXCEPTION 'Preço promocional deve ser menor que o preço normal do produto';
    END IF;
  ELSE
    -- Se não está em promoção, limpar campos relacionados
    NEW.promo_price := null;
    NEW.promo_coupon_code := null;
    NEW.promo_end_date := null;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger de validação
DROP TRIGGER IF EXISTS validate_product_promotion_trigger ON products;
CREATE TRIGGER validate_product_promotion_trigger
  BEFORE INSERT OR UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION validate_product_promotion();

-- Executar limpeza inicial de promoções expiradas
SELECT cleanup_expired_promotions();