import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import CategoryManager from '../components/admin/CategoryManager';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

// Mock dependencies
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          data: [],
          error: null
        }))
      })),
      insert: vi.fn(() => ({
        data: null,
        error: null
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          data: null,
          error: null
        }))
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => ({
          data: null,
          error: null
        }))
      }))
    })),
    auth: {
      getUser: vi.fn(() => ({
        data: { user: { id: 'test-user-id' } }
      }))
    }
  }
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

vi.mock('react-beautiful-dnd', () => ({
  DragDropContext: ({ children }: any) => children,
  Droppable: ({ children }: any) => children({ innerRef: vi.fn(), droppableProps: {}, placeholder: null }),
  Draggable: ({ children }: any) => children({ innerRef: vi.fn(), draggableProps: {}, dragHandleProps: {} }, {})
}));

describe('CategoryManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders category manager with empty state', async () => {
    render(<CategoryManager />);
    
    await waitFor(() => {
      expect(screen.getByText('Gerenciar Categorias')).toBeInTheDocument();
      expect(screen.getByText('Nenhuma categoria cadastrada')).toBeInTheDocument();
    });
  });

  it('opens modal when clicking "Nova Categoria"', async () => {
    render(<CategoryManager />);
    
    await waitFor(() => {
      const newCategoryButton = screen.getByText('Nova Categoria');
      fireEvent.click(newCategoryButton);
      
      expect(screen.getByText('Nova Categoria')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Ex: Açaí Premium')).toBeInTheDocument();
    });
  });

  it('validates required fields when creating category', async () => {
    render(<CategoryManager />);
    
    await waitFor(() => {
      const newCategoryButton = screen.getByText('Nova Categoria');
      fireEvent.click(newCategoryButton);
    });

    const saveButton = screen.getByText('Salvar');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Por favor, corrija os erros no formulário');
    });
  });

  it('creates new category with valid data', async () => {
    const mockInsert = vi.fn(() => ({
      data: null,
      error: null
    }));
    
    (supabase.from as any).mockReturnValue({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          data: [],
          error: null
        }))
      })),
      insert: mockInsert
    });

    render(<CategoryManager />);
    
    await waitFor(() => {
      const newCategoryButton = screen.getByText('Nova Categoria');
      fireEvent.click(newCategoryButton);
    });

    // Fill form
    const nameInput = screen.getByPlaceholderText('Ex: Açaí Premium');
    const descriptionInput = screen.getByPlaceholderText('Descreva a categoria...');
    
    fireEvent.change(nameInput, { target: { value: 'Açaí Premium' } });
    fireEvent.change(descriptionInput, { target: { value: 'Açaís premium com ingredientes nobres' } });

    const saveButton = screen.getByText('Salvar');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledWith({
        name: 'Açaí Premium',
        description: 'Açaís premium com ingredientes nobres',
        slug: 'acai-premium',
        color: '#8B5CF6',
        icon: 'package',
        is_active: true,
        display_order: 1,
        created_by: 'test-user-id'
      });
      expect(toast.success).toHaveBeenCalledWith('Categoria criada com sucesso!');
    });
  });

  it('handles duplicate category names', async () => {
    const mockInsert = vi.fn(() => ({
      data: null,
      error: { code: '23505', message: 'duplicate key value violates unique constraint "product_categories_name_key"' }
    }));
    
    (supabase.from as any).mockReturnValue({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          data: [],
          error: null
        }))
      })),
      insert: mockInsert
    });

    render(<CategoryManager />);
    
    await waitFor(() => {
      const newCategoryButton = screen.getByText('Nova Categoria');
      fireEvent.click(newCategoryButton);
    });

    // Fill form with duplicate name
    const nameInput = screen.getByPlaceholderText('Ex: Açaí Premium');
    fireEvent.change(nameInput, { target: { value: 'Tradicional' } });

    const saveButton = screen.getByText('Salvar');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Já existe uma categoria com este nome');
    });
  });

  it('validates empty category name', async () => {
    render(<CategoryManager />);
    
    await waitFor(() => {
      const newCategoryButton = screen.getByText('Nova Categoria');
      fireEvent.click(newCategoryButton);
    });

    const nameInput = screen.getByPlaceholderText('Ex: Açaí Premium');
    fireEvent.change(nameInput, { target: { value: '' } });
    fireEvent.blur(nameInput);

    const saveButton = screen.getByText('Salvar');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Nome é obrigatório')).toBeInTheDocument();
    });
  });

  it('validates category name length', async () => {
    render(<CategoryManager />);
    
    await waitFor(() => {
      const newCategoryButton = screen.getByText('Nova Categoria');
      fireEvent.click(newCategoryButton);
    });

    const nameInput = screen.getByPlaceholderText('Ex: Açaí Premium');
    
    // Test minimum length
    fireEvent.change(nameInput, { target: { value: 'A' } });
    fireEvent.blur(nameInput);

    const saveButton = screen.getByText('Salvar');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Nome deve ter pelo menos 2 caracteres')).toBeInTheDocument();
    });

    // Test maximum length
    const longName = 'A'.repeat(51);
    fireEvent.change(nameInput, { target: { value: longName } });
    fireEvent.blur(nameInput);
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Nome deve ter no máximo 50 caracteres')).toBeInTheDocument();
    });
  });

  it('auto-generates slug from name', async () => {
    render(<CategoryManager />);
    
    await waitFor(() => {
      const newCategoryButton = screen.getByText('Nova Categoria');
      fireEvent.click(newCategoryButton);
    });

    const nameInput = screen.getByPlaceholderText('Ex: Açaí Premium');
    const slugInput = screen.getByPlaceholderText('acai-premium');
    
    fireEvent.change(nameInput, { target: { value: 'Açaí Especial & Premium!' } });

    await waitFor(() => {
      expect(slugInput).toHaveValue('acai-especial-premium');
    });
  });

  it('validates slug format', async () => {
    render(<CategoryManager />);
    
    await waitFor(() => {
      const newCategoryButton = screen.getByText('Nova Categoria');
      fireEvent.click(newCategoryButton);
    });

    const slugInput = screen.getByPlaceholderText('acai-premium');
    
    // Test invalid characters
    fireEvent.change(slugInput, { target: { value: 'açaí-especial!' } });
    fireEvent.blur(slugInput);

    const saveButton = screen.getByText('Salvar');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Slug deve conter apenas letras minúsculas, números e hífens')).toBeInTheDocument();
    });
  });

  it('validates description length', async () => {
    render(<CategoryManager />);
    
    await waitFor(() => {
      const newCategoryButton = screen.getByText('Nova Categoria');
      fireEvent.click(newCategoryButton);
    });

    const descriptionInput = screen.getByPlaceholderText('Descreva a categoria...');
    const longDescription = 'A'.repeat(201);
    
    fireEvent.change(descriptionInput, { target: { value: longDescription } });
    fireEvent.blur(descriptionInput);

    const saveButton = screen.getByText('Salvar');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Descrição deve ter no máximo 200 caracteres')).toBeInTheDocument();
    });
  });

  it('validates color format', async () => {
    render(<CategoryManager />);
    
    await waitFor(() => {
      const newCategoryButton = screen.getByText('Nova Categoria');
      fireEvent.click(newCategoryButton);
    });

    const colorInput = screen.getByPlaceholderText('#8B5CF6');
    
    fireEvent.change(colorInput, { target: { value: 'invalid-color' } });
    fireEvent.blur(colorInput);

    const saveButton = screen.getByText('Salvar');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Cor deve estar no formato hexadecimal válido')).toBeInTheDocument();
    });
  });

  it('updates existing category', async () => {
    const mockCategories = [{
      id: 'cat-1',
      name: 'Tradicional',
      description: 'Açaís tradicionais',
      slug: 'tradicional',
      color: '#8B5CF6',
      icon: 'bowl',
      is_active: true,
      display_order: 1,
      product_count: 3
    }];

    const mockUpdate = vi.fn(() => ({
      eq: vi.fn(() => ({
        data: null,
        error: null
      }))
    }));

    (supabase.from as any).mockReturnValue({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          data: mockCategories,
          error: null
        }))
      })),
      update: mockUpdate
    });

    render(<CategoryManager />);
    
    await waitFor(() => {
      expect(screen.getByText('Tradicional')).toBeInTheDocument();
    });

    // Click edit button
    const editButton = screen.getByTitle('Editar');
    fireEvent.click(editButton);

    await waitFor(() => {
      expect(screen.getByText('Editar Categoria')).toBeInTheDocument();
    });

    // Update name
    const nameInput = screen.getByDisplayValue('Tradicional');
    fireEvent.change(nameInput, { target: { value: 'Tradicional Atualizado' } });

    const saveButton = screen.getByText('Salvar');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('Categoria atualizada com sucesso!');
    });
  });

  it('deletes category without products', async () => {
    const mockCategories = [{
      id: 'cat-1',
      name: 'Tradicional',
      description: 'Açaís tradicionais',
      slug: 'tradicional',
      color: '#8B5CF6',
      icon: 'bowl',
      is_active: true,
      display_order: 1,
      product_count: 0
    }];

    const mockDelete = vi.fn(() => ({
      eq: vi.fn(() => ({
        data: null,
        error: null
      }))
    }));

    (supabase.from as any).mockReturnValue({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          data: mockCategories,
          error: null
        })),
        eq: vi.fn(() => ({
          limit: vi.fn(() => ({
            data: [],
            error: null
          }))
        }))
      })),
      delete: mockDelete
    });

    // Mock window.confirm
    window.confirm = vi.fn(() => true);

    render(<CategoryManager />);
    
    await waitFor(() => {
      expect(screen.getByText('Tradicional')).toBeInTheDocument();
    });

    // Click delete button
    const deleteButton = screen.getByTitle('Excluir');
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('Categoria excluída com sucesso!');
    });
  });

  it('prevents deletion of category with products', async () => {
    const mockCategories = [{
      id: 'cat-1',
      name: 'Tradicional',
      description: 'Açaís tradicionais',
      slug: 'tradicional',
      color: '#8B5CF6',
      icon: 'bowl',
      is_active: true,
      display_order: 1,
      product_count: 3
    }];

    (supabase.from as any).mockReturnValue({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          data: mockCategories,
          error: null
        })),
        eq: vi.fn(() => ({
          limit: vi.fn(() => ({
            data: [{ id: 'product-1' }],
            error: null
          }))
        }))
      }))
    });

    // Mock window.confirm
    window.confirm = vi.fn(() => true);

    render(<CategoryManager />);
    
    await waitFor(() => {
      expect(screen.getByText('Tradicional')).toBeInTheDocument();
    });

    // Click delete button
    const deleteButton = screen.getByTitle('Excluir');
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Não é possível excluir uma categoria que possui produtos associados');
    });
  });

  it('toggles category active status', async () => {
    const mockCategories = [{
      id: 'cat-1',
      name: 'Tradicional',
      description: 'Açaís tradicionais',
      slug: 'tradicional',
      color: '#8B5CF6',
      icon: 'bowl',
      is_active: true,
      display_order: 1,
      product_count: 3
    }];

    const mockUpdate = vi.fn(() => ({
      eq: vi.fn(() => ({
        data: null,
        error: null
      }))
    }));

    (supabase.from as any).mockReturnValue({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          data: mockCategories,
          error: null
        }))
      })),
      update: mockUpdate
    });

    render(<CategoryManager />);
    
    await waitFor(() => {
      expect(screen.getByText('Tradicional')).toBeInTheDocument();
    });

    // Click toggle button
    const toggleButton = screen.getByTitle('Desativar');
    fireEvent.click(toggleButton);

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith({
        is_active: false,
        updated_by: 'test-user-id'
      });
      expect(toast.success).toHaveBeenCalledWith('Categoria desativada com sucesso!');
    });
  });

  it('filters categories by search term', async () => {
    const mockCategories = [
      {
        id: 'cat-1',
        name: 'Tradicional',
        description: 'Açaís tradicionais',
        slug: 'tradicional',
        color: '#8B5CF6',
        icon: 'bowl',
        is_active: true,
        display_order: 1,
        product_count: 3
      },
      {
        id: 'cat-2',
        name: 'Premium',
        description: 'Açaís premium',
        slug: 'premium',
        color: '#EF4444',
        icon: 'crown',
        is_active: true,
        display_order: 2,
        product_count: 2
      }
    ];

    (supabase.from as any).mockReturnValue({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          data: mockCategories,
          error: null
        }))
      }))
    });

    render(<CategoryManager />);
    
    await waitFor(() => {
      expect(screen.getByText('Tradicional')).toBeInTheDocument();
      expect(screen.getByText('Premium')).toBeInTheDocument();
    });

    // Search for "premium"
    const searchInput = screen.getByPlaceholderText('Buscar categorias...');
    fireEvent.change(searchInput, { target: { value: 'premium' } });

    await waitFor(() => {
      expect(screen.getByText('Premium')).toBeInTheDocument();
      expect(screen.queryByText('Tradicional')).not.toBeInTheDocument();
    });
  });
});