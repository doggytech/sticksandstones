import { describe, it, expect } from 'vitest';
import {
  calculatePlayerScore,
  formatVsPar,
  getVisibleHoles,
  updateScore,
  createNewRound,
} from '../utils';

import type { Player, Hole } from '../types';

describe('utils', () => {
  const players: Player[] = [
    { id: 'p1', name: 'Alice' },
    { id: 'p2', name: 'Bob' },
  ];

  const holes: Hole[] = Array.from({ length: 18 }, (_, i) => ({ number: i + 1, par: 4 }));

  it('calculatePlayerScore returns nulls for empty scores', () => {
    const round = createNewRound(players, holes, 'Test Course');
    const score = calculatePlayerScore('p1', round);
    expect(score.total).toBeNull();
    expect(score.front9).toBeNull();
    expect(score.back9).toBeNull();
    expect(score.vsParTotal).toBeNull();
  });

  it('formatVsPar outputs expected strings', () => {
    expect(formatVsPar(null)).toBe('-');
    expect(formatVsPar(0)).toBe('E');
    expect(formatVsPar(2)).toBe('+2');
    expect(formatVsPar(-3)).toBe('-3');
  });

  it('getVisibleHoles works for 9 and 18 hole views', () => {
    expect(getVisibleHoles('18-hole', 1, 18).length).toBe(18);
    expect(getVisibleHoles('9-hole', 1, 18)).toEqual([1,2,3,4,5,6,7,8,9]);
    expect(getVisibleHoles('9-hole', 12, 18)).toEqual([10,11,12,13,14,15,16,17,18]);
  });

  it('updateScore adds and updates scores correctly', () => {
    let round = createNewRound(players, holes, 'Test Course');
    round = updateScore(round, 'p1', 1, 4);
    expect(round.scores.length).toBe(1);
    expect(round.scores[0].strokes).toBe(4);

    round = updateScore(round, 'p1', 1, 5);
    expect(round.scores.length).toBe(1);
    expect(round.scores[0].strokes).toBe(5);
  });
});
