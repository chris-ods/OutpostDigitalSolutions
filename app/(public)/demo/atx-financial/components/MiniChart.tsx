"use client";

import React from "react";

export type MiniChartDataPoint = {
  label: string;
  value: number;
  color?: string;
};

export type MiniChartProps = {
  data: MiniChartDataPoint[];
  type: "bar" | "horizontal-bar";
  height?: number;
  width?: number;
  showLabels?: boolean;
  showValues?: boolean;
};

const DEFAULT_COLORS = [
  "#3b82f6",
  "#2563eb",
  "#1d4ed8",
  "#1e40af",
  "#60a5fa",
  "#93c5fd",
];

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function MiniChart({
  data,
  type,
  height = 160,
  width = 320,
  showLabels = true,
  showValues = true,
}: MiniChartProps) {
  if (!data.length) return null;

  const maxVal = Math.max(...data.map((d) => d.value), 1);

  if (type === "horizontal-bar") {
    const barHeight = 22;
    const gap = 6;
    const labelWidth = 90;
    const valueWidth = 60;
    const chartHeight = data.length * (barHeight + gap) - gap;

    return (
      <svg
        width={width}
        height={chartHeight}
        viewBox={`0 0 ${width} ${chartHeight}`}
        className="block"
      >
        {data.map((d, i) => {
          const y = i * (barHeight + gap);
          const barMaxWidth = width - labelWidth - valueWidth - 12;
          const barW = (d.value / maxVal) * barMaxWidth;
          const color = d.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length];

          return (
            <g key={d.label}>
              {showLabels && (
                <text
                  x={labelWidth - 6}
                  y={y + barHeight / 2 + 1}
                  textAnchor="end"
                  dominantBaseline="middle"
                  className="fill-gray-400"
                  fontSize={11}
                >
                  {d.label}
                </text>
              )}
              <rect
                x={labelWidth}
                y={y + 2}
                width={barW}
                height={barHeight - 4}
                rx={3}
                fill={color}
                opacity={0.85}
                style={{
                  transition: "width 0.5s ease-out",
                }}
              />
              {showValues && (
                <text
                  x={labelWidth + barW + 6}
                  y={y + barHeight / 2 + 1}
                  dominantBaseline="middle"
                  className="fill-gray-300"
                  fontSize={11}
                  fontWeight={600}
                >
                  {formatCompact(d.value)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    );
  }

  // Vertical bar chart
  const padding = { top: showValues ? 20 : 8, bottom: showLabels ? 24 : 8, left: 8, right: 8 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;
  const barGap = 4;
  const barWidth = Math.max(
    8,
    (chartW - barGap * (data.length - 1)) / data.length
  );

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="block"
    >
      {data.map((d, i) => {
        const barH = (d.value / maxVal) * chartH;
        const x = padding.left + i * (barWidth + barGap);
        const y = padding.top + chartH - barH;
        const color = d.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length];

        return (
          <g key={d.label}>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={barH}
              rx={3}
              fill={color}
              opacity={0.85}
              style={{
                transition: "height 0.5s ease-out, y 0.5s ease-out",
              }}
            />
            {showValues && (
              <text
                x={x + barWidth / 2}
                y={y - 4}
                textAnchor="middle"
                className="fill-gray-300"
                fontSize={10}
                fontWeight={600}
              >
                {formatCompact(d.value)}
              </text>
            )}
            {showLabels && (
              <text
                x={x + barWidth / 2}
                y={height - 4}
                textAnchor="middle"
                className="fill-gray-500"
                fontSize={9}
              >
                {d.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
