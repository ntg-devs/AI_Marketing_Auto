"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
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
  Plus,
  MoreHorizontal,
  Trash2,
  Eye,
  ListChecks,
  ArrowUpRight,
  Sparkles,
  XCircle,
  Timer,
  RotateCcw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  format,
  addDays,
  startOfWeek,
  isSameDay,
  isToday as isDateToday,
  isPast,
  isBefore,
} from "date-fns";
import { vi } from "date-fns/locale";
import { gooeyToast } from "goey-toast";
import { useSchedulerStore } from "@/store/useSchedulerStore";
import { useResearchStore } from "@/store/useResearchStore";
import { useAuthStore } from "@/store/useAuthStore";
import type {
  ScheduleJob,
  ScheduleJobStatus,
  SchedulePlatform,
} from "@/types/scheduler";

/* ─── Constants ────────────────────────────────────────────────── */

const weekDays = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const weekDaysFull = [
  "Thứ 2",
  "Thứ 3",
  "Thứ 4",
  "Thứ 5",
  "Thứ 6",
  "Thứ 7",
  "Chủ nhật",
];

const timeOptions = [
  "06:00",
  "06:30",
  "07:00",
  "07:30",
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
  "18:30",
  "19:00",
  "19:30",
  "20:00",
  "20:30",
  "21:00",
  "21:30",
  "22:00",
];

const platformConfig: Record<
  SchedulePlatform,
  {
    label: string;
    color: string;
    bgColor: string;
    borderColor: string;
    icon: string;
  }
> = {
  linkedin: {
    label: "LinkedIn",
    color: "text-sky-400",
    bgColor: "bg-sky-500/10",
    borderColor: "border-sky-500/25",
    icon: "🔷",
  },
  facebook: {
    label: "Facebook",
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/25",
    icon: "🔵",
  },
  blog: {
    label: "Blog",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/25",
    icon: "📝",
  },
};

const statusConfig: Record<
  ScheduleJobStatus,
  { icon: typeof Clock; color: string; bgColor: string; label: string }
> = {
  scheduled: {
    icon: Timer,
    color: "text-primary",
    bgColor: "bg-primary/10",
    label: "Đã lên lịch",
  },
  processing: {
    icon: Loader2,
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    label: "Đang xử lý",
  },
  published: {
    icon: CheckCircle2,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    label: "Đã đăng",
  },
  failed: {
    icon: AlertCircle,
    color: "text-red-400",
    bgColor: "bg-red-500/10",
    label: "Thất bại",
  },
  cancelled: {
    icon: XCircle,
    color: "text-gray-500",
    bgColor: "bg-gray-500/10",
    label: "Đã hủy",
  },
};

/* ─── Quick Scheduler Modal ─────────────────────────────────── */

