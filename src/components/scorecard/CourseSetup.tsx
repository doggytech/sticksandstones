'use client';

import { useState } from 'react';
import type { Hole } from '@/lib/types';
import { STANDARD_9_HOLES, STANDARD_18_HOLES } from '@/lib/constants';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface CourseSetupProps {
  onComplete: (holes: Hole[], courseName: string) => void;
  onBack: () => void;
}

export function CourseSetup({ onComplete, onBack }: CourseSetupProps) {
  const [holeCount, setHoleCount] = useState<9 | 18>(18);
  const [courseName, setCourseName] = useState('');
  const [customizePars, setCustomizePars] = useState(false);
  const [holes, setHoles] = useState<Hole[]>(STANDARD_18_HOLES);

  const handleHoleCountChange = (count: 9 | 18) => {
    setHoleCount(count);
    setHoles(count === 9 ? STANDARD_9_HOLES : STANDARD_18_HOLES);
  };

  const updateHolePar = (holeNumber: number, par: number) => {
    setHoles(holes.map(h => (h.number === holeNumber ? { ...h, par } : h)));
  };

  const handleSubmit = () => {
    const finalHoles = holes.slice(0, holeCount);
    onComplete(finalHoles, courseName.trim() || 'New Course');
  };

  const canContinue = true; // Always allow continuing with default pars

  return (
    <div className="space-y-6">
      <div>
        <button
          onClick={onBack}
          className="text-green-600 hover:text-green-700 mb-4 flex items-center gap-1"
        >
          ← Back
        </button>
        <h2 className="text-2xl font-bold mb-2">Course Setup</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Configure the course for this round
        </p>
      </div>

      <Input
        label="Course Name (optional)"
        placeholder="e.g., Pebble Beach"
        value={courseName}
        onChange={e => setCourseName(e.target.value)}
      />

      {/* Hole Count Selection */}
      <div>
        <label className="block text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">
          Number of Holes
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleHoleCountChange(9)}
            className={`py-4 px-6 rounded-lg border-2 font-semibold transition-all ${
              holeCount === 9
                ? 'border-green-600 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                : 'border-gray-300 dark:border-gray-600 hover:border-green-400'
            }`}
          >
            9 Holes
          </button>
          <button
            onClick={() => handleHoleCountChange(18)}
            className={`py-4 px-6 rounded-lg border-2 font-semibold transition-all ${
              holeCount === 18
                ? 'border-green-600 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                : 'border-gray-300 dark:border-gray-600 hover:border-green-400'
            }`}
          >
            18 Holes
          </button>
        </div>
      </div>

      {/* Customize Pars Toggle */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <label className="flex items-center justify-between cursor-pointer">
          <div>
            <span className="font-medium">Customize Par Values</span>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Use default pars or set custom values
            </p>
          </div>
          <input
            type="checkbox"
            checked={customizePars}
            onChange={e => setCustomizePars(e.target.checked)}
            className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
          />
        </label>
      </div>

      {/* Par Customization Grid */}
      {customizePars && (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h3 className="font-medium mb-3">Set Par for Each Hole</h3>
          <div className="grid grid-cols-3 gap-3 max-h-96 overflow-y-auto">
            {holes.slice(0, holeCount).map(hole => (
              <div key={hole.number} className="flex flex-col">
                <label className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                  Hole {hole.number}
                </label>
                <select
                  value={hole.par}
                  onChange={e => updateHolePar(hole.number, parseInt(e.target.value, 10))}
                  className="px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-center font-medium"
                >
                  <option value={3}>Par 3</option>
                  <option value={4}>Par 4</option>
                  <option value={5}>Par 5</option>
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-700 dark:text-gray-300">Total Par</span>
          <span className="text-2xl font-bold text-green-700 dark:text-green-400">
            {holes.slice(0, holeCount).reduce((sum, h) => sum + h.par, 0)}
          </span>
        </div>
      </div>

      <Button onClick={handleSubmit} disabled={!canContinue} className="w-full" size="lg">
        Start Round
      </Button>
    </div>
  );
}
