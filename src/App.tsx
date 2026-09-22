import React, { useState, useEffect, useMemo } from 'react';
import { Counterparty, Task, ViewTab, CounterpartyStatus } from './types';
import { 
  loadCounterparties, 
  saveCounterparties, 
  loadTasks, 
  saveTasks 
} from './utils/storage';
import { calculateNextDueDate, getTaskUrgency } from './utils/taskUtils';
import { CounterpartiesTable } from './components/CounterpartiesTable';
import { TasksList } from './components/TasksList';
import { AnalyticsOverview } from './components/AnalyticsOverview';
import { CounterpartyModal } from './components/CounterpartyModal';
import { TaskModal } from './components/TaskModal';
import { BackupModal } from './components/BackupModal';
import { DailyBriefing } from './components/DailyBriefing';
import { ClientMessageModal } from './components/ClientMessageModal';
import { getNotificationPermission, checkAndNotifyDeadlines } from './utils/notifications';
import { 
  Building2, 
  CheckSquare, 
  BarChart3, 
  Plus, 
  Database, 
  Flame, 
  TrendingUp, 
  CheckCircle2, 
  Clock,
  Sparkles,
  RefreshCw
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ViewTab>('counterparties');
  const [counterparties, setCounterparties] = useState<Counterparty[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Modals state
  const [isCpModalOpen, setIsCpModalOpen] = useState(false);
  const [editingCp, setEditingCp] = useState<Counterparty | null>(null);

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [presetCounterpartyId, setPresetCounterpartyId] = useState<string | undefined>(undefined);

  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);

  // Client messaging modal
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [selectedCpForMessage, setSelectedCpForMessage] = useState<Counterparty | null>(null);

  // Toast notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 4500);
  };

  // Initial load
  useEffect(() => {
    const loadedCps = loadCounterparties();
    const loadedTs = loadTasks();
    setCounterparties(loadedCps);
    setTasks(loadedTs);
    setIsLoaded(true);

    if (getNotificationPermission() === 'granted') {
      checkAndNotifyDeadlines(loadedTs, loadedCps);
    }
  }, []);

  const handleOpenMessageModal = (cp: Counterparty) => {
    setSelectedCpForMessage(cp);
    setIsMessageModalOpen(true);
  };

  // Save changes
  const handleUpdateCounterparties = (updated: Counterparty[]) => {
    setCounterparties(updated);
    saveCounterparties(updated);
  };

  const handleUpdateTasks = (updated: Task[]) => {
    setTasks(updated);
    saveTasks(updated);
  };

  // Counterparty handlers
  const handleSaveCounterparty = (cp: Counterparty) => {
    const exists = counterparties.some((c) => c.id === cp.id);
    let updated: Counterparty[];
    if (exists) {
      updated = counterparties.map((c) => (c.id === cp.id ? cp : c));
      showToast(`Контрагент «${cp.name}» обновлён`);
    } else {
      updated = [cp, ...counterparties];
      showToast(`Контрагент «${cp.name}» добавлен`);
    }
    handleUpdateCounterparties(updated);
  };

  const handleDeleteCounterparty = (id: string) => {
    const target = counterparties.find((c) => c.id === id);
    if (!target) return;
    if (window.confirm(`Удалить контрагента «${target.name}»?`)) {
      const updated = counterparties.filter((c) => c.id !== id);
      handleUpdateCounterparties(updated);
      showToast(`Контрагент «${target.name}» удалён`);
    }
  };

  const handleChangeStatus = (id: string, newStatus: CounterpartyStatus) => {
    const updated = counterparties.map((c) =>
      c.id === id ? { ...c, status: newStatus, updatedAt: new Date().toISOString() } : c
    );
    handleUpdateCounterparties(updated);
  };

  // Task handlers
  const handleSaveTask = (task: Task) => {
    const exists = tasks.some((t) => t.id === task.id);
    let updated: Task[];
    if (exists) {
      updated = tasks.map((t) => (t.id === task.id ? task : t));
      showToast(`Задача «${task.title}» сохранена`);
    } else {
      updated = [task, ...tasks];
      showToast(`Задача создана`);
    }
    handleUpdateTasks(updated);
  };

  const handleDeleteTask = (taskId: string) => {
    const target = tasks.find((t) => t.id === taskId);
    if (!target) return;
    if (window.confirm(`Удалить задачу «${target.title}»?`)) {
      const updated = tasks.filter((t) => t.id !== taskId);
      handleUpdateTasks(updated);
      showToast(`Задача удалена`);
    }
  };

  // Toggle task status with recurring automation
  const handleToggleTaskStatus = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    if (task.status !== 'done') {
      // Mark as done
      const completedTask: Task = {
        ...task,
        status: 'done',
        completedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      let nextTaskToCreate: Task | null = null;

      // If recurring, schedule the next iteration!
      if (task.isRecurring && task.recurrence !== 'none') {
        const nextDue = calculateNextDueDate(
          task.dueDate || new Date().toISOString(),
          task.recurrence,
          task.recurrenceIntervalDays
        );

        nextTaskToCreate = {
          ...task,
          id: `task-${Date.now()}`,
          status: 'todo',
          dueDate: nextDue,
          completedAt: undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }

      let updatedList = tasks.map((t) => (t.id === taskId ? completedTask : t));
      if (nextTaskToCreate) {
        updatedList = [nextTaskToCreate, ...updatedList];
        const dueFormatted = new Date(nextTaskToCreate.dueDate).toLocaleDateString('ru-RU');
        showToast(`Задача выполнена! Создан следующий регулярный повтор на ${dueFormatted} ✓`);
      } else {
        showToast('Задача выполнена ✓');
      }

      handleUpdateTasks(updatedList);
    } else {
      // Reactivate task
      const reactivatedTask: Task = {
        ...task,
        status: 'todo',
        completedAt: undefined,
        updatedAt: new Date().toISOString(),
      };
      const updatedList = tasks.map((t) => (t.id === taskId ? reactivatedTask : t));
      handleUpdateTasks(updatedList);
      showToast('Задача возвращена в активные');
    }
  };

  // Postpone task shortcut
  const handlePostponeDays = (taskId: string, days: number) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    const base = task.dueDate ? new Date(task.dueDate) : new Date();
    base.setDate(base.getDate() + days);
    const newDueDate = base.toISOString().slice(0, 16);

    const updatedTask: Task = {
      ...task,
      dueDate: newDueDate,
      updatedAt: new Date().toISOString(),
    };
    const updated = tasks.map((t) => (t.id === taskId ? updatedTask : t));
    handleUpdateTasks(updated);
    showToast(`Срок задачи перенесён на ${days} дн.`);
  };

  const handleOpenAddTaskForCounterparty = (cpId: string) => {
    setPresetCounterpartyId(cpId);
    setEditingTask(null);
    setIsTaskModalOpen(true);
  };

  const handleSelectCounterpartyFromTask = (cpId: string) => {
    const target = counterparties.find((c) => c.id === cpId);
    if (target) {
      setEditingCp(target);
      setIsCpModalOpen(true);
    }
  };

  // Quick stats for header
  const headerStats = useMemo(() => {
    let approachingTasksCount = 0;
    let pendingSentRub = 0;
    let paidRub = 0;

    tasks.forEach((t) => {
      if (t.status !== 'done') {
        const u = getTaskUrgency(t);
        if (u.isApproaching) approachingTasksCount++;
      }
    });

    counterparties.forEach((cp) => {
      if (cp.currency === 'RUB') {
        if (cp.status === 'bill_sent') pendingSentRub += cp.amount || 0;
        if (cp.status === 'paid') paidRub += cp.amount || 0;
      }
    });

    return { approachingTasksCount, pendingSentRub, paidRub };
  }, [counterparties, tasks]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mr-2" />
        Загрузка данных...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col">
      {/* Toast popup */}
      {toastMessage && (
        <div
          id="app-toast-message"
          className="fixed bottom-5 right-5 z-50 px-4 py-3 bg-slate-900 text-white text-xs sm:text-sm font-medium rounded-xl shadow-xl border border-slate-700 flex items-center gap-2 animate-in slide-in-from-bottom-5 duration-200"
        >
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Title / Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-xs">
                К&З
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                  Контрагенты и Задачи
                </h1>
                <p className="text-xs text-slate-500 hidden sm:block">
                  Локальный учёт оплат, статусов и регулярных задач
                </p>
              </div>
            </div>

            {/* Header fast stats indicators */}
            <div className="hidden md:flex items-center gap-4 text-xs">
              <div className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-slate-500">Счета выставлены: </span>
                <strong className="text-slate-900 font-semibold">
                  {headerStats.pendingSentRub.toLocaleString('ru-RU')} ₽
                </strong>
              </div>

              <div className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800">
                <span>Оплачено: </span>
                <strong className="font-semibold">{headerStats.paidRub.toLocaleString('ru-RU')} ₽</strong>
              </div>

              {headerStats.approachingTasksCount > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveTab('tasks')}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg text-amber-900 font-semibold cursor-pointer transition-colors"
                >
                  <Flame className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                  <span>Срок подходит: {headerStats.approachingTasksCount}</span>
                </button>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <button
                id="header-add-task-btn"
                type="button"
                onClick={() => {
                  setEditingTask(null);
                  setPresetCounterpartyId(undefined);
                  setIsTaskModalOpen(true);
                }}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Задача</span>
              </button>

              <button
                id="header-add-cp-btn"
                type="button"
                onClick={() => {
                  setEditingCp(null);
                  setIsCpModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Контрагент</span>
              </button>

              <button
                id="backup-btn"
                type="button"
                title="Резервное копирование и экспорт"
                onClick={() => setIsBackupModalOpen(true)}
                className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
              >
                <Database className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex space-x-1 sm:space-x-4 border-t border-slate-100 -mb-px">
            <button
              id="tab-counterparties"
              type="button"
              onClick={() => setActiveTab('counterparties')}
              className={`py-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
                activeTab === 'counterparties'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Контрагенты</span>
              <span className="px-1.5 py-0.5 rounded-full text-[11px] bg-slate-100 text-slate-600">
                {counterparties.length}
              </span>
            </button>

            <button
              id="tab-tasks"
              type="button"
              onClick={() => setActiveTab('tasks')}
              className={`py-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors relative ${
                activeTab === 'tasks'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              <CheckSquare className="w-4 h-4" />
              <span>Задачи</span>
              {headerStats.approachingTasksCount > 0 ? (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[11px] bg-amber-100 text-amber-900 font-bold border border-amber-300">
                  <Flame className="w-3 h-3 text-amber-600 animate-pulse" />
                  {headerStats.approachingTasksCount}
                </span>
              ) : (
                <span className="px-1.5 py-0.5 rounded-full text-[11px] bg-slate-100 text-slate-600">
                  {tasks.filter((t) => t.status !== 'done').length}
                </span>
              )}
            </button>

            <button
              id="tab-analytics"
              type="button"
              onClick={() => setActiveTab('analytics')}
              className={`py-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
                activeTab === 'analytics'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Сводка & Аналитика</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Morning Briefing & Daily Plan Widget */}
        <DailyBriefing
          counterparties={counterparties}
          tasks={tasks}
          onOpenCounterparty={(cp) => {
            setEditingCp(cp);
            setIsCpModalOpen(true);
          }}
          onOpenTaskModal={(task) => {
            setEditingTask(task || null);
            setPresetCounterpartyId(undefined);
            setIsTaskModalOpen(true);
          }}
          onToggleTaskStatus={handleToggleTaskStatus}
          onOpenMessageModal={handleOpenMessageModal}
        />

        {activeTab === 'counterparties' && (
          <CounterpartiesTable
            counterparties={counterparties}
            tasks={tasks}
            onAddCounterparty={() => {
              setEditingCp(null);
              setIsCpModalOpen(true);
            }}
            onEditCounterparty={(cp) => {
              setEditingCp(cp);
              setIsCpModalOpen(true);
            }}
            onDeleteCounterparty={handleDeleteCounterparty}
            onChangeStatus={handleChangeStatus}
            onAddTaskForCounterparty={handleOpenAddTaskForCounterparty}
            onOpenMessageModal={handleOpenMessageModal}
          />
        )}

        {activeTab === 'tasks' && (
          <TasksList
            tasks={tasks}
            counterparties={counterparties}
            onAddTask={() => {
              setEditingTask(null);
              setPresetCounterpartyId(undefined);
              setIsTaskModalOpen(true);
            }}
            onEditTask={(task) => {
              setEditingTask(task);
              setIsTaskModalOpen(true);
            }}
            onDeleteTask={handleDeleteTask}
            onToggleStatus={handleToggleTaskStatus}
            onPostponeDays={handlePostponeDays}
            onSelectCounterparty={handleSelectCounterpartyFromTask}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsOverview
            counterparties={counterparties}
            tasks={tasks}
            onOpenTasksTab={() => setActiveTab('tasks')}
            onOpenCounterpartiesTab={() => setActiveTab('counterparties')}
          />
        )}
      </main>

      {/* Modals */}
      <CounterpartyModal
        isOpen={isCpModalOpen}
        onClose={() => setIsCpModalOpen(false)}
        onSave={handleSaveCounterparty}
        initialCounterparty={editingCp}
        tasks={tasks}
        onAddTaskForCounterparty={handleOpenAddTaskForCounterparty}
        onOpenMessageModal={handleOpenMessageModal}
      />

      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSave={handleSaveTask}
        initialTask={editingTask}
        counterparties={counterparties}
        presetCounterpartyId={presetCounterpartyId}
      />

      <BackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        counterparties={counterparties}
        tasks={tasks}
        onDataRestored={(cps, ts) => {
          setCounterparties(cps);
          setTasks(ts);
        }}
      />

      <ClientMessageModal
        isOpen={isMessageModalOpen}
        onClose={() => setIsMessageModalOpen(false)}
        counterparty={selectedCpForMessage}
      />
    </div>
  );
}
