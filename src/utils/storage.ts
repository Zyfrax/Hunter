import { Counterparty, Task } from '../types';
import { INITIAL_COUNTERPARTIES, INITIAL_TASKS } from '../data/initialData';

const STORAGE_KEYS = {
  COUNTERPARTIES: 'counterparties_data_v1',
  TASKS: 'counterparties_tasks_v1',
};

export function loadCounterparties(): Counterparty[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.COUNTERPARTIES);
    if (!raw) {
      saveCounterparties(INITIAL_COUNTERPARTIES);
      return INITIAL_COUNTERPARTIES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_COUNTERPARTIES;
  } catch (err) {
    console.error('Error loading counterparties from localStorage:', err);
    return INITIAL_COUNTERPARTIES;
  }
}

export function saveCounterparties(data: Counterparty[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.COUNTERPARTIES, JSON.stringify(data));
  } catch (err) {
    console.error('Error saving counterparties to localStorage:', err);
  }
}

export function loadTasks(): Task[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TASKS);
    if (!raw) {
      saveTasks(INITIAL_TASKS);
      return INITIAL_TASKS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_TASKS;
  } catch (err) {
    console.error('Error loading tasks from localStorage:', err);
    return INITIAL_TASKS;
  }
}

export function saveTasks(data: Task[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(data));
  } catch (err) {
    console.error('Error saving tasks to localStorage:', err);
  }
}

export function exportBackup(counterparties: Counterparty[], tasks: Task[]): void {
  const backup = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    counterparties,
    tasks,
  };
  const jsonStr = JSON.stringify(backup, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const dateStr = new Date().toISOString().slice(0, 10);
  link.download = `counterparties_backup_${dateStr}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

export function resetToDefaults(): { counterparties: Counterparty[]; tasks: Task[] } {
  saveCounterparties(INITIAL_COUNTERPARTIES);
  saveTasks(INITIAL_TASKS);
  return {
    counterparties: INITIAL_COUNTERPARTIES,
    tasks: INITIAL_TASKS,
  };
}
