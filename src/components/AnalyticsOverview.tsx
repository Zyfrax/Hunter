import React, { useMemo } from 'react';
import { Counterparty, Task } from '../types';
import { formatCurrency } from '../utils/formatters';
import { getTaskUrgency } from '../utils/taskUtils';
import { 
  Banknote, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  Flame, 
  CalendarClock, 
  PauseCircle, 
  Building2 
} from 'lucide-react';

interface AnalyticsOverviewProps {
  counterparties: Counterparty[];
  tasks: Task[];
  onOpenTasksTab: () => void;
  onOpenCounterpartiesTab: () => void;
}

export const AnalyticsOverview: React.FC<AnalyticsOverviewProps> = ({
  counterparties,
  tasks,
  onOpenTasksTab,
  onOpenCounterpartiesTab,
}) => {
  // Financial metrics
  const fin = useMemo(() => {
    let paidRub = 0;
    let sentRub = 0;
    let laterRub = 0;
    let pausedRub = 0;

    let kztTotal = 0;

    counterparties.forEach((cp) => {
      const amt = cp.amount || 0;
      if (cp.currency === 'KZT') {
        kztTotal += amt;
      } else {
        if (cp.status === 'paid') {
          paidRub += amt;
        } else if (cp.status === 'bill_sent') {
          sentRub += amt;
        } else if (cp.status === 'bill_later') {
          laterRub += amt;
        } else if (cp.status === 'paused') {
          pausedRub += amt;
        }
      }
    });

    const totalRub = paidRub + sentRub + laterRub + pausedRub;

    return { paidRub, sentRub, laterRub, pausedRub, totalRub, kztTotal };
  }, [counterparties]);

  // Tasks metrics
  const taskStats = useMemo(() => {
    let overdue = 0;
    let today = 0;
    let approaching = 0;
    let recurring = 0;
    let completed = 0;
    let total = tasks.length;

    tasks.forEach((t) => {
      if (t.status === 'done') {
        completed++;
      } else {
        const u = getTaskUrgency(t);
        if (u.level === 'overdue') overdue++;
        if (u.level === 'today') today++;
        if (u.isApproaching) approaching++;
        if (t.isRecurring) recurring++;
      }
    });

    return { overdue, today, approaching, recurring, completed, total, active: total - completed };
  }, [tasks]);

  return (
    <div className="space-y-6">
      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Paid */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
              Оплата пришла
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {formatCurrency(fin.paidRub, 'RUB')}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Успешно закрытые этапы и поступления
          </p>
        </div>

        {/* Bill sent */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-800">
              Выставлен счет
            </span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {formatCurrency(fin.sentRub, 'RUB')}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Ожидается оплата от клиентов
          </p>
        </div>

        {/* Bill later */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-800">
              Выставить чуть позже
            </span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {formatCurrency(fin.laterRub, 'RUB')}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Планируемые счета на будущие даты
          </p>
        </div>

        {/* Total portfolio */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
              Общий портфель
            </span>
            <div className="p-2 bg-slate-100 text-slate-600 rounded-lg">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {formatCurrency(fin.totalRub, 'RUB')}
          </div>
          {fin.kztTotal > 0 && (
            <p className="text-xs text-slate-500 mt-1">
              + {formatCurrency(fin.kztTotal, 'KZT')} (валютные контракты)
            </p>
          )}
        </div>
      </div>

      {/* Task Urgency & Recurrence Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tasks Deadlines & Urgency Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                <Flame className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900">Контроль сроков задач</h3>
                <p className="text-xs text-slate-500">Задачи с подходящим дедлайном всегда на виду</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onOpenTasksTab}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800"
            >
              Перейти к задачам →
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-center">
              <div className="text-2xl font-bold text-rose-700">{taskStats.overdue}</div>
              <div className="text-xs font-medium text-rose-800 mt-0.5">Просрочено</div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-center">
              <div className="text-2xl font-bold text-amber-800">{taskStats.today}</div>
              <div className="text-xs font-medium text-amber-900 mt-0.5">Сегодня</div>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-center">
              <div className="text-2xl font-bold text-blue-700">{taskStats.recurring}</div>
              <div className="text-xs font-medium text-blue-800 mt-0.5">Регулярных</div>
            </div>
          </div>

          <div className="pt-2 text-xs text-slate-600 space-y-2">
            <div className="flex items-center justify-between py-1 border-b border-slate-100">
              <span>Активных задач в работе:</span>
              <strong className="text-slate-900 font-semibold">{taskStats.active}</strong>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-100">
              <span>Завершено задач:</span>
              <strong className="text-emerald-700 font-semibold">{taskStats.completed}</strong>
            </div>
            <div className="flex items-center justify-between py-1">
              <span>Всего в журнале задач:</span>
              <strong className="text-slate-900 font-semibold">{taskStats.total}</strong>
            </div>
          </div>
        </div>

        {/* Counterparty Status Breakdown */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900">Структура по статусам</h3>
                <p className="text-xs text-slate-500">Всего контрагентов в базе: {counterparties.length}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onOpenCounterpartiesTab}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800"
            >
              Открыть таблицу →
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1 font-medium">
                <span className="text-slate-700">Выставить чуть позже</span>
                <span className="text-slate-900 font-semibold">{formatCurrency(fin.laterRub, 'RUB')}</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full"
                  style={{ width: `${fin.totalRub ? (fin.laterRub / fin.totalRub) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1 font-medium">
                <span className="text-slate-700">Выставил счет</span>
                <span className="text-slate-900 font-semibold">{formatCurrency(fin.sentRub, 'RUB')}</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${fin.totalRub ? (fin.sentRub / fin.totalRub) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1 font-medium">
                <span className="text-slate-700">Оплата пришла</span>
                <span className="text-slate-900 font-semibold">{formatCurrency(fin.paidRub, 'RUB')}</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${fin.totalRub ? (fin.paidRub / fin.totalRub) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1 font-medium">
                <span className="text-slate-700">Пауза</span>
                <span className="text-slate-900 font-semibold">{formatCurrency(fin.pausedRub, 'RUB')}</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-400 rounded-full"
                  style={{ width: `${fin.totalRub ? (fin.pausedRub / fin.totalRub) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
