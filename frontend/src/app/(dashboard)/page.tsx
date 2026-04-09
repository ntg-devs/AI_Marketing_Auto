'use client';

import { SmartEntryModule } from '@/components/command-center/SmartEntryModule';
import { LiveResearchModule } from '@/components/command-center/LiveResearchModule';
import { MultiFormatEditorModule } from '@/components/command-center/MultiFormatEditorModule';
import { SmartSchedulerModule } from '@/components/command-center/SmartSchedulerModule';
import { FeedbackLoopModule } from '@/components/command-center/FeedbackLoopModule';

export default function CommandCenterPage() {
  return (
    <div className="flex flex-col h-full">
      {/* Main Grid: 4-column layout */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Module 1: Smart Entry & Context */}
        <div className="w-[260px] shrink-0 border-r border-white/[0.06] bg-[#0c0c14]/50 overflow-hidden">
          <SmartEntryModule />
        </div>

        {/* Module 2: Live Research Feed */}
        <div className="w-[260px] shrink-0 border-r border-white/[0.06] bg-[#0c0c14]/30 overflow-hidden">
          <LiveResearchModule />
        </div>

        {/* Module 3: Multi-Format Editor (takes remaining space) */}
        <div className="flex-1 min-w-0 overflow-hidden bg-[#0a0a0f]">
          <MultiFormatEditorModule />
        </div>

        {/* Module 4: Smart Scheduler & Distribution */}
        <div className="w-[280px] shrink-0 border-l border-white/[0.06] bg-[#0c0c14]/50 overflow-hidden">
          <SmartSchedulerModule />
        </div>
      </div>

      {/* Module 5: Feedback Loop (Bottom) */}
      <div className="h-[180px] shrink-0 border-t border-white/[0.06] bg-[#0c0c14]/30">
        <FeedbackLoopModule />
      </div>
    </div>
  );
}
