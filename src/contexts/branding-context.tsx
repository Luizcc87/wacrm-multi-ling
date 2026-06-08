"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useBranding as useBrandingInternal } from "@/hooks/use-branding";
import type { ResolvedBranding } from "@/types/branding";

const BrandingContext = createContext<ResolvedBranding | null>(null);

export function BrandingProvider({ children }: { children: ReactNode }) {
  const branding = useBrandingInternal();
  return (
    <BrandingContext.Provider value={branding}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding(): ResolvedBranding {
  const ctx = useContext(BrandingContext);
  if (!ctx) throw new Error("useBranding must be used within BrandingProvider");
  return ctx;
}
