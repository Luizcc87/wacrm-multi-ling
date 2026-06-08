"use client";

// ============================================================
// useBranding — client-side hook that fetches and resolves the
// current account's branding row.
//
// Priority: account DB row > NEXT_PUBLIC_APP_* env vars > DEFAULT.
//
// Subscribes to Supabase Realtime so the UI updates without a page
// reload when an admin saves new branding settings.
// ============================================================

import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { getBrandingEnv, resolveBranding, DEFAULT_BRANDING } from "@/lib/branding";
import type { AccountBranding, ResolvedBranding } from "@/types/branding";
import { useAuth } from "@/hooks/use-auth";

export function useBranding(): ResolvedBranding {
  const { accountId, profileLoading } = useAuth();
  const env = getBrandingEnv();

  const [branding, setBranding] = useState<ResolvedBranding>(
    resolveBranding(null, env),
  );

  useEffect(() => {
    if (profileLoading || !accountId) return;

    const supabase = createClient();

    async function fetchBranding() {
      const { data } = await supabase
        .from("account_branding")
        .select(
          "app_name, logo_url, favicon_url, primary_color, sidebar_color",
        )
        .eq("account_id", accountId)
        .maybeSingle();

      setBranding(resolveBranding(data as AccountBranding | null, env));
    }

    fetchBranding();

    // Subscribe to realtime changes so the UI reflects saves immediately.
    const channel = supabase
      .channel(`account_branding:${accountId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "account_branding",
          filter: `account_id=eq.${accountId}`,
        },
        (payload) => {
          const row = payload.eventType === 'DELETE'
            ? null
            : (payload.new as AccountBranding | null) ?? null;
          setBranding(resolveBranding(row, env));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // env is derived from process.env (stable at runtime) — no need to list
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountId, profileLoading]);

  return branding;
}

export { DEFAULT_BRANDING };
