import React, { useState, useEffect } from 'react';
import { Task, Counterparty, TaskPriority, TaskRecurrence, TaskStatus } from '../types';
import { RECURRENCE_LABELS } from '../utils/taskUtils';
import { X, Calendar, Clock, Repeat, AlertCircle, Building2 } from 'lucide-react';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Task) => void;
  initialTask?: Task | null;
  counterparties: Counterparty[];
  presetCounterpartyId?: string;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialTask,
  counterparties,
  presetCounterpartyId,
}) => {
  const [title, setTitle] = useState('');
  const [counterpartyId, setCounterpartyId] = useState<string>('');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [priority, setPriority] = useState<TaskPriority>('normal');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrence, setRecurrence] = useState<TaskRecurrence>('weekly');
  const [recurrenceIntervalDays, setRecurrenceIntervalDays] = useState<number>(7);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setError('');
      if (initialTask) {
        setTitle(initialTask.title);
        setCounterpartyId(initialTask.counterpartyId || '');
        setDueDate(initialTask.dueDate ? initialTask.dueDate.slice(0, 16) : '');
        setStatus(initialTask.status);
        setPriority(initialTask.priority);
        setIsRecurring(initialTask.isRecurring);
        setRecurrence(initialTask.recurrence || 'weekly');
        setRecurrenceIntervalDays(initialTask.recurrenceIntervalDays || 7);
        setNotes(initialTask.notes || '');
      } else {
        // New task
        setTitle('');
        setCounterpartyId(presetCounterpartyId || '');
        // default deadline: today at 18:00
        const defaultDue = new Date();
        defaultDue.setHours(18, 0, 0, 0);
        setDueDate(defaultDue.toISOString().slice(0, 16));
        setStatus('todo');
        setPriority('normal');
        setIsRecurring(false);
        setRecurrence('weekly');
        setRecurrenceIntervalDays(7);
        setNotes('');
      }
    }
  }, [isOpen, initialTask, presetCounterpartyId]);

  if (!isOpen) return null;

  const handleQuickDate = (daysOffset: number, hour: number = 18) => {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    d.setHours(hour, 0, 0, 0);
    setDueDate(d.toISOString().slice(0, 16));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Укажите название задачи');
      return;
    }

    const selectedCp = counterparties.find((c) => c.id === counterpartyId);

    const taskData: Task = {
      id: initialTask?.id || `task-${Date.now()}`,
      title: title.trim(),
      counterpartyId: counterpartyId || undefined,
      counterpartyName: selectedCp ? selectedCp.name : undefined,
      dueDate: dueDate || '',
      status,
      priority,
      isRecurring,
      recurrence: isRecurring ? recurrence : 'none',
      recurrenceIntervalDays: isRecurring && recurrence === 'custom_days' ? Number(recurrenceIntervalDays) : undefined,
      notes: notes.trim(),
      completedAt: status === 'done' ? (initialTask?.completedAt || new Date().toISOString()) : undefined,
      createdAt: initialTask?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(taskData);
    onClose();
  };

  return (
    <div
      id="task-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="task-modal-container"
        className="w-full max-w-xl bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {initialTask ? 'Редактировать задачу' : 'Новая задача'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Срочные задачи и задачи с приближающимся дедлайном отображаются сверху
            </p>
          </div>
          <button
            id="close-task-modal-btn"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="flex items-center gap-2 p-3 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Название задачи <span className="text-rose-500">*</span>
            </label>
            <input
              id="task-title-input"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Например: Выставить счет за этап 2/3, запросить акт..."
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors"
            />
          </div>

          {/* Linked Counterparty */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Связанный контрагент
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 absolute left-3 top-3 text-slate-400 pointer-events-none" />
              <select
                id="task-counterparty-select"
                value={counterpartyId}
                onChange={(e) => setCounterpartyId(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors"
              >
                <option value="">Без привязки к контрагенту (Общая задача)</option>
                {counterparties.map((cp) => (
                  <option key={cp.id} value={cp.id}>
                    {cp.name} ({cp.amount > 0 ? `${cp.amount.toLocaleString('ru-RU')} ₽` : 'Без суммы'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Due Date & Quick presets */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                Срок выполнения (дедлайн)
              </label>
              <span className="text-xs text-slate-400">Горящие дедлайны поднимаются вверх</span>
            </div>

            <div className="relative mb-2">
              <input
                id="task-duedate-input"
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors"
              />
            </div>

            {/* Quick date chips */}
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickDate(0, 18)}
                className="px-2.5 py-1 text-xs font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-md transition-colors"
              >
                Сегодня в 18:00
              </button>
              <button
                type="button"
                onClick={() => handleQuickDate(1, 12)}
                className="px-2.5 py-1 text-xs font-medium text-orange-800 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-md transition-colors"
              >
                Завтра в 12:00
              </button>
              <button
                type="button"
                onClick={() => handleQuickDate(3, 15)}
                className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
              >
                Через 3 дня
              </button>
              <button
                type="button"
                onClick={() => handleQuickDate(7, 12)}
                className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
              >
                Через неделю
              </button>
              <button
                type="button"
                onClick={() => handleQuickDate(30, 12)}
                className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
              >
                Через месяц
              </button>
            </div>
          </div>

          {/* Priority & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Приоритет
              </label>
              <select
                id="task-priority-select"
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors"
              >
                <option value="urgent">🔥 Срочный (немедленно)</option>
                <option value="high">⚡ Высокий</option>
                <option value="normal">Обычный</option>
                <option value="low">Низкий</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Статус
              </label>
              <select
                id="task-status-select"
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors"
              >
                <option value="todo">К выполнению</option>
                <option value="in_progress">В процессе</option>
                <option value="done">Выполнено</option>
              </select>
            </div>
          </div>

          {/* Regularity / Recurrence */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Repeat className="w-4 h-4 text-blue-600" />
                <label htmlFor="recurring-checkbox" className="text-sm font-medium text-slate-900 cursor-pointer">
                  Сделать задачу регулярной
                </label>
              </div>
              <input
                id="recurring-checkbox"
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
              />
            </div>

            {isRecurring && (
              <div className="pt-2 border-t border-slate-200/80 space-y-3 animate-in fade-in duration-150">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Периодичность повторения
                  </label>
                  <select
                    id="recurrence-select"
                    value={recurrence}
                    onChange={(e) => setRecurrence(e.target.value as TaskRecurrence)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors"
                  >
                    <option value="daily">{RECURRENCE_LABELS.daily}</option>
                    <option value="weekly">{RECURRENCE_LABELS.weekly}</option>
                    <option value="biweekly">{RECURRENCE_LABELS.biweekly}</option>
                    <option value="monthly">{RECURRENCE_LABELS.monthly}</option>
                    <option value="quarterly">{RECURRENCE_LABELS.quarterly}</option>
                    <option value="custom_days">{RECURRENCE_LABELS.custom_days}</option>
                  </select>
                </div>

                {recurrence === 'custom_days' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Интервал в днях
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={365}
                      value={recurrenceIntervalDays}
                      onChange={(e) => setRecurrenceIntervalDays(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-32 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    />
                  </div>
                )}

                <p className="text-xs text-slate-500 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  При отметке выполнения система автоматически создаст следующий запланированный цикл.
                </p>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Примечание к задаче
            </label>
            <textarea
              id="task-notes-textarea"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Дополнительные детали, ссылки, комментарии..."
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Отмена
            </button>
            <button
              id="save-task-btn"
              type="submit"
              className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
            >
              {initialTask ? 'Сохранить изменения' : 'Создать задачу'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
