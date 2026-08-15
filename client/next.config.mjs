/** @type {import('next').NextConfig} */
const apiUrl = new URL(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5080');

const nextConfig = {
  images: {
    // Product and branding media are served by the .NET API from its wwwroot/uploads tree.
    remotePatterns: [
      {
        protocol: apiUrl.protocol.replace(':', ''),
        hostname: apiUrl.hostname,
        port: apiUrl.port || undefined,
        pathname: '/uploads/**',
      },
    ],
  },
};

export default nextConfig;
