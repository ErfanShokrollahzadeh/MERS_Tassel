/** @type {import('next').NextConfig} */

/**
 * Origin of the API. Mirrors resolveApiBase() in src/lib/apiClient.ts: NEXT_PUBLIC_API_URL
 * should be an origin, but a value carrying a path or missing scheme is tolerated by parsing
 * with URL and taking `.origin`, rather than stripping only specific known suffixes.
 */
function resolveApiOrigin() {
  const fallback = 'http://localhost:5080';
  const configuredValue = process.env.NEXT_PUBLIC_API_URL;

  if (!configuredValue && process.env.NODE_ENV === 'production') {
    throw new Error(
      'NEXT_PUBLIC_API_URL is required for production builds. Set it to the public HTTPS API origin.',
    );
  }

  const configured = (configuredValue || fallback).trim();

  try {
    return new URL(configured).origin;
  } catch {
    return fallback;
  }
}

const API_ORIGIN = resolveApiOrigin();

const nextConfig = {
  async rewrites() {
    return [
      // The secure mobile capture page uses this same-origin proxy. That matters when the
      // admin opens the page on a phone: a browser's `localhost` is the phone itself, not the
      // development computer. Keeping capture requests relative lets Next forward them to the
      // API from either a LAN hostname or the production Vercel origin without exposing the
      // private API host in the QR code.
      { source: '/api/v1/:path*', destination: `${API_ORIGIN}/api/v1/:path*` },
      // Uploaded media is proxied through this origin instead of being linked directly at the
      // API. Keeping the URL relative means <Image> takes its local-path code path, which
      // avoids three separate ways images used to break in development: remotePatterns having
      // to match the API's exact host and port, Next 16 refusing to optimize any upstream that
      // resolves to a private IP, and the browser needing cross-origin access to the API.
      //
      // The current backend (api/, .NET) serves everything under /uploads/**. There is no
      // /media/** route on it — that path belonged to the Django backend in server/, which this
      // client no longer talks to — so no rewrite is registered for it.
      { source: '/uploads/:path*', destination: `${API_ORIGIN}/uploads/:path*` },
    ];
  },
};

export default nextConfig;
