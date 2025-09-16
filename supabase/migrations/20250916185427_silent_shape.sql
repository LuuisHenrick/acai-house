/*
  # Configurar Suporte a GIFs no Storage

  1. Bucket Configuration
    - Atualizar bucket 'site-images' para aceitar GIFs
    - Aumentar limite de tamanho para 5MB
    - Adicionar image/gif aos tipos MIME permitidos

  2. Notas Importantes
    - Esta migração deve ser executada manualmente no Supabase Dashboard
    - Acesse: Storage > site-images > Settings
    - Ou execute os comandos SQL abaixo no SQL Editor
*/

-- Atualizar configurações do bucket para suportar GIFs e aumentar limite
UPDATE storage.buckets 
SET 
  file_size_limit = 5242880, -- 5MB em bytes
  allowed_mime_types = ARRAY[
    'image/jpeg', 
    'image/jpg', 
    'image/png', 
    'image/webp',
    'image/gif'
  ]
WHERE id = 'site-images';

-- Verificar se a atualização foi aplicada
SELECT 
  id,
  name,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE id = 'site-images';

-- Resultado esperado:
-- id: site-images
-- name: site-images  
-- file_size_limit: 5242880
-- allowed_mime_types: {image/jpeg,image/jpg,image/png,image/webp,image/gif}