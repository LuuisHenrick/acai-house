import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Save, 
  X, 
  Camera, 
  DollarSign,
  Package,
  ToggleLeft,
  ToggleRight,
  GripVertical,
  Eye,
  Copy,
  Check
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  image_url: string;
  active: boolean;
  display_order: number;
  sizes: ProductSize[];
  addon_groups: AddonGroup[];
}

interface ProductSize {
  id: string;
  size_name: string;
  size_label: string;
  price: number;
  active: boolean;
  display_order: number;
}

interface AddonGroup {
  id: string;
  name: string;
  description: string;
  is_required: boolean;
  min_selections: number;
  max_selections: number | null;
  active: boolean;
  options: AddonOption[];
}

interface AddonOption {
  id: string;
  name: string;
  price: number;
  active: boolean;
  display_order: number;
}

interface ProductFormData {
  name: string;
  description: string;
  category: string;
  image_url: string;
  active: boolean;
  sizes: ProductSize[];
  addon_groups: AddonGroup[];
}

const categories = [
  { value: 'tradicional', label: 'Tradicional' },
  { value: 'especial', label: 'Especial' },
  { value: 'premium', label: 'Premium' },
  { value: 'bebidas', label: 'Bebidas' },
  { value: 'sobremesas', label: 'Sobremesas' }
];

const defaultSizes: ProductSize[] = [
  { id: '', size_name: 'P', size_label: 'Pequeno (300ml)', price: 12.90, active: true, display_order: 1 },
  { id: '', size_name: 'M', size_label: 'Médio (500ml)', price: 16.90, active: true, display_order: 2 },
  { id: '', size_name: 'G', size_label: 'Grande (700ml)', price: 22.90, active: true, display_order: 3 }
];

