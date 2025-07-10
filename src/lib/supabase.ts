import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', {
    url: !!supabaseUrl,
    key: !!supabaseAnonKey
  });
  throw new Error('Missing Supabase environment variables');
}

// Verificar se as variáveis não são placeholders
if (supabaseUrl === 'YOUR_SUPABASE_URL' || supabaseAnonKey === 'YOUR_SUPABASE_ANON_KEY') {
  console.error('Supabase environment variables are still placeholders');
  throw new Error('Supabase environment variables are not configured properly');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Função para testar a conexão com timeout e melhor tratamento de erros
export const testSupabaseConnection = async (timeoutMs: number = 5000) => {
  try {
    // Criar uma Promise com timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Connection timeout')), timeoutMs);
    });

    // Tentar fazer uma consulta simples para uma tabela que sempre existe
    const queryPromise = supabase
      .from('site_settings')
      .select('id')
      .limit(1);

    const result = await Promise.race([queryPromise, timeoutPromise]);
    const { data, error } = result as any;
    
    if (error) {
      console.error('Supabase connection test failed:', error);
      
      // Verificar tipos específicos de erro
      if (error.code === 'PGRST116' || error.message.includes('relation') || error.message.includes('does not exist')) {
        console.warn('Table does not exist, but connection is working');
        return true; // Conexão funciona, apenas a tabela não existe
      }
      
      // Se for erro de permissão, a conexão ainda está funcionando
      if (error.code === '42501' || error.message.includes('permission denied')) {
        console.warn('Permission denied, but connection is working');
        return true;
      }
      
      return false;
    }
    
    console.log('Supabase connection test successful');
    return true;
  } catch (error) {
    console.error('Supabase connection test error:', error);
    
    // Verificar se é erro de rede
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.warn('Network error - Supabase may be unreachable');
    } else if (error instanceof Error && error.message === 'Connection timeout') {
      console.warn('Connection timeout - Supabase is taking too long to respond');
    }
    
    return false;
  }
};

// Função para verificar se o Supabase está configurado corretamente
export const isSupabaseConfigured = () => {
  return supabaseUrl && 
         supabaseAnonKey && 
         supabaseUrl !== 'YOUR_SUPABASE_URL' && 
         supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY' &&
         supabaseUrl.includes('supabase.co');
};