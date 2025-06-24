/*
  # Create Product Addons Table

  1. New Tables
    - `product_addons`
      - `id` (uuid, primary key)
      - `name` (text)
      - `price` (numeric)
      - `category` (text)
      - `is_active` (boolean)
      - `display_order` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `created_by` (uuid, references auth.users)
      - `updated_by` (uuid, references auth.users)

  2. Security
    - Enable RLS on product_addons table
    - Add policies for public read access to active addons
    - Add policies for authenticated users to manage addons

  3. Initial Data
    - Insert sample addons organized by category
*/

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Allow public read access to active addons" ON product_addons;
DROP POLICY IF EXISTS "Allow authenticated users to manage addons" ON product_addons;

-- Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS product_addons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price numeric NOT NULL CHECK (price >= 0),
  category text NOT NULL,
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE product_addons ENABLE ROW LEVEL SECURITY;

-- Create policies (with IF NOT EXISTS equivalent using DO block)
DO $$
BEGIN
  -- Create public read policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'product_addons' 
    AND policyname = 'Allow public read access to active addons'
  ) THEN
    CREATE POLICY "Allow public read access to active addons"
      ON product_addons
      FOR SELECT
      TO public
      USING (is_active = true);
  END IF;

  -- Create authenticated users policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'product_addons' 
    AND policyname = 'Allow authenticated users to manage addons'
  ) THEN
    CREATE POLICY "Allow authenticated users to manage addons"
      ON product_addons
      FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Create trigger for updated_at (drop first if exists)
DROP TRIGGER IF EXISTS update_product_addons_updated_at ON product_addons;

CREATE TRIGGER update_product_addons_updated_at
  BEFORE UPDATE ON product_addons
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert initial addon data (using ON CONFLICT to avoid duplicates)
INSERT INTO product_addons (name, price, category, display_order) VALUES
-- Frutas
('Banana', 2.00, 'Frutas', 1),
('Morango', 3.50, 'Frutas', 2),
('Kiwi', 4.00, 'Frutas', 3),
('Manga', 3.00, 'Frutas', 4),
('Uva', 3.50, 'Frutas', 5),
('Maçã', 2.50, 'Frutas', 6),

-- Coberturas
('Leite Condensado', 3.00, 'Coberturas', 1),
('Mel', 2.50, 'Coberturas', 2),
('Chocolate', 3.50, 'Coberturas', 3),
('Leite em Pó', 2.00, 'Coberturas', 4),
('Nutella', 5.00, 'Coberturas', 5),

-- Crocantes
('Granola', 2.00, 'Crocantes', 1),
('Paçoca', 2.50, 'Crocantes', 2),
('Castanha', 4.00, 'Crocantes', 3),
('Amendoim', 2.50, 'Crocantes', 4),
('Coco Ralado', 2.00, 'Crocantes', 5),

-- Caldas
('Calda de Chocolate', 3.00, 'Caldas', 1),
('Calda de Morango', 3.00, 'Caldas', 2),
('Calda de Caramelo', 3.00, 'Caldas', 3)

ON CONFLICT DO NOTHING;