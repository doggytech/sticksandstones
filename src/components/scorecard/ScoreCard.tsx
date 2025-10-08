'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGame } from '@/context/GameContext';
import { usePlayerAuth } from '@/context/PlayerAuthContext';
import { calculatePlayerScore, formatVsPar, getVisibleHoles } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { ScoreInput } from './ScoreInput';
import { ScoreCardMenu } from './ScoreCardMenu';
import { RoundSummary } from './RoundSummary';

interface ScoreCardProps {
  onNewRound?: () => void;
}

export function ScoreCard({ onNewRound }: ScoreCardProps) {
  const { state, setCurrentHole, setPlayerCurrentHole, nextHoleForPlayer, previousHoleForPlayer, setViewMode, setDisplayMode, resetGame } = useGame();
  const { session } = usePlayerAuth();
  const [showScoreInput, setShowScoreInput] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const router = useRouter();

  if (!state.round) return null;

  const { round, viewMode, displayMode, currentHole, playerCurrentHoles } = state;
  const visibleHoles = getVisibleHoles(viewMode, currentHole, round.holes.length);

  // Get current player's current hole
  const myCurrentHole = session?.playerId ? playerCurrentHoles[session.playerId] ?? 1 : currentHole;

  // Calculate player scores
  const playerScores = round.players.map(player => calculatePlayerScore(player.id, round));

  const handleScoreClick = (playerId: string, holeNumber: number) => {
    // In multiplayer, only allow editing own scores
    if (round.gameMode === 'multiplayer' && session && playerId !== session.playerId) {
      return;
    }

    // Don't allow score entry for finished players
    const player = round.players.find(p => p.id === playerId);
    if (player?.hasFinished) return;

    // Update player-specific current hole if in multiplayer
    if (round.gameMode === 'multiplayer' && session?.playerId) {
      setPlayerCurrentHole(session.playerId, holeNumber);
    } else {
      setCurrentHole(holeNumber);
    }
    setShowScoreInput(true);
  };

  const openScoreInput = () => {
    setShowScoreInput(true);
  };

  const closeScoreInput = () => {
    setShowScoreInput(false);
  };

  const localHandleNewRound = () => {
    // local fallback: reset context and navigate to root
    resetGame();
    // navigate back to root where SetupWizard / welcome flow is shown
    router.push('/');
  };

  // prefer parent's handler when provided (Home passes its handleNewRound)
  const handleNewRound = onNewRound ?? localHandleNewRound;

  // Show round summary if round is complete
  if (round.isComplete) {
    return <RoundSummary onNewRound={handleNewRound} />;
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-bold">{round.courseName}</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {round.players.length} player{round.players.length > 1 ? 's' : ''}
              {round.players.some(p => p.hasFinished) && (
                <span className="ml-2 text-green-600 dark:text-green-400">
                  • {round.players.filter(p => p.hasFinished).length} finished
                </span>
              )}
            </p>
          </div>
          <button
            onClick={() => setShowMenu(true)}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-2xl font-bold px-2"
          >
            ⋮
          </button>
        </div>

        {/* View Toggles */}
        <div className="flex gap-2">
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode('9-hole')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                viewMode === '9-hole'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              9 Holes
            </button>
            <button
              onClick={() => setViewMode('18-hole')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                viewMode === '18-hole'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              18 Holes
            </button>
          </div>

          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setDisplayMode('scores')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                displayMode === 'scores'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              Scores
            </button>
            <button
              onClick={() => setDisplayMode('totals')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                displayMode === 'totals'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              Totals
            </button>
          </div>
        </div>
      </div>

      {/* Scorecard Table */}
      <div className="flex-1 overflow-auto">
        <div className="min-w-full inline-block">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 bg-gray-100 dark:bg-gray-800 z-5">
              <tr>
                <th className="sticky left-0 bg-gray-100 dark:bg-gray-800 px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 border-b border-r border-gray-300 dark:border-gray-600 min-w-[120px]">
                  Player
                </th>
                {displayMode === 'scores' ? (
                  <>
                    {visibleHoles.map(holeNum => {
                      const hole = round.holes.find(h => h.number === holeNum);
                      return (
                        <th
                          key={holeNum}
                          className="px-3 py-2 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-300 dark:border-gray-600 min-w-[48px]"
                        >
                          <div>{holeNum}</div>
                          <div className="text-gray-500 dark:text-gray-400 text-[10px]">
                            Par {hole?.par ?? 4}
                          </div>
                        </th>
                      );
                    })}
                  </>
                ) : (
                  <>
                    {viewMode === '18-hole' && (
                      <>
                        <th className="px-4 py-2 text-center text-xs font-semibold border-b border-gray-300 dark:border-gray-600 min-w-[60px]">
                          Front 9
                        </th>
                        <th className="px-4 py-2 text-center text-xs font-semibold border-b border-gray-300 dark:border-gray-600 min-w-[60px]">
                          Back 9
                        </th>
                      </>
                    )}
                    <th className="px-4 py-2 text-center text-xs font-semibold border-b border-gray-300 dark:border-gray-600 min-w-[60px]">
                      Total
                    </th>
                    <th className="px-4 py-2 text-center text-xs font-semibold border-b border-gray-300 dark:border-gray-600 min-w-[60px]">
                      vs Par
                    </th>
                    <th className="px-4 py-2 text-center text-xs font-semibold border-b border-gray-300 dark:border-gray-600 min-w-[60px]">
                      Thru
                    </th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {round.players.map((player, playerIdx) => {
                const playerScore = playerScores[playerIdx];
                return (
                  <tr key={player.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="sticky left-0 bg-white dark:bg-gray-900 px-3 py-3 border-b border-r border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: player.color }}
                        />
                        <span className="font-medium text-sm truncate">{player.name}</span>
                        {player.hasFinished && (
                          <span className="text-xs text-green-600 dark:text-green-400 ml-1">✓</span>
                        )}
                      </div>
                    </td>
                    {displayMode === 'scores' ? (
                      <>
                        {visibleHoles.map(holeNum => {
                          const score = round.scores.find(
                            s => s.playerId === player.id && s.holeNumber === holeNum
                          );
                          const hole = round.holes.find(h => h.number === holeNum);
                          const strokes = score?.strokes;
                          const par = hole?.par ?? 4;

                          // Score coloring logic
                          let bgColor = '';
                          if (strokes !== null && strokes !== undefined) {
                            if (strokes === par - 2) bgColor = 'bg-yellow-200 dark:bg-yellow-900'; // Eagle
                            else if (strokes === par - 1) bgColor = 'bg-red-200 dark:bg-red-900'; // Birdie
                            else if (strokes === par + 1) bgColor = 'bg-blue-200 dark:bg-blue-900'; // Bogey
                            else if (strokes >= par + 2) bgColor = 'bg-blue-300 dark:bg-blue-800'; // Double+
                          }

                          // Check if this is the player's current hole
                          const isPlayerCurrentHole = playerCurrentHoles[player.id] === holeNum;

                          return (
                            <td
                              key={holeNum}
                              onClick={() => handleScoreClick(player.id, holeNum)}
                              className={`px-3 py-3 text-center border-b border-gray-200 dark:border-gray-700 ${
                                player.hasFinished ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                              } ${bgColor} ${
                                isPlayerCurrentHole ? 'ring-2 ring-inset' : ''
                              }`}
                              style={{
                                borderColor: isPlayerCurrentHole ? player.color : undefined,
                                boxShadow: isPlayerCurrentHole ? `inset 0 0 0 2px ${player.color}` : undefined,
                              }}
                            >
                              <span className="text-sm font-medium">
                                {strokes ?? '-'}
                              </span>
                            </td>
                          );
                        })}
                      </>
                    ) : (
                      <>
                        {viewMode === '18-hole' && (
                          <>
                            <td className="px-4 py-3 text-center border-b border-gray-200 dark:border-gray-700">
                              <div className="font-semibold">{playerScore.front9 ?? '-'}</div>
                              <div className="text-xs text-gray-500">
                                {formatVsPar(playerScore.vsParFront9)}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center border-b border-gray-200 dark:border-gray-700">
                              <div className="font-semibold">{playerScore.back9 ?? '-'}</div>
                              <div className="text-xs text-gray-500">
                                {formatVsPar(playerScore.vsParBack9)}
                              </div>
                            </td>
                          </>
                        )}
                        <td className="px-4 py-3 text-center border-b border-gray-200 dark:border-gray-700">
                          <div className="font-bold text-lg">{playerScore.total ?? '-'}</div>
                        </td>
                        <td className="px-4 py-3 text-center border-b border-gray-200 dark:border-gray-700">
                          <div className="font-semibold text-green-600 dark:text-green-400">
                            {formatVsPar(playerScore.vsParTotal)}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center border-b border-gray-200 dark:border-gray-700">
                          <div className="text-sm">{playerScore.thru}</div>
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Score Entry Footer (Mobile) */}
      {displayMode === 'scores' && (
        <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 sticky bottom-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Hole {myCurrentHole} • Par {round.holes.find(h => h.number === myCurrentHole)?.par ?? 4}
            </span>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (round.gameMode === 'multiplayer' && session?.playerId) {
                    previousHoleForPlayer(session.playerId);
                  } else {
                    setCurrentHole(Math.max(1, myCurrentHole - 1));
                  }
                }}
                disabled={myCurrentHole === 1}
              >
                ←
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (round.gameMode === 'multiplayer' && session?.playerId) {
                    nextHoleForPlayer(session.playerId);
                  } else {
                    setCurrentHole(Math.min(round.holes.length, myCurrentHole + 1));
                  }
                }}
                disabled={myCurrentHole === round.holes.length}
              >
                →
              </Button>
            </div>
          </div>
          <Button onClick={openScoreInput} className="w-full" size="lg">
            Enter Scores for Hole {myCurrentHole}
          </Button>
        </div>
      )}

      {/* Score Input Modal */}
      {showScoreInput && <ScoreInput holeNumber={myCurrentHole} onClose={closeScoreInput} />}

      {/* Menu Modal */}
      {showMenu && <ScoreCardMenu onClose={() => setShowMenu(false)} />}
    </div>
  );
}
