import { describe, it, expect } from 'vitest';
import { uuidFromString } from '../db';

describe('db helpers', () => {
  it('uuidFromString returns deterministic uuid-like string', async () => {
    const a = await uuidFromString('game_p1_1');
    const b = await uuidFromString('game_p1_1');
    const c = await uuidFromString('game_p1_2');

    expect(a).toBeDefined();
    expect(typeof a).toBe('string');
    expect(a).toMatch(/^[-0-9a-f]{36}$/i);
    expect(a).toBe(b);
    expect(a).not.toBe(c);
  });
});
