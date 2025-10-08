'use client';

import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import type { GameState, Round, Player, Hole, ViewMode, DisplayMode, GameMode } from '@/lib/types-multiplayer';
import { updateScore as updateScoreUtil, createNewRound } from '@/lib/utils';
import { saveRound } from '@/lib/storage';
import { updateScoreRealtime } from '@/lib/multiplayer';

// Action types
type GameAction =
  | { type: 'START_NEW_ROUND'; payload: { players: Player[]; holes: Hole[]; courseName: string; gameMode?: GameMode } }
  | { type: 'LOAD_ROUND'; payload: Round }
  | { type: 'SYNC_ROUND_DATA'; payload: Round } // Sync without resetting navigation
  | { type: 'UPDATE_SCORE'; payload: { playerId: string; holeNumber: number; strokes: number | null } }
  | { type: 'SET_CURRENT_HOLE'; payload: number }
  | { type: 'SET_PLAYER_CURRENT_HOLE'; payload: { playerId: string; holeNumber: number } }
  | { type: 'SET_VIEW_MODE'; payload: ViewMode }
  | { type: 'SET_DISPLAY_MODE'; payload: DisplayMode }
  | { type: 'SET_GAME_MODE'; payload: GameMode }
  | { type: 'NEXT_HOLE' }
  | { type: 'NEXT_HOLE_FOR_PLAYER'; payload: string } // playerId
  | { type: 'PREVIOUS_HOLE' }
  | { type: 'PREVIOUS_HOLE_FOR_PLAYER'; payload: string } // playerId
  | { type: 'FINISH_PLAYER'; payload: string } // playerId
  | { type: 'COMPLETE_ROUND' }
  | { type: 'RESET_GAME' };

// Initial state
const initialState: GameState = {
  round: null,
  currentHole: 1,
  playerCurrentHoles: {},
  viewMode: '18-hole',
  displayMode: 'scores',
  isSetupComplete: false,
  gameMode: 'local',
};

