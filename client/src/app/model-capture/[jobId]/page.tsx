import { MobileModelCapture } from '@/components/product-3d/MobileModelCapture';

export default async function ModelCapturePage({ params, searchParams }: PageProps<'/model-capture/[jobId]'>) {
  const [{ jobId }, query] = await Promise.all([params, searchParams]);
  const token = typeof query.token === 'string' ? query.token : '';
  const parsedJobId = Number(jobId);
  if (!Number.isInteger(parsedJobId) || parsedJobId <= 0 || !token) {
    return <main className="capture-page capture-page--center"><h1>Capture link unavailable</h1><p>This secure link is incomplete. Create a new capture from the product editor.</p></main>;
  }
  return <MobileModelCapture jobId={parsedJobId} token={token} />;
}
