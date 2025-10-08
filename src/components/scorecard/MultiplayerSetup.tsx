'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface MultiplayerSetupProps {
  onCreateGame: (hostName: string) => void;
  onJoinGame: (playerName: string, roomCode: string) => void;
  onBack: () => void;
}

type Mode = 'select' | 'create' | 'join';

export function MultiplayerSetup({ onCreateGame, onJoinGame, onBack }: MultiplayerSetupProps) {
  const [mode, setMode] = useState<Mode>('select');
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');

  const handleCreate = () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }
    onCreateGame(playerName.trim());
  };

  const handleJoin = () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!roomCode.trim() || roomCode.length !== 6) {
      setError('Please enter a valid 6-character room code');
      return;
    }
    onJoinGame(playerName.trim(), roomCode.toUpperCase());
  };

  const resetError = () => setError('');

  if (mode === 'select') {
    return (
      <div className="space-y-6">
        <div>
          <button
            onClick={onBack}
            className="text-green-600 hover:text-green-700 mb-4 flex items-center gap-1"
          >
            ← Back
          </button>
          <h2 className="text-2xl font-bold mb-2">Multiplayer Setup</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Create a new game or join an existing one
          </p>
        </div>

        <div className="space-y-3">
          <Button
            onClick={() => setMode('create')}
            className="w-full"
            size="lg"
          >
            Create New Game
          </Button>
          <Button
            onClick={() => setMode('join')}
            variant="secondary"
            className="w-full"
            size="lg"
          >
            Join Existing Game
          </Button>
        </div>
      </div>
    );
  }

  if (mode === 'create') {
    return (
      <div className="space-y-6">
        <div>
          <button
            onClick={() => {
              setMode('select');
              resetError();
            }}
            className="text-green-600 hover:text-green-700 mb-4 flex items-center gap-1"
          >
            ← Back
          </button>
          <h2 className="text-2xl font-bold mb-2">Create Game</h2>
          <p className="text-gray-600 dark:text-gray-400">
            You&apos;ll be Player 1 and can invite others with a room code
          </p>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            💡 After creating the game, you&apos;ll get a 6-character code to share with friends. They can enter this code to join your game!
          </p>
        </div>

        <Input
          label="Your Name"
          placeholder="Enter your name"
          value={playerName}
          onChange={e => {
            setPlayerName(e.target.value);
            resetError();
          }}
          error={error}
          maxLength={20}
        />

        <Button
          onClick={handleCreate}
          disabled={!playerName.trim()}
          className="w-full"
          size="lg"
        >
          Create Game & Continue
        </Button>
      </div>
    );
  }

  // Join mode
  return (
    <div className="space-y-6">
      <div>
        <button
          onClick={() => {
            setMode('select');
            resetError();
          }}
          className="text-green-600 hover:text-green-700 mb-4 flex items-center gap-1"
        >
          ← Back
        </button>
        <h2 className="text-2xl font-bold mb-2">Join Game</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Enter the room code shared by the game host
        </p>
      </div>

      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
        <p className="text-sm text-amber-800 dark:text-amber-300">
          🔑 Ask the game creator for the 6-character room code
        </p>
      </div>

      <Input
        label="Your Name"
        placeholder="Enter your name"
        value={playerName}
        onChange={e => {
          setPlayerName(e.target.value);
          resetError();
        }}
        maxLength={20}
      />

      <Input
        label="Room Code"
        placeholder="Enter 6-character code"
        value={roomCode}
        onChange={e => {
          const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
          setRoomCode(value);
          resetError();
        }}
        error={error}
        maxLength={6}
        className="text-center text-xl font-mono tracking-widest"
      />

      <Button
        onClick={handleJoin}
        disabled={!playerName.trim() || roomCode.length !== 6}
        className="w-full"
        size="lg"
      >
        Join Game
      </Button>
    </div>
  );
}