// Reducer
function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_NEW_ROUND': {
      const { players, holes, courseName, gameMode = 'local' } = action.payload;
      const round = createNewRound(players, holes, courseName);

      // Initialize player current holes
      const playerCurrentHoles: Record<string, number> = {};
      players.forEach(player => {
        playerCurrentHoles[player.id] = 1;
      });

      return {
        ...state,
        round: { ...round, gameMode },
        currentHole: 1,
        playerCurrentHoles,
        isSetupComplete: true,
        gameMode,
        viewMode: holes.length === 9 ? '9-hole' : '18-hole',
      };
    }

    case 'LOAD_ROUND': {
      const round = action.payload;

      // Initialize player current holes
      const playerCurrentHoles: Record<string, number> = {};
      round.players.forEach(player => {
        playerCurrentHoles[player.id] = 1;
      });

      return {
        ...state,
        round,
        currentHole: 1,
        playerCurrentHoles,
        isSetupComplete: true,
        gameMode: round.gameMode || 'local',
        viewMode: round.holes.length === 9 ? '9-hole' : '18-hole',
      };
    }

    case 'SYNC_ROUND_DATA': {
      // Update round data without resetting navigation state
      const round = action.payload;

      // Preserve existing player current holes, but add new players at hole 1
      const updatedPlayerCurrentHoles = { ...state.playerCurrentHoles };
      round.players.forEach(player => {
        if (!(player.id in updatedPlayerCurrentHoles)) {
          updatedPlayerCurrentHoles[player.id] = 1;
        }
      });

      return {
        ...state,
        round,
        playerCurrentHoles: updatedPlayerCurrentHoles,
      };
    }

    case 'UPDATE_SCORE': {
      if (!state.round) return state;

      const { playerId, holeNumber, strokes } = action.payload;
      const updatedRound = updateScoreUtil(state.round, playerId, holeNumber, strokes);

      return {
        ...state,
        round: updatedRound,
      };
    }

    case 'SET_CURRENT_HOLE': {
      const maxHole = state.round?.holes.length ?? 18;
      const newHole = Math.max(1, Math.min(action.payload, maxHole));
      return {
        ...state,
        currentHole: newHole,
      };
    }

    case 'NEXT_HOLE': {
      const maxHole = state.round?.holes.length ?? 18;
      return {
        ...state,
        currentHole: Math.min(state.currentHole + 1, maxHole),
      };
    }

    case 'PREVIOUS_HOLE': {
      return {
        ...state,
        currentHole: Math.max(state.currentHole - 1, 1),
      };
    }

    case 'SET_PLAYER_CURRENT_HOLE': {
      const { playerId, holeNumber } = action.payload;
      const maxHole = state.round?.holes.length ?? 18;
      const newHole = Math.max(1, Math.min(holeNumber, maxHole));
      return {
        ...state,
        playerCurrentHoles: {
          ...state.playerCurrentHoles,
          [playerId]: newHole,
        },
      };
    }

    case 'NEXT_HOLE_FOR_PLAYER': {
      const playerId = action.payload;
      const maxHole = state.round?.holes.length ?? 18;
      const currentHole = state.playerCurrentHoles[playerId] ?? 1;
      return {
        ...state,
        playerCurrentHoles: {
          ...state.playerCurrentHoles,
          [playerId]: Math.min(currentHole + 1, maxHole),
        },
      };
    }

    case 'PREVIOUS_HOLE_FOR_PLAYER': {
      const playerId = action.payload;
      const currentHole = state.playerCurrentHoles[playerId] ?? 1;
      return {
        ...state,
        playerCurrentHoles: {
          ...state.playerCurrentHoles,
          [playerId]: Math.max(currentHole - 1, 1),
        },
      };
    }

    case 'SET_VIEW_MODE': {
      return {
        ...state,
        viewMode: action.payload,
      };
    }

    case 'SET_DISPLAY_MODE': {
      return {
        ...state,
        displayMode: action.payload,
      };
    }

    case 'SET_GAME_MODE': {
      return {
        ...state,
        gameMode: action.payload,
      };
    }

    case 'FINISH_PLAYER': {
      if (!state.round) return state;

      const updatedPlayers = state.round.players.map(player =>
        player.id === action.payload ? { ...player, hasFinished: true } : player
      );

      // Check if all players have finished
      const allFinished = updatedPlayers.every(p => p.hasFinished);

      return {
        ...state,
        round: {
          ...state.round,
          players: updatedPlayers,
          isComplete: allFinished,
          updatedAt: new Date().toISOString(),
        },
      };
    }

    case 'COMPLETE_ROUND': {
      if (!state.round) return state;

      return {
        ...state,
        round: {
          ...state.round,
          isComplete: true,
          updatedAt: new Date().toISOString(),
        },
      };
    }

    case 'RESET_GAME': {
      return initialState;
    }

    default:
      return state;
  }
}

// Context
interface GameContextValue {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  // Convenience methods
  startNewRound: (players: Player[], holes: Hole[], courseName: string, gameMode?: GameMode) => void;
  loadRound: (round: Round) => void;
  syncRoundData: (round: Round) => void;
  updateScore: (playerId: string, holeNumber: number, strokes: number | null) => void;
  setCurrentHole: (hole: number) => void;
  setPlayerCurrentHole: (playerId: string, holeNumber: number) => void;
  nextHole: () => void;
  nextHoleForPlayer: (playerId: string) => void;
  previousHole: () => void;
  previousHoleForPlayer: (playerId: string) => void;
  setViewMode: (mode: ViewMode) => void;
  setDisplayMode: (mode: DisplayMode) => void;
  setGameMode: (mode: GameMode) => void;
  finishPlayer: (playerId: string) => void;
  completeRound: () => void;
  resetGame: () => void;
}

const GameContext = createContext<GameContextValue | undefined>(undefined);

