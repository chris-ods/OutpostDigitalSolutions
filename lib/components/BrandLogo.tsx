"use client";

import Image from "next/image";

interface BrandLogoProps {
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
}

/** Full ATX Financial Group logo — auto-switches between light/dark variants. */
export function BrandLogo({ width = 220, height = 78, className = "", priority = false }: BrandLogoProps) {
  return (
    <>
      <Image
        src="/atx_logo.png"
        alt="ATX Financial Group"
        width={width}
        height={height}
        priority={priority}
        className={`object-contain dark:hidden ${className}`}
      />
      <Image
        src="/atx_logo_dark.png"
        alt="ATX Financial Group"
        width={width}
        height={height}
        priority={priority}
        className={`object-contain hidden dark:block ${className}`}
      />
    </>
  );
}

interface BrandIconProps {
  size?: number;
  className?: string;
}

/** Small square ATX icon for sidebar / compact spaces. */
export function BrandIcon({ size = 36, className = "" }: BrandIconProps) {
  return (
    <Image
      src="/atx_icon.png"
      alt="ATX Financial Group"
      width={size}
      height={size}
      className={`object-contain ${className}`}
    />
  );
}
