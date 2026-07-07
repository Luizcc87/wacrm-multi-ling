import { createClient } from '@supabase/supabase-js';

let hasValidatedAdmin = false;
let hasValidatedAnon = false;

function parseJWT(token: string) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    return JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
  } catch {
    return null;
  }
}

/**
 * Validates the Supabase keys (Anon or Service Role) asynchronously.
 * Logs a highly visible, specific error message if the keys are invalid,
 * expired, or mismatching, to help system administrators diagnose configuration issues quickly.
 */
export function validateSupabaseKeys(
  url: string | undefined,
  key: string | undefined,
  role: 'anon' | 'service_role'
) {
  // Prevent duplicate logs during hot-reload / concurrent requests
  if (role === 'service_role' && hasValidatedAdmin) return;
  if (role === 'anon' && hasValidatedAnon) return;

  if (role === 'service_role') hasValidatedAdmin = true;
  else hasValidatedAnon = true;

  if (!url) {
    console.error(`\x1b[31m[Supabase Config Error]\x1b[0m: NEXT_PUBLIC_SUPABASE_URL is not configured.`);
    return;
  }
  if (!key) {
    console.error(`\x1b[31m[Supabase Config Error]\x1b[0m: The ${role === 'service_role' ? 'SUPABASE_SERVICE_ROLE_KEY' : 'NEXT_PUBLIC_SUPABASE_ANON_KEY'} env variable is missing.`);
    return;
  }

  // 1. Decode JWT for basic client-side check (fast & offline)
  const payload = parseJWT(key);
  if (!payload) {
    console.error(`\x1b[31m[Supabase Config Error]\x1b[0m: The ${role} key is not a valid JWT token. Please check your environment variables.`);
    return;
  }

  // Verify role matching
  if (payload.role && payload.role !== role) {
    console.warn(`\x1b[33m[Supabase Config Warning]\x1b[0m: Key role mismatch! The key passed as "${role}" claims role "${payload.role}" in its JWT payload.`);
  }

  // Verify expiration
  if (payload.exp) {
    const expDate = new Date(payload.exp * 1000);
    if (expDate < new Date()) {
      console.error(`\x1b[31m[Supabase Config Error]\x1b[0m: The ${role} JWT key has EXPIRED on ${expDate.toISOString()}.`);
    }
  }

  // 2. Perform a lightweight non-blocking API query to verify validity
  const cleanUrl = url.replace(/\/$/, '');
  const testUrl = `${cleanUrl}/rest/v1/?apikey=${key}`;

  fetch(testUrl, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${key}`
    }
  })
    .then((res) => {
      if (res.status === 401 || res.status === 403) {
        console.error(
          `\n\x1b[31m============================================================\x1b[0m\n` +
          `\x1b[31m[SUPABASE CREDENTIAL ERROR]\x1b[0m: The "${role}" key is invalid or expired for project:\n` +
          `  URL: ${url}\n` +
          `  HTTP Status: ${res.status}\n` +
          `  Possible Cause: The SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY changed in the Supabase Dashboard, but was not updated in the application's environment configuration.\n` +
          `\x1b[31m============================================================\x1b[0m\n`
        );
      } else if (res.ok || res.status === 404 || res.status === 400 || res.status === 405) {
        console.log(`[Supabase Connection OK]: Successfully verified connection for "${role}" key.`);
      }
    })
    .catch((err: any) => {
      // Ignore ENOTFOUND if offline, but log other unexpected network errors
      if (err.code === 'ENOTFOUND') {
        console.error(
          `\n\x1b[31m============================================================\x1b[0m\n` +
          `\x1b[31m[SUPABASE CONNECTION ERROR]\x1b[0m: Host "${url}" could not be resolved (DNS ENOTFOUND).\n` +
          `  Possible Cause: The project URL might be paused, deleted, or incorrect.\n` +
          `\x1b[31m============================================================\x1b[0m\n`
        );
      } else {
        console.error(`[Supabase Connection Warning]: Network check to ${url} failed:`, err.message || err);
      }
    });
}
