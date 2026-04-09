'use client';

import { useState } from 'react';
import {
  Clock,
  Zap,
  CheckCircle2,
  Loader2,
  Send,
  AlertCircle,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';

type JobStatus = 'pending' | 'processing' | 'published' | 'failed';

interface ScheduleSlot {
  id: string;
  day: number;
  hour: string;
  platform: string;
  score: number;
  isBestTime: boolean;
}

interface Job {
  id: string;
  title: string;
  platform: string;
  status: JobStatus;
  scheduledAt: string;
  progress?: number;
}

const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const mockSlots: ScheduleSlot[] = [
  { id: '1', day: 0, hour: '09:00', platform: 'LinkedIn', score: 95, isBestTime: true },
  { id: '2', day: 0, hour: '14:00', platform: 'Facebook', score: 82, isBestTime: true },
  { id: '3', day: 1, hour: '10:00', platform: 'Blog', score: 88, isBestTime: true },
  { id: '4', day: 2, hour: '08:30', platform: 'LinkedIn', score: 91, isBestTime: true },
  { id: '5', day: 3, hour: '15:00', platform: 'Facebook', score: 78, isBestTime: false },
  { id: '6', day: 4, hour: '11:00', platform: 'Blog', score: 85, isBestTime: true },
  { id: '7', day: 5, hour: '13:00', platform: 'LinkedIn', score: 72, isBestTime: false },
];

const mockJobs: Job[] = [
  {
    id: '1',
    title: 'LinkedIn: AI Marketing Guide',
    platform: 'linkedin',
    status: 'published',
    scheduledAt: 'Today, 09:00 AM',
  },
  {
    id: '2',
    title: 'Facebook: Weekly Tips Post',
    platform: 'facebook',
    status: 'processing',
    scheduledAt: 'Today, 02:00 PM',
    progress: 65,
  },
  {
    id: '3',
    title: 'Blog: Complete Guide v2',
    platform: 'blog',
    status: 'pending',
    scheduledAt: 'Tomorrow, 10:00 AM',
  },
  {
    id: '4',
    title: 'LinkedIn: Case Study',
    platform: 'linkedin',
    status: 'pending',
    scheduledAt: 'Wed, 08:30 AM',
  },
];

const statusConfig: Record<
  JobStatus,
  { icon: typeof Clock; color: string; label: string }
> = {
  pending: {
    icon: Clock,
    color: 'text-slate-400',
    label: 'Pending',
  },
  processing: {
    icon: Loader2,
    color: 'text-amber-400',
    label: 'Processing',
  },
  published: {
    icon: CheckCircle2,
    color: 'text-emerald-400',
    label: 'Published',
  },
  failed: {
    icon: AlertCircle,
    color: 'text-red-400',
    label: 'Failed',
  },
};

export default function SmartSchedulerModule() {
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);

  const getDateForDay = (dayIndex: number) => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1 + currentWeekOffset * 7);
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + dayIndex);
    return date.getDate();
  };

  const isToday = (dayIndex: number) => {
    if (currentWeekOffset !== 0) return false;
    const today = new Date();
    const todayDayOfWeek = today.getDay() === 0 ? 6 : today.getDay() - 1;
    return dayIndex === todayDayOfWeek;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Module Header */}
      <div className="px-4 py-3 border-b border-white/[0.06]">
        <h3 className="text-xs font-semibold text-white/80 uppercase tracking-wider">
          Scheduler
        </h3>
        <p className="text-[10px] text-slate-500 mt-0.5">
          Distribution & Queue
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3">
          {/* Mini Calendar */}
          <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <CalendarDays className="w-3 h-3 text-indigo-400" />
                <span className="text-[10px] font-medium text-slate-300">
                  Best Times
                </span>
              </div>
              <div className="flex items-center gap-0.5">
                <button
                  onClick={() => setCurrentWeekOffset((p) => p - 1)}
                  className="p-0.5 rounded hover:bg-white/[0.06] text-slate-500"
                >
                  <ChevronLeft className="w-3 h-3" />
                </button>
                <span className="text-[9px] text-slate-500 px-1">
                  {currentWeekOffset === 0 ? 'This Week' : `Week ${currentWeekOffset > 0 ? '+' : ''}${currentWeekOffset}`}
                </span>
                <button
                  onClick={() => setCurrentWeekOffset((p) => p + 1)}
                  className="p-0.5 rounded hover:bg-white/[0.06] text-slate-500"
                >
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Week Grid */}
            <div className="grid grid-cols-7 gap-1">
              {weekDays.map((day, idx) => (
                <div key={day} className="text-center">
                  <span className="text-[8px] text-slate-600 block mb-1">
                    {day}
                  </span>
                  <div
                    className={`w-full aspect-square rounded-md flex flex-col items-center justify-center transition-colors ${
                      isToday(idx)
                        ? 'bg-indigo-500/20 border border-indigo-500/30'
                        : 'bg-white/[0.02] border border-white/[0.04]'
                    }`}
                  >
                    <span
                      className={`text-[10px] font-medium ${
                        isToday(idx) ? 'text-indigo-300' : 'text-slate-400'
                      }`}
                    >
                      {getDateForDay(idx)}
                    </span>
                    {mockSlots.filter((s) => s.day === idx).length > 0 && (
                      <div className="flex gap-0.5 mt-0.5">
                        {mockSlots
                          .filter((s) => s.day === idx)
                          .map((s) => (
                            <span
                              key={s.id}
                              className={`w-1 h-1 rounded-full ${
                                s.isBestTime ? 'bg-emerald-400' : 'bg-slate-500'
                              }`}
                            />
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Best Time Slots */}
            <div className="mt-2 space-y-1">
              {mockSlots
                .filter((s) => s.isBestTime)
                .slice(0, 3)
                .map((slot) => (
                  <div
                    key={slot.id}
                    className="flex items-center justify-between py-1 px-1.5 rounded bg-white/[0.02]"
                  >
                    <div className="flex items-center gap-1.5">
                      <Zap className="w-2.5 h-2.5 text-amber-400" />
                      <span className="text-[10px] text-slate-300">
                        {weekDays[slot.day]} {slot.hour}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge
                        variant="outline"
                        className="text-[8px] px-1 py-0 h-3.5 border-white/[0.08] text-slate-400"
                      >
                        {slot.platform}
                      </Badge>
                      <span className="text-[9px] text-emerald-400 font-medium">
                        {slot.score}%
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Job Queue */}
          <div>
            <h4 className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-2 px-1">
              Job Queue
            </h4>
            <div className="space-y-1.5">
              {mockJobs.map((job) => {
                const config = statusConfig[job.status];
                const StatusIcon = config.icon;
                return (
                  <div
                    key={job.id}
                    className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5"
                  >
                    <div className="flex items-start justify-between mb-1">
                      <p className="text-[11px] text-slate-200 font-medium leading-snug flex-1 mr-2">
                        {job.title}
                      </p>
                      <StatusIcon
                        className={`w-3.5 h-3.5 shrink-0 ${config.color} ${
                          job.status === 'processing' ? 'animate-spin' : ''
                        }`}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] text-slate-500">
                        {job.scheduledAt}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-[8px] px-1.5 py-0 h-3.5 border-white/[0.08] ${config.color}`}
                      >
                        {config.label}
                      </Badge>
                    </div>
                    {job.status === 'processing' && job.progress && (
                      <div className="mt-1.5 h-0.5 bg-white/[0.04] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-400/60 rounded-full transition-all duration-500"
                          style={{ width: `${job.progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Distribute CTA */}
          <Button className="w-full h-8 text-[11px] bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/20">
            <Send className="w-3 h-3 mr-1.5" />
            Distribute All Pending
          </Button>
        </div>
      </ScrollArea>
    </div>
  );
}
