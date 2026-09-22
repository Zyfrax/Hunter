import React, { useState, useMemo } from 'react';
import { Counterparty, Task } from '../types';
import { getTaskUrgency } from '../utils/taskUtils';
import { formatCurrency } from '../utils/formatters';
import { 
  Sun, 
  Flame, 
  Clock, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  Bell, 
  BellRing,
  ArrowRight,
  Send,
  CalendarCheck
} from 'lucide-react';
import { 
  getNotificationPermission, 
  requestNotificationPermission, 
  checkAndNotifyDeadlines 
} from '../utils/notifications';

interface DailyBriefingProps {
  counterparties: Counterparty[];
  tasks: Task[];
  onOpenCounterparty: (cp: Counterparty) => void;
  onOpenTaskModal: (task?: Task) => void;
  onToggleTaskStatus: (taskId: string) => void;
  onOpenMessageModal: (cp: Counterparty) => void;
}

export const DailyBriefing: React.FC<DailyBriefingProps> = ({
  counterparties,
  tasks,
  onOpenCounterparty,
  onOpenTaskModal,
  onToggleTaskStatus,
  onOpenMessageModal,
}) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [notifState, setNotifState] = useState<string>(getNotificationPermission());

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const briefingData = useMemo(() => {
    // Overdue or today tasks
    const urgentTasks: Task[] = [];
    tasks.forEach((t) => {
      if (t.status !== 'done') {
        const u = getTaskUrgency(t);
        if (u.isApproaching) {
          urgentTasks.push(t);
        }
      }
    });

    // Bills that should be issued soon or are waiting
    const billsToIssue = counterparties.filter(
      (cp) => cp.status === 'bill_later'
    );

    // Sum waiting to be billed
    let billLaterRub = 0;
    billsToIssue.forEach((cp) => {
      if (cp.currency === 'RUB') billLaterRub += cp.amount || 0;
    });

    // Sent bills waiting for payment
    const billsSent = counterparties.filter((cp) => cp.status === 'bill_sent');
    let billsSentRub = 0;
    billsSent.forEach((cp) => {
      if (cp.currency === 'RUB') billsSentRub += cp.amount || 0;
    });

    return {
      urgentTasks,
      billsToIssue,
      billLaterRub,
      billsSent,
      billsSentRub,
    };
  }, [counterparties, tasks]);

  const handleToggleNotifications = async () => {
    const perm = await requestNotificationPermission();
    setNotifState(perm);
    if (perm === 'granted') {
      checkAndNotifyDeadlines(tasks, counterparties);
    }
  };

  const formattedDate = new Date().toLocaleDateString('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <section 
      id="daily-briefing-widget" 
      aria-label="Утренняя сводка и план на сегодня"
      className="mb-6 bg-gradient-to-r from-blue-900 to-indigo-950 text-white rounded-2xl shadow-md border border-blue-800/60 overflow-hidden"
    >
      {/* Top Banner Bar */}
      <div className="px-5 py-4 flex flex-wrap items-center justify-between gap-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center shrink-0 border border-amber-400/30">
            <Sun className="w-5 h-5 text-amber-400 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-white">
                Утренняя сводка и план на день
              </h2>
              <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-500/20 text-blue-200 border border-blue-400/30 capitalize">
                {formattedDate}
              </span>
            </div>
            <p className="text-xs text-blue-200/80">
              Контроль счетов к выставлению, горящих дедлайнов и платежей
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Web notification toggle */}
          <button
            type="button"
            onClick={handleToggleNotifications}
            title={
              notifState === 'granted'
                ? 'Браузерные уведомления включены'
                : 'Включить напоминания браузера о дедлайнах'
            }
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              notifState === 'granted'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                : 'bg-white/10 text-white/90 hover:bg-white/20 border border-white/20'
            }`}
          >
            {notifState === 'granted' ? (
              <>
                <BellRing className="w-3.5 h-3.5 text-emerald-400 animate-bounce" />
                <span className="hidden sm:inline">Напоминания активны</span>
              </>
            ) : (
              <>
                <Bell className="w-3.5 h-3.5" />
                <span>Включить Push</span>
              </>
            )}
          </button>

          {/* Collapse/Expand */}
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 text-blue-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title={isCollapsed ? 'Развернуть сводку' : 'Свернуть сводку'}
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Stats Quick Badges */}
      {!isCollapsed && (
        <div className="p-5 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Urgent Tasks */}
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
              <div>
                <span className="text-xs text-blue-200 font-medium">Горящие задачи</span>
                <div className="text-2xl font-bold text-white flex items-center gap-2 mt-0.5">
                  <span>{briefingData.urgentTasks.length}</span>
                  {briefingData.urgentTasks.length > 0 && (
                    <Flame className="w-5 h-5 text-amber-400 animate-pulse" />
                  )}
                </div>
              </div>
              <span className="text-[11px] text-blue-300/80 max-w-[110px] text-right">
                {briefingData.urgentTasks.length === 0
                  ? 'Все задачи в графике'
                  : 'Срок сегодня или просрочен'}
              </span>
            </div>

            {/* Bills waiting */}
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
              <div>
                <span className="text-xs text-blue-200 font-medium">Счетов к выставлению</span>
                <div className="text-2xl font-bold text-amber-300 mt-0.5">
                  {briefingData.billsToIssue.length}
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold text-white">
                  {briefingData.billLaterRub.toLocaleString('ru-RU')} ₽
                </span>
                <div className="text-[10px] text-blue-300/70">в статусе «Чуть позже»</div>
              </div>
            </div>

            {/* Waiting Payment */}
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
              <div>
                <span className="text-xs text-blue-200 font-medium">Ожидаем оплат</span>
                <div className="text-2xl font-bold text-emerald-300 mt-0.5">
                  {briefingData.billsSent.length}
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold text-white">
                  {briefingData.billsSentRub.toLocaleString('ru-RU')} ₽
                </span>
                <div className="text-[10px] text-blue-300/70">счета выставлены</div>
              </div>
            </div>
          </div>

          {/* Action List for Today */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-1">
            {/* Urgent Tasks Checklist */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5" />
                  Горящие задачи
                </span>
                <button
                  type="button"
                  onClick={() => onOpenTaskModal()}
                  className="text-[11px] text-blue-300 hover:text-white underline cursor-pointer"
                >
                  + Новая задача
                </button>
              </div>

              {briefingData.urgentTasks.length === 0 ? (
                <div className="py-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Отлично! Горящих задач на сегодня нет.</span>
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {briefingData.urgentTasks.map((t) => (
                    <div
                      key={t.id}
                      className="p-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-between gap-3 text-xs transition-colors"
                    >
                      <div className="min-w-0 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onToggleTaskStatus(t.id)}
                          title="Отметить выполненной"
                          className="w-4 h-4 rounded border border-white/40 hover:border-emerald-400 flex items-center justify-center shrink-0 cursor-pointer"
                        >
                          {t.status === 'done' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                        </button>
                        <div className="min-w-0">
                          <div className="font-semibold text-white truncate">{t.title}</div>
                          {t.counterpartyName && (
                            <div className="text-[10px] text-blue-300 truncate">
                              {t.counterpartyName}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-400/30">
                          {t.dueDate ? t.dueDate.slice(0, 10) : 'Срочно'}
                        </span>
                        <button
                          type="button"
                          onClick={() => onOpenTaskModal(t)}
                          className="text-blue-300 hover:text-white"
                          title="Редактировать"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Bill Action Box */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-white/10 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-300 flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5" />
                Первые в очереди на выставление счетов
              </span>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {briefingData.billsToIssue.slice(0, 4).map((cp) => (
                  <div
                    key={cp.id}
                    className="p-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-between gap-3 text-xs transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-white truncate">{cp.name}</div>
                      <div className="text-[11px] text-amber-300 font-medium">
                        {formatCurrency(cp.amount, cp.currency)}{' '}
                        {cp.categoryOrStage && (
                          <span className="text-blue-300 text-[10px]">({cp.categoryOrStage})</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => onOpenMessageModal(cp)}
                        title="Отправить сообщение со счетом клиенту"
                        className="px-2 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium text-[11px] flex items-center gap-1 transition-colors"
                      >
                        <Send className="w-3 h-3" />
                        <span>Написать</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onOpenCounterparty(cp)}
                        title="Открыть карточку контрагента"
                        className="p-1 text-slate-300 hover:text-white"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
