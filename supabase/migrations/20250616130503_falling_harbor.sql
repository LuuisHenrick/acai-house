/*
  # Fix RLS policies for products table

  1. Security Updates
    - Drop existing restrictive policies on products table
    - Add comprehensive policies for authenticated users to manage products
    - Ensure authenticated users can INSERT, UPDATE, DELETE products
    - Keep public read access for active products only

  2. Changes
    - Remove old policies that were too restrictive
    - Add new policies that allow authenticated users full CRUD access
    - Maintain security by restricting public access to active products only
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated users to manage products" ON products;
DROP POLICY IF EXISTS "Allow public read access to active products" ON products;

-- Create new comprehensive policies for authenticated users
CREATE POLICY "Allow authenticated users to insert products"
  ON products
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

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

CREATE POLICY "Allow authenticated users to select all products"
  ON products
  FOR SELECT
  TO authenticated
  USING (true);

-- Keep public read access restricted to active products only
CREATE POLICY "Allow public read access to active products"
  ON products
  FOR SELECT
  TO public
  USING (active = true);