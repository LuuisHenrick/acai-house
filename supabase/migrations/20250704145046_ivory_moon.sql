/*
  # Adicionar Configurações de Redes Sociais

  1. Configurações Adicionais
    - Adicionar settings para redes sociais no site_settings
    - iFood URL
    - TikTok URL  
    - WhatsApp URL (api.whatsapp.com)
    - Instagram URL (editável)
    - Facebook URL (editável)

  2. Dados Iniciais
    - Inserir configurações padrão para todas as redes sociais
*/

-- Inserir configurações de redes sociais
INSERT INTO site_settings (setting_key, setting_value, setting_type, description) VALUES
('instagram_url', 'https://instagram.com/acaihouse', 'url', 'URL do perfil do Instagram'),
('facebook_url', 'https://facebook.com/acaihouse', 'url', 'URL da página do Facebook'),
('ifood_url', '', 'url', 'URL do restaurante no iFood'),
('tiktok_url', '', 'url', 'URL do perfil do TikTok'),
('whatsapp_url', 'https://api.whatsapp.com/send?phone=5531993183738', 'url', 'URL do WhatsApp Business'),
('phone_number', '(31) 99318-3738', 'text', 'Número de telefone principal'),
('email_contact', 'contato@acaihouse.com.br', 'email', 'E-mail de contato principal')
ON CONFLICT (setting_key) DO NOTHING;