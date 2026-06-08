"use client";

// ============================================================
// DynamicFavicon — client component that updates the browser's
// <link rel="icon"> at runtime when the account has a custom
// favicon URL.
//
// Why client-side in addition to generateMetadata?
// generateMetadata handles the initial SSR <link> tag. But after
// hydration, route transitions in Next.js App Router don't re-run
// server metadata — so we patch the DOM directly here to keep
// the favicon in sync with changes made during the session.
//
// Error handling: if the favicon URL is inaccessible the browser
// simply shows a broken/blank icon — we deliberately don't catch
// this (per spec: "silenciar se favicon_url inacessível").
// ============================================================

import { useEffect } from "react";
import { useBranding } from "@/contexts/branding-context";

export function DynamicFavicon() {
  const { faviconUrl } = useBranding();

  useEffect(() => {
    if (!faviconUrl) return;
    const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (link) {
      link.href = faviconUrl;
    } else {
      const newLink = document.createElement("link");
      newLink.rel = "icon";
      newLink.href = faviconUrl;
      document.head.appendChild(newLink);
    }
  }, [faviconUrl]);

  return null;
}
