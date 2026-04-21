import { useEffect, useState } from 'react';
import {
  User as UserIcon,
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
import { authApi } from '@/api/auth';
import { gooeyToast } from 'goey-toast';
import { useTranslation } from '@/lib/i18n';

/* ─── Types ────────────────────────────────────────────────────────── */

type SessionStatus = 'active' | 'expired';
type TeamRole = 'admin' | 'editor' | 'reviewer' | 'viewer' | 'owner' | 'user';

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
  full_name: string;
  email: string;
  role: string | TeamRole;
  avatar_url?: string;
  status?: 'online' | 'offline' | 'away';
}

/* ─── Mock Data (Sessions only for now) ──────────────────────────────── */

const mockSessions: Session[] = [
  { id: '1', device: 'Chrome — Windows 11', ip: '192.168.1.***', location: 'Ho Chi Minh City, VN', lastActive: 'Now', status: 'active', isCurrent: true },
];

/* ─── Role Config ──────────────────────────────────────────────────── */

const roleConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  admin: { label: 'Admin', color: 'text-amber-500', bgColor: 'bg-amber-500/10 border-amber-500/20' },
  owner: { label: 'Owner', color: 'text-amber-500', bgColor: 'bg-amber-500/10 border-amber-500/20' },
  editor: { label: 'Editor', color: 'text-primary', bgColor: 'bg-primary/10 border-primary/20' },
  reviewer: { label: 'Reviewer', color: 'text-emerald-500', bgColor: 'bg-emerald-500/10 border-emerald-500/20' },
  viewer: { label: 'Viewer', color: 'text-gray-400', bgColor: 'bg-surface-hover border-default' },
  user: { label: 'User', color: 'text-gray-400', bgColor: 'bg-surface-hover border-default' },
};

/* ─── Component ────────────────────────────────────────────────────── */

export default function AccountTeamPanel() {
  const { user, token, logout, updateUser } = useAuthStore();
  const { t } = useTranslation();
  const [showToken, setShowToken] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fullName, setFullName] = useState(user?.full_name || '');

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const members = await authApi.getTeamMembers();
        setTeamMembers(members);
      } catch (err) {
        console.error('Failed to fetch team members');
      }
    };
    if (user) fetchTeam();
  }, [user]);

  const handleSaveProfile = async () => {
    setIsLoading(true);
    try {
      await authApi.updateProfile({ full_name: fullName });
      updateUser({ full_name: fullName });
      gooeyToast.success('Cập nhật hồ sơ thành công');
    } catch (err) {
      gooeyToast.error('Không thể cập nhật hồ sơ');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyToken = () => {
    if (token) {
      navigator.clipboard.writeText(token);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  const initials =
    fullName
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase() || 'AF';

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
              {t('account_team.title')}
            </h2>
            <p className="text-[10px] text-dim mt-0.5">
              {t('account_team.subtitle')}
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
              <UserIcon className="w-3 h-3 mr-1" />
              {t('account_team.tabs.profile')}
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="flex-1 text-[10px] h-full rounded-md data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-300 data-[state=active]:border-transparent text-dim"
            >
              <Shield className="w-3 h-3 mr-1" />
              {t('account_team.tabs.security')}
            </TabsTrigger>
            <TabsTrigger
              value="team"
              className="flex-1 text-[10px] h-full rounded-md data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-300 data-[state=active]:border-transparent text-dim"
            >
              <Users className="w-3 h-3 mr-1" />
              {t('account_team.tabs.team')}
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
                    {fullName || 'AetherFlow User'}
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
                    {t('account_team.profile.full_name')}
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-transparent text-[11px] text-heading outline-none"
                  />
                </div>
                <div className="rounded-lg border border-default bg-surface-hover p-3">
                  <label className="text-[9px] text-dim uppercase tracking-wider block mb-1">
                    {t('account_team.profile.email')}
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
                    {t('account_team.profile.role')}
                  </label>
                  <div className="flex items-center gap-2">
                    <Key className="w-3 h-3 text-dim" />
                    <span className="text-[11px] text-body">
                      Admin — Full Access
                    </span>
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleSaveProfile}
                disabled={isLoading}
                className="w-full h-7 text-[10px] bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-500 border border-emerald-500/20"
              >
                {isLoading ? 'Saving...' : t('account_team.profile.save')}
              </Button>
              <Button 
                onClick={() => {
                  logout();
                  window.location.href = '/login';
                }}
                className="w-full h-7 text-[10px] bg-red-500/15 hover:bg-red-500/25 text-red-500 border border-red-500/20"
              >
                {t('account_team.profile.logout')}
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
                    {t('account_team.security.jwt_title')}
                  </span>
                </div>
                <div className="rounded-lg border border-default bg-surface-hover p-2.5">
                  <div className="flex items-start gap-2 min-w-0">
                    <code className={`flex-1 text-[9px] text-label font-mono ${showToken ? 'break-all whitespace-pre-wrap max-h-[100px] overflow-y-auto custom-scrollbar' : 'truncate'}`}>
                      {showToken
                        ? token
                        : '••••••••••••••••••••••••••••••••••••••'}
                    </code>
                    <div className="flex items-center gap-1 shrink-0">
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
                  </div>
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-subtle">
                    <Clock className="w-2.5 h-2.5 text-faint" />
                    <span className="text-[9px] text-faint">{t('account_team.security.expiry')} 23h 45m</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 px-1.5 text-[9px] text-primary hover:text-primary hover:bg-surface-hover ml-auto"
                    >
                      <RefreshCw className="w-2.5 h-2.5 mr-0.5" />
                      {t('account_team.security.refresh')}
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
                      {t('account_team.security.two_fa')}
                    </p>
                    <p className="text-[9px] text-dim">
                      {t('account_team.security.two_fa_desc')}
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
                      {t('account_team.security.sessions')}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 px-1.5 text-[9px] text-red-500 hover:text-red-400 hover:bg-red-500/10"
                  >
                    {t('account_team.security.revoke_all')}
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
                  {teamMembers?.length} members
                </Badge>
              </div>

              {/* Team Members */}
              <div className="space-y-1.5">
                {teamMembers.map((member) => {
                  const role = roleConfig[member.role.toLowerCase()] || roleConfig.user;
                  const memberInitials = member.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || '??';
                  return (
                    <div
                      key={member.id}
                      className="rounded-lg border border-default bg-surface-hover p-3 hover:bg-surface-active transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="relative">
                          <Avatar className="h-7 w-7">
                            <AvatarFallback className="bg-surface-active text-body text-[9px] font-medium">
                              {memberInitials}
                            </AvatarFallback>
                          </Avatar>
                          <span
                            className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border-2 border-surface-1 ${member.status === 'online' ? 'bg-emerald-400' : 'bg-gray-400'}`}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-medium text-heading truncate">
                              {member.full_name}
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
