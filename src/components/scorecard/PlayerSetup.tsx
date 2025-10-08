'use client';

import { useState } from 'react';
import type { Player } from '@/lib/types';
import { MIN_PLAYERS, MAX_PLAYERS, PLAYER_COLORS, generateId } from '@/lib/constants';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface PlayerSetupProps {
  onComplete: (players: Player[]) => void;
}

export function PlayerSetup({ onComplete }: PlayerSetupProps) {
  const [players, setPlayers] = useState<Player[]>([
    { id: generateId(), name: '', color: PLAYER_COLORS[0] },
  ]);

  const addPlayer = () => {
    if (players.length < MAX_PLAYERS) {
      setPlayers([
        ...players,
        {
          id: generateId(),
          name: '',
          color: PLAYER_COLORS[players.length % PLAYER_COLORS.length],
        },
      ]);
    }
  };

  const removePlayer = (id: string) => {
    if (players.length > MIN_PLAYERS) {
      setPlayers(players.filter(p => p.id !== id));
    }
  };

  const updatePlayerName = (id: string, name: string) => {
    setPlayers(players.map(p => (p.id === id ? { ...p, name } : p)));
  };

  const updatePlayerHandicap = (id: string, handicap: string) => {
    const value = handicap === '' ? undefined : parseInt(handicap, 10);
    setPlayers(players.map(p => (p.id === id ? { ...p, handicap: value } : p)));
  };

  const canContinue = players.every(p => p.name.trim().length > 0);

  const handleSubmit = () => {
    if (canContinue) {
      onComplete(players);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Add Players</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Add 1-6 players for this round
        </p>
      </div>

      <div className="space-y-4">
        {players.map((player, index) => (
          <div
            key={player.id}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-6 h-6 rounded-full"
                  style={{ backgroundColor: player.color }}
                />
                <span className="font-medium">Player {index + 1}</span>
              </div>
              {players.length > MIN_PLAYERS && (
                <button
                  onClick={() => removePlayer(player.id)}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  Remove
                </button>
              )}
            </div>

            <Input
              label="Name"
              placeholder="Enter player name"
              value={player.name}
              onChange={e => updatePlayerName(player.id, e.target.value)}
            />

            <Input
              label="Handicap (optional)"
              type="number"
              placeholder="0"
              min="0"
              max="54"
              value={player.handicap ?? ''}
              onChange={e => updatePlayerHandicap(player.id, e.target.value)}
            />
          </div>
        ))}
      </div>

      {players.length < MAX_PLAYERS && (
        <Button variant="secondary" onClick={addPlayer} className="w-full">
          + Add Another Player
        </Button>
      )}

      <Button
        onClick={handleSubmit}
        disabled={!canContinue}
        className="w-full"
        size="lg"
      >
        Continue
      </Button>
    </div>
  );
}
