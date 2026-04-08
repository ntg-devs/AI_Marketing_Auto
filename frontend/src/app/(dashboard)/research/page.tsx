'use client';

import {
  Search,
  Sparkles,
  TrendingUp,
  Target,
  Users,
  Globe,
  BookOpen,
  ExternalLink,
} from 'lucide-react';
import { WorkflowProgress } from '@/components/WorkflowProgress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart as RechartsBarChart,
  Bar as RechartsBar,
  XAxis as RechartsXAxis,
  YAxis as RechartsYAxis,
  CartesianGrid as RechartsCartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer as RechartsResponsiveContainer,
  RadarChart as RechartsRadarChart,
  PolarGrid as RechartsPolarGrid,
  PolarAngleAxis as RechartsPolarAngleAxis,
  PolarRadiusAxis as RechartsPolarRadiusAxis,
  Radar as RechartsRadar,
} from 'recharts';

// Cast all recharts components to `any` to work around React 18 ReactNode/ReactPortal type mismatch
const ResponsiveContainer = RechartsResponsiveContainer as any;
const BarChart = RechartsBarChart as any;
const Bar = RechartsBar as any;
const XAxis = RechartsXAxis as any;
const YAxis = RechartsYAxis as any;
const CartesianGrid = RechartsCartesianGrid as any;
const Tooltip = RechartsTooltip as any;
const RadarChart = RechartsRadarChart as any;
const PolarGrid = RechartsPolarGrid as any;
const PolarAngleAxis = RechartsPolarAngleAxis as any;
const PolarRadiusAxis = RechartsPolarRadiusAxis as any;
const Radar = RechartsRadar as any;

const marketData = [
  { name: 'Q1', value: 4200, competitor: 3800 },
  { name: 'Q2', value: 5300, competitor: 4200 },
  { name: 'Q3', value: 6100, competitor: 4800 },
  { name: 'Q4', value: 7200, competitor: 5200 },
];

const competitorData = [
  { subject: 'Features', A: 120, B: 110, fullMark: 150 },
  { subject: 'UX', A: 98, B: 130, fullMark: 150 },
  { subject: 'Pricing', A: 86, B: 90, fullMark: 150 },
  { subject: 'Support', A: 99, B: 85, fullMark: 150 },
  { subject: 'Marketing', A: 85, B: 95, fullMark: 150 },
];

const insights = [
  {
    id: 1,
    title: 'Market Opportunity Identified',
    description:
      'AI detected a 34% growth opportunity in the enterprise segment based on current trends.',
    confidence: 'high',
    impact: 'high',
  },
  {
    id: 2,
    title: 'Competitor Gap Analysis',
    description:
      'Key feature gaps identified in competitor offerings that align with customer demand.',
    confidence: 'medium',
    impact: 'high',
  },
  {
    id: 3,
    title: 'Audience Segment Discovery',
    description:
      'Emerging audience segment showing 2.5x engagement rates compared to primary target.',
    confidence: 'high',
    impact: 'medium',
  },
];

const sources = [
  {
    id: 1,
    title: 'Industry Report: Digital Transformation 2026',
    type: 'Report',
    relevance: 95,
  },
  {
    id: 2,
    title: 'Customer Survey Results Q1 2026',
    type: 'Survey',
    relevance: 92,
  },
  {
    id: 3,
    title: 'Competitor Analysis: Market Leaders',
    type: 'Analysis',
    relevance: 88,
  },
  {
    id: 4,
    title: 'Social Media Sentiment Analysis',
    type: 'Data',
    relevance: 85,
  },
];

