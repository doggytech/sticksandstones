/**
 * Core types for Sticks and Stones golf scoring app
 */

export type GameType = 'stroke-play' | 'match-play' | 'stableford' | 'skins';

export type ViewMode = '9-hole' | '18-hole';

export type DisplayMode = 'scores' | 'totals';

export interface Player {
  id: string;
  name: string;
  handicap?: number;
  color?: string; // For visual differentiation in multiplayer
  hasFinished?: boolean; // Track if player has completed their round
}

export interface Hole {
  number: number; // 1-18
  par: number; // Typically 3, 4, or 5
  strokeIndex?: number; // For handicap calculations (1-18, where 1 is hardest)
}

export interface Score {
  playerId: string;
  holeNumber: number;
  strokes: number | null; // null if not yet entered
}

export interface Round {
  id: string;
  courseName: string;
  date: string; // ISO date string
  players: Player[];
  holes: Hole[];
  scores: Score[];
  gameType: GameType;
  createdAt: string;
  updatedAt: string;
  isComplete?: boolean; // Track if all players have finished
}

// UI State
export interface GameState {
  round: Round | null;
  currentHole: number; // 1-18
  viewMode: ViewMode;
  displayMode: DisplayMode;
  isSetupComplete: boolean;
}

// Calculated values
export interface PlayerScore {
  playerId: string;
  front9: number | null; // Holes 1-9 total
  back9: number | null; // Holes 10-18 total
  total: number | null; // Full round total
  vsParFront9: number | null; // Score vs par for front 9
  vsParBack9: number | null; // Score vs par for back 9
  vsParTotal: number | null; // Total score vs par
  thru: number; // Number of holes completed
}

export interface HoleScore {
  holeNumber: number;
  par: number;
  scores: { playerId: string; strokes: number | null }[];
}
