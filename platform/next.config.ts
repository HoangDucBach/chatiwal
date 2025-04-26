import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  rewrites: async () => {
    return [
      {
        source: '/aggregator1/v1/:path*',
        destination: 'https://aggregator.walrus-testnet.walrus.space/v1/:path*',
      },
      {
        source: '/aggregator2/v1/:path*',
        destination: 'https://wal-aggregator-testnet.staketab.org/v1/:path*',
      },
      {
        source: '/aggregator3/v1/:path*',
        destination: 'https://walrus-testnet-aggregator.redundex.com/v1/:path*',
      },
      {
        source: '/aggregator4/v1/:path*',
        destination: 'https://walrus-testnet-aggregator.nodes.guru/v1/:path*',
      },
      {
        source: '/aggregator5/v1/:path*',
        destination: 'https://aggregator.walrus.banansen.dev/v1/:path*',
      },
      {
        source: '/aggregator6/v1/:path*',
        destination: 'https://walrus-testnet-aggregator.everstake.one/v1/:path*',
      },
    ]
  },
  experimental: {
    optimizePackageImports: ["@chakra-ui/react"],
  },
  eslint: {
    ignoreDuringBuilds: true,
  }
};

export default nextConfig;
