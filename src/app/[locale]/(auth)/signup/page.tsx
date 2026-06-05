import { redirect } from 'next/navigation';
import { SignupClient } from './signup-client';

export default async function SignupPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (process.env.ALLOW_PUBLIC_SIGNUP === 'false') {
    redirect(`/${locale}/login?reason=invite_only`);
  }

  return <SignupClient />;
}
