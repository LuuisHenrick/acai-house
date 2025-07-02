import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, testSupabaseConnection, isSupabaseConfigured } from '../lib/supabase';
import toast from 'react-hot-toast';

interface SiteSettings {
  logo_url: string;
  site_name: string;
  logo_alt_text: string;
  hero_background_url: string;
}

interface SiteSettingsContextType {
  settings: SiteSettings;
  updateSetting: (key: string, value: string) => Promise<void>;
  refreshSettings: () => Promise<void>;
  isLoading: boolean;
  isSupabaseAvailable: boolean;
}

const defaultSettings: SiteSettings = {
  logo_url: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&q=80&w=100&h=100',
  site_name: 'Açaí House',
  logo_alt_text: 'Açaí House Logo',
  hero_background_url: 'https://images.unsplash.com/photo-1596463059283-da257325bab8?auto=format&fit=crop&q=80'
};

const SiteSettingsContext = createContext<SiteSettingsContextType | undefined>(undefined);

export function SiteSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSupabaseAvailable, setIsSupabaseAvailable] = useState(false);

  const loadSettings = async () => {
    try {
      // Verificar se o Supabase está configurado
      if (!isSupabaseConfigured()) {
        console.warn('Supabase is not properly configured, using default settings');
        setSettings(defaultSettings);
        setIsSupabaseAvailable(false);
        setIsLoading(false);
        return;
      }

      // Testar a conexão com timeout reduzido
      const connectionOk = await testSupabaseConnection(3000);
      setIsSupabaseAvailable(connectionOk);
      
      if (!connectionOk) {
        console.warn('Supabase connection failed, using default settings');
        setSettings(defaultSettings);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('site_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['logo_url', 'site_name', 'logo_alt_text', 'hero_background_url']);

      if (error) {
        console.error('Error loading site settings:', error);
        
        // Verificar se é erro de tabela não encontrada
        if (error.code === 'PGRST116' || error.message.includes('relation') || error.message.includes('does not exist')) {
          console.warn('Site settings table not found, using defaults');
          setSettings(defaultSettings);
          return;
        }
        
        // Outros erros
        console.warn('Error loading site settings, using defaults:', error.message);
        setSettings(defaultSettings);
        return;
      }

      if (!data || data.length === 0) {
        console.warn('No site settings found, using defaults');
        setSettings(defaultSettings);
        return;
      }

      const settingsMap = data.reduce((acc, item) => {
        acc[item.setting_key] = item.setting_value;
        return acc;
      }, {} as Record<string, string>);

      setSettings({
        logo_url: settingsMap.logo_url || defaultSettings.logo_url,
        site_name: settingsMap.site_name || defaultSettings.site_name,
        logo_alt_text: settingsMap.logo_alt_text || defaultSettings.logo_alt_text,
        hero_background_url: settingsMap.hero_background_url || defaultSettings.hero_background_url
      });

    } catch (error) {
      console.error('Unexpected error loading site settings:', error);
      setSettings(defaultSettings);
      setIsSupabaseAvailable(false);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSetting = async (key: string, value: string) => {
    if (!isSupabaseAvailable) {
      toast.error('Supabase não está disponível. Não é possível salvar configurações.');
      throw new Error('Supabase not available');
    }

    try {
      const user = (await supabase.auth.getUser()).data.user;
      
      const { error } = await supabase
        .from('site_settings')
        .upsert({
          setting_key: key,
          setting_value: value,
          updated_by: user?.id
        }, {
          onConflict: 'setting_key'
        });

      if (error) {
        console.error('Error updating setting:', error);
        toast.error('Erro ao salvar configuração.');
        throw error;
      }

      // Update local state
      setSettings(prev => ({
        ...prev,
        [key]: value
      }));

      toast.success('Configuração salva com sucesso!');
    } catch (error) {
      console.error('Error updating setting:', error);
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        toast.error('Erro de conexão ao salvar configuração.');
      } else {
        toast.error('Erro ao salvar configuração.');
      }
      
      throw error;
    }
  };

  const refreshSettings = async () => {
    setIsLoading(true);
    await loadSettings();
  };

  useEffect(() => {
    loadSettings();
  }, []);

  return (
    <SiteSettingsContext.Provider value={{
      settings,
      updateSetting,
      refreshSettings,
      isLoading,
      isSupabaseAvailable
    }}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  const context = useContext(SiteSettingsContext);
  if (context === undefined) {
    throw new Error('useSiteSettings must be used within a SiteSettingsProvider');
  }
  return context;
}