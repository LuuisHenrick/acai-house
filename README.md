# Açaí House

Sistema completo de cardápio e administração para a Açaí House.

## Configuração do Supabase

### 1. Variáveis de Ambiente

Certifique-se de que o arquivo `.env` contém as variáveis corretas:

```
VITE_SUPABASE_URL=https://yrtsmxxeynyhbqgmxyzg.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. Políticas RLS (Row Level Security)

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

### 3. Verificação de Conectividade

O sistema agora inclui:

- ✅ Teste automático de conexão com Supabase
- ✅ Fallback para configurações padrão em caso de erro
- ✅ Mensagens de erro amigáveis
- ✅ Tratamento de erros de CORS e rede
- ✅ Logs detalhados para debug

### 4. Solução de Problemas

**Erro "Failed to fetch":**
1. Verifique se as variáveis de ambiente estão corretas
2. Confirme que as políticas RLS estão configuradas
3. Teste a conexão em ambiente local (fora do preview do Bolt)

**Erro de política RLS:**
1. Execute os comandos SQL acima no Supabase
2. Verifique se a tabela `site_settings` existe
3. Confirme que o usuário tem permissões adequadas

## Desenvolvimento Local

```bash
npm install
npm run dev
```

O sistema funcionará com configurações padrão mesmo se o Supabase não estiver acessível.