/*
  # Fix Products Table RLS Policies

  1. Security Changes
    - Drop conflicting RLS policies on products table
    - Create clean, consistent policies for authenticated users
    - Allow authenticated users full CRUD access to products
    - Allow public users to read only active products

  2. Policy Updates
    - Remove duplicate and conflicting policies
    - Ensure authenticated users can insert, update, delete products
    - Maintain public read access for active products only
*/

-- Drop all existing policies on products table
DROP POLICY IF EXISTS "authenticated_delete_products" ON products;
DROP POLICY IF EXISTS "authenticated_insert_products" ON products;
DROP POLICY IF EXISTS "authenticated_select_products" ON products;
DROP POLICY IF EXISTS "authenticated_update_products" ON products;
DROP POLICY IF EXISTS "insert_products" ON products;
DROP POLICY IF EXISTS "public_select_active_products" ON products;
DROP POLICY IF EXISTS "select_products" ON products;
DROP POLICY IF EXISTS "update_products" ON products;

-- Create clean, consistent policies
CREATE POLICY "Allow authenticated users to insert products"
  ON products
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to select products"
  ON products
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to update products"
  ON products
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete products"
  ON products
  FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Allow public to read active products"
  ON products
  FOR SELECT
  TO public
  USING (active = true);