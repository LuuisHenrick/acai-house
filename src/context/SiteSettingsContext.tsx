import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface SiteSettings {
  logo_url: string;
  site_name: string;
  logo_alt_text: string;
}

interface SiteSettingsContextType {
  settings: SiteSettings;
  updateSetting: (key: string, value: string) => Promise<void>;
  refreshSettings: () => Promise<void>;
  isLoading: boolean;
}

const defaultSettings: SiteSettings = {
  logo_url: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&q=80&w=100&h=100',
  site_name: 'Açaí House',
  logo_alt_text: 'Açaí House Logo'
};

const SiteSettingsContext = createContext<SiteSettingsContextType | undefined>(undefined);

export function SiteSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['logo_url', 'site_name', 'logo_alt_text']);

      if (error) throw error;

      const settingsMap = data?.reduce((acc, item) => {
        acc[item.setting_key] = item.setting_value;
        return acc;
      }, {} as Record<string, string>) || {};

      setSettings({
        logo_url: settingsMap.logo_url || defaultSettings.logo_url,
        site_name: settingsMap.site_name || defaultSettings.site_name,
        logo_alt_text: settingsMap.logo_alt_text || defaultSettings.logo_alt_text
      });
    } catch (error) {
      console.error('Error loading site settings:', error);
      setSettings(defaultSettings);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSetting = async (key: string, value: string) => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      
      const { error } = await supabase
        .from('site_settings')
        .upsert({
          setting_key: key,
          setting_value: value,
          updated_by: user?.id
        });

      if (error) throw error;

      // Update local state
      setSettings(prev => ({
        ...prev,
        [key]: value
      }));
    } catch (error) {
      console.error('Error updating setting:', error);
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
      isLoading
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