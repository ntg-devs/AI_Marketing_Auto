'use client';

import { useState } from 'react';
import {
  User,
  Mail,
  Shield,
  Users,
  Key,
  Lock,
  LogOut,
  Crown,
  Eye,
  EyeOff,
  Copy,
  Check,
  Clock,
  Smartphone,
  ShieldCheck,
  AlertTriangle,
  UserPlus,
  ChevronRight,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuthStore } from '@/store/useAuthStore';

/* ─── Types ────────────────────────────────────────────────────────── */

type SessionStatus = 'active' | 'expired';
type TeamRole = 'admin' | 'editor' | 'reviewer' | 'viewer';

interface Session {
  id: string;
  device: string;
  ip: string;
  location: string;
  lastActive: string;
  status: SessionStatus;
  isCurrent: boolean;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
  avatarInitials: string;
  status: 'online' | 'offline' | 'away';
  isApprover: boolean;
}

/* ─── Mock Data ────────────────────────────────────────────────────── */

const mockSessions: Session[] = [
  { id: '1', device: 'Chrome — Windows 11', ip: '192.168.1.***', location: 'Ho Chi Minh City, VN', lastActive: 'Now', status: 'active', isCurrent: true },
  { id: '2', device: 'Safari — iPhone 15', ip: '10.0.0.***', location: 'Ho Chi Minh City, VN', lastActive: '2 hours ago', status: 'active', isCurrent: false },
  { id: '3', device: 'Firefox — macOS', ip: '172.16.0.***', location: 'Hanoi, VN', lastActive: '3 days ago', status: 'expired', isCurrent: false },
];

const mockTeam: TeamMember[] = [
  { id: '1', name: 'Alex Nguyen', email: 'alex@aetherflow.io', role: 'admin', avatarInitials: 'AN', status: 'online', isApprover: true },
  { id: '2', name: 'Mai Tran', email: 'mai@aetherflow.io', role: 'editor', avatarInitials: 'MT', status: 'online', isApprover: true },
  { id: '3', name: 'David Le', email: 'david@aetherflow.io', role: 'reviewer', avatarInitials: 'DL', status: 'away', isApprover: true },
  { id: '4', name: 'Linh Pham', email: 'linh@aetherflow.io', role: 'viewer', avatarInitials: 'LP', status: 'offline', isApprover: false },
];

/* ─── Role Config ──────────────────────────────────────────────────── */

const roleConfig: Record<TeamRole, { label: string; color: string; bgColor: string }> = {
  admin: { label: 'Admin', color: 'text-amber-500', bgColor: 'bg-amber-500/10 border-amber-500/20' },
  editor: { label: 'Editor', color: 'text-primary', bgColor: 'bg-primary/10 border-primary/20' },
  reviewer: { label: 'Reviewer', color: 'text-emerald-500', bgColor: 'bg-emerald-500/10 border-emerald-500/20' },
  viewer: { label: 'Viewer', color: 'text-gray-400', bgColor: 'bg-surface-hover border-default' },
};

const statusDotColor: Record<TeamMember['status'], string> = {
  online: 'bg-emerald-400',
  away: 'bg-amber-400',
  offline: 'bg-gray-400',
};

/* ─── Component ────────────────────────────────────────────────────── */

