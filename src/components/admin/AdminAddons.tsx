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
  DollarSign,
  Tag,
  Eye,
  GripVertical
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

interface ProductAddon {
  id: string;
  name: string;
  price: number;
  category: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

interface AddonFormData {
  name: string;
  price: number;
  category: string;
  is_active: boolean;
}

const categories = [
  'Frutas',
  'Coberturas', 
  'Crocantes',
  'Caldas',
  'Especiais'
];

function AddonModal({ 
  addon, 
  onClose, 
  onSave 
}: { 
  addon: ProductAddon | null; 
  onClose: () => void; 
  onSave: (data: AddonFormData) => Promise<void>; 
}) {
  const [formData, setFormData] = useState<AddonFormData>(
    addon ? {
      name: addon.name,
      price: addon.price,
      category: addon.category,
      is_active: addon.is_active
    } : {
      name: '',
      price: 0,
      category: 'Frutas',
      is_active: true
    }
  );
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    if (formData.price <= 0) {
      newErrors.price = 'Preço deve ser maior que zero';
    }

    if (!formData.category.trim()) {
      newErrors.category = 'Categoria é obrigatória';
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
      console.error('Error saving addon:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="text-xl font-semibold">
            {addon ? 'Editar Acréscimo' : 'Novo Acréscimo'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome do Acréscimo *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Ex: Granola, Leite Condensado"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Preço *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-gray-500">R$</span>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                className={`w-full pl-8 p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                  errors.price ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0.00"
              />
            </div>
            {errors.price && (
              <p className="text-red-500 text-sm mt-1">{errors.price}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categoria *
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                errors.category ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            {errors.category && (
              <p className="text-red-500 text-sm mt-1">{errors.category}</p>
            )}
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="mr-2 h-4 w-4 text-purple-600 rounded"
            />
            <label className="text-sm font-medium text-gray-700">
              Acréscimo Ativo
            </label>
          </div>

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

export default function AdminAddons() {
  const [addons, setAddons] = useState<ProductAddon[]>([]);
  const [filteredAddons, setFilteredAddons] = useState<ProductAddon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingAddon, setEditingAddon] = useState<ProductAddon | null | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showInactive, setShowInactive] = useState(false);

  useEffect(() => {
    loadAddons();
  }, []);

  useEffect(() => {
    filterAddons();
  }, [addons, searchTerm, selectedCategory, showInactive]);

  const loadAddons = async () => {
    try {
      const { data, error } = await supabase
        .from('product_addons')
        .select('*')
        .order('category', { ascending: true })
        .order('display_order', { ascending: true });

      if (error) throw error;
      setAddons(data || []);
    } catch (error) {
      console.error('Error loading addons:', error);
      toast.error('Erro ao carregar acréscimos');
    } finally {
      setIsLoading(false);
    }
  };

  const filterAddons = () => {
    let filtered = addons;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(addon =>
        addon.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        addon.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(addon => addon.category === selectedCategory);
    }

    // Filter by active status
    if (!showInactive) {
      filtered = filtered.filter(addon => addon.is_active);
    }

    setFilteredAddons(filtered);
  };

  const handleSaveAddon = async (formData: AddonFormData) => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      
      if (editingAddon) {
        // Update existing addon
        const { error } = await supabase
          .from('product_addons')
          .update({
            name: formData.name,
            price: formData.price,
            category: formData.category,
            is_active: formData.is_active,
            updated_by: user?.id
          })
          .eq('id', editingAddon.id);

        if (error) throw error;
        toast.success('Acréscimo atualizado com sucesso!');
      } else {
        // Create new addon
        const { error } = await supabase
          .from('product_addons')
          .insert({
            name: formData.name,
            price: formData.price,
            category: formData.category,
            is_active: formData.is_active,
            display_order: addons.length + 1,
            created_by: user?.id
          });

        if (error) throw error;
        toast.success('Acréscimo criado com sucesso!');
      }

      loadAddons();
    } catch (error) {
      console.error('Error saving addon:', error);
      toast.error('Erro ao salvar acréscimo');
      throw error;
    }
  };

  const handleDeleteAddon = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este acréscimo?')) return;

    try {
      const { error } = await supabase
        .from('product_addons')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Acréscimo excluído com sucesso!');
      loadAddons();
    } catch (error) {
      console.error('Error deleting addon:', error);
      toast.error('Erro ao excluir acréscimo');
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('product_addons')
        .update({ 
          is_active: !isActive,
          updated_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', id);

      if (error) throw error;
      toast.success(`Acréscimo ${!isActive ? 'ativado' : 'desativado'} com sucesso!`);
      loadAddons();
    } catch (error) {
      console.error('Error toggling addon:', error);
      toast.error('Erro ao alterar status do acréscimo');
    }
  };

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;

    const items = Array.from(filteredAddons);
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
          .from('product_addons')
          .update({ display_order: update.display_order })
          .eq('id', update.id);
      }

      loadAddons();
      toast.success('Ordem atualizada com sucesso!');
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Erro ao atualizar ordem');
    }
  };

  const getCategoryStats = () => {
    const stats = categories.reduce((acc, category) => {
      acc[category] = addons.filter(addon => addon.category === category && addon.is_active).length;
      return acc;
    }, {} as Record<string, number>);
    return stats;
  };

  const categoryStats = getCategoryStats();

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
          <h2 className="text-2xl font-bold text-gray-900">Gerenciar Acréscimos</h2>
          <p className="text-gray-600 mt-1">
            Gerencie todos os acréscimos disponíveis para os produtos
          </p>
        </div>
        <button
          onClick={() => setEditingAddon(null)}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-purple-700 transition"
        >
          <Plus className="h-5 w-5 mr-2" />
          Novo Acréscimo
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <Package className="h-8 w-8 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total</p>
              <p className="text-2xl font-bold text-gray-900">{addons.length}</p>
            </div>
          </div>
        </div>
        {categories.map(category => (
          <div key={category} className="bg-white p-4 rounded-lg shadow">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-500">{category}</p>
              <p className="text-xl font-bold text-purple-600">{categoryStats[category] || 0}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar acréscimos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="all">Todas as categorias</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="mr-2 h-4 w-4 text-purple-600 rounded"
            />
            <span className="text-sm">Mostrar inativos</span>
          </label>

          <div className="flex items-center text-sm text-gray-600">
            <Filter className="h-4 w-4 mr-2" />
            {filteredAddons.length} de {addons.length} acréscimos
          </div>
        </div>
      </div>

      {/* Addons List */}
      {filteredAddons.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {addons.length === 0 ? 'Nenhum acréscimo cadastrado' : 'Nenhum acréscimo encontrado'}
          </h3>
          <p className="text-gray-500 mb-4">
            {addons.length === 0 
              ? 'Comece criando seu primeiro acréscimo' 
              : 'Tente ajustar os filtros de busca'
            }
          </p>
          {addons.length === 0 && (
            <button
              onClick={() => setEditingAddon(null)}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition"
            >
              Criar Acréscimo
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="addons">
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps}>
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ordem
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nome
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Categoria
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Preço
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
                      {filteredAddons.map((addon, index) => (
                        <Draggable key={addon.id} draggableId={addon.id} index={index}>
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
                                  <Tag className="h-5 w-5 text-purple-600 mr-3" />
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">
                                      {addon.name}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                  {addon.category}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <DollarSign className="h-4 w-4 text-green-600 mr-1" />
                                  <span className="text-sm font-medium text-gray-900">
                                    R$ {addon.price.toFixed(2)}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  addon.is_active 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {addon.is_active ? 'Ativo' : 'Inativo'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex items-center justify-end space-x-2">
                                  <button
                                    onClick={() => setEditingAddon(addon)}
                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition"
                                    title="Editar"
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleToggleActive(addon.id, addon.is_active)}
                                    className="p-2 text-gray-600 hover:bg-gray-50 rounded-full transition"
                                    title={addon.is_active ? 'Desativar' : 'Ativar'}
                                  >
                                    {addon.is_active ? (
                                      <ToggleRight className="h-4 w-4 text-green-600" />
                                    ) : (
                                      <ToggleLeft className="h-4 w-4" />
                                    )}
                                  </button>
                                  <button
                                    onClick={() => handleDeleteAddon(addon.id)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-full transition"
                                    title="Excluir"
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
      {editingAddon !== undefined && (
        <AddonModal
          addon={editingAddon}
          onClose={() => setEditingAddon(undefined)}
          onSave={handleSaveAddon}
        />
      )}
    </div>
  );
}