import React, { useState, useMemo } from 'react';
import { Task, Counterparty } from '../types';
import { TaskCard } from './TaskCard';
import { sortTasksByUrgency, getTaskUrgency } from '../utils/taskUtils';
import { 
  Plus, 
  Search, 
  Flame, 
  CheckCircle2, 
  Repeat, 
  Filter, 
  CalendarClock, 
  SlidersHorizontal 
} from 'lucide-react';

interface TasksListProps {
  tasks: Task[];
  counterparties: Counterparty[];
  onAddTask: () => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onToggleStatus: (taskId: string) => void;
  onPostponeDays: (taskId: string, days: number) => void;
  onSelectCounterparty: (counterpartyId: string) => void;
}

export const TasksList: React.FC<TasksListProps> = ({
  tasks,
  counterparties,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onToggleStatus,
  onPostponeDays,
  onSelectCounterparty,
}) => {
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState<'all_active' | 'approaching' | 'recurring' | 'done'>('all_active');
  const [sortMode, setSortMode] = useState<'urgency' | 'priority' | 'newest'>('urgency');

  // Count stats
  const stats = useMemo(() => {
    let overdueCount = 0;
    let todayCount = 0;
    let approachingCount = 0;
    let recurringCount = 0;
    let activeCount = 0;

    tasks.forEach((t) => {
      if (t.status !== 'done') {
        activeCount++;
        const u = getTaskUrgency(t);
        if (u.level === 'overdue') overdueCount++;
        if (u.level === 'today') todayCount++;
        if (u.isApproaching) approachingCount++;
        if (t.isRecurring) recurringCount++;
      }
    });

    return { overdueCount, todayCount, approachingCount, recurringCount, activeCount };
  }, [tasks]);

  // Filter & sort
  const displayedTasks = useMemo(() => {
    let result = tasks.filter((t) => {
      // Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesTitle = t.title.toLowerCase().includes(q);
        const matchesNotes = t.notes?.toLowerCase().includes(q);
        const matchesCp = t.counterpartyName?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesNotes && !matchesCp) return false;
      }

      // Filter Mode
      if (filterMode === 'done') {
        return t.status === 'done';
      }
      if (filterMode === 'all_active') {
        return t.status !== 'done';
      }
      if (filterMode === 'approaching') {
        if (t.status === 'done') return false;
        const u = getTaskUrgency(t);
        return u.isApproaching;
      }
      if (filterMode === 'recurring') {
        if (t.status === 'done') return false;
        return t.isRecurring;
      }

      return true;
    });

    // Sorting
    if (sortMode === 'urgency') {
      // Default: approaching deadlines at the very top!
      return sortTasksByUrgency(result);
    } else if (sortMode === 'priority') {
      const priorityWeights: Record<string, number> = { urgent: 4, high: 3, normal: 2, low: 1 };
      return [...result].sort((a, b) => {
        if (a.status === 'done' && b.status !== 'done') return 1;
        if (a.status !== 'done' && b.status === 'done') return -1;
        return (priorityWeights[b.priority] || 0) - (priorityWeights[a.priority] || 0);
      });
    } else {
      // Newest
      return [...result].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  }, [tasks, search, filterMode, sortMode]);

  return (
    <div className="space-y-4">
      {/* Top Banner if there are overdue or today tasks */}
      {(stats.overdueCount > 0 || stats.todayCount > 0) && (
        <div
          id="urgent-tasks-banner"
          className="p-4 rounded-xl border border-amber-300 bg-amber-50/70 shadow-xs flex flex-wrap items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500 text-white rounded-lg shadow-xs">
              <Flame className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-amber-950">
                Внимание: задачи с подходящим сроком выполнения!
              </h3>
              <p className="text-xs text-amber-800">
                {stats.overdueCount > 0 && (
                  <span className="font-semibold text-rose-700 mr-2">
                    Просрочено: {stats.overdueCount}
                  </span>
                )}
                {stats.todayCount > 0 && (
                  <span className="font-semibold text-amber-900">
                    Срок сегодня: {stats.todayCount}
                  </span>
                )}
                {' — эти задачи автоматически закреплены на самом верху списка.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setFilterMode('approaching')}
            className="px-3 py-1.5 text-xs font-semibold text-amber-900 bg-amber-200/80 hover:bg-amber-300 border border-amber-300 rounded-lg transition-colors"
          >
            Показать только горящие ({stats.approachingCount})
          </button>
        </div>
      )}

      {/* Control bar: Search, Filter tabs, Sort dropdown, Add Task */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400 pointer-events-none" />
            <input
              id="search-tasks-input"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по названию, примечанию или контрагенту..."
              className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Sort order selector */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
              <select
                id="tasks-sort-select"
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value as any)}
                className="bg-transparent text-slate-800 font-medium focus:outline-none cursor-pointer"
              >
                <option value="urgency">Срок подходит (горящие сверху)</option>
                <option value="priority">По приоритету</option>
                <option value="newest">Сначала новые</option>
              </select>
            </div>

            {/* Add Task Button */}
            <button
              id="add-task-btn"
              type="button"
              onClick={onAddTask}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-xs transition-colors whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Новая задача</span>
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setFilterMode('all_active')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              filterMode === 'all_active'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Все активные ({stats.activeCount})
          </button>

          <button
            type="button"
            onClick={() => setFilterMode('approaching')}
            className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              filterMode === 'approaching'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            Горящие / срок подходит ({stats.approachingCount})
          </button>

          <button
            type="button"
            onClick={() => setFilterMode('recurring')}
            className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              filterMode === 'recurring'
                ? 'bg-blue-600 text-white'
                : 'bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100'
            }`}
          >
            <Repeat className="w-3.5 h-3.5" />
            Регулярные ({stats.recurringCount})
          </button>

          <button
            type="button"
            onClick={() => setFilterMode('done')}
            className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              filterMode === 'done'
                ? 'bg-emerald-700 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Завершенные
          </button>
        </div>
      </div>

      {/* Task Cards List */}
      {displayedTasks.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200 shadow-xs">
          <CalendarClock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h4 className="text-sm font-semibold text-slate-800">Задач не найдено</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {search
              ? 'По вашему поисковому запросу ничего не найдено.'
              : filterMode === 'approaching'
              ? 'Нет задач с горящими дедлайнами — всё под контролем!'
              : 'Создайте новую регулярную или разовую задачу с дедлайном.'}
          </p>
          <button
            type="button"
            onClick={onAddTask}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Создать задачу
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {displayedTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              counterparties={counterparties}
              onToggleStatus={onToggleStatus}
              onEdit={onEditTask}
              onDelete={onDeleteTask}
              onPostponeDays={onPostponeDays}
              onSelectCounterparty={onSelectCounterparty}
            />
          ))}
        </div>
      )}
    </div>
  );
};