export default function ResearchPage() {
  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-violet-500/20 rounded-xl flex items-center justify-center">
              <Search className="w-5 h-5 text-violet-400" />
            </div>
            <h1 className="text-3xl text-white">Research</h1>
            <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30">
              Stage 2
            </Badge>
          </div>
          <p className="text-slate-400">
            AI-powered insights and market intelligence
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            <Search className="w-4 h-4 mr-2" />
            Deep Search
          </Button>
          <Button className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 shadow-lg shadow-violet-500/30">
            <Sparkles className="w-4 h-4 mr-2" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* Workflow Progress */}
      <WorkflowProgress currentStage={2} />

      {/* Search Bar */}
      <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-xl p-4">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              placeholder="Ask AI anything about your market, competitors, or audience..."
              className="pl-10 bg-slate-800/50 border-slate-700 text-slate-200 placeholder:text-slate-500"
            />
          </div>
          <Button className="bg-violet-500 hover:bg-violet-600">
            <Sparkles className="w-4 h-4 mr-2" />
            Search
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="insights" className="space-y-6">
        <TabsList className="bg-slate-900/50 border border-slate-800">
          <TabsTrigger value="insights" className="data-[state=active]:bg-violet-500/20">
            <Sparkles className="w-4 h-4 mr-2" />
            AI Insights
          </TabsTrigger>
          <TabsTrigger value="market" className="data-[state=active]:bg-violet-500/20">
            <TrendingUp className="w-4 h-4 mr-2" />
            Market Analysis
          </TabsTrigger>
          <TabsTrigger value="competitor" className="data-[state=active]:bg-violet-500/20">
            <Target className="w-4 h-4 mr-2" />
            Competitors
          </TabsTrigger>
          <TabsTrigger value="audience" className="data-[state=active]:bg-violet-500/20">
            <Users className="w-4 h-4 mr-2" />
            Audience
          </TabsTrigger>
        </TabsList>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {insights.map((insight) => (
              <div
                key={insight.id}
                className="bg-gradient-to-br from-slate-900/50 to-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6 hover:border-violet-500/30 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <Badge
                    className={`${
                      insight.impact === 'high'
                        ? 'bg-violet-500/20 text-violet-300 border-violet-500/30'
                        : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                    }`}
                  >
                    {insight.impact} impact
                  </Badge>
                  <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                    {insight.confidence} confidence
                  </Badge>
                </div>
                <h3 className="text-white mb-3">{insight.title}</h3>
                <p className="text-sm text-slate-400 mb-4">
                  {insight.description}
                </p>
                <Button
                  variant="ghost"
                  className="w-full text-violet-400 hover:text-violet-300 hover:bg-violet-500/10"
                >
                  View Details
                </Button>
              </div>
            ))}
          </div>

          {/* Sources */}
          <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
            <h3 className="text-lg text-white mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-violet-400" />
              Research Sources
            </h3>
            <div className="space-y-3">
              {sources.map((source) => (
                <div
                  key={source.id}
                  className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors group cursor-pointer"
                >
                  <div className="flex-1">
                    <p className="text-slate-200 mb-1 flex items-center gap-2">
                      {source.title}
                      <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-violet-400" />
                    </p>
                    <p className="text-xs text-slate-500">{source.type}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-violet-400">{source.relevance}%</p>
                    <p className="text-xs text-slate-500">relevance</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="market" className="space-y-6">
          <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg text-white">Market Trends</h3>
              <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30">
                <Sparkles className="w-3 h-3 mr-1" />
                AI Analysis
              </Badge>
            </div>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={marketData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="value" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                <Bar dataKey="competitor" fill="#475569" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>

        <TabsContent value="competitor" className="space-y-6">
          <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg text-white">Competitive Analysis</h3>
              <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30">
                <Sparkles className="w-3 h-3 mr-1" />
                AI Powered
              </Badge>
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart data={competitorData}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="subject" stroke="#94a3b8" />
                <PolarRadiusAxis stroke="#94a3b8" />
                <Radar
                  name="Your Product"
                  dataKey="A"
                  stroke="#8b5cf6"
                  fill="#8b5cf6"
                  fillOpacity={0.3}
                />
                <Radar
                  name="Competitor"
                  dataKey="B"
                  stroke="#475569"
                  fill="#475569"
                  fillOpacity={0.3}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '8px',
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>

        <TabsContent value="audience" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
              <div className="w-12 h-12 bg-violet-500/20 rounded-xl flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-violet-400" />
              </div>
              <p className="text-sm text-slate-400 mb-1">Target Audience</p>
              <p className="text-2xl text-white mb-2">2.4M</p>
              <p className="text-xs text-emerald-400">+12% growth</p>
            </div>
            <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
              <div className="w-12 h-12 bg-violet-500/20 rounded-xl flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-violet-400" />
              </div>
              <p className="text-sm text-slate-400 mb-1">Engagement Rate</p>
              <p className="text-2xl text-white mb-2">18.7%</p>
              <p className="text-xs text-emerald-400">+3.2% increase</p>
            </div>
            <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
              <div className="w-12 h-12 bg-violet-500/20 rounded-xl flex items-center justify-center mb-4">
                <Globe className="w-6 h-6 text-violet-400" />
              </div>
              <p className="text-sm text-slate-400 mb-1">Market Reach</p>
              <p className="text-2xl text-white mb-2">47</p>
              <p className="text-xs text-slate-400">countries</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
