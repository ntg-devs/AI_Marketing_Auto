'use client';

import { useState } from 'react';
import {
  Settings,
  Link2,
  Dna,
  RefreshCw,
  Plus,
  ChevronRight,
  Save,
  Shield,
  Globe,
  Ban,
  BrainCircuit,
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
import { gooeyToast } from 'goey-toast';

/* ─── Types & Mock Data ────────────────────────────────────────── */

type TabValue = 'connections' | 'brand' | 'workspace' | 'app';

const mockConnections = [
  { id: '1', platform: 'Facebook Business', icon: '🔵', status: 'connected', account: 'Bityagi Media' },
  { id: '2', platform: 'LinkedIn Corporate', icon: '🔷', status: 'connected', account: 'Bityagi Inc.' },
  { id: '3', platform: 'WordPress Blog', icon: '📝', status: 'disconnected' },
];

const mockBannedWords = ['free', 'guaranteed', 'spam', 'winner', 'crypto scam'];

/* ─── Main Component ────────────────────────────────────────────── */

export default function SystemSettingsPanel() {
  const { theme, setTheme } = useUIStore();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabValue>('connections');
  
  const [bannedWords, setBannedWords] = useState(mockBannedWords);
  const [isCopied, setIsCopied] = useState(false);

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
            <TabsTrigger value="brand" className="flex-1 text-[10px] rounded-lg">
              <Dna className="w-3 h-3 mr-1.5" /> Brand
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
                <Button variant="ghost" size="sm" className="h-6 text-[10px] text-primary hover:bg-primary/10">
                  <RefreshCw className="w-3 h-3 mr-1" /> Làm mới Token
                </Button>
              </div>

              <div className="grid gap-2.5">
                {mockConnections.map((conn) => (
                  <div key={conn.id} className="group relative rounded-xl border border-default bg-surface-hover/30 p-3 hover:bg-surface-hover transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{conn.icon}</span>
                        <div>
                          <p className="text-[11px] font-medium text-heading">{conn.platform}</p>
                          <p className="text-[9px] text-dim">{conn.account || 'Chưa kết nối'}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className={`text-[8px] h-4 px-1.5 ${conn.status === 'connected' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-gray-500/10 text-dim border-default'}`}>
                        {conn.status === 'connected' ? 'Đã kết nối' : 'Ngắt kết nối'}
                      </Badge>
                    </div>
                  </div>
                ))}
                <Button className="w-full h-8 text-[10px] bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 border-dashed">
                  <Plus className="w-3 h-3 mr-1.5" /> Thêm kết nối mới
                </Button>
              </div>
            </TabsContent>

            {/* ══════════ TẬP 2: BRAND DNA ══════════ */}
            <TabsContent value="brand" className="m-0 space-y-5">
              <section className="space-y-3">
                <div className="flex items-center gap-2 text-primary">
                  <BrainCircuit className="w-4 h-4" />
                  <span className="text-[11px] font-semibold">Tông giọng Thương hiệu</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {['Chuyên nghiệp', 'Hài hước', 'Chân thực', 'Dẫn dắt'].map((t) => (
                    <button key={t} className={`px-3 py-2 rounded-lg border text-[10px] text-left transition-all ${t === 'Chuyên nghiệp' ? 'border-primary bg-primary/5 text-primary' : 'border-default bg-surface-hover text-dim'}`}>
                      {t}
                    </button>
                  ))}
                </div>
                <div className="p-3 rounded-xl bg-surface-hover/50 border border-default border-dashed">
                  <span className="text-[9px] text-dim uppercase block mb-1.5">Mô tả Brand Persona</span>
                  <textarea 
                    className="w-full bg-transparent text-[11px] text-heading outline-none min-h-[60px] resize-none"
                    placeholder="VD: Một chuyên gia công nghệ thân thiện, luôn đi thẳng vào vấn đề..."
                  />
                </div>
              </section>

              <Separator className="bg-default/50" />

              <section className="space-y-2">
                <div className="flex items-center gap-2 text-red-400">
                  <Ban className="w-4 h-4" />
                  <span className="text-[11px] font-semibold">Từ cấm (Banned Words)</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {bannedWords.map(w => (
                    <Badge key={w} variant="secondary" className="text-[9px] bg-red-400/10 text-red-400 border-red-400/20">
                      {w} <Plus className="w-2 h-2 ml-1 rotate-45 cursor-pointer" />
                    </Badge>
                  ))}
                  <button className="text-[9px] text-primary hover:underline">+ Thêm từ cấm</button>
                </div>
              </section>

              <div className="rounded-xl bg-gradient-to-br from-primary/10 to-purple-500/10 border border-primary/20 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-3.5 h-3.5 text-primary" />
                  <span className="text-[10px] font-bold text-primary uppercase">Vector DB Protection</span>
                </div>
                <p className="text-[9px] text-dim leading-relaxed">Brand DNA được đồng bộ hóa vào Vector Database để AI luôn đảm bảo phong cách nhất quán và không trùng lặp nội dung cũ.</p>
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
