import type { Round } from './types';
import { STORAGE_KEY } from './constants';

/**
 * LocalStorage utilities for persisting golf rounds
 */

export function saveRound(round: Round): void {
  try {
    const rounds = getAllRounds();
    const existingIndex = rounds.findIndex(r => r.id === round.id);

    if (existingIndex >= 0) {
      rounds[existingIndex] = round;
    } else {
      rounds.push(round);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(rounds));
  } catch (error) {
    console.error('Failed to save round:', error);
  }
}

export function getAllRounds(): Round[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to load rounds:', error);
    return [];
  }
}

export function getRound(id: string): Round | null {
  const rounds = getAllRounds();
  return rounds.find(r => r.id === id) ?? null;
}

export function deleteRound(id: string): void {
  try {
    const rounds = getAllRounds();
    const filtered = rounds.filter(r => r.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to delete round:', error);
  }
}

export function clearAllRounds(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear rounds:', error);
  }
}
