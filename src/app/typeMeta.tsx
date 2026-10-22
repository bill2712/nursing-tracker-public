import React from 'react';
import type { ActivityType } from './types';
import { BabyIcon, BathIcon, DropletIcon, FoodIcon, MilkIcon, MoonIcon, PumpIcon, SparklesIcon } from './components/Icons';

interface TypeMeta {
  /** Hex accent for charts and stripes. */
  color: string;
  /** Tailwind classes for the round icon badge. */
  badge: string;
  /** Tailwind classes for timeline blocks. */
  block: string;
  Icon: React.FC<{ className?: string }>;
}

export const TYPE_META: Record<ActivityType, TypeMeta> = {
  feeding: { color: '#ec4899', badge: 'bg-pink-100 text-pink-600 dark:bg-pink-900/40 dark:text-pink-300', block: 'bg-pink-200 text-pink-900 dark:bg-pink-900/70 dark:text-pink-100', Icon: MilkIcon },
  sleep: { color: '#6366f1', badge: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300', block: 'bg-indigo-200 text-indigo-900 dark:bg-indigo-900/70 dark:text-indigo-100', Icon: MoonIcon },
  bath: { color: '#0ea5e9', badge: 'bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-300', block: 'bg-sky-200 text-sky-900 dark:bg-sky-900/70 dark:text-sky-100', Icon: BathIcon },
  pumping: { color: '#06b6d4', badge: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300', block: 'bg-cyan-200 text-cyan-900 dark:bg-cyan-900/70 dark:text-cyan-100', Icon: PumpIcon },
  diaper: { color: '#10b981', badge: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300', block: 'bg-emerald-200 text-emerald-900 dark:bg-emerald-900/70 dark:text-emerald-100', Icon: BabyIcon },
  solids: { color: '#f97316', badge: 'bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-300', block: 'bg-orange-200 text-orange-900 dark:bg-orange-900/70 dark:text-orange-100', Icon: FoodIcon },
  clear_snot: { color: '#3b82f6', badge: 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300', block: 'bg-blue-200 text-blue-900 dark:bg-blue-900/70 dark:text-blue-100', Icon: DropletIcon },
  clean_mouth: { color: '#14b8a6', badge: 'bg-teal-100 text-teal-600 dark:bg-teal-900/40 dark:text-teal-300', block: 'bg-teal-200 text-teal-900 dark:bg-teal-900/70 dark:text-teal-100', Icon: SparklesIcon }
};

export const TypeIcon: React.FC<{ type: ActivityType; className?: string }> = ({ type, className = 'h-5 w-5' }) => {
  const Icon = (TYPE_META[type] ?? TYPE_META.diaper).Icon;
  return <Icon className={className} />;
};
