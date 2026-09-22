import React, { useState, useMemo } from 'react';
import { Counterparty, CounterpartyStatus, Task } from '../types';
import { CounterpartyStatusBadge, STATUS_CONFIG } from './CounterpartyStatusBadge';
import { formatCurrency, formatDateRu } from '../utils/formatters';
import { exportCounterpartiesToCsv } from '../utils/exportImport';
import { CounterpartiesKanban } from './CounterpartiesKanban';
import { MilestonesTracker } from './MilestonesTracker';
import { 
  Plus, 
  Search, 
  Building2, 
  Edit3, 
  Trash2, 
  CheckSquare, 
  ArrowUpDown, 
  Banknote, 
  FileText,
  Calendar,
  AlertCircle,
  FileSpreadsheet,
  LayoutGrid,
  Table as TableIcon,
  MessageSquare
} from 'lucide-react';

interface CounterpartiesTableProps {
  counterparties: Counterparty[];
  tasks: Task[];
  onAddCounterparty: () => void;
  onEditCounterparty: (cp: Counterparty) => void;
  onDeleteCounterparty: (id: string) => void;
  onChangeStatus: (id: string, status: CounterpartyStatus) => void;
  onAddTaskForCounterparty: (counterpartyId: string) => void;
  onOpenMessageModal: (cp: Counterparty) => void;
}

