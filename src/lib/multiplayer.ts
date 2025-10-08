import { db, generateRoomCode, id, uuidFromString } from './db';
import type { Player, Hole, DBGame, DBPlayer, DBHole, DBScore } from './types-multiplayer';
import { PLAYER_COLORS } from './constants';

/**
 * Multiplayer game management utilities using InstantDB
 */

// Create a new multiplayer game
export async function createMultiplayerGame(
  hostName: string,
  hostId: string,
  courseName: string,
  holes: Hole[]
): Promise<{ gameId: string; roomCode: string }> {
  const gameId = id();
  const roomCode = generateRoomCode();
  const now = Date.now();

  // Create game
  const gameData = {
    id: gameId,
    roomCode,
    courseName,
    holeCount: holes.length,
    createdAt: now,
    createdBy: hostId,
    isComplete: false,
    isStarted: false,
  };

  // Create host as Player 1
  const hostPlayer = {
    id: hostId,
    gameId,
    name: hostName,
    color: PLAYER_COLORS[0],
    playerNumber: 1,
    hasFinished: false,
    joinedAt: now,
  };

  // Create holes
  const holeData = holes.map(hole => ({
    id: id(),
    gameId,
    number: hole.number,
    par: hole.par,
    strokeIndex: hole.strokeIndex,
  }));

  // Execute transaction
  await db.transact([
    db.tx.games[gameId].update(gameData),
    db.tx.players[hostId].update(hostPlayer),
    ...holeData.map(h => db.tx.holes[h.id].update(h)),
  ]);

  return { gameId, roomCode };
}

// Join an existing game by room code
export async function joinGameByCode(
  playerName: string,
  playerId: string,
  gameId: string,
  playerNumber: number
): Promise<{ gameId: string; playerNumber: number }> {
  if (playerNumber > 6) {
    throw new Error('Game is full (max 6 players)');
  }

  // Add player to game
  const newPlayer = {
    id: playerId,
    gameId: gameId,
    name: playerName,
    color: PLAYER_COLORS[(playerNumber - 1) % PLAYER_COLORS.length],
    playerNumber,
    hasFinished: false,
    joinedAt: Date.now(),
  };

  await db.transact([db.tx.players[playerId].update(newPlayer)]);

  return { gameId: gameId, playerNumber };
}

// Update a score in real-time
export async function updateScoreRealtime(
  gameId: string,
  playerId: string,
  holeNumber: number,
  strokes: number | null
): Promise<void> {
  const compositeKey = `${gameId}_${playerId}_${holeNumber}`;

  // Deterministic id derived from compositeKey so writes are idempotent
  const scoreId = await uuidFromString(compositeKey);

  const scoreData: Record<string, unknown> = {
    id: scoreId,
    gameId,
    playerId,
    holeNumber,
    updatedAt: Date.now(),
    compositeKey,
  };
  if (strokes !== null) scoreData.strokes = strokes;

  // Upsert by writing to the deterministic id (InstantDB will create or replace the entity)
  await db.transact([db.tx.scores[scoreId].update(scoreData)]);
}

// Mark player as finished
export async function finishPlayerRealtime(playerId: string): Promise<void> {
  await db.transact([
    db.tx.players[playerId].update({
      hasFinished: true,
    }),
  ]);
}

// Complete the entire game
export async function completeGameRealtime(gameId: string): Promise<void> {
  await db.transact([
    db.tx.games[gameId].update({
      isComplete: true,
    }),
  ]);
}

// Start the game (host only)
export async function startGameRealtime(gameId: string): Promise<void> {
  await db.transact([
    db.tx.games[gameId].update({
      isStarted: true,
    }),
  ]);
}

// Subscribe to game updates (React hook wrapper)
export function useGameData(gameId: string) {
  // Only query if we have a valid gameId
  const query = gameId && gameId.length > 0
    ? {
        games: {
          $: {
            where: { id: gameId },
          },
        },
        players: {
          $: {
            where: { gameId },
          },
        },
        holes: {
          $: {
            where: { gameId },
          },
        },
        scores: {
          $: {
            where: { gameId },
          },
        },
      }
    : null;

  return db.useQuery(query);
}

// Hook to find game by room code (games only, no players to avoid loops)
export function useFindGameByRoomCode(roomCode: string) {
  // Only query if we have a valid room code (6 characters)
  const query = roomCode && roomCode.length === 6
    ? {
        games: {
          $: {
            where: { roomCode, isComplete: false },
          },
        },
        players: {
          $: {
            where: {},
          },
        },
      }
    : null;

  return db.useQuery(query);
}

// Convert DB entities to app Round format
export function convertDBToRound(
  game: Record<string, unknown>, // InstantDB returns dynamic objects
  players: Array<Record<string, unknown>>,
  holes: Array<Record<string, unknown>>,
  scores: Array<Record<string, unknown>>
) {
  return {
    id: String(game.id || ''),
    courseName: String(game.courseName || 'Unknown Course'),
    date: new Date((game.createdAt as number) || Date.now()).toISOString(),
    players: players
      .sort((a, b) => ((a.playerNumber as number) || 0) - ((b.playerNumber as number) || 0))
      .map(p => ({
        id: String(p.id || ''),
        name: String(p.name || 'Player'),
        color: String(p.color || '#3b82f6'),
        handicap: p.handicap as number | undefined,
        hasFinished: Boolean(p.hasFinished || false),
        playerNumber: (p.playerNumber as number) || 1,
        joinedAt: (p.joinedAt as number) || Date.now(),
      })),
    holes: holes.sort((a, b) => ((a.number as number) || 0) - ((b.number as number) || 0)).map(h => ({
      number: (h.number as number) || 1,
      par: (h.par as number) || 4,
      strokeIndex: h.strokeIndex as number | undefined,
    })),
    scores: (() => {
      // Deduplicate scores by player+hole using compositeKey if present
      const latestByKey: Record<string, { playerId: string; holeNumber: number; strokes: number | null; updatedAt?: number }> = {};
      for (const s of scores) {
        const playerId = String(s.playerId || '');
        const holeNumber = (s.holeNumber as number) || 1;
        const strokes = (s.strokes as number | null) ?? null;
        const updatedAt = s.updatedAt as number | undefined;
        const composite = (s.compositeKey as string) || `${String(s.gameId || '')}_${playerId}_${holeNumber}`;

        const existing = latestByKey[composite];
        if (!existing || (updatedAt || 0) > (existing.updatedAt || 0)) {
          latestByKey[composite] = { playerId, holeNumber, strokes, updatedAt };
        }
      }

      return Object.values(latestByKey).map(s => ({
        playerId: s.playerId,
        holeNumber: s.holeNumber,
        strokes: s.strokes,
        updatedAt: s.updatedAt,
      }));
    })(),
    gameType: 'stroke-play' as const,
    createdAt: new Date((game.createdAt as number) || Date.now()).toISOString(),
    updatedAt: new Date().toISOString(),
    isComplete: Boolean(game.isComplete || false),
    gameMode: 'multiplayer' as const,
    roomCode: String(game.roomCode || ''),
    createdBy: String(game.createdBy || ''),
  };
}
