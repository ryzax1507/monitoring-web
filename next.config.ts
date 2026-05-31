import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    '/**/*': ['./dev.db'],
    '/*': ['./dev.db'],
  },
};

export default nextConfig;
