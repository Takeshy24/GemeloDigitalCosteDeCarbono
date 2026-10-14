import type { NextConfig } from 'next';
const staticExport = process.env.NEXT_STATIC_EXPORT === '1';
const nextConfig: NextConfig = {
  reactStrictMode: true,
  ...(staticExport ? { output: 'export' as const } : {
  async rewrites() {
    const backend = process.env.API_INTERNAL_URL ||
      (process.env.API_HOSTPORT ? `http://${process.env.API_HOSTPORT}` : undefined);
    return backend ? [{ source: '/api/:path*', destination: `${backend.replace(/\/$/, '')}/api/:path*` }] : [];
  },
  }),
};
export default nextConfig;
