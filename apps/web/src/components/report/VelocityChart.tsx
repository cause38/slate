"use client";

import type { VelocityPoint } from "@/lib/sprint-report";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type VelocityChartProps = {
  data: VelocityPoint[];
  /** 회고 모드 — 차트도 크게 (회고 회의 가독성) */
  bigMode?: boolean;
};

export function VelocityChart({ data, bigMode = false }: VelocityChartProps) {
  if (!data.length) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        완료된 스프린트가 없어요. 스프린트를 마감하면 벨로시티가 쌓입니다.
      </p>
    );
  }

  const height = bigMode ? 360 : 240;
  const tickFontSize = bigMode ? 15 : 12;
  const summary = data.map((d) => `${d.name} ${d.points}포인트`).join(", ");

  // Recharts는 BarChart의 role/aria-label을 DOM에 전달하지 않으므로 래퍼 div로 접근성 이름을 보장
  return (
    <div role="img" aria-label={`스프린트별 완료 포인트: ${summary}`}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={data}
          margin={{ top: 8, right: 8, bottom: 8, left: -16 }}
          accessibilityLayer
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: tickFontSize, fill: "var(--muted-foreground)" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            allowDecimals={false}
            width={40}
            tick={{ fontSize: tickFontSize, fill: "var(--muted-foreground)" }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            cursor={{ fill: "var(--muted)" }}
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              fontSize: 12,
            }}
            labelStyle={{ color: "var(--foreground)" }}
            formatter={(value) => [`${value} pt`, "완료 포인트"]}
          />
          {/* 애니메이션 비활성 — 최종 높이로 즉시 렌더(초기 0높이 애니메이션이 멈춰 막대가 안 보이는 문제 회피) */}
          <Bar
            dataKey="points"
            fill="var(--primary)"
            radius={[4, 4, 0, 0]}
            maxBarSize={64}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
