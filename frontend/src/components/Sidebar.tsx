'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sparkles,
  FileInput,
  Search,
  Cog,
  CheckCircle,
  Share2,
  TrendingUp,
  LayoutDashboard,
} from 'lucide-react';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard, stage: 0 },
  { path: '/intake', label: 'Intake', icon: FileInput, stage: 1 },
  { path: '/research', label: 'Research', icon: Search, stage: 2 },
  { path: '/product', label: 'Production', icon: Cog, stage: 3 },
  { path: '/approval', label: 'Approval', icon: CheckCircle, stage: 4 },
  { path: '/distribution', label: 'Distribution', icon: Share2, stage: 5 },
  { path: '/optimization', label: 'Optimization', icon: TrendingUp, stage: 6 },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-gradient-to-b from-slate-900 to-slate-950 border-r border-slate-800 flex flex-col h-screen">
      {/* Logo */}
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-white">AetherFlow</h1>
            <p className="text-xs text-slate-400">AI-Powered Platform</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = item.path === '/'
            ? pathname === '/'
            : pathname.startsWith(item.path);

          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group relative ${
                isActive
                  ? 'bg-violet-500/20 text-violet-300 shadow-lg shadow-violet-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-violet-500 rounded-r-full" />
              )}
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.stage > 0 && (
                <span className="text-xs bg-slate-800 px-2 py-0.5 rounded-full">
                  {item.stage}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* AI Assistant */}
      <div className="p-4 m-4 bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-violet-500/20 rounded-lg">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-violet-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4 text-violet-400" />
          </div>
          <div>
            <p className="text-sm text-slate-200 mb-1">AI Assistant</p>
            <p className="text-xs text-slate-400">
              Ready to help optimize your workflow
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}

