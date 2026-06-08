import { describe, it, expect } from "vitest";
import {
  resolveBranding,
  DEFAULT_BRANDING,
} from "./branding";
import type { AccountBranding, BrandingEnv } from "@/types/branding";

const FULL_ACCOUNT: AccountBranding = {
  app_name: "Acme CRM",
  logo_url: "https://acme.com/logo.png",
  favicon_url: "https://acme.com/favicon.ico",
  primary_color: "#ff0000",
  sidebar_color: "#00ff00",
};

const FULL_ENV: BrandingEnv = {
  appName: "Env App",
  logoUrl: "https://env.example/logo.png",
  faviconUrl: "https://env.example/fav.ico",
  primaryColor: "#0000ff",
  sidebarColor: "#ffff00",
};

describe("resolveBranding", () => {
  it("account value wins over env and default (appName)", () => {
    const result = resolveBranding(FULL_ACCOUNT, FULL_ENV);
    expect(result.appName).toBe("Acme CRM");
  });

  it("account value wins over env and default (logoUrl)", () => {
    const result = resolveBranding(FULL_ACCOUNT, FULL_ENV);
    expect(result.logoUrl).toBe("https://acme.com/logo.png");
  });

  it("account value wins over env and default (faviconUrl)", () => {
    const result = resolveBranding(FULL_ACCOUNT, FULL_ENV);
    expect(result.faviconUrl).toBe("https://acme.com/favicon.ico");
  });

  it("account value wins over env and default (primaryColor)", () => {
    const result = resolveBranding(FULL_ACCOUNT, FULL_ENV);
    expect(result.primaryColor).toBe("#ff0000");
  });

  it("account value wins over env and default (sidebarColor)", () => {
    const result = resolveBranding(FULL_ACCOUNT, FULL_ENV);
    expect(result.sidebarColor).toBe("#00ff00");
  });

  it("env value wins over default when account is null (appName)", () => {
    const result = resolveBranding(null, FULL_ENV);
    expect(result.appName).toBe("Env App");
  });

  it("env value wins over default when account is null (logoUrl)", () => {
    const result = resolveBranding(null, FULL_ENV);
    expect(result.logoUrl).toBe("https://env.example/logo.png");
  });

  it("env value wins over default when account is null (primaryColor)", () => {
    const result = resolveBranding(null, FULL_ENV);
    expect(result.primaryColor).toBe("#0000ff");
  });

  it("falls back to DEFAULT_BRANDING when account is null and env is empty", () => {
    const result = resolveBranding(null, {});
    expect(result).toEqual(DEFAULT_BRANDING);
  });

  it("falls back to DEFAULT_BRANDING.appName when both account and env are absent", () => {
    const result = resolveBranding(null, {});
    expect(result.appName).toBe("WaCRM");
  });

  it("primary_color null in account (constraint rejected it) → env value used", () => {
    const account: AccountBranding = {
      ...FULL_ACCOUNT,
      primary_color: null, // constraint fired, DB stored null
    };
    const result = resolveBranding(account, FULL_ENV);
    expect(result.primaryColor).toBe(FULL_ENV.primaryColor);
  });

  it("primary_color null in account, no env → default null", () => {
    const account: AccountBranding = {
      ...FULL_ACCOUNT,
      primary_color: null,
    };
    const result = resolveBranding(account, {});
    expect(result.primaryColor).toBeNull();
  });

  it("all fields null in account + env → returns DEFAULT_BRANDING", () => {
    const emptyAccount: AccountBranding = {
      app_name: null,
      logo_url: null,
      favicon_url: null,
      primary_color: null,
      sidebar_color: null,
    };
    const result = resolveBranding(emptyAccount, {});
    expect(result).toEqual(DEFAULT_BRANDING);
  });
});
