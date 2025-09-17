/*
  # Tabela de Categorias de Produto

  1. Nova Tabela
    - `product_categories`
      - `id` (uuid, primary key)
      - `name` (text, unique, nome da categoria)
      - `description` (text, descrição da categoria)
      - `slug` (text, unique, slug para URLs)
      - `color` (text, cor para identificação visual)
      - `icon` (text, ícone da categoria)
      - `is_active` (boolean, status ativo/inativo)
      - `display_order` (integer, ordem de exibição)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `created_by` (uuid, references auth.users)
      - `updated_by` (uuid, references auth.users)

  2. Segurança
    - Enable RLS na tabela product_categories
    - Políticas para leitura pública e escrita autenticada

  3. Atualizar tabela products
    - Adicionar foreign key para product_categories
    - Manter compatibilidade com categorias existentes

  4. Dados Iniciais
    - Migrar categorias existentes para a nova tabela
*/

-- Criar tabela de categorias
CREATE TABLE IF NOT EXISTS product_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  slug text NOT NULL UNIQUE,
  color text DEFAULT '#8B5CF6',
  icon text DEFAULT 'package',
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Allow public read access to active categories"
  ON product_categories
  FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Allow authenticated users to manage categories"
  ON product_categories
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Trigger para updated_at
CREATE TRIGGER update_product_categories_updated_at
  BEFORE UPDATE ON product_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Função para gerar slug automaticamente
CREATE OR REPLACE FUNCTION generate_slug(input_text text)
RETURNS text AS $$
BEGIN
  RETURN lower(
    regexp_replace(
      regexp_replace(
        unaccent(input_text),
        '[^a-zA-Z0-9\s]', '', 'g'
      ),
      '\s+', '-', 'g'
    )
  );
END;
$$ LANGUAGE plpgsql;

-- Trigger para gerar slug automaticamente
CREATE OR REPLACE FUNCTION set_category_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := generate_slug(NEW.name);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_product_categories_slug
  BEFORE INSERT OR UPDATE ON product_categories
  FOR EACH ROW
  EXECUTE FUNCTION set_category_slug();

-- Inserir categorias padrão baseadas nas existentes
INSERT INTO product_categories (name, description, slug, color, icon, display_order) VALUES
('Tradicional', 'Açaís tradicionais com ingredientes clássicos', 'tradicional', '#8B5CF6', 'bowl', 1),
('Especial', 'Combinações especiais com ingredientes selecionados', 'especial', '#F59E0B', 'star', 2),
('Premium', 'Açaís premium com ingredientes nobres', 'premium', '#EF4444', 'crown', 3),
('Bebidas', 'Vitaminas, sucos e bebidas geladas', 'bebidas', '#10B981', 'coffee', 4),
('Sobremesas', 'Sobremesas e doces especiais', 'sobremesas', '#EC4899', 'cake', 5)
ON CONFLICT (name) DO NOTHING;

-- Adicionar coluna category_id na tabela products (se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'category_id'
  ) THEN
    ALTER TABLE products ADD COLUMN category_id uuid REFERENCES product_categories(id);
  END IF;
END $$;

-- Migrar categorias existentes
UPDATE products 
SET category_id = (
  SELECT id FROM product_categories 
  WHERE product_categories.slug = products.category
)
WHERE category_id IS NULL;