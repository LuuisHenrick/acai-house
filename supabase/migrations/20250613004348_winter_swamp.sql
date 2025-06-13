/*
  # Sistema Completo de Produtos

  1. Novas Tabelas
    - `products` - Produtos principais
    - `product_sizes` - Tamanhos e preços por produto
    - `addon_groups` - Grupos de adicionais
    - `addon_options` - Opções dentro dos grupos
    - `product_addon_groups` - Relação produtos x grupos de adicionais

  2. Segurança
    - RLS habilitado em todas as tabelas
    - Políticas para CRUD autenticado e leitura pública
*/

-- Tabela principal de produtos
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text NOT NULL,
  image_url text,
  active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users,
  updated_by uuid REFERENCES auth.users
);

-- Tabela de tamanhos e preços
CREATE TABLE IF NOT EXISTS product_sizes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  size_name text NOT NULL, -- P, M, G
  size_label text NOT NULL, -- Pequeno (300ml), Médio (500ml), etc
  price numeric NOT NULL CHECK (price >= 0),
  active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Tabela de grupos de adicionais
CREATE TABLE IF NOT EXISTS addon_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  is_required boolean DEFAULT false,
  min_selections integer DEFAULT 0,
  max_selections integer,
  active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users,
  updated_by uuid REFERENCES auth.users
);

-- Tabela de opções dos adicionais
CREATE TABLE IF NOT EXISTS addon_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  addon_group_id uuid REFERENCES addon_groups(id) ON DELETE CASCADE,
  name text NOT NULL,
  price numeric NOT NULL DEFAULT 0 CHECK (price >= 0),
  active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Tabela de relação produtos x grupos de adicionais
CREATE TABLE IF NOT EXISTS product_addon_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  addon_group_id uuid REFERENCES addon_groups(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(product_id, addon_group_id)
);

-- Habilitar RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_sizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE addon_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE addon_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_addon_groups ENABLE ROW LEVEL SECURITY;

-- Políticas para products
CREATE POLICY "Allow public read access to active products"
  ON products FOR SELECT TO public
  USING (active = true);

CREATE POLICY "Allow authenticated users to manage products"
  ON products FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Políticas para product_sizes
CREATE POLICY "Allow public read access to product sizes"
  ON product_sizes FOR SELECT TO public
  USING (active = true);

CREATE POLICY "Allow authenticated users to manage product sizes"
  ON product_sizes FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Políticas para addon_groups
CREATE POLICY "Allow public read access to active addon groups"
  ON addon_groups FOR SELECT TO public
  USING (active = true);

CREATE POLICY "Allow authenticated users to manage addon groups"
  ON addon_groups FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Políticas para addon_options
CREATE POLICY "Allow public read access to addon options"
  ON addon_options FOR SELECT TO public
  USING (active = true);

CREATE POLICY "Allow authenticated users to manage addon options"
  ON addon_options FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Políticas para product_addon_groups
CREATE POLICY "Allow public read access to product addon groups"
  ON product_addon_groups FOR SELECT TO public
  USING (true);

CREATE POLICY "Allow authenticated users to manage product addon groups"
  ON product_addon_groups FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Triggers para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_addon_groups_updated_at
  BEFORE UPDATE ON addon_groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Inserir dados de exemplo
INSERT INTO products (name, description, category, image_url, display_order) VALUES
('Açaí Tradicional', 'Açaí puro com granola e banana', 'tradicional', 'https://images.unsplash.com/photo-1596463119248-53c8d33d2739?auto=format&fit=crop&q=80', 1),
('Açaí Premium', 'Açaí com frutas selecionadas e complementos especiais', 'premium', 'https://images.unsplash.com/photo-1596463119298-3e5d8d8b4001?auto=format&fit=crop&q=80', 2),
('Açaí Especial', 'Açaí com leite condensado e paçoca', 'especial', 'https://images.unsplash.com/photo-1596463059283-da257325bab8?auto=format&fit=crop&q=80', 3);

-- Inserir tamanhos para os produtos
INSERT INTO product_sizes (product_id, size_name, size_label, price, display_order)
SELECT 
  p.id,
  size_data.size_name,
  size_data.size_label,
  size_data.price,
  size_data.display_order
FROM products p
CROSS JOIN (
  VALUES 
    ('P', 'Pequeno (300ml)', 12.90, 1),
    ('M', 'Médio (500ml)', 16.90, 2),
    ('G', 'Grande (700ml)', 22.90, 3)
) AS size_data(size_name, size_label, price, display_order);

-- Inserir grupos de adicionais
INSERT INTO addon_groups (name, description, is_required, min_selections, max_selections, display_order) VALUES
('Frutas', 'Escolha suas frutas favoritas', false, 0, 3, 1),
('Complementos Doces', 'Adicionais doces para seu açaí', false, 0, 5, 2),
('Complementos Crocantes', 'Opções crocantes e saborosas', false, 0, 3, 3);

-- Inserir opções dos adicionais
INSERT INTO addon_options (addon_group_id, name, price, display_order)
SELECT 
  ag.id,
  option_data.name,
  option_data.price,
  option_data.display_order
FROM addon_groups ag
CROSS JOIN (
  SELECT 'Frutas' as group_name, 'Banana' as name, 2.00 as price, 1 as display_order
  UNION ALL SELECT 'Frutas', 'Morango', 3.50, 2
  UNION ALL SELECT 'Frutas', 'Kiwi', 4.00, 3
  UNION ALL SELECT 'Frutas', 'Manga', 3.00, 4
  UNION ALL SELECT 'Complementos Doces', 'Leite Condensado', 3.00, 1
  UNION ALL SELECT 'Complementos Doces', 'Mel', 2.50, 2
  UNION ALL SELECT 'Complementos Doces', 'Chocolate', 3.50, 3
  UNION ALL SELECT 'Complementos Doces', 'Leite em Pó', 2.00, 4
  UNION ALL SELECT 'Complementos Crocantes', 'Granola', 2.00, 1
  UNION ALL SELECT 'Complementos Crocantes', 'Paçoca', 2.50, 2
  UNION ALL SELECT 'Complementos Crocantes', 'Castanha', 4.00, 3
) AS option_data
WHERE ag.name = option_data.group_name;

-- Associar grupos de adicionais aos produtos
INSERT INTO product_addon_groups (product_id, addon_group_id)
SELECT p.id, ag.id
FROM products p
CROSS JOIN addon_groups ag;