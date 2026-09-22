import { Task, Counterparty } from '../types';
import { getTaskUrgency } from './taskUtils';

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!isNotificationSupported()) return 'unsupported';
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.error('Error requesting notification permission:', err);
    return 'denied';
  }
}

export function sendBrowserNotification(title: string, options?: NotificationOptions): boolean {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return false;
  }

  try {
    new Notification(title, {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      ...options,
    });
    return true;
  } catch (err) {
    console.error('Failed to trigger Notification:', err);
    return false;
  }
}

/**
 * Checks for overdue or urgent tasks and pending bills, then sends a notification
 */
export function checkAndNotifyDeadlines(tasks: Task[], counterparties: Counterparty[]): boolean {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return false;
  }

  let urgentTasksCount = 0;
  tasks.forEach((t) => {
    if (t.status !== 'done') {
      const u = getTaskUrgency(t);
      if (u.isApproaching) urgentTasksCount++;
    }
  });

  const todayStr = new Date().toISOString().slice(0, 10);
  const billsToIssueToday = counterparties.filter(
    (cp) => cp.status === 'bill_later' && cp.date && cp.date <= todayStr
  ).length;

  if (urgentTasksCount > 0 || billsToIssueToday > 0) {
    const parts: string[] = [];
    if (urgentTasksCount > 0) {
      parts.push(`Горящих задач: ${urgentTasksCount}`);
    }
    if (billsToIssueToday > 0) {
      parts.push(`Счетов к выставлению: ${billsToIssueToday}`);
    }

    sendBrowserNotification('Контрагенты и Задачи: контроль дедлайнов', {
      body: parts.join(' • ') + '. Нажмите, чтобы открыть планировщик.',
    });
    return true;
  }

  return false;
}
