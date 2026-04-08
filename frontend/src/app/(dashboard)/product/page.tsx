'use client';

import {
  Cog,
  Sparkles,
  Play,
  Pause,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  Image as ImageIcon,
  Video,
  Code,
} from 'lucide-react';
import { WorkflowProgress } from '@/components/WorkflowProgress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const tasks = [
  {
    id: 1,
    title: 'Design mockups and wireframes',
    status: 'completed',
    assignee: 'SM',
    progress: 100,
    dueDate: '2026-04-05',
  },
  {
    id: 2,
    title: 'Content creation and copywriting',
    status: 'in-progress',
    assignee: 'JD',
    progress: 65,
    dueDate: '2026-04-07',
  },
  {
    id: 3,
    title: 'Video production and editing',
    status: 'in-progress',
    assignee: 'AK',
    progress: 42,
    dueDate: '2026-04-08',
  },
  {
    id: 4,
    title: 'Development implementation',
    status: 'pending',
    assignee: 'RH',
    progress: 0,
    dueDate: '2026-04-10',
  },
];

const assets = [
  {
    id: 1,
    name: 'Hero Banner Design',
    type: 'image',
    status: 'approved',
    version: 'v3',
  },
  {
    id: 2,
    name: 'Product Demo Video',
    type: 'video',
    status: 'review',
    version: 'v2',
  },
  {
    id: 3,
    name: 'Landing Page Copy',
    type: 'document',
    status: 'approved',
    version: 'v4',
  },
  {
    id: 4,
    name: 'Email Template',
    type: 'code',
    status: 'draft',
    version: 'v1',
  },
];

const timeline = [
  {
    id: 1,
    event: 'Production phase started',
    time: '2 hours ago',
    user: 'System',
  },
  {
    id: 2,
    event: 'Design mockups completed',
    time: '5 hours ago',
    user: 'Sarah Miller',
  },
  {
    id: 3,
    event: 'AI optimization applied',
    time: '1 day ago',
    user: 'AI Assistant',
  },
  {
    id: 4,
    event: 'Task assignments updated',
    time: '1 day ago',
    user: 'John Doe',
  },
];

