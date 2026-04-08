'use client';

import { ChevronDown, Bell, Search, Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';

const projects = [
  { id: 1, name: 'Product Launch Campaign', status: 'active' },
  { id: 2, name: 'Brand Redesign 2026', status: 'active' },
  { id: 3, name: 'Q2 Marketing Strategy', status: 'archived' },
];

export function TopBar() {
  return (
    <header className="h-16 bg-slate-900/50 backdrop-blur-xl border-b border-slate-800 flex items-center justify-between px-6 sticky top-0 z-10">
      {/* Left Section - Project Switcher */}
      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-10 px-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700"
            >
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-slate-200">Product Launch Campaign</span>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-72 bg-slate-900 border-slate-800">
            <DropdownMenuLabel className="text-slate-400">
              Switch Project
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-slate-800" />
            {projects.map((project) => (
              <DropdownMenuItem
                key={project.id}
                className="flex items-center justify-between hover:bg-slate-800"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      project.status === 'active'
                        ? 'bg-emerald-500'
                        : 'bg-slate-600'
                    }`}
                  />
                  <span className="text-slate-200">{project.name}</span>
                </div>
                {project.status === 'active' && (
                  <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30">
                    Active
                  </Badge>
                )}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator className="bg-slate-800" />
            <DropdownMenuItem className="text-violet-400 hover:bg-slate-800">
              <Sparkles className="w-4 h-4 mr-2" />
              Create New Project
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Right Section - Search, Notifications, Profile */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <Button
          variant="ghost"
          className="h-10 px-4 bg-slate-800/30 hover:bg-slate-800 border border-slate-700 text-slate-400"
        >
          <Search className="w-4 h-4 mr-2" />
          <span className="text-sm">Search...</span>
          <kbd className="ml-8 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-slate-700 bg-slate-900 px-1.5 font-mono text-xs text-slate-400">
            ⌘K
          </kbd>
        </Button>

        {/* AI Insights Badge */}
        <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30 px-3 py-1.5">
          <Sparkles className="w-3 h-3 mr-1.5" />
          3 AI Insights
        </Badge>

        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="relative h-10 w-10 bg-slate-800/30 hover:bg-slate-800 border border-slate-700"
        >
          <Bell className="w-4 h-4 text-slate-400" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-violet-500 rounded-full" />
        </Button>

        {/* Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-10 px-2 bg-slate-800/30 hover:bg-slate-800 border border-slate-700"
            >
              <Avatar className="h-7 w-7 mr-2">
                <AvatarImage src="" />
                <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white text-xs">
                  JD
                </AvatarFallback>
              </Avatar>
              <span className="text-slate-200 text-sm">John Doe</span>
              <ChevronDown className="w-4 h-4 text-slate-400 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 bg-slate-900 border-slate-800">
            <DropdownMenuLabel className="text-slate-400">
              My Account
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-slate-800" />
            <DropdownMenuItem className="hover:bg-slate-800 text-slate-200">
              Profile Settings
            </DropdownMenuItem>
            <DropdownMenuItem className="hover:bg-slate-800 text-slate-200">
              Billing
            </DropdownMenuItem>
            <DropdownMenuItem className="hover:bg-slate-800 text-slate-200">
              Team Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-slate-800" />
            <DropdownMenuItem className="hover:bg-slate-800 text-red-400">
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
