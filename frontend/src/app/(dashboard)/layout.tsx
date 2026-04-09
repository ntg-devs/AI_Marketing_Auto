'use client';

import CommandHeader from '@/components/command-center/CommandHeader';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col h-screen bg-[#0a0a0f] overflow-hidden font-sans antialiased">
      <CommandHeader />
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
