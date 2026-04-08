'use client';

import {
  Share2,
  Sparkles,
  Send,
  Globe,
  Mail,
  Users,
  MessageSquare,
  Briefcase,
  Camera,
  Download,
  Eye,
  TrendingUp,
} from 'lucide-react';
import { WorkflowProgress } from '@/components/WorkflowProgress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const TypedResponsiveContainer = ResponsiveContainer as any;
const TypedLineChart = LineChart as any;
const TypedLine = Line as any;
const TypedXAxis = XAxis as any;
const TypedYAxis = YAxis as any;
const TypedCartesianGrid = CartesianGrid as any;
const TypedTooltip = Tooltip as any;

const channels = [
  {
    id: 1,
    name: 'Website',
    icon: Globe,
    status: 'active',
    reach: '125K',
    engagement: '12.4%',
    color: 'violet',
  },
  {
    id: 2,
    name: 'Email',
    icon: Mail,
    status: 'active',
    reach: '45K',
    engagement: '28.7%',
    color: 'blue',
  },
  {
    id: 3,
    name: 'Facebook',
    icon: Users,
    status: 'active',
    reach: '89K',
    engagement: '8.2%',
    color: 'blue',
  },
  {
    id: 4,
    name: 'Twitter',
    icon: MessageSquare,
    status: 'scheduled',
    reach: '67K',
    engagement: '6.1%',
    color: 'sky',
  },
  {
    id: 5,
    name: 'LinkedIn',
    icon: Briefcase,
    status: 'active',
    reach: '34K',
    engagement: '15.3%',
    color: 'blue',
  },
  {
    id: 6,
    name: 'Instagram',
    icon: Camera,
    status: 'scheduled',
    reach: '112K',
    engagement: '18.9%',
    color: 'purple',
  },
];

const reachData = [
  { day: 'Mon', reach: 12500, engagement: 1200 },
  { day: 'Tue', reach: 18300, engagement: 1800 },
  { day: 'Wed', reach: 22100, engagement: 2500 },
  { day: 'Thu', reach: 28700, engagement: 3100 },
  { day: 'Fri', reach: 35200, engagement: 4200 },
  { day: 'Sat', reach: 31800, engagement: 3800 },
  { day: 'Sun', reach: 28500, engagement: 3300 },
];

const distributions = [
  {
    id: 1,
    campaign: 'Product Launch Email',
    channel: 'Email',
    status: 'sent',
    sent: '2026-04-05',
    recipients: '45,230',
  },
  {
    id: 2,
    campaign: 'Social Media Campaign',
    channel: 'Multi-channel',
    status: 'scheduled',
    sent: '2026-04-07',
    recipients: '287,450',
  },
  {
    id: 3,
    campaign: 'Website Banner Update',
    channel: 'Website',
    status: 'active',
    sent: '2026-04-04',
    recipients: '125,000',
  },
];

