import React, { useMemo } from 'react';
import { Counterparty, CounterpartyStatus, Task } from '../types';
import { STATUS_CONFIG, CounterpartyStatusBadge } from './CounterpartyStatusBadge';
import { formatCurrency, formatDateRu } from '../utils/formatters';
import { MilestonesTracker } from './MilestonesTracker';
import { 
  Building2, 
  MessageSquare, 
  Edit3, 
  Plus, 
  ChevronRight, 
  ChevronLeft, 
  AlertCircle,
  FileText,
  Clock
} from 'lucide-react';

interface CounterpartiesKanbanProps {
  counterparties: Counterparty[];
  tasks: Task[];
  searchQuery: string;
  onEditCounterparty: (cp: Counterparty) => void;
  onChangeStatus: (id: string, newStatus: CounterpartyStatus) => void;
  onAddTaskForCounterparty: (counterpartyId: string) => void;
  onOpenMessageModal: (cp: Counterparty) => void;
}

const KANBAN_COLUMNS: { status: CounterpartyStatus; label: string; headerColor: string; dotColor: string }[] = [
  { status: 'bill_later', label: 'Выставить чуть позже', headerColor: 'border-amber-300 bg-amber-50/60 text-amber-900', dotColor: 'bg-amber-500' },
  { status: 'in_progress', label: 'В работе', headerColor: 'border-sky-300 bg-sky-50/60 text-sky-900', dotColor: 'bg-sky-500' },
  { status: 'bill_sent', label: 'Счет выставлен', headerColor: 'border-blue-300 bg-blue-50/60 text-blue-900', dotColor: 'bg-blue-600' },
  { status: 'paid', label: 'Оплата пришла', headerColor: 'border-emerald-300 bg-emerald-50/60 text-emerald-900', dotColor: 'bg-emerald-500' },
  { status: 'paused', label: 'Пауза / Архив', headerColor: 'border-slate-300 bg-slate-50/60 text-slate-800', dotColor: 'bg-slate-400' },
];

