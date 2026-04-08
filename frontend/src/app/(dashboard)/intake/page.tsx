'use client';

import {
  FileInput,
  Upload,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Clock,
  User,
} from 'lucide-react';
import { WorkflowProgress } from '@/components/WorkflowProgress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const recentIntakes = [
  {
    id: 1,
    title: 'Product Launch Campaign',
    status: 'completed',
    date: '2026-04-05',
    priority: 'high',
  },
  {
    id: 2,
    title: 'Brand Redesign Assets',
    status: 'in-progress',
    date: '2026-04-04',
    priority: 'medium',
  },
  {
    id: 3,
    title: 'Q2 Marketing Materials',
    status: 'completed',
    date: '2026-04-03',
    priority: 'low',
  },
];

export default function IntakePage() {
  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-violet-500/20 rounded-xl flex items-center justify-center">
              <FileInput className="w-5 h-5 text-violet-400" />
            </div>
            <h1 className="text-3xl text-white">Intake</h1>
            <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30">
              Stage 1
            </Badge>
          </div>
          <p className="text-slate-400">
            Capture and organize initial project requirements
          </p>
        </div>
        <Button className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 shadow-lg shadow-violet-500/30">
          <Sparkles className="w-4 h-4 mr-2" />
          AI Assist
        </Button>
      </div>

      {/* Workflow Progress */}
      <WorkflowProgress currentStage={1} />

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Intake Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
            <h3 className="text-lg text-white mb-6 flex items-center gap-2">
              <FileInput className="w-5 h-5 text-violet-400" />
              New Intake Form
            </h3>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="project-name" className="text-slate-300">
                  Project Name
                </Label>
                <Input
                  id="project-name"
                  placeholder="Enter project name..."
                  className="bg-slate-800/50 border-slate-700 text-slate-200 placeholder:text-slate-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority" className="text-slate-300">
                    Priority Level
                  </Label>
                  <Select defaultValue="medium">
                    <SelectTrigger className="bg-slate-800/50 border-slate-700 text-slate-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800">
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category" className="text-slate-300">
                    Category
                  </Label>
                  <Select defaultValue="marketing">
                    <SelectTrigger className="bg-slate-800/50 border-slate-700 text-slate-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800">
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="product">Product</SelectItem>
                      <SelectItem value="design">Design</SelectItem>
                      <SelectItem value="engineering">Engineering</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-slate-300">
                  Project Description
                </Label>
                <Textarea
                  id="description"
                  placeholder="Describe your project requirements..."
                  className="bg-slate-800/50 border-slate-700 text-slate-200 placeholder:text-slate-500 min-h-32"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="objectives" className="text-slate-300">
                  Key Objectives
                </Label>
                <Textarea
                  id="objectives"
                  placeholder="List the main objectives and goals..."
                  className="bg-slate-800/50 border-slate-700 text-slate-200 placeholder:text-slate-500 min-h-24"
                />
              </div>

              {/* File Upload */}
              <div className="space-y-2">
                <Label className="text-slate-300">Supporting Documents</Label>
                <div className="border-2 border-dashed border-slate-700 rounded-lg p-8 text-center hover:border-violet-500/50 transition-colors cursor-pointer">
                  <Upload className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                  <p className="text-slate-300 mb-1">
                    Drop files here or click to upload
                  </p>
                  <p className="text-xs text-slate-500">
                    PDF, DOC, XLS up to 10MB
                  </p>
                </div>
              </div>

              {/* AI Suggestions */}
              <div className="bg-violet-500/10 border border-violet-500/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-violet-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-violet-300 mb-2">
                      AI Suggestion
                    </p>
                    <p className="text-sm text-slate-300">
                      Based on similar projects, consider adding stakeholder
                      interviews and competitor analysis to your research phase.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  Save as Draft
                </Button>
                <Button className="flex-1 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700">
                  Submit Intake
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* AI Insights */}
          <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
            <h3 className="text-lg text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-violet-400" />
              Quick Stats
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400 text-sm">Total Intakes</span>
                <span className="text-white">127</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400 text-sm">This Month</span>
                <span className="text-white">23</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-400 text-sm">Avg. Time</span>
                <span className="text-white">2.3 days</span>
              </div>
            </div>
          </div>

          {/* Recent Intakes */}
          <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
            <h3 className="text-lg text-white mb-4">Recent Intakes</h3>
            <div className="space-y-3">
              {recentIntakes.map((intake) => (
                <div
                  key={intake.id}
                  className="p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-sm text-slate-200 flex-1">
                      {intake.title}
                    </p>
                    {intake.status === 'completed' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    ) : (
                      <Clock className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      className={`text-xs ${
                        intake.priority === 'high'
                          ? 'bg-red-500/20 text-red-300 border-red-500/30'
                          : intake.priority === 'medium'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          : 'bg-slate-500/20 text-slate-300 border-slate-500/30'
                      }`}
                    >
                      {intake.priority}
                    </Badge>
                    <span className="text-xs text-slate-500">{intake.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
