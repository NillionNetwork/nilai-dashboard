import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: `
              default-src 'self';
              script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com;
              style-src 'self' 'unsafe-inline';
              img-src 'self' data: blob: https://*.walletconnect.com https://*.walletconnect.org https://*.rainbow.me https://*.1inch.io https://*.base.org https://*.privy.io https://*.privy.com;
              font-src 'self';
              object-src 'none';
              base-uri 'self';
              form-action 'self';
              frame-ancestors 'none';
              child-src https://auth.privy.io https://verify.walletconnect.com https://verify.walletconnect.org;
              frame-src https://auth.privy.io https://verify.walletconnect.com https://verify.walletconnect.org https://challenges.cloudflare.com;
              connect-src 'self' https://auth.privy.io wss://relay.walletconnect.com wss://relay.walletconnect.org wss://www.walletlink.org https://*.rpc.privy.systems https://explorer-api.walletconnect.com;
              worker-src 'self';
              manifest-src 'self'
            `.replace(/\s+/g, ' ').trim(),
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ];
  },
};

export default nextConfig;

