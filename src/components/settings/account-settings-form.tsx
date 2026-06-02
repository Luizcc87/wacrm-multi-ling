"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const CURRENCIES = [
  { code: "USD", label: "USD — US Dollar" },
  { code: "EUR", label: "EUR — Euro" },
  { code: "BRL", label: "BRL — Brazilian Real" },
  { code: "GBP", label: "GBP — British Pound" },
  { code: "ARS", label: "ARS — Argentine Peso" },
  { code: "CLP", label: "CLP — Chilean Peso" },
  { code: "COP", label: "COP — Colombian Peso" },
  { code: "MXN", label: "MXN — Mexican Peso" },
  { code: "PEN", label: "PEN — Peruvian Sol" },
  { code: "UYU", label: "UYU — Uruguayan Peso" },
  { code: "CAD", label: "CAD — Canadian Dollar" },
  { code: "AUD", label: "AUD — Australian Dollar" },
  { code: "JPY", label: "JPY — Japanese Yen" },
  { code: "CNY", label: "CNY — Chinese Yuan" },
];

export function AccountSettingsForm() {
  const { account, canEditSettings, profileLoading, refreshProfile } = useAuth();
  const supabase = createClient();
  const t = useTranslations("settings");

  const [currency, setCurrency] = useState("USD");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (account?.default_currency) {
      setCurrency(account.default_currency);
    }
  }, [account?.default_currency]);

  if (profileLoading) return null;
  if (!canEditSettings) return null;

  async function handleSave() {
    if (!account?.id) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("accounts")
        .update({ default_currency: currency })
        .eq("id", account.id);

      if (error) throw error;
      await refreshProfile();
      toast.success(t("account.currencySaved"));
    } catch {
      toast.error(t("account.currencySaveError"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="border-slate-800 bg-slate-900">
      <CardHeader>
        <CardTitle className="text-white">{t("account.title")}</CardTitle>
        <CardDescription className="text-slate-400">
          {t("account.description")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label className="text-slate-300">{t("account.currency")}</Label>
          <Select value={currency} onValueChange={(v) => v && setCurrency(v)}>
            <SelectTrigger className="w-64 border-slate-700 bg-slate-800 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-slate-700 bg-slate-800">
              {CURRENCIES.map((c) => (
                <SelectItem
                  key={c.code}
                  value={c.code}
                  className="text-slate-200 focus:bg-slate-700"
                >
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-slate-500">{t("account.currencyHint")}</p>
        </div>

        <Button
          onClick={handleSave}
          disabled={saving || currency === account?.default_currency}
          className="bg-primary text-white hover:bg-primary/90"
        >
          {saving ? t("account.saving") : t("account.saveChanges")}
        </Button>
      </CardContent>
    </Card>
  );
}
