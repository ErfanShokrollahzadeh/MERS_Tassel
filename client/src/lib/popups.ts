import { api, queryString } from '@/lib/apiClient';
import type { Popup } from '@/types/commerce';

export type PopupQuery = {
  path?: string;
  device?: string;
};

export function fetchActivePopups(query: PopupQuery = {}) {
  return api.get<Popup[]>(`/popups/active${queryString({ ...query })}`);
}

export function trackPopupEvent(popupId: number, eventType: 'impression' | 'click' | 'conversion') {
  return api.post<null>(`/popups/${popupId}/track`, { eventType });
}

export const popupKeys = {
  active: (query: PopupQuery = {}) => ['popups', 'active', query] as const,
};