// Provider
export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  // Auto-save to localStorage when round changes
  useEffect(() => {
    if (state.round) {
      saveRound(state.round);
    }
  }, [state.round]);

  // Convenience methods - wrap in useCallback so consumers receive stable function refs
  const startNewRound = useCallback((players: Player[], holes: Hole[], courseName: string, gameMode?: GameMode) =>
    dispatch({ type: 'START_NEW_ROUND', payload: { players, holes, courseName, gameMode } }),
    [dispatch]
  );

  const loadRound = useCallback((round: Round) =>
    dispatch({ type: 'LOAD_ROUND', payload: round }),
    [dispatch]
  );

  const syncRoundData = useCallback((round: Round) =>
    dispatch({ type: 'SYNC_ROUND_DATA', payload: round }),
    [dispatch]
  );

  const updateScore = useCallback(async (playerId: string, holeNumber: number, strokes: number | null) => {
    // If multiplayer, ONLY sync to InstantDB and let real-time sync handle the update
    if (state.round?.gameMode === 'multiplayer' && state.round.id) {
      try {
        await updateScoreRealtime(state.round.id, playerId, holeNumber, strokes);
      } catch (error) {
        console.error('Failed to sync score to database:', error);
      }
    } else {
      // Local mode - update state directly
      dispatch({ type: 'UPDATE_SCORE', payload: { playerId, holeNumber, strokes } });
    }
  }, [dispatch, state.round]);

  const setCurrentHole = useCallback((hole: number) =>
    dispatch({ type: 'SET_CURRENT_HOLE', payload: hole }),
    [dispatch]
  );

  const setPlayerCurrentHole = useCallback((playerId: string, holeNumber: number) =>
    dispatch({ type: 'SET_PLAYER_CURRENT_HOLE', payload: { playerId, holeNumber } }),
    [dispatch]
  );

  const nextHole = useCallback(() => dispatch({ type: 'NEXT_HOLE' }), [dispatch]);
  const nextHoleForPlayer = useCallback((playerId: string) => dispatch({ type: 'NEXT_HOLE_FOR_PLAYER', payload: playerId }), [dispatch]);
  const previousHole = useCallback(() => dispatch({ type: 'PREVIOUS_HOLE' }), [dispatch]);
  const previousHoleForPlayer = useCallback((playerId: string) => dispatch({ type: 'PREVIOUS_HOLE_FOR_PLAYER', payload: playerId }), [dispatch]);
  const setViewMode = useCallback((mode: ViewMode) => dispatch({ type: 'SET_VIEW_MODE', payload: mode }), [dispatch]);
  const setDisplayMode = useCallback((mode: DisplayMode) => dispatch({ type: 'SET_DISPLAY_MODE', payload: mode }), [dispatch]);
  const setGameMode = useCallback((mode: GameMode) => dispatch({ type: 'SET_GAME_MODE', payload: mode }), [dispatch]);
  const finishPlayer = useCallback((playerId: string) => dispatch({ type: 'FINISH_PLAYER', payload: playerId }), [dispatch]);
  const completeRound = useCallback(() => dispatch({ type: 'COMPLETE_ROUND' }), [dispatch]);
  const resetGame = useCallback(() => dispatch({ type: 'RESET_GAME' }), [dispatch]);

  const contextValue: GameContextValue = useMemo(() => ({
    state,
    dispatch,
    startNewRound,
    loadRound,
    syncRoundData,
    updateScore,
    setCurrentHole,
    setPlayerCurrentHole,
    nextHole,
    nextHoleForPlayer,
    previousHole,
    previousHoleForPlayer,
    setViewMode,
    setDisplayMode,
    setGameMode,
    finishPlayer,
    completeRound,
    resetGame,
  }), [
    state,
    dispatch,
    startNewRound,
    loadRound,
    syncRoundData,
    updateScore,
    setCurrentHole,
    setPlayerCurrentHole,
    nextHole,
    nextHoleForPlayer,
    previousHole,
    previousHoleForPlayer,
    setViewMode,
    setDisplayMode,
    setGameMode,
    finishPlayer,
    completeRound,
    resetGame,
  ]);

  return (
    <GameContext.Provider value={contextValue}>
      {children}
    </GameContext.Provider>
  );
}

// Hook
export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
