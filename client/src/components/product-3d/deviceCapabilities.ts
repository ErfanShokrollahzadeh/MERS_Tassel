export type DeviceCapabilities = {
  isMobile: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isSecureContext: boolean;
  hasWebXR: boolean;
};

export function detectDeviceCapabilities(): DeviceCapabilities {
  if (typeof window === 'undefined') {
    return { isMobile: false, isIOS: false, isAndroid: false, isSecureContext: false, hasWebXR: false };
  }

  const ua = navigator.userAgent || '';
  const isIOS = /iPad|iPhone|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/i.test(ua);
  const isMobile = isIOS || isAndroid || /Mobile|Tablet/i.test(ua);
  const hasWebXR = typeof (navigator as Navigator & { xr?: unknown }).xr !== 'undefined';

  return { isMobile, isIOS, isAndroid, isSecureContext: window.isSecureContext, hasWebXR };
}
