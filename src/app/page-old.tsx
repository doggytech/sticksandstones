'use client';

import { useState } from 'react';
import { useGame } from '@/context/GameContext';
import { SetupWizard } from '@/components/scorecard/SetupWizard';
import { ScoreCard } from '@/components/scorecard/ScoreCard';
import type { Player, Hole } from '@/lib/types';

export default function Home() {
  const { state, startNewRound, resetGame } = useGame();
  const [showSetup, setShowSetup] = useState(false);

  const handleStartNewRound = () => {
    setShowSetup(true);
  };

  const handleSetupComplete = (players: Player[], holes: Hole[], courseName: string) => {
    startNewRound(players, holes, courseName);
    setShowSetup(false);
  };

  const handleResetGame = () => {
    if (confirm('Are you sure you want to end this round? All data will be lost.')) {
      resetGame();
      setShowSetup(false);
    }
  };

  // Show scorecard if round is in progress and not in setup
  if (state.isSetupComplete && !showSetup) {
    return <ScoreCard />;
  }

  // Show setup wizard if user clicked start or is continuing setup
  if (showSetup) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 py-8">
        <SetupWizard onComplete={handleSetupComplete} />
      </div>
    );
  }

  // Show welcome screen
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <h1 className="text-4xl font-bold mb-4 text-green-600">
          🏌️ Sticks and Stones
        </h1>
        <p className="text-lg mb-8 text-gray-600 dark:text-gray-400">
          Golf Score Tracker
        </p>

        {!state.isSetupComplete ? (
          <div className="space-y-4">
            <button
              onClick={handleStartNewRound}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-6 rounded-lg text-lg transition-colors"
            >
              Start New Round
            </button>
            <p className="text-sm text-gray-500">
              Track scores for 1-6 players • 9 or 18 holes
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
              <p className="text-green-800 dark:text-green-300 font-semibold">
                Round in progress: {state.round?.courseName}
              </p>
              <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                {state.round?.players.length} player(s) • Hole {state.currentHole}
              </p>
            </div>
            <button
              onClick={handleResetGame}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              End Round
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

