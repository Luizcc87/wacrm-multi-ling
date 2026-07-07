'use client';

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Upload, Trash2, Mail, CircleAlert } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { SettingsPanelHead } from './settings-panel-head';

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ProfileForm() {
  const { user, profile, refreshProfile } = useAuth();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = useTranslations('settings');

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [pendingAvatar, setPendingAvatar] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [saving, setSaving] = useState(false);
  const [emailChangePending, setEmailChangePending] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.full_name ?? '');
    setEmail(profile.email ?? '');
  }, [profile]);

  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  const currentAvatar = previewUrl ?? (!removeAvatar ? profile?.avatar_url ?? null : null);
  const initial = (fullName || profile?.full_name || profile?.email || 'U').charAt(0).toUpperCase();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;
    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();
    if (!trimmedName) return toast.error(t('profile.nameRequired'));
    if (!EMAIL_RE.test(trimmedEmail)) return toast.error(t('profile.invalidEmail'));
    setSaving(true);
    try {
      let nextAvatarUrl: string | null = profile.avatar_url ?? null;
      if (pendingAvatar) {
        const path = `${user.id}/avatar-${Date.now()}.${pendingAvatar.name.split('.').pop() || 'png'}`;
        const { error } = await supabase.storage.from('avatars').upload(path, pendingAvatar, { cacheControl: '3600', upsert: true, contentType: pendingAvatar.type });
        if (error) throw new Error(error.message);
        nextAvatarUrl = supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl;
      } else if (removeAvatar) {
        nextAvatarUrl = null;
      }
      const { error: updateError } = await supabase.from('profiles').update({ full_name: trimmedName, avatar_url: nextAvatarUrl }).eq('user_id', user.id);
      if (updateError) throw new Error(updateError.message);
      let emailSent = false;
      if (trimmedEmail.toLowerCase() !== (profile.email ?? '').toLowerCase()) {
        const { error: emailError } = await supabase.auth.updateUser({ email: trimmedEmail });
        if (emailError) {
          toast.success(t('profile.profileSaved'));
          toast.error(`${t('profile.emailChangeFailed')}: ${emailError.message}`);
          await refreshProfile();
          return;
        }
        emailSent = true;
      }
      setEmailChangePending(emailSent);
      setPendingAvatar(null);
      setPreviewUrl(null);
      setRemoveAvatar(false);
      await refreshProfile();
      toast.success(emailSent ? t('profile.profileSavedEmailChange') : t('profile.profileSaved'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSaving(false);
    }
  };

  const dirty = !!profile && (fullName.trim() !== (profile.full_name ?? '') || email.trim().toLowerCase() !== (profile.email ?? '').toLowerCase() || pendingAvatar !== null || removeAvatar);

  return (
    <section className="max-w-2xl animate-in fade-in-50 duration-200">
      <SettingsPanelHead title={t('profile.title')} description={t('profile.description')} />
      <form onSubmit={onSubmit} className="space-y-4">
        <Card>
          <CardContent className="space-y-6">
            <div className="flex flex-wrap items-center gap-5">
              <Avatar size="lg" className="size-16">
                {currentAvatar ? <AvatarImage src={currentAvatar} alt={fullName || 'Avatar'} /> : null}
                <AvatarFallback className="bg-primary/10 text-base text-primary">{initial}</AvatarFallback>
              </Avatar>
              <div className="flex flex-wrap gap-2">
                <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = '';
                  if (!file) return;
                  if (file.size > MAX_AVATAR_BYTES) return toast.error(t('profile.imageTooLarge'));
                  if (previewUrl) URL.revokeObjectURL(previewUrl);
                  setPendingAvatar(file);
                  setPreviewUrl(URL.createObjectURL(file));
                  setRemoveAvatar(false);
                }} />
                <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={saving}><Upload className="size-4" />{currentAvatar ? t('profile.changePhoto') : t('profile.uploadPhoto')}</Button>
                {currentAvatar && <Button type="button" variant="ghost" onClick={() => { if (previewUrl) URL.revokeObjectURL(previewUrl); setPendingAvatar(null); setPreviewUrl(null); setRemoveAvatar(true); }} disabled={saving} className="text-muted-foreground hover:text-foreground"><Trash2 className="size-4" />{t('profile.remove')}</Button>}
                <p className="w-full text-xs text-muted-foreground">{t('profile.photoHint')}</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-full-name" className="text-foreground">{t('profile.displayName')}</Label>
              <Input id="profile-full-name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Ada Lovelace" maxLength={120} disabled={saving} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-email" className="text-foreground">{t('profile.email')}</Label>
              <Input id="profile-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={saving} required />
              {emailChangePending && <p className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300"><Mail className="mt-0.5 size-3.5 shrink-0" /><span>{t('profile.emailChangePending', { email1: profile?.email || '', email2: email })}</span></p>}
            </div>
            <div className="rounded-lg border border-border bg-muted p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('profile.accountDetails')}</p>
              <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                <div><dt className="text-muted-foreground">{t('profile.role')}</dt><dd className="mt-0.5 font-mono text-foreground">{profile?.account_role ? t(`members.roles.${profile.account_role}` as any) : '—'}</dd></div>
                <div><dt className="text-muted-foreground">{t('profile.joined')}</dt><dd className="mt-0.5 text-foreground">{user?.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}</dd></div>
                <div className="sm:col-span-2"><dt className="text-muted-foreground">{t('profile.userId')}</dt><dd className="mt-0.5 break-all font-mono text-xs text-muted-foreground">{user?.id ?? '—'}</dd></div>
              </dl>
            </div>
            {!profile && <p className="flex items-center gap-2 text-sm text-muted-foreground"><CircleAlert className="size-4" />{t('profile.loadingProfile')}</p>}
          </CardContent>
        </Card>
        <div className="flex justify-end">
          <Button type="submit" disabled={saving || !dirty || !profile}>{saving ? <><Loader2 className="size-4 animate-spin" />{t('profile.saving')}</> : t('profile.saveChanges')}</Button>
        </div>
      </form>
    </section>
  );
}
