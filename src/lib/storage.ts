import { supabase } from './supabase';

export interface UploadResult {
  url: string;
  path: string;
}

export interface UploadOptions {
  maxSizeBytes?: number;
  allowedTypes?: string[];
  bucket?: string;
}

const DEFAULT_OPTIONS: Required<UploadOptions> = {
  maxSizeBytes: 3 * 1024 * 1024, // 3MB
  allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  bucket: 'site-images'
};

export class StorageService {
  static async uploadImage(
    file: File, 
    path: string, 
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    
    // Validar tipo de arquivo
    if (!opts.allowedTypes.includes(file.type)) {
      throw new Error(`Tipo de arquivo não suportado. Use: ${opts.allowedTypes.join(', ')}`);
    }
    
    // Validar tamanho
    if (file.size > opts.maxSizeBytes) {
      const maxSizeMB = opts.maxSizeBytes / (1024 * 1024);
      throw new Error(`Arquivo muito grande. Tamanho máximo: ${maxSizeMB}MB`);
    }
    
    // Gerar nome único para o arquivo
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const fullPath = `${path}/${fileName}`;
    
    try {
      // Upload para o Supabase Storage
      const { data, error } = await supabase.storage
        .from(opts.bucket)
        .upload(fullPath, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (error) {
        throw new Error(`Erro no upload: ${error.message}`);
      }
      
      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from(opts.bucket)
        .getPublicUrl(fullPath);
      
      return {
        url: urlData.publicUrl,
        path: fullPath
      };
    } catch (error) {
      console.error('Storage upload error:', error);
      throw error;
    }
  }
  
  static async deleteImage(path: string, bucket: string = DEFAULT_OPTIONS.bucket): Promise<void> {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([path]);
      
      if (error) {
        throw new Error(`Erro ao deletar arquivo: ${error.message}`);
      }
    } catch (error) {
      console.error('Storage delete error:', error);
      throw error;
    }
  }
}