'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { NeuralBackground } from './NeuralBackground';

interface AuthLayoutProps {
  children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      <NeuralBackground />
      
      {/* Logo */}
      <Link
        href="/"
        className="absolute top-8 left-8 flex items-center gap-3 group z-20"
      >
        <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-violet-500/30 group-hover:shadow-violet-500/50 transition-shadow">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="font-semibold text-white">AetherFlow</h1>
          <p className="text-xs text-slate-400">AI-Powered Platform</p>
        </div>
      </Link>

      {/* Main Content */}
      <div className="w-full max-w-md relative z-10">
        {children}
      </div>

      {/* Decorative elements */}
      <div className="absolute top-20 right-20 w-72 h-72 bg-violet-500/20 rounded-full blur-3xl opacity-20 animate-pulse" />
      <div className="absolute bottom-20 left-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }} />
    </div>
  );
}
