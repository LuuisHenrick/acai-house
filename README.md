# Açaí House

Sistema completo de cardápio e administração para a Açaí House.

## Configuração do Supabase

### 1. Variáveis de Ambiente

Certifique-se de que o arquivo `.env` contém as variáveis corretas:

```
VITE_SUPABASE_URL=https://yrtsmxxeynyhbqgmxyzg.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_GOOGLE_MAPS_API_KEY=SUA_CHAVE_GOOGLE_AQUI
```

### 2. Configuração do Google Maps API

Para utilizar a funcionalidade de mapas no painel administrativo:

1. **Obter chave da API:**
   - Acesse o [Google Cloud Console](https://console.cloud.google.com/)
   - Crie um novo projeto ou selecione um existente
   - Ative as seguintes APIs:
     - Maps JavaScript API
     - Places API
     - Geocoding API (opcional)

2. **Configurar faturamento:**
   - Configure uma conta de faturamento no Google Cloud
   - Associe a conta ao seu projeto

3. **Criar chave da API:**
   - Vá para "APIs e Serviços" > "Credenciais"
   - Clique em "Criar credenciais" > "Chave de API"
   - Copie a chave gerada

4. **Configurar no projeto:**
   - Adicione a chave no arquivo `.env`:
     ```
     VITE_GOOGLE_MAPS_API_KEY=sua_chave_aqui
     ```
   - Reinicie o servidor de desenvolvimento

5. **Funcionalidades disponíveis:**
   - Autocomplete de endereços
   - Mapa interativo com marcador arrastável
   - Geocodificação automática
   - InfoWindow com informações da loja

### 3. Políticas RLS (Row Level Security)

Execute os seguintes comandos no SQL Editor do Supabase para configurar as políticas de segurança:

```sql
-- Habilitar RLS na tabela site_settings
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Política para leitura pública das configurações
CREATE POLICY "Allow public read access to site settings"
  ON site_settings
  FOR SELECT
  TO public
  USING (true);

-- Política para usuários autenticados gerenciarem configurações
CREATE POLICY "Allow authenticated users to manage site settings"
  ON site_settings
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Habilitar RLS na tabela promotions (se existir)
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;

-- Política para leitura pública de promoções ativas
CREATE POLICY "Allow public read access to active promotions"
  ON promotions
  FOR SELECT
  TO public
  USING (active = true AND start_date <= now() AND end_date >= now());
```

### 4. Verificação de Conectividade

O sistema agora inclui:

- ✅ Teste automático de conexão com Supabase
- ✅ Fallback para configurações padrão em caso de erro
- ✅ Mensagens de erro amigáveis
- ✅ Tratamento de erros de CORS e rede
- ✅ Logs detalhados para debug
- ✅ Configuração automática do Google Maps
- ✅ Feedback visual para status da API

### 5. Solução de Problemas

**Erro "Failed to fetch":**
1. Verifique se as variáveis de ambiente estão corretas
2. Confirme que as políticas RLS estão configuradas
3. Teste a conexão em ambiente local (fora do preview do Bolt)

**Erro de política RLS:**
1. Execute os comandos SQL acima no Supabase
2. Verifique se a tabela `site_settings` existe
3. Confirme que o usuário tem permissões adequadas

**Erro "Google Maps API key not configured":**
1. Configure VITE_GOOGLE_MAPS_API_KEY no arquivo .env
2. Ative as APIs necessárias no Google Cloud Console
3. Configure o faturamento no Google Cloud
4. Reinicie o servidor de desenvolvimento

## Desenvolvimento Local

```bash
npm install
npm run dev
```

O sistema funcionará com configurações padrão mesmo se o Supabase não estiver acessível.

## Funcionalidades

### Sistema de Cupons
- ✅ Validação de cupons de desconto
- ✅ Aplicação automática de promoções
- ✅ Interface intuitiva no carrinho
- ✅ Feedback visual de economia

### Google Maps Integration
- ✅ Autocomplete de endereços
- ✅ Mapa interativo
- ✅ Marcador arrastável
- ✅ Geocodificação automática
- ✅ Tratamento de erros robusto

### Painel Administrativo
- ✅ Gerenciamento de produtos
- ✅ Sistema de promoções
- ✅ Configurações do site
- ✅ Upload de imagens
- ✅ Gerenciamento de localização