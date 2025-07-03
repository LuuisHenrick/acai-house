import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Save, 
  X, 
  Search,
  Filter,
  ToggleLeft,
  ToggleRight,
  Package,
  Eye,
  GripVertical,
  AlertCircle,
  Check,
  Hash,
  Type,
  Palette,
  Tag as TagIcon
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

interface ProductCategory {
  id: string;
  name: string;
  description: string;
  slug: string;
  color: string;
  icon: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
  product_count?: number;
}

interface CategoryFormData {
  name: string;
  description: string;
  slug: string;
  color: string;
  icon: string;
  is_active: boolean;
}

const defaultFormData: CategoryFormData = {
  name: '',
  description: '',
  slug: '',
  color: '#8B5CF6',
  icon: 'package',
  is_active: true
};

const availableIcons = [
  { value: 'package', label: 'Package' },
  { value: 'bowl', label: 'Bowl' },
  { value: 'star', label: 'Star' },
  { value: 'crown', label: 'Crown' },
  { value: 'coffee', label: 'Coffee' },
  { value: 'cake', label: 'Cake' },
  { value: 'heart', label: 'Heart' },
  { value: 'gift', label: 'Gift' },
  { value: 'zap', label: 'Zap' },
  { value: 'tag', label: 'Tag' }
];

const availableColors = [
  '#8B5CF6', '#F59E0B', '#EF4444', '#10B981', '#EC4899',
  '#3B82F6', '#F97316', '#84CC16', '#06B6D4', '#8B5A2B'
];

