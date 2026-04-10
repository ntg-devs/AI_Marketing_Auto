'use client';

import type { CampaignStatus } from '@/types/campaignHistory';
import { CheckCircle, Clock, XCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: CampaignStatus;
}

const statusConfig: Record<
  CampaignStatus,
  { label: string; dotClass: string; textClass: string; bgClass: string; icon: React.ReactNode }
> = {
  success: {
    label: 'Success',
    dotClass: 'bg-emerald-400',
    textClass: 'text-emerald-400',
    bgClass: 'bg-emerald-500/10 border-emerald-500/20',
    icon: <CheckCircle className="w-3 h-3" />,
  },
  scheduled: {
    label: 'Scheduled',
    dotClass: 'bg-amber-400',
    textClass: 'text-amber-400',
    bgClass: 'bg-amber-500/10 border-amber-500/20',
    icon: <Clock className="w-3 h-3" />,
  },
  failed: {
    label: 'Failed',
    dotClass: 'bg-red-400',
    textClass: 'text-red-400',
    bgClass: 'bg-red-500/10 border-red-500/20',
    icon: <XCircle className="w-3 h-3" />,
  },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-medium border ${config.bgClass} ${config.textClass} transition-colors`}
    >
      {config.icon}
      {config.label}
    </span>
  );
}
