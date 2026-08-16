/** @type {import('next').NextConfig} */

/**
 * Origin of the API. Mirrors resolveApiBase() in src/lib/apiClient.ts: callers should supply
 * an origin, but a legacy value carrying a `/api` path suffix is tolerated rather than
 * silently producing broken URLs.
 */
function resolveApiOrigin() {
  const configured = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5080')
    .trim()
    .replace(/\/+$/, '');

  return configured.replace(/\/api(\/v\d+)?$/i, '') || 'http://localhost:5080';
}

const API_ORIGIN = resolveApiOrigin();

const nextConfig = {
  async rewrites() {
    return [
      // Uploaded media is proxied through this origin instead of being linked directly at the
      // API. Keeping the URL relative means <Image> takes its local-path code path, which
      // avoids three separate ways images used to break in development: remotePatterns having
      // to match the API's exact host and port, Next 16 refusing to optimize any upstream that
      // resolves to a private IP, and the browser needing cross-origin access to the API.
      { source: '/uploads/:path*', destination: `${API_ORIGIN}/uploads/:path*` },
      { source: '/media/:path*', destination: `${API_ORIGIN}/media/:path*` },
    ];
  },
};

export default nextConfig;
