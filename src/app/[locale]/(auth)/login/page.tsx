'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { AuthLegalFooter } from '@/components/auth/legal-footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getBrandingEnv, resolveBranding } from '@/lib/branding';
import type { ResolvedBranding } from '@/types/branding';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { MessageSquare, UsersRound } from 'lucide-react';

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageInner />
    </Suspense>
  );
}

function LoginPageInner() {
  const t = useTranslations('auth.login');
  const [branding, setBranding] = useState<ResolvedBranding>(() =>
    resolveBranding(null, getBrandingEnv()),
  );
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get('invite');
  const reason = searchParams.get('reason');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const signupLinkVisible =
    process.env.NEXT_PUBLIC_ALLOW_PUBLIC_SIGNUP !== 'false' || !!inviteToken;

  useEffect(() => {
    let cancelled = false;

    async function loadPublicBranding() {
      try {
        const res = await fetch('/api/public/branding', {
          cache: 'no-store',
        });
        if (!res.ok) return;

        const payload = (await res.json()) as {
          branding?: ResolvedBranding;
        };
        if (!cancelled && payload.branding) {
          setBranding(payload.branding);
        }
      } catch {
        // Keep env/default branding when the public endpoint is unavailable.
      }
    }

    loadPublicBranding();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!branding.faviconUrl) return;

    const selectors = [
      "link[rel='icon']",
      "link[rel='shortcut icon']",
      "link[rel='apple-touch-icon']",
    ];
    document.querySelectorAll<HTMLLinkElement>(selectors.join(',')).forEach((link) => {
      link.href = branding.faviconUrl!;
    });
  }, [branding.faviconUrl]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    if (inviteToken) {
      router.push(`/join/${encodeURIComponent(inviteToken)}`);
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md">
        <Card className="w-full border-slate-800 bg-slate-900">
          <CardHeader className="items-center text-center">
            {reason === 'invite_only' && (
              <div className="w-full rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-400">
                {t('inviteOnlyNotice')}
              </div>
            )}
            <div className="mb-2 flex items-center justify-center gap-3">
              {branding.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={branding.logoUrl}
                  alt={branding.appName}
                  className="h-12 w-12 rounded-xl object-contain"
                />
              ) : (
                <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-xl">
                  {inviteToken ? (
                    <UsersRound className="text-primary h-6 w-6" />
                  ) : (
                    <MessageSquare className="text-primary h-6 w-6" />
                  )}
                </div>
              )}
              <p className="text-xl font-semibold leading-none text-white">
                {branding.appName}
              </p>
            </div>
            <CardTitle className="text-xl text-white">
              {inviteToken ? t('subtitleInvite') : t('title')}
            </CardTitle>
            <CardDescription className="text-slate-400">
              {inviteToken ? t('subtitleInviteHint') : t('subtitle')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              {error && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-2">
                <Label htmlFor="email" className="text-slate-300">
                  {t('email')}
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t('emailPlaceholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="focus-visible:border-primary focus-visible:ring-primary/20 border-slate-700 bg-slate-800 text-white placeholder:text-slate-500"
                />
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-slate-300">
                    {t('password')}
                  </Label>
                  <Link
                    href="/forgot-password"
                    className="text-primary hover:text-primary/80 text-sm"
                  >
                    {t('forgotPassword')}
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder={t('passwordPlaceholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="focus-visible:border-primary focus-visible:ring-primary/20 border-slate-700 bg-slate-800 text-white placeholder:text-slate-500"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="bg-primary text-primary-foreground hover:bg-primary/90 mt-2 h-10 w-full disabled:opacity-50"
              >
                {loading ? t('submitting') : t('submit')}
              </Button>
            </form>

            {signupLinkVisible && (
              <p className="mt-6 text-center text-sm text-slate-400">
                {t('noAccount')}{' '}
                <Link
                  href={
                    inviteToken
                      ? `/signup?invite=${encodeURIComponent(inviteToken)}`
                      : '/signup'
                  }
                  className="text-primary hover:text-primary/80"
                >
                  {t('createAccount')}
                </Link>
              </p>
            )}
          </CardContent>
        </Card>

        <AuthLegalFooter />
      </div>
    </div>
  );
}
