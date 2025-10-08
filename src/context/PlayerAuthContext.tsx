'use client';

import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { MultiplayerSession } from '@/lib/types-multiplayer';
import { generatePlayerId } from '@/lib/db';

interface PlayerAuthContextValue {
  session: MultiplayerSession | null;
  setPlayerName: (name: string, gameId: string, isHost: boolean) => void;
  clearSession: () => void;
  isAuthenticated: boolean;
}

const PlayerAuthContext = createContext<PlayerAuthContextValue | undefined>(undefined);

const SESSION_STORAGE_KEY = 'sticks-and-stones-player-session';

export function PlayerAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<MultiplayerSession | null>(null);

  // Load session from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SESSION_STORAGE_KEY);
      if (stored) {
        setSession(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load player session:', error);
    }
  }, []);

  // Save session to localStorage whenever it changes
  useEffect(() => {
    if (session) {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }, [session]);

  const setPlayerName = (name: string, gameId: string, isHost: boolean) => {
    const playerId = generatePlayerId();
    const newSession: MultiplayerSession = {
      playerId,
      playerName: name,
      gameId,
      isHost,
    };
    setSession(newSession);
  };

  const clearSession = () => {
    setSession(null);
  };

  const value: PlayerAuthContextValue = {
    session,
    setPlayerName,
    clearSession,
    isAuthenticated: session !== null,
  };

  return (
    <PlayerAuthContext.Provider value={value}>
      {children}
    </PlayerAuthContext.Provider>
  );
}

export function usePlayerAuth() {
  const context = useContext(PlayerAuthContext);
  if (context === undefined) {
    throw new Error('usePlayerAuth must be used within a PlayerAuthProvider');
  }
  return context;
}
