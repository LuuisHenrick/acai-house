/*
  # Tabela de Configurações do Site

  1. Nova Tabela
    - `site_settings`
      - `id` (uuid, primary key)
      - `setting_key` (text, unique)
      - `setting_value` (text)
      - `setting_type` (text) - 'text', 'url', 'boolean', etc.
      - `description` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `updated_by` (uuid, references auth.users)

  2. Segurança
    - Enable RLS na tabela site_settings
    - Políticas para leitura pública e escrita autenticada
*/

CREATE TABLE IF NOT EXISTS site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  setting_value text,
  setting_type text DEFAULT 'text',
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users
);

-- Enable RLS
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Allow public read access to site settings"
  ON site_settings
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow authenticated users to manage site settings"
  ON site_settings
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Trigger para updated_at
CREATE TRIGGER update_site_settings_updated_at
  BEFORE UPDATE ON site_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Inserir configuração padrão da logo
INSERT INTO site_settings (setting_key, setting_value, setting_type, description) VALUES
('logo_url', 'https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&q=80&w=100&h=100', 'url', 'URL da logo principal do site'),
('site_name', 'Açaí House', 'text', 'Nome do site'),
('logo_alt_text', 'Açaí House Logo', 'text', 'Texto alternativo da logo')
ON CONFLICT (setting_key) DO NOTHING;