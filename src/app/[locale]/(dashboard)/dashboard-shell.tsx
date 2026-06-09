'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from '@/hooks/use-auth';
import { BrandingProvider } from '@/contexts/branding-context';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { DynamicFavicon } from '@/components/layout/dynamic-favicon';
import { AuthLegalFooter } from '@/components/auth/legal-footer';

// Auth-gated dashboard shell. Extracted from the layout so the layout
// itself can stay a server component and export metadata (noindex) —
// client components can't export Next's metadata object.

function DashboardShellInner({ children }: { children: React.ReactNode }) {
  const t = useTranslations('common');
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Sidebar drawer state — only used on mobile. On lg+ the sidebar is
  // always visible and this stays at `false` (ignored by the component).
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="border-primary h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
          <p className="text-sm text-slate-400">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const sectionPath = pathname.replace(/^\/(?:en|es|pt-BR)(?=\/|$)/, '') || '/';
  const showLegalFooter =
    sectionPath === '/dashboard' || sectionPath === '/settings';

  return (
    <BrandingProvider>
      <div className="flex h-screen overflow-hidden bg-slate-950">
        <DynamicFavicon />
        <Sidebar open={sidebarOpen} onClose={closeSidebar} />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header onOpenSidebar={() => setSidebarOpen(true)} />
          {/* Thinner horizontal padding on mobile so cards have room to breathe. */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6">
            {children}
            {showLegalFooter && (
              <AuthLegalFooter className="border-t border-slate-800 pt-6 pb-2" />
            )}
          </main>
        </div>
      </div>
    </BrandingProvider>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <DashboardShellInner>{children}</DashboardShellInner>
    </AuthProvider>
  );
}
