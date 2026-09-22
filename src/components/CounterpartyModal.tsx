import React, { useState, useEffect } from 'react';
import { Counterparty, CounterpartyStatus, Task, Milestone, ActivityLogItem } from '../types';
import { X, Building2, Plus, Calendar, AlertCircle, Layers, History, Trash2, CheckCircle2, Clock, Send, MessageSquare } from 'lucide-react';
import { STATUS_CONFIG } from './CounterpartyStatusBadge';
import { formatCurrency, formatDateRu } from '../utils/formatters';

interface CounterpartyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (cp: Counterparty) => void;
  initialCounterparty?: Counterparty | null;
  tasks?: Task[];
  onAddTaskForCounterparty?: (counterpartyId: string) => void;
  onOpenMessageModal?: (cp: Counterparty) => void;
}

export const CounterpartyModal: React.FC<CounterpartyModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialCounterparty,
  tasks = [],
  onAddTaskForCounterparty,
  onOpenMessageModal,
}) => {
  const [name, setName] = useState('');
  const [status, setStatus] = useState<CounterpartyStatus>('bill_later');
  const [amount, setAmount] = useState<string>('');
  const [paidAmount, setPaidAmount] = useState<string>('');
  const [currency, setCurrency] = useState<'RUB' | 'KZT' | 'USD' | 'EUR'>('RUB');
  const [categoryOrStage, setCategoryOrStage] = useState('');
  const [date, setDate] = useState('');
  const [inn, setInn] = useState('');
  const [bankDetails, setBankDetails] = useState('');
  const [notes, setNotes] = useState('');
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [history, setHistory] = useState<ActivityLogItem[]>([]);
  const [newLogNote, setNewLogNote] = useState('');
  const [activeTab, setActiveTab] = useState<'main' | 'milestones' | 'history'>('main');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setError('');
      setActiveTab('main');
      setNewLogNote('');
      if (initialCounterparty) {
        setName(initialCounterparty.name);
        setStatus(initialCounterparty.status);
        setAmount(initialCounterparty.amount?.toString() || '');
        setPaidAmount(initialCounterparty.paidAmount?.toString() || '');
        setCurrency(initialCounterparty.currency || 'RUB');
        setCategoryOrStage(initialCounterparty.categoryOrStage || '');
        setDate(initialCounterparty.date || '');
        setInn(initialCounterparty.inn || '');
        setBankDetails(initialCounterparty.bankDetails || '');
        setNotes(initialCounterparty.notes || '');
        setMilestones(initialCounterparty.milestones ? [...initialCounterparty.milestones] : []);
        setHistory(initialCounterparty.history ? [...initialCounterparty.history] : []);
      } else {
        setName('');
        setStatus('bill_later');
        setAmount('');
        setPaidAmount('');
        setCurrency('RUB');
        setCategoryOrStage('');
        setDate(new Date().toISOString().slice(0, 10));
        setInn('');
        setBankDetails('');
        setNotes('');
        setMilestones([]);
        setHistory([]);
      }
    }
  }, [isOpen, initialCounterparty]);

  if (!isOpen) return null;

  const handleAddMilestone = () => {
    const totalAmount = parseFloat(amount.replace(/\s+/g, '').replace(',', '.')) || 0;
    const stageNum = milestones.length + 1;
    const newMs: Milestone = {
      id: `ms-${Date.now()}-${stageNum}`,
      title: `Этап ${stageNum}`,
      amount: totalAmount > 0 && stageNum === 1 ? totalAmount : 0,
      status: 'pending',
    };
    setMilestones([...milestones, newMs]);
  };

  const handleAutoSplit3Stages = () => {
    const totalAmount = parseFloat(amount.replace(/\s+/g, '').replace(',', '.')) || 0;
    const part = Math.round(totalAmount / 3);
    const msList: Milestone[] = [
      { id: `ms-${Date.now()}-1`, title: 'Этап 1/3 (Аванс)', amount: part, status: 'paid' },
      { id: `ms-${Date.now()}-2`, title: 'Этап 2/3 (Промежуточный)', amount: part, status: 'invoiced' },
      { id: `ms-${Date.now()}-3`, title: 'Этап 3/3 (Финал)', amount: totalAmount - (part * 2), status: 'pending' },
    ];
    setMilestones(msList);
    setCategoryOrStage('2/3');
  };

  const handleUpdateMilestone = (id: string, updates: Partial<Milestone>) => {
    setMilestones(milestones.map((m) => (m.id === id ? { ...m, ...updates } : m)));
  };

  const handleRemoveMilestone = (id: string) => {
    setMilestones(milestones.filter((m) => m.id !== id));
  };

  const handleAddHistoryLog = () => {
    if (!newLogNote.trim()) return;
    const item: ActivityLogItem = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'note',
      title: 'Заметка',
      description: newLogNote.trim(),
    };
    setHistory([item, ...history]);
    setNewLogNote('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Укажите название контрагента');
      return;
    }

    const numAmount = parseFloat(amount.replace(/\s+/g, '').replace(',', '.')) || 0;
    const numPaid = paidAmount ? parseFloat(paidAmount.replace(/\s+/g, '').replace(',', '.')) || 0 : undefined;

    // Check if status changed to log it
    let updatedHistory = [...history];
    if (initialCounterparty && initialCounterparty.status !== status) {
      updatedHistory.unshift({
        id: `log-${Date.now()}-status`,
        timestamp: new Date().toISOString(),
        type: 'status_change',
        title: 'Смена статуса',
        description: `Статус изменен на "${STATUS_CONFIG[status]?.label || status}"`,
      });
    }

    const item: Counterparty = {
      id: initialCounterparty?.id || `cp-${Date.now()}`,
      name: name.trim(),
      status,
      amount: numAmount,
      currency,
      paidAmount: numPaid,
      categoryOrStage: categoryOrStage.trim() || undefined,
      date: date.trim() || undefined,
      inn: inn.trim() || undefined,
      bankDetails: bankDetails.trim() || undefined,
      notes: notes.trim(),
      milestones: milestones.length > 0 ? milestones : undefined,
      history: updatedHistory.length > 0 ? updatedHistory : undefined,
      createdAt: initialCounterparty?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(item);
    onClose();
  };

  const linkedTasks = initialCounterparty
    ? tasks.filter((t) => t.counterpartyId === initialCounterparty.id)
    : [];

  return (
    <div
      id="counterparty-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="counterparty-modal-container"
        className="w-full max-w-2xl bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                {initialCounterparty ? 'Контрагент: ' + initialCounterparty.name : 'Новый контрагент'}
              </h2>
              <p className="text-xs text-slate-500">
                Учёт статуса, суммы платежа, реквизитов и личных примечаний
              </p>
            </div>
          </div>
          <button
            id="close-counterparty-modal-btn"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 px-6 pt-2 border-b border-slate-200 bg-slate-50/30">
          <button
            type="button"
            onClick={() => setActiveTab('main')}
            className={`px-3 py-2 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'main'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Основная информация
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('milestones')}
            className={`px-3 py-2 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === 'milestones'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Этапы договора {milestones.length > 0 && `(${milestones.length})`}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`px-3 py-2 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === 'history'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Журнал и история {history.length > 0 && `(${history.length})`}</span>
          </button>

          {initialCounterparty && onOpenMessageModal && (
            <button
              type="button"
              onClick={() => onOpenMessageModal(initialCounterparty)}
              className="ml-auto inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
              <span>Сообщение клиенту</span>
            </button>
          )}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="flex items-center gap-2 p-3 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {activeTab === 'main' && (
            <div className="space-y-4">
              {/* Name & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                    Название контрагента <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="cp-name-input"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="ООО Компания, ИП Фамилия И.О."
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                    Текущий статус
                  </label>
                  <select
                    id="cp-status-select"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as CounterpartyStatus)}
                    className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors"
                  >
                    {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                      <option key={key} value={key}>
                        {cfg.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Amount, Currency & Paid Amount */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-slate-50/70 border border-slate-200/80 rounded-xl">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                    Сколько платит (сумма)
                  </label>
                  <div className="relative">
                    <input
                      id="cp-amount-input"
                      type="text"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="200 000"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                    Валюта
                  </label>
                  <select
                    id="cp-currency-select"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as any)}
                    className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  >
                    <option value="RUB">₽ — Российский рубль</option>
                    <option value="KZT">₸ — Казахстанский тенге</option>
                    <option value="USD">$ — Доллар США</option>
                    <option value="EUR">€ — Евро</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                    Фактически оплачено
                  </label>
                  <input
                    id="cp-paid-amount-input"
                    type="text"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                    placeholder="Если была предоплата"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>
              </div>

              {/* Stage / Details & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                    Отрасль / Оборот / Этап договора
                  </label>
                  <input
                    id="cp-stage-input"
                    type="text"
                    value={categoryOrStage}
                    onChange={(e) => setCategoryOrStage(e.target.value)}
                    placeholder="Например: 25.03 2/3, постоянные, тенге..."
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                    Дата КЭВ / Планируемая дата
                  </label>
                  <div className="relative">
                    <input
                      id="cp-date-input"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    />
                  </div>
                </div>
              </div>

              {/* INN & Bank Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                    ИНН / КПП
                  </label>
                  <input
                    id="cp-inn-input"
                    type="text"
                    value={inn}
                    onChange={(e) => setInn(e.target.value)}
                    placeholder="770665058100"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                    Банковские реквизиты / Расчетный счет
                  </label>
                  <input
                    id="cp-bank-input"
                    type="text"
                    value={bankDetails}
                    onChange={(e) => setBankDetails(e.target.value)}
                    placeholder="Банк Точка, р/с 40702810..."
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>
              </div>

              {/* Notes for Self */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Дополнительные примечания для себя
                </label>
                <textarea
                  id="cp-notes-textarea"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Личные пометки, договорённости, условия паузы, контакты бухгалтера..."
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 resize-none transition-colors"
                />
              </div>

              {/* Linked Tasks preview (if editing existing counterparty) */}
              {initialCounterparty && (
                <div className="pt-3 border-t border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                      Задачи по контрагенту ({linkedTasks.length})
                    </span>
                    {onAddTaskForCounterparty && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onAddTaskForCounterparty(initialCounterparty.id);
                        }}
                        className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
                      >
                        <Plus className="w-3.5 h-3.5" /> Поставить задачу
                      </button>
                    )}
                  </div>

                  {linkedTasks.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-1">Нет активных задач для этого контрагента</p>
                  ) : (
                    <div className="space-y-1.5">
                      {linkedTasks.map((t) => (
                        <div
                          key={t.id}
                          className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                        >
                          <span className={`font-medium ${t.status === 'done' ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                            {t.title}
                          </span>
                          <span className="text-slate-500 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {t.dueDate ? t.dueDate.slice(0, 10) : 'Без срока'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'milestones' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div>
                  <div className="text-xs font-semibold text-slate-800">Этапы договора (Милстоуны)</div>
                  <div className="text-[11px] text-slate-500">
                    Например, разбивка оплаты 1/3, 2/3, 3/3 или 30% / 40% / 30%
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAutoSplit3Stages}
                    className="px-2.5 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-md border border-blue-200 transition-colors"
                  >
                    Разбить на 3 этапа
                  </button>
                  <button
                    type="button"
                    onClick={handleAddMilestone}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-white text-slate-700 hover:bg-slate-100 rounded-md border border-slate-300 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Добавить этап
                  </button>
                </div>
              </div>

              {milestones.length === 0 ? (
                <div className="p-8 text-center bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
                  <Layers className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-600 font-medium">Этапы договора пока не добавлены</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Нажмите «Разбить на 3 этапа» или «Добавить этап» для детального учёта траншей
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {milestones.map((ms, idx) => (
                    <div
                      key={ms.id}
                      className="p-3 bg-white border border-slate-200 rounded-lg space-y-2 hover:border-slate-300 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-400">#{idx + 1}</span>
                        <input
                          type="text"
                          value={ms.title}
                          onChange={(e) => handleUpdateMilestone(ms.id, { title: e.target.value })}
                          placeholder="Название этапа (напр. Этап 1/3: Предоплата)"
                          className="flex-1 px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-800 font-medium"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveMilestone(ms.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[10px] text-slate-500 uppercase font-semibold mb-0.5">
                            Сумма этапа
                          </label>
                          <input
                            type="number"
                            value={ms.amount || ''}
                            onChange={(e) => handleUpdateMilestone(ms.id, { amount: parseFloat(e.target.value) || 0 })}
                            placeholder="0"
                            className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-900 font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] text-slate-500 uppercase font-semibold mb-0.5">
                            Статус этапа
                          </label>
                          <select
                            value={ms.status}
                            onChange={(e) => handleUpdateMilestone(ms.id, { status: e.target.value as any })}
                            className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-800"
                          >
                            <option value="pending">Ожидает (В планах)</option>
                            <option value="invoiced">Счет выставлен</option>
                            <option value="paid">Оплачен ✓</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] text-slate-500 uppercase font-semibold mb-0.5">
                            Плановая дата
                          </label>
                          <input
                            type="date"
                            value={ms.dueDate || ''}
                            onChange={(e) => handleUpdateMilestone(ms.id, { dueDate: e.target.value })}
                            className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-800"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="text-xs font-semibold text-slate-800 mb-1">Добавить запись в журнал</div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newLogNote}
                    onChange={(e) => setNewLogNote(e.target.value)}
                    placeholder="Например: Позвонил бухгалтер, согласовали оплату на четверг..."
                    className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md text-slate-800"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddHistoryLog();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddHistoryLog}
                    className="px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                  >
                    Записать
                  </button>
                </div>
              </div>

              {history.length === 0 ? (
                <div className="p-8 text-center bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
                  <History className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-600 font-medium">История взаимодействия пуста</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Все смены статусов и добавленные пометки будут сохраняться здесь
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {history.map((h) => (
                    <div
                      key={h.id}
                      className="flex items-start gap-2.5 p-2.5 bg-white border border-slate-200 rounded-lg text-xs"
                    >
                      <span className="p-1 bg-slate-100 rounded text-slate-500 mt-0.5">
                        <Clock className="w-3.5 h-3.5" />
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-0.5">
                          <span>{new Date(h.timestamp).toLocaleString('ru-RU')}</span>
                          <span className="font-semibold text-slate-500 uppercase text-[10px]">
                            {h.type === 'status_change' ? 'Статус' : h.type === 'payment' ? 'Оплата' : 'Пометка'}
                          </span>
                        </div>
                        <p className="text-slate-800 whitespace-pre-wrap">{h.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Отмена
            </button>
            <button
              id="save-counterparty-btn"
              type="submit"
              className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
            >
              {initialCounterparty ? 'Сохранить изменения' : 'Добавить контрагента'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
