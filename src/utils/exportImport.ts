import { Counterparty, Task, CounterpartyStatus } from '../types';
import { STATUS_CONFIG } from '../components/CounterpartyStatusBadge';

function escapeCsvField(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * Exports counterparties to CSV format with UTF-8 BOM for Russian Excel
 */
export function exportCounterpartiesToCsv(counterparties: Counterparty[]): void {
  const headers = [
    'Название',
    'Статус',
    'Сумма',
    'Валюта',
    'Оплачено',
    'Этап / Категория',
    'Дата КЭВ',
    'ИНН',
    'Банковские реквизиты',
    'Примечания для себя',
    'Этапов завершено',
  ];

  const rows = counterparties.map((cp) => {
    const statusLabel = STATUS_CONFIG[cp.status]?.label || cp.status;
    const milestonesCount = cp.milestones?.length
      ? `${cp.milestones.filter((m) => m.status === 'paid').length}/${cp.milestones.length}`
      : '';

    return [
      escapeCsvField(cp.name),
      escapeCsvField(statusLabel),
      escapeCsvField(cp.amount || 0),
      escapeCsvField(cp.currency || 'RUB'),
      escapeCsvField(cp.paidAmount ?? ''),
      escapeCsvField(cp.categoryOrStage ?? ''),
      escapeCsvField(cp.date ?? ''),
      escapeCsvField(cp.inn ?? ''),
      escapeCsvField(cp.bankDetails ?? ''),
      escapeCsvField(cp.notes ?? ''),
      escapeCsvField(milestonesCount),
    ].join(';');
  });

  const csvContent = '\uFEFF' + [headers.map(escapeCsvField).join(';'), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const dateStr = new Date().toISOString().slice(0, 10);
  link.download = `counterparties_${dateStr}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Exports tasks to CSV
 */
export function exportTasksToCsv(tasks: Task[]): void {
  const headers = [
    'Задача',
    'Связанный контрагент',
    'Статус',
    'Приоритет',
    'Срок выполнения',
    'Регулярность',
    'Примечания',
    'Завершена',
  ];

  const rows = tasks.map((t) => [
    escapeCsvField(t.title),
    escapeCsvField(t.counterpartyName ?? ''),
    escapeCsvField(t.status === 'done' ? 'Выполнена' : t.status === 'in_progress' ? 'В работе' : 'К выполнению'),
    escapeCsvField(t.priority),
    escapeCsvField(t.dueDate),
    escapeCsvField(t.isRecurring ? `Повтор: ${t.recurrence}` : 'Разовая'),
    escapeCsvField(t.notes ?? ''),
    escapeCsvField(t.completedAt ?? ''),
  ].join(';'));

  const csvContent = '\uFEFF' + [headers.map(escapeCsvField).join(';'), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const dateStr = new Date().toISOString().slice(0, 10);
  link.download = `tasks_${dateStr}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Parses simple CSV content and returns imported counterparties
 */
export function importCounterpartiesFromCsv(csvText: string): Counterparty[] {
  // Strip BOM if present
  const clean = csvText.replace(/^\uFEFF/, '');
  const lines = clean.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  // Determine delimiter: ; or ,
  const firstLine = lines[0];
  const delim = firstLine.includes(';') ? ';' : ',';

  // Parse lines considering quotes
  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (c === delim && !inQuotes) {
        result.push(cur.trim());
        cur = '';
      } else {
        cur += c;
      }
    }
    result.push(cur.trim());
    return result;
  };

  const statusMap: Record<string, CounterpartyStatus> = {
    'выставить чуть позже': 'bill_later',
    'выставил счет': 'bill_sent',
    'оплата пришла': 'paid',
    'пауза': 'paused',
    'в работе': 'in_progress',
  };

  const imported: Counterparty[] = [];
  // Skip header line
  for (let i = 1; i < lines.length; i++) {
    const cols = parseLine(lines[i]);
    if (!cols[0]) continue;

    const name = cols[0];
    const rawStatus = (cols[1] || '').toLowerCase();
    const status: CounterpartyStatus = statusMap[rawStatus] || 'bill_later';
    const amount = parseFloat((cols[2] || '0').replace(/\s+/g, '').replace(',', '.')) || 0;
    const currency = (cols[3] === 'KZT' || cols[3] === 'USD' || cols[3] === 'EUR') ? cols[3] : 'RUB';
    const paidAmount = cols[4] ? parseFloat(cols[4].replace(/\s+/g, '').replace(',', '.')) : undefined;
    const categoryOrStage = cols[5] || undefined;
    const date = cols[6] || undefined;
    const inn = cols[7] || undefined;
    const bankDetails = cols[8] || undefined;
    const notes = cols[9] || '';

    imported.push({
      id: `cp-csv-${Date.now()}-${i}`,
      name,
      status,
      amount,
      currency,
      paidAmount,
      categoryOrStage,
      date,
      inn,
      bankDetails,
      notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  return imported;
}
