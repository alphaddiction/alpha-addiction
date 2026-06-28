import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'files.cdn.printful.com',
      },
      {
        protocol: 'https',
        hostname: 'static.cdn.printful.com',
      },
    ],
  },
};

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  org: "alpha-addiction",
  project: "alpha-addiction-nextjs",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,
});
