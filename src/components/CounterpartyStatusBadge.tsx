import React from 'react';
import { CounterpartyStatus } from '../types';

export const STATUS_CONFIG: Record<
  CounterpartyStatus,
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  bill_sent: {
    label: 'Выставил счет',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    dot: 'bg-blue-500',
  },
  bill_later: {
    label: 'Выставить чуть позже',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
  },
  paid: {
    label: 'Оплата пришла',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
  },
  paused: {
    label: 'Пауза',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    dot: 'bg-purple-400',
  },
  in_progress: {
    label: 'В работе',
    bg: 'bg-sky-50',
    text: 'text-sky-700',
    border: 'border-sky-200',
    dot: 'bg-sky-500',
  },
  cancelled: {
    label: 'Отменено',
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
  },
};

interface CounterpartyStatusBadgeProps {
  status: CounterpartyStatus;
  size?: 'sm' | 'md';
  onClick?: () => void;
  clickable?: boolean;
}

export const CounterpartyStatusBadge: React.FC<CounterpartyStatusBadgeProps> = ({
  status,
  size = 'md',
  onClick,
  clickable = false,
}) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.bill_later;

  return (
    <span
      onClick={onClick}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      className={`inline-flex items-center gap-1.5 rounded-md border font-medium whitespace-nowrap transition-colors ${
        config.bg
      } ${config.text} ${config.border} ${
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs sm:text-sm'
      } ${clickable ? 'cursor-pointer hover:opacity-85 active:scale-95' : ''}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <span>{config.label}</span>
    </span>
  );
};
