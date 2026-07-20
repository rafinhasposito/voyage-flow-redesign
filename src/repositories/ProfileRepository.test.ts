import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProfileRepository } from './ProfileRepository';
import { supabase } from '../lib/supabase';

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn()
  }
}));

describe('ProfileRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    user_metadata: { first_name: 'John', last_name: 'Doe' }
  } as any;

  it('deve criar profile por upsert quando inexistente', async () => {
    const fromMock = vi.fn();
    const selectMock = vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }) }) });
    const upsertMock = vi.fn().mockResolvedValue({ error: null });
    
    fromMock.mockImplementation((table) => {
      if (table === 'profiles') {
        return {
          select: selectMock,
          upsert: upsertMock,
        };
      }
    });
    
    (supabase.from as any) = fromMock;

    await ProfileRepository.ensureCurrentUserProfile(mockUser);

    expect(fromMock).toHaveBeenCalledWith('profiles');
    expect(upsertMock).toHaveBeenCalledWith({
      id: 'user-123',
      email: 'test@example.com',
      first_name: 'John',
      last_name: 'Doe',
      full_name: 'John Doe'
    }, { onConflict: 'id' });
  });

  it('não deve fazer upsert se profile já existente', async () => {
    const fromMock = vi.fn();
    const selectMock = vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'user-123' }, error: null }) }) });
    const upsertMock = vi.fn();
    
    fromMock.mockImplementation((table) => {
      if (table === 'profiles') {
        return {
          select: selectMock,
          upsert: upsertMock,
        };
      }
    });
    
    (supabase.from as any) = fromMock;

    await ProfileRepository.ensureCurrentUserProfile(mockUser);

    expect(selectMock).toHaveBeenCalled();
    expect(upsertMock).not.toHaveBeenCalled();
  });

  it('deve repassar erro caso falhe a criação (upsert error)', async () => {
    const fromMock = vi.fn();
    const selectMock = vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }) }) });
    const upsertMock = vi.fn().mockResolvedValue({ error: { message: 'Insert failed' } });
    
    fromMock.mockImplementation((table) => {
      if (table === 'profiles') {
        return {
          select: selectMock,
          upsert: upsertMock,
        };
      }
    });
    
    (supabase.from as any) = fromMock;

    await expect(ProfileRepository.ensureCurrentUserProfile(mockUser)).rejects.toEqual({ message: 'Insert failed' });
  });
});
