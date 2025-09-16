# Configuração de Suporte a GIFs

## ⚠️ Configuração Manual Necessária

Para que o upload de GIFs funcione completamente, você precisa configurar manualmente o bucket do Supabase:

### 1. Via Supabase Dashboard (Recomendado)

1. **Acesse seu projeto no Supabase Dashboard**
2. **Vá para Storage > Buckets**
3. **Clique no bucket `site-images`**
4. **Clique em "Settings" ou "Configurações"**
5. **Atualize as configurações**:
   - **File size limit**: `5242880` (5MB)
   - **Allowed MIME types**: Adicione `image/gif` à lista existente

### 2. Via SQL Editor (Alternativa)

Execute o seguinte comando no SQL Editor do Supabase:

```sql
UPDATE storage.buckets 
SET 
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY[
    'image/jpeg', 
    'image/jpg', 
    'image/png', 
    'image/webp',
    'image/gif'
  ]
WHERE id = 'site-images';
```

### 3. Verificar Configuração

Para confirmar que a configuração foi aplicada:

```sql
SELECT 
  id,
  name,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE id = 'site-images';
```

**Resultado esperado**:
- `file_size_limit`: 5242880
- `allowed_mime_types`: `{image/jpeg,image/jpg,image/png,image/webp,image/gif}`

## 🎯 Funcionalidades Implementadas

### ✅ **Upload de GIFs**
- Interface aceita arquivos GIF até 5MB
- Validação de formato no frontend
- Preservação da animação (sem otimização)

### ✅ **Renderização Otimizada**
- GIFs são renderizados como `<video>` para melhor performance
- Fallback para `<img>` em navegadores incompatíveis
- Atributos otimizados: `autoPlay`, `loop`, `muted`, `playsInline`

### ✅ **Performance Mobile**
- `preload="metadata"` para carregamento otimizado
- `object-fit: cover` para responsividade
- Transições suaves mantidas

### ✅ **Compatibilidade**
- Funciona com imagens estáticas existentes
- Suporte a vídeos MP4/WebM nativos
- Fallbacks robustos para todos os formatos

## 🚨 Limitações Atuais

Até que a configuração manual seja feita:

1. **GIFs não farão upload**: O Supabase rejeitará arquivos GIF
2. **Arquivos > 3MB falharão**: Limite atual do bucket
3. **Mensagens de erro**: Interface mostra avisos sobre limitações

## 🔧 Após Configuração

Uma vez configurado o bucket:

1. **Upload funcionará**: GIFs até 5MB serão aceitos
2. **Renderização otimizada**: GIFs aparecerão como vídeo em loop
3. **Performance mantida**: Sem impacto na velocidade da página
4. **Experiência completa**: Todos os formatos funcionando perfeitamente

## 📱 Benefícios Mobile

- **Menor uso de CPU**: Vídeos são mais eficientes que GIFs animados
- **Melhor controle**: Pause automático quando fora da tela
- **Responsividade**: Adapta-se perfeitamente a qualquer tamanho
- **Acessibilidade**: Respeita preferências de movimento reduzido