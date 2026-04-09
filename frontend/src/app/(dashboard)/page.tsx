'use client';

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import SmartEntryModule from '@/components/command-center/SmartEntryModule';
import LiveResearchModule from '@/components/command-center/LiveResearchModule';
import MultiFormatEditorModule from '@/components/command-center/MultiFormatEditorModule';
import SmartSchedulerModule from '@/components/command-center/SmartSchedulerModule';
import FeedbackLoopModule from '@/components/command-center/FeedbackLoopModule';

export default function CommandCenterPage() {
  return (
    <div className="flex flex-col h-full bg-surface-0">
      {/* Main Grid: Resizable Panels */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel
            defaultSize="16%"
            minSize="12%"
            maxSize="25%"
            className="border-r border-default bg-surface-1 overflow-hidden"
          >
            <SmartEntryModule />
          </ResizablePanel>

          <ResizableHandle 
            withHandle 
            className="bg-surface-hover w-px hover:bg-primary/30 transition-all"
          />

          <ResizablePanel
            defaultSize="16%"
            minSize="12%"
            maxSize="25%"
            className="border-r border-default bg-surface-1 overflow-hidden"
          >
            <LiveResearchModule />
          </ResizablePanel>

          <ResizableHandle 
            withHandle 
            className="bg-surface-hover w-px hover:bg-primary/30 transition-all"
          />

          <ResizablePanel defaultSize="50%" minSize="30%" className="min-w-0 overflow-hidden bg-surface-0">
            <MultiFormatEditorModule />
          </ResizablePanel>

          <ResizableHandle 
            withHandle 
            className="bg-surface-hover w-px hover:bg-primary/30 transition-all"
          />

          {/* Module 4: Smart Scheduler & Distribution */}
          <ResizablePanel
            defaultSize="18%"
            minSize="15%"
            maxSize="30%"
            className="border-l border-default bg-surface-1 overflow-hidden"
          >
            <SmartSchedulerModule />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Module 5: Feedback Loop (Bottom) */}
      <div className="h-[180px] shrink-0 border-t border-default bg-surface-1">
        <FeedbackLoopModule />
      </div>
    </div>
  );
}
