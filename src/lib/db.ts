import { init, id, i } from '@instantdb/react';

// Initialize InstantDB with your app ID
const APP_ID = process.env.INSTANT_DB_APP_ID || process.env.NEXT_PUBLIC_INSTANT_APP_ID || '';

// Define the schema for our golf scoring app (optional but provides type safety)
const schema = i.schema({
  entities: {
    games: i.entity({
      roomCode: i.string(),
      courseName: i.string(),
      holeCount: i.number(),
      createdAt: i.number(),
      createdBy: i.string(),
      isComplete: i.boolean(),
      isStarted: i.boolean(),
    }),
    players: i.entity({
      gameId: i.string(),
      name: i.string(),
      color: i.string(),
      handicap: i.number().optional(),
      playerNumber: i.number(),
      hasFinished: i.boolean(),
      joinedAt: i.number(),
    }),
    holes: i.entity({
      gameId: i.string(),
      number: i.number(),
      par: i.number(),
      strokeIndex: i.number().optional(),
    }),
    scores: i.entity({
      gameId: i.string(),
      playerId: i.string(),
      holeNumber: i.number(),
      compositeKey: i.string().optional(),
      strokes: i.number().optional(),
      updatedAt: i.number(),
    }),
  },
});

export const db = init({ appId: APP_ID, schema });

// Deterministic UUID v5-like generator from a string using SHA-1.
// Works in both browser (crypto.subtle) and Node (crypto.createHash).
export async function uuidFromString(value: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(value);

  let hashBuffer: ArrayBuffer;
  // Define minimal typed view of globalThis to safely access crypto.subtle
  type GlobalWithOptionalCrypto = typeof globalThis & { crypto?: { subtle?: { digest: (alg: string, data: BufferSource) => Promise<ArrayBuffer> } } };
  const g = globalThis as unknown as GlobalWithOptionalCrypto;

  if (typeof g.crypto?.subtle?.digest === 'function') {
    hashBuffer = await g.crypto.subtle.digest('SHA-1', data) as ArrayBuffer;
  } else {
    // Node fallback (create a Buffer then copy to ArrayBuffer)
    const { createHash } = await import('crypto');
  const digest: Buffer = createHash('sha1').update(Buffer.from(data)).digest();
  // Copy digest into a new Uint8Array so we get a plain ArrayBuffer (no SharedArrayBuffer)
  const tmp = Uint8Array.from(digest);
  const copied = tmp.slice(0, tmp.length);
  hashBuffer = copied.buffer;
  }

  const bytes = new Uint8Array(hashBuffer).slice(0, 16);

  // set RFC4122 version to 5
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  // set RFC4122 variant
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  const hex = Array.from(bytes).map(toHex).join('');
  return `${hex.substr(0, 8)}-${hex.substr(8, 4)}-${hex.substr(12, 4)}-${hex.substr(16, 4)}-${hex.substr(20, 12)}`;
}

// Helper to generate a unique 6-character room code
export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude ambiguous characters
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Helper to generate player ID (use InstantDB's id() for UUID)
export function generatePlayerId(): string {
  return id();
}

// Helper to generate IDs
export { id };