function CategoryModal({ 
  category, 
  onClose, 
  onSave 
}: { 
  category: ProductCategory | null; 
  onClose: () => void; 
  onSave: (data: CategoryFormData) => Promise<void>; 
}) {
  const [formData, setFormData] = useState<CategoryFormData>(
    category ? {
      name: category.name || '',
      description: category.description || '',
      slug: category.slug || '',
      color: category.color || '#8B5CF6',
      icon: category.icon || 'package',
      is_active: category.is_active ?? true
    } : defaultFormData
  );
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  // Auto-generate slug from name
  useEffect(() => {
    if (!slugManuallyEdited && formData.name) {
      const generatedSlug = formData.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '-')
        .trim();
      
      setFormData(prev => ({ ...prev, slug: generatedSlug }));
    }
  }, [formData.name, slugManuallyEdited]);

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    // Validar nome
    if (!formData.name?.trim()) {
      newErrors.name = 'Nome é obrigatório';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Nome deve ter pelo menos 2 caracteres';
    } else if (formData.name.trim().length > 50) {
      newErrors.name = 'Nome deve ter no máximo 50 caracteres';
    }

    // Validar slug
    if (!formData.slug?.trim()) {
      newErrors.slug = 'Slug é obrigatório';
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug = 'Slug deve conter apenas letras minúsculas, números e hífens';
    } else if (formData.slug.length < 2) {
      newErrors.slug = 'Slug deve ter pelo menos 2 caracteres';
    }

    // Validar descrição
    if (formData.description && formData.description.length > 200) {
      newErrors.description = 'Descrição deve ter no máximo 200 caracteres';
    }

    // Validar cor
    if (!formData.color || !/^#[0-9A-Fa-f]{6}$/.test(formData.color)) {
      newErrors.color = 'Cor deve estar no formato hexadecimal válido';
    }

    // Validar ícone
    if (!formData.icon?.trim()) {
      newErrors.icon = 'Ícone é obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Por favor, corrija os erros no formulário');
      return;
    }

    setIsLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving category:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSlugChange = (value: string) => {
    setSlugManuallyEdited(true);
    setFormData(prev => ({ ...prev, slug: value }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="text-xl font-semibold">
            {category ? 'Editar Categoria' : 'Nova Categoria'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome da Categoria *
            </label>
            <div className="relative">
              <Type className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full pl-10 p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Ex: Açaí Premium"
                maxLength={50}
              />
            </div>
            {errors.name && (
              <p className="text-red-500 text-sm mt-1 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.name}
              </p>
            )}
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Slug (URL) *
            </label>
            <div className="relative">
              <Hash className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                required
                value={formData.slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                className={`w-full pl-10 p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                  errors.slug ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="acai-premium"
                pattern="^[a-z0-9-]+$"
              />
            </div>
            {errors.slug && (
              <p className="text-red-500 text-sm mt-1 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.slug}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Usado para URLs. Apenas letras minúsculas, números e hífens.
            </p>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descrição
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
              rows={3}
              placeholder="Descreva a categoria..."
              maxLength={200}
            />
            {errors.description && (
              <p className="text-red-500 text-sm mt-1 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.description}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              {formData.description?.length || 0}/200 caracteres
            </p>
          </div>

          {/* Cor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cor *
            </label>
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Palette className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className={`w-32 pl-10 p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    errors.color ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="#8B5CF6"
                  pattern="^#[0-9A-Fa-f]{6}$"
                />
              </div>
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-12 h-12 border rounded-lg cursor-pointer"
              />
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {availableColors.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className={`w-8 h-8 rounded-full border-2 transition ${
                    formData.color === color ? 'border-gray-800' : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
            {errors.color && (
              <p className="text-red-500 text-sm mt-1 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.color}
              </p>
            )}
          </div>

          {/* Ícone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ícone *
            </label>
            <select
              value={formData.icon}
              onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                errors.icon ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              {availableIcons.map(icon => (
                <option key={icon.value} value={icon.value}>
                  {icon.label}
                </option>
              ))}
            </select>
            {errors.icon && (
              <p className="text-red-500 text-sm mt-1 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.icon}
              </p>
            )}
          </div>

          {/* Status Ativo */}
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="mr-2 h-4 w-4 text-purple-600 rounded"
            />
            <label className="text-sm font-medium text-gray-700">
              Categoria Ativa
            </label>
          </div>

          {/* Preview */}
          <div className="border-t pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preview
            </label>
            <div 
              className="flex items-center p-3 rounded-lg border"
              style={{ backgroundColor: `${formData.color}20`, borderColor: formData.color }}
            >
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center mr-3"
                style={{ backgroundColor: formData.color }}
              >
                <Package className="h-4 w-4 text-white" />
              </div>
              <div>
                <div className="font-medium text-gray-900">
                  {formData.name || 'Nome da Categoria'}
                </div>
                {formData.description && (
                  <div className="text-sm text-gray-600">
                    {formData.description}
                  </div>
                )}
              </div>
            </div>
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
              disabled={isLoading}
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

export default function CategoryManager() {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<ProductCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState<ProductCategory | null | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    filterCategories();
  }, [categories, searchTerm, showInactive]);

  const loadCategories = async () => {
    try {
      // Carregar categorias com contagem de produtos
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('product_categories')
        .select(`
          *,
          products!products_category_id_fkey(count)
        `)
        .order('display_order', { ascending: true });

      if (categoriesError) throw categoriesError;

      // Processar dados para incluir contagem de produtos
      const processedCategories = (categoriesData || []).map(category => ({
        ...category,
        product_count: category.products?.[0]?.count || 0
      }));

      setCategories(processedCategories);
    } catch (error) {
      console.error('Error loading categories:', error);
      toast.error('Erro ao carregar categorias');
      // Fallback para evitar erro React #130
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filterCategories = () => {
    if (!Array.isArray(categories)) {
      setFilteredCategories([]);
      return;
    }

    let filtered = categories;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(category =>
        category?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category?.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category?.slug?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by active status
    if (!showInactive) {
      filtered = filtered.filter(category => category?.is_active);
    }

    setFilteredCategories(filtered);
  };

  const handleSaveCategory = async (formData: CategoryFormData) => {
    try {
      // Validar dados antes de enviar
      if (!formData.name?.trim()) {
        throw new Error('Nome da categoria é obrigatório');
      }

      if (!formData.slug?.trim()) {
        throw new Error('Slug da categoria é obrigatório');
      }

      const user = (await supabase.auth.getUser()).data.user;
      
      if (editingCategory) {
        // Verificar se categoria existe antes de atualizar
        if (!editingCategory.id) {
          throw new Error('ID da categoria não encontrado');
        }

        // Update existing category
        const { error } = await supabase
          .from('product_categories')
          .update({
            name: formData.name.trim(),
            description: formData.description?.trim() || null,
            slug: formData.slug.trim(),
            color: formData.color,
            icon: formData.icon,
            is_active: formData.is_active,
            updated_by: user?.id
          })
          .eq('id', editingCategory.id);

        if (error) {
          if (error.code === '23505') {
            if (error.message.includes('name')) {
              throw new Error('Já existe uma categoria com este nome');
            } else if (error.message.includes('slug')) {
              throw new Error('Já existe uma categoria com este slug');
            }
          }
          throw error;
        }

        toast.success('Categoria atualizada com sucesso!');
      } else {
        // Create new category
        const { error } = await supabase
          .from('product_categories')
          .insert({
            name: formData.name.trim(),
            description: formData.description?.trim() || null,
            slug: formData.slug.trim(),
            color: formData.color,
            icon: formData.icon,
            is_active: formData.is_active,
            display_order: categories.length + 1,
            created_by: user?.id
          });

        if (error) {
          if (error.code === '23505') {
            if (error.message.includes('name')) {
              throw new Error('Já existe uma categoria com este nome');
            } else if (error.message.includes('slug')) {
              throw new Error('Já existe uma categoria com este slug');
            }
          }
          throw error;
        }

        toast.success('Categoria criada com sucesso!');
      }

      loadCategories();
    } catch (error) {
      console.error('Error saving category:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao salvar categoria';
      toast.error(errorMessage);
      throw error;
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!id) {
      toast.error('ID da categoria não encontrado');
      return;
    }

    if (!confirm('Tem certeza que deseja excluir esta categoria? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      // Verificar se há produtos associados
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id')
        .eq('category_id', id)
        .limit(1);

      if (productsError) throw productsError;

      if (products && products.length > 0) {
        toast.error('Não é possível excluir uma categoria que possui produtos associados');
        return;
      }

      const { error } = await supabase
        .from('product_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Categoria excluída com sucesso!');
      loadCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Erro ao excluir categoria');
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    if (!id) {
      toast.error('ID da categoria não encontrado');
      return;
    }

    try {
      const { error } = await supabase
        .from('product_categories')
        .update({ 
          is_active: !isActive,
          updated_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', id);

      if (error) throw error;
      
      toast.success(`Categoria ${!isActive ? 'ativada' : 'desativada'} com sucesso!`);
      loadCategories();
    } catch (error) {
      console.error('Error toggling category:', error);
      toast.error('Erro ao alterar status da categoria');
    }
  };

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;

    const items = Array.from(filteredCategories);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update display order in database
    try {
      const updates = items.map((item, index) => ({
        id: item.id,
        display_order: index + 1
      }));

      for (const update of updates) {
        await supabase
          .from('product_categories')
          .update({ display_order: update.display_order })
          .eq('id', update.id);
      }

      loadCategories();
      toast.success('Ordem atualizada com sucesso!');
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Erro ao atualizar ordem');
    }
  };

  // Fallback de renderização para evitar erro React #130
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-purple-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gerenciar Categorias</h2>
          <p className="text-gray-600 mt-1">
            Organize seus produtos em categorias para facilitar a navegação
          </p>
        </div>
        <button
          onClick={() => setEditingCategory(null)}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-purple-700 transition"
        >
          <Plus className="h-5 w-5 mr-2" />
          Nova Categoria
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <TagIcon className="h-8 w-8 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total de Categorias</p>
              <p className="text-2xl font-bold text-gray-900">{categories?.length || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Eye className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Categorias Ativas</p>
              <p className="text-2xl font-bold text-gray-900">
                {categories?.filter(c => c?.is_active).length || 0}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Package className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total de Produtos</p>
              <p className="text-2xl font-bold text-gray-900">
                {categories?.reduce((sum, c) => sum + (c?.product_count || 0), 0) || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar categorias..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          
          <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="mr-2 h-4 w-4 text-purple-600 rounded"
            />
            <span className="text-sm">Mostrar inativas</span>
          </label>

          <div className="flex items-center text-sm text-gray-600">
            <Filter className="h-4 w-4 mr-2" />
            {filteredCategories?.length || 0} de {categories?.length || 0} categorias
          </div>
        </div>
      </div>

      {/* Categories List */}
      {!filteredCategories || filteredCategories.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <TagIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {!categories || categories.length === 0 ? 'Nenhuma categoria cadastrada' : 'Nenhuma categoria encontrada'}
          </h3>
          <p className="text-gray-500 mb-4">
            {!categories || categories.length === 0 
              ? 'Comece criando sua primeira categoria' 
              : 'Tente ajustar os filtros de busca'
            }
          </p>
          {(!categories || categories.length === 0) && (
            <button
              onClick={() => setEditingCategory(null)}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition"
            >
              Criar Categoria
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="categories">
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps}>
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ordem
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Categoria
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Slug
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Produtos
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredCategories.map((category, index) => (
                        <Draggable key={category?.id || index} draggableId={category?.id || `category-${index}`} index={index}>
                          {(provided) => (
                            <tr
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className="hover:bg-gray-50"
                            >
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div {...provided.dragHandleProps} className="cursor-move">
                                  <GripVertical className="h-5 w-5 text-gray-400" />
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div 
                                    className="w-8 h-8 rounded-full flex items-center justify-center mr-3"
                                    style={{ backgroundColor: category?.color || '#8B5CF6' }}
                                  >
                                    <Package className="h-4 w-4 text-white" />
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">
                                      {category?.name || 'Nome não definido'}
                                    </div>
                                    {category?.description && (
                                      <div className="text-sm text-gray-500">
                                        {category.description}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                                  {category?.slug || 'slug-não-definido'}
                                </code>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  {category?.product_count || 0} produtos
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  category?.is_active 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {category?.is_active ? 'Ativa' : 'Inativa'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex items-center justify-end space-x-2">
                                  <button
                                    onClick={() => setEditingCategory(category)}
                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition"
                                    title="Editar"
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleToggleActive(category?.id || '', category?.is_active || false)}
                                    className="p-2 text-gray-600 hover:bg-gray-50 rounded-full transition"
                                    title={category?.is_active ? 'Desativar' : 'Ativar'}
                                  >
                                    {category?.is_active ? (
                                      <ToggleRight className="h-4 w-4 text-green-600" />
                                    ) : (
                                      <ToggleLeft className="h-4 w-4" />
                                    )}
                                  </button>
                                  <button
                                    onClick={() => handleDeleteCategory(category?.id || '')}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-full transition"
                                    title="Excluir"
                                    disabled={!category?.id || (category?.product_count || 0) > 0}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </tbody>
                  </table>
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      )}

      {/* Modal */}
      {editingCategory !== undefined && (
        <CategoryModal
          category={editingCategory}
          onClose={() => setEditingCategory(undefined)}
          onSave={handleSaveCategory}
        />
      )}
    </div>
  );
}