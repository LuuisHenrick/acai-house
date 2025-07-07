import React, { useState, useRef } from 'react';
import { 
  Upload, 
  Image as ImageIcon, 
  X, 
  Check, 
  AlertCircle,
  Loader,
  Eye,
  Trash2,
  RotateCcw
} from 'lucide-react';
import { StorageService } from '../../lib/storage';
import { useSiteSettings } from '../../context/SiteSettingsContext';
import toast from 'react-hot-toast';

interface HeroImageUploadProps {
  currentImageUrl: string;
  onImageUpdate: (url: string) => void;
}

export default function HeroImageUpload({ currentImageUrl, onImageUpdate }: HeroImageUploadProps) {
  const { updateSetting } = useSiteSettings();
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    if (!file) return;

    setIsUploading(true);
    setPreviewUrl(URL.createObjectURL(file));

    try {
      // Upload para o Supabase Storage
      const result = await StorageService.uploadImage(file, 'hero-backgrounds');
      
      // Atualizar configuração no banco
      await updateSetting('hero_background_url', result.url);
      
      // Notificar componente pai
      onImageUpdate(result.url);
      
      toast.success('Imagem de fundo atualizada com sucesso!');
      setPreviewUrl(null);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao fazer upload da imagem');
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const resetToDefault = async () => {
    const defaultUrl = 'https://images.unsplash.com/photo-1596463059283-da257325bab8?auto=format&fit=crop&q=80';
    
    try {
      await updateSetting('hero_background_url', defaultUrl);
      onImageUpdate(defaultUrl);
      toast.success('Imagem restaurada para o padrão');
    } catch (error) {
      toast.error('Erro ao restaurar imagem padrão');
    }
  };

  const useAcaiHouseBanner = async () => {
    const bannerUrl = '/Banner Acai House 2.png';
    
    try {
      await updateSetting('hero_background_url', bannerUrl);
      onImageUpdate(bannerUrl);
      toast.success('Banner da Açaí House aplicado como imagem de fundo!');
    } catch (error) {
      toast.error('Erro ao aplicar banner da Açaí House');
    }
  };

  const openImageInNewTab = () => {
    window.open(currentImageUrl, '_blank');
  };

  // Determinar qual imagem está sendo usada
  const isUsingAcaiHouseBanner = currentImageUrl.includes('Banner Acai House 2.png');
  const isUsingDefault = currentImageUrl.includes('unsplash.com');

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Imagem de Fundo da Seção Principal
        </label>
        <p className="text-sm text-gray-500 mb-4">
          Recomendado: 1920x1080px ou superior, formatos JPG/PNG/WebP, máximo 3MB
        </p>
      </div>

      {/* Preview da Imagem Atual */}
      <div className="relative">
        <div className="aspect-video w-full bg-gray-100 rounded-lg overflow-hidden">
          <img
            src={previewUrl || currentImageUrl}
            alt="Imagem de fundo da hero section"
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = '/Banner Acai House 2.png';
            }}
          />
          
          {/* Overlay com ações */}
          <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center opacity-0 hover:opacity-100">
            <div className="flex space-x-2">
              <button
                onClick={openImageInNewTab}
                className="bg-white text-gray-700 p-2 rounded-full hover:bg-gray-100 transition"
                title="Ver imagem em tamanho real"
              >
                <Eye className="h-5 w-5" />
              </button>
              <button
                onClick={resetToDefault}
                className="bg-white text-gray-700 p-2 rounded-full hover:bg-gray-100 transition"
                title="Restaurar imagem padrão"
              >
                <RotateCcw className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Status da Imagem Atual */}
        <div className="mt-2 text-sm">
          {isUsingAcaiHouseBanner && (
            <div className="flex items-center text-purple-600">
              <Check className="h-4 w-4 mr-2" />
              <span>Usando banner oficial da Açaí House</span>
            </div>
          )}
          {isUsingDefault && (
            <div className="flex items-center text-gray-500">
              <AlertCircle className="h-4 w-4 mr-2" />
              <span>Usando imagem padrão do sistema</span>
            </div>
          )}
        </div>

        {/* Loading Overlay */}
        {isUploading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
            <div className="bg-white p-4 rounded-lg flex items-center space-x-3">
              <Loader className="h-5 w-5 animate-spin text-purple-600" />
              <span className="text-sm font-medium">Fazendo upload...</span>
            </div>
          </div>
        )}
      </div>

      {/* Opções Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={useAcaiHouseBanner}
          disabled={isUsingAcaiHouseBanner}
          className="flex items-center justify-center p-4 border-2 border-purple-200 rounded-lg hover:border-purple-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="text-center">
            <ImageIcon className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <p className="font-medium text-purple-600">Usar Banner da Açaí House</p>
            <p className="text-sm text-gray-500">Banner oficial com identidade visual</p>
          </div>
        </button>

        <button
          onClick={resetToDefault}
          disabled={isUsingDefault}
          className="flex items-center justify-center p-4 border-2 border-gray-200 rounded-lg hover:border-gray-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="text-center">
            <RotateCcw className="h-8 w-8 text-gray-600 mx-auto mb-2" />
            <p className="font-medium text-gray-600">Usar Imagem Padrão</p>
            <p className="text-sm text-gray-500">Imagem genérica do sistema</p>
          </div>
        </button>
      </div>

      {/* Área de Upload */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all ${
          dragActive 
            ? 'border-purple-400 bg-purple-50' 
            : 'border-gray-300 hover:border-gray-400'
        } ${isUploading ? 'pointer-events-none opacity-50' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFileInputChange}
          className="hidden"
          disabled={isUploading}
        />

        <div className="space-y-4">
          <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
            <Upload className="h-6 w-6 text-gray-400" />
          </div>
          
          <div>
            <p className="text-lg font-medium text-gray-900">
              {dragActive ? 'Solte a imagem aqui' : 'Ou faça upload de uma nova imagem'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              JPG, PNG ou WebP até 3MB
            </p>
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
          >
            <ImageIcon className="h-5 w-5 mr-2" />
            Selecionar Imagem
          </button>
        </div>
      </div>

      {/* Informações Adicionais */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Dicas para melhor resultado:</p>
            <ul className="list-disc list-inside space-y-1 text-blue-700">
              <li>Use imagens com resolução mínima de 1920x1080px</li>
              <li>Prefira imagens horizontais (landscape)</li>
              <li>Evite imagens com muito texto ou detalhes pequenos</li>
              <li>A imagem será exibida com overlay escuro para melhor legibilidade do texto</li>
              <li>O banner oficial da Açaí House já está otimizado para o site</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}