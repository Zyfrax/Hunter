import React from 'react';
import { Milestone } from '../types';
import { formatCurrency } from '../utils/formatters';
import { CheckCircle2, Clock, CircleDot, ChevronRight } from 'lucide-react';

interface MilestonesTrackerProps {
  milestones?: Milestone[];
  currency?: 'RUB' | 'KZT' | 'USD' | 'EUR';
  compact?: boolean;
  onToggleMilestoneStatus?: (milestoneId: string, nextStatus: 'pending' | 'invoiced' | 'paid') => void;
}

export const MilestonesTracker: React.FC<MilestonesTrackerProps> = ({
  milestones = [],
  currency = 'RUB',
  compact = false,
  onToggleMilestoneStatus,
}) => {
  if (!milestones || milestones.length === 0) {
    return null;
  }

  const paidCount = milestones.filter((m) => m.status === 'paid').length;
  const progressPercent = Math.round((paidCount / milestones.length) * 100);

  const getNextStatus = (current: 'pending' | 'invoiced' | 'paid'): 'pending' | 'invoiced' | 'paid' => {
    if (current === 'pending') return 'invoiced';
    if (current === 'invoiced') return 'paid';
    return 'pending';
  };

  if (compact) {
    return (
      <div className="flex flex-col gap-1 w-full max-w-[200px]">
        <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
          <span>Этапы: {paidCount}/{milestones.length}</span>
          <span className="font-semibold text-slate-700">{progressPercent}%</span>
        </div>
        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden flex">
          {milestones.map((m, idx) => {
            const isPaid = m.status === 'paid';
            const isInvoiced = m.status === 'invoiced';
            return (
              <div
                key={m.id || idx}
                title={`${m.title}: ${formatCurrency(m.amount, currency)} (${isPaid ? 'Оплачен' : isInvoiced ? 'Счет выставлен' : 'Ожидает'})`}
                className={`h-full flex-1 transition-colors border-r border-white last:border-0 ${
                  isPaid ? 'bg-emerald-500' : isInvoiced ? 'bg-blue-400' : 'bg-slate-200'
                }`}
              />
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-slate-700">
          Этапы договора ({paidCount} из {milestones.length} закрыто)
        </span>
        <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[11px] font-bold">
          {progressPercent}% завершено
        </span>
      </div>

      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden flex">
        {milestones.map((m, idx) => (
          <div
            key={m.id || idx}
            className={`h-full flex-1 transition-all border-r border-white last:border-0 ${
              m.status === 'paid'
                ? 'bg-emerald-500'
                : m.status === 'invoiced'
                ? 'bg-blue-500'
                : 'bg-slate-300'
            }`}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 pt-1">
        {milestones.map((m) => {
          const isPaid = m.status === 'paid';
          const isInvoiced = m.status === 'invoiced';

          return (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                if (onToggleMilestoneStatus) {
                  onToggleMilestoneStatus(m.id, getNextStatus(m.status));
                }
              }}
              title="Нажмите, чтобы переключить статус этапа"
              className={`text-left p-2 rounded-lg border text-xs transition-all cursor-pointer flex items-center justify-between ${
                isPaid
                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900 hover:bg-emerald-100/80'
                  : isInvoiced
                  ? 'bg-blue-50/80 border-blue-200 text-blue-900 hover:bg-blue-100/80'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="min-w-0 pr-1">
                <div className="font-semibold truncate">{m.title}</div>
                <div className="text-[11px] opacity-80">{formatCurrency(m.amount, currency)}</div>
              </div>

              <div className="shrink-0">
                {isPaid ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : isInvoiced ? (
                  <Clock className="w-4 h-4 text-blue-600" />
                ) : (
                  <CircleDot className="w-4 h-4 text-slate-400" />
                )}
              </div>
            </button>
          );
        })}
      </div>
      <div className="text-[10px] text-slate-400 flex items-center gap-1 justify-end">
        <span>Кликните на этап для переключения: Ожидает → Выставлен → Оплачен</span>
      </div>
    </div>
  );
};
