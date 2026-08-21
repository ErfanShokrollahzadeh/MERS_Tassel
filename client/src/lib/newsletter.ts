import { api } from '@/lib/apiClient';
import type { Locale } from '@/i18n/I18nProvider';

export type NewsletterSource = 'home' | 'footer';

export type NewsletterSubscription = {
  email: string;
  alreadySubscribed: boolean;
  subscribedAt: string;
};

export function subscribeToNewsletter(email: string, locale: Locale, source: NewsletterSource) {
  return api.post<NewsletterSubscription>('/newsletter/subscribe', { email, locale, source });
}