function QuickScheduleForm({ onClose }: { onClose: () => void }) {
  const user = useAuthStore((s) => s.user);
  const activeJob = useResearchStore((s) => s.activeJob);
  const generatedContent = useResearchStore((s) => s.generatedContent);
  const { createSchedule, optimalSlots } = useSchedulerStore();

  const [title, setTitle] = useState("");
  const [scheduleMode, setScheduleMode] = useState<"single" | "all">("single");
  const [platform, setPlatform] = useState<SchedulePlatform>("linkedin");
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1); // Default: tomorrow
    return d;
  });
  const [selectedTime, setSelectedTime] = useState("09:00");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Per-platform times for "all" mode
  const [perPlatformTimes, setPerPlatformTimes] = useState<
    Record<SchedulePlatform, string>
  >({
    linkedin: "09:00",
    facebook: "14:00",
    blog: "10:00",
  });
  // Per-platform enabled states
  const [perPlatformEnabled, setPerPlatformEnabled] = useState<
    Record<SchedulePlatform, boolean>
  >({
    linkedin: true,
    facebook: true,
    blog: true,
  });

  // AI slot for current platform & date
  const getAiSlot = useCallback(
    (p: SchedulePlatform, date: Date) => {
      const dayOfWeek = date.getDay() === 0 ? 6 : date.getDay() - 1;
      return optimalSlots
        .filter((s) => s.platform === p && s.day_of_week === dayOfWeek)
        .sort((a, b) => b.score - a.score)[0];
    },
    [optimalSlots],
  );

  const aiSlot = useMemo(
    () => getAiSlot(platform, selectedDate),
    [platform, selectedDate, getAiSlot],
  );

  // Platforms that have generated content
  const platformsWithContent = useMemo(() => {
    return (Object.keys(platformConfig) as SchedulePlatform[]).filter(
      (p) => !!generatedContent[p],
    );
  }, [generatedContent]);

  // Auto-apply AI times when switching to "all" mode
  useEffect(() => {
    if (scheduleMode === "all") {
      const updated = { ...perPlatformTimes };
      for (const p of Object.keys(platformConfig) as SchedulePlatform[]) {
        const slot = getAiSlot(p, selectedDate);
        if (slot) updated[p] = slot.hour;
      }
      setPerPlatformTimes(updated);
    }
  }, [scheduleMode, selectedDate]);

  const handleSubmitSingle = async () => {
    if (!title.trim()) {
      gooeyToast.error("Vui lòng nhập tiêu đề bài đăng");
      return;
    }
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const scheduledAt = new Date(`${dateStr}T${selectedTime}:00`);
    if (isBefore(scheduledAt, new Date())) {
      gooeyToast.error("Thời gian phải nằm trong tương lai");
      return;
    }

    setIsSubmitting(true);
    try {
      const content = generatedContent[platform];
      await createSchedule({
        teamId: user?.team_id || activeJob?.job?.team_id || '123e4567-e89b-12d3-a456-426614174000',
        userId: user?.id || '123e4567-e89b-12d3-a456-426614174000',
        platform,
        title: title.trim(),
        contentHtml: content?.html || "",
        scheduledAt: scheduledAt.toISOString(),
      });
      gooeyToast.success(
        `✅ Đã lên lịch "${title}" cho ${platformConfig[platform].label}`,
      );
      onClose();
    } catch (error: any) {
      gooeyToast.error(error?.message || "Lên lịch thất bại");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitAll = async () => {
    const enabledPlatforms = (
      Object.keys(perPlatformEnabled) as SchedulePlatform[]
    ).filter((p) => perPlatformEnabled[p]);

    if (enabledPlatforms.length === 0) {
      gooeyToast.error("Vui lòng chọn ít nhất 1 nền tảng");
      return;
    }
    const baseTitle =
      title.trim() ||
      `Bài đăng ${new Date(selectedDate).toLocaleDateString("vi-VN")}`;

    setIsSubmitting(true);
    let success = 0;
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    try {
      for (const p of enabledPlatforms) {
        const scheduledAt = new Date(
          `${dateStr}T${perPlatformTimes[p]}:00`,
        );
        if (isBefore(scheduledAt, new Date())) continue;
        try {
          const content = generatedContent[p];
          await createSchedule({
            teamId: user?.team_id || activeJob?.job?.team_id || '00000000-0000-0000-0000-000000000000',
            userId: user?.id || '00000000-0000-0000-0000-000000000000',
            platform: p,
            title: `${baseTitle} — ${platformConfig[p].label}`,
            contentHtml: content?.html || "",
            scheduledAt: scheduledAt.toISOString(),
          });
          success++;
        } catch {
          /* continue */
        }
      }
      if (success > 0) {
        gooeyToast.success(
          `✅ Đã lên lịch ${success}/${enabledPlatforms.length} nền tảng thành công`,
        );
        onClose();
      } else {
        gooeyToast.error("Không thể lên lịch, vui lòng kiểm tra thời gian");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const enabledCount = (
    Object.keys(perPlatformEnabled) as SchedulePlatform[]
  ).filter((p) => perPlatformEnabled[p]).length;

  return (
    <div className="p-3 space-y-2.5">
      {/* Mode Tabs */}
      <div className="flex rounded-lg bg-surface-hover p-0.5">
        <button
          onClick={() => setScheduleMode("single")}
          className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-[10px] font-medium transition-all ${
            scheduleMode === "single"
              ? "bg-primary/15 text-primary shadow-sm"
              : "text-dim hover:text-body"
          }`}
        >
          <CalendarDays className="w-3 h-3" />
          Một nền tảng
        </button>
        <button
          onClick={() => setScheduleMode("all")}
          className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-[10px] font-medium transition-all ${
            scheduleMode === "all"
              ? "bg-gradient-to-r from-primary/15 to-purple-500/15 text-primary shadow-sm"
              : "text-dim hover:text-body"
          }`}
        >
          <Send className="w-3 h-3" />
          Tất cả nền tảng
        </button>
      </div>

      {/* Title */}
      <div>
        <label className="text-[9px] font-medium text-dim uppercase tracking-wider block mb-1">
          Tiêu đề bài đăng
        </label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={
            scheduleMode === "single"
              ? `VD: ${platformConfig[platform].label}: AI Marketing Guide`
              : "VD: Chiến dịch AI Marketing..."
          }
          className="w-full bg-surface-hover border border-default rounded-md px-2.5 py-1.5 text-[11px] text-heading placeholder:text-faint outline-none focus:border-primary/40 focus:bg-surface-active transition-colors"
          autoFocus
        />
      </div>

      {scheduleMode === "single" ? (
        <>
          {/* Platform Selection */}
          <div>
            <label className="text-[9px] font-medium text-dim uppercase tracking-wider block mb-1">
              Nền tảng
            </label>
            <div className="flex gap-1.5">
              {(Object.keys(platformConfig) as SchedulePlatform[]).map((p) => {
                const cfg = platformConfig[p];
                const hasContent = !!generatedContent[p];
                return (
                  <button
                    key={p}
                    onClick={() => setPlatform(p)}
                    className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-md text-[10px] font-medium border transition-all relative ${
                      platform === p
                        ? `${cfg.bgColor} ${cfg.borderColor} ${cfg.color}`
                        : "bg-surface-hover border-default text-dim hover:bg-surface-active"
                    }`}
                  >
                    <span>{cfg.icon}</span>
                    {cfg.label}
                    {hasContent && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date + Time */}
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-[9px] font-medium text-dim uppercase tracking-wider block mb-1">
                Ngày
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <button className="w-full text-left bg-surface-hover border border-default rounded-md px-2.5 py-1.5 text-[11px] text-heading outline-none focus:border-strong transition-all overflow-hidden whitespace-nowrap text-ellipsis">
                    {format(selectedDate, "dd/MM/yyyy (EEE)", { locale: vi })}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-surface-1 border-default" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(d) => d && setSelectedDate(d)}
                    disabled={(date) => isBefore(date, new Date())}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <label className="text-[9px] font-medium text-dim uppercase tracking-wider">
                  Giờ
                </label>
              </div>
              <select
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="w-full bg-surface-2 border border-default rounded-md px-2.5 py-1.5 text-[11px] text-heading outline-none focus:border-strong transition-all [color-scheme:dark]"
              >
                {timeOptions.map((t) => (
                  <option key={t} value={t} className="bg-surface-2 text-heading">
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* All Platforms Mode */}
          <div>
            <label className="text-[9px] font-medium text-dim uppercase tracking-wider block mb-1">
              Ngày đăng
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <button className="w-full text-left bg-surface-hover border border-default rounded-md px-2.5 py-1.5 text-[11px] text-heading outline-none focus:border-strong transition-all">
                  {format(selectedDate, "dd/MM/yyyy (EEE)", { locale: vi })}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-surface-1 border-default" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(d) => d && setSelectedDate(d)}
                  disabled={(date) => isBefore(date, new Date())}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <label className="text-[9px] font-medium text-dim uppercase tracking-wider block mb-1.5">
              Chọn nền tảng & giờ đăng
            </label>
            <div className="space-y-1.5">
              {(Object.keys(platformConfig) as SchedulePlatform[]).map((p) => {
                const cfg = platformConfig[p];
                const hasContent = !!generatedContent[p];
                const isEnabled = perPlatformEnabled[p];
                const pAiSlot = getAiSlot(p, selectedDate);

                return (
                  <div
                    key={p}
                    className={`flex items-center gap-2 px-2.5 py-2 rounded-lg border transition-all ${
                      isEnabled
                        ? `${cfg.bgColor} ${cfg.borderColor}`
                        : "bg-surface-0 border-subtle opacity-50"
                    }`}
                  >
                    {/* Checkbox */}
                    <button
                      onClick={() =>
                        setPerPlatformEnabled((prev) => ({
                          ...prev,
                          [p]: !prev[p],
                        }))
                      }
                      className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all ${
                        isEnabled
                          ? "bg-primary border-primary"
                          : "border-default bg-surface-hover"
                      }`}
                    >
                      {isEnabled && (
                        <CheckCircle2 className="w-3 h-3 text-white" />
                      )}
                    </button>

                    {/* Platform */}
                    <div className="flex items-center gap-1.5 w-20 shrink-0">
                      <span className="text-xs">{cfg.icon}</span>
                      <span
                        className={`text-[10px] font-medium ${isEnabled ? cfg.color : "text-dim"}`}
                      >
                        {cfg.label}
                      </span>
                    </div>

                    {/* Content status */}
                    {hasContent ? (
                      <Badge
                        variant="outline"
                        className="text-[7px] px-1 py-0 h-3.5 bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shrink-0"
                      >
                        AI ✓
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-[7px] px-1 py-0 h-3.5 border-default text-faint shrink-0"
                      >
                        Trống
                      </Badge>
                    )}

                    {/* Time picker (Premium Dropdown) */}
                    <div className="ml-auto shrink-0">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            disabled={!isEnabled}
                            className="h-6 w-20 px-1.5 py-0.5 text-[10px] bg-surface-2 border-default hover:bg-surface-active font-normal flex justify-between items-center [color-scheme:dark]"
                          >
                            {perPlatformTimes[p]}
                            <Clock className="w-2 h-2 opacity-50 ml-1" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-24 max-h-48 overflow-y-auto bg-surface-2 border-default">
                          {timeOptions.map((t) => (
                            <DropdownMenuItem
                              key={t}
                              onClick={() => setPerPlatformTimes(prev => ({ ...prev, [p]: t }))}
                              className={`text-[10px] flex justify-between items-center ${perPlatformTimes[p] === t ? 'bg-primary/10 text-primary font-medium' : ''}`}
                            >
                              {t}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>


                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-3 text-[10px] text-dim"
          onClick={onClose}
          disabled={isSubmitting}
        >
          Hủy
        </Button>
        <Button
          size="sm"
          className={`flex-1 h-8 text-[10px] ${
            scheduleMode === "all"
              ? "bg-gradient-to-r from-primary to-purple-500 text-white hover:from-primary/90 hover:to-purple-500/90"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          }`}
          onClick={
            scheduleMode === "single" ? handleSubmitSingle : handleSubmitAll
          }
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
          ) : (
            <Send className="w-3 h-3 mr-1" />
          )}
          {isSubmitting
            ? "Đang lên lịch..."
            : scheduleMode === "single"
              ? "Lên lịch"
              : `Lên lịch ${enabledCount} nền tảng`}
        </Button>
      </div>
    </div>
  );
}

/* ─── Job Card ─────────────────────────────────────────────────── */

function JobCard({ job }: { job: ScheduleJob }) {
  const {
    deleteSchedule,
    updateScheduleStatus,
    updateScheduleTime,
    setSelectedJobId,
    selectedJobId,
  } = useSchedulerStore();
  const config = statusConfig[job.status];
  const pConfig = platformConfig[job.platform];
  const StatusIcon = config.icon;
  const isSelected = selectedJobId === job.id;
  const scheduledDate = new Date(job.scheduled_at);
  const isOverdue = job.status === "scheduled" && isPast(scheduledDate);

  const formattedTime = format(scheduledDate, "HH:mm", { locale: vi });
  const formattedDate = isDateToday(scheduledDate)
    ? "Hôm nay"
    : format(scheduledDate, "dd/MM (EEE)", { locale: vi });

  const [editDate, setEditDate] = useState<Date>(scheduledDate);
  const [editTime, setEditTime] = useState(() => {
    const t = format(scheduledDate, "HH:mm");
    return timeOptions.includes(t) ? t : "09:00";
  });
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    setEditDate(new Date(job.scheduled_at));
    const t = format(new Date(job.scheduled_at), "HH:mm");
    if (timeOptions.includes(t)) setEditTime(t);
  }, [job.scheduled_at]);

  const handleSaveTime = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsUpdating(true);
    try {
      const dateStr = format(editDate, "yyyy-MM-dd");
      const newD = new Date(`${dateStr}T${editTime}:00`);
      await updateScheduleTime(job.id, newD.toISOString());
      gooeyToast.success("Đã cập nhật thời gian đăng bài");
      setSelectedJobId(null);
    } catch {
      gooeyToast.error("Không thể cập nhật thời gian");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRetry = async () => {
    try {
      await updateScheduleStatus(job.id, "scheduled");
      gooeyToast.success("Đã đặt lại trạng thái lên lịch");
    } catch {
      gooeyToast.error("Không thể đặt lại lịch");
    }
  };

  return (
    <div
      onClick={() => setSelectedJobId(isSelected ? null : job.id)}
      className={`rounded-lg border p-2.5 transition-all cursor-pointer group ${
        isSelected
          ? "border-primary/40 bg-primary/[0.04] shadow-[0_0_0_1px_rgba(var(--primary-rgb),0.1)]"
          : isOverdue
            ? "border-amber-500/30 bg-amber-500/[0.03] hover:bg-amber-500/[0.06]"
            : "border-default bg-surface-hover hover:bg-surface-active hover:border-strong"
      }`}
    >
      {/* Top Row: Platform + Status */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <span className="text-xs leading-none">{pConfig.icon}</span>
          <Badge
            variant="outline"
            className={`text-[8px] px-1 py-0 h-3.5 ${pConfig.borderColor} ${pConfig.color}`}
          >
            {pConfig.label}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <Badge
            variant="outline"
            className={`text-[8px] px-1.5 py-0 h-3.5 ${config.bgColor} border-transparent ${config.color}`}
          >
            <StatusIcon
              className={`w-2 h-2 mr-0.5 ${job.status === "processing" ? "animate-spin" : ""}`}
            />
            {config.label}
          </Badge>
          {/* Menu Dropdown */}
          {!isSelected && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                onClick={(e) => e.stopPropagation()}
                className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-surface-active text-dim hover:text-heading transition-all"
              >
                <MoreHorizontal className="w-3 h-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-40 bg-surface-1 border-default"
            >
              {job.status === "scheduled" && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    updateScheduleStatus(job.id, "processing");
                  }}
                  className="text-[10px] text-body"
                >
                  <Send className="w-3 h-3 mr-1.5" /> Đăng ngay
                </DropdownMenuItem>
              )}
              {job.status === "failed" && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRetry();
                  }}
                  className="text-[10px] text-body"
                >
                  <RotateCcw className="w-3 h-3 mr-1.5" /> Thử lại
                </DropdownMenuItem>
              )}
              {job.content_html && (
                <DropdownMenuItem
                  onClick={(e) => e.stopPropagation()}
                  className="text-[10px] text-body"
                >
                  <Eye className="w-3 h-3 mr-1.5" /> Xem nội dung
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator className="bg-default" />
              <DropdownMenuItem
                onClick={async (e) => {
                  e.stopPropagation();
                  try {
                    await deleteSchedule(job.id);
                    gooeyToast.success("Đã xóa lịch đăng bài");
                  } catch {
                    gooeyToast.error("Xóa thất bại");
                  }
                }}
                className="text-[10px] text-red-400 focus:text-red-400"
              >
                <Trash2 className="w-3 h-3 mr-1.5" /> Xóa
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          )}
        </div>
      </div>

      {/* Title */}
      <p className="text-[11px] text-heading font-medium leading-snug mb-1.5 line-clamp-2">
        {job.title}
      </p>

      {/* Bottom: Time + Progress / Edit Mode */}
      {!isSelected ? (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-[9px] text-dim">
            <Clock className="w-2.5 h-2.5" />
            <span className={isOverdue ? "text-amber-400 font-medium" : ""}>
              {formattedTime} · {formattedDate}
            </span>
            {isOverdue && (
              <Badge
                variant="outline"
                className="text-[7px] px-1 py-0 h-3 bg-amber-500/10 border-amber-500/20 text-amber-400 ml-1"
              >
                Quá hạn
              </Badge>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-2 pt-2 border-t border-default flex flex-col gap-2 cursor-default" onClick={(e) => e.stopPropagation()}>
          {job.status === "scheduled" ? (
            <>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="flex-1 text-left bg-surface-hover border border-default rounded px-2 py-1.5 text-[10px] text-heading outline-none focus:border-strong transition-all">
                      {format(editDate, "dd/MM/yyyy", { locale: vi })}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-surface-1 border-default" align="start">
                    <Calendar
                      mode="single"
                      selected={editDate}
                      onSelect={(d) => d && setEditDate(d)}
                    />
                  </PopoverContent>
                </Popover>
                <select 
                  value={editTime} 
                  onChange={e => setEditTime(e.target.value)} 
                  className="w-20 bg-surface-2 border border-default rounded px-2 py-1.5 text-[10px] text-heading outline-none focus:border-strong transition-all [color-scheme:dark]"
                >
                  {timeOptions.map(t => (
                    <option key={t} value={t} className="bg-surface-2 text-heading">
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-1.5 justify-end mt-1">
                <Button size="sm" variant="ghost" className="h-6 px-2.5 text-[9px] text-dim hover:text-heading" onClick={(e) => { e.stopPropagation(); setSelectedJobId(null); }}>
                  Hủy
                </Button>
                <Button size="sm" className="h-6 px-2.5 text-[9px] bg-primary text-primary-foreground hover:bg-primary/90 transition-colors" disabled={isUpdating} onClick={handleSaveTime}>
                  {isUpdating ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <CheckCircle2 className="w-3 h-3 mr-1"/>} Lưu thay đổi
                </Button>
              </div>
            </>
          ) : (
             <div className="flex items-center justify-between mt-1">
                <span className="text-[10px] text-dim flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {formattedTime} · {formattedDate}
                </span>
                <Button size="sm" variant="ghost" className="h-6 px-2.5 text-[9px] text-dim hover:text-heading" onClick={(e) => { e.stopPropagation(); setSelectedJobId(null); }}>
                  Đóng
                </Button>
             </div>
          )}
        </div>
      )}

      {/* Processing progress bar */}
      {job.status === "processing" && (
        <div className="mt-2 h-0.5 bg-surface-hover rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-400/60 to-amber-400 rounded-full animate-pulse"
            style={{ width: "65%" }}
          />
        </div>
      )}
    </div>
  );
}

/* ─── Main Component ───────────────────────────────────────────── */

export default function SmartSchedulerModule() {
  const user = useAuthStore((s) => s.user);
  const {
    jobs,
    optimalSlots,
    currentWeekOffset,
    setCurrentWeekOffset,
    filterPlatform,
    setFilterPlatform,
    publishAllDue,
    fetchSchedules,
    getStats,
  } = useSchedulerStore();

  // Fetch schedules on mount
  useEffect(() => {
    if (user?.team_id) {
      fetchSchedules(user.team_id);
    }
  }, [user?.team_id]);

  // Calculate week dates
  const weekDates = useMemo(() => {
    const today = new Date();
    const start = startOfWeek(today, { weekStartsOn: 1 });
    start.setDate(start.getDate() + currentWeekOffset * 7);
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [currentWeekOffset]);

  // Stats
  const stats = useMemo(() => getStats(), [jobs]);

  // Filtered + sorted jobs
  const filteredJobs = useMemo(() => {
    let result = [...jobs];
    if (filterPlatform !== "all") {
      result = result.filter((j) => j.platform === filterPlatform);
    }
    // Sort: processing first, then scheduled (nearest first), then others
    result.sort((a, b) => {
      const order: Record<string, number> = {
        processing: 0,
        scheduled: 1,
        failed: 2,
        published: 3,
        cancelled: 4,
      };
      const oa = order[a.status] ?? 5;
      const ob = order[b.status] ?? 5;
      if (oa !== ob) return oa - ob;
      return (
        new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
      );
    });
    return result;
  }, [jobs, filterPlatform]);

  // Get jobs count for a specific date
  const getJobsCountForDate = useCallback(
    (date: Date) => {
      return jobs.filter((j) => isSameDay(new Date(j.scheduled_at), date))
        .length;
    },
    [jobs],
  );

  // Get slots for a specific day of week
  const getSlotsForDate = useCallback(
    (date: Date) => {
      const dayOfWeek = date.getDay() === 0 ? 6 : date.getDay() - 1;
      return optimalSlots.filter((s) => s.day_of_week === dayOfWeek);
    },
    [optimalSlots],
  );

  // Pending count for publish-all button
  const pendingCount = useMemo(() => {
    const now = new Date();
    return jobs.filter(
      (j) => j.status === "scheduled" && isPast(new Date(j.scheduled_at)),
    ).length;
  }, [jobs]);

  return (
    <div className="flex flex-col h-full">
      {/* Module Header */}
      <div className="px-3 py-2.5 border-b border-default shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-semibold text-heading/80 uppercase tracking-wider">
              Lịch đăng bài
            </h3>
            <p className="text-[9px] text-dim mt-0.5">
              Tự động phân phối nội dung đa nền tảng
            </p>
          </div>

          {/* Stats Pills */}
          {jobs.length > 0 && (
            <div className="flex gap-1.5 mt-2">
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                <Timer className="w-2.5 h-2.5" />
                <span className="text-[8px] font-medium tabular-nums">
                  {stats.scheduled}
                </span>
              </div>
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
                <CheckCircle2 className="w-2.5 h-2.5" />
                <span className="text-[8px] font-medium tabular-nums">
                  {stats.published}
                </span>
              </div>
              {stats.failed > 0 && (
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-500/10 text-red-400">
                  <AlertCircle className="w-2.5 h-2.5" />
                  <span className="text-[8px] font-medium tabular-nums">
                    {stats.failed}
                  </span>
                </div>
              )}
              <div className="ml-auto flex items-center gap-1 text-[8px] text-dim">
                Tổng: {stats.total}
              </div>
            </div>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3">
          {/* ═══ Mini Calendar + AI Optimal Times ═══ */}
          <div className="rounded-lg border border-default bg-surface-hover/50 p-2.5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <CalendarDays className="w-3 h-3 text-primary" />
                <span className="text-[10px] font-medium text-body">
                  Tổng quan tuần
                </span>
              </div>
              <div className="flex items-center gap-0.5">
                <button
                  onClick={() => setCurrentWeekOffset(currentWeekOffset - 1)}
                  className="p-0.5 rounded hover:bg-surface-active text-dim hover:text-heading transition-colors"
                >
                  <ChevronLeft className="w-3 h-3" />
                </button>
                <button
                  onClick={() => setCurrentWeekOffset(0)}
                  className={`text-[9px] px-1.5 py-0.5 rounded transition-colors ${
                    currentWeekOffset === 0
                      ? "text-primary font-medium"
                      : "text-dim hover:text-body hover:bg-surface-active"
                  }`}
                >
                  {currentWeekOffset === 0
                    ? "Tuần này"
                    : `Tuần ${currentWeekOffset > 0 ? "+" : ""}${currentWeekOffset}`}
                </button>
                <button
                  onClick={() => setCurrentWeekOffset(currentWeekOffset + 1)}
                  className="p-0.5 rounded hover:bg-surface-active text-dim hover:text-heading transition-colors"
                >
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Week Grid */}
            <div className="grid grid-cols-7 gap-1">
              {weekDates.map((date, idx) => {
                const isToday = isDateToday(date);
                const jobCount = getJobsCountForDate(date);
                const slots = getSlotsForDate(date);
                return (
                  <div key={idx} className="text-center">
                    <span className="text-[8px] text-faint block mb-0.5">
                      {weekDays[idx]}
                    </span>
                    <div
                      className={`w-full aspect-square rounded-md flex flex-col items-center justify-center transition-all relative ${
                        isToday
                          ? "bg-primary/20 border border-primary/40 shadow-[0_0_8px_rgba(var(--primary-rgb),0.15)]"
                          : "bg-surface-hover border border-subtle hover:border-strong hover:bg-surface-active"
                      }`}
                    >
                      <span
                        className={`text-[10px] font-medium ${
                          isToday ? "text-primary" : "text-label"
                        }`}
                      >
                        {format(date, "d")}
                      </span>
                      {/* Indicators */}
                      <div className="flex gap-0.5 mt-0.5">
                        {slots.length > 0 && (
                          <span
                            className="w-1 h-1 rounded-full bg-amber-400"
                            title="AI optimal"
                          />
                        )}
                        {jobCount > 0 && (
                          <span
                            className="w-1 h-1 rounded-full bg-primary"
                            title={`${jobCount} bài`}
                          />
                        )}
                      </div>
            {/* Job count badge */}
                      {jobCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-primary text-[7px] text-white font-bold flex items-center justify-center">
                          {jobCount}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ═══ Platform Filter ═══ */}
          <div className="flex items-center gap-1 bg-surface-hover/30 p-1 rounded-lg border border-default/50">
            <button
              onClick={() => setFilterPlatform("all")}
              className={`px-3 py-1.5 rounded-md text-[10px] font-semibold transition-all flex items-center gap-1.5 ${
                filterPlatform === "all"
                  ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                  : "text-dim hover:text-body hover:bg-surface-hover"
              }`}
            >
              <ListChecks className="w-3 h-3" />
              Tất cả
            </button>
            <div className="w-px h-4 bg-default/50 mx-0.5" />
            {(Object.keys(platformConfig) as SchedulePlatform[]).map((p) => {
              const cfg = platformConfig[p];
              const count = jobs.filter((j) => j.platform === p).length;
              const isActive = filterPlatform === p;
              return (
                <button
                  key={p}
                  onClick={() =>
                    setFilterPlatform(isActive ? "all" : p)
                  }
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[10px] font-medium transition-all group ${
                    isActive
                      ? `${cfg.bgColor} ${cfg.color} ${cfg.borderColor} border`
                      : "text-dim hover:text-body hover:bg-surface-hover border border-transparent"
                  }`}
                >
                  <span className={`text-xs transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                    {cfg.icon}
                  </span>
                  <span className="hidden sm:inline-block">{cfg.label}</span>
                  {count > 0 && (
                    <span className={`ml-0.5 tabular-nums px-1 rounded-full text-[8px] ${isActive ? 'bg-current/20' : 'bg-surface-active text-dim group-hover:text-body'}`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* ═══ Job Queue ═══ */}
          <div>
            <h4 className="text-[10px] font-medium text-dim uppercase tracking-wider mb-2 px-0.5 flex items-center gap-1.5">
              <ListChecks className="w-3 h-3" />
              Hàng đợi ({filteredJobs.length})
            </h4>

            {filteredJobs.length === 0 ? (
              <div className="rounded-lg border border-dashed border-default bg-surface-hover/30 p-6 text-center">
                <CalendarDays className="w-8 h-8 text-faint mx-auto mb-2 opacity-40" />
                <p className="text-[11px] text-dim mb-1">
                  Chưa có lịch đăng bài nào
                </p>
                <p className="text-[9px] text-faint mb-3">
                  Tự động hoá phân phối bài viết thông minh từ Live Research
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {filteredJobs.map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
            )}
          </div>

          {/* ═══ Distribute CTA ═══ */}
          {pendingCount > 0 && (
            <Button
              onClick={async () => {
                try {
                  const count = await publishAllDue();
                  gooeyToast.success(
                    `✅ Đã xử lý ${count} bài đăng thành công!`,
                  );
                } catch {
                  gooeyToast.error("Đăng bài thất bại, vui lòng thử lại");
                }
              }}
              className="w-full h-8 text-[11px] bg-gradient-to-r from-primary/20 to-purple-500/20 hover:from-primary/30 hover:to-purple-500/30 text-primary border border-primary/20 transition-all"
            >
              <Send className="w-3 h-3 mr-1.5" />
              Đăng tất cả quá hạn ({pendingCount})
            </Button>
          )}

          {jobs.length > 0 && pendingCount === 0 && stats.scheduled > 0 && (
            <div className="rounded-lg border border-emerald-500/15 bg-emerald-500/[0.04] p-2.5 text-center">
              <div className="flex items-center justify-center gap-1.5 text-emerald-400 mb-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span className="text-[10px] font-medium">
                  Tất cả đã lên lịch
                </span>
              </div>
              <p className="text-[9px] text-dim">
                {stats.scheduled} bài sẽ được tự động đăng theo lịch
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
