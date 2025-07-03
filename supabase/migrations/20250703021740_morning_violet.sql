/*
  # Tabela de Imagens dos Produtos

  1. Nova Tabela
    - `product_images`
      - `id` (uuid, primary key)
      - `product_id` (uuid, references products)
      - `image_url` (text, URL da imagem)
      - `alt_text` (text, texto alternativo)
      - `display_order` (integer, ordem de exibição)
      - `is_primary` (boolean, imagem principal)
      - `is_active` (boolean, status ativo/inativo)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `created_by` (uuid, references auth.users)
      - `updated_by` (uuid, references auth.users)

  2. Segurança
    - Enable RLS na tabela product_images
    - Políticas para leitura pública e escrita autenticada

  3. Índices
    - Índice para product_id + display_order
    - Índice para is_primary
*/

CREATE TABLE IF NOT EXISTS product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  alt_text text,
  display_order integer DEFAULT 0,
  is_primary boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Allow public read access to active product images"
  ON product_images
  FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Allow authenticated users to manage product images"
  ON product_images
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Trigger para updated_at
CREATE TRIGGER update_product_images_updated_at
  BEFORE UPDATE ON product_images
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_product_images_product_order 
  ON product_images(product_id, display_order);

CREATE INDEX IF NOT EXISTS idx_product_images_primary 
  ON product_images(product_id, is_primary) 
  WHERE is_primary = true;

-- Função para garantir apenas uma imagem primária por produto
CREATE OR REPLACE FUNCTION ensure_single_primary_image()
RETURNS TRIGGER AS $$
BEGIN
  -- Se a nova imagem está sendo marcada como primária
  IF NEW.is_primary = true THEN
    -- Desmarcar todas as outras imagens do mesmo produto como primárias
    UPDATE product_images 
    SET is_primary = false 
    WHERE product_id = NEW.product_id 
      AND id != NEW.id 
      AND is_primary = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para garantir apenas uma imagem primária
CREATE TRIGGER ensure_single_primary_image_trigger
  BEFORE INSERT OR UPDATE ON product_images
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_primary_image();

-- Migrar imagens existentes dos produtos
INSERT INTO product_images (product_id, image_url, alt_text, display_order, is_primary, created_by)
SELECT 
  id as product_id,
  image_url,
  name as alt_text,
  1 as display_order,
  true as is_primary,
  created_by
FROM products 
WHERE image_url IS NOT NULL AND image_url != ''
ON CONFLICT DO NOTHING;