'use client';

import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { NeuralBackground } from "@/components/NeuralBackground";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden font-sans">
      <NeuralBackground />
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        <TopBar />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
