'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Copy, Loader2, MessageCircle, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button, buttonVariants } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/use-auth';

type InviteRole = 'admin' | 'agent' | 'viewer';

interface InviteMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

const MAX_LABEL_LEN = 80;

interface CreatedInvite {
  url: string;
  role: InviteRole;
  expiresInDays: number;
  accountName: string;
}

export function InviteMemberDialog({ open, onOpenChange, onCreated }: InviteMemberDialogProps) {
  const { account } = useAuth();
  const t = useTranslations('settings');
  const [role, setRole] = useState<InviteRole>('agent');
  const [expiry, setExpiry] = useState('7');
  const [label, setLabel] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<CreatedInvite | null>(null);

  async function handleCreate() {
    const trimmedLabel = label.trim();
    if (trimmedLabel.length > MAX_LABEL_LEN) {
      toast.error(t('invite.labelTooLong', { max: MAX_LABEL_LEN }));
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/account/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, expiresInDays: Number(expiry), label: trimmedLabel || undefined }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        toast.error(payload.error || t('invite.createFailed'));
        return;
      }
      const data = (await res.json()) as { url: string; expiresInDays: number };
      setResult({ url: data.url, role, expiresInDays: data.expiresInDays, accountName: account?.name ?? 'our wacrm account' });
      onCreated();
    } catch (err) {
      console.error('[InviteMemberDialog] create error:', err);
      toast.error(t('invite.serverError'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) setResult(null); onOpenChange(next); }}>
      <DialogContent className="bg-popover border-border sm:max-w-md">
        {result ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-popover-foreground">
                <Sparkles className="size-4 text-primary" />
                {t('invite.createdTitle')}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">{t('invite.createdDescription')}</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <Label className="text-muted-foreground">{t('invite.inviteLink')}</Label>
              <div className="flex gap-2">
                <Input readOnly value={result.url} className="bg-muted border-border text-foreground font-mono text-xs" />
                <Button type="button" className="bg-primary text-primary-foreground shrink-0" onClick={() => { navigator.clipboard.writeText(result.url); toast.success(t('invite.copied')); }}>
                  <Copy className="size-4" />
                  {t('invite.copy')}
                </Button>
              </div>
              <div className="rounded-md border border-amber-500/50 bg-amber-500/15 px-3 py-2 text-xs text-amber-200">
                <strong className="font-semibold text-amber-100">{t('invite.warningTitle')}</strong> {t('invite.warningText')}
              </div>
              <a href={`https://wa.me/?text=${encodeURIComponent(t('invite.whatsAppMessage', { accountName: result.accountName, days: result.expiresInDays, url: result.url }))}`} target="_blank" rel="noreferrer noopener" className={buttonVariants({ variant: 'outline', className: 'w-full border-border text-muted-foreground hover:bg-muted' })}>
                <MessageCircle className="size-4" />
                {t('invite.sendWhatsApp')}
              </a>
            </div>
            <DialogFooter className="bg-popover border-border">
              <Button onClick={() => onOpenChange(false)} className="bg-primary text-primary-foreground">{t('invite.done')}</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-popover-foreground">{t('invite.teammateTitle')}</DialogTitle>
              <DialogDescription className="text-muted-foreground">{t('invite.description')}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label className="text-muted-foreground">{t('invite.role')}</Label>
                <Select value={role} onValueChange={(v) => v && setRole(v as InviteRole)}>
                  <SelectTrigger className="w-full bg-muted border-border text-foreground"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">{t('members.roles.admin')}</SelectItem>
                    <SelectItem value="agent">{t('members.roles.agent')}</SelectItem>
                    <SelectItem value="viewer">{t('members.roles.viewer')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">{t('invite.validFor')}</Label>
                <Select value={expiry} onValueChange={(v) => v && setExpiry(v)}>
                  <SelectTrigger className="w-full bg-muted border-border text-foreground"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">{t('invite.expiryOptions.day')}</SelectItem>
                    <SelectItem value="7">{t('invite.expiryOptions.days', { days: 7 })}</SelectItem>
                    <SelectItem value="30">{t('invite.expiryOptions.days', { days: 30 })}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">{t('invite.label')} <span className="text-xs text-muted-foreground">{t('invite.labelOptional')}</span></Label>
                <Input placeholder={t('invite.labelPlaceholder')} value={label} onChange={(e) => setLabel(e.target.value)} maxLength={MAX_LABEL_LEN} className="bg-muted border-border text-foreground placeholder:text-muted-foreground" />
              </div>
            </div>
            <DialogFooter className="bg-popover border-border">
              <Button variant="outline" onClick={() => onOpenChange(false)} className="border-border text-muted-foreground hover:bg-muted">{t('invite.cancel')}</Button>
              <Button onClick={handleCreate} disabled={submitting} className="bg-primary text-primary-foreground">
                {submitting ? <><Loader2 className="size-4 animate-spin" />{t('invite.generating')}</> : t('invite.generate')}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