export default function DistributionPage() {
  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-violet-500/20 rounded-xl flex items-center justify-center">
              <Share2 className="w-5 h-5 text-violet-400" />
            </div>
            <h1 className="text-3xl text-white">Distribution</h1>
            <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30">
              Stage 5
            </Badge>
          </div>
          <p className="text-slate-400">
            Multi-channel content distribution with AI optimization
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
          <Button className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 shadow-lg shadow-violet-500/30">
            <Send className="w-4 h-4 mr-2" />
            Launch Campaign
          </Button>
        </div>
      </div>

      {/* Workflow Progress */}
      <WorkflowProgress currentStage={5} />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-slate-400">Total Reach</p>
            <Eye className="w-5 h-5 text-violet-400" />
          </div>
          <p className="text-2xl text-white mb-1">472K</p>
          <p className="text-xs text-emerald-400 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            +24% from last week
          </p>
        </div>
        <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-slate-400">Engagement</p>
            <TrendingUp className="w-5 h-5 text-violet-400" />
          </div>
          <p className="text-2xl text-white mb-1">14.8%</p>
          <p className="text-xs text-emerald-400 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            +3.2% increase
          </p>
        </div>
        <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-slate-400">Active Channels</p>
            <Share2 className="w-5 h-5 text-violet-400" />
          </div>
          <p className="text-2xl text-white mb-1">6</p>
          <p className="text-xs text-slate-400">All systems operational</p>
        </div>
        <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-slate-400">AI Optimization</p>
            <Sparkles className="w-5 h-5 text-violet-400" />
          </div>
          <p className="text-2xl text-white mb-1">96%</p>
          <p className="text-xs text-emerald-400">Highly optimized</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Distribution Channels */}
        <div className="lg:col-span-2 space-y-6">
          {/* Channels Grid */}
          <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
            <h3 className="text-lg text-white mb-6 flex items-center gap-2">
              <Share2 className="w-5 h-5 text-violet-400" />
              Distribution Channels
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {channels.map((channel) => {
                const Icon = channel.icon;
                return (
                  <div
                    key={channel.id}
                    className="p-5 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-all duration-300 border border-slate-700/50 hover:border-violet-500/30"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-violet-500/20 rounded-xl flex items-center justify-center">
                          <Icon className="w-5 h-5 text-violet-400" />
                        </div>
                        <div>
                          <p className="text-slate-200">{channel.name}</p>
                          <Badge
                            className={`text-xs mt-1 ${
                              channel.status === 'active'
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                            }`}
                          >
                            {channel.status}
                          </Badge>
                        </div>
                      </div>
                      <Switch defaultChecked={channel.status === 'active'} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Reach</p>
                        <p className="text-lg text-white">{channel.reach}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Engagement</p>
                        <p className="text-lg text-white">{channel.engagement}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Performance Chart */}
          <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg text-white">Reach & Engagement</h3>
              <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30">
                <Sparkles className="w-3 h-3 mr-1" />
                Last 7 Days
              </Badge>
            </div>
            <TypedResponsiveContainer width="100%" height={280}>
              <TypedLineChart data={reachData}>
                <TypedCartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                <TypedXAxis dataKey="day" stroke="#94a3b8" fontSize={12} />
                <TypedYAxis stroke="#94a3b8" fontSize={12} />
                <TypedTooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '8px',
                  }}
                />
                <TypedLine
                  type="monotone"
                  dataKey="reach"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  dot={{ fill: '#8b5cf6', r: 4 }}
                />
                <TypedLine
                  type="monotone"
                  dataKey="engagement"
                  stroke="#a78bfa"
                  strokeWidth={2}
                  dot={{ fill: '#a78bfa', r: 4 }}
                />
              </TypedLineChart>
            </TypedResponsiveContainer>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* AI Recommendations */}
          <div className="bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-violet-500/20 rounded-xl p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 bg-violet-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <h4 className="text-white mb-2">AI Recommendation</h4>
                <p className="text-sm text-slate-300 mb-4">
                  Optimal posting time for Instagram: 2:00 PM PST. Expected 32%
                  higher engagement based on audience behavior patterns.
                </p>
                <Button
                  size="sm"
                  className="bg-violet-500 hover:bg-violet-600"
                >
                  Apply Timing
                </Button>
              </div>
            </div>
          </div>

          {/* Recent Distributions */}
          <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
            <h3 className="text-lg text-white mb-4">Recent Distributions</h3>
            <div className="space-y-4">
              {distributions.map((dist) => (
                <div
                  key={dist.id}
                  className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50"
                >
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-sm text-slate-200 flex-1">
                      {dist.campaign}
                    </p>
                    <Badge
                      className={`text-xs ${
                        dist.status === 'sent'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : dist.status === 'active'
                          ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      }`}
                    >
                      {dist.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-400 mb-1">{dist.channel}</p>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{dist.sent}</span>
                    <span>{dist.recipients} recipients</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Schedule */}
          <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
            <h3 className="text-lg text-white mb-4">Scheduled Posts</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                <div>
                  <p className="text-sm text-slate-200">Instagram Story</p>
                  <p className="text-xs text-slate-500">Today, 2:00 PM</p>
                </div>
                <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30 text-xs">
                  AI Optimized
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                <div>
                  <p className="text-sm text-slate-200">Twitter Thread</p>
                  <p className="text-xs text-slate-500">Tomorrow, 9:00 AM</p>
                </div>
                <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30 text-xs">
                  AI Optimized
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
