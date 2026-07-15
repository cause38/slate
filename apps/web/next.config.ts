import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Docker 배포용 (apps/web/Dockerfile에서 사용)
  output: "standalone",
};

export default nextConfig;
