import React, { useState, useEffect } from 'react';
import { Plus, Loader } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  image_url: string;
  active: boolean;
  sizes: ProductSize[];
  addon_groups: AddonGroup[];
}

interface ProductSize {
  id: string;
  size_name: string;
  size_label: string;
  price: number;
  active: boolean;
}

interface AddonGroup {
  id: string;
  name: string;
  description: string;
  is_required: boolean;
  min_selections: number;
  max_selections: number | null;
  options: AddonOption[];
}

interface AddonOption {
  id: string;
  name: string;
  price: number;
  active: boolean;
}

function ProductModal({ 
  product, 
  onClose, 
  onAddToCart 
}: { 
  product: Product; 
  onClose: () => void; 
  onAddToCart: (product: Product, size: ProductSize, addons: AddonOption[]) => void;
}) {
  const [selectedSize, setSelectedSize] = useState<ProductSize | null>(
    product.sizes.find(s => s.active) || null
  );
  const [selectedAddons, setSelectedAddons] = useState<{ [groupId: string]: AddonOption[] }>({});

  const toggleAddon = (groupId: string, option: AddonOption) => {
    setSelectedAddons(prev => {
      const currentGroup = prev[groupId] || [];
      const group = product.addon_groups.find(g => g.id === groupId);
      
      if (!group) return prev;

      const isSelected = currentGroup.some(addon => addon.id === option.id);
      
      if (isSelected) {
        return {
          ...prev,
          [groupId]: currentGroup.filter(addon => addon.id !== option.id)
        };
      } else {
        const newGroup = [...currentGroup, option];
        
        // Check max selections
        if (group.max_selections && newGroup.length > group.max_selections) {
          toast.error(`Máximo ${group.max_selections} opções para ${group.name}`);
          return prev;
        }
        
        return {
          ...prev,
          [groupId]: newGroup
        };
      }
    });
  };

  const canAddToCart = () => {
    if (!selectedSize) return false;
    
    // Check required groups
    for (const group of product.addon_groups) {
      if (group.is_required) {
        const selected = selectedAddons[group.id] || [];
        if (selected.length < group.min_selections) {
          return false;
        }
      }
    }
    
    return true;
  };

  const handleAddToCart = () => {
    if (!selectedSize || !canAddToCart()) return;
    
    const allSelectedAddons = Object.values(selectedAddons).flat();
    onAddToCart(product, selectedSize, allSelectedAddons);
    onClose();
  };

  const calculateTotal = () => {
    if (!selectedSize) return 0;
    
    const addonTotal = Object.values(selectedAddons)
      .flat()
      .reduce((sum, addon) => sum + addon.price, 0);
    
    return selectedSize.price + addonTotal;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">{product.name}</h3>
              <p className="text-gray-600 mt-2">{product.description}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-64 object-cover rounded-lg mb-6"
          />

          {/* Size Selection */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold mb-3">Escolha o tamanho</h4>
            <div className="grid grid-cols-1 gap-3">
              {product.sizes.filter(size => size.active).map(size => (
                <label
                  key={size.id}
                  className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition ${
                    selectedSize?.id === size.id
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center">
                    <input
                      type="radio"
                      name="size"
                      checked={selectedSize?.id === size.id}
                      onChange={() => setSelectedSize(size)}
                      className="mr-3 text-purple-600"
                    />
                    <div>
                      <div className="font-medium">{size.size_name}</div>
                      <div className="text-sm text-gray-500">{size.size_label}</div>
                    </div>
                  </div>
                  <div className="text-lg font-bold text-purple-600">
                    R$ {size.price.toFixed(2)}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Addon Groups */}
          {product.addon_groups.map(group => (
            <div key={group.id} className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-lg font-semibold">{group.name}</h4>
                <span className={`text-sm px-2 py-1 rounded ${
                  group.is_required ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
                }`}>
                  {group.is_required ? 'Obrigatório' : 'Opcional'}
                </span>
              </div>
              
              {group.description && (
                <p className="text-gray-600 text-sm mb-3">{group.description}</p>
              )}

              <div className="space-y-2">
                {group.options.filter(option => option.active).map(option => (
                  <label
                    key={option.id}
                    className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition ${
                      selectedAddons[group.id]?.some(addon => addon.id === option.id)
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedAddons[group.id]?.some(addon => addon.id === option.id) || false}
                        onChange={() => toggleAddon(group.id, option)}
                        className="mr-3 text-purple-600"
                      />
                      <span>{option.name}</span>
                    </div>
                    <span className="text-purple-600 font-medium">
                      +R$ {option.price.toFixed(2)}
                    </span>
                  </label>
                ))}
              </div>

              {group.min_selections > 0 && (
                <p className="text-sm text-gray-500 mt-2">
                  Mínimo: {group.min_selections} opções
                </p>
              )}
              {group.max_selections && (
                <p className="text-sm text-gray-500 mt-1">
                  Máximo: {group.max_selections} opções
                </p>
              )}
            </div>
          ))}

          {/* Add to Cart */}
          <div className="border-t pt-6">
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-semibold">Total</span>
              <span className="text-2xl font-bold text-purple-600">
                R$ {calculateTotal().toFixed(2)}
              </span>
            </div>
            
            <button
              onClick={handleAddToCart}
              disabled={!canAddToCart()}
              className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Adicionar ao Carrinho
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Menu() {
  const { addToCart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      // Load products with sizes and addon groups
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select(`
          *,
          product_sizes (*)
        `)
        .eq('active', true)
        .order('display_order', { ascending: true });

      if (productsError) throw productsError;

      // Load addon groups for each product
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
            sizes: (product.product_sizes || []).filter((size: any) => size.active),
            addon_groups: addonGroupsData?.map((item: any) => ({
              ...item.addon_groups,
              options: item.addon_groups.addon_options.filter((option: any) => option.active)
            })).filter(Boolean) || []
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

  const handleAddToCart = (product: Product, size: ProductSize, addons: AddonOption[]) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: size.price,
      image: product.image_url
    }, size.size_name, addons);
    
    toast.success(`${product.name} adicionado ao carrinho!`);
  };

  const categories = [
    { value: 'all', label: 'Todas as categorias' },
    { value: 'tradicional', label: 'Tradicional' },
    { value: 'especial', label: 'Especial' },
    { value: 'premium', label: 'Premium' },
    { value: 'bebidas', label: 'Bebidas' },
    { value: 'sobremesas', label: 'Sobremesas' }
  ];

  const filteredProducts = products.filter(product => 
    selectedCategory === 'all' || product.category === selectedCategory
  );

  if (isLoading) {
    return (
      <section id="menu" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center h-64">
            <Loader className="animate-spin h-8 w-8 text-purple-600" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="menu" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-12">Nosso Cardápio</h2>
        
        {/* Category Filter */}
        <div className="flex justify-center mb-8">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 rounded-full border border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            {categories.map(category => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-lg shadow-lg overflow-hidden transform hover:scale-105 transition cursor-pointer"
              onClick={() => setSelectedProduct(product)}
            >
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2">{product.name}</h3>
                <p className="text-gray-600 mb-4">{product.description}</p>
                <div className="flex justify-between items-center">
                  <div>
                    {product.sizes.length > 0 && (
                      <span className="text-lg font-bold text-purple-600">
                        A partir de R$ {Math.min(...product.sizes.map(s => s.price)).toFixed(2)}
                      </span>
                    )}
                  </div>
                  <button className="bg-purple-600 text-white p-2 rounded-full hover:bg-purple-700 transition">
                    <Plus className="h-6 w-6" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Nenhum produto encontrado nesta categoria.</p>
          </div>
        )}

        {selectedProduct && (
          <ProductModal
            product={selectedProduct}
            onClose={() => setSelectedProduct(null)}
            onAddToCart={handleAddToCart}
          />
        )}
      </div>
    </section>
  );
}