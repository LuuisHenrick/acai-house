import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, Loader } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import ProductCard from './ProductCard';

interface Product {
  id: string;
  name: string;
  description: string;
  category_id: string;
  active: boolean;
  sizes: ProductSize[];
  addon_groups: AddonGroup[];
  images: ProductImage[];
  is_on_promotion?: boolean;
  promo_price?: number;
  promo_coupon_code?: string;
  promo_end_date?: string;
  product_categories?: {
    name: string;
    slug: string;
  };
}

interface ProductImage {
  id: string;
  image_url: string;
  alt_text: string;
  display_order: number;
  is_primary: boolean;
  is_active: boolean;
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

interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  color: string;
  is_active: boolean;
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
  const [isLoading, setIsLoading] = useState(false);

  const toggleAddon = useCallback((groupId: string, option: AddonOption) => {
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
  }, [product.addon_groups]);

  const canAddToCart = useMemo(() => {
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
  }, [selectedSize, product.addon_groups, selectedAddons]);

  const handleAddToCart = useCallback(async () => {
    if (!selectedSize || !canAddToCart) return;
    
    setIsLoading(true);
    try {
      const allSelectedAddons = Object.values(selectedAddons).flat();
      await onAddToCart(product, selectedSize, allSelectedAddons);
      onClose();
      toast.success(`${product.name} adicionado ao carrinho!`);
    } catch (error) {
      toast.error('Erro ao adicionar produto ao carrinho');
    } finally {
      setIsLoading(false);
    }
  }, [selectedSize, canAddToCart, selectedAddons, onAddToCart, product, onClose]);

  const calculateTotal = useMemo(() => {
    if (!selectedSize) return 0;
    
    // Verificar se há promoção ativa
    let basePrice = selectedSize.price;
    if (product.is_on_promotion && product.promo_price && product.promo_end_date) {
      const promoEndDate = new Date(product.promo_end_date);
      if (promoEndDate > new Date()) {
        basePrice = product.promo_price;
      }
    }
    
    const addonTotal = Object.values(selectedAddons)
      .flat()
      .reduce((sum, addon) => sum + addon.price, 0);
    
    return basePrice + addonTotal;
  }, [selectedSize, selectedAddons]);

  const getPrimaryImage = useCallback(() => {
    const primaryImage = product.images?.find(img => img.is_primary && img.is_active);
    const imageUrl = primaryImage?.image_url || 'https://images.unsplash.com/photo-1596463119248-53c8d33d2739?auto=format&fit=crop&q=80';
    
    // Optimize image for modal
    if (imageUrl.includes('supabase.co')) {
      return `${imageUrl}?width=800&quality=80`;
    }
    return imageUrl;
  }, [product.images]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6">
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1 pr-4">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900">{product.name}</h3>
              <p className="text-gray-600 mt-2">{product.description}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl flex-shrink-0"
              aria-label="Fechar"
            >
              ×
            </button>
          </div>

          <div className="aspect-video w-full mb-6 rounded-lg overflow-hidden">
            <img
              src={getPrimaryImage()}
              alt={product.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>

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
                  <div className="text-right">
                    {product.is_on_promotion && product.promo_price && product.promo_end_date && new Date(product.promo_end_date) > new Date() ? (
                      <div className="space-y-1">
                        <div className="text-sm text-gray-400 line-through">
                          R$ {size.price.toFixed(2)}
                        </div>
                        <div className="text-lg font-bold text-red-600">
                          R$ {product.promo_price.toFixed(2)}
                        </div>
                      </div>
                    ) : (
                      <div className="text-lg font-bold text-purple-600">
                        R$ {size.price.toFixed(2)}
                      </div>
                    )}
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
                R$ {calculateTotal.toFixed(2)}
              </span>
            </div>
            
            <button
              onClick={handleAddToCart}
              disabled={!canAddToCart || isLoading}
              className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin h-5 w-5 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                  Adicionando...
                </>
              ) : (
                'Adicionar ao Carrinho'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const Menu = React.memo(() => {
  const { addToCart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    loadCategories();
    loadProducts();
  }, []);

  const loadCategories = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  }, []);

  const loadProducts = useCallback(async () => {
    try {
      // Load products with sizes, addon groups, and images
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select(`
          *,
          product_sizes (*),
          product_images!product_images_product_id_fkey (
            id,
            image_url,
            alt_text,
            display_order,
            is_primary,
            is_active
          ),
          product_categories (
            name,
            slug
          )
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
            images: (product.product_images || []).filter((img: any) => img.is_active),
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
  }, []);

  const handleAddToCart = useCallback((product: Product, size: ProductSize, addons: AddonOption[]) => {
    const primaryImage = product.images?.find(img => img.is_primary)?.image_url || 
                        'https://images.unsplash.com/photo-1596463119248-53c8d33d2739?auto=format&fit=crop&q=80';

    // Verificar se há promoção ativa para este produto
    let finalPrice = size.price;
    if (product.is_on_promotion && product.promo_price && product.promo_end_date) {
      const promoEndDate = new Date(product.promo_end_date);
      if (promoEndDate > new Date()) {
        finalPrice = product.promo_price;
      }
    }
    addToCart({
      id: product.id,
      name: product.name,
      price: finalPrice,
      originalPrice: size.price,
      isOnPromotion: product.is_on_promotion && product.promo_end_date && new Date(product.promo_end_date) > new Date(),
      promoCouponCode: product.promo_coupon_code,
      image: primaryImage
    }, size.size_name, addons);
  }, [addToCart]);

  const filteredProducts = useMemo(() => 
    products.filter(product => 
      selectedCategory === 'all' || product.category_id === selectedCategory
    ), [products, selectedCategory]
  );

  if (isLoading) {
    return (
      <section id="menu" className="py-12 sm:py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center h-64">
            <Loader className="animate-spin h-8 w-8 text-purple-600" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="menu" className="py-12 sm:py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-8 sm:mb-12">Nosso Cardápio</h2>
        
        {/* Category Filter */}
        <div className="flex justify-center mb-6 sm:mb-8">
          <div className="overflow-x-auto">
            <div className="flex gap-2 pb-2 min-w-max px-4">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-2 rounded-full border transition whitespace-nowrap ${
                  selectedCategory === 'all'
                    ? 'bg-purple-600 text-white border-purple-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-purple-300'
                }`}
              >
                Todas as categorias
              </button>
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-full border transition whitespace-nowrap ${
                    selectedCategory === category.id
                      ? 'text-white border-transparent'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                  }`}
                  style={{
                    backgroundColor: selectedCategory === category.id ? category.color : undefined,
                    borderColor: selectedCategory === category.id ? category.color : undefined
                  }}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onClick={() => setSelectedProduct(product)}
            />
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
});

Menu.displayName = 'Menu';

export default Menu;