/*
  # Fix Promotions RLS Policies

  1. Changes
    - Drop existing restrictive RLS policies for authenticated users
    - Add comprehensive policy for authenticated users to manage all promotions
    - Keep public read policy for active promotions

  2. Security
    - Authenticated users get full CRUD access to promotions
    - Public users can only read active, current promotions
*/

-- Drop existing policies for authenticated users on promotions table
DROP POLICY IF EXISTS "Allow authenticated users to create promotions" ON promotions;
DROP POLICY IF EXISTS "Allow authenticated users to update promotions" ON promotions;
DROP POLICY IF EXISTS "Allow authenticated users to delete promotions" ON promotions;

-- Add a comprehensive policy for authenticated users
CREATE POLICY "Allow authenticated users to manage promotions"
  ON promotions
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);