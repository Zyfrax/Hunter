import React from 'react';
import { Task, Counterparty } from '../types';
import { getTaskUrgency, RECURRENCE_LABELS, PRIORITY_LABELS } from '../utils/taskUtils';
import { formatDateTimeRu } from '../utils/formatters';
import { 
  CheckCircle2, 
  Circle, 
  Repeat, 
  Flame, 
  Clock, 
  Building2, 
  MoreVertical, 
  Edit3, 
  Trash2, 
  CalendarPlus,
  AlertTriangle 
} from 'lucide-react';

interface TaskCardProps {
  task: Task;
  counterparties: Counterparty[];
  onToggleStatus: (taskId: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onPostponeDays?: (taskId: string, days: number) => void;
  onSelectCounterparty?: (counterpartyId: string) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  counterparties,
  onToggleStatus,
  onEdit,
  onDelete,
  onPostponeDays,
  onSelectCounterparty,
}) => {
  const urgency = getTaskUrgency(task);
  const isDone = task.status === 'done';
  const linkedCp = counterparties.find((c) => c.id === task.counterpartyId);
  const priorityInfo = PRIORITY_LABELS[task.priority] || PRIORITY_LABELS.normal;

  return (
    <div
      id={`task-card-${task.id}`}
      className={`group relative rounded-xl border transition-all duration-200 p-4 ${
        isDone
          ? 'bg-slate-50/70 border-slate-200 opacity-75'
          : urgency.level === 'overdue'
          ? 'bg-rose-50/40 border-rose-200 shadow-xs'
          : urgency.level === 'today'
          ? 'bg-amber-50/40 border-amber-300 shadow-xs ring-1 ring-amber-300/40'
          : urgency.level === 'tomorrow'
          ? 'bg-orange-50/20 border-orange-200'
          : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Toggle checkbox */}
        <button
          type="button"
          onClick={() => onToggleStatus(task.id)}
          aria-label={isDone ? 'Отметить как невыполненную' : 'Отметить как выполненную'}
          className="mt-0.5 shrink-0 text-slate-400 hover:text-blue-600 focus:outline-none transition-colors"
        >
          {isDone ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-100" />
          ) : (
            <Circle className={`w-5 h-5 ${urgency.isApproaching ? 'text-amber-500 hover:text-amber-600' : 'text-slate-400 hover:text-slate-600'}`} />
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header tags: Urgency, Recurrence, Priority */}
          <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
            {/* Urgency Badge */}
            {!isDone && (
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs border ${urgency.badgeClass}`}
              >
                {urgency.level === 'overdue' && <AlertTriangle className="w-3 h-3 shrink-0" />}
                {urgency.level === 'today' && <Flame className="w-3 h-3 text-amber-600 shrink-0 animate-pulse" />}
                {urgency.level === 'tomorrow' && <Clock className="w-3 h-3 text-orange-600 shrink-0" />}
                <span>{urgency.label}</span>
              </span>
            )}

            {/* Recurrence badge */}
            {task.isRecurring && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                <Repeat className="w-3 h-3 shrink-0" />
                <span>
                  {task.recurrence === 'custom_days'
                    ? `Каждые ${task.recurrenceIntervalDays} дн.`
                    : RECURRENCE_LABELS[task.recurrence] || 'Регулярная'}
                </span>
              </span>
            )}

            {/* Priority tag */}
            {task.priority !== 'normal' && (
              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium border ${priorityInfo.badge}`}>
                {priorityInfo.label}
              </span>
            )}
          </div>

          {/* Task Title */}
          <h3
            className={`text-sm sm:text-base font-semibold leading-snug break-words ${
              isDone ? 'line-through text-slate-400' : 'text-slate-900'
            }`}
          >
            {task.title}
          </h3>

          {/* Linked Counterparty */}
          {(linkedCp || task.counterpartyName) && (
            <div className="mt-1.5 flex items-center gap-1 text-xs text-slate-600">
              <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <button
                type="button"
                onClick={() => task.counterpartyId && onSelectCounterparty && onSelectCounterparty(task.counterpartyId)}
                className="font-medium text-blue-600 hover:text-blue-800 hover:underline text-left truncate max-w-xs"
              >
                {linkedCp ? linkedCp.name : task.counterpartyName}
              </button>
              {linkedCp && linkedCp.amount > 0 && (
                <span className="text-slate-400">({linkedCp.amount.toLocaleString('ru-RU')} {linkedCp.currency === 'KZT' ? '₸' : '₽'})</span>
              )}
            </div>
          )}

          {/* Due date & notes */}
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
            {task.dueDate && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                Срок: <strong className="font-medium text-slate-700">{formatDateTimeRu(task.dueDate)}</strong>
              </span>
            )}
            {task.notes && (
              <p className="text-slate-600 bg-slate-100/70 px-2 py-1 rounded text-xs mt-1 w-full line-clamp-2">
                {task.notes}
              </p>
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="shrink-0 flex items-center gap-1">
          {/* Postpone shortcut for active tasks */}
          {!isDone && onPostponeDays && (
            <div className="hidden sm:flex items-center gap-1">
              <button
                type="button"
                title="Отложить на 1 день"
                onClick={() => onPostponeDays(task.id, 1)}
                className="px-1.5 py-1 text-[11px] font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded transition-colors"
              >
                +1д
              </button>
              <button
                type="button"
                title="Отложить на 3 дня"
                onClick={() => onPostponeDays(task.id, 3)}
                className="px-1.5 py-1 text-[11px] font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded transition-colors"
              >
                +3д
              </button>
            </div>
          )}

          {/* Edit */}
          <button
            type="button"
            title="Редактировать задачу"
            onClick={() => onEdit(task)}
            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Edit3 className="w-4 h-4" />
          </button>

          {/* Delete */}
          <button
            type="button"
            title="Удалить задачу"
            onClick={() => onDelete(task.id)}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
