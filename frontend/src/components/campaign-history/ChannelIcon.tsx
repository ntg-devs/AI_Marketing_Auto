'use client';

import type { DistributionChannel } from '@/types/campaignHistory';

interface ChannelIconProps {
  channel: DistributionChannel;
  size?: 'sm' | 'md';
}

const channelConfig: Record<
  DistributionChannel,
  { label: string; bg: string; text: string; icon: React.ReactNode }
> = {
  facebook: {
    label: 'Facebook',
    bg: 'bg-blue-500/12',
    text: 'text-blue-400',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  linkedin: {
    label: 'LinkedIn',
    bg: 'bg-sky-500/12',
    text: 'text-sky-400',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
  blog: {
    label: 'Blog',
    bg: 'bg-emerald-500/12',
    text: 'text-emerald-400',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
        <path d="M12 20h9" />
        <path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z" />
      </svg>
    ),
  },
};

export default function ChannelIcon({ channel, size = 'md' }: ChannelIconProps) {
  const config = channelConfig[channel];
  const sizeClasses = size === 'sm' ? 'w-6 h-6 p-1' : 'w-8 h-8 p-1.5';

  return (
    <div
      className={`${sizeClasses} ${config.bg} ${config.text} rounded-lg flex items-center justify-center shrink-0 transition-colors`}
      title={config.label}
    >
      {config.icon}
    </div>
  );
}

export { channelConfig };
