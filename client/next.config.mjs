/** @type {import('next').NextConfig} */
const apiUrl = new URL(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5080');

// Next 16 refuses to optimize images whose host resolves to a private IP, which blocks the
// local API during development. Allow it only when the configured host really is local, so
// the SSRF protection stays on for any deployed origin.
const isLocalApi = ['localhost', '127.0.0.1', '0.0.0.0', '::1'].includes(apiUrl.hostname);

const nextConfig = {
  images: {
    // Product and branding media are served by Django from its MEDIA_ROOT.
    remotePatterns: [
      {
        protocol: apiUrl.protocol.replace(':', ''),
        hostname: apiUrl.hostname,
        port: apiUrl.port || undefined,
        pathname: '/media/**',
      },
    ],
    dangerouslyAllowLocalIP: isLocalApi,
  },
};

export default nextConfig;
