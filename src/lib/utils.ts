import type { Round, Score, PlayerScore, HoleScore, Player, Hole } from './types';

/**
 * Calculate a player's total score and vs-par statistics
 */
export function calculatePlayerScore(
  playerId: string,
  round: Round
): PlayerScore {
  const playerScores = round.scores.filter(s => s.playerId === playerId);

  // Get front 9 (holes 1-9)
  const front9Scores = playerScores.filter(s => s.holeNumber >= 1 && s.holeNumber <= 9);
  const front9 = sumScores(front9Scores);
  const front9Par = sumPar(round.holes.filter(h => h.number >= 1 && h.number <= 9));

  // Get back 9 (holes 10-18)
  const back9Scores = playerScores.filter(s => s.holeNumber >= 10 && s.holeNumber <= 18);
  const back9 = sumScores(back9Scores);
  const back9Par = sumPar(round.holes.filter(h => h.number >= 10 && h.number <= 18));

  // Calculate totals
  const total = front9 !== null && back9 !== null ? front9 + back9 :
                front9 !== null ? front9 :
                back9 !== null ? back9 : null;

  const totalPar = front9Par + back9Par;

  // Holes completed
  const thru = playerScores.filter(s => s.strokes !== null).length;

  return {
    playerId,
    front9,
    back9,
    total,
    vsParFront9: front9 !== null ? front9 - front9Par : null,
    vsParBack9: back9 !== null ? back9 - back9Par : null,
    vsParTotal: total !== null ? total - totalPar : null,
    thru,
  };
}

/**
 * Sum scores, returning null if any are null
 */
function sumScores(scores: Score[]): number | null {
  if (scores.length === 0) return null;

  const strokes = scores.map(s => s.strokes);
  if (strokes.some(s => s === null)) return null;

  return strokes.reduce((sum, s) => (sum ?? 0) + ((s ?? 0) as number), 0);
}

/**
 * Sum par for holes
 */
function sumPar(holes: Hole[]): number {
  return holes.reduce((sum, h) => sum + h.par, 0);
}

/**
 * Get scores for a specific hole from all players
 */
export function getHoleScores(holeNumber: number, round: Round): HoleScore {
  const hole = round.holes.find(h => h.number === holeNumber);
  const par = hole?.par ?? 4;

  const scores = round.players.map(player => {
    const score = round.scores.find(
      s => s.playerId === player.id && s.holeNumber === holeNumber
    );
    return {
      playerId: player.id,
      strokes: score?.strokes ?? null,
    };
  });

  return {
    holeNumber,
    par,
    scores,
  };
}

/**
 * Update or add a score for a player on a specific hole
 */
export function updateScore(
  round: Round,
  playerId: string,
  holeNumber: number,
  strokes: number | null
): Round {
  const existingScoreIndex = round.scores.findIndex(
    s => s.playerId === playerId && s.holeNumber === holeNumber
  );

  const newScore: Score = { playerId, holeNumber, strokes };

  if (existingScoreIndex >= 0) {
    // Update existing score
    const newScores = [...round.scores];
    newScores[existingScoreIndex] = newScore;
    return { ...round, scores: newScores, updatedAt: new Date().toISOString() };
  } else {
    // Add new score
    return {
      ...round,
      scores: [...round.scores, newScore],
      updatedAt: new Date().toISOString(),
    };
  }
}

/**
 * Create a new round with players and holes
 */
export function createNewRound(
  players: Player[],
  holes: Hole[],
  courseName: string
): Round {
  const now = new Date().toISOString();

  return {
    id: generateId(),
    courseName,
    date: now,
    players,
    holes,
    scores: [],
    gameType: 'stroke-play',
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Format score vs par (e.g., "E", "+2", "-3")
 */
export function formatVsPar(vsPar: number | null): string {
  if (vsPar === null) return '-';
  if (vsPar === 0) return 'E';
  if (vsPar > 0) return `+${vsPar}`;
  return vsPar.toString();
}

/**
 * Get the visible holes based on view mode and current position
 */
export function getVisibleHoles(
  viewMode: '9-hole' | '18-hole',
  currentHole: number,
  totalHoles: number
): number[] {
  if (viewMode === '18-hole') {
    return Array.from({ length: Math.min(18, totalHoles) }, (_, i) => i + 1);
  }

  // For 9-hole view, show front 9 if on holes 1-9, otherwise back 9
  if (currentHole <= 9) {
    return Array.from({ length: Math.min(9, totalHoles) }, (_, i) => i + 1);
  } else {
    return Array.from({ length: Math.min(9, totalHoles - 9) }, (_, i) => i + 10);
  }
}
