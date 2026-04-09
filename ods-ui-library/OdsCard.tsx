"use client";

import React from "react";

// ── OdsCard — reusable themed container ─────────────────────────────────────

export interface OdsCardProps {
  /** Card title */
  title?: string;
  /** Subtitle or description */
  subtitle?: string;
  /** Icon rendered before the title */
  icon?: React.ReactNode;
  /** Action element rendered in the top-right corner (button, link, etc.) */
  action?: React.ReactNode;
  /** Additional CSS class names */
  className?: string;
  /** Override padding (default: 1.5rem) */
  padding?: string;
  /** Children rendered in the card body */
  children?: React.ReactNode;
  /** Click handler for the entire card */
  onClick?: () => void;
}

export function OdsCard({
  title,
  subtitle,
  icon,
  action,
  className = "",
  padding = "1.5rem",
  children,
  onClick,
}: OdsCardProps) {
  return (
    <div
      className={`bg-app-surface border border-app-border text-app-text ${className}`}
      onClick={onClick}
      style={{
        borderRadius: "0.75rem",
        padding,
        cursor: onClick ? "pointer" : undefined,
        transition: "border-color 0.15s, box-shadow 0.15s",
        boxShadow: "0 1px 3px rgba(0,0,0,0.2), 0 1px 2px rgba(0,0,0,0.12)",
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.25), 0 2px 4px rgba(0,0,0,0.15)";
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.2), 0 1px 2px rgba(0,0,0,0.12)";
      }}
    >
      {(title || subtitle || icon || action) && (
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: children ? "1rem" : 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            {icon && (
              <div className="text-app-accent" style={{ flexShrink: 0 }}>
                {icon}
              </div>
            )}
            <div>
              {title && (
                <h3 className="text-app-text" style={{ margin: 0, fontSize: "0.9375rem", fontWeight: 600, lineHeight: 1.3 }}>
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-app-text-4" style={{ margin: "0.125rem 0 0", fontSize: "0.75rem", lineHeight: 1.4 }}>
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          {action && <div style={{ flexShrink: 0 }}>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

// ── OdsStatCard — KPI / metric card ─────────────────────────────────────────

export interface OdsStatCardProps {
  /** The metric label (e.g., "Total Revenue") */
  label: string;
  /** The main value (e.g., "$12,345" or "98") */
  value: string | number;
  /** Trend direction */
  trend?: "up" | "down" | "neutral";
  /** Trend value (e.g., "+12%" or "-3.5%") */
  trendValue?: string;
  /** Icon rendered on the left */
  icon?: React.ReactNode;
  /** Accent color for the left border (CSS color string) */
  accent?: string;
  /** Additional CSS class names */
  className?: string;
  /** Click handler */
  onClick?: () => void;
}

export function OdsStatCard({
  label,
  value,
  trend,
  trendValue,
  icon,
  accent,
  className = "",
  onClick,
}: OdsStatCardProps) {
  const trendColor =
    trend === "up" ? "var(--app-success, #22c55e)" :
    trend === "down" ? "var(--app-danger, #ef4444)" :
    undefined;

  const trendArrow =
    trend === "up" ? "↑" :
    trend === "down" ? "↓" :
    "";

  return (
    <div
      className={`bg-app-surface border border-app-border text-app-text ${className}`}
      onClick={onClick}
      style={{
        borderRadius: "0.75rem",
        padding: "1.25rem 1.5rem",
        cursor: onClick ? "pointer" : undefined,
        transition: "border-color 0.15s, box-shadow 0.15s",
        boxShadow: "0 1px 3px rgba(0,0,0,0.2), 0 1px 2px rgba(0,0,0,0.12)",
        display: "flex",
        alignItems: "center",
        gap: "1rem",
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.25), 0 2px 4px rgba(0,0,0,0.15)";
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.2), 0 1px 2px rgba(0,0,0,0.12)";
      }}
    >
      {icon && (
        <div
          className={`${accent ? "" : "bg-app-surface-2"} text-app-accent`}
          style={{
            width: "2.5rem", height: "2.5rem", borderRadius: "0.625rem",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
            ...(accent ? { background: `color-mix(in srgb, ${accent} 15%, transparent)`, color: accent } : {}),
          }}
        >
          {icon}
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p className="text-app-text-4" style={{ margin: 0, fontSize: "0.6875rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
          {label}
        </p>
        <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", marginTop: "0.25rem" }}>
          <span className="text-app-text" style={{ fontSize: "1.5rem", fontWeight: 700, lineHeight: 1 }}>
            {typeof value === "number" ? value.toLocaleString() : value}
          </span>
          {trendValue && (
            <span className={trend === "neutral" ? "text-app-text-4" : ""} style={{ fontSize: "0.6875rem", fontWeight: 600, color: trendColor }}>
              {trendArrow} {trendValue}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
