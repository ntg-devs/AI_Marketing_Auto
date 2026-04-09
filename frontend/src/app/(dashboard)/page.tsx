"use client";

import {
  Activity,
  FileText,
  Users,
  Zap,
  Sparkles,
  ArrowRight,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { WorkflowProgress } from "@/components/WorkflowProgress";
import { AIInsightCard } from "@/components/AIInsightCard";
import { MetricCard } from "@/components/MetricCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useAuthStore } from "@/store/useAuthStore";

const TypedResponsiveContainer = ResponsiveContainer as any;

const performanceData = [
  { name: "Mon", value: 65, efficiency: 58 },
  { name: "Tue", value: 72, efficiency: 65 },
  { name: "Wed", value: 68, efficiency: 70 },
  { name: "Thu", value: 85, efficiency: 78 },
  { name: "Fri", value: 92, efficiency: 85 },
  { name: "Sat", value: 88, efficiency: 90 },
  { name: "Sun", value: 95, efficiency: 93 },
];

const recentActivities = [
  {
    id: 1,
    action: "AI optimization completed",
    project: "Product Launch Campaign",
    time: "5 min ago",
    type: "ai",
  },
  {
    id: 2,
    action: "Approval stage completed",
    project: "Brand Redesign 2026",
    time: "1 hour ago",
    type: "approval",
  },
  {
    id: 3,
    action: "New insights generated",
    project: "Q2 Marketing Strategy",
    time: "2 hours ago",
    type: "insight",
  },
  {
    id: 4,
    action: "Distribution initiated",
    project: "Product Launch Campaign",
    time: "4 hours ago",
    type: "distribution",
  },
];

const TypedAreaChart = AreaChart as any;

export default function DashboardPage() {

  const {user, isAuthenticated} = useAuthStore();

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-white mb-2">Welcome back, {user?.full_name}</h1>
          <p className="text-slate-400">
            Here&apos;s what&apos;s happening with your projects today
          </p>
        </div>
        <Button className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 shadow-lg shadow-violet-500/30">
          <Sparkles className="w-4 h-4 mr-2" />
          Generate AI Report
        </Button>
      </div>

      {/* Workflow Progress */}
      <WorkflowProgress currentStage={3} />

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          icon={Activity}
          label="Active Projects"
          value="12"
          change="+3"
          trend="up"
        />
        <MetricCard
          icon={FileText}
          label="Tasks Completed"
          value="847"
          change="+127"
          trend="up"
        />
        <MetricCard
          icon={Users}
          label="Team Members"
          value="24"
          change="+2"
          trend="up"
        />
        <MetricCard
          icon={Zap}
          label="AI Efficiency Score"
          value="94%"
          change="+8%"
          trend="up"
        />
      </div>

      {/* Charts and AI Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Chart */}
        <div className="lg:col-span-2 bg-gradient-to-br from-slate-900/50 to-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg text-white">Performance Analytics</h3>
              <p className="text-sm text-slate-400 mt-1">
                AI-driven insights over the last 7 days
              </p>
            </div>
            <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30">
              <Sparkles className="w-3 h-3 mr-1" />
              AI Powered
            </Badge>
          </div>
          <TypedResponsiveContainer width="100%" height={280}>
            <TypedAreaChart data={performanceData}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
                <linearGradient
                  id="colorEfficiency"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#334155"
                opacity={0.2}
              />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "1px solid #475569",
                  borderRadius: "8px",
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#8b5cf6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorValue)"
              />
              <Area
                type="monotone"
                dataKey="efficiency"
                stroke="#a78bfa"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorEfficiency)"
              />
            </TypedAreaChart>
          </TypedResponsiveContainer>
        </div>

        {/* Recent Activity */}
        <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
          <h3 className="text-lg text-white mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 pb-4 border-b border-slate-800 last:border-0 last:pb-0"
              >
                <div className="w-8 h-8 bg-violet-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  {activity.type === "ai" ? (
                    <Sparkles className="w-4 h-4 text-violet-400" />
                  ) : (
                    <Activity className="w-4 h-4 text-violet-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-200">{activity.action}</p>
                  <p className="text-xs text-slate-500 truncate">
                    {activity.project}
                  </p>
                  <p className="text-xs text-slate-600 flex items-center gap-1 mt-1">
                    <Clock className="w-3 h-3" />
                    {activity.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Insights */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-400" />
            AI-Generated Insights
          </h2>
          <Button
            variant="ghost"
            className="text-violet-400 hover:text-violet-300"
          >
            View All
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AIInsightCard
            title="Optimize Production Timeline"
            description="AI detected potential bottlenecks in the production stage. Consider reallocating resources to improve efficiency by 23%."
            trend="up"
            value="+23%"
            impact="high"
          />
          <AIInsightCard
            title="Approval Time Reduction"
            description="Implementing automated pre-checks could reduce approval time by 2.5 days based on historical data patterns."
            trend="up"
            value="-2.5d"
            impact="medium"
          />
          <AIInsightCard
            title="Distribution Channel Analysis"
            description="Channel performance suggests shifting 15% of resources to social media distribution for better ROI."
            trend="up"
            value="+15%"
            impact="high"
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
        <h3 className="text-lg text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/intake"
            className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors group"
          >
            <div>
              <p className="text-slate-200 mb-1">Start New Intake</p>
              <p className="text-xs text-slate-400">Begin a new workflow</p>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-violet-400 group-hover:translate-x-1 transition-all" />
          </Link>
          <Link
            href="/product"
            className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors group"
          >
            <div>
              <p className="text-slate-200 mb-1">Continue Production</p>
              <p className="text-xs text-slate-400">Resume active work</p>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-violet-400 group-hover:translate-x-1 transition-all" />
          </Link>
          <Link
            href="/optimization"
            className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors group"
          >
            <div>
              <p className="text-slate-200 mb-1">View Optimization</p>
              <p className="text-xs text-slate-400">AI recommendations</p>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-violet-400 group-hover:translate-x-1 transition-all" />
          </Link>
        </div>
      </div>
    </div>
  );
}
