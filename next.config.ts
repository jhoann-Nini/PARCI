import type { NextConfig } from "next";

const isDockerBuild = process.env.BUILD_STANDALONE === "true";

const nextConfig: NextConfig = {
  ...(isDockerBuild && {
    output: "standalone",
  }),
};

export default nextConfig;
