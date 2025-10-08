/**
 * Constants for the golf scoring app
 */

export const STANDARD_18_HOLES = Array.from({ length: 18 }, (_, i) => ({
  number: i + 1,
  par: i % 3 === 0 ? 5 : i % 3 === 1 ? 4 : 3, // Default pattern: 5,4,3,5,4,3...
  strokeIndex: i + 1,
}));

export const STANDARD_9_HOLES = STANDARD_18_HOLES.slice(0, 9);

export const MIN_PLAYERS = 1;
export const MAX_PLAYERS = 6;

export const MIN_STROKES = 1;
export const MAX_STROKES = 15; // Reasonable max per hole

export const PLAYER_COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
];

export const DEFAULT_COURSE_NAME = 'New Course';

export const STORAGE_KEY = 'sticks-and-stones-rounds';

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

