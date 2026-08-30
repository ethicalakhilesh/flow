"use client";

import { useState } from "react";

/**
 * Renders a brand/institution icon from a local path or third-party URL, in
 * any common format (.svg, .png, .jpg/.jpeg, .ico). Uses a plain <img>
 * rather than next/image so arbitrary external hosts work without adding
 * each one to next.config.js's image domain allowlist, and so .ico (which
 * next/image won't optimize) still renders. If the URL 404s or a remote
 * host blocks hotlinking, it falls back to the given fallback icon.
 *
 * Shared by AccountCard (bank icons) and the Memberships page (loyalty
 * program icons) — anywhere that needs a "logo with graceful fallback".
 */
export default function BrandLogo({
  src,
  fallbackSrc,
  size = 36,
  className = "",
}: {
  src: string;
  fallbackSrc: string;
  size?: number;
  className?: string;
}) {
  const [errored, setErrored] = useState(false);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={errored ? fallbackSrc : src}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      onError={() => setErrored(true)}
      className={`shrink-0 bg-canvas object-cover rounded-[22%] ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
