import { Counterparty, Task } from '../types';
import { STATUS_CONFIG } from '../components/CounterpartyStatusBadge';

/**
 * Generates TSV (Tab-Separated Values) text formatted specifically for Google Sheets pasting.
 * User can copy this and press Ctrl+V directly into Google Sheets!
 */
export function generateGoogleSheetsTsv(counterparties: Counterparty[]): string {
  const headers = [
    'Контрагент',
    'Статус',
    'Сумма',
    'Валюта',
    'Оплачено',
    'Этап / Категория',
    'Дата КЭВ',
    'ИНН',
    'Реквизиты банка',
    'Примечания для себя',
  ];

  const rows = counterparties.map((cp) => [
    cp.name,
    STATUS_CONFIG[cp.status]?.label || cp.status,
    cp.amount || 0,
    cp.currency || 'RUB',
    cp.paidAmount ?? '',
    cp.categoryOrStage ?? '',
    cp.date ?? '',
    cp.inn ?? '',
    cp.bankDetails ?? '',
    cp.notes ?? '',
  ]);

  return [headers.join('\t'), ...rows.map((r) => r.join('\t'))].join('\n');
}

/**
 * Creates an exportable cloud sync code / URL string
 */
export function generateSyncCode(counterparties: Counterparty[], tasks: Task[]): string {
  const payload = {
    v: 1,
    ts: Date.now(),
    cp: counterparties,
    t: tasks,
  };
  const json = JSON.stringify(payload);
  // Using base64 encoding with utf8 support
  return btoa(encodeURIComponent(json));
}

/**
 * Decodes a sync code / URL string
 */
export function decodeSyncCode(code: string): { counterparties: Counterparty[]; tasks: Task[] } | null {
  try {
    const json = decodeURIComponent(atob(code.trim()));
    const parsed = JSON.parse(json);
    if (!parsed || !Array.isArray(parsed.cp)) return null;
    return {
      counterparties: parsed.cp,
      tasks: Array.isArray(parsed.t) ? parsed.t : [],
    };
  } catch (err) {
    console.error('Failed to decode sync code:', err);
    return null;
  }
}
