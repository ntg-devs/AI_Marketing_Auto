'use client';

import { useState } from 'react';
import {
  Settings,
  Link2,
  RefreshCw,
  Plus,
  ChevronRight,
  Save,
  Users,
  LayoutGrid,
  CreditCard,
  BellRing,
  Languages,
  Moon,
  Sun,
  Copy,
  Check,
  Zap,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useUIStore } from '@/store/useUIStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useSocialStore } from '@/store/useSocialStore';
import { gooeyToast } from 'goey-toast';
import { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

/* ─── Types & Mock Data ────────────────────────────────────────── */

type TabValue = 'connections' | 'workspace' | 'app';

const mockBannedWords = ['free', 'guaranteed', 'spam', 'winner', 'crypto scam'];

/* ─── Main Component ────────────────────────────────────────────── */

export default function SystemSettingsPanel() {
  const { theme, setTheme } = useUIStore();
  const { user } = useAuthStore();
  const { accounts, isLoading, fetchAccounts, saveAccount, deleteAccount } = useSocialStore();

  const [activeTab, setActiveTab] = useState<TabValue>('connections');
  const [bannedWords, setBannedWords] = useState(mockBannedWords);
  const [isCopied, setIsCopied] = useState(false);

  // Connection Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newConn, setNewConn] = useState({
    platform: 'facebook',
    profile_name: '',
    access_token: '',
    page_id: '',
  });

  useEffect(() => {
    if (user?.team_id) {
      fetchAccounts(user.team_id);
    }
  }, [user?.team_id, fetchAccounts]);

  const handleSaveConnection = async () => {
    if (!user?.team_id) return;
    try {
      await saveAccount({
        ...newConn,
        team_id: user.team_id,
        user_id: user.id,
      });
      gooeyToast.success(`Đã kết nối ${newConn.platform} thành công`);
      setIsDialogOpen(false);
      setNewConn({ platform: 'facebook', profile_name: '', access_token: '', page_id: '' });
    } catch (err) {
      gooeyToast.error('Không thể lưu kết nối');
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'facebook': return '🔵';
      case 'linkedin': return '🔷';
      case 'blog': return '📝';
      default: return '🌐';
    }
  };

  const handleCopyInvite = () => {
    navigator.clipboard.writeText('https://aetherflow.ai/invite/btg-9921');
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
    gooeyToast.success('Đã sao chép mã mời workspace');
  };

  return (
    <div className="flex flex-col h-full bg-surface-1">
      {/* Header */}
      <div className="px-5 py-4 border-b border-default shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
            <Settings className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-heading tracking-tight">Cấu hình Hệ thống</h2>
            <p className="text-[10px] text-dim mt-0.5">Quản lý Workspace & Brand Identity</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="connections" className="flex-1 flex flex-col min-h-0">
        <div className="px-4 pt-4 shrink-0">
          <TabsList className="w-full bg-surface-hover/50 h-9 rounded-xl p-1 border border-default/50">
            <TabsTrigger value="connections" className="flex-1 text-[10px] rounded-lg">
              <Link2 className="w-3 h-3 mr-1.5" /> Kết nối
            </TabsTrigger>
            <TabsTrigger value="workspace" className="flex-1 text-[10px] rounded-lg">
              <LayoutGrid className="w-3 h-3 mr-1.5" /> Workspace
            </TabsTrigger>
            <TabsTrigger value="app" className="flex-1 text-[10px] rounded-lg">
              <Zap className="w-3 h-3 mr-1.5" /> App
            </TabsTrigger>
          </TabsList>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-5">
            
            {/* ══════════ TẬP 1: CONNECTIONS ══════════ */}
            <TabsContent value="connections" className="m-0 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-dim uppercase tracking-wider">Social Integrations</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 text-[10px] text-primary hover:bg-primary/10"
                  onClick={() => user?.team_id && fetchAccounts(user.team_id)}
                  disabled={isLoading}
                >
                  <RefreshCw className={`w-3 h-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} /> Làm mới
                </Button>
              </div>

              <div className="grid gap-2.5">
                {accounts.length === 0 && !isLoading && (
                  <div className="text-center py-6 border border-dashed border-default rounded-xl">
                    <p className="text-[10px] text-dim">Chưa có kết nối nào</p>
                  </div>
                )}
                
                {accounts.map((conn) => (
                  <div key={conn.id} className="group relative rounded-xl border border-default bg-surface-hover/30 p-3 hover:bg-surface-hover transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{getPlatformIcon(conn.platform)}</span>
                        <div>
                          <p className="text-[11px] font-medium text-heading">
                            {conn.platform.charAt(0).toUpperCase() + conn.platform.slice(1)}
                          </p>
                          <p className="text-[9px] text-dim">{conn.profile_name || 'Tài khoản ẩn danh'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`text-[8px] h-4 px-1.5 ${conn.is_active ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-gray-500/10 text-dim border-default'}`}>
                          {conn.is_active ? 'Đã kết nối' : 'Lỗi'}
                        </Badge>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="w-6 h-6 text-red-400 hover:bg-red-400/10"
                          onClick={() => user?.team_id && deleteAccount(conn.id, user.team_id)}
                        >
                          <Plus className="w-3 h-3 rotate-45" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full h-8 text-[10px] bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 border-dashed">
                      <Plus className="w-3 h-3 mr-1.5" /> Thêm kết nối mới
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[400px] bg-surface-1 border-default">
                    <DialogHeader>
                      <DialogTitle className="text-sm font-semibold text-heading">Kết nối Nền tảng</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="platform" className="text-[11px] text-dim">Nền tảng</Label>
                        <Select 
                          value={newConn.platform} 
                          onValueChange={(v) => setNewConn(p => ({ ...p, platform: v }))}
                        >
                          <SelectTrigger className="h-9 bg-surface-active border-default text-[11px]">
                            <SelectValue placeholder="Chọn nền tảng" />
                          </SelectTrigger>
                          <SelectContent className="bg-surface-active border-default">
                            <SelectItem value="facebook">Facebook</SelectItem>
                            <SelectItem value="linkedin">LinkedIn</SelectItem>
                            <SelectItem value="blog">Blog / Webhook</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="name" className="text-[11px] text-dim">Tên hiển thị</Label>
                        <Input 
                          id="name" 
                          placeholder="VD: Fanpage Bityagi" 
                          className="h-9 bg-surface-active border-default text-[11px]"
                          value={newConn.profile_name}
                          onChange={(e) => setNewConn(p => ({ ...p, profile_name: e.target.value }))}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="token" className="text-[11px] text-dim">Access Token</Label>
                        <Input 
                          id="token" 
                          type="password"
                          placeholder="Dán token tại đây..." 
                          className="h-9 bg-surface-active border-default text-[11px]"
                          value={newConn.access_token}
                          onChange={(e) => setNewConn(p => ({ ...p, access_token: e.target.value }))}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="page_id" className="text-[11px] text-dim">Page ID / External ID (Tùy chọn)</Label>
                        <Input 
                          id="page_id" 
                          placeholder="ID của trang hoặc ứng dụng" 
                          className="h-9 bg-surface-active border-default text-[11px]"
                          value={newConn.page_id}
                          onChange={(e) => setNewConn(p => ({ ...p, page_id: e.target.value }))}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button 
                        onClick={handleSaveConnection}
                        className="w-full bg-primary text-primary-foreground h-9 text-[11px]"
                        disabled={!newConn.access_token}
                      >
                        Xác nhận Kết nối
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </TabsContent>


            {/* ══════════ TẬP 3: WORKSPACE ══════════ */}
            <TabsContent value="workspace" className="m-0 space-y-4">
              <div className="p-4 rounded-xl border border-default bg-surface-hover/20 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                    B
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-heading">Bityagi Global Workspace</h3>
                    <p className="text-[9px] text-dim">Mã định danh: WS-9921-BTG</p>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-hover border border-default">
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-dim" />
                      <span className="text-[10px] text-body">Thành viên Team</span>
                    </div>
                    <span className="text-[10px] font-medium">8 / 15</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-hover border border-default">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-3.5 h-3.5 text-dim" />
                      <span className="text-[10px] text-body">Gói dịch vụ</span>
                    </div>
                    <Badge className="text-[8px] bg-amber-500/10 text-amber-500 border-amber-500/20">PRO PLAN</Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-semibold text-dim uppercase">Mời thành viên</label>
                  <div className="flex gap-2">
                    <input 
                      readOnly
                      value="https://aetherflow.ai/invite/btg-9921"
                      className="flex-1 bg-surface-active border border-default rounded-lg px-3 py-1.5 text-[10px] text-dim outline-none"
                    />
                    <Button onClick={handleCopyInvite} size="sm" className="h-8 px-2 bg-primary/10 text-primary hover:bg-primary/20">
                      {isCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* ══════════ TẬP 4: APP SETTINGS ══════════ */}
            <TabsContent value="app" className="m-0 space-y-5">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-surface-hover flex items-center justify-center border border-default">
                      {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-[11px] font-medium text-heading">Chế độ giao diện</p>
                      <p className="text-[9px] text-dim">Sử dụng tối hoặc sáng</p>
                    </div>
                  </div>
                  <Switch 
                    checked={theme === 'dark'} 
                    onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'quite-light')}
                    className="scale-90"
                  />
                </div>

                <Separator className="bg-default/50" />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-surface-hover flex items-center justify-center border border-default">
                      <Languages className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[11px] font-medium text-heading">Ngôn ngữ hệ thống</p>
                      <p className="text-[9px] text-dim">Tiếng Việt mặc định</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-dim" />
                </div>

                <Separator className="bg-default/50" />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-surface-hover flex items-center justify-center border border-default">
                      <BellRing className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-[11px] font-medium text-heading">Thông báo đẩy</p>
                      <p className="text-[9px] text-dim">Cập nhật tiến trình đăng bài</p>
                    </div>
                  </div>
                  <Switch defaultChecked className="scale-90" />
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-default text-center">
                <p className="text-[9px] text-faint italic font-serif">AetherFlow Engine v2.5.0-stable</p>
              </div>
            </TabsContent>

          </div>
        </ScrollArea>

        {/* Footer Actions */}
        <div className="p-4 border-t border-default bg-surface-hover/30 shrink-0">
          <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 text-[10px] h-9 shadow-lg shadow-primary/20">
            <Save className="w-3.5 h-3.5 mr-2" /> Lưu tất cả thay đổi
          </Button>
        </div>
      </Tabs>
    </div>
  );
}
