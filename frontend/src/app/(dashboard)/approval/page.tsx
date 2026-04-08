'use client';

import {
  CheckCircle,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Clock,
  AlertTriangle,
  User,
  FileText,
} from 'lucide-react';
import { WorkflowProgress } from '@/components/WorkflowProgress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const approvalItems = [
  {
    id: 1,
    title: 'Marketing Campaign Assets',
    description: 'Complete set of marketing materials including banners, social posts, and email templates',
    submittedBy: 'SM',
    submittedDate: '2026-04-05',
    status: 'pending',
    priority: 'high',
    reviewers: ['JD', 'AK'],
    confidence: 92,
  },
  {
    id: 2,
    title: 'Product Documentation',
    description: 'Updated product documentation and user guides for Q2 release',
    submittedBy: 'RH',
    submittedDate: '2026-04-04',
    status: 'approved',
    priority: 'medium',
    reviewers: ['JD'],
    confidence: 88,
  },
  {
    id: 3,
    title: 'Video Content Package',
    description: 'Product demo videos and tutorial content',
    submittedBy: 'AK',
    submittedDate: '2026-04-03',
    status: 'changes-requested',
    priority: 'high',
    reviewers: ['SM', 'JD'],
    confidence: 76,
  },
];

const comments = [
  {
    id: 1,
    user: 'JD',
    text: 'The color scheme looks great! Just need minor adjustments to the CTA buttons.',
    time: '2 hours ago',
    type: 'feedback',
  },
  {
    id: 2,
    user: 'AI Assistant',
    text: 'Detected 3 potential accessibility issues. Suggested fixes have been generated.',
    time: '3 hours ago',
    type: 'ai',
  },
  {
    id: 3,
    user: 'SM',
    text: 'Approved the design direction. Ready to move forward.',
    time: '5 hours ago',
    type: 'approval',
  },
];

const aiChecks = [
  {
    id: 1,
    check: 'Brand Consistency',
    status: 'passed',
    score: 98,
  },
  {
    id: 2,
    check: 'Accessibility Compliance',
    status: 'warning',
    score: 85,
  },
  {
    id: 3,
    check: 'Content Quality',
    status: 'passed',
    score: 94,
  },
  {
    id: 4,
    check: 'Legal Compliance',
    status: 'passed',
    score: 100,
  },
];

export default function ApprovalPage() {
  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-violet-500/20 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-violet-400" />
            </div>
            <h1 className="text-3xl text-white">Approval</h1>
            <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30">
              Stage 4
            </Badge>
          </div>
          <p className="text-slate-400">
            Review and approve deliverables with AI assistance
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Add Comment
          </Button>
          <Button className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 shadow-lg shadow-violet-500/30">
            <Sparkles className="w-4 h-4 mr-2" />
            AI Review
          </Button>
        </div>
      </div>

      {/* Workflow Progress */}
      <WorkflowProgress currentStage={4} />

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-slate-400">Pending Review</p>
            <Clock className="w-5 h-5 text-amber-400" />
          </div>
          <p className="text-2xl text-white">3</p>
        </div>
        <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-slate-400">Approved</p>
            <CheckCircle className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-2xl text-white">15</p>
        </div>
        <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-slate-400">Changes Requested</p>
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <p className="text-2xl text-white">2</p>
        </div>
        <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-slate-400">AI Confidence</p>
            <Sparkles className="w-5 h-5 text-violet-400" />
          </div>
          <p className="text-2xl text-white">94%</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Approval Items */}
        <div className="lg:col-span-2 space-y-6">
          {approvalItems.map((item) => (
            <div
              key={item.id}
              className="bg-gradient-to-br from-slate-900/50 to-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6 hover:border-violet-500/30 transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg text-white">{item.title}</h3>
                    <Badge
                      className={`${
                        item.priority === 'high'
                          ? 'bg-red-500/20 text-red-300 border-red-500/30'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      }`}
                    >
                      {item.priority}
                    </Badge>
                    <Badge
                      className={`${
                        item.status === 'approved'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : item.status === 'pending'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          : 'bg-red-500/20 text-red-300 border-red-500/30'
                      }`}
                    >
                      {item.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-400 mb-3">
                    {item.description}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      Submitted by {item.submittedBy}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {item.submittedDate}
                    </span>
                  </div>
                </div>
              </div>

              {/* AI Confidence Score */}
              <div className="mb-4 p-3 bg-violet-500/10 border border-violet-500/20 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-violet-300 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    AI Confidence Score
                  </span>
                  <span className="text-sm text-violet-300">
                    {item.confidence}%
                  </span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-violet-500 to-purple-600 rounded-full"
                    style={{ width: `${item.confidence}%` }}
                  />
                </div>
              </div>

              {/* Reviewers */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-400">Reviewers:</span>
                  <div className="flex -space-x-2">
                    {item.reviewers.map((reviewer) => (
                      <Avatar key={reviewer} className="h-8 w-8 border-2 border-slate-900">
                        <AvatarFallback className="bg-violet-500/20 text-violet-300 text-xs">
                          {reviewer}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                </div>
                {item.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                    >
                      <ThumbsDown className="w-4 h-4 mr-2" />
                      Request Changes
                    </Button>
                    <Button
                      size="sm"
                      className="bg-emerald-500 hover:bg-emerald-600"
                    >
                      <ThumbsUp className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* AI Checks */}
          <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
            <h3 className="text-lg text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-violet-400" />
              AI Quality Checks
            </h3>
            <div className="space-y-4">
              {aiChecks.map((check) => (
                <div
                  key={check.id}
                  className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        check.status === 'passed'
                          ? 'bg-emerald-500/20'
                          : 'bg-amber-500/20'
                      }`}
                    >
                      {check.status === 'passed' ? (
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-slate-200">{check.check}</p>
                      <p className="text-xs text-slate-500">{check.score}%</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Comments */}
          <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
            <h3 className="text-lg text-white mb-4">Comments</h3>
            <div className="space-y-4 mb-4">
              {comments.map((comment) => (
                <div key={comment.id} className="pb-4 border-b border-slate-800 last:border-0">
                  <div className="flex items-start gap-3 mb-2">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="bg-violet-500/20 text-violet-300 text-xs">
                        {comment.type === 'ai' ? (
                          <Sparkles className="w-3 h-3" />
                        ) : (
                          comment.user.slice(0, 2)
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm text-slate-200">{comment.user}</p>
                        {comment.type === 'ai' && (
                          <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30 text-xs">
                            AI
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-400">{comment.text}</p>
                      <p className="text-xs text-slate-600 mt-1">
                        {comment.time}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Textarea
              placeholder="Add your feedback..."
              className="bg-slate-800/50 border-slate-700 text-slate-200 placeholder:text-slate-500 min-h-20"
            />
            <Button className="w-full mt-3 bg-violet-500 hover:bg-violet-600">
              Post Comment
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
