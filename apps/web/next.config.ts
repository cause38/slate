import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Docker 배포용 (apps/web/Dockerfile에서 사용)
  output: "standalone",
  // 개발 표시기가 좌측 하단 기본 위치에서 사이드바 맨 아래 테마 토글을 덮는다
  devIndicators: { position: "bottom-right" },
};

export default nextConfig;
