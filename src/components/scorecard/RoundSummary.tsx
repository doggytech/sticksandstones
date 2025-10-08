'use client';

import { useGame } from '@/context/GameContext';
import { calculatePlayerScore, formatVsPar } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

interface RoundSummaryProps {
  onNewRound: () => void;
}

export function RoundSummary({ onNewRound }: RoundSummaryProps) {
  const { state } = useGame();

  if (!state.round) return null;

  const { round } = state;
  const playerScores = round.players.map(player => ({
    player,
    score: calculatePlayerScore(player.id, round),
  }));

  // Sort by total score (lowest first)
  const sortedScores = [...playerScores].sort((a, b) => {
    if (a.score.total === null && b.score.total === null) return 0;
    if (a.score.total === null) return 1;
    if (b.score.total === null) return -1;
    return a.score.total - b.score.total;
  });

  const winner = sortedScores[0];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 w-full max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-br from-green-600 to-green-700 text-white p-6 rounded-t-2xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-2">🏆 Round Complete!</h2>
            <p className="text-green-100">{round.courseName}</p>
            <p className="text-sm text-green-200 mt-1">
              {new Date(round.date).toLocaleDateString()}
            </p>
          </div>

          {winner.score.total !== null && (
            <div className="mt-6 bg-white/10 backdrop-blur rounded-lg p-4 text-center">
              <p className="text-green-100 text-sm mb-1">Winner</p>
              <div className="flex items-center justify-center gap-2">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: winner.player.color }}
                />
                <p className="text-2xl font-bold">{winner.player.name}</p>
              </div>
              <p className="text-xl font-semibold mt-2">
                {winner.score.total} ({formatVsPar(winner.score.vsParTotal)})
              </p>
            </div>
          )}
        </div>

        {/* Leaderboard */}
        <div className="p-6">
          <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Final Scores</h3>
          <div className="space-y-3">
            {sortedScores.map((item, index) => (
              <div
                key={item.player.id}
                className={`border rounded-lg p-4 ${
                  index === 0 && item.score.total !== null
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-gray-400 dark:text-gray-600 w-8">
                      {index + 1}
                    </span>
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: item.player.color }}
                    />
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {item.player.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {item.score.thru} of {round.holes.length} holes
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {item.score.total ?? '-'}
                    </p>
                    <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                      {formatVsPar(item.score.vsParTotal)}
                    </p>
                  </div>
                </div>

                {/* Score breakdown */}
                {round.holes.length === 18 && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-around text-xs">
                    <div className="text-center">
                      <p className="text-gray-500 dark:text-gray-400">Front 9</p>
                      <p className="font-semibold text-gray-700 dark:text-gray-300">
                        {item.score.front9 ?? '-'} ({formatVsPar(item.score.vsParFront9)})
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-500 dark:text-gray-400">Back 9</p>
                      <p className="font-semibold text-gray-700 dark:text-gray-300">
                        {item.score.back9 ?? '-'} ({formatVsPar(item.score.vsParBack9)})
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="mt-6 space-y-3">
            <Button onClick={onNewRound} className="w-full" size="lg">
              Start New Round
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
