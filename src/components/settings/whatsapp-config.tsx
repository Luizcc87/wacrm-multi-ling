'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { Eye, EyeOff, Copy, CheckCircle2, XCircle, Loader2, ExternalLink, Zap, AlertTriangle, RotateCcw } from 'lucide-react';

import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { SettingsPanelHead } from './settings-panel-head';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import type { WhatsAppConfig as WhatsAppConfigType } from '@/types';

const MASKED_TOKEN = '••••••••••••••••';
type ConnectionStatus = 'connected' | 'disconnected' | 'unknown';
type ResetReason = 'token_corrupted' | 'meta_api_error' | null;

export function WhatsAppConfig() {
  const supabase = createClient();
  const t = useTranslations('settings');
  const { user, accountId, loading: authLoading, profileLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [config, setConfig] = useState<WhatsAppConfigType | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('unknown');
  const [resetReason, setResetReason] = useState<ResetReason>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const loadedAccountIdRef = useRef<string | null>(null);
  const [phoneNumberId, setPhoneNumberId] = useState('');
  const [wabaId, setWabaId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [verifyToken, setVerifyToken] = useState('');
  const [pin, setPin] = useState('');
  const [tokenEdited, setTokenEdited] = useState(false);
  const [verifyingRegistration, setVerifyingRegistration] = useState(false);
  const [registrationProbe, setRegistrationProbe] = useState<{ live?: boolean } | null>(null);
  const isRegistered = Boolean(config?.registered_at);
  const lastRegistrationError = config?.last_registration_error ?? null;
  const webhookUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/whatsapp/webhook` : '';

  const fetchConfig = useCallback(async (acctId: string) => {
    setLoading(true);
    try {
      const { data } = await supabase.from('whatsapp_config').select('*').eq('account_id', acctId).maybeSingle();
      if (data) {
        setConfig(data);
        setPhoneNumberId(data.phone_number_id || '');
        setWabaId(data.waba_id || '');
        setAccessToken(MASKED_TOKEN);
        setVerifyToken('');
        setPin('');
      } else {
        setConfig(null);
        setPhoneNumberId('');
        setWabaId('');
        setAccessToken('');
        setVerifyToken('');
        setPin('');
      }
      setRegistrationProbe(null);
      setConnectionStatus(data ? 'connected' : 'disconnected');
      setResetReason(null);
      setStatusMessage('');
    } catch {
      toast.error(t('whatsapp.toasts.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [supabase, t]);

  useEffect(() => {
    if (authLoading || profileLoading) return;
    if (!user || !accountId) { loadedAccountIdRef.current = null; setLoading(false); return; }
    if (loadedAccountIdRef.current === accountId) return;
    loadedAccountIdRef.current = accountId;
    fetchConfig(accountId);
  }, [authLoading, profileLoading, user?.id, accountId, fetchConfig]);

  async function handleSave() {
    if (!phoneNumberId.trim()) return toast.error(t('whatsapp.toasts.phoneRequired'));
    if (!config && (!accessToken.trim() || !tokenEdited)) return toast.error(t('whatsapp.toasts.tokenRequired'));
    try {
      setSaving(true);
      const payload: Record<string, unknown> = { phone_number_id: phoneNumberId.trim(), waba_id: wabaId.trim() || null, verify_token: verifyToken.trim() || null, pin: pin.trim() || null };
      if (tokenEdited && accessToken !== MASKED_TOKEN && accessToken.trim()) payload.access_token = accessToken.trim();
      else if (config) return toast.error(t('whatsapp.toasts.reenterToken'));
      const res = await fetch('/api/whatsapp/config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) return toast.error(data.error || t('whatsapp.toasts.saveFailed'));
      toast.success(data.phone_info?.verified_name ? t('whatsapp.toasts.saveLive', { name: data.phone_info.verified_name }) : t('whatsapp.toasts.saveSuccess'));
      if (accountId) await fetchConfig(accountId);
    } catch {
      toast.error(t('whatsapp.toasts.saveFailed'));
    } finally {
      setSaving(false);
    }
  }

  async function handleTestConnection() {
    try {
      setTesting(true);
      const res = await fetch('/api/whatsapp/config');
      const payload = await res.json();
      if (payload.connected) toast.success(payload.phone_info?.verified_name ? t('whatsapp.toasts.testSuccessName', { name: payload.phone_info.verified_name }) : t('whatsapp.toasts.testSuccess'));
      else toast.error(payload.message || t('whatsapp.toasts.testFailed'));
    } catch {
      toast.error(t('whatsapp.toasts.testNetworkError'));
    } finally {
      setTesting(false);
    }
  }

  async function handleVerifyRegistration() {
    setVerifyingRegistration(true);
    try {
      const res = await fetch('/api/whatsapp/config/verify-registration');
      const data = await res.json();
      setRegistrationProbe(data as { live?: boolean });
      toast[(data as { live?: boolean }).live ? 'success' : 'error']((data as { live?: boolean }).live ? t('whatsapp.toasts.verifySuccess') : t('whatsapp.toasts.verifyFailed'));
    } catch {
      toast.error(t('whatsapp.toasts.verifyEndpointError'));
    } finally {
      setVerifyingRegistration(false);
    }
  }

  async function handleReset() {
    if (!confirm(t('whatsapp.toasts.confirmReset'))) return;
    try {
      setResetting(true);
      const res = await fetch('/api/whatsapp/config', { method: 'DELETE' });
      if (!res.ok) return toast.error(t('whatsapp.toasts.saveFailed'));
      toast.success(t('whatsapp.toasts.resetSuccess'));
      setConfig(null);
    } finally { setResetting(false); }
  }

  function handleCopyWebhookUrl() { navigator.clipboard.writeText(webhookUrl); toast.success(t('whatsapp.toasts.webhookCopied')); }

  if (loading) return <section className="animate-in fade-in-50 duration-200"><SettingsPanelHead title={t('whatsapp.webhookCardTitle')} description={t('whatsapp.webhookCardDesc')} /><div className="flex items-center justify-center py-12"><Loader2 className="size-6 animate-spin text-primary" /></div></section>;
  return (
    <section className="animate-in fade-in-50 duration-200">
      <SettingsPanelHead title={t('whatsapp.webhookCardTitle')} description={t('whatsapp.webhookCardDesc')} />
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <Alert className="bg-card border-border"><div className="flex items-center gap-2">{connectionStatus === 'connected' ? <CheckCircle2 className="size-4 text-primary" /> : <XCircle className="size-4 text-red-500" />}<AlertTitle className="text-foreground mb-0">{connectionStatus === 'connected' ? t('whatsapp.credentialsValid') : t('whatsapp.notConnected')}</AlertTitle></div><AlertDescription className="text-muted-foreground">{statusMessage || (connectionStatus === 'connected' ? t('whatsapp.credentialsValidDesc') : t('whatsapp.notConnectedDesc'))}</AlertDescription></Alert>
          {config && <Alert className={isRegistered ? 'bg-emerald-950/30 border-emerald-700/50' : 'bg-amber-950/30 border-amber-700/50'}><div className="flex items-center justify-between gap-2 flex-wrap"><div className="flex items-center gap-2"><AlertTriangle className="size-4 text-amber-400" /><AlertTitle className={isRegistered ? 'mb-0 text-emerald-200' : 'mb-0 text-amber-200'}>{isRegistered ? t('whatsapp.registeredTitle') : t('whatsapp.notRegisteredTitle')}</AlertTitle></div><Button variant="outline" size="sm" onClick={handleVerifyRegistration} disabled={verifyingRegistration} className="border-border bg-transparent text-foreground hover:bg-muted h-7">{verifyingRegistration ? <Loader2 className="size-3.5 animate-spin" /> : <Zap className="size-3.5" />}{t('whatsapp.verifyWithMeta')}</Button></div><AlertDescription className="text-muted-foreground mt-2 text-xs leading-relaxed">{lastRegistrationError ? t('whatsapp.registrationSkippedDesc') : t('whatsapp.registrationSkippedDesc')}</AlertDescription>{registrationProbe && <div className="mt-3 rounded border border-border bg-card/60 px-3 py-2 space-y-1.5 text-[11px]"><p className="font-medium text-foreground">Diagnostic - last run: <span className={registrationProbe.live ? 'text-emerald-400' : 'text-amber-400'}>{registrationProbe.live ? 'live' : 'not live'}</span></p></div>}</Alert>}
          <Card><CardHeader><CardTitle className="text-foreground">API Credentials</CardTitle><CardDescription className="text-muted-foreground">Enter your Meta WhatsApp Business API credentials.</CardDescription></CardHeader><CardContent className="space-y-4"><div className="space-y-2"><Label className="text-muted-foreground">Phone Number ID</Label><Input value={phoneNumberId} onChange={(e) => setPhoneNumberId(e.target.value)} className="bg-muted border-border text-foreground" /></div><div className="space-y-2"><Label className="text-muted-foreground">WhatsApp Business Account ID</Label><Input value={wabaId} onChange={(e) => setWabaId(e.target.value)} className="bg-muted border-border text-foreground" /></div><div className="space-y-2"><Label className="text-muted-foreground">Permanent Access Token</Label><div className="relative"><Input type={showToken ? 'text' : 'password'} value={accessToken} onChange={(e) => { setAccessToken(e.target.value); setTokenEdited(true); }} className="bg-muted border-border text-foreground pr-10" /><button type="button" onClick={() => setShowToken(!showToken)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">{showToken ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button></div></div><div className="space-y-2"><Label className="text-muted-foreground">Webhook Verify Token</Label><Input value={verifyToken} onChange={(e) => setVerifyToken(e.target.value)} className="bg-muted border-border text-foreground" /></div><div className="space-y-2"><Label className="text-muted-foreground">Two-step verification PIN</Label><Input value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))} className="bg-muted border-border text-foreground" /></div></CardContent></Card>
          <div className="flex flex-wrap gap-3"><Button onClick={handleSave} disabled={saving} className="bg-primary text-primary-foreground">{saving ? <><Loader2 className="size-4 animate-spin" />{t('whatsapp.saving')}</> : t('whatsapp.saveConfig')}</Button><Button variant="outline" onClick={handleTestConnection} disabled={testing || !config} className="border-border text-muted-foreground hover:bg-muted">{testing ? <><Loader2 className="size-4 animate-spin" />{t('whatsapp.testing')}</> : <><Zap className="size-4" />{t('whatsapp.testConnection')}</>}</Button>{config && <Button variant="outline" onClick={handleReset} disabled={resetting} className="border-red-900 text-red-400 hover:bg-red-950/40">{resetting ? <><Loader2 className="size-4 animate-spin" />{t('whatsapp.resetting')}</> : <><RotateCcw className="size-4" />{t('whatsapp.resetConfig')}</>}</Button>}</div>
        </div>
        <div><Card><CardHeader><CardTitle className="text-foreground text-base">Setup Instructions</CardTitle><CardDescription className="text-muted-foreground">Follow these steps to connect your WhatsApp Business API.</CardDescription></CardHeader><CardContent><Accordion><AccordionItem className="border-border"><AccordionTrigger className="text-muted-foreground hover:text-foreground hover:no-underline"><span className="flex items-center gap-2"><span className="flex size-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">1</span>{t('whatsapp.step1Title')}</span></AccordionTrigger><AccordionContent className="text-muted-foreground"><ol className="list-decimal list-inside space-y-1 text-sm">{t.raw('whatsapp.step1Desc').split('\n').map((line: string, i: number) => (<li key={i}>{line}</li>))}</ol></AccordionContent></AccordionItem></Accordion><div className="mt-4 pt-4 border-t border-border"><a href="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors"><ExternalLink className="size-3.5" />{t('whatsapp.apiDocLink')}</a></div></CardContent></Card></div>
      </div>
    </section>
  );
}
