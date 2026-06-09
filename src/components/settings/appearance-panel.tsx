"use client";

import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";

import { useTheme } from "@/hooks/use-theme";
import { useBranding } from "@/contexts/branding-context";
import { DEFAULT_BRANDING } from "@/lib/branding";
import { useAuth } from "@/hooks/use-auth";
import { THEMES, type ThemeId } from "@/lib/themes";
import { cn } from "@/lib/utils";
import { hasMinRole } from "@/lib/auth/roles";

/**
 * Appearance panel — color-theme picker + brand identity form.
 *
 * Theme picker: click a card → applies + persists immediately.
 * Branding form: admin+ can edit; viewers/agents see disabled fields.
 */
export function AppearancePanel() {
  const { theme, setTheme } = useTheme();
  const t = useTranslations("settings");
  return (
    <section className="space-y-8">
      {/* ── Color theme picker (existing) ─────────────────────── */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-white">{t("appearance.title")}</h2>
          <p className="mt-1 text-sm text-slate-400">
            {t("appearance.description")}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {THEMES.map((tTheme) => (
            <ThemeCard
              key={tTheme.id}
              id={tTheme.id}
              name={tTheme.name}
              tagline={tTheme.tagline}
              swatch={tTheme.swatch}
              isActive={tTheme.id === theme}
              onPick={() => setTheme(tTheme.id)}
              t={t}
            />
          ))}
        </div>
      </div>

      {/* ── Brand identity form (new) ──────────────────────────── */}
      <BrandingForm />
    </section>
  );
}

// ─── ThemeCard (unchanged) ────────────────────────────────────────────────────

function ThemeCard({
  id,
  name,
  tagline,
  swatch,
  isActive,
  onPick,
  t,
}: {
  id: ThemeId;
  name: string;
  tagline: string;
  swatch: string;
  isActive: boolean;
  onPick: () => void;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <button
      type="button"
      onClick={onPick}
      aria-pressed={isActive}
      aria-label={t("appearance.useTheme", { name })}
      className={cn(
        "flex flex-col gap-3 rounded-lg border bg-card p-4 text-left transition-colors",
        isActive
          ? "border-primary/60 ring-2 ring-primary/40"
          : "border-slate-800 hover:border-slate-700 hover:bg-slate-800/40",
      )}
    >
      <div className="flex items-center justify-between">
        <span
          aria-hidden
          className="h-8 w-8 shrink-0 rounded-full"
          style={{
            background: swatch,
            boxShadow: "inset 0 0 0 1px oklch(1 0 0 / 0.15)",
          }}
        />
        {isActive && (
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-medium text-primary">
            <Check className="h-3 w-3" />
            {t("appearance.active")}
          </span>
        )}
      </div>
      <div>
        <div className="text-sm font-semibold text-white">{name}</div>
        <div className="mt-1 text-xs leading-relaxed text-slate-400">
          {tagline}
        </div>
      </div>
      <div
        className="mt-1 flex h-2 overflow-hidden rounded-full"
        aria-hidden
      >
        <span className="flex-1" style={{ background: swatch }} />
        <span className="w-3 bg-slate-700" />
        <span className="w-3 bg-slate-800" />
        <span className="w-3 bg-slate-900" />
      </div>
      <span className="sr-only">Theme id: {id}</span>
    </button>
  );
}

// ─── BrandingForm ─────────────────────────────────────────────────────────────

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

function isValidUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

function BrandingForm() {
  const t = useTranslations("settings");
  const { accountRole } = useAuth();
  const resolved = useBranding();

  const canEdit = accountRole ? hasMinRole(accountRole, "admin") : false;

  const [appName, setAppName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [faviconUrl, setFaviconUrl] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#000000");
  const [sidebarColor, setSidebarColor] = useState("#000000");
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const initializedRef = useRef(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  // Populate fields only on first load — not on every realtime update —
  // so in-progress edits are not overwritten when a realtime event fires.
  useEffect(() => {
    if (initializedRef.current) return;
    if (resolved.appName === DEFAULT_BRANDING.appName &&
        resolved.logoUrl === null &&
        resolved.faviconUrl === null &&
        resolved.primaryColor === null &&
        resolved.sidebarColor === null) {
      // Still loading defaults — wait for actual DB data
      return;
    }
    initializedRef.current = true;
    setAppName(resolved.appName === DEFAULT_BRANDING.appName ? "" : resolved.appName);
    setLogoUrl(resolved.logoUrl ?? "");
    setFaviconUrl(resolved.faviconUrl ?? "");
    setPrimaryColor(resolved.primaryColor ?? "#000000");
    setSidebarColor(resolved.sidebarColor ?? "#000000");
  }, [resolved.appName, resolved.logoUrl, resolved.faviconUrl, resolved.primaryColor, resolved.sidebarColor]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const body = {
        app_name: appName.trim() || null,
        logo_url: logoUrl.trim() && isValidUrl(logoUrl.trim()) ? logoUrl.trim() : null,
        favicon_url: faviconUrl.trim() && isValidUrl(faviconUrl.trim()) ? faviconUrl.trim() : null,
        primary_color: HEX_RE.test(primaryColor) ? primaryColor : null,
        sidebar_color: HEX_RE.test(sidebarColor) ? sidebarColor : null,
      };
      const res = await fetch("/api/account/branding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success(t("appearance.branding.saveSuccess"));
    } catch {
      toast.error(t("appearance.branding.saveError"));
    } finally {
      setSaving(false);
    }
  }

  async function handleAssetUpload(type: "logo" | "favicon", file: File | null) {
    if (!file) return;

    const setUploading = type === "logo" ? setUploadingLogo : setUploadingFavicon;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("type", type);
      formData.append("file", file);

      const res = await fetch("/api/account/branding/assets", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error(await res.text());

      const payload = (await res.json()) as { publicUrl?: string };
      if (payload.publicUrl) {
        if (type === "logo") {
          setLogoUrl(payload.publicUrl);
        } else {
          setFaviconUrl(payload.publicUrl);
        }
      }
      toast.success(t("appearance.branding.uploadSuccess"));
    } catch {
      toast.error(t("appearance.branding.uploadError"));
    } finally {
      setUploading(false);
      const input = type === "logo" ? logoInputRef.current : faviconInputRef.current;
      if (input) input.value = "";
    }
  }

  const logoPreviewValid = logoUrl.trim() && isValidUrl(logoUrl.trim());
  const faviconPreviewValid = faviconUrl.trim() && isValidUrl(faviconUrl.trim());

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-white">
          {t("appearance.branding.title")}
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          {t("appearance.branding.description")}
        </p>
      </div>

      {!canEdit && (
        <p className="text-xs text-slate-500">
          {t("appearance.branding.readonlyHint")}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* App name */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-300">
            {t("appearance.branding.appName")}
          </label>
          <input
            type="text"
            value={appName}
            onChange={(e) => setAppName(e.target.value)}
            maxLength={60}
            disabled={!canEdit}
            placeholder={t("appearance.branding.appNamePlaceholder")}
            className={cn(
              "w-full rounded-md border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-white placeholder:text-slate-500",
              "focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary",
              !canEdit && "cursor-not-allowed opacity-50",
            )}
          />
        </div>

        {/* Logo URL */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-300">
            {t("appearance.branding.logoUrl")}
          </label>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              type="url"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              disabled={!canEdit}
              placeholder="https://"
              className={cn(
                "min-w-0 flex-1 rounded-md border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-white placeholder:text-slate-500",
                "focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary",
                !canEdit && "cursor-not-allowed opacity-50",
              )}
            />
            {canEdit && (
              <>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="sr-only"
                  onChange={(e) => handleAssetUpload("logo", e.target.files?.[0] ?? null)}
                />
                <button
                  type="button"
                  disabled={uploadingLogo}
                  onClick={() => logoInputRef.current?.click()}
                  className={cn(
                    "inline-flex shrink-0 items-center justify-center rounded-md border border-slate-700 px-3 py-2 text-sm font-medium text-slate-200",
                    "hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-slate-900",
                    uploadingLogo && "cursor-not-allowed opacity-60",
                  )}
                >
                  {uploadingLogo
                    ? t("appearance.branding.uploading")
                    : t("appearance.branding.logoUpload")}
                </button>
              </>
            )}
            {logoPreviewValid && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl.trim()}
                alt="Logo preview"
                className="h-8 w-8 rounded-lg object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
            )}
          </div>
          <p className="text-xs text-slate-500">
            {t("appearance.branding.logoHint")}
          </p>
        </div>

        {/* Favicon URL */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-300">
            {t("appearance.branding.faviconUrl")}
          </label>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              type="url"
              value={faviconUrl}
              onChange={(e) => setFaviconUrl(e.target.value)}
              disabled={!canEdit}
              placeholder="https://"
              className={cn(
                "min-w-0 flex-1 rounded-md border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-white placeholder:text-slate-500",
                "focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary",
                !canEdit && "cursor-not-allowed opacity-50",
              )}
            />
            {canEdit && (
              <>
                <input
                  ref={faviconInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/x-icon,image/vnd.microsoft.icon"
                  className="sr-only"
                  onChange={(e) => handleAssetUpload("favicon", e.target.files?.[0] ?? null)}
                />
                <button
                  type="button"
                  disabled={uploadingFavicon}
                  onClick={() => faviconInputRef.current?.click()}
                  className={cn(
                    "inline-flex shrink-0 items-center justify-center rounded-md border border-slate-700 px-3 py-2 text-sm font-medium text-slate-200",
                    "hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-slate-900",
                    uploadingFavicon && "cursor-not-allowed opacity-60",
                  )}
                >
                  {uploadingFavicon
                    ? t("appearance.branding.uploading")
                    : t("appearance.branding.faviconUpload")}
                </button>
              </>
            )}
            {faviconPreviewValid && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={faviconUrl.trim()}
                alt="Favicon preview"
                className="h-4 w-4 rounded"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
            )}
          </div>
          <p className="text-xs text-slate-500">
            {t("appearance.branding.faviconHint")}
          </p>
        </div>

        {/* Color pickers row */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {/* Primary color */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-300">
              {t("appearance.branding.primaryColor")}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                disabled={!canEdit}
                className={cn(
                  "h-9 w-12 cursor-pointer rounded border border-slate-700 bg-transparent p-0.5",
                  !canEdit && "cursor-not-allowed opacity-50",
                )}
              />
              <input
                type="text"
                value={primaryColor}
                onChange={(e) => {
                  if (HEX_RE.test(e.target.value) || e.target.value.length <= 7) {
                    setPrimaryColor(e.target.value);
                  }
                }}
                maxLength={7}
                disabled={!canEdit}
                className={cn(
                  "w-28 rounded-md border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm font-mono text-white",
                  "focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary",
                  !canEdit && "cursor-not-allowed opacity-50",
                )}
              />
            </div>
          </div>

          {/* Sidebar color */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-300">
              {t("appearance.branding.sidebarColor")}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={sidebarColor}
                onChange={(e) => setSidebarColor(e.target.value)}
                disabled={!canEdit}
                className={cn(
                  "h-9 w-12 cursor-pointer rounded border border-slate-700 bg-transparent p-0.5",
                  !canEdit && "cursor-not-allowed opacity-50",
                )}
              />
              <input
                type="text"
                value={sidebarColor}
                onChange={(e) => {
                  if (HEX_RE.test(e.target.value) || e.target.value.length <= 7) {
                    setSidebarColor(e.target.value);
                  }
                }}
                maxLength={7}
                disabled={!canEdit}
                className={cn(
                  "w-28 rounded-md border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm font-mono text-white",
                  "focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary",
                  !canEdit && "cursor-not-allowed opacity-50",
                )}
              />
            </div>
          </div>
        </div>

        {canEdit && (
          <button
            type="submit"
            disabled={saving}
            className={cn(
              "inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground",
              "hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-slate-900",
              saving && "cursor-not-allowed opacity-60",
            )}
          >
            {saving ? "..." : t("appearance.branding.save")}
          </button>
        )}
      </form>
    </div>
  );
}
