'use client';

import {
  TrendingUp,
  Sparkles,
  Zap,
  Target,
  Activity,
  Brain,
  LineChart as LineChartIcon,
  Settings,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { WorkflowProgress } from '@/components/WorkflowProgress';
import { AIInsightCard } from '@/components/AIInsightCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

const TypedResponsiveContainer = ResponsiveContainer as any;
const TypedRadarChart = RadarChart as any;
const TypedPolarGrid = PolarGrid as any;
const TypedPolarAngleAxis = PolarAngleAxis as any;
const TypedPolarRadiusAxis = PolarRadiusAxis as any;
const TypedRadar = Radar as any;
const TypedBarChart = BarChart as any;
const TypedBar = Bar as any;
const TypedXAxis = XAxis as any;
const TypedYAxis = YAxis as any;
const TypedCartesianGrid = CartesianGrid as any;
const TypedTooltip = Tooltip as any;

const performanceMetrics = [
  { metric: 'Efficiency', current: 94, target: 98 },
  { metric: 'Quality', current: 91, target: 95 },
  { metric: 'Speed', current: 88, target: 95 },
  { metric: 'Cost', current: 85, target: 90 },
  { metric: 'Satisfaction', current: 96, target: 98 },
];

const optimizationData = [
  { week: 'Week 1', before: 65, after: 72 },
  { week: 'Week 2', before: 68, after: 78 },
  { week: 'Week 3', before: 70, after: 85 },
  { week: 'Week 4', before: 72, after: 94 },
];

const aiRecommendations = [
  {
    id: 1,
    title: 'Automate Repetitive Tasks',
    description:
      'AI identified 12 hours/week of manual work that can be automated, potentially saving 31% of team time.',
    impact: 'high',
    effort: 'medium',
    savings: '31%',
    status: 'available',
  },
  {
    id: 2,
    title: 'Resource Reallocation',
    description:
      'Shifting 2 team members from low-priority tasks could accelerate critical path by 5 days.',
    impact: 'high',
    effort: 'low',
    savings: '5 days',
    status: 'available',
  },
  {
    id: 3,
    title: 'Process Streamlining',
    description:
      'Merge approval stages 2 and 3 to reduce turnaround time by 40% without compromising quality.',
    impact: 'medium',
    effort: 'low',
    savings: '40%',
    status: 'in-progress',
  },
  {
    id: 4,
    title: 'Quality Enhancement',
    description:
      'Implement AI-powered pre-checks to catch 85% of common errors before human review.',
    impact: 'medium',
    effort: 'medium',
    savings: '85%',
    status: 'available',
  },
];

const performanceRadar = [
  { subject: 'Speed', A: 94, B: 85, fullMark: 100 },
  { subject: 'Quality', A: 91, B: 82, fullMark: 100 },
  { subject: 'Efficiency', A: 88, B: 75, fullMark: 100 },
  { subject: 'Cost', A: 85, B: 78, fullMark: 100 },
  { subject: 'Satisfaction', A: 96, B: 88, fullMark: 100 },
];

const improvements = [
  {
    id: 1,
    area: 'Production Time',
    improvement: '-23%',
    status: 'achieved',
  },
  {
    id: 2,
    area: 'Quality Score',
    improvement: '+15%',
    status: 'achieved',
  },
  {
    id: 3,
    area: 'Team Efficiency',
    improvement: '+31%',
    status: 'in-progress',
  },
  {
    id: 4,
    area: 'Cost Reduction',
    improvement: '-18%',
    status: 'achieved',
  },
];

export default function OptimizationPage() {
  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-violet-500/20 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-violet-400" />
            </div>
            <h1 className="text-3xl text-white">Optimization</h1>
            <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30">
              Stage 6
            </Badge>
          </div>
          <p className="text-slate-400">
            AI-powered continuous improvement and analytics
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            <Settings className="w-4 h-4 mr-2" />
            Configure
          </Button>
          <Button className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 shadow-lg shadow-violet-500/30">
            <Sparkles className="w-4 h-4 mr-2" />
            Run Full Analysis
          </Button>
        </div>
      </div>

      {/* Workflow Progress */}
      <WorkflowProgress currentStage={6} />

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-slate-400">Overall Score</p>
            <Brain className="w-5 h-5 text-violet-400" />
          </div>
          <p className="text-2xl text-white mb-1">94/100</p>
          <p className="text-xs text-emerald-400 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            +8 points
          </p>
        </div>
        <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-slate-400">Time Saved</p>
            <Zap className="w-5 h-5 text-violet-400" />
          </div>
          <p className="text-2xl text-white mb-1">127h</p>
          <p className="text-xs text-emerald-400">This month</p>
        </div>
        <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-slate-400">Cost Reduction</p>
            <Target className="w-5 h-5 text-violet-400" />
          </div>
          <p className="text-2xl text-white mb-1">$24.5K</p>
          <p className="text-xs text-emerald-400">-18% vs last month</p>
        </div>
        <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-slate-400">Active Optimizations</p>
            <Activity className="w-5 h-5 text-violet-400" />
          </div>
          <p className="text-2xl text-white mb-1">8</p>
          <p className="text-xs text-slate-400">Running</p>
        </div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="recommendations" className="space-y-6">
        <TabsList className="bg-slate-900/50 border border-slate-800">
          <TabsTrigger
            value="recommendations"
            className="data-[state=active]:bg-violet-500/20"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            AI Recommendations
          </TabsTrigger>
          <TabsTrigger
            value="performance"
            className="data-[state=active]:bg-violet-500/20"
          >
            <LineChartIcon className="w-4 h-4 mr-2" />
            Performance
          </TabsTrigger>
          <TabsTrigger
            value="improvements"
            className="data-[state=active]:bg-violet-500/20"
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Improvements
          </TabsTrigger>
        </TabsList>

        <TabsContent value="recommendations" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {aiRecommendations.map((rec) => (
              <div
                key={rec.id}
                className="bg-gradient-to-br from-slate-900/50 to-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6 hover:border-violet-500/30 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Badge
                      className={`${
                        rec.impact === 'high'
                          ? 'bg-violet-500/20 text-violet-300 border-violet-500/30'
                          : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                      }`}
                    >
                      {rec.impact} impact
                    </Badge>
                    <Badge className="bg-slate-500/20 text-slate-300 border-slate-500/30">
                      {rec.effort} effort
                    </Badge>
                  </div>
                  <Badge
                    className={`${
                      rec.status === 'available'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    }`}
                  >
                    {rec.status}
                  </Badge>
                </div>
                <h4 className="text-lg text-white mb-2">{rec.title}</h4>
                <p className="text-sm text-slate-400 mb-4">{rec.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-violet-400" />
                    <span className="text-sm text-violet-300">
                      Savings: {rec.savings}
                    </span>
                  </div>
                  {rec.status === 'available' && (
                    <Button
                      size="sm"
                      className="bg-violet-500 hover:bg-violet-600"
                    >
                      Apply
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Quick Wins */}
          <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Zap className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="flex-1">
                <h4 className="text-white mb-2">Quick Wins Available</h4>
                <p className="text-sm text-slate-300 mb-4">
                  3 low-effort optimizations identified that can be implemented
                  immediately with minimal disruption. Combined potential
                  improvement: 28% efficiency gain.
                </p>
                <Button className="bg-emerald-500 hover:bg-emerald-600">
                  View Quick Wins
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Radar */}
            <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg text-white">Performance Overview</h3>
                <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30">
                  <Sparkles className="w-3 h-3 mr-1" />
                  AI Analysis
                </Badge>
              </div>
              <TypedResponsiveContainer width="100%" height={350}>
                <TypedRadarChart data={performanceRadar}>
                  <TypedPolarGrid stroke="#334155" />
                  <TypedPolarAngleAxis dataKey="subject" stroke="#94a3b8" />
                  <TypedPolarRadiusAxis stroke="#94a3b8" />
                  <TypedRadar
                    name="Current"
                    dataKey="A"
                    stroke="#8b5cf6"
                    fill="#8b5cf6"
                    fillOpacity={0.5}
                  />
                  <TypedRadar
                    name="Previous"
                    dataKey="B"
                    stroke="#475569"
                    fill="#475569"
                    fillOpacity={0.3}
                  />
                  <TypedTooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #475569',
                      borderRadius: '8px',
                    }}
                  />
                </TypedRadarChart>
              </TypedResponsiveContainer>
            </div>

            {/* Optimization Trend */}
            <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg text-white">Optimization Impact</h3>
                <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30">
                  Before vs After
                </Badge>
              </div>
              <TypedResponsiveContainer width="100%" height={350}>
                <TypedBarChart data={optimizationData}>
                  <TypedCartesianGrid
                    strokeDasharray="3 3"
                    stroke="#334155"
                    opacity={0.2}
                  />
                  <TypedXAxis dataKey="week" stroke="#94a3b8" />
                  <TypedYAxis stroke="#94a3b8" />
                  <TypedTooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #475569',
                      borderRadius: '8px',
                    }}
                  />
                  <TypedBar
                    dataKey="before"
                    fill="#475569"
                    radius={[8, 8, 0, 0]}
                    name="Before"
                  />
                  <TypedBar
                    dataKey="after"
                    fill="#8b5cf6"
                    radius={[8, 8, 0, 0]}
                    name="After"
                  />
                </TypedBarChart>
              </TypedResponsiveContainer>
            </div>
          </div>

          {/* Metric Progress */}
          <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
            <h3 className="text-lg text-white mb-6">Metric Progress</h3>
            <div className="space-y-6">
              {performanceMetrics.map((metric) => (
                <div key={metric.metric}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-300">{metric.metric}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-slate-400">
                        {metric.current}/{metric.target}
                      </span>
                      {metric.current >= metric.target ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <TrendingUp className="w-4 h-4 text-amber-400" />
                      )}
                    </div>
                  </div>
                  <Progress value={(metric.current / metric.target) * 100} />
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="improvements" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {improvements.map((improvement) => (
              <div
                key={improvement.id}
                className="bg-gradient-to-br from-slate-900/50 to-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <Badge
                    className={`${
                      improvement.status === 'achieved'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    }`}
                  >
                    {improvement.status}
                  </Badge>
                  <TrendingUp className="w-5 h-5 text-violet-400" />
                </div>
                <p className="text-sm text-slate-400 mb-2">{improvement.area}</p>
                <p className="text-2xl text-white">{improvement.improvement}</p>
              </div>
            ))}
          </div>

          {/* AI Insights */}
          <div>
            <h3 className="text-lg text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-violet-400" />
              Latest Optimization Insights
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <AIInsightCard
                title="Workflow Efficiency Boost"
                description="Recent optimizations have reduced average task completion time by 23%, exceeding the target of 20%."
                trend="up"
                value="+23%"
                impact="high"
              />
              <AIInsightCard
                title="Quality Improvements"
                description="AI-assisted quality checks have reduced error rates by 42% in the past month."
                trend="up"
                value="+42%"
                impact="high"
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
