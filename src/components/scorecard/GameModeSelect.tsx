'use client';

import { Button } from '@/components/ui/Button';

interface GameModeSelectProps {
  onSelectLocal: () => void;
  onSelectMultiplayer: () => void;
}

export function GameModeSelect({ onSelectLocal, onSelectMultiplayer }: GameModeSelectProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Choose Game Mode</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Play locally or invite friends to join online
        </p>
      </div>

      <div className="space-y-4">
        {/* Multiplayer Option */}
        <button
          onClick={onSelectMultiplayer}
          className="w-full border-2 border-green-600 bg-green-50 dark:bg-green-900/20 rounded-lg p-6 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors text-left"
        >
          <div className="flex items-start gap-4">
            <div className="text-4xl">🌐</div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Multiplayer
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Create a game and invite friends with a simple room code. Everyone tracks scores on their own device in real-time.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs px-2 py-1 bg-green-600 text-white rounded">
                  Real-time sync
                </span>
                <span className="text-xs px-2 py-1 bg-green-600 text-white rounded">
                  Easy sharing
                </span>
                <span className="text-xs px-2 py-1 bg-green-600 text-white rounded">
                  Everyone tracks scores
                </span>
              </div>
            </div>
          </div>
        </button>

        {/* Local Option */}
        <button
          onClick={onSelectLocal}
          className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg p-6 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
        >
          <div className="flex items-start gap-4">
            <div className="text-4xl">📱</div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Local Game
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Track scores for multiple players on this device only. Perfect for quick rounds or casual play.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                  Offline
                </span>
                <span className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                  Single device
                </span>
              </div>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
