/*
  # Correção das Políticas RLS para Tabela Products

  Este script resolve o erro "new row violates row-level security policy for table 'products'"
  garantindo que usuários autenticados tenham acesso completo para operações CRUD.

  ## Problema:
  - Erro 42501 ao tentar inserir/atualizar produtos
  - Políticas RLS muito restritivas impedindo operações básicas
  - Falhas em .insert() e .upsert() mesmo com returning: 'minimal'

  ## Solução:
  - Políticas permissivas para authenticated users
  - Acesso público limitado apenas a produtos ativos
  - Suporte completo para todas as operações CRUD
*/

-- Garantir que RLS está habilitado
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes que podem estar causando conflito
DROP POLICY IF EXISTS "Allow authenticated users to insert products" ON products;
DROP POLICY IF EXISTS "Allow authenticated users to update products" ON products;
DROP POLICY IF EXISTS "Allow authenticated users to delete products" ON products;
DROP POLICY IF EXISTS "Allow authenticated users to select all products" ON products;
DROP POLICY IF EXISTS "Allow authenticated users to manage products" ON products;
DROP POLICY IF EXISTS "Allow public read access to active products" ON products;

-- Criar políticas específicas para usuários autenticados
-- Estas políticas são permissivas para garantir funcionalidade completa

-- SELECT: Permite que usuários autenticados vejam todos os produtos
CREATE POLICY "authenticated_select_products"
  ON products
  FOR SELECT
  TO authenticated
  USING (true);

-- INSERT: Permite que usuários autenticados criem novos produtos
CREATE POLICY "authenticated_insert_products"
  ON products
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- UPDATE: Permite que usuários autenticados atualizem qualquer produto
CREATE POLICY "authenticated_update_products"
  ON products
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- DELETE: Permite que usuários autenticados excluam produtos
CREATE POLICY "authenticated_delete_products"
  ON products
  FOR DELETE
  TO authenticated
  USING (true);

-- Política para acesso público (apenas produtos ativos)
CREATE POLICY "public_select_active_products"
  ON products
  FOR SELECT
  TO public
  USING (active = true);

-- Verificar se as políticas foram criadas corretamente
DO $$
BEGIN
  RAISE NOTICE 'Políticas RLS para tabela products foram atualizadas com sucesso!';
  RAISE NOTICE 'Usuários autenticados agora têm acesso completo para CRUD operations.';
  RAISE NOTICE 'Usuários públicos podem apenas visualizar produtos ativos.';
END $$;