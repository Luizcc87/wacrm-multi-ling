/**
 * E2E tests — White-label / Appearance branding
 *
 * These tests require a running dev/preview server and a seeded
 * Supabase project. Set the following env vars before running:
 *
 *   E2E_ADMIN_EMAIL    — email of an admin or owner account
 *   E2E_ADMIN_PASSWORD — password for the admin account
 *   E2E_VIEWER_EMAIL   — email of a viewer account (same account)
 *   E2E_VIEWER_PASSWORD
 *   PLAYWRIGHT_BASE_URL — defaults to http://localhost:3000
 *
 * Run with:
 *   npx playwright test e2e/white-label-appearance.spec.ts
 */

import { test, expect, type Page } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

// ─── helpers ─────────────────────────────────────────────────────────────────

async function loginAs(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  await page.goto(`${BASE_URL}/en/login`);
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole("button", { name: /sign in|entrar|iniciar/i }).click();
  await page.waitForURL(/\/dashboard/);
}

async function openAppearanceTab(page: Page): Promise<void> {
  await page.goto(`${BASE_URL}/en/settings?tab=appearance`);
  // Wait for the branding section to render.
  await page.waitForSelector("text=Brand Identity", { timeout: 10_000 });
}

// ─── tests ───────────────────────────────────────────────────────────────────

test.describe("White-label branding — appearance panel", () => {
  test("1. Admin saves app_name and sidebar shows the new name", async ({
    page,
  }) => {
    const adminEmail = process.env.E2E_ADMIN_EMAIL ?? "";
    const adminPassword = process.env.E2E_ADMIN_PASSWORD ?? "";
    test.skip(!adminEmail, "E2E_ADMIN_EMAIL not set");

    await loginAs(page, adminEmail, adminPassword);
    await openAppearanceTab(page);

    // Fill in app name.
    const appNameInput = page.getByPlaceholder("WaCRM");
    await appNameInput.clear();
    await appNameInput.fill("Acme Test");

    // Save.
    await page.getByRole("button", { name: /save|salvar|guardar/i }).click();

    // Toast success should appear.
    await expect(
      page.getByText(/settings saved|configurações salvas|configuración guardada/i),
    ).toBeVisible({ timeout: 5_000 });

    // Sidebar should now show the new name.
    await expect(page.getByText("Acme Test")).toBeVisible({ timeout: 5_000 });
  });

  test("2. Viewer sees branding fields disabled and no Save button", async ({
    page,
  }) => {
    const viewerEmail = process.env.E2E_VIEWER_EMAIL ?? "";
    const viewerPassword = process.env.E2E_VIEWER_PASSWORD ?? "";
    test.skip(!viewerEmail, "E2E_VIEWER_EMAIL not set");

    await loginAs(page, viewerEmail, viewerPassword);
    await openAppearanceTab(page);

    // All branding inputs must be disabled.
    const appNameInput = page.getByPlaceholder("WaCRM");
    await expect(appNameInput).toBeDisabled();

    // Save button must not exist.
    await expect(
      page.getByRole("button", { name: /save|salvar|guardar/i }),
    ).toHaveCount(0);

    // Readonly hint must be visible.
    await expect(
      page.getByText(
        /only administrators can edit|apenas administradores|solo los administradores/i,
      ),
    ).toBeVisible();
  });

  test("3. Account with no branding row shows WaCRM default in sidebar", async ({
    page,
  }) => {
    // This test relies on an account that has never saved branding.
    // If you want a deterministic baseline, delete the account_branding
    // row before running, or use a fresh account.
    const adminEmail = process.env.E2E_ADMIN_EMAIL ?? "";
    const adminPassword = process.env.E2E_ADMIN_PASSWORD ?? "";
    test.skip(!adminEmail, "E2E_ADMIN_EMAIL not set");

    // Clear branding via API so we start clean.
    await loginAs(page, adminEmail, adminPassword);
    await page.request.patch(`${BASE_URL}/api/account/branding`, {
      data: {
        app_name: null,
        logo_url: null,
        favicon_url: null,
        primary_color: null,
        sidebar_color: null,
      },
    });

    await page.goto(`${BASE_URL}/en/dashboard`);

    // Sidebar should show the default name "WaCRM".
    await expect(page.locator("nav").getByText("WaCRM")).toBeVisible({
      timeout: 5_000,
    });
  });
});
