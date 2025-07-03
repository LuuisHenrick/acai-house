import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Save, 
  X, 
  Upload,
  Image as ImageIcon,
  GripVertical,
  Star,
  Eye,
  AlertCircle,
  Check,
  Loader
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { StorageService } from '../../lib/storage';
import toast from 'react-hot-toast';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  alt_text: string;
  display_order: number;
  is_primary: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ProductImageGalleryProps {
  productId: string;
  productName: string;
  onImagesChange?: (images: ProductImage[]) => void;
}

interface ImageFormData {
  image_url: string;
  alt_text: string;
  is_primary: boolean;
}

function ImageModal({ 
  image, 
  onClose, 
  onSave 
}: { 
  image: ProductImage | null; 
  onClose: () => void; 
  onSave: (data: ImageFormData) => Promise<void>; 
}) {
  const [formData, setFormData] = useState<ImageFormData>(
    image ? {
      image_url: image.image_url || '',
      alt_text: image.alt_text || '',
      is_primary: image.is_primary || false
    } : {
      image_url: '',
      alt_text: '',
      is_primary: false
    }
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (file: File) => {
    if (!file) return;

    setIsUploading(true);
    setPreviewUrl(URL.createObjectURL(file));

    try {
      // Upload otimizado para produtos
      const result = await StorageService.uploadImage(file, 'product-images', {
        maxSizeBytes: 2 * 1024 * 1024, // 2MB
        allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      });
      
      setFormData(prev => ({ ...prev, image_url: result.url }));
      toast.success('Imagem carregada com sucesso!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao fazer upload da imagem');
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.image_url?.trim()) {
      toast.error('URL da imagem é obrigatória');
      return;
    }

    setIsLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving image:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="text-xl font-semibold">
            {image ? 'Editar Imagem' : 'Nova Imagem'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Upload de Imagem */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Imagem do Produto
            </label>
            
            {/* Preview da Imagem */}
            <div className="mb-4">
              <div className="aspect-square w-full bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-300">
                {(previewUrl || formData.image_url) ? (
                  <img
                    src={previewUrl || formData.image_url}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    style={{ 
                      objectFit: 'cover',
                      objectPosition: 'center'
                    }}
                  />
                ) : (
                  <div className="text-center">
                    <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Nenhuma imagem selecionada</p>
                  </div>
                )}
              </div>
              
              {/* Loading Overlay */}
              {isUploading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                  <div className="bg-white p-4 rounded-lg flex items-center space-x-3">
                    <Loader className="h-5 w-5 animate-spin text-purple-600" />
                    <span className="text-sm font-medium">Otimizando imagem...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Upload Options */}
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-full flex items-center justify-center px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition disabled:opacity-50"
              >
                <Upload className="h-5 w-5 mr-2" />
                {isUploading ? 'Fazendo upload...' : 'Escolher Arquivo'}
              </button>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file);
                }}
                className="hidden"
                disabled={isUploading}
              />

              <div className="relative">
                <input
                  type="url"
                  placeholder="Ou cole uma URL de imagem"
                  value={formData.image_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Dicas de Otimização */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Dicas para melhor qualidade:</p>
                  <ul className="list-disc list-inside space-y-1 text-blue-700">
                    <li>Use imagens quadradas (1:1) para melhor exibição</li>
                    <li>Resolução mínima recomendada: 800x800px</li>
                    <li>Formatos aceitos: JPG, PNG, WebP (máx. 2MB)</li>
                    <li>Evite imagens com muito texto pequeno</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Texto Alternativo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Texto Alternativo (Alt Text)
            </label>
            <input
              type="text"
              value={formData.alt_text}
              onChange={(e) => setFormData(prev => ({ ...prev, alt_text: e.target.value }))}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Descreva a imagem para acessibilidade"
            />
            <p className="text-xs text-gray-500 mt-1">
              Importante para SEO e acessibilidade
            </p>
          </div>

          {/* Imagem Principal */}
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={formData.is_primary}
              onChange={(e) => setFormData(prev => ({ ...prev, is_primary: e.target.checked }))}
              className="mr-2 h-4 w-4 text-purple-600 rounded"
            />
            <label className="text-sm font-medium text-gray-700 flex items-center">
              <Star className="h-4 w-4 mr-1 text-yellow-500" />
              Imagem Principal
            </label>
          </div>

          {/* Botões */}
          <div className="flex justify-end space-x-4 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-600 hover:text-gray-800 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading || isUploading}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProductImageGallery({ 
  productId, 
  productName, 
  onImagesChange 
}: ProductImageGalleryProps) {
  const [images, setImages] = useState<ProductImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingImage, setEditingImage] = useState<ProductImage | null | undefined>(undefined);

  useEffect(() => {
    if (productId) {
      loadImages();
    }
  }, [productId]);

  useEffect(() => {
    if (onImagesChange) {
      onImagesChange(images);
    }
  }, [images, onImagesChange]);

  const loadImages = async () => {
    if (!productId) return;

    try {
      const { data, error } = await supabase
        .from('product_images')
        .select('*')
        .eq('product_id', productId)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setImages(data || []);
    } catch (error) {
      console.error('Error loading images:', error);
      toast.error('Erro ao carregar imagens');
      setImages([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveImage = async (formData: ImageFormData) => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      
      if (editingImage) {
        // Update existing image
        const { error } = await supabase
          .from('product_images')
          .update({
            image_url: formData.image_url,
            alt_text: formData.alt_text || null,
            is_primary: formData.is_primary,
            updated_by: user?.id
          })
          .eq('id', editingImage.id);

        if (error) throw error;
        toast.success('Imagem atualizada com sucesso!');
      } else {
        // Create new image
        const { error } = await supabase
          .from('product_images')
          .insert({
            product_id: productId,
            image_url: formData.image_url,
            alt_text: formData.alt_text || null,
            is_primary: formData.is_primary,
            display_order: images.length + 1,
            created_by: user?.id
          });

        if (error) throw error;
        toast.success('Imagem adicionada com sucesso!');
      }

      loadImages();
    } catch (error) {
      console.error('Error saving image:', error);
      toast.error('Erro ao salvar imagem');
      throw error;
    }
  };

  const handleDeleteImage = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta imagem?')) return;

    try {
      const { error } = await supabase
        .from('product_images')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
      toast.success('Imagem excluída com sucesso!');
      loadImages();
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error('Erro ao excluir imagem');
    }
  };

  const handleSetPrimary = async (id: string) => {
    try {
      const { error } = await supabase
        .from('product_images')
        .update({ is_primary: true })
        .eq('id', id);

      if (error) throw error;
      toast.success('Imagem principal definida!');
      loadImages();
    } catch (error) {
      console.error('Error setting primary image:', error);
      toast.error('Erro ao definir imagem principal');
    }
  };

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;

    const items = Array.from(images);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update local state immediately for better UX
    setImages(items);

    // Update display order in database
    try {
      const updates = items.map((item, index) => ({
        id: item.id,
        display_order: index + 1
      }));

      for (const update of updates) {
        await supabase
          .from('product_images')
          .update({ display_order: update.display_order })
          .eq('id', update.id);
      }

      toast.success('Ordem das imagens atualizada!');
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Erro ao atualizar ordem');
      // Reload images to restore correct order
      loadImages();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin h-6 w-6 border-4 border-purple-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Galeria de Imagens</h3>
          <p className="text-sm text-gray-600">
            Gerencie as imagens do produto "{productName}"
          </p>
        </div>
        <button
          onClick={() => setEditingImage(null)}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-purple-700 transition text-sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Imagem
        </button>
      </div>

      {/* Images Grid */}
      {images.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma imagem adicionada</h3>
          <p className="text-gray-500 mb-4">
            Adicione imagens para mostrar seu produto aos clientes
          </p>
          <button
            onClick={() => setEditingImage(null)}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition"
          >
            Adicionar Primeira Imagem
          </button>
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="images" direction="horizontal">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
              >
                {images.map((image, index) => (
                  <Draggable key={image.id} draggableId={image.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`relative group bg-white rounded-lg shadow-md overflow-hidden border-2 transition-all ${
                          snapshot.isDragging 
                            ? 'border-purple-500 shadow-lg scale-105' 
                            : image.is_primary 
                              ? 'border-yellow-400' 
                              : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {/* Drag Handle */}
                        <div
                          {...provided.dragHandleProps}
                          className="absolute top-2 left-2 z-10 bg-white bg-opacity-90 p-1 rounded cursor-move opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <GripVertical className="h-4 w-4 text-gray-600" />
                        </div>

                        {/* Primary Badge */}
                        {image.is_primary && (
                          <div className="absolute top-2 right-2 z-10 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center">
                            <Star className="h-3 w-3 mr-1" />
                            Principal
                          </div>
                        )}

                        {/* Image */}
                        <div className="aspect-square">
                          <img
                            src={image.image_url}
                            alt={image.alt_text || `Imagem ${index + 1} do produto`}
                            className="w-full h-full object-cover"
                            style={{ 
                              objectFit: 'cover',
                              objectPosition: 'center'
                            }}
                            onError={(e) => {
                              e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik04MCA4MEgxMjBWMTIwSDgwVjgwWiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4=';
                            }}
                          />
                        </div>

                        {/* Actions Overlay */}
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <div className="flex space-x-2">
                            {!image.is_primary && (
                              <button
                                onClick={() => handleSetPrimary(image.id)}
                                className="bg-yellow-500 text-white p-2 rounded-full hover:bg-yellow-600 transition"
                                title="Definir como principal"
                              >
                                <Star className="h-4 w-4" />
                              </button>
                            )}
                            <button
                              onClick={() => setEditingImage(image)}
                              className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 transition"
                              title="Editar"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteImage(image.id)}
                              className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition"
                              title="Excluir"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        {/* Image Info */}
                        <div className="p-3 bg-white">
                          <p className="text-xs text-gray-600 truncate">
                            {image.alt_text || `Imagem ${index + 1}`}
                          </p>
                          <p className="text-xs text-gray-400">
                            Ordem: {image.display_order}
                          </p>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}

      {/* Instructions */}
      {images.length > 1 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <Eye className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Como usar a galeria:</p>
              <ul className="list-disc list-inside space-y-1 text-blue-700">
                <li>Arraste e solte as imagens para reordenar</li>
                <li>A primeira imagem será exibida como principal no cardápio</li>
                <li>Use a estrela para definir uma imagem específica como principal</li>
                <li>Adicione texto alternativo para melhorar SEO e acessibilidade</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {editingImage !== undefined && (
        <ImageModal
          image={editingImage}
          onClose={() => setEditingImage(undefined)}
          onSave={handleSaveImage}
        />
      )}
    </div>
  );
}