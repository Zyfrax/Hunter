export function formatCurrency(amount: number, currency: string = 'RUB'): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '0 ₽';
  }

  const formattedNum = new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: 0,
  }).format(amount);

  switch (currency) {
    case 'KZT':
      return `${formattedNum} ₸`;
    case 'USD':
      return `$${formattedNum}`;
    case 'EUR':
      return `€${formattedNum}`;
    case 'RUB':
    default:
      return `${formattedNum} ₽`;
  }
}

export function formatDateRu(dateStr?: string): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: d.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
    }).format(d);
  } catch {
    return dateStr;
  }
}

export function formatDateTimeRu(dateStr?: string): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return dateStr;
  }
}
