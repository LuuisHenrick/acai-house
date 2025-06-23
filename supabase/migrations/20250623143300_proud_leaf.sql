/*
  # Adicionar configuração de imagem de fundo da Hero Section

  1. Configurações
    - Adicionar setting para hero_background_url na tabela site_settings
    - Valor padrão será a imagem atual do Unsplash

  2. Storage
    - Bucket para imagens do site será criado via interface do Supabase
*/

-- Inserir configuração para imagem de fundo da hero section
INSERT INTO site_settings (setting_key, setting_value, setting_type, description)
VALUES (
  'hero_background_url',
  'https://images.unsplash.com/photo-1596463059283-da257325bab8?auto=format&fit=crop&q=80',
  'text',
  'URL da imagem de fundo da seção principal (Hero)'
) ON CONFLICT (setting_key) DO NOTHING;