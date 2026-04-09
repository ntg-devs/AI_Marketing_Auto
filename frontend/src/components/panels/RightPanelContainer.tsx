'use client';

import { usePanelStore } from '@/store/usePanelStore';
import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet';
import SystemSettingsPanel from './SystemSettingsPanel';
import AccountTeamPanel from './AccountTeamPanel';
import NotificationCenterPanel from './NotificationCenterPanel';

export default function RightPanelContainer() {
  const { activePanel, closePanel } = usePanelStore();

  return (
    <Sheet open={activePanel !== null} onOpenChange={(open) => !open && closePanel()}>
      <SheetContent
        side="right"
        className="w-[380px] sm:max-w-[380px] p-0 bg-[#0c0c14] border-l border-white/[0.06] overflow-hidden"
      >
        {activePanel === 'settings' && <SystemSettingsPanel />}
        {activePanel === 'account' && <AccountTeamPanel />}
        {activePanel === 'notifications' && <NotificationCenterPanel />}
      </SheetContent>
    </Sheet>
  );
}
