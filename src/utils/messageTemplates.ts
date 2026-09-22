import { Counterparty } from '../types';
import { formatCurrency } from './formatters';

export interface MessageTemplate {
  id: string;
  name: string;
  generateText: (cp: Counterparty) => string;
}

export const MESSAGE_TEMPLATES: MessageTemplate[] = [
  {
    id: 'bill_sent',
    name: 'Выставление счета на оплату',
    generateText: (cp) => {
      const amountStr = formatCurrency(cp.amount, cp.currency);
      const stageStr = cp.categoryOrStage ? ` (${cp.categoryOrStage})` : '';
      const bank = cp.bankDetails ? `\nРеквизиты для оплаты: ${cp.bankDetails}` : '';

      return `Добрый день! Направляем счет на оплату для ${cp.name} на сумму ${amountStr}${stageStr}.${bank}\n\nСчет также во вложении. Пожалуйста, подтвердите получение и подскажите плановые сроки оплаты.`;
    },
  },
  {
    id: 'payment_reminder',
    name: 'Вежливое напоминание об оплате',
    generateText: (cp) => {
      const amountStr = formatCurrency(cp.amount, cp.currency);
      const stageStr = cp.categoryOrStage ? ` по этапу ${cp.categoryOrStage}` : '';

      return `Добрый день! Напоминаем об оплате ранее выставленного счета для ${cp.name} на сумму ${amountStr}${stageStr}.\n\nПодскажите, пожалуйста, передан ли счет в оплату бухгалтерии и когда можно ожидать поступление?`;
    },
  },
  {
    id: 'act_request',
    name: 'Запрос подписания акта / документов',
    generateText: (cp) => {
      return `Добрый день! По договору с ${cp.name} направляем акты выполненных работ. Просьба проверить, подписать со своей стороны и направить скан или подписать в ЭДО. Спасибо!`;
    },
  },
  {
    id: 'payment_received',
    name: 'Подтверждение зачисления оплаты',
    generateText: (cp) => {
      const amountStr = formatCurrency(cp.amount, cp.currency);
      return `Добрый день! Оплата на сумму ${amountStr} от ${cp.name} успешно поступила, спасибо за оперативный расчет! Продолжаем работу по текущим задачам.`;
    },
  },
];
