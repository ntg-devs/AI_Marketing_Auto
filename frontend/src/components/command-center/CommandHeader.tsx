'use client';

import { ChevronDown, Settings, Bell, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuthStore } from '@/store/useAuthStore';

const campaigns = [
  { id: 1, name: 'Product Launch Q2', status: 'active' },
  { id: 2, name: 'Brand Awareness 2026', status: 'active' },
  { id: 3, name: 'SEO Content Sprint', status: 'draft' },
];

export default function CommandHeader() {
  const { user } = useAuthStore();
  const initials = user?.full_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase() || 'AF';

  return (
    <header className="h-12 border-b border-white/[0.06] flex items-center justify-between px-4 shrink-0 bg-[#0c0c14]/80 backdrop-blur-md">
      {/* Left: Logo + Campaign */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-indigo-400" />
          </div>
          <span className="text-sm font-semibold text-white/90 tracking-tight">AetherFlow</span>
        </div>

        <div className="w-px h-5 bg-white/[0.08]" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-7 px-2.5 text-xs bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] rounded-md text-slate-300"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5" />
              Product Launch Q2
              <ChevronDown className="w-3 h-3 ml-1 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 bg-[#16161f] border-white/[0.08]">
            {campaigns.map((c) => (
              <DropdownMenuItem
                key={c.id}
                className="text-xs text-slate-300 hover:bg-white/[0.06] focus:bg-white/[0.06]"
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full mr-2 ${
                    c.status === 'active' ? 'bg-emerald-400' : 'bg-slate-500'
                  }`}
                />
                {c.name}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator className="bg-white/[0.06]" />
            <DropdownMenuItem className="text-xs text-indigo-400 hover:bg-white/[0.06] focus:bg-white/[0.06]">
              + New Campaign
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-slate-400 hover:text-slate-200 hover:bg-white/[0.06]"
        >
          <Bell className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-slate-400 hover:text-slate-200 hover:bg-white/[0.06]"
        >
          <Settings className="w-3.5 h-3.5" />
        </Button>
        <Avatar className="h-6 w-6 cursor-pointer">
          <AvatarFallback className="bg-indigo-500/20 text-indigo-300 text-[10px] font-medium">
            {initials}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
