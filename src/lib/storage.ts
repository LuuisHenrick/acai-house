import { supabase } from './supabase';

export interface UploadResult {
  url: string;
  path: string;
}

export interface UploadOptions {
  maxSizeBytes?: number;
  allowedTypes?: string[];
  bucket?: string;
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
}

const DEFAULT_OPTIONS: Required<UploadOptions> = {
  maxSizeBytes: 3 * 1024 * 1024, // 3MB
  allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  bucket: 'site-images',
  quality: 0.8,
  maxWidth: 1200,
  maxHeight: 1200
};

export class StorageService {
  /**
   * Otimiza uma imagem redimensionando e comprimindo
   */
  private static async optimizeImage(
    file: File, 
    options: Required<UploadOptions>
  ): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calcular novas dimensões mantendo proporção
        let { width, height } = img;
        const maxWidth = options.maxWidth;
        const maxHeight = options.maxHeight;

        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        // Configurar canvas
        canvas.width = width;
        canvas.height = height;

        if (!ctx) {
          reject(new Error('Não foi possível obter contexto do canvas'));
          return;
        }

        // Desenhar imagem otimizada
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Converter para blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Erro ao otimizar imagem'));
              return;
            }

            // Criar novo arquivo otimizado
            const optimizedFile = new File(
              [blob], 
              file.name.replace(/\.[^/.]+$/, '.jpg'), // Converter para JPG
              { 
                type: 'image/jpeg',
                lastModified: Date.now()
              }
            );

            resolve(optimizedFile);
          },
          'image/jpeg',
          options.quality
        );
      };

      img.onerror = () => {
        reject(new Error('Erro ao carregar imagem para otimização'));
      };

      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Faz upload de uma imagem com otimização automática
   */
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
    
    // Validar tamanho inicial
    if (file.size > opts.maxSizeBytes) {
      const maxSizeMB = opts.maxSizeBytes / (1024 * 1024);
      throw new Error(`Arquivo muito grande. Tamanho máximo: ${maxSizeMB}MB`);
    }
    
    try {
      // Otimizar imagem
      const optimizedFile = await this.optimizeImage(file, opts);
      
      // Verificar se a otimização reduziu o tamanho suficientemente
      if (optimizedFile.size > opts.maxSizeBytes) {
        const maxSizeMB = opts.maxSizeBytes / (1024 * 1024);
        throw new Error(`Imagem ainda muito grande após otimização. Máximo: ${maxSizeMB}MB`);
      }

      // Gerar nome único para o arquivo
      const fileExt = 'jpg'; // Sempre JPG após otimização
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const fullPath = `${path}/${fileName}`;
      
      // Upload para o Supabase Storage
      const { data, error } = await supabase.storage
        .from(opts.bucket)
        .upload(fullPath, optimizedFile, {
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
  
  /**
   * Deleta uma imagem do storage
   */
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

  /**
   * Lista imagens de um diretório
   */
  static async listImages(path: string, bucket: string = DEFAULT_OPTIONS.bucket): Promise<string[]> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .list(path);
      
      if (error) {
        throw new Error(`Erro ao listar arquivos: ${error.message}`);
      }
      
      return (data || [])
        .filter(file => file.name.match(/\.(jpg|jpeg|png|webp)$/i))
        .map(file => `${path}/${file.name}`);
    } catch (error) {
      console.error('Storage list error:', error);
      throw error;
    }
  }

  /**
   * Obtém URL pública de uma imagem
   */
  static getPublicUrl(path: string, bucket: string = DEFAULT_OPTIONS.bucket): string {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    
    return data.publicUrl;
  }
}