export const CounterpartiesTable: React.FC<CounterpartiesTableProps> = ({
  counterparties,
  tasks,
  onAddCounterparty,
  onEditCounterparty,
  onDeleteCounterparty,
  onChangeStatus,
  onAddTaskForCounterparty,
  onOpenMessageModal,
}) => {
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<'amount' | 'name' | 'status' | 'date'>('amount');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [openStatusDropdownId, setOpenStatusDropdownId] = useState<string | null>(null);

  // Status counts
  const counts = useMemo(() => {
    const res: Record<string, number> = { all: counterparties.length };
    counterparties.forEach((cp) => {
      res[cp.status] = (res[cp.status] || 0) + 1;
    });
    return res;
  }, [counterparties]);

  // Filtered & sorted
  const filteredList = useMemo(() => {
    let result = counterparties.filter((cp) => {
      if (statusFilter !== 'all' && cp.status !== statusFilter) {
        return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesName = cp.name.toLowerCase().includes(q);
        const matchesNotes = cp.notes.toLowerCase().includes(q);
        const matchesCategory = cp.categoryOrStage?.toLowerCase().includes(q);
        const matchesInn = cp.inn?.toLowerCase().includes(q);
        const matchesBank = cp.bankDetails?.toLowerCase().includes(q);
        if (!matchesName && !matchesNotes && !matchesCategory && !matchesInn && !matchesBank) {
          return false;
        }
      }
      return true;
    });

    result.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'amount') {
        cmp = a.amount - b.amount;
      } else if (sortField === 'name') {
        cmp = a.name.localeCompare(b.name, 'ru');
      } else if (sortField === 'status') {
        cmp = a.status.localeCompare(b.status);
      } else if (sortField === 'date') {
        cmp = (a.date || '').localeCompare(b.date || '');
      }
      return sortAsc ? cmp : -cmp;
    });

    return result;
  }, [counterparties, search, statusFilter, sortField, sortAsc]);

  // Aggregate sums for filtered items
  const totals = useMemo(() => {
    let rub = 0;
    let kzt = 0;
    let other = 0;
    filteredList.forEach((cp) => {
      if (cp.currency === 'KZT') {
        kzt += cp.amount || 0;
      } else if (cp.currency === 'RUB') {
        rub += cp.amount || 0;
      } else {
        other += cp.amount || 0;
      }
    });
    return { rub, kzt, other };
  }, [filteredList]);

  const handleSortToggle = (field: 'amount' | 'name' | 'status' | 'date') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false); // default desc for amount, etc.
    }
  };

  // Helper for counting tasks per counterparty
  const getTasksCount = (cpId: string) => {
    const cpTasks = tasks.filter((t) => t.counterpartyId === cpId);
    const active = cpTasks.filter((t) => t.status !== 'done').length;
    return { total: cpTasks.length, active };
  };

  return (
    <div className="space-y-4">
      {/* Search and Main Actions */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400 pointer-events-none" />
            <input
              id="search-counterparties-input"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по названию, примечаниям, ИНН, этапу..."
              className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors"
            />
          </div>

          {/* Toolbar Right: View Mode Toggle & CSV Export & Add CP */}
          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200">
              <button
                type="button"
                id="view-mode-table-btn"
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  viewMode === 'table'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Табличный вид"
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>Таблица</span>
              </button>
              <button
                type="button"
                id="view-mode-kanban-btn"
                onClick={() => setViewMode('kanban')}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  viewMode === 'kanban'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Канбан-доска счетов"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Канбан</span>
              </button>
            </div>

            {/* Export CSV button */}
            <button
              id="export-csv-btn"
              type="button"
              onClick={() => exportCounterpartiesToCsv(filteredList)}
              title="Экспорт текущей таблицы в Excel / CSV"
              className="inline-flex items-center gap-1 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold rounded-lg transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Экспорт Excel/CSV</span>
            </button>

            {/* Add Counterparty Button */}
            <button
              id="add-counterparty-btn"
              type="button"
              onClick={onAddCounterparty}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-xs transition-colors whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Добавить контрагента</span>
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Все ({counts.all || 0})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('bill_later')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              statusFilter === 'bill_later'
                ? 'bg-amber-700 text-white'
                : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
            }`}
          >
            Выставить чуть позже ({counts.bill_later || 0})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('bill_sent')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              statusFilter === 'bill_sent'
                ? 'bg-blue-700 text-white'
                : 'bg-blue-50 text-blue-900 border border-blue-200 hover:bg-blue-100'
            }`}
          >
            Выставил счет ({counts.bill_sent || 0})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('paid')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              statusFilter === 'paid'
                ? 'bg-emerald-700 text-white'
                : 'bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            Оплата пришла ({counts.paid || 0})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('paused')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              statusFilter === 'paused'
                ? 'bg-purple-700 text-white'
                : 'bg-purple-50 text-purple-900 border border-purple-200 hover:bg-purple-100'
            }`}
          >
            Пауза ({counts.paused || 0})
          </button>
        </div>

        {/* Sum totals indicator */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-xs text-slate-600 bg-slate-50 px-3 py-2 rounded-lg">
          <div className="flex items-center gap-1.5">
            <Banknote className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Сумма по выборке ({filteredList.length} контрагентов):{' '}
              <strong className="text-slate-900 font-semibold">{totals.rub.toLocaleString('ru-RU')} ₽</strong>
              {totals.kzt > 0 && (
                <span> + <strong className="text-slate-900 font-semibold">{totals.kzt.toLocaleString('ru-RU')} ₸</strong></span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-slate-400">Кликните по статусу для быстрого переключения</span>
          </div>
        </div>
      </div>

      {/* Table & Cards Layout vs Kanban */}
      {viewMode === 'kanban' ? (
        <CounterpartiesKanban
          counterparties={filteredList}
          tasks={tasks}
          searchQuery={search}
          onEditCounterparty={onEditCounterparty}
          onChangeStatus={onChangeStatus}
          onAddTaskForCounterparty={onAddTaskForCounterparty}
          onOpenMessageModal={onOpenMessageModal}
        />
      ) : filteredList.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200 shadow-xs">
          <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h4 className="text-sm font-semibold text-slate-800">Контрагенты не найдены</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {search
              ? 'По вашему запросу совпадений нет. Попробуйте изменить параметры поиска.'
              : 'В этой категории пока нет контрагентов.'}
          </p>
          <button
            type="button"
            onClick={onAddCounterparty}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Добавить контрагента
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-600">
                <tr>
                  <th
                    scope="col"
                    className="py-3 px-4 cursor-pointer hover:text-slate-900 transition-colors"
                    onClick={() => handleSortToggle('status')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Статус</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="py-3 px-4 cursor-pointer hover:text-slate-900 transition-colors"
                    onClick={() => handleSortToggle('name')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Контрагент</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="py-3 px-4 cursor-pointer hover:text-slate-900 transition-colors text-right"
                    onClick={() => handleSortToggle('amount')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Сколько платит</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th scope="col" className="py-3 px-4">
                    <span>Примечания для себя</span>
                  </th>
                  <th scope="col" className="py-3 px-4 text-center">
                    <span>Задачи</span>
                  </th>
                  <th scope="col" className="py-3 px-4 text-right">
                    <span>Действия</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredList.map((cp) => {
                  const taskStats = getTasksCount(cp.id);
                  const isMenuOpen = openStatusDropdownId === cp.id;

                  return (
                    <tr
                      key={cp.id}
                      className="hover:bg-slate-50/70 transition-colors group"
                    >
                      {/* Status column with quick dropdown */}
                      <td className="py-3.5 px-4 whitespace-nowrap relative">
                        <div className="relative inline-block text-left">
                          <CounterpartyStatusBadge
                            status={cp.status}
                            clickable
                            onClick={() =>
                              setOpenStatusDropdownId(isMenuOpen ? null : cp.id)
                            }
                          />

                          {/* Quick status dropdown menu */}
                          {isMenuOpen && (
                            <div
                              className="fixed inset-0 z-40"
                              onClick={() => setOpenStatusDropdownId(null)}
                            />
                          )}
                          {isMenuOpen && (
                            <div className="absolute left-0 top-full mt-1 w-52 bg-white rounded-lg shadow-xl border border-slate-200 py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                              <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                                Сменить статус
                              </div>
                              {Object.entries(STATUS_CONFIG).map(([stKey, cfg]) => (
                                <button
                                  key={stKey}
                                  type="button"
                                  onClick={() => {
                                    onChangeStatus(cp.id, stKey as CounterpartyStatus);
                                    setOpenStatusDropdownId(null);
                                  }}
                                  className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                                    cp.status === stKey
                                      ? 'font-semibold text-blue-600 bg-blue-50/40'
                                      : 'text-slate-700'
                                  }`}
                                >
                                  <span className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                                    <span>{cfg.label}</span>
                                  </span>
                                  {cp.status === stKey && <span>✓</span>}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Name & Stage info */}
                      <td className="py-3.5 px-4 min-w-[200px]">
                        <div>
                          <div
                            onClick={() => onEditCounterparty(cp)}
                            className="font-semibold text-slate-900 hover:text-blue-600 cursor-pointer transition-colors"
                          >
                            {cp.name}
                          </div>

                          {/* Secondary tags: stage, date, INN */}
                          <div className="flex flex-wrap items-center gap-1.5 mt-1 text-xs text-slate-500">
                            {cp.categoryOrStage && (
                              <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[11px] font-medium">
                                {cp.categoryOrStage}
                              </span>
                            )}
                            {cp.date && (
                              <span className="flex items-center gap-0.5 text-[11px] text-slate-500">
                                <Calendar className="w-3 h-3 text-slate-400" />
                                {formatDateRu(cp.date)}
                              </span>
                            )}
                            {cp.inn && (
                              <span className="text-[11px] text-slate-400">
                                ИНН: {cp.inn}
                              </span>
                            )}
                          </div>

                          {/* Milestones Compact progress */}
                          {cp.milestones && cp.milestones.length > 0 && (
                            <div className="mt-1.5">
                              <MilestonesTracker milestones={cp.milestones} currency={cp.currency} compact />
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Amount column */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="font-semibold text-slate-900 text-sm">
                          {formatCurrency(cp.amount, cp.currency)}
                        </div>
                        {cp.paidAmount !== undefined && cp.paidAmount > 0 && (
                          <div className="text-xs text-emerald-600 font-medium">
                            Оплачено: {formatCurrency(cp.paidAmount, cp.currency)}
                          </div>
                        )}
                      </td>

                      {/* Notes column */}
                      <td className="py-3.5 px-4 max-w-xs">
                        {cp.notes ? (
                          <p
                            onClick={() => onEditCounterparty(cp)}
                            title="Кликните, чтобы редактировать примечание"
                            className="text-xs text-slate-600 hover:text-slate-900 cursor-pointer line-clamp-2 bg-slate-50/60 p-1.5 rounded border border-slate-100 transition-colors"
                          >
                            {cp.notes}
                          </p>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onEditCounterparty(cp)}
                            className="text-xs text-slate-400 hover:text-blue-600 italic"
                          >
                            + Добавить примечание
                          </button>
                        )}
                        {cp.bankDetails && (
                          <div className="text-[11px] text-slate-400 truncate mt-1">
                            {cp.bankDetails}
                          </div>
                        )}
                      </td>

                      {/* Linked tasks counter & add task button */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          {taskStats.active > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold bg-blue-50 text-blue-700 rounded-md border border-blue-200">
                              <CheckSquare className="w-3 h-3 text-blue-600" />
                              <span>{taskStats.active} активн.</span>
                            </span>
                          ) : taskStats.total > 0 ? (
                            <span className="text-xs text-slate-400">
                              Все {taskStats.total} решены
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}

                          <button
                            type="button"
                            title="Поставить задачу для этого контрагента"
                            onClick={() => onAddTaskForCounterparty(cp.id)}
                            className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            title="Написать клиенту (Telegram / WhatsApp / Email)"
                            onClick={() => onOpenMessageModal(cp)}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            title="Редактировать контрагента"
                            onClick={() => onEditCounterparty(cp)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            title="Удалить"
                            onClick={() => onDeleteCounterparty(cp.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