export const CounterpartiesKanban: React.FC<CounterpartiesKanbanProps> = ({
  counterparties,
  tasks,
  searchQuery,
  onEditCounterparty,
  onChangeStatus,
  onAddTaskForCounterparty,
  onOpenMessageModal,
}) => {
  // Filtered by search
  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return counterparties;
    const q = searchQuery.toLowerCase();
    return counterparties.filter((cp) => {
      return (
        cp.name.toLowerCase().includes(q) ||
        cp.notes.toLowerCase().includes(q) ||
        cp.categoryOrStage?.toLowerCase().includes(q) ||
        cp.inn?.toLowerCase().includes(q)
      );
    });
  }, [counterparties, searchQuery]);

  // Group by status
  const grouped = useMemo(() => {
    const map: Record<CounterpartyStatus, Counterparty[]> = {
      bill_later: [],
      in_progress: [],
      bill_sent: [],
      paid: [],
      paused: [],
      cancelled: [],
    };
    filtered.forEach((cp) => {
      if (map[cp.status]) {
        map[cp.status].push(cp);
      } else {
        map['paused'].push(cp);
      }
    });
    return map;
  }, [filtered]);

  // Calculate totals per column
  const columnSums = useMemo(() => {
    const res: Record<string, { rub: number; kzt: number }> = {};
    KANBAN_COLUMNS.forEach((col) => {
      let rub = 0;
      let kzt = 0;
      (grouped[col.status] || []).forEach((cp) => {
        if (cp.currency === 'KZT') kzt += cp.amount || 0;
        else if (cp.currency === 'RUB') rub += cp.amount || 0;
      });
      res[col.status] = { rub, kzt };
    });
    return res;
  }, [grouped]);

  const getNextStatus = (current: CounterpartyStatus): CounterpartyStatus | null => {
    const order: CounterpartyStatus[] = ['bill_later', 'in_progress', 'bill_sent', 'paid'];
    const idx = order.indexOf(current);
    if (idx !== -1 && idx < order.length - 1) return order[idx + 1];
    return null;
  };

  const getPrevStatus = (current: CounterpartyStatus): CounterpartyStatus | null => {
    const order: CounterpartyStatus[] = ['bill_later', 'in_progress', 'bill_sent', 'paid'];
    const idx = order.indexOf(current);
    if (idx > 0) return order[idx - 1];
    return null;
  };

  return (
    <div id="counterparties-kanban-board" className="overflow-x-auto pb-4 pt-1">
      <div className="flex gap-4 min-w-[1100px] items-start">
        {KANBAN_COLUMNS.map((col) => {
          const items = grouped[col.status] || [];
          const sums = columnSums[col.status] || { rub: 0, kzt: 0 };

          return (
            <div
              key={col.status}
              className="flex-1 bg-slate-100/90 rounded-2xl border border-slate-200/90 p-3 flex flex-col max-h-[85vh] min-w-[240px]"
            >
              {/* Column Header */}
              <div className={`p-3 rounded-xl border mb-3 shadow-2xs ${col.headerColor}`}>
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${col.dotColor}`} />
                    <span className="font-bold text-xs uppercase tracking-wider">{col.label}</span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded-full text-xs font-bold bg-white/70 shadow-2xs">
                    {items.length}
                  </span>
                </div>

                {/* Column sum */}
                <div className="mt-2 text-xs font-semibold">
                  {sums.rub > 0 && <div>{sums.rub.toLocaleString('ru-RU')} ₽</div>}
                  {sums.kzt > 0 && <div className="text-[11px] opacity-85">{sums.kzt.toLocaleString('ru-RU')} ₸</div>}
                  {sums.rub === 0 && sums.kzt === 0 && <div className="text-[11px] opacity-60">0 ₽</div>}
                </div>
              </div>

              {/* Cards Container */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {items.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                    Нет контрагентов
                  </div>
                ) : (
                  items.map((cp) => {
                    const linkedTasks = tasks.filter(
                      (t) => t.counterpartyId === cp.id && t.status !== 'done'
                    );
                    const nextSt = getNextStatus(cp.status);
                    const prevSt = getPrevStatus(cp.status);

                    return (
                      <div
                        key={cp.id}
                        className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-2xs hover:shadow-xs transition-all space-y-2.5 group"
                      >
                        {/* Title & Edit */}
                        <div className="flex items-start justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => onEditCounterparty(cp)}
                            className="font-semibold text-xs sm:text-sm text-slate-900 text-left hover:text-blue-600 transition-colors line-clamp-2 leading-snug cursor-pointer"
                          >
                            {cp.name}
                          </button>
                          <button
                            type="button"
                            onClick={() => onEditCounterparty(cp)}
                            className="p-1 text-slate-400 hover:text-slate-700 opacity-60 group-hover:opacity-100 transition-opacity"
                            title="Редактировать"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Amount & Currency */}
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-bold text-slate-900">
                            {formatCurrency(cp.amount, cp.currency)}
                          </div>
                          {cp.categoryOrStage && (
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                              {cp.categoryOrStage}
                            </span>
                          )}
                        </div>

                        {/* Milestones Compact progress */}
                        {cp.milestones && cp.milestones.length > 0 && (
                          <div className="pt-1">
                            <MilestonesTracker milestones={cp.milestones} currency={cp.currency} compact />
                          </div>
                        )}

                        {/* Date or Bank details */}
                        <div className="text-[11px] text-slate-500 space-y-1">
                          {cp.date && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span>КЭВ: {formatDateRu(cp.date)}</span>
                            </div>
                          )}
                          {cp.notes && (
                            <div className="flex items-start gap-1 text-[11px] text-slate-600 bg-slate-50 p-1.5 rounded-lg line-clamp-2 italic">
                              <FileText className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                              <span>{cp.notes}</span>
                            </div>
                          )}
                        </div>

                        {/* Linked tasks indicator */}
                        {linkedTasks.length > 0 && (
                          <div className="flex items-center gap-1 text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/60">
                            <span>Задач в работе: {linkedTasks.length}</span>
                          </div>
                        )}

                        {/* Action buttons & Status Move */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1">
                            {/* Message client */}
                            <button
                              type="button"
                              onClick={() => onOpenMessageModal(cp)}
                              title="Отправить сообщение клиенту (Telegram / WhatsApp / Email)"
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-md border border-emerald-200 transition-colors"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </button>

                            {/* Add task */}
                            <button
                              type="button"
                              onClick={() => onAddTaskForCounterparty(cp.id)}
                              title="Создать задачу для контрагента"
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md border border-blue-200 transition-colors"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Quick move buttons */}
                          <div className="flex items-center gap-1">
                            {prevSt && (
                              <button
                                type="button"
                                onClick={() => onChangeStatus(cp.id, prevSt)}
                                title={`Вернуть: ${STATUS_CONFIG[prevSt]?.label}`}
                                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                              >
                                <ChevronLeft className="w-4 h-4" />
                              </button>
                            )}

                            {nextSt && (
                              <button
                                type="button"
                                onClick={() => onChangeStatus(cp.id, nextSt)}
                                title={`Перевести в: ${STATUS_CONFIG[nextSt]?.label}`}
                                className="px-2 py-1 text-[11px] font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded flex items-center gap-0.5 transition-colors"
                              >
                                <span>{STATUS_CONFIG[nextSt]?.label.split(' ')[0]}</span>
                                <ChevronRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
