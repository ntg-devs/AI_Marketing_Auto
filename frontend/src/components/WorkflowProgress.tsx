'use client';

import { CheckCircle2, Circle, Sparkles } from 'lucide-react';

const stages = [
  { id: 1, name: 'Intake', path: '/intake' },
  { id: 2, name: 'Research', path: '/research' },
  { id: 3, name: 'Production', path: '/production' },
  { id: 4, name: 'Approval', path: '/approval' },
  { id: 5, name: 'Distribution', path: '/distribution' },
  { id: 6, name: 'Optimization', path: '/optimization' },
];

interface WorkflowProgressProps {
  currentStage: number;
}

export function WorkflowProgress({ currentStage }: WorkflowProgressProps) {
  return (
    <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-400" />
            Workflow Progress
          </h3>
          <p className="text-sm text-slate-400 mt-1">
            Stage {currentStage} of 6
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl text-white">
            {Math.round((currentStage / 6) * 100)}%
          </div>
          <p className="text-xs text-slate-400">Complete</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden mb-8">
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-violet-500 to-purple-600 transition-all duration-500 rounded-full"
          style={{ width: `${(currentStage / 6) * 100}%` }}
        >
          <div className="absolute inset-0 bg-white/20 animate-pulse" />
        </div>
      </div>

      {/* Stages */}
      <div className="grid grid-cols-6 gap-3">
        {stages.map((stage) => (
          <div key={stage.id} className="flex flex-col items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                stage.id <= currentStage
                  ? 'bg-violet-500 border-violet-400 shadow-lg shadow-violet-500/50'
                  : 'bg-slate-800 border-slate-700'
              }`}
            >
              {stage.id <= currentStage ? (
                <CheckCircle2 className="w-5 h-5 text-white" />
              ) : (
                <Circle className="w-5 h-5 text-slate-500" />
              )}
            </div>
            <p
              className={`text-xs mt-2 text-center ${
                stage.id <= currentStage ? 'text-slate-200' : 'text-slate-500'
              }`}
            >
              {stage.name}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
