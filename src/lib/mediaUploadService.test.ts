import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  identifyMediaType, 
  MEDIA_CONFIG, 
  removeMediaSafely, 
  moveDraftMediaToPermanent,
  uploadMedia
} from './mediaUploadService';
import { supabase } from '@/lib/supabase';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    storage: {
      from: vi.fn()
    }
  }
}));

describe('Media Upload Service', () => {
  let mockRemove: any;
  let mockMove: any;
  let mockGetPublicUrl: any;
  let mockUpload: any;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('VITE_SUPABASE_URL', 'https://mock.supabase.co');

    mockRemove = vi.fn().mockResolvedValue({ error: null });
    mockMove = vi.fn().mockResolvedValue({ error: null });
    mockGetPublicUrl = vi.fn((path) => ({ data: { publicUrl: `https://mock.supabase.co/storage/v1/object/public/experiences-media/${path}` } }));
    mockUpload = vi.fn().mockResolvedValue({ data: { path: 'some-path' }, error: null });

    vi.mocked(supabase.storage.from).mockReturnValue({
      remove: mockRemove,
      move: mockMove,
      getPublicUrl: mockGetPublicUrl,
      upload: mockUpload,
    } as any);
  });

  describe('identifyMediaType', () => {
    it('should identify jpeg, png, webp as image', () => {
      expect(identifyMediaType('https://example.com/image.jpg')).toBe('image');
      expect(identifyMediaType('https://example.com/image.png')).toBe('image');
      expect(identifyMediaType('https://example.com/image.webp')).toBe('image');
    });

    it('should identify mp4, webm, youtube, vimeo as video', () => {
      expect(identifyMediaType('https://example.com/video.mp4')).toBe('video');
      expect(identifyMediaType('https://example.com/video.webm')).toBe('video');
      expect(identifyMediaType('https://youtube.com/watch?v=123')).toBe('video');
      expect(identifyMediaType('https://vimeo.com/123')).toBe('video');
    });

    it('should fallback to mime type if provided', () => {
      expect(identifyMediaType('blob:1234', 'video/mp4')).toBe('video');
      expect(identifyMediaType('blob:1234', 'image/jpeg')).toBe('image');
    });
  });

  describe('removeMediaSafely', () => {
    it('removes media belonging to the specific experience', async () => {
      const urls = ['https://mock.supabase.co/storage/v1/object/public/experiences-media/exp-123/file.jpg'];
      await removeMediaSafely(urls, 'exp-123');
      expect(mockRemove).toHaveBeenCalledWith(['exp-123/file.jpg']);
    });

    it('rejects media belonging to another experience', async () => {
      const urls = ['https://mock.supabase.co/storage/v1/object/public/experiences-media/exp-999/file.jpg'];
      await removeMediaSafely(urls, 'exp-123');
      expect(mockRemove).not.toHaveBeenCalled();
    });

    it('ignores external URLs completely', async () => {
      const urls = ['https://external.com/image.jpg'];
      await removeMediaSafely(urls, 'exp-123');
      expect(mockRemove).not.toHaveBeenCalled();
    });

    it('allows removing from correct draftId', async () => {
      const urls = ['https://mock.supabase.co/storage/v1/object/public/experiences-media/drafts/draft-123/file.jpg'];
      await removeMediaSafely(urls, 'exp-123', 'draft-123');
      expect(mockRemove).toHaveBeenCalledWith(['drafts/draft-123/file.jpg']);
    });

    it('rejects removing from different draftId', async () => {
      const urls = ['https://mock.supabase.co/storage/v1/object/public/experiences-media/drafts/draft-999/file.jpg'];
      await removeMediaSafely(urls, 'exp-123', 'draft-123');
      expect(mockRemove).not.toHaveBeenCalled();
    });

    it('does not call remove when safe list is empty', async () => {
      await removeMediaSafely(['https://external.com/image.jpg', 'https://mock.supabase.co/storage/v1/object/public/experiences-media/exp-999/file.jpg'], 'exp-123', 'draft-123');
      expect(mockRemove).not.toHaveBeenCalled();
    });
  });

  describe('moveDraftMediaToPermanent', () => {
    it('move success returns new URL', async () => {
      const draftUrl = 'https://mock.supabase.co/storage/v1/object/public/experiences-media/drafts/d-123/img.jpg';
      const result = await moveDraftMediaToPermanent('d-123', 'exp-123', [draftUrl]);
      expect(mockMove).toHaveBeenCalledWith('drafts/d-123/img.jpg', 'exp-123/img.jpg');
      expect(result).toEqual(['https://mock.supabase.co/storage/v1/object/public/experiences-media/exp-123/img.jpg']);
    });

    it('move failure preserves old URL', async () => {
      mockMove.mockResolvedValueOnce({ error: { message: 'Network error' } });
      const draftUrl = 'https://mock.supabase.co/storage/v1/object/public/experiences-media/drafts/d-123/img.jpg';
      const result = await moveDraftMediaToPermanent('d-123', 'exp-123', [draftUrl]);
      expect(result).toEqual([draftUrl]);
    });

    it('external URLs remain unchanged', async () => {
      const externalUrl = 'https://external.com/img.jpg';
      const result = await moveDraftMediaToPermanent('d-123', 'exp-123', [externalUrl]);
      expect(mockMove).not.toHaveBeenCalled();
      expect(result).toEqual([externalUrl]);
    });

    it('media not belonging to draft remains unchanged', async () => {
      const otherDraftUrl = 'https://mock.supabase.co/storage/v1/object/public/experiences-media/drafts/d-999/img.jpg';
      const result = await moveDraftMediaToPermanent('d-123', 'exp-123', [otherDraftUrl]);
      expect(mockMove).not.toHaveBeenCalled();
      expect(result).toEqual([otherDraftUrl]);
    });

    it('partial success preserves references', async () => {
      mockMove.mockResolvedValueOnce({ error: { message: 'Error' } });
      mockMove.mockResolvedValueOnce({ error: null });

      const urls = [
        'https://mock.supabase.co/storage/v1/object/public/experiences-media/drafts/d-123/1.jpg',
        'https://mock.supabase.co/storage/v1/object/public/experiences-media/drafts/d-123/2.jpg'
      ];
      
      const result = await moveDraftMediaToPermanent('d-123', 'exp-123', urls);
      
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(urls[0]); 
      expect(result[1]).toEqual('https://mock.supabase.co/storage/v1/object/public/experiences-media/exp-123/2.jpg'); 
    });
  });

  describe('uploadMedia and URL roundtrip', () => {
    it('storage path -> public URL -> extractStoragePath -> same storage path', async () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
      const draftId = 'd-123';
      
      vi.spyOn(crypto, 'randomUUID').mockReturnValue('random-uuid');
      
      const expectedStoragePath = `drafts/d-123/random-uuid.jpg`;
      mockUpload.mockResolvedValueOnce({ data: { path: expectedStoragePath }, error: null });

      const result = await uploadMedia(file, draftId, true);
      
      expect(mockUpload).toHaveBeenCalled();
      expect(mockGetPublicUrl).toHaveBeenCalledWith(expectedStoragePath);
      
      const expectedPublicUrl = `https://mock.supabase.co/storage/v1/object/public/experiences-media/${expectedStoragePath}`;
      expect(result.path).toEqual(expectedPublicUrl);
      
      await removeMediaSafely([result.path!], 'non-matching', draftId);
      expect(mockRemove).toHaveBeenCalledWith([expectedStoragePath]); 
    });
  });
});
