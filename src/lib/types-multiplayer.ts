/**
 * Extended types for multiplayer golf scoring with InstantDB
 */

// Previous types remain the same
export type GameType = 'stroke-play' | 'match-play' | 'stableford' | 'skins';
export type ViewMode = '9-hole' | '18-hole';
export type DisplayMode = 'scores' | 'totals';

// Game mode: local (offline) or multiplayer (realtime)
export type GameMode = 'local' | 'multiplayer';

export interface Player {
  id: string;
  name: string;
  handicap?: number;
  color?: string;
  hasFinished?: boolean;
  playerNumber?: number; // 1-6, with 1 being the game creator
  joinedAt?: number; // Timestamp when player joined
}

export interface Hole {
  number: number;
  par: number;
  strokeIndex?: number;
}

export interface Score {
  playerId: string;
  holeNumber: number;
  strokes: number | null;
  updatedAt?: number; // For conflict resolution
}

export interface Round {
  id: string;
  courseName: string;
  date: string;
  players: Player[];
  holes: Hole[];
  scores: Score[];
  gameType: GameType;
  createdAt: string;
  updatedAt: string;
  isComplete?: boolean;
  // Multiplayer fields
  gameMode?: GameMode;
  roomCode?: string; // 6-character code for joining
  createdBy?: string; // Player 1's ID
}

// UI State
export interface GameState {
  round: Round | null;
  currentHole: number; // Fallback for local mode
  playerCurrentHoles: Record<string, number>; // Per-player current hole for multiplayer
  viewMode: ViewMode;
  displayMode: DisplayMode;
  isSetupComplete: boolean;
  gameMode: GameMode; // Track if local or multiplayer
}

// Multiplayer session
export interface MultiplayerSession {
  playerId: string; // Current user's player ID
  playerName: string; // Current user's name
  gameId: string; // The game/room they're in
  isHost: boolean; // Whether this player created the game
}

// Calculated values
export interface PlayerScore {
  playerId: string;
  front9: number | null;
  back9: number | null;
  total: number | null;
  vsParFront9: number | null;
  vsParBack9: number | null;
  vsParTotal: number | null;
  thru: number;
}

export interface HoleScore {
  holeNumber: number;
  par: number;
  scores: { playerId: string; strokes: number | null }[];
}

// InstantDB entity types (matching our schema)
export interface DBGame {
  id: string;
  roomCode: string;
  courseName: string;
  holeCount: number;
  createdAt: number;
  createdBy: string;
  isComplete: boolean;
  isStarted: boolean;
}

export interface DBPlayer {
  id: string;
  gameId: string;
  name: string;
  color: string;
  handicap?: number;
  playerNumber: number;
  hasFinished: boolean;
  joinedAt: number;
}

export interface DBHole {
  id: string;
  gameId: string;
  number: number;
  par: number;
  strokeIndex?: number;
}

export interface DBScore {
  id: string;
  gameId: string;
  playerId: string;
  holeNumber: number;
  strokes: number | null;
  updatedAt: number;
}
