import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TripRepository } from './TripRepository';
import { ProfileRepository } from './ProfileRepository';
import { supabase } from '../lib/supabase';

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn()
    },
    from: vi.fn()
  }
}));

vi.mock('./ProfileRepository', () => ({
  ProfileRepository: {
    ensureCurrentUserProfile: vi.fn()
  }
}));

describe('TripRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
  } as any;

  it('deve chamar ensureCurrentUserProfile antes de criar a viagem', async () => {
    (supabase.auth.getUser as any).mockResolvedValue({ data: { user: mockUser } });
    
    const insertMock = vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: { id: 'trip-1' }, error: null }) }) });
    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'trips') return { insert: insertMock };
    });

    const payload = {
      title: 'RJ',
      destination: 'Rio',
      start_date: '2026-10-10',
      end_date: '2026-10-20'
    };

    await TripRepository.createTrip(payload);

    expect(ProfileRepository.ensureCurrentUserProfile).toHaveBeenCalledWith(mockUser);
    
    // Confirma que o owner_id (user_id) vem da sessão e não do payload
    expect(insertMock).toHaveBeenCalledWith([{
      title: 'RJ',
      destination: 'Rio',
      start_date: '2026-10-10',
      end_date: '2026-10-20',
      user_id: 'user-123'
    }]);
  });
});
