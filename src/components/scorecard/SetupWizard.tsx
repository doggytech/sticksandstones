'use client';

import { useState } from 'react';
import type { Player, Hole } from '@/lib/types';
import { PlayerSetup } from './PlayerSetup';
import { CourseSetup } from './CourseSetup';

interface SetupWizardProps {
  onComplete: (players: Player[], holes: Hole[], courseName: string) => void;
}

type Step = 'players' | 'course';

export function SetupWizard({ onComplete }: SetupWizardProps) {
  const [currentStep, setCurrentStep] = useState<Step>('players');
  const [players, setPlayers] = useState<Player[]>([]);

  const handlePlayersComplete = (completedPlayers: Player[]) => {
    setPlayers(completedPlayers);
    setCurrentStep('course');
  };

  const handleCourseComplete = (holes: Hole[], courseName: string) => {
    onComplete(players, holes, courseName);
  };

  const handleBack = () => {
    setCurrentStep('players');
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className={`text-sm font-medium ${currentStep === 'players' ? 'text-green-600' : 'text-gray-400'}`}>
            1. Players
          </span>
          <span className={`text-sm font-medium ${currentStep === 'course' ? 'text-green-600' : 'text-gray-400'}`}>
            2. Course
          </span>
        </div>
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-600 transition-all duration-300"
            style={{ width: currentStep === 'players' ? '50%' : '100%' }}
          />
        </div>
      </div>

      {/* Step Content */}
      {currentStep === 'players' && <PlayerSetup onComplete={handlePlayersComplete} />}
      {currentStep === 'course' && (
        <CourseSetup onComplete={handleCourseComplete} onBack={handleBack} />
      )}
    </div>
  );
}
