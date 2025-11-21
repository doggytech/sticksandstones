'use client';

import { useState } from 'react';
import { useGame } from '@/context/GameContext';
import { usePlayerAuth } from '@/context/PlayerAuthContext';
import { Button } from '@/components/ui/Button';
import ConfirmationModal from '@/components/ui/ConfirmationModal';

interface ScoreInputProps {
  holeNumber: number;
  onClose: () => void;
}

export function ScoreInput({ holeNumber, onClose }: ScoreInputProps) {
  const { state, updateScore, nextHole, nextHoleForPlayer, finishPlayer } = useGame();
  const { session } = usePlayerAuth();
  const [scores, setScores] = useState<{ [playerId: string]: number | null }>({});
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState('');

  if (!state.round) return null;

  const hole = state.round.holes.find(h => h.number === holeNumber);
  const par = hole?.par ?? 4;

  // Initialize scores from existing data
  if (Object.keys(scores).length === 0) {
    const initialScores: { [playerId: string]: number | null } = {};
    state.round.players.forEach(player => {
      const existingScore = state.round!.scores.find(
        s => s.playerId === player.id && s.holeNumber === holeNumber
      );
      initialScores[player.id] = existingScore?.strokes ?? null;
    });
    setScores(initialScores);
  }

  const handleScoreChange = (playerId: string, strokes: number | null) => {
    setScores(prev => ({ ...prev, [playerId]: strokes }));
  };

  const handleSave = async () => {
    // Save all scores
    for (const [playerId, strokes] of Object.entries(scores)) {
      await updateScore(playerId, holeNumber, strokes);
    }

    // If this is the final hole, show an in-app confirmation modal before marking finished
    if (state.round && holeNumber === state.round.holes.length) {
      const message = state.round.gameMode === 'multiplayer' && session?.playerId
        ? 'This will mark you as finished for the round. Continue?'
        : 'This will finish the round and mark all players as finished. Continue?';

      setConfirmMessage(message);
      setShowConfirm(true);
      return;
    }

    onClose();
  };

  const handleConfirmFinish = () => {
    if (!state.round) return;

    if (state.round.gameMode === 'multiplayer' && session?.playerId) {
      finishPlayer(session.playerId);
    } else {
      state.round.players.forEach(p => finishPlayer(p.id));
    }

    setShowConfirm(false);
    onClose();
  };

  const handleCancelFinish = () => {
    setShowConfirm(false);
    // keep modal open so user can continue editing scores
  };

  const handleSaveAndNext = async () => {
    if (!state.round) return;

    // Save all scores
    for (const [playerId, strokes] of Object.entries(scores)) {
      await updateScore(playerId, holeNumber, strokes);
    }

    // Move to next hole
    if (holeNumber < state.round.holes.length) {
      // In multiplayer, only advance current player's hole
      if (state.round.gameMode === 'multiplayer' && session?.playerId) {
        nextHoleForPlayer(session.playerId);
      } else {
        nextHole();
      }
    }

    onClose();
  };

  const quickScores = [par - 2, par - 1, par, par + 1, par + 2];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
      <div className="bg-white dark:bg-gray-800 w-full sm:max-w-lg sm:rounded-lg rounded-t-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Hole {holeNumber}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Par {par}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        {/* Player Scores */}
        <div className="p-4 space-y-4">
          {state.round.players
            .filter(player => {
              // In multiplayer, only show current player's input
              if (state.round!.gameMode === 'multiplayer' && session?.playerId) {
                return player.id === session.playerId;
              }
              // In local mode, show all players
              return true;
            })
            .map(player => (
            <div
              key={player.id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
            >
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: player.color }}
                />
                <span className="font-semibold">{player.name}</span>
              </div>

              {/* Quick Score Buttons */}
              <div className="grid grid-cols-5 gap-2 mb-3">
                {quickScores.map(score => {
                  const isSelected = scores[player.id] === score;
                  const label =
                    score === par - 2
                      ? 'Eagle'
                      : score === par - 1
                      ? 'Birdie'
                      : score === par
                      ? 'Par'
                      : score === par + 1
                      ? 'Bogey'
                      : 'Double';

                  let colorClass = '';
                  if (score === par - 2) colorClass = 'bg-yellow-100 dark:bg-yellow-900 border-yellow-400';
                  else if (score === par - 1) colorClass = 'bg-red-100 dark:bg-red-900 border-red-400';
                  else if (score === par) colorClass = 'bg-gray-100 dark:bg-gray-700 border-gray-400';
                  else if (score === par + 1) colorClass = 'bg-blue-100 dark:bg-blue-900 border-blue-400';
                  else colorClass = 'bg-blue-200 dark:bg-blue-800 border-blue-500';

                  return (
                    <button
                      key={score}
                      onClick={() => handleScoreChange(player.id, score)}
                      className={`py-3 rounded-lg border-2 font-semibold transition-all ${
                        isSelected
                          ? 'ring-2 ring-green-500 scale-105'
                          : 'hover:scale-105'
                      } ${colorClass}`}
                    >
                      <div className="text-lg">{score}</div>
                      <div className="text-[10px] text-gray-600 dark:text-gray-400">
                        {label}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Custom Score Input */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const current = scores[player.id] ?? par;
                    if (current > 1) handleScoreChange(player.id, current - 1);
                  }}
                  className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 font-bold"
                >
                  -
                </button>
                <input
                  type="number"
                  value={scores[player.id] ?? ''}
                  onChange={e => {
                    const value = e.target.value === '' ? null : parseInt(e.target.value, 10);
                    handleScoreChange(player.id, value);
                  }}
                  placeholder="Score"
                  className="flex-1 text-center py-2 px-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-green-500"
                  min="1"
                  max="15"
                />
                <button
                  onClick={() => {
                    const current = scores[player.id] ?? par;
                    if (current < 15) handleScoreChange(player.id, current + 1);
                  }}
                  className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 font-bold"
                >
                  +
                </button>
                {scores[player.id] !== null && (
                  <button
                    onClick={() => handleScoreChange(player.id, null)}
                    className="text-red-500 hover:text-red-700 text-sm px-2"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 space-y-2">
          {holeNumber < state.round.holes.length ? (
            <>
              <Button onClick={handleSaveAndNext} className="w-full" size="lg">
                Save & Next Hole
              </Button>
              <Button onClick={handleSave} variant="secondary" className="w-full" size="md">
                Save & Close
              </Button>
            </>
          ) : (
            <Button onClick={handleSave} className="w-full" size="lg">
              Save & Finish
            </Button>
          )}
        </div>
      </div>
        {/* Confirmation Modal for final-hole finish */}
        <ConfirmationModal
          open={showConfirm}
          title="Finish Round"
          message={confirmMessage}
          confirmLabel="Finish"
          cancelLabel="Cancel"
          onConfirm={handleConfirmFinish}
          onCancel={handleCancelFinish}
        />
    </div>
  );
}
