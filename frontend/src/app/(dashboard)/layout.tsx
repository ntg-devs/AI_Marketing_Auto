'use client';

import CommandHeader from '@/components/command-center/CommandHeader';
import RightPanelContainer from '@/components/panels/RightPanelContainer';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden font-sans antialiased">
      <CommandHeader />
      <main className="flex-1 overflow-hidden">{children}</main>
      <RightPanelContainer />
    </div>
  );
}
