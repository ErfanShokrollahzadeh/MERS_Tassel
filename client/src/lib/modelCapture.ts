import { API_URL, ApiError, type ApiEnvelope } from '@/lib/apiClient';
import type { ModelGenerationJob } from '@/lib/admin';

export type ModelCaptureSession = {
  jobId: number;
  productId: number;
  productName: string;
  productImage?: string | null;
  expiresAt: string;
  isUsed: boolean;
};

/**
 * Capture links are commonly opened on a phone while the admin workstation is running on a
 * LAN address. Use the Next same-origin proxy in a browser so `localhost` never resolves to the
 * phone itself. The server-side branch is retained for tests and non-browser callers.
 */
function captureApiUrl(path: string) {
  return typeof window !== 'undefined' ? `/api/v1${path}` : `${API_URL}${path}`;
}

async function captureRequest<T>(path: string, options: RequestInit = {}) {
  let response: Response;
  try {
    response = await fetch(captureApiUrl(path), { ...options, credentials: 'same-origin' });
  } catch {
    throw new ApiError('Could not reach the capture service. Check that the storefront is online.', 0, 'network_error');
  }

  const envelope = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;
  if (!response.ok || !envelope?.success) {
    throw new ApiError(
      envelope?.message || `Capture request failed (${response.status}).`,
      response.status,
      envelope?.code,
      envelope?.errors,
    );
  }
  return envelope.data as T;
}

export function fetchModelCaptureSession(jobId: number, token: string) {
  return captureRequest<ModelCaptureSession>(`/model-captures/${jobId}?token=${encodeURIComponent(token)}`, { cache: 'no-store' });
}

export function uploadModelCapture(jobId: number, input: {
  token: string;
  calibrationReferenceMm: number;
  widthMm: number;
  heightMm: number;
  depthMm: number;
  supportedPlacements: Array<'floor' | 'wall'>;
  defaultPlacement: 'floor' | 'wall';
  images: File[];
}) {
  const form = new FormData();
  form.append('Token', input.token);
  form.append('CalibrationReferenceMm', String(input.calibrationReferenceMm));
  form.append('WidthMm', String(input.widthMm));
  form.append('HeightMm', String(input.heightMm));
  form.append('DepthMm', String(input.depthMm));
  form.append('SupportedPlacements', input.supportedPlacements.join(','));
  form.append('DefaultPlacement', input.defaultPlacement);
  input.images.forEach((image) => form.append('images', image));
  return captureRequest<ModelGenerationJob>(`/model-captures/${jobId}`, { method: 'POST', body: form });
}
