"use client";

import Image from "next/image";

interface BrandLogoProps {
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
}

/** Full Outpost Digital Solutions logo — auto-switches between light/dark variants. */
export function BrandLogo({ width = 220, height = 78, className = "", priority = false }: BrandLogoProps) {
  return (
    <>
      <Image
        src="/ods_logo.png"
        alt="Outpost Digital Solutions"
        width={width}
        height={height}
        priority={priority}
        className={`object-contain dark:hidden ${className}`}
      />
      <Image
        src="/ods_logo_dark.png"
        alt="Outpost Digital Solutions"
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

/** Small square Outpost Digital Solutions icon for sidebar / compact spaces. */
export function BrandIcon({ size = 36, className = "" }: BrandIconProps) {
  return (
    <Image
      src="/ods_icon.png"
      alt="Outpost Digital Solutions"
      width={size}
      height={size}
      className={`object-contain ${className}`}
    />
  );
}
