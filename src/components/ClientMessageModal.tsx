import React, { useState, useEffect } from 'react';
import { Counterparty } from '../types';
import { MESSAGE_TEMPLATES } from '../utils/messageTemplates';
import { 
  X, 
  Copy, 
  Check, 
  Send, 
  MessageSquare, 
  ExternalLink,
  Mail
} from 'lucide-react';

interface ClientMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  counterparty: Counterparty | null;
}

export const ClientMessageModal: React.FC<ClientMessageModalProps> = ({
  isOpen,
  onClose,
  counterparty,
}) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('bill_sent');
  const [customText, setCustomText] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);

  useEffect(() => {
    if (counterparty && isOpen) {
      const defaultTpl = counterparty.status === 'paid' 
        ? 'payment_received' 
        : counterparty.status === 'bill_sent' 
        ? 'payment_reminder' 
        : 'bill_sent';
      
      setSelectedTemplateId(defaultTpl);
      const tpl = MESSAGE_TEMPLATES.find((t) => t.id === defaultTpl) || MESSAGE_TEMPLATES[0];
      setCustomText(tpl.generateText(counterparty));
      setIsCopied(false);
    }
  }, [counterparty, isOpen]);

  if (!isOpen || !counterparty) return null;

  const handleSelectTemplate = (tplId: string) => {
    setSelectedTemplateId(tplId);
    const tpl = MESSAGE_TEMPLATES.find((t) => t.id === tplId);
    if (tpl) {
      setCustomText(tpl.generateText(counterparty));
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(customText);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy message:', err);
    }
  };

  const handleOpenTelegram = () => {
    const encoded = encodeURIComponent(customText);
    window.open(`https://t.me/share/url?text=${encoded}`, '_blank');
  };

  const handleOpenWhatsApp = () => {
    const encoded = encodeURIComponent(customText);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  const handleOpenEmail = () => {
    const subject = encodeURIComponent(`Счет на оплату / договор — ${counterparty.name}`);
    const body = encodeURIComponent(customText);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  return (
    <div
      id="client-message-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="client-message-modal-container"
        className="w-full max-w-xl bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Сообщение для: {counterparty.name}
              </h2>
              <p className="text-xs text-slate-500">
                Готовые шаблоны для быстрой отправки в мессенджер или почту
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Template choices */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
              Выберите шаблон сообщения
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {MESSAGE_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => handleSelectTemplate(tpl.id)}
                  className={`text-left px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                    selectedTemplateId === tpl.id
                      ? 'bg-blue-50 border-blue-500 text-blue-800 shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {tpl.name}
                </button>
              ))}
            </div>
          </div>

          {/* Editable Text Area */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                Текст сообщения (можно отредактировать)
              </label>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                {isCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-600">Скопировано!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Скопировать</span>
                  </>
                )}
              </button>
            </div>
            <textarea
              id="message-preview-textarea"
              rows={6}
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 font-mono leading-relaxed focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors"
            />
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
            <button
              id="copy-message-btn"
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
            >
              {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{isCopied ? 'Скопировано в буфер' : 'Скопировать текст'}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                id="open-telegram-btn"
                type="button"
                onClick={handleOpenTelegram}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-lg text-xs font-semibold transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Telegram</span>
              </button>

              <button
                id="open-whatsapp-btn"
                type="button"
                onClick={handleOpenWhatsApp}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </button>

              <button
                id="open-email-btn"
                type="button"
                onClick={handleOpenEmail}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold transition-colors"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Email</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
