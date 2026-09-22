import { Task, TaskRecurrence } from '../types';

export interface TaskUrgencyInfo {
  level: 'overdue' | 'today' | 'tomorrow' | 'soon' | 'future' | 'no_date' | 'done';
  label: string;
  badgeClass: string;
  textClass: string;
  isApproaching: boolean; // Flag if deadline is today, tomorrow or overdue
  daysRemaining: number;
}

export function getTaskUrgency(task: Task, now: Date = new Date()): TaskUrgencyInfo {
  if (task.status === 'done') {
    return {
      level: 'done',
      label: 'Выполнено',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      textClass: 'text-emerald-700',
      isApproaching: false,
      daysRemaining: 9999,
    };
  }

  if (!task.dueDate) {
    return {
      level: 'no_date',
      label: 'Без срока',
      badgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
      textClass: 'text-slate-500',
      isApproaching: false,
      daysRemaining: 999,
    };
  }

  const due = new Date(task.dueDate);
  if (isNaN(due.getTime())) {
    return {
      level: 'no_date',
      label: 'Срок не указан',
      badgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
      textClass: 'text-slate-500',
      isApproaching: false,
      daysRemaining: 999,
    };
  }

  // Compare calendar days
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const dueDayStart = new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime();
  const diffDays = Math.round((dueDayStart - todayStart) / (1000 * 60 * 60 * 24));
  const diffMs = due.getTime() - now.getTime();

  if (diffMs < 0 && diffDays < 0) {
    const overdueDays = Math.abs(diffDays);
    return {
      level: 'overdue',
      label: overdueDays === 1 ? 'Просрочено на 1 день' : `Просрочено на ${overdueDays} дн.`,
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-300 font-medium',
      textClass: 'text-rose-600',
      isApproaching: true,
      daysRemaining: diffDays,
    };
  }

  if (diffDays === 0) {
    // Check if time passed today
    if (diffMs < 0) {
      return {
        level: 'overdue',
        label: 'Срок истёк сегодня!',
        badgeClass: 'bg-rose-100 text-rose-800 border-rose-300 font-semibold',
        textClass: 'text-rose-700',
        isApproaching: true,
        daysRemaining: 0,
      };
    }
    return {
      level: 'today',
      label: 'Сегодня!',
      badgeClass: 'bg-amber-100 text-amber-900 border-amber-300 font-semibold',
      textClass: 'text-amber-700',
      isApproaching: true,
      daysRemaining: 0,
    };
  }

  if (diffDays === 1) {
    return {
      level: 'tomorrow',
      label: 'Завтра',
      badgeClass: 'bg-orange-50 text-orange-800 border-orange-200 font-medium',
      textClass: 'text-orange-700',
      isApproaching: true,
      daysRemaining: 1,
    };
  }

  if (diffDays <= 3) {
    return {
      level: 'soon',
      label: `Через ${diffDays} дня`,
      badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      textClass: 'text-indigo-600',
      isApproaching: true,
      daysRemaining: diffDays,
    };
  }

  if (diffDays <= 7) {
    return {
      level: 'soon',
      label: `Через ${diffDays} дн.`,
      badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
      textClass: 'text-sky-600',
      isApproaching: false,
      daysRemaining: diffDays,
    };
  }

  return {
    level: 'future',
    label: `Через ${diffDays} дн.`,
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    textClass: 'text-slate-600',
    isApproaching: false,
    daysRemaining: diffDays,
  };
}

/**
 * Sorts tasks so that tasks with approaching deadlines or overdue are at the VERY TOP.
 * Unfinished tasks always appear before finished tasks.
 */
export function sortTasksByUrgency(tasks: Task[]): Task[] {
  const now = new Date();

  return [...tasks].sort((a, b) => {
    // 1. Done tasks always go to bottom
    const aDone = a.status === 'done';
    const bDone = b.status === 'done';
    if (aDone !== bDone) {
      return aDone ? 1 : -1;
    }

    // 2. Both done: most recently completed first
    if (aDone && bDone) {
      const aTime = a.completedAt ? new Date(a.completedAt).getTime() : 0;
      const bTime = b.completedAt ? new Date(b.completedAt).getTime() : 0;
      return bTime - aTime;
    }

    // 3. For active tasks: sort by deadline urgency
    const aUrgency = getTaskUrgency(a, now);
    const bUrgency = getTaskUrgency(b, now);

    const levelRank: Record<string, number> = {
      overdue: 1,
      today: 2,
      tomorrow: 3,
      soon: 4,
      future: 5,
      no_date: 6,
    };

    const rankA = levelRank[aUrgency.level] || 99;
    const rankB = levelRank[bUrgency.level] || 99;

    if (rankA !== rankB) {
      return rankA - rankB;
    }

    // Within same urgency tier, sort by exact due date
    if (a.dueDate && b.dueDate) {
      const diff = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      if (diff !== 0) return diff;
    }

    // If still tied, sort by priority
    const priorityRank: Record<string, number> = {
      urgent: 1,
      high: 2,
      normal: 3,
      low: 4,
    };
    const pDiff = (priorityRank[a.priority] || 3) - (priorityRank[b.priority] || 3);
    if (pDiff !== 0) return pDiff;

    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

/**
 * Computes the next scheduled due date for a recurring task.
 */
export function calculateNextDueDate(currentDueDateStr: string, recurrence: TaskRecurrence, customDays = 7): string {
  const base = currentDueDateStr ? new Date(currentDueDateStr) : new Date();
  const next = new Date(base);

  switch (recurrence) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      break;
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'biweekly':
      next.setDate(next.getDate() + 14);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      break;
    case 'quarterly':
      next.setMonth(next.getMonth() + 3);
      break;
    case 'custom_days':
      next.setDate(next.getDate() + (customDays > 0 ? customDays : 7));
      break;
    default:
      next.setDate(next.getDate() + 7);
  }

  return next.toISOString().slice(0, 16);
}

export const RECURRENCE_LABELS: Record<TaskRecurrence, string> = {
  none: 'Не повторять',
  daily: 'Каждый день',
  weekly: 'Каждую неделю',
  biweekly: 'Каждые 2 недели',
  monthly: 'Раз в месяц',
  quarterly: 'Раз в квартал',
  custom_days: 'Свой интервал (дней)',
};

export const PRIORITY_LABELS: Record<string, { label: string; badge: string }> = {
  urgent: { label: 'Срочный', badge: 'bg-rose-100 text-rose-800 border-rose-300' },
  high: { label: 'Высокий', badge: 'bg-orange-100 text-orange-800 border-orange-300' },
  normal: { label: 'Обычный', badge: 'bg-slate-100 text-slate-700 border-slate-200' },
  low: { label: 'Низкий', badge: 'bg-slate-50 text-slate-500 border-slate-200' },
};
