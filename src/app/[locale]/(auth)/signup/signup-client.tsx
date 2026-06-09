'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { AuthLegalFooter } from '@/components/auth/legal-footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { MessageSquare, CheckCircle, UsersRound } from 'lucide-react';

export function SignupClient() {
  return (
    <Suspense fallback={null}>
      <SignupPageInner />
    </Suspense>
  );
}

function SignupPageInner() {
  const t = useTranslations('auth.signup');
  const locale = useLocale();
  const legalLangSuffix = locale === 'pt-BR' ? '?lang=pt-BR' : '';
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get('invite');

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [consentGiven, setConsentGiven] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError(t('passwordMismatch'));
      return;
    }

    if (password.length < 6) {
      setError(t('passwordTooShort'));
      return;
    }

    setLoading(true);

    const emailRedirectTo = inviteToken
      ? `${window.location.origin}/join/${encodeURIComponent(inviteToken)}`
      : undefined;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        ...(emailRedirectTo ? { emailRedirectTo } : {}),
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
        <div className="w-full max-w-md">
          <Card className="w-full border-slate-800 bg-slate-900">
            <CardHeader className="items-center text-center">
              <div className="bg-primary/10 mb-2 flex h-12 w-12 items-center justify-center rounded-xl">
                <CheckCircle className="text-primary h-6 w-6" />
              </div>
              <CardTitle className="text-xl text-white">
                {t('checkEmail')}
              </CardTitle>
              <CardDescription className="text-slate-400">
                {t('checkEmailHint')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link
                href={
                  inviteToken
                    ? `/login?invite=${encodeURIComponent(inviteToken)}`
                    : '/login'
                }
              >
                <Button
                  variant="outline"
                  className="w-full border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
                >
                  {t('signIn')}
                </Button>
              </Link>
            </CardContent>
          </Card>
          <AuthLegalFooter />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md">
        <Card className="w-full border-slate-800 bg-slate-900">
          <CardHeader className="items-center text-center">
            <div className="bg-primary/10 mb-2 flex h-12 w-12 items-center justify-center rounded-xl">
              {inviteToken ? (
                <UsersRound className="text-primary h-6 w-6" />
              ) : (
                <MessageSquare className="text-primary h-6 w-6" />
              )}
            </div>
            <CardTitle className="text-xl text-white">{t('title')}</CardTitle>
            <CardDescription className="text-slate-400">
              {t('subtitle')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignup} className="flex flex-col gap-4">
              {error && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-2">
                <Label htmlFor="fullName" className="text-slate-300">
                  {t('fullName')}
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder={t('namePlaceholder')}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="focus-visible:border-primary focus-visible:ring-primary/20 border-slate-700 bg-slate-800 text-white placeholder:text-slate-500"
                />
              </div>

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
                <Label htmlFor="password" className="text-slate-300">
                  {t('password')}
                </Label>
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

              <div className="flex flex-col gap-2">
                <Label htmlFor="confirmPassword" className="text-slate-300">
                  {t('confirmPassword')}
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder={t('confirmPasswordPlaceholder')}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="focus-visible:border-primary focus-visible:ring-primary/20 border-slate-700 bg-slate-800 text-white placeholder:text-slate-500"
                />
              </div>

              <label className="flex items-start gap-3 text-sm text-slate-400">
                <input
                  type="checkbox"
                  checked={consentGiven}
                  onChange={(e) => setConsentGiven(e.target.checked)}
                  className="accent-primary mt-0.5 h-4 w-4 shrink-0"
                  required
                />
                <span>
                  {t('consentText')}{' '}
                  <a
                    href={`/terms${legalLangSuffix}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:text-primary/80"
                  >
                    {t('consentTextTerms')}
                  </a>{' '}
                  {t('consentTextAnd')}{' '}
                  <a
                    href={`/privacy${legalLangSuffix}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:text-primary/80"
                  >
                    {t('consentTextPrivacy')}
                  </a>
                  {t('consentTextSuffix')}
                </span>
              </label>

              <Button
                type="submit"
                disabled={loading || !consentGiven}
                className="bg-primary text-primary-foreground hover:bg-primary/90 mt-2 h-10 w-full disabled:opacity-50"
              >
                {loading ? t('submitting') : t('submit')}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-400">
              {t('alreadyAccount')}{' '}
              <Link
                href={
                  inviteToken
                    ? `/login?invite=${encodeURIComponent(inviteToken)}`
                    : '/login'
                }
                className="text-primary hover:text-primary/80"
              >
                {t('signIn')}
              </Link>
            </p>
          </CardContent>
        </Card>

        <AuthLegalFooter />
      </div>
    </div>
  );
}
