/*
  # Create Promotions Management Table

  1. New Tables
    - `promotions`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `product_name` (text)
      - `original_price` (numeric)
      - `promo_price` (numeric)
      - `discount_percentage` (integer)
      - `coupon_code` (text, optional)
      - `start_date` (timestamptz)
      - `end_date` (timestamptz)
      - `image_url` (text)
      - `is_flash` (boolean)
      - `active` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `created_by` (uuid, references auth.users)
      - `updated_by` (uuid, references auth.users)

  2. Security
    - Enable RLS on promotions table
    - Add policies for CRUD operations
*/

-- Create promotions table
CREATE TABLE IF NOT EXISTS promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  product_name text NOT NULL,
  original_price numeric NOT NULL CHECK (original_price >= 0),
  promo_price numeric NOT NULL CHECK (promo_price >= 0),
  discount_percentage integer NOT NULL CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
  coupon_code text,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  image_url text,
  is_flash boolean DEFAULT false,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users,
  updated_by uuid REFERENCES auth.users,
  CONSTRAINT valid_dates CHECK (end_date > start_date),
  CONSTRAINT valid_prices CHECK (promo_price <= original_price)
);

-- Enable RLS
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public read access to active promotions"
  ON promotions
  FOR SELECT
  TO public
  USING (active = true AND start_date <= now() AND end_date >= now());

CREATE POLICY "Allow authenticated users to create promotions"
  ON promotions
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update promotions"
  ON promotions
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete promotions"
  ON promotions
  FOR DELETE
  TO authenticated
  USING (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_promotions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_promotions_updated_at
  BEFORE UPDATE ON promotions
  FOR EACH ROW
  EXECUTE FUNCTION update_promotions_updated_at();