'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import type { Player } from '@/lib/types-multiplayer';

interface WaitingRoomProps {
  roomCode: string;
  players: Player[];
  isHost: boolean;
  onStartGame: () => void;
  onCancel: () => void;
}

export function WaitingRoom({
  roomCode,
  players,
  isHost,
  onStartGame,
  onCancel,
}: WaitingRoomProps) {
  const [copied, setCopied] = useState(false);

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareMessage = `Join my golf game on Sticks and Stones!\n\nRoom Code: ${roomCode}\n\nOpen the app and enter this code to join.`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join my golf game',
          text: shareMessage,
        });
      } catch {
        // User cancelled or share failed, fallback to copy
        copyRoomCode();
      }
    } else {
      copyRoomCode();
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Waiting for Players</h2>
        <p className="text-gray-600 dark:text-gray-400">
          {isHost ? 'Share the code below to invite players' : 'Waiting for the host to start the game'}
        </p>
      </div>

      {/* Room Code Display */}
      <div className="bg-gradient-to-br from-green-600 to-green-700 text-white rounded-2xl p-6 text-center">
        <p className="text-sm mb-2 text-green-100">Room Code</p>
        <div className="text-5xl font-bold tracking-widest font-mono mb-4">
          {roomCode}
        </div>
        <div className="flex gap-2">
          <Button
            onClick={copyRoomCode}
            variant="secondary"
            className="flex-1 bg-white/20 hover:bg-white/30 text-white border-0"
          >
            {copied ? '✓ Copied!' : '📋 Copy Code'}
          </Button>
          <Button
            onClick={handleShare}
            variant="secondary"
            className="flex-1 bg-white/20 hover:bg-white/30 text-white border-0"
          >
            🔗 Share
          </Button>
        </div>
      </div>

      {/* Players List */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">
          Players ({players.length}/6)
        </h3>
        <div className="space-y-2">
          {players.map((player) => (
            <div
              key={player.id}
              className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: player.color }}
              />
              <span className="font-medium text-gray-900 dark:text-white flex-1">
                {player.name}
              </span>
              {player.playerNumber === 1 && (
                <span className="text-xs px-2 py-1 bg-green-600 text-white rounded">
                  Host
                </span>
              )}
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Player {player.playerNumber}
              </span>
            </div>
          ))}

          {/* Empty Slots */}
          {Array.from({ length: 6 - players.length }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="flex items-center gap-3 p-3 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg opacity-50"
            >
              <div className="w-4 h-4 rounded-full bg-gray-300 dark:bg-gray-600" />
              <span className="text-gray-400 dark:text-gray-500">
                Waiting for player...
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        {isHost ? (
          <>
            <Button
              onClick={onStartGame}
              disabled={players.length < 1}
              className="w-full"
              size="lg"
            >
              Start Game ({players.length} player{players.length !== 1 ? 's' : ''})
            </Button>
            <Button
              onClick={onCancel}
              variant="ghost"
              className="w-full"
            >
              Cancel Game
            </Button>
          </>
        ) : (
          <Button
            onClick={onCancel}
            variant="secondary"
            className="w-full"
          >
            Leave Game
          </Button>
        )}
      </div>

      {isHost && (
        <p className="text-xs text-center text-gray-500 dark:text-gray-400">
          Players can join at any time before the game starts
        </p>
      )}
    </div>
  );
}
