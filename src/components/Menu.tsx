import React, { useState, useEffect, useRef } from 'react';
import { Plus, X, Edit2, Trash2, Save, Loader, Check, Camera } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import TextareaAutosize from 'react-textarea-autosize';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  sizes: string[];
  active: boolean;
}

interface EditModalProps {
  item: MenuItem | null;
  onClose: () => void;
  onSave: (item: MenuItem) => Promise<void>;
}

function EditableText({ 
  value, 
  onChange, 
  className = "", 
  multiline = false,
  placeholder = ""
}: { 
  value: string; 
  onChange: (value: string) => void;
  className?: string;
  multiline?: boolean;
  placeholder?: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
    if (editValue !== value) {
      onChange(editValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleBlur();
    }
    if (e.key === 'Escape') {
      setEditValue(value);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return multiline ? (
      <TextareaAutosize
        ref={inputRef as React.RefObject<HTMLTextAreaElement>}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={`w-full p-2 border rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent ${className}`}
        minRows={2}
        placeholder={placeholder}
      />
    ) : (
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={`w-full p-2 border rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent ${className}`}
        placeholder={placeholder}
      />
    );
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className={`cursor-pointer hover:bg-gray-50 rounded p-2 ${className}`}
    >
      {value || <span className="text-gray-400">{placeholder}</span>}
    </div>
  );
}

function EditModal({ item, onClose, onSave }: EditModalProps) {
  const [formData, setFormData] = useState<MenuItem>(
    item || {
      id: crypto.randomUUID(),
      name: '',
      description: '',
      price: 0,
      image_url: '',
      category: 'tradicional',
      sizes: ['P', 'M', 'G'],
      active: true
    }
  );
  const [isLoading, setIsLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (file: File) => {
    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Here you would typically upload the file to your storage
      // For now, we'll just use the preview URL
      setFormData({ ...formData, image_url: URL.createObjectURL(file) });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Erro ao fazer upload da imagem');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving item:', error);
      toast.error('Erro ao salvar item');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold">
            {item ? 'Editar Item' : 'Novo Item'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="relative">
            <div 
              className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center cursor-pointer overflow-hidden"
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
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Nome do item"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descrição
            </label>
            <TextareaAutosize
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              minRows={3}
              placeholder="Descrição do item"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Preço
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">R$</span>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                className="w-full pl-8 p-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categoria
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="tradicional">Tradicional</option>
              <option value="especial">Especial</option>
              <option value="premium">Premium</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tamanhos Disponíveis
            </label>
            <div className="flex gap-4">
              {['P', 'M', 'G'].map((size) => (
                <label key={size} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.sizes.includes(size)}
                    onChange={(e) => {
                      const newSizes = e.target.checked
                        ? [...formData.sizes, size]
                        : formData.sizes.filter((s) => s !== size);
                      setFormData({ ...formData, sizes: newSizes });
                    }}
                    className="mr-2"
                  />
                  {size}
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              checked={formData.active}
              onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              className="mr-2"
            />
            <label className="text-sm font-medium text-gray-700">
              Item Ativo
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold
              hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed
              flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <Loader className="animate-spin h-5 w-5 mr-2" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-5 w-5 mr-2" />
                Salvar
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function Menu() {
  const { addToCart } = useCart();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSize, setSelectedSize] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAdmin(!!user);
    };

    checkAdmin();
  }, []);

  useEffect(() => {
    loadMenuItems();
  }, []);

  const loadMenuItems = async () => {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .order('category', { ascending: true });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error loading menu items:', error);
      toast.error('Erro ao carregar cardápio');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveItem = async (item: MenuItem) => {
    try {
      if (item.id) {
        // Update existing item
        const { error } = await supabase
          .from('menu_items')
          .update({
            name: item.name,
            description: item.description,
            price: item.price,
            image_url: item.image_url,
            category: item.category,
            sizes: item.sizes,
            active: item.active,
            updated_by: (await supabase.auth.getUser()).data.user?.id
          })
          .eq('id', item.id);

        if (error) throw error;
        toast.success('Item atualizado com sucesso');
      } else {
        // Create new item
        const { error } = await supabase
          .from('menu_items')
          .insert({
            ...item,
            created_by: (await supabase.auth.getUser()).data.user?.id
          });

        if (error) throw error;
        toast.success('Item criado com sucesso');
      }

      loadMenuItems();
    } catch (error) {
      console.error('Error saving menu item:', error);
      toast.error('Erro ao salvar item');
      throw error;
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este item?')) return;

    try {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Item excluído com sucesso');
      loadMenuItems();
    } catch (error) {
      console.error('Error deleting menu item:', error);
      toast.error('Erro ao excluir item');
    }
  };

  const handleInlineEdit = async (id: string, field: string, value: string | number) => {
    try {
      const { error } = await supabase
        .from('menu_items')
        .update({ [field]: value, updated_by: (await supabase.auth.getUser()).data.user?.id })
        .eq('id', id);

      if (error) throw error;
      loadMenuItems();
      toast.success('Alteração salva com sucesso');
    } catch (error) {
      console.error('Error updating item:', error);
      toast.error('Erro ao salvar alteração');
    }
  };

  const filteredItems = items.filter((item) => {
    if (!item.active && !isAdmin) return false;
    if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
    if (selectedSize !== 'all' && !item.sizes.includes(selectedSize)) return false;
    return true;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="animate-spin h-8 w-8 text-purple-600" />
      </div>
    );
  }

  return (
    <section id="menu" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-12">
          <h2 className="text-4xl font-bold">Nosso Cardápio</h2>
          {isAdmin && (
            <button
              onClick={() => setEditingItem(null)}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center"
            >
              <Plus className="h-5 w-5 mr-2" />
              Novo Item
            </button>
          )}
        </div>
        
        {/* Filters */}
        <div className="flex flex-wrap gap-4 justify-center mb-8">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 rounded-full border border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">Todas as categorias</option>
            <option value="tradicional">Tradicional</option>
            <option value="especial">Especial</option>
            <option value="premium">Premium</option>
          </select>

          <select
            value={selectedSize}
            onChange={(e) => setSelectedSize(e.target.value)}
            className="px-4 py-2 rounded-full border border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">Todos os tamanhos</option>
            <option value="P">Pequeno (300ml)</option>
            <option value="M">Médio (500ml)</option>
            <option value="G">Grande (700ml)</option>
          </select>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className={`bg-white rounded-lg shadow-lg overflow-hidden transform hover:scale-105 transition
                ${!item.active ? 'opacity-60' : ''}`}
            >
              <div className="relative">
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="w-full h-48 object-cover"
                />
                {isAdmin && (
                  <button
                    onClick={() => setEditingItem(item)}
                    className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100"
                  >
                    <Edit2 className="h-5 w-5 text-purple-600" />
                  </button>
                )}
              </div>
              <div className="p-6">
                {isAdmin ? (
                  <>
                    <EditableText
                      value={item.name}
                      onChange={(value) => handleInlineEdit(item.id, 'name', value)}
                      className="text-xl font-semibold mb-2"
                      placeholder="Nome do item"
                    />
                    <EditableText
                      value={item.description}
                      onChange={(value) => handleInlineEdit(item.id, 'description', value)}
                      className="text-gray-600 mb-4"
                      multiline
                      placeholder="Descrição do item"
                    />
                  </>
                ) : (
                  <>
                    <h3 className="text-xl font-semibold mb-2">{item.name}</h3>
                    <p className="text-gray-600 mb-4">{item.description}</p>
                  </>
                )}
                <div className="flex justify-between items-center">
                  {isAdmin ? (
                    <div className="relative">
                      <span className="absolute left-2 top-2 text-gray-500">R$</span>
                      <input
                        type="number"
                        value={item.price}
                        onChange={(e) => handleInlineEdit(item.id, 'price', parseFloat(e.target.value))}
                        className="pl-8 p-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  ) : (
                    <span className="text-2xl font-bold text-purple-600">
                      R$ {item.price.toFixed(2)}
                    </span>
                  )}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => addToCart(item, 'M', [])}
                      className="bg-purple-600 text-white p-2 rounded-full hover:bg-purple-700 transition"
                    >
                      <Plus className="h-6 w-6" />
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                      >
                        <Trash2 className="h-6 w-6" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {editingItem !== undefined && (
          <EditModal
            item={editingItem}
            onClose={() => setEditingItem(undefined)}
            onSave={handleSaveItem}
          />
        )}
      </div>
    </section>
  );
}