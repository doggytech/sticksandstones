'use client';

import { useState } from 'react';
import { useGame } from '@/context/GameContext';
import { Button } from '@/components/ui/Button';

interface ScoreCardMenuProps {
  onClose: () => void;
}

export function ScoreCardMenu({ onClose }: ScoreCardMenuProps) {
  const { state, finishPlayer, completeRound } = useGame();
  const [showPlayerFinish, setShowPlayerFinish] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!state.round) return null;

  const activePlayers = state.round.players.filter(p => !p.hasFinished);
  // finishedPlayers not currently used; keep calculation commented for future use
  // const finishedPlayers = state.round.players.filter(p => p.hasFinished);
  const allPlayersFinished = activePlayers.length === 0;
  const isMultiplayer = state.round.gameMode === 'multiplayer';
  const roomCode = state.round.roomCode || '';

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

  const handleFinishPlayer = (playerId: string) => {
    if (confirm('Mark this player as finished? They will no longer be able to enter scores.')) {
      finishPlayer(playerId);
      setShowPlayerFinish(false);

      // Check if this was the last player
      const remainingPlayers = activePlayers.filter(p => p.id !== playerId);
      if (remainingPlayers.length === 0) {
        // All players finished, show completion message
        setTimeout(() => {
          onClose();
        }, 500);
      }
    }
  };

  const handleEndRound = () => {
    if (confirm('End the round for everyone? All players will be marked as finished.')) {
      completeRound();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
      <div className="bg-white dark:bg-gray-800 w-full sm:max-w-md sm:rounded-lg rounded-t-2xl max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Round Options</h2>
          <button
            onClick={onClose}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Room Code for Multiplayer */}
          {isMultiplayer && roomCode && (
            <div className="bg-gradient-to-br from-green-600 to-green-700 text-white rounded-lg p-4">
              <p className="text-xs mb-1 text-green-100">Room Code - Invite Players</p>
              <div className="text-3xl font-bold tracking-widest font-mono mb-3">
                {roomCode}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={copyRoomCode}
                  className="flex-1 bg-white/20 hover:bg-white/30 px-3 py-2 rounded text-sm font-medium transition-colors"
                >
                  {copied ? '✓ Copied!' : '📋 Copy Code'}
                </button>
                <button
                  onClick={handleShare}
                  className="flex-1 bg-white/20 hover:bg-white/30 px-3 py-2 rounded text-sm font-medium transition-colors"
                >
                  🔗 Share
                </button>
              </div>
            </div>
          )}

          {/* Player Status */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">Player Status</h3>
            <div className="space-y-2">
              {state.round.players.map(player => (
                <div
                  key={player.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: player.color }}
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {player.name}
                    </span>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      player.hasFinished
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                    }`}
                  >
                    {player.hasFinished ? '✓ Finished' : 'Playing'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Finish Player Section */}
          {activePlayers.length > 0 && (
            <div>
              {!showPlayerFinish ? (
                <Button
                  onClick={() => setShowPlayerFinish(true)}
                  variant="secondary"
                  className="w-full"
                >
                  Finish Player Round
                </Button>
              ) : (
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Select Player to Finish
                    </h3>
                    <button
                      onClick={() => setShowPlayerFinish(false)}
                      className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                  <div className="space-y-2">
                    {activePlayers.map(player => (
                      <button
                        key={player.id}
                        onClick={() => handleFinishPlayer(player.id)}
                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: player.color }}
                        />
                        <span className="font-medium text-gray-900 dark:text-white">
                          {player.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* End Round for Everyone */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              {allPlayersFinished
                ? 'All players have finished. The round is complete!'
                : 'End the round for all players immediately.'}
            </p>
            <Button
              onClick={handleEndRound}
              variant="secondary"
              className="w-full bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400"
            >
              End Round for Everyone
            </Button>
          </div>

          {/* Round Info */}
          <div className="text-xs text-gray-500 dark:text-gray-400 text-center pt-2">
            <p>{state.round.courseName}</p>
            <p className="mt-1">{new Date(state.round.date).toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
