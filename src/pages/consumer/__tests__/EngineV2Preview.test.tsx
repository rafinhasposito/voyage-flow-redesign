/** @vitest-environment jsdom */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import EngineV2Preview from '../EngineV2Preview';
import { TripRepository } from '../../../repositories/TripRepository';
import { TripWalletRepository } from '../../../repositories/TripWalletRepository';
import { ExperienceRepository } from '../../../repositories/ExperienceRepository';
import { SchedulerV1 } from '../../../domain/itinerary-engine/schedulerV1';
import { InputHealthValidator } from '../../../domain/itinerary-engine/inputHealth';
import { MemoryRouter } from 'react-router-dom';

// Mock the react-router hooks
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ tripId: 'test-trip-id' }),
  };
});

// Stable mock user object — not recreated on each render (prevents useEffect loop)
const MOCK_AUTH_USER = { id: 'test-user-id', email: 'test@e2e.com' };
const MOCK_AUTH_SESSION = { access_token: 'mock-token' };

// Mock ConsumerAuthProvider to inject a stub user without Supabase
vi.mock('../../../contexts/ConsumerAuthProvider', () => ({
  useConsumerAuth: () => ({
    user: MOCK_AUTH_USER,
    session: MOCK_AUTH_SESSION,
    isLoading: false,
    signOut: vi.fn(),
  }),
  ConsumerAuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('EngineV2Preview Gate UI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock repositories and generation
    vi.spyOn(TripRepository, 'getTripById').mockResolvedValue({
      id: 'test-trip-id',
      updated_at: '2026-07-22T10:00:00Z',
      destination: 'dest-1'
    } as any);
    
    vi.spyOn(TripWalletRepository, 'getReservations').mockResolvedValue([]);
    vi.spyOn(ExperienceRepository, 'getByDestination').mockResolvedValue([]);
    
    vi.spyOn(InputHealthValidator, 'validate').mockReturnValue({
      critical: [],
      warnings: [],
      isReadyForIntegration: true,
      ready: true,
      confidence: 'high'
    } as any);
    
    // Mock Scheduler to return a valid draft with 1 warning and 1 overallWarning
    vi.spyOn(SchedulerV1, 'generate').mockResolvedValue({
      days: [
        {
          dayNumber: 1,
          date: '2026-10-10',
          activities: [],
          warnings: ['Basecamp sem GPS'] // 1 Warning
        }
      ],
      overallWarnings: ['Planejamento incompleto: Voo de partida ausente'], // 1 Overall Warning
      geoHealthIssues: [],
      geographicReadiness: 'PARTIAL',
      providerUsed: 'local_fallback',
      confidence: 'low'
    } as any);
    
    // Set development env
    import.meta.env.DEV = true;
  });

  it('proves the UI flow and guards against accidental writes', async () => {
    const applySpy = vi.spyOn(TripRepository, 'applyApprovedItineraryDraft').mockResolvedValue({ status: 'APPLIED', data: {} } as any);

    render(
      <MemoryRouter>
        <EngineV2Preview />
      </MemoryRouter>
    );

    // 1. Initial Load calls generatePreview (which calls Scheduler)
    await waitFor(() => {
      expect(SchedulerV1.generate).toHaveBeenCalled();
    });

    // 2. The state should be REVIEW_WITH_WARNINGS initially
    expect(screen.getByText('Pronto para revisão com ressalvas')).toBeTruthy();

    // The Apply button should not be called yet
    expect(applySpy).not.toHaveBeenCalled();

    // 3. Recalculate draft should NOT call apply
    const recalcBtn = screen.getByText('Recalcular Draft');
    fireEvent.click(recalcBtn);
    expect(applySpy).not.toHaveBeenCalled();
    
    // Wait for reload to finish
    await waitFor(() => {
      expect(screen.getByText('Pronto para revisão com ressalvas')).toBeTruthy();
    });

    // 4. Click "Revisar aplicação" should NOT call apply
    const reviewBtn = screen.getByText('Revisar aplicação');
    fireEvent.click(reviewBtn);
    
    // Modal opens
    await waitFor(() => {
      expect(screen.getByText('Resumo do Draft')).toBeTruthy();
    });
    expect(applySpy).not.toHaveBeenCalled();

    // 5. Final button should be disabled without acknowledgements
    const finalBtn = screen.getByText('Aprovar com ressalvas e aplicar ao Trip Space');
    expect(finalBtn).toHaveProperty('disabled', true);

    // 6. Check the warning checkboxes
    const warningCheckbox1 = screen.getByLabelText(/Estou ciente de que Basecamp sem GPS/i);
    fireEvent.click(warningCheckbox1);

    const warningCheckbox2 = screen.getByLabelText(/Estou ciente de que Planejamento incompleto: Voo de partida ausente/i);
    fireEvent.click(warningCheckbox2);
    
    const rollbackCheckbox = screen.getByLabelText(/Estou ciente de que esta aplicação de desenvolvimento não possui rollback persistente/i);
    fireEvent.click(rollbackCheckbox);

    // Now the button should be enabled
    expect(finalBtn).toHaveProperty('disabled', false);

    // 7. Click final button and prevent double mutation
    // We simulate a double click by calling click twice very fast
    fireEvent.click(finalBtn);
    fireEvent.click(finalBtn);

    await waitFor(() => {
      expect(applySpy).toHaveBeenCalledTimes(1);
    });

    // 8. Success returns APPLIED
    expect(screen.getByText('Roteiro persistido com sucesso!')).toBeTruthy();
    
    // 9. Already applied mock test
    applySpy.mockResolvedValueOnce({ status: 'ALREADY_APPLIED', data: {} } as any);
    applySpy.mockClear();
    
    // Re-open review and re-apply
    fireEvent.click(screen.getByText('Recalcular Draft'));
    await waitFor(() => {
      expect(screen.getByText('Pronto para revisão com ressalvas')).toBeTruthy();
    });
    
    fireEvent.click(screen.getByText('Revisar aplicação'));
    await waitFor(() => {
      expect(screen.getByText('Aprovar com ressalvas e aplicar ao Trip Space')).toBeTruthy();
    });
    
    fireEvent.click(screen.getByLabelText(/Estou ciente de que Basecamp sem GPS/i));
    fireEvent.click(screen.getByLabelText(/Estou ciente de que Planejamento incompleto: Voo de partida ausente/i));
    fireEvent.click(screen.getByLabelText(/Estou ciente de que esta aplicação de desenvolvimento não possui rollback persistente/i));
    
    fireEvent.click(screen.getByText('Aprovar com ressalvas e aplicar ao Trip Space'));
    
    await waitFor(() => {
      expect(screen.getByText(/Este exato draft já foi aplicado ao banco/i)).toBeTruthy();
      expect(applySpy).toHaveBeenCalledTimes(1);
    });
  });
});
