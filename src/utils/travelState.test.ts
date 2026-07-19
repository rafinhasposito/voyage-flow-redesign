import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getTravelState, saveTravelState } from "./travelState";

describe("TravelState Persistence", () => {
  let store: Record<string, string> = {};

  beforeEach(() => {
    store = {};
    const mockLocalStorage = {
      getItem: vi.fn((key: string) => store[key] || null),
      setItem: vi.fn((key: string, value: string) => { store[key] = value.toString(); }),
      removeItem: vi.fn((key: string) => { delete store[key]; }),
      clear: vi.fn(() => { store = {}; }),
      length: 0,
      key: vi.fn(() => null),
    };
    global.localStorage = mockLocalStorage as any;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("deve persistir os novos campos do UserProfile no localStorage e recuperar corretamente", () => {
    const state = getTravelState();
    
    // Configurando novos campos
    state.profile.groupSize = 3;
    state.profile.hasChildren = true;
    state.profile.passengerAge = 25;
    state.profile.wheelchairRequired = false;
    
    // Salvando
    saveTravelState(state);
    
    // Recuperando via getTravelState simulando reload
    const loadedState = getTravelState();
    expect(loadedState.profile.groupSize).toBe(3);
    expect(loadedState.profile.hasChildren).toBe(true);
    expect(loadedState.profile.passengerAge).toBe(25);
    expect(loadedState.profile.wheelchairRequired).toBe(false);
  });
});