function ProductModal({ 
  product, 
  onClose, 
  onSave,
  availableAddonGroups 
}: { 
  product: Product | null; 
  onClose: () => void; 
  onSave: (data: ProductFormData) => Promise<void>;
  availableAddonGroups: AddonGroup[];
}) {
  const [formData, setFormData] = useState<ProductFormData>(
    product ? {
      name: product.name,
      description: product.description,
      category: product.category,
      image_url: product.image_url,
      active: product.active,
      sizes: product.sizes.length > 0 ? product.sizes : defaultSizes,
      addon_groups: product.addon_groups
    } : {
      name: '',
      description: '',
      category: 'tradicional',
      image_url: '',
      active: true,
      sizes: defaultSizes,
      addon_groups: []
    }
  );
  const [isLoading, setIsLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result as string);
      setFormData({ ...formData, image_url: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const handleSizeChange = (index: number, field: keyof ProductSize, value: any) => {
    const newSizes = [...formData.sizes];
    newSizes[index] = { ...newSizes[index], [field]: value };
    setFormData({ ...formData, sizes: newSizes });
  };

  const addSize = () => {
    const newSize: ProductSize = {
      id: '',
      size_name: '',
      size_label: '',
      price: 0,
      active: true,
      display_order: formData.sizes.length + 1
    };
    setFormData({ ...formData, sizes: [...formData.sizes, newSize] });
  };

  const removeSize = (index: number) => {
    const newSizes = formData.sizes.filter((_, i) => i !== index);
    setFormData({ ...formData, sizes: newSizes });
  };

  const toggleAddonGroup = (group: AddonGroup) => {
    const isSelected = formData.addon_groups.some(g => g.id === group.id);
    if (isSelected) {
      setFormData({
        ...formData,
        addon_groups: formData.addon_groups.filter(g => g.id !== group.id)
      });
    } else {
      setFormData({
        ...formData,
        addon_groups: [...formData.addon_groups, group]
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.sizes.length === 0) {
      toast.error('Adicione pelo menos um tamanho');
      return;
    }

    if (formData.sizes.some(size => !size.size_name || size.price <= 0)) {
      toast.error('Todos os tamanhos devem ter nome e preço válidos');
      return;
    }

    setIsLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving product:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="text-xl font-semibold">
            {product ? 'Editar Produto' : 'Novo Produto'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Informações Básicas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Produto *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Ex: Açaí Premium"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoria *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={4}
                  placeholder="Descreva o produto..."
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="mr-2 h-4 w-4 text-purple-600 rounded"
                />
                <label className="text-sm font-medium text-gray-700">
                  Produto Ativo
                </label>
              </div>
            </div>

            {/* Imagem */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Imagem do Produto
              </label>
              <div 
                className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center cursor-pointer overflow-hidden border-2 border-dashed border-gray-300 hover:border-purple-400 transition"
                onClick={() => fileInputRef.current?.click()}
              >
                {(previewImage || formData.image_url) ? (
                  <img
                    src={previewImage || formData.image_url}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center">
                    <Camera className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Clique para adicionar uma imagem</p>
                  </div>
                )}
              </div>
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
              <input
                type="url"
                placeholder="Ou cole uma URL de imagem"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                className="w-full mt-2 p-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Tamanhos e Preços */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-medium">Tamanhos e Preços</h4>
              <button
                type="button"
                onClick={addSize}
                className="bg-purple-100 text-purple-700 px-3 py-1 rounded-lg text-sm hover:bg-purple-200 transition"
              >
                <Plus className="h-4 w-4 inline mr-1" />
                Adicionar Tamanho
              </button>
            </div>
            <div className="space-y-3">
              {formData.sizes.map((size, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 bg-gray-50 rounded-lg">
                  <input
                    type="text"
                    placeholder="Nome (ex: P, M, G)"
                    value={size.size_name}
                    onChange={(e) => handleSizeChange(index, 'size_name', e.target.value)}
                    className="p-2 border rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <input
                    type="text"
                    placeholder="Descrição (ex: Pequeno 300ml)"
                    value={size.size_label}
                    onChange={(e) => handleSizeChange(index, 'size_label', e.target.value)}
                    className="p-2 border rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500">R$</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={size.price}
                      onChange={(e) => handleSizeChange(index, 'price', parseFloat(e.target.value) || 0)}
                      className="w-full pl-8 p-2 border rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={size.active}
                        onChange={(e) => handleSizeChange(index, 'active', e.target.checked)}
                        className="mr-1"
                      />
                      <span className="text-sm">Ativo</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => removeSize(index)}
                      className="p-1 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Grupos de Adicionais */}
          <div>
            <h4 className="text-lg font-medium mb-4">Grupos de Adicionais</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {availableAddonGroups.map(group => (
                <label
                  key={group.id}
                  className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={formData.addon_groups.some(g => g.id === group.id)}
                    onChange={() => toggleAddonGroup(group)}
                    className="mr-3 h-4 w-4 text-purple-600 rounded"
                  />
                  <div className="flex-1">
                    <div className="font-medium">{group.name}</div>
                    <div className="text-sm text-gray-600">{group.description}</div>
                    <div className="text-xs text-gray-500">
                      {group.is_required ? 'Obrigatório' : 'Opcional'} • 
                      Min: {group.min_selections} • 
                      Max: {group.max_selections || 'Ilimitado'}
                    </div>
                  </div>
                </label>
              ))}
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

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [addonGroups, setAddonGroups] = useState<AddonGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null | undefined>(undefined);

  useEffect(() => {
    loadProducts();
    loadAddonGroups();
  }, []);

  const loadProducts = async () => {
    try {
      // Carregar produtos com tamanhos
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select(`
          *,
          product_sizes (*)
        `)
        .order('display_order', { ascending: true });

      if (productsError) throw productsError;

      // Carregar grupos de adicionais para cada produto
      const productsWithAddons = await Promise.all(
        (productsData || []).map(async (product) => {
          const { data: addonGroupsData } = await supabase
            .from('product_addon_groups')
            .select(`
              addon_groups (
                *,
                addon_options (*)
              )
            `)
            .eq('product_id', product.id);

          return {
            ...product,
            sizes: product.product_sizes || [],
            addon_groups: addonGroupsData?.map(item => item.addon_groups).filter(Boolean) || []
          };
        })
      );

      setProducts(productsWithAddons);
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Erro ao carregar produtos');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAddonGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('addon_groups')
        .select(`
          *,
          addon_options (*)
        `)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setAddonGroups(data || []);
    } catch (error) {
      console.error('Error loading addon groups:', error);
    }
  };

  const handleSaveProduct = async (formData: ProductFormData) => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      
      if (editingProduct) {
        // Atualizar produto existente
        const { error: productError } = await supabase
          .from('products')
          .update({
            name: formData.name,
            description: formData.description,
            category: formData.category,
            image_url: formData.image_url,
            active: formData.active,
            updated_by: user?.id
          })
          .eq('id', editingProduct.id);

        if (productError) throw productError;

        // Atualizar tamanhos
        await supabase
          .from('product_sizes')
          .delete()
          .eq('product_id', editingProduct.id);

        for (const size of formData.sizes) {
          await supabase
            .from('product_sizes')
            .insert({
              product_id: editingProduct.id,
              size_name: size.size_name,
              size_label: size.size_label,
              price: size.price,
              active: size.active,
              display_order: size.display_order
            });
        }

        // Atualizar grupos de adicionais
        await supabase
          .from('product_addon_groups')
          .delete()
          .eq('product_id', editingProduct.id);

        for (const group of formData.addon_groups) {
          await supabase
            .from('product_addon_groups')
            .insert({
              product_id: editingProduct.id,
              addon_group_id: group.id
            });
        }

        toast.success('Produto atualizado com sucesso!');
      } else {
        // Criar novo produto
        const { data: productData, error: productError } = await supabase
          .from('products')
          .insert({
            name: formData.name,
            description: formData.description,
            category: formData.category,
            image_url: formData.image_url,
            active: formData.active,
            display_order: products.length + 1,
            created_by: user?.id
          })
          .select()
          .single();

        if (productError) throw productError;

        // Inserir tamanhos
        for (const size of formData.sizes) {
          await supabase
            .from('product_sizes')
            .insert({
              product_id: productData.id,
              size_name: size.size_name,
              size_label: size.size_label,
              price: size.price,
              active: size.active,
              display_order: size.display_order
            });
        }

        // Inserir grupos de adicionais
        for (const group of formData.addon_groups) {
          await supabase
            .from('product_addon_groups')
            .insert({
              product_id: productData.id,
              addon_group_id: group.id
            });
        }

        toast.success('Produto criado com sucesso!');
      }

      loadProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error('Erro ao salvar produto');
      throw error;
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Produto excluído com sucesso!');
      loadProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Erro ao excluir produto');
    }
  };

  const handleToggleActive = async (id: string, active: boolean) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ 
          active: !active,
          updated_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', id);

      if (error) throw error;
      toast.success(`Produto ${!active ? 'ativado' : 'desativado'} com sucesso!`);
      loadProducts();
    } catch (error) {
      console.error('Error toggling product:', error);
      toast.error('Erro ao alterar status do produto');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-purple-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Gerenciar Produtos</h2>
        <button
          onClick={() => setEditingProduct(null)}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-purple-700 transition"
        >
          <Plus className="h-5 w-5 mr-2" />
          Novo Produto
        </button>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum produto cadastrado</h3>
          <p className="text-gray-500 mb-4">Comece criando seu primeiro produto</p>
          <button
            onClick={() => setEditingProduct(null)}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition"
          >
            Criar Produto
          </button>
        </div>
      ) : (
        <div className="grid gap-6">
          {products.map((product) => (
            <div key={product.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="md:flex">
                <div className="md:w-1/4">
                  <img
                    src={product.image_url || 'https://images.unsplash.com/photo-1596463119248-53c8d33d2739?auto=format&fit=crop&q=80'}
                    alt={product.name}
                    className="w-full h-48 md:h-full object-cover"
                  />
                </div>
                <div className="md:w-3/4 p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900">{product.name}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          product.active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {product.active ? 'Ativo' : 'Inativo'}
                        </span>
                        <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-semibold">
                          {categories.find(c => c.value === product.category)?.label}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-3">{product.description}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setEditingProduct(product)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition"
                        title="Editar"
                      >
                        <Edit2 className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleToggleActive(product.id, product.active)}
                        className="p-2 text-gray-600 hover:bg-gray-50 rounded-full transition"
                        title={product.active ? 'Desativar' : 'Ativar'}
                      >
                        {product.active ? (
                          <ToggleRight className="h-5 w-5 text-green-600" />
                        ) : (
                          <ToggleLeft className="h-5 w-5" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-full transition"
                        title="Excluir"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  {/* Tamanhos */}
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Tamanhos e Preços</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      {product.sizes.map((size) => (
                        <div key={size.id} className="bg-gray-50 p-2 rounded">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{size.size_name}</span>
                            <span className="text-purple-600 font-bold">
                              R$ {size.price.toFixed(2)}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">{size.size_label}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Grupos de Adicionais */}
                  {product.addon_groups.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Grupos de Adicionais</h4>
                      <div className="flex flex-wrap gap-2">
                        {product.addon_groups.map((group) => (
                          <span
                            key={group.id}
                            className="bg-purple-50 text-purple-700 px-2 py-1 rounded text-xs"
                          >
                            {group.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editingProduct !== undefined && (
        <ProductModal
          product={editingProduct}
          onClose={() => setEditingProduct(undefined)}
          onSave={handleSaveProduct}
          availableAddonGroups={addonGroups}
        />
      )}
    </div>
  );
}