export default function ProductionPage() {
  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-violet-500/20 rounded-xl flex items-center justify-center">
              <Cog className="w-5 h-5 text-violet-400" />
            </div>
            <h1 className="text-3xl text-white">Production</h1>
            <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30">
              Stage 3
            </Badge>
          </div>
          <p className="text-slate-400">
            Active development and content creation
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            <Pause className="w-4 h-4 mr-2" />
            Pause
          </Button>
          <Button className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 shadow-lg shadow-violet-500/30">
            <Sparkles className="w-4 h-4 mr-2" />
            AI Optimize
          </Button>
        </div>
      </div>

      {/* Workflow Progress */}
      <WorkflowProgress currentStage={3} />

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-slate-400">Total Tasks</p>
            <CheckCircle className="w-5 h-5 text-violet-400" />
          </div>
          <p className="text-2xl text-white">12</p>
        </div>
        <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-slate-400">Completed</p>
            <CheckCircle className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-2xl text-white">8</p>
        </div>
        <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-slate-400">In Progress</p>
            <Clock className="w-5 h-5 text-amber-400" />
          </div>
          <p className="text-2xl text-white">3</p>
        </div>
        <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-slate-400">Pending</p>
            <AlertCircle className="w-5 h-5 text-slate-400" />
          </div>
          <p className="text-2xl text-white">1</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tasks and Assets */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="tasks">
            <TabsList className="bg-slate-900/50 border border-slate-800">
              <TabsTrigger
                value="tasks"
                className="data-[state=active]:bg-violet-500/20"
              >
                Tasks
              </TabsTrigger>
              <TabsTrigger
                value="assets"
                className="data-[state=active]:bg-violet-500/20"
              >
                Assets
              </TabsTrigger>
            </TabsList>

            <TabsContent value="tasks" className="space-y-4 mt-6">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="bg-gradient-to-br from-slate-900/50 to-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6 hover:border-violet-500/30 transition-all duration-300"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          task.status === 'completed'
                            ? 'bg-emerald-500/20'
                            : task.status === 'in-progress'
                            ? 'bg-amber-500/20'
                            : 'bg-slate-500/20'
                        }`}
                      >
                        {task.status === 'completed' ? (
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                        ) : task.status === 'in-progress' ? (
                          <Play className="w-4 h-4 text-amber-400" />
                        ) : (
                          <Clock className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-white mb-1">{task.title}</h4>
                        <p className="text-xs text-slate-400">
                          Due: {task.dueDate}
                        </p>
                      </div>
                    </div>
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-violet-500/20 text-violet-300 text-xs">
                        {task.assignee}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Progress</span>
                      <span className="text-slate-200">{task.progress}%</span>
                    </div>
                    <Progress value={task.progress} className="h-2" />
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="assets" className="space-y-4 mt-6">
              {assets.map((asset) => {
                const getIcon = () => {
                  switch (asset.type) {
                    case 'image':
                      return ImageIcon;
                    case 'video':
                      return Video;
                    case 'code':
                      return Code;
                    default:
                      return FileText;
                  }
                };
                const Icon = getIcon();

                return (
                  <div
                    key={asset.id}
                    className="bg-gradient-to-br from-slate-900/50 to-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6 hover:border-violet-500/30 transition-all duration-300"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-12 h-12 bg-violet-500/20 rounded-xl flex items-center justify-center">
                          <Icon className="w-6 h-6 text-violet-400" />
                        </div>
                        <div>
                          <h4 className="text-white mb-1">{asset.name}</h4>
                          <p className="text-xs text-slate-400">
                            {asset.version}
                          </p>
                        </div>
                      </div>
                      <Badge
                        className={`${
                          asset.status === 'approved'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            : asset.status === 'review'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                            : 'bg-slate-500/20 text-slate-300 border-slate-500/30'
                        }`}
                      >
                        {asset.status}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </TabsContent>
          </Tabs>

          {/* AI Suggestion */}
          <div className="bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-violet-500/20 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-violet-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <h4 className="text-white mb-2">AI Optimization Available</h4>
                <p className="text-sm text-slate-300 mb-4">
                  Based on your timeline, reallocating 2 resources to video
                  production could accelerate completion by 3 days while
                  maintaining quality standards.
                </p>
                <Button
                  variant="ghost"
                  className="text-violet-400 hover:text-violet-300 hover:bg-violet-500/10"
                >
                  Apply Suggestion
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Timeline */}
          <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
            <h3 className="text-lg text-white mb-4">Activity Timeline</h3>
            <div className="space-y-4">
              {timeline.map((item, index) => (
                <div key={item.id} className="relative">
                  {index !== timeline.length - 1 && (
                    <div className="absolute left-2 top-8 bottom-0 w-px bg-slate-800" />
                  )}
                  <div className="flex gap-3">
                    <div className="w-4 h-4 bg-violet-500 rounded-full mt-1 flex-shrink-0 relative z-10" />
                    <div className="flex-1">
                      <p className="text-sm text-slate-200 mb-1">
                        {item.event}
                      </p>
                      <p className="text-xs text-slate-400">{item.user}</p>
                      <p className="text-xs text-slate-500 mt-1">{item.time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Team */}
          <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
            <h3 className="text-lg text-white mb-4">Team Members</h3>
            <div className="space-y-3">
              {['SM', 'JD', 'AK', 'RH'].map((member) => (
                <div
                  key={member}
                  className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-violet-500/20 text-violet-300 text-xs">
                        {member}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm text-slate-200">Team Member</p>
                      <p className="text-xs text-slate-400">Active</p>
                    </div>
                  </div>
                  <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
