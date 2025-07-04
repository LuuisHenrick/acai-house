import React, { useState, useEffect } from 'react';
import { 
  Save, 
  Instagram, 
  Facebook, 
  MessageCircle,
  Music,
  ShoppingBag,
  Phone,
  Mail,
  ExternalLink,
  Check,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface SocialMediaSettings {
  instagram_url: string;
  facebook_url: string;
  ifood_url: string;
  tiktok_url: string;
  whatsapp_url: string;
  phone_number: string;
  email_contact: string;
}

const defaultSettings: SocialMediaSettings = {
  instagram_url: 'https://instagram.com/acaihouse',
  facebook_url: 'https://facebook.com/acaihouse',
  ifood_url: '',
  tiktok_url: '',
  whatsapp_url: 'https://api.whatsapp.com/send?phone=5531993183738',
  phone_number: '(31) 99318-3738',
  email_contact: 'contato@acaihouse.com.br'
};

export default function SocialMediaSettings() {
  const [settings, setSettings] = useState<SocialMediaSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    checkForChanges();
  }, [settings]);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('setting_key, setting_value')
        .in('setting_key', Object.keys(defaultSettings));

      if (error) throw error;

      if (data && data.length > 0) {
        const settingsMap = data.reduce((acc, item) => {
          acc[item.setting_key] = item.setting_value || '';
          return acc;
        }, {} as Record<string, string>);

        setSettings({
          instagram_url: settingsMap.instagram_url || defaultSettings.instagram_url,
          facebook_url: settingsMap.facebook_url || defaultSettings.facebook_url,
          ifood_url: settingsMap.ifood_url || defaultSettings.ifood_url,
          tiktok_url: settingsMap.tiktok_url || defaultSettings.tiktok_url,
          whatsapp_url: settingsMap.whatsapp_url || defaultSettings.whatsapp_url,
          phone_number: settingsMap.phone_number || defaultSettings.phone_number,
          email_contact: settingsMap.email_contact || defaultSettings.email_contact
        });
      }
    } catch (error) {
      console.error('Error loading social media settings:', error);
      toast.error('Erro ao carregar configurações das redes sociais');
    } finally {
      setIsLoading(false);
    }
  };

  const checkForChanges = () => {
    const hasChanges = Object.keys(settings).some(key => {
      return settings[key as keyof SocialMediaSettings] !== defaultSettings[key as keyof SocialMediaSettings];
    });
    setHasChanges(hasChanges);
  };

  const validateSettings = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    // Validar URLs
    const urlFields = ['instagram_url', 'facebook_url', 'ifood_url', 'tiktok_url', 'whatsapp_url'];
    urlFields.forEach(field => {
      const value = settings[field as keyof SocialMediaSettings];
      if (value && !isValidUrl(value)) {
        newErrors[field] = 'URL inválida';
      }
    });

    // Validar e-mail
    if (settings.email_contact && !isValidEmail(settings.email_contact)) {
      newErrors.email_contact = 'E-mail inválido';
    }

    // Validar telefone
    if (settings.phone_number && !isValidPhone(settings.phone_number)) {
      newErrors.phone_number = 'Formato de telefone inválido';
    }

    // Validações específicas por plataforma
    if (settings.instagram_url && !settings.instagram_url.includes('instagram.com')) {
      newErrors.instagram_url = 'URL deve ser do Instagram';
    }

    if (settings.facebook_url && !settings.facebook_url.includes('facebook.com')) {
      newErrors.facebook_url = 'URL deve ser do Facebook';
    }

    if (settings.ifood_url && !settings.ifood_url.includes('ifood.com')) {
      newErrors.ifood_url = 'URL deve ser do iFood';
    }

    if (settings.tiktok_url && !settings.tiktok_url.includes('tiktok.com')) {
      newErrors.tiktok_url = 'URL deve ser do TikTok';
    }

    if (settings.whatsapp_url && !settings.whatsapp_url.includes('whatsapp.com')) {
      newErrors.whatsapp_url = 'URL deve ser do WhatsApp';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isValidPhone = (phone: string): boolean => {
    const phoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
    return phoneRegex.test(phone);
  };

  const handleSave = async () => {
    if (!validateSettings()) {
      toast.error('Por favor, corrija os erros no formulário');
      return;
    }

    setIsSaving(true);
    try {
      const user = (await supabase.auth.getUser()).data.user;

      // Salvar cada configuração
      for (const [key, value] of Object.entries(settings)) {
        await supabase
          .from('site_settings')
          .upsert({
            setting_key: key,
            setting_value: value,
            updated_by: user?.id
          }, {
            onConflict: 'setting_key'
          });
      }

      toast.success('Configurações de redes sociais salvas com sucesso!');
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving social media settings:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setSettings(defaultSettings);
    setErrors({});
  };

  const testLink = (url: string, platform: string) => {
    if (!url) {
      toast.error(`URL do ${platform} não configurada`);
      return;
    }
    
    if (!isValidUrl(url)) {
      toast.error(`URL do ${platform} inválida`);
      return;
    }

    window.open(url, '_blank');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-purple-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Redes Sociais e Contato</h2>
          <p className="text-gray-600 mt-1">
            Configure os links das redes sociais e informações de contato
          </p>
        </div>
        <button
          onClick={loadSettings}
          className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 transition"
        >
          <RefreshCw className="h-5 w-5 mr-2" />
          Atualizar
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Redes Sociais */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <MessageCircle className="h-5 w-5 mr-2 text-purple-600" />
              Redes Sociais
            </h3>

            {/* Instagram */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Instagram className="h-4 w-4 inline mr-2" />
                Instagram
              </label>
              <div className="flex">
                <input
                  type="url"
                  value={settings.instagram_url}
                  onChange={(e) => setSettings({ ...settings, instagram_url: e.target.value })}
                  className={`flex-1 p-3 border rounded-l-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    errors.instagram_url ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="https://instagram.com/acaihouse"
                />
                <button
                  onClick={() => testLink(settings.instagram_url, 'Instagram')}
                  className="px-4 py-3 bg-gray-100 border border-l-0 rounded-r-lg hover:bg-gray-200 transition"
                  title="Testar link"
                >
                  <ExternalLink className="h-5 w-5 text-gray-600" />
                </button>
              </div>
              {errors.instagram_url && (
                <p className="text-red-500 text-sm mt-1">{errors.instagram_url}</p>
              )}
            </div>

            {/* Facebook */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Facebook className="h-4 w-4 inline mr-2" />
                Facebook
              </label>
              <div className="flex">
                <input
                  type="url"
                  value={settings.facebook_url}
                  onChange={(e) => setSettings({ ...settings, facebook_url: e.target.value })}
                  className={`flex-1 p-3 border rounded-l-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    errors.facebook_url ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="https://facebook.com/acaihouse"
                />
                <button
                  onClick={() => testLink(settings.facebook_url, 'Facebook')}
                  className="px-4 py-3 bg-gray-100 border border-l-0 rounded-r-lg hover:bg-gray-200 transition"
                  title="Testar link"
                >
                  <ExternalLink className="h-5 w-5 text-gray-600" />
                </button>
              </div>
              {errors.facebook_url && (
                <p className="text-red-500 text-sm mt-1">{errors.facebook_url}</p>
              )}
            </div>

            {/* TikTok */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Music className="h-4 w-4 inline mr-2" />
                TikTok
              </label>
              <div className="flex">
                <input
                  type="url"
                  value={settings.tiktok_url}
                  onChange={(e) => setSettings({ ...settings, tiktok_url: e.target.value })}
                  className={`flex-1 p-3 border rounded-l-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    errors.tiktok_url ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="https://tiktok.com/@acaihouse"
                />
                <button
                  onClick={() => testLink(settings.tiktok_url, 'TikTok')}
                  className="px-4 py-3 bg-gray-100 border border-l-0 rounded-r-lg hover:bg-gray-200 transition"
                  title="Testar link"
                >
                  <ExternalLink className="h-5 w-5 text-gray-600" />
                </button>
              </div>
              {errors.tiktok_url && (
                <p className="text-red-500 text-sm mt-1">{errors.tiktok_url}</p>
              )}
            </div>

            {/* iFood */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <ShoppingBag className="h-4 w-4 inline mr-2" />
                iFood
              </label>
              <div className="flex">
                <input
                  type="url"
                  value={settings.ifood_url}
                  onChange={(e) => setSettings({ ...settings, ifood_url: e.target.value })}
                  className={`flex-1 p-3 border rounded-l-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    errors.ifood_url ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="https://ifood.com.br/delivery/belo-horizonte-mg/acai-house"
                />
                <button
                  onClick={() => testLink(settings.ifood_url, 'iFood')}
                  className="px-4 py-3 bg-gray-100 border border-l-0 rounded-r-lg hover:bg-gray-200 transition"
                  title="Testar link"
                >
                  <ExternalLink className="h-5 w-5 text-gray-600" />
                </button>
              </div>
              {errors.ifood_url && (
                <p className="text-red-500 text-sm mt-1">{errors.ifood_url}</p>
              )}
            </div>
          </div>

          {/* Informações de Contato */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Phone className="h-5 w-5 mr-2 text-purple-600" />
              Informações de Contato
            </h3>

            {/* WhatsApp */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MessageCircle className="h-4 w-4 inline mr-2" />
                WhatsApp Business
              </label>
              <div className="flex">
                <input
                  type="url"
                  value={settings.whatsapp_url}
                  onChange={(e) => setSettings({ ...settings, whatsapp_url: e.target.value })}
                  className={`flex-1 p-3 border rounded-l-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    errors.whatsapp_url ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="https://api.whatsapp.com/send?phone=5531999999999"
                />
                <button
                  onClick={() => testLink(settings.whatsapp_url, 'WhatsApp')}
                  className="px-4 py-3 bg-gray-100 border border-l-0 rounded-r-lg hover:bg-gray-200 transition"
                  title="Testar link"
                >
                  <ExternalLink className="h-5 w-5 text-gray-600" />
                </button>
              </div>
              {errors.whatsapp_url && (
                <p className="text-red-500 text-sm mt-1">{errors.whatsapp_url}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Formato: https://api.whatsapp.com/send?phone=5531999999999
              </p>
            </div>

            {/* Telefone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="h-4 w-4 inline mr-2" />
                Telefone Principal
              </label>
              <input
                type="tel"
                value={settings.phone_number}
                onChange={(e) => setSettings({ ...settings, phone_number: e.target.value })}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                  errors.phone_number ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="(31) 99999-9999"
              />
              {errors.phone_number && (
                <p className="text-red-500 text-sm mt-1">{errors.phone_number}</p>
              )}
            </div>

            {/* E-mail */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="h-4 w-4 inline mr-2" />
                E-mail de Contato
              </label>
              <input
                type="email"
                value={settings.email_contact}
                onChange={(e) => setSettings({ ...settings, email_contact: e.target.value })}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                  errors.email_contact ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="contato@acaihouse.com.br"
              />
              {errors.email_contact && (
                <p className="text-red-500 text-sm mt-1">{errors.email_contact}</p>
              )}
            </div>

            {/* Preview das Redes Sociais */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Preview das Redes Sociais</h4>
              <div className="flex space-x-3">
                {settings.instagram_url && (
                  <a
                    href={settings.instagram_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-purple-100 p-3 rounded-full text-purple-600 hover:bg-purple-200 transition"
                  >
                    <Instagram className="h-6 w-6" />
                  </a>
                )}
                {settings.facebook_url && (
                  <a
                    href={settings.facebook_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-purple-100 p-3 rounded-full text-purple-600 hover:bg-purple-200 transition"
                  >
                    <Facebook className="h-6 w-6" />
                  </a>
                )}
                {settings.tiktok_url && (
                  <a
                    href={settings.tiktok_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-purple-100 p-3 rounded-full text-purple-600 hover:bg-purple-200 transition"
                  >
                    <Music className="h-6 w-6" />
                  </a>
                )}
                {settings.ifood_url && (
                  <a
                    href={settings.ifood_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-purple-100 p-3 rounded-full text-purple-600 hover:bg-purple-200 transition"
                  >
                    <ShoppingBag className="h-6 w-6" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-6 border-t mt-8">
          <div className="flex items-center space-x-2">
            {hasChanges && (
              <div className="flex items-center text-amber-600">
                <AlertCircle className="h-5 w-5 mr-2" />
                <span className="text-sm">Alterações não salvas</span>
              </div>
            )}
          </div>
          
          <div className="flex space-x-4">
            <button
              onClick={handleReset}
              disabled={!hasChanges || isSaving}
              className="flex items-center px-6 py-2 text-gray-600 hover:text-gray-800 transition disabled:opacity-50"
            >
              <RefreshCw className="h-5 w-5 mr-2" />
              Resetar
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              className="flex items-center px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin h-5 w-5 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5 mr-2" />
                  Salvar Alterações
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Dicas de Uso */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-2">Dicas para configurar as redes sociais:</p>
            <ul className="list-disc list-inside space-y-1 text-blue-700">
              <li><strong>WhatsApp:</strong> Use o formato api.whatsapp.com/send?phone=5531999999999 (com código do país)</li>
              <li><strong>iFood:</strong> Copie o link direto do seu restaurante no iFood</li>
              <li><strong>TikTok:</strong> Use o link do seu perfil (@usuario)</li>
              <li><strong>Instagram/Facebook:</strong> Use os links completos dos perfis</li>
              <li>Teste todos os links usando o botão de teste antes de salvar</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}