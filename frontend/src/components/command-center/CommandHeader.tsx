'use client';

import { ChevronDown, Settings, Bell, Sparkles, Sun, Moon, History } from 'lucide-react';
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
import { usePanelStore } from '@/store/usePanelStore';
import { useUIStore } from '@/store/useUIStore';
import { useCampaignHistoryStore } from '@/store/useCampaignHistoryStore';

const campaigns = [
  { id: 1, name: 'Product Launch Q2', status: 'active' },
  { id: 2, name: 'Brand Awareness 2026', status: 'active' },
  { id: 3, name: 'SEO Content Sprint', status: 'draft' },
];

export default function CommandHeader() {
  const { user } = useAuthStore();
  const { togglePanel, activePanel } = usePanelStore();
  const { theme, setTheme } = useUIStore();
  const { isOpen: isHistoryOpen, toggleHistory } = useCampaignHistoryStore();
  const initials = user?.full_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase() || 'AF';

  const isLight = theme === 'quite-light';

  return (
    <header className="h-12 border-b border-default flex items-center justify-between px-4 shrink-0 bg-surface-1">
      {/* Left: Logo + Campaign */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <span className="text-sm font-semibold text-heading tracking-tight">AetherFlow</span>
        </div>

        <div className="w-px h-5 bg-border" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-7 px-2.5 text-xs bg-surface-hover hover:bg-surface-active border border-default rounded-md text-body"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5" />
              Product Launch Q2
              <ChevronDown className="w-3 h-3 ml-1 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 bg-popover border-default">
            {campaigns.map((c) => (
              <DropdownMenuItem
                key={c.id}
                className="text-xs text-body hover:bg-surface-hover focus:bg-surface-hover"
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full mr-2 ${
                    c.status === 'active' ? 'bg-emerald-400' : 'bg-gray-400'
                  }`}
                />
                {c.name}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem className="text-xs text-primary hover:bg-surface-hover focus:bg-surface-hover">
              + New Campaign
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="ghost"
          size="icon"
          onClick={toggleHistory}
          className={` transition-colors px-2 py-1 ${
            isHistoryOpen
              ? 'bg-primary/15 text-primary'
              : 'text-dim hover:text-heading hover:bg-surface-hover'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          History
        </Button>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1.5">
        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(isLight ? 'dark' : 'quite-light')}
          className="h-7 w-7 text-dim hover:text-heading hover:bg-surface-hover"
        >
          {isLight ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
        </Button>

        {/* Notification Bell */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => togglePanel('notifications')}
          className={`relative h-7 w-7 transition-colors ${
            activePanel === 'notifications'
              ? 'bg-amber-500/15 text-amber-500'
              : 'text-dim hover:text-heading hover:bg-surface-hover'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full" />
        </Button>

        {/* Settings Gear */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => togglePanel('settings')}
          className={`h-7 w-7 transition-colors ${
            activePanel === 'settings'
              ? 'bg-primary/15 text-primary'
              : 'text-dim hover:text-heading hover:bg-surface-hover'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
        </Button>

        {/* Avatar — Account & Team */}
        <button
          onClick={() => togglePanel('account')}
          className={`rounded-full transition-all ${
            activePanel === 'account'
              ? 'ring-2 ring-primary/40 ring-offset-1 ring-offset-background'
              : ''
          }`}
        >
          <Avatar className="h-6 w-6 cursor-pointer">
            <AvatarFallback className="bg-primary/20 text-primary text-[10px] font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
        </button>
      </div>
    </header>
  );
}
