import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Save, 
  X, 
  Calendar, 
  Clock, 
  Tag, 
  DollarSign,
  Image as ImageIcon,
  ToggleLeft,
  ToggleRight,
  Zap,
  Copy,
  Check
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

interface Promotion {
  id: string;
  title: string;
  description: string;
  product_name: string;
  original_price: number;
  promo_price: number;
  discount_percentage: number;
  coupon_code?: string;
  start_date: string;
  end_date: string;
  image_url: string;
  is_flash: boolean;
  active: boolean;
  created_at: string;
  updated_at: string;
}

interface PromotionFormData {
  title: string;
  description: string;
  product_name: string;
  original_price: number;
  promo_price: number;
  coupon_code: string;
  start_date: Date;
  end_date: Date;
  image_url: string;
  is_flash: boolean;
  active: boolean;
}

const initialFormData: PromotionFormData = {
  title: '',
  description: '',
  product_name: '',
  original_price: 0,
  promo_price: 0,
  coupon_code: '',
  start_date: new Date(),
  end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
  image_url: '',
  is_flash: false,
  active: true
};

function PromotionModal({ 
  promotion, 
  onClose, 
  onSave 
}: { 
  promotion: Promotion | null; 
  onClose: () => void; 
  onSave: (data: PromotionFormData) => Promise<void>; 
}) {
  const [formData, setFormData] = useState<PromotionFormData>(
    promotion ? {
      title: promotion.title,
      description: promotion.description,
      product_name: promotion.product_name,
      original_price: promotion.original_price,
      promo_price: promotion.promo_price,
      coupon_code: promotion.coupon_code || '',
      start_date: new Date(promotion.start_date),
      end_date: new Date(promotion.end_date),
      image_url: promotion.image_url,
      is_flash: promotion.is_flash,
      active: promotion.active
    } : initialFormData
  );
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calculate discount percentage automatically
  useEffect(() => {
    if (formData.original_price > 0 && formData.promo_price > 0) {
      const discount = Math.round(((formData.original_price - formData.promo_price) / formData.original_price) * 100);
      // Don't update if it would cause infinite loop
      if (discount !== Math.round(((formData.original_price - formData.promo_price) / formData.original_price) * 100)) {
        return;
      }
    }
  }, [formData.original_price, formData.promo_price]);

  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData({ ...formData, image_url: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.promo_price >= formData.original_price) {
      toast.error('Preço promocional deve ser menor que o preço original');
      return;
    }

    if (formData.end_date <= formData.start_date) {
      toast.error('Data de fim deve ser posterior à data de início');
      return;
    }

    setIsLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving promotion:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const discountPercentage = formData.original_price > 0 
    ? Math.round(((formData.original_price - formData.promo_price) / formData.original_price) * 100)
    : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="text-xl font-semibold">
            {promotion ? 'Editar Promoção' : 'Nova Promoção'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Imagem da Promoção
            </label>
            <div 
              className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center cursor-pointer overflow-hidden border-2 border-dashed border-gray-300 hover:border-purple-400 transition"
              onClick={() => fileInputRef.current?.click()}
            >
              {formData.image_url ? (
                <img
                  src={formData.image_url}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center">
                  <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
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

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Título da Promoção *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Ex: Açaí Premium Duplo"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Produto Relacionado *
              </label>
              <input
                type="text"
                required
                value={formData.product_name}
                onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Ex: Açaí Premium 700ml"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descrição
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              rows={3}
              placeholder="Descreva os detalhes da promoção..."
            />
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preço Original *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-500">R$</span>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.original_price}
                  onChange={(e) => setFormData({ ...formData, original_price: parseFloat(e.target.value) || 0 })}
                  className="w-full pl-8 p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preço Promocional *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-500">R$</span>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.promo_price}
                  onChange={(e) => setFormData({ ...formData, promo_price: parseFloat(e.target.value) || 0 })}
                  className="w-full pl-8 p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Desconto
              </label>
              <div className="flex items-center justify-center h-12 bg-purple-100 rounded-lg">
                <span className="text-2xl font-bold text-purple-600">
                  {discountPercentage}%
                </span>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data de Início *
              </label>
              <DatePicker
                selected={formData.start_date}
                onChange={(date) => setFormData({ ...formData, start_date: date || new Date() })}
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={15}
                dateFormat="dd/MM/yyyy HH:mm"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data de Fim *
              </label>
              <DatePicker
                selected={formData.end_date}
                onChange={(date) => setFormData({ ...formData, end_date: date || new Date() })}
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={15}
                dateFormat="dd/MM/yyyy HH:mm"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
                minDate={formData.start_date}
              />
            </div>
          </div>

          {/* Coupon Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cupom de Desconto (opcional)
            </label>
            <input
              type="text"
              value={formData.coupon_code}
              onChange={(e) => setFormData({ ...formData, coupon_code: e.target.value.toUpperCase() })}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Ex: PROMO10"
            />
          </div>

          {/* Options */}
          <div className="flex items-center space-x-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.is_flash}
                onChange={(e) => setFormData({ ...formData, is_flash: e.target.checked })}
                className="mr-2 h-4 w-4 text-purple-600 rounded"
              />
              <Zap className="h-4 w-4 mr-1 text-yellow-500" />
              <span className="text-sm font-medium">Promoção Relâmpago</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="mr-2 h-4 w-4 text-purple-600 rounded"
              />
              <span className="text-sm font-medium">Ativa</span>
            </label>
          </div>

          {/* Submit Button */}
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

export default function AdminPromotions() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null | undefined>(undefined);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    loadPromotions();
  }, []);

  const loadPromotions = async () => {
    try {
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPromotions(data || []);
    } catch (error) {
      console.error('Error loading promotions:', error);
      toast.error('Erro ao carregar promoções');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePromotion = async (formData: PromotionFormData) => {
    try {
      const promotionData = {
        ...formData,
        discount_percentage: Math.round(((formData.original_price - formData.promo_price) / formData.original_price) * 100),
        start_date: formData.start_date.toISOString(),
        end_date: formData.end_date.toISOString(),
        coupon_code: formData.coupon_code || null
      };

      if (editingPromotion) {
        // Update existing promotion
        const { error } = await supabase
          .from('promotions')
          .update({
            ...promotionData,
            updated_by: (await supabase.auth.getUser()).data.user?.id
          })
          .eq('id', editingPromotion.id);

        if (error) throw error;
        toast.success('Promoção atualizada com sucesso!');
      } else {
        // Create new promotion
        const { error } = await supabase
          .from('promotions')
          .insert({
            ...promotionData,
            created_by: (await supabase.auth.getUser()).data.user?.id
          });

        if (error) throw error;
        toast.success('Promoção criada com sucesso!');
      }

      loadPromotions();
    } catch (error) {
      console.error('Error saving promotion:', error);
      toast.error('Erro ao salvar promoção');
      throw error;
    }
  };

  const handleDeletePromotion = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta promoção?')) return;

    try {
      const { error } = await supabase
        .from('promotions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Promoção excluída com sucesso!');
      loadPromotions();
    } catch (error) {
      console.error('Error deleting promotion:', error);
      toast.error('Erro ao excluir promoção');
    }
  };

  const handleToggleActive = async (id: string, active: boolean) => {
    try {
      const { error } = await supabase
        .from('promotions')
        .update({ 
          active: !active,
          updated_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', id);

      if (error) throw error;
      toast.success(`Promoção ${!active ? 'ativada' : 'desativada'} com sucesso!`);
      loadPromotions();
    } catch (error) {
      console.error('Error toggling promotion:', error);
      toast.error('Erro ao alterar status da promoção');
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success('Cupom copiado!');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const isPromotionActive = (promotion: Promotion) => {
    const now = new Date();
    const start = new Date(promotion.start_date);
    const end = new Date(promotion.end_date);
    return promotion.active && now >= start && now <= end;
  };

  const getPromotionStatus = (promotion: Promotion) => {
    const now = new Date();
    const start = new Date(promotion.start_date);
    const end = new Date(promotion.end_date);

    if (!promotion.active) return { text: 'Inativa', color: 'bg-gray-100 text-gray-600' };
    if (now < start) return { text: 'Agendada', color: 'bg-blue-100 text-blue-600' };
    if (now > end) return { text: 'Expirada', color: 'bg-red-100 text-red-600' };
    return { text: 'Ativa', color: 'bg-green-100 text-green-600' };
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
        <h2 className="text-2xl font-bold text-gray-900">Gerenciar Promoções</h2>
        <button
          onClick={() => setEditingPromotion(null)}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-purple-700 transition"
        >
          <Plus className="h-5 w-5 mr-2" />
          Nova Promoção
        </button>
      </div>

      {promotions.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <Tag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma promoção cadastrada</h3>
          <p className="text-gray-500 mb-4">Comece criando sua primeira promoção</p>
          <button
            onClick={() => setEditingPromotion(null)}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition"
          >
            Criar Promoção
          </button>
        </div>
      ) : (
        <div className="grid gap-6">
          {promotions.map((promotion) => {
            const status = getPromotionStatus(promotion);
            return (
              <div key={promotion.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="md:flex">
                  <div className="md:w-1/3">
                    <img
                      src={promotion.image_url || 'https://images.unsplash.com/photo-1596463119248-53c8d33d2739?auto=format&fit=crop&q=80'}
                      alt={promotion.title}
                      className="w-full h-48 md:h-full object-cover"
                    />
                  </div>
                  <div className="md:w-2/3 p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-xl font-bold text-gray-900">{promotion.title}</h3>
                          {promotion.is_flash && (
                            <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-semibold flex items-center">
                              <Zap className="h-3 w-3 mr-1" />
                              Flash
                            </span>
                          )}
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${status.color}`}>
                            {status.text}
                          </span>
                        </div>
                        <p className="text-gray-600 mb-2">{promotion.description}</p>
                        <p className="text-sm text-gray-500 mb-3">
                          <strong>Produto:</strong> {promotion.product_name}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setEditingPromotion(promotion)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition"
                          title="Editar"
                        >
                          <Edit2 className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleToggleActive(promotion.id, promotion.active)}
                          className="p-2 text-gray-600 hover:bg-gray-50 rounded-full transition"
                          title={promotion.active ? 'Desativar' : 'Ativar'}
                        >
                          {promotion.active ? (
                            <ToggleRight className="h-5 w-5 text-green-600" />
                          ) : (
                            <ToggleLeft className="h-5 w-5" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDeletePromotion(promotion.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-full transition"
                          title="Excluir"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-sm text-gray-500 mb-1">Preço Original</div>
                        <div className="text-lg font-semibold line-through text-gray-400">
                          R$ {promotion.original_price.toFixed(2)}
                        </div>
                      </div>
                      <div className="bg-purple-50 p-3 rounded-lg">
                        <div className="text-sm text-purple-600 mb-1">Preço Promocional</div>
                        <div className="text-lg font-bold text-purple-600">
                          R$ {promotion.promo_price.toFixed(2)}
                        </div>
                      </div>
                      <div className="bg-green-50 p-3 rounded-lg">
                        <div className="text-sm text-green-600 mb-1">Desconto</div>
                        <div className="text-lg font-bold text-green-600">
                          {promotion.discount_percentage}%
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>
                          {new Date(promotion.start_date).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="h-4 w-4 mr-2" />
                        <span>
                          {new Date(promotion.end_date).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>

                    {promotion.coupon_code && (
                      <div className="bg-purple-50 p-3 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm text-purple-600 mb-1">Cupom de Desconto</div>
                            <code className="text-lg font-mono font-bold text-purple-700">
                              {promotion.coupon_code}
                            </code>
                          </div>
                          <button
                            onClick={() => copyCode(promotion.coupon_code!)}
                            className="p-2 text-purple-600 hover:bg-purple-100 rounded-full transition"
                            title="Copiar cupom"
                          >
                            {copiedCode === promotion.coupon_code ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editingPromotion !== undefined && (
        <PromotionModal
          promotion={editingPromotion}
          onClose={() => setEditingPromotion(undefined)}
          onSave={handleSavePromotion}
        />
      )}
    </div>
  );
}