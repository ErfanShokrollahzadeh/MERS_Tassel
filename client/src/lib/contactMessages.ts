import { api } from '@/lib/apiClient';
import type { Locale } from '@/i18n/I18nProvider';

export type ContactTopic = 'product' | 'order' | 'repairs' | 'press';

export type ContactMessageRequest = {
  name: string;
  email: string;
  topic: ContactTopic;
  message: string;
  locale: Locale;
};

export type ContactMessageReceipt = {
  reference: number;
  receivedAt: string;
};

export function sendContactMessage(request: ContactMessageRequest) {
  return api.post<ContactMessageReceipt>('/contact/messages', request);
}
