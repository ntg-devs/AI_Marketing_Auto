'use client';

import { useEffect } from 'react';
import CommandHeader from '@/components/command-center/CommandHeader';
import RightPanelContainer from '@/components/panels/RightPanelContainer';
import CampaignHistoryOverlay from '@/components/campaign-history/CampaignHistoryOverlay';
import { useAuthStore } from '@/store/useAuthStore';
import { useUserPreferencesStore } from '@/store/useUserPreferencesStore';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = useAuthStore((s) => s.user);
  const { isLoaded, loadPreferences } = useUserPreferencesStore();

  // Auto-load user preferences from backend on mount
  useEffect(() => {
    if (user?.id && !isLoaded) {
      loadPreferences(user.id);
    }
  }, [user?.id, isLoaded, loadPreferences]);

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden font-sans antialiased">
      <CommandHeader />
      <main className="flex-1 overflow-hidden">{children}</main>
      <RightPanelContainer />
      <CampaignHistoryOverlay />
    </div>
  );
}
