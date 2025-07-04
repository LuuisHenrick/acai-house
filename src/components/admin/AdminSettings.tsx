import React, { useState, useRef } from 'react';
import { 
  Save, 
  Upload, 
  Image as ImageIcon, 
  Eye, 
  RefreshCw,
  AlertCircle,
  Check,
  X,
  MessageCircle,
  Settings as SettingsIcon
} from 'lucide-react';
import { useSiteSettings } from '../../context/SiteSettingsContext';
import SocialMediaSettings from './SocialMediaSettings';
import toast from 'react-hot-toast';

export default function AdminSettings() {
  const { settings, updateSetting, refreshSettings, isLoading } = useSiteSettings();
  const [activeTab, setActiveTab] = useState<'identity' | 'social'>('identity');
  const [formData, setFormData] = useState({
    logo_url: settings.logo_url,
    site_name: settings.site_name,
    logo_alt_text: settings.logo_alt_text
  });
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setFormData({
      logo_url: settings.logo_url,
      site_name: settings.site_name,
      logo_alt_text: settings.logo_alt_text
    });
  }, [settings]);

  React.useEffect(() => {
    const hasChanges = 
      formData.logo_url !== settings.logo_url ||
      formData.site_name !== settings.site_name ||
      formData.logo_alt_text !== settings.logo_alt_text;
    setHasChanges(hasChanges);
  }, [formData, settings]);

  const handleImageUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione apenas arquivos de imagem');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error('A imagem deve ter no máximo 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setPreviewImage(result);
      setFormData(prev => ({ ...prev, logo_url: result }));
      toast.success('Imagem carregada! Clique em "Salvar" para aplicar');
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await Promise.all([
        updateSetting('logo_url', formData.logo_url),
        updateSetting('site_name', formData.site_name),
        updateSetting('logo_alt_text', formData.logo_alt_text)
      ]);
      
      setPreviewImage(null);
      toast.success('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setFormData({
      logo_url: settings.logo_url,
      site_name: settings.site_name,
      logo_alt_text: settings.logo_alt_text
    });
    setPreviewImage(null);
  };

  const testImageUrl = (url: string) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
    });
  };

  const handleUrlTest = async () => {
    if (!formData.logo_url) return;
    
    const isValid = await testImageUrl(formData.logo_url);
    if (isValid) {
      toast.success('URL da imagem é válida!');
    } else {
      toast.error('URL da imagem não é válida ou não pode ser carregada');
    }
  };

  const resetToDefault = async () => {
    const defaultUrl = 'https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&q=80&w=100&h=100';
    
    try {
      await updateSetting('logo_url', defaultUrl);
      toast.success('Logo restaurada para o padrão');
    } catch (error) {
      toast.error('Erro ao restaurar logo padrão');
    }
  };

  const openImageInNewTab = () => {
    window.open(formData.logo_url, '_blank');
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
        <h2 className="text-2xl font-bold text-gray-900">Configurações do Site</h2>
        <button
          onClick={refreshSettings}
          className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 transition"
        >
          <RefreshCw className="h-5 w-5 mr-2" />
          Atualizar
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('identity')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'identity'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <SettingsIcon className="h-5 w-5 inline mr-2" />
            Identidade Visual
          </button>
          <button
            onClick={() => setActiveTab('social')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'social'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <MessageCircle className="h-5 w-5 inline mr-2" />
            Redes Sociais
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'identity' ? (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Logo Upload Section */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Logo do Site</h3>
              
              {/* Current Logo Preview */}
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">
                  Logo Atual
                </label>
                <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <img
                    src={previewImage || formData.logo_url}
                    alt={formData.logo_alt_text}
                    className="h-16 w-16 object-contain rounded-lg border"
                    onError={(e) => {
                      e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMCAyMEg0NFY0NEgyMFYyMFoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+';
                    }}
                  />
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">
                      Dimensões recomendadas: 100x100px ou proporção 1:1
                    </p>
                    <p className="text-xs text-gray-500">
                      Formatos aceitos: PNG, JPG, SVG (máx. 5MB)
                    </p>
                  </div>
                </div>
              </div>

              {/* Upload Options */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload de Nova Logo
                  </label>
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition"
                    >
                      <Upload className="h-5 w-5 mr-2" />
                      Escolher Arquivo
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file);
                      }}
                    />
                  </div>
                </div>

                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ou URL da Imagem
                  </label>
                  <div className="flex">
                    <input
                      type="url"
                      value={formData.logo_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, logo_url: e.target.value }))}
                      className="flex-1 p-3 border rounded-l-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="https://exemplo.com/logo.png"
                    />
                    <button
                      onClick={handleUrlTest}
                      className="px-4 py-3 bg-gray-100 border border-l-0 rounded-r-lg hover:bg-gray-200 transition"
                      title="Testar URL"
                    >
                      <Eye className="h-5 w-5 text-gray-600" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Site Information */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Informações do Site</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome do Site
                </label>
                <input
                  type="text"
                  value={formData.site_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, site_name: e.target.value }))}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Açaí House"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Texto Alternativo da Logo
                </label>
                <input
                  type="text"
                  value={formData.logo_alt_text}
                  onChange={(e) => setFormData(prev => ({ ...prev, logo_alt_text: e.target.value }))}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Açaí House Logo"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Importante para acessibilidade e SEO
                </p>
              </div>

              {/* Preview Header */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Preview do Header
                </label>
                <div className="bg-purple-900 text-white p-4 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <img
                      src={previewImage || formData.logo_url}
                      alt={formData.logo_alt_text}
                      className="h-10 w-10 object-contain rounded-lg"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    <div className="font-bold text-2xl">
                      {formData.site_name}
                    </div>
                  </div>
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
                <X className="h-5 w-5 mr-2" />
                Cancelar
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
      ) : (
        <SocialMediaSettings />
      )}
    </div>
  );
}