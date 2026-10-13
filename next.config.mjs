// no pongo X-Frame-Options global porque la parte publica va embebida en Google Sites
const headersGlobales = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
];

// el admin si bloquea iframes
const headersAdmin = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
  { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
  { key: 'Cache-Control', value: 'no-store' },
];

const nextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      { source: '/:path*', headers: headersGlobales },
      { source: '/admin/:path*', headers: headersAdmin },
      { source: '/api/admin/:path*', headers: headersAdmin },
    ];
  },
};

export default nextConfig;