export default function AccountTeamPanel() {
  const { user } = useAuthStore();
  const [showToken, setShowToken] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [copiedToken, setCopiedToken] = useState(false);

  const initials =
    user?.full_name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase() || 'AF';

  const handleCopyToken = () => {
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Panel Header */}
      <div className="px-5 py-4 border-b border-default shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/15 flex items-center justify-center">
            <Users className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-heading tracking-tight">
              Account & Team
            </h2>
            <p className="text-[10px] text-dim mt-0.5">
              Entity Management & Security
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="profile" className="flex-1 flex flex-col min-h-0">
        <div className="px-4 pt-3 shrink-0">
          <TabsList className="w-full bg-surface-hover h-8 rounded-lg p-0.5">
            <TabsTrigger
              value="profile"
              className="flex-1 text-[10px] h-full rounded-md data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-300 data-[state=active]:border-transparent text-dim"
            >
              <User className="w-3 h-3 mr-1" />
              Profile
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="flex-1 text-[10px] h-full rounded-md data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-300 data-[state=active]:border-transparent text-dim"
            >
              <Shield className="w-3 h-3 mr-1" />
              Security
            </TabsTrigger>
            <TabsTrigger
              value="team"
              className="flex-1 text-[10px] h-full rounded-md data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-300 data-[state=active]:border-transparent text-dim"
            >
              <Users className="w-3 h-3 mr-1" />
              Team
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ══════════ Tab 1: User Profile ══════════ */}
        <TabsContent value="profile" className="flex-1 min-h-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              {/* Avatar & Name */}
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-gradient-to-br from-primary to-purple-600 text-white text-sm font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-heading">
                    {user?.full_name || 'AetherFlow User'}
                  </p>
                  <p className="text-[10px] text-dim">
                    {user?.email || 'user@aetherflow.io'}
                  </p>
                  <Badge
                    variant="outline"
                    className="text-[8px] px-1.5 py-0 h-3.5 mt-1 bg-amber-500/10 border-amber-500/20 text-amber-500"
                  >
                    <Crown className="w-2 h-2 mr-0.5" />
                    {user?.role || 'Admin'}
                  </Badge>
                </div>
              </div>

              <Separator className="bg-border" />

              {/* Profile Fields */}
              <div className="space-y-3">
                <div className="rounded-lg border border-default bg-surface-hover p-3">
                  <label className="text-[9px] text-dim uppercase tracking-wider block mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    defaultValue={user?.full_name || 'AetherFlow User'}
                    className="w-full bg-transparent text-[11px] text-heading outline-none"
                  />
                </div>
                <div className="rounded-lg border border-default bg-surface-hover p-3">
                  <label className="text-[9px] text-dim uppercase tracking-wider block mb-1">
                    Email Address
                  </label>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3 h-3 text-dim" />
                    <input
                      type="email"
                      defaultValue={user?.email || 'user@aetherflow.io'}
                      className="flex-1 bg-transparent text-[11px] text-heading outline-none"
                    />
                  </div>
                </div>
                <div className="rounded-lg border border-default bg-surface-hover p-3">
                  <label className="text-[9px] text-dim uppercase tracking-wider block mb-1">
                    Role & Permissions
                  </label>
                  <div className="flex items-center gap-2">
                    <Key className="w-3 h-3 text-dim" />
                    <span className="text-[11px] text-body">
                      Admin — Full Access
                    </span>
                  </div>
                </div>
              </div>

              <Button className="w-full h-7 text-[10px] bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-500 border border-emerald-500/20">
                Save Changes
              </Button>
            </div>
          </ScrollArea>
        </TabsContent>

        {/* ══════════ Tab 2: Security Layer ══════════ */}
        <TabsContent value="security" className="flex-1 min-h-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              {/* JWT Token */}
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Key className="w-3 h-3 text-amber-500" />
                  <span className="text-[10px] font-medium text-label uppercase tracking-wider">
                    JWT Token
                  </span>
                </div>
                <div className="rounded-lg border border-default bg-surface-hover p-2.5">
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-[9px] text-label font-mono truncate">
                      {showToken
                        ? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOi...'
                        : '••••••••••••••••••••••••••••••••••••••'}
                    </code>
                    <button
                      onClick={() => setShowToken(!showToken)}
                      className="p-1 rounded hover:bg-surface-active text-dim transition-colors"
                    >
                      {showToken ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    </button>
                    <button
                      onClick={handleCopyToken}
                      className="p-1 rounded hover:bg-surface-active text-dim transition-colors"
                    >
                      {copiedToken ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-subtle">
                    <Clock className="w-2.5 h-2.5 text-faint" />
                    <span className="text-[9px] text-faint">Expires in 23h 45m</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 px-1.5 text-[9px] text-primary hover:text-primary hover:bg-surface-hover ml-auto"
                    >
                      <RefreshCw className="w-2.5 h-2.5 mr-0.5" />
                      Refresh
                    </Button>
                  </div>
                </div>
              </div>

              <Separator className="bg-border" />

              {/* 2FA */}
              <div className="flex items-center justify-between rounded-lg border border-default bg-surface-hover p-3">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-3.5 h-3.5 text-primary" />
                  <div>
                    <p className="text-[11px] font-medium text-heading">
                      Two-Factor Authentication
                    </p>
                    <p className="text-[9px] text-dim">
                      TOTP via Authenticator app
                    </p>
                  </div>
                </div>
                <Switch
                  checked={twoFactorEnabled}
                  onCheckedChange={setTwoFactorEnabled}
                  className="scale-75"
                />
              </div>

              <Separator className="bg-border" />

              {/* Active Sessions */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3 h-3 text-emerald-500" />
                    <span className="text-[10px] font-medium text-label uppercase tracking-wider">
                      Active Sessions
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 px-1.5 text-[9px] text-red-500 hover:text-red-400 hover:bg-red-500/10"
                  >
                    Revoke All
                  </Button>
                </div>
                <div className="space-y-1.5">
                  {mockSessions.map((session) => (
                    <div
                      key={session.id}
                      className={`rounded-lg border p-2.5 transition-colors ${
                        session.isCurrent
                          ? 'bg-emerald-500/[0.06] border-emerald-500/15'
                          : session.status === 'expired'
                          ? 'bg-surface-0 border-subtle opacity-50'
                          : 'bg-surface-hover border-default'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Smartphone className="w-3 h-3 text-dim" />
                          <span className="text-[10px] text-heading">
                            {session.device}
                          </span>
                          {session.isCurrent && (
                            <Badge
                              variant="outline"
                              className="text-[7px] px-1 py-0 h-3 bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                            >
                              Current
                            </Badge>
                          )}
                        </div>
                        {!session.isCurrent && session.status === 'active' && (
                          <button className="p-0.5 rounded hover:bg-red-500/10 text-faint hover:text-red-500 transition-colors">
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-[9px] text-faint">
                        <span>{session.ip}</span>
                        <span>•</span>
                        <span>{session.location}</span>
                        <span className="ml-auto">{session.lastActive}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>

        {/* ══════════ Tab 3: Team Collaboration ══════════ */}
        <TabsContent value="team" className="flex-1 min-h-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-3">
              {/* Team Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Users className="w-3 h-3 text-primary" />
                  <span className="text-[10px] font-medium text-label uppercase tracking-wider">
                    Human-in-the-Loop
                  </span>
                </div>
                <Badge
                  variant="outline"
                  className="text-[8px] px-1.5 py-0 h-3.5 border-default text-dim"
                >
                  {mockTeam.length} members
                </Badge>
              </div>

              {/* Team Members */}
              <div className="space-y-1.5">
                {mockTeam.map((member) => {
                  const role = roleConfig[member.role];
                  return (
                    <div
                      key={member.id}
                      className="rounded-lg border border-default bg-surface-hover p-3 hover:bg-surface-active transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="relative">
                          <Avatar className="h-7 w-7">
                            <AvatarFallback className="bg-surface-active text-body text-[9px] font-medium">
                              {member.avatarInitials}
                            </AvatarFallback>
                          </Avatar>
                          <span
                            className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border-2 border-surface-1 ${statusDotColor[member.status]}`}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-medium text-heading truncate">
                              {member.name}
                            </span>
                            <Badge
                              variant="outline"
                              className={`text-[7px] px-1 py-0 h-3 ${role.bgColor} ${role.color}`}
                            >
                              {role.label}
                            </Badge>
                          </div>
                          <p className="text-[9px] text-faint truncate">
                            {member.email}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          {member.isApprover && (
                            <Badge
                              variant="outline"
                              className="text-[7px] px-1 py-0 h-3 bg-primary/10 border-primary/20 text-primary"
                            >
                              Approver
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Approval Flow Info */}
              <div className="rounded-lg border border-primary/15 bg-primary/[0.04] p-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <ShieldCheck className="w-3 h-3 text-primary" />
                  <span className="text-[10px] font-medium text-primary">
                    Approval Workflow
                  </span>
                </div>
                <p className="text-[9px] text-dim leading-relaxed">
                  Content requires approval from at least{' '}
                  <span className="text-primary font-medium">1 reviewer</span>{' '}
                  before publishing. Admins can bypass this rule.
                </p>
              </div>

              <Button className="w-full h-7 text-[10px] bg-surface-hover hover:bg-surface-active text-label border border-default">
                <UserPlus className="w-3 h-3 mr-1" />
                Invite Team Member
              </Button>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
