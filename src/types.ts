export type CounterpartyStatus = 
  | 'bill_later'      // Выставить чуть позже
  | 'bill_sent'       // Выставил счет
  | 'paid'            // Оплата пришла
  | 'paused'          // Пауза
  | 'in_progress'     // В работе
  | 'cancelled';      // Отменено

export interface Milestone {
  id: string;
  title: string;                  // например "Этап 1/3 (Аванс)", "Этап 2/3", "Финал"
  amount: number;                 // сумма данного этапа
  status: 'pending' | 'invoiced' | 'paid';
  dueDate?: string;               // ориентировочный срок этапа
  paidAt?: string;                // дата фактической оплаты
}

export interface ActivityLogItem {
  id: string;
  timestamp: string;              // ISO дата-время
  type: 'status_change' | 'milestone' | 'note' | 'task_created' | 'invoice_sent' | 'payment';
  title?: string;
  description?: string;
  author?: string;
}

export interface Counterparty {
  id: string;
  name: string;
  status: CounterpartyStatus;
  amount: number;
  currency: 'RUB' | 'KZT' | 'USD' | 'EUR';
  categoryOrStage?: string;     // например "25.03 2/3", "16.10 2/3", "тенге 18.10 2/3"
  paidAmount?: number;          // фактически оплачено
  inn?: string;                 // ИНН или реквизиты
  bankDetails?: string;         // Банк, р/с
  notes: string;                // Примечания для себя
  date?: string;                // Дата КЭВ / ориентировочная дата
  milestones?: Milestone[];     // Интерактивные этапы договора (милстоуны)
  history?: ActivityLogItem[];  // Журнал событий и взаимодействий
  createdAt: string;
  updatedAt: string;
}

export type TaskPriority = 'urgent' | 'high' | 'normal' | 'low';
export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskRecurrence = 
  | 'none'          // Не повторять
  | 'daily'         // Каждый день
  | 'weekly'        // Каждую неделю
  | 'biweekly'      // Каждые 2 недели
  | 'monthly'       // Раз в месяц
  | 'quarterly'     // Раз в квартал
  | 'custom_days';  // Каждые N дней

export interface Task {
  id: string;
  title: string;
  counterpartyId?: string;      // ID связанного контрагента
  counterpartyName?: string;    // Название контрагента
  dueDate: string;              // ISO строка или YYYY-MM-DDTHH:mm
  status: TaskStatus;
  priority: TaskPriority;
  isRecurring: boolean;
  recurrence: TaskRecurrence;
  recurrenceIntervalDays?: number;
  notes?: string;               // Примечание к задаче
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type ViewTab = 'counterparties' | 'tasks' | 'analytics';
