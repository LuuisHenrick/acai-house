# Database Setup Instructions

The application is failing because the required database tables haven't been created in your Supabase project. You need to run the following SQL statements in your Supabase dashboard.

## How to Apply These Changes

1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Copy and paste each SQL block below and run them in order

## Step 1: Create the update_updated_at_column function (if it doesn't exist)

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

## Step 2: Create Product Categories Table

```sql
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
```

## Step 3: Create Helper Functions

```sql
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
```

## Step 4: Insert Default Categories

```sql
-- Inserir categorias padrão baseadas nas existentes
INSERT INTO product_categories (name, description, slug, color, icon, display_order) VALUES
('Tradicional', 'Açaís tradicionais com ingredientes clássicos', 'tradicional', '#8B5CF6', 'bowl', 1),
('Especial', 'Combinações especiais com ingredientes selecionados', 'especial', '#F59E0B', 'star', 2),
('Premium', 'Açaís premium com ingredientes nobres', 'premium', '#EF4444', 'crown', 3),
('Bebidas', 'Vitaminas, sucos e bebidas geladas', 'bebidas', '#10B981', 'coffee', 4),
('Sobremesas', 'Sobremesas e doces especiais', 'sobremesas', '#EC4899', 'cake', 5)
ON CONFLICT (name) DO NOTHING;
```

## Step 5: Update Products Table

```sql
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
```

## Step 6: Create Product Images Table

```sql
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
```

## Step 7: Create Indexes and Functions for Product Images

```sql
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
```

## Step 8: Migrate Existing Product Images

```sql
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
```

## After Running These SQL Statements

Once you've run all these SQL statements in your Supabase dashboard, refresh your application. The errors should be resolved and the menu should load properly with categories and product images.