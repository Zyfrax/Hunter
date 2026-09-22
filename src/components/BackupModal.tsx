import React, { useRef, useState } from 'react';
import { Counterparty, Task } from '../types';
import { exportBackup, resetToDefaults, saveCounterparties, saveTasks } from '../utils/storage';
import { generateGoogleSheetsTsv } from '../utils/cloudSync';
import { X, Download, Upload, RotateCcw, AlertTriangle, CheckCircle, Database, FileSpreadsheet, Copy, Check } from 'lucide-react';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  counterparties: Counterparty[];
  tasks: Task[];
  onDataRestored: (counterparties: Counterparty[], tasks: Task[]) => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  isOpen,
  onClose,
  counterparties,
  tasks,
  onDataRestored,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [copiedSheets, setCopiedSheets] = useState(false);

  if (!isOpen) return null;

  const handleExport = () => {
    exportBackup(counterparties, tasks);
    setMsg({ text: 'Файл резервной копии успешно скачан!', type: 'success' });
  };

  const handleCopyForSheets = async () => {
    try {
      const tsv = generateGoogleSheetsTsv(counterparties);
      await navigator.clipboard.writeText(tsv);
      setCopiedSheets(true);
      setMsg({ text: 'Данные скопированы в буфер обмена! Теперь откройте Google Таблицу и нажмите Ctrl+V.', type: 'success' });
      setTimeout(() => setCopiedSheets(false), 3500);
    } catch (err: any) {
      setMsg({ text: 'Не удалось скопировать: ' + err.message, type: 'error' });
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        if (!parsed.counterparties || !Array.isArray(parsed.counterparties)) {
          throw new Error('Некорректный формат файла бэкапа');
        }

        const newCp: Counterparty[] = parsed.counterparties;
        const newTasks: Task[] = Array.isArray(parsed.tasks) ? parsed.tasks : [];

        saveCounterparties(newCp);
        saveTasks(newTasks);
        onDataRestored(newCp, newTasks);
        setMsg({ text: `Успешно загружено: ${newCp.length} контрагентов и ${newTasks.length} задач.`, type: 'success' });
      } catch (err: any) {
        setMsg({ text: 'Ошибка при чтении файла бэкапа: ' + (err.message || 'неверный формат'), type: 'error' });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleReset = () => {
    if (window.confirm('Вы уверены, что хотите сбросить все данные к исходной таблице? Текущие изменения будут заменены.')) {
      const restored = resetToDefaults();
      onDataRestored(restored.counterparties, restored.tasks);
      setMsg({ text: 'Данные сброшены к исходной таблице.', type: 'success' });
    }
  };

  return (
    <div
      id="backup-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="backup-modal-container"
        className="w-full max-w-lg bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Локальное хранение и резервные копии
              </h2>
              <p className="text-xs text-slate-500">
                Все данные сохраняются локально в вашем браузере
              </p>
            </div>
          </div>
          <button
            id="close-backup-modal-btn"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {msg && (
            <div
              className={`p-3 text-sm rounded-lg flex items-center gap-2 ${
                msg.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {msg.type === 'success' ? (
                <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              )}
              <span>{msg.text}</span>
            </div>
          )}

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs text-slate-600">
            <div className="flex justify-between py-1">
              <span>Контрагентов в браузере:</span>
              <strong className="text-slate-900 font-semibold">{counterparties.length}</strong>
            </div>
            <div className="flex justify-between py-1">
              <span>Задач в журнале:</span>
              <strong className="text-slate-900 font-semibold">{tasks.length}</strong>
            </div>
            <div className="flex justify-between py-1 text-emerald-700 font-medium">
              <span>Статус автосохранения:</span>
              <span>Сохранено в localStorage ✓</span>
            </div>
          </div>

          <div className="space-y-3">
            {/* Google Sheets TSV Copy */}
            <div className="flex items-center justify-between p-3.5 border border-emerald-200 bg-emerald-50/30 rounded-xl hover:border-emerald-300 transition-colors">
              <div>
                <h4 className="text-sm font-semibold text-emerald-950 flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  Копировать для Google Таблиц / Excel
                </h4>
                <p className="text-xs text-emerald-800/80">Скопировать все колонки в буфер и вставить прямо в Google Sheets (Ctrl+V)</p>
              </div>
              <button
                type="button"
                onClick={handleCopyForSheets}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-white hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors whitespace-nowrap shadow-2xs"
              >
                {copiedSheets ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedSheets ? 'Скопировано!' : 'Скопировать (Ctrl+V)'}
              </button>
            </div>

            {/* Export */}
            <div className="flex items-center justify-between p-3.5 border border-slate-200 rounded-xl hover:border-slate-300 transition-colors">
              <div>
                <h4 className="text-sm font-semibold text-slate-900">Экспорт резервной копии</h4>
                <p className="text-xs text-slate-500">Скачать файл .json со всеми записями и задачами</p>
              </div>
              <button
                type="button"
                onClick={handleExport}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5" /> Скачать
              </button>
            </div>

            {/* Import */}
            <div className="flex items-center justify-between p-3.5 border border-slate-200 rounded-xl hover:border-slate-300 transition-colors">
              <div>
                <h4 className="text-sm font-semibold text-slate-900">Импорт из файла</h4>
                <p className="text-xs text-slate-500">Восстановить данные из ранее сохраненного файла</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={handleImportClick}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors whitespace-nowrap"
              >
                <Upload className="w-3.5 h-3.5" /> Выбрать файл
              </button>
            </div>

            {/* Reset */}
            <div className="flex items-center justify-between p-3.5 border border-rose-100 bg-rose-50/30 rounded-xl">
              <div>
                <h4 className="text-sm font-semibold text-rose-900">Сброс к исходной таблице</h4>
                <p className="text-xs text-rose-700">Восстановить первоначальные данные из вашего файла</p>
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors whitespace-nowrap"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Сбросить
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end px-6 py-3.5 border-t border-slate-100 bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
