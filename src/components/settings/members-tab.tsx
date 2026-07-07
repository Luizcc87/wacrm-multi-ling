'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { AlertTriangle, Loader2, Mail, MailX, Plus, Trash2, UsersRound } from 'lucide-react';

import { Avatar, AvatarBadge, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RequireRole } from '@/components/auth/require-role';
import { useAuth } from '@/hooks/use-auth';
import { usePresence } from '@/hooks/use-presence';
import type { AccountRole } from '@/lib/auth/roles';
import { presenceLabel, summarize } from '@/lib/presence';
import { PRESENCE_DOT_CLASS, PresenceDot } from '@/components/presence/presence-dot';
import { InviteMemberDialog } from './invite-member-dialog';
import { SettingsPanelHead } from './settings-panel-head';
import { ROLE_META } from './role-meta';

interface Member {
  user_id: string;
  full_name: string;
  email: string | null;
  avatar_url: string | null;
  role: AccountRole;
  joined_at: string;
}

interface Invitation {
  id: string;
  role: 'admin' | 'agent' | 'viewer';
  label: string | null;
  created_at: string;
  expires_at: string;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function fmtExpiresIn(iso: string, t: ReturnType<typeof useTranslations>): string {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return t('members.expired');
  const days = Math.floor(ms / (24 * 60 * 60 * 1000));
  if (days >= 1) return t('members.expiresInDays', { days });
  const hours = Math.max(1, Math.floor(ms / (60 * 60 * 1000)));
  return t('members.expiresInHours', { hours });
}

export function MembersTab() {
  const { user, canManageMembers } = useAuth();
  const { getPresence, getRow, now } = usePresence();
  const t = useTranslations('settings');

  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [removingMember, setRemovingMember] = useState<Member | null>(null);
  const [pendingMemberAction, setPendingMemberAction] = useState<string | null>(null);

  const editableRoles: { value: AccountRole; label: string }[] = [
    { value: 'admin', label: t('members.roles.admin') },
    { value: 'agent', label: t('members.roles.agent') },
    { value: 'viewer', label: t('members.roles.viewer') },
  ];

  const loadEverything = useCallback(async () => {
    try {
      const [mres, ires] = await Promise.all([
        fetch('/api/account/members', { cache: 'no-store' }),
        canManageMembers ? fetch('/api/account/invitations', { cache: 'no-store' }) : Promise.resolve(null),
      ]);
      if (!mres.ok) {
        const payload = await mres.json().catch(() => ({}));
        toast.error(payload.error || t('members.toasts.loadMembersFailed'));
        return;
      }
      setMembers((await mres.json()).members || []);
      if (ires) {
        if (!ires.ok) {
          const payload = await ires.json().catch(() => ({}));
          toast.error(payload.error || t('members.toasts.loadInvitesFailed'));
          return;
        }
        setInvitations((await ires.json()).invitations || []);
      } else {
        setInvitations([]);
      }
    } catch (err) {
      console.error(err);
      toast.error(t('members.toasts.networkError'));
    } finally {
      setLoading(false);
    }
  }, [canManageMembers, t]);

  useEffect(() => { void loadEverything(); }, [loadEverything]);

  async function handleRoleChange(member: Member, nextRole: AccountRole) {
    if (member.role === nextRole) return;
    const previousRole = member.role;
    setPendingMemberAction(member.user_id);
    setMembers((prev) => prev.map((m) => (m.user_id === member.user_id ? { ...m, role: nextRole } : m)));
    try {
      const res = await fetch(`/api/account/members/${member.user_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: nextRole }),
      });
      if (!res.ok) {
        setMembers((prev) => prev.map((m) => (m.user_id === member.user_id ? { ...m, role: previousRole } : m)));
        const payload = await res.json().catch(() => ({}));
        toast.error(payload.error || t('members.toasts.updateRoleFailed'));
        return;
      }
      toast.success(t('members.toasts.updateRoleSuccess', { name: member.full_name || t('members.untitledInvite'), role: t(`members.roles.${nextRole}` as Parameters<typeof t>[0]) }));
    } catch {
      setMembers((prev) => prev.map((m) => (m.user_id === member.user_id ? { ...m, role: previousRole } : m)));
      toast.error(t('members.toasts.networkError'));
    } finally {
      setPendingMemberAction(null);
    }
  }

  async function handleRemove() {
    if (!removingMember) return;
    setPendingMemberAction(removingMember.user_id);
    try {
      const res = await fetch(`/api/account/members/${removingMember.user_id}`, { method: 'DELETE' });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        toast.error(payload.error || t('members.toasts.removeMemberFailed'));
        return;
      }
      toast.success(t('members.toasts.removeMemberSuccess', { name: removingMember.full_name || t('members.untitledInvite') }));
      setMembers((prev) => prev.filter((m) => m.user_id !== removingMember.user_id));
      setRemovingMember(null);
    } catch {
      toast.error(t('members.toasts.networkError'));
    } finally {
      setPendingMemberAction(null);
    }
  }

  async function handleRevoke(invite: Invitation) {
    try {
      const res = await fetch(`/api/account/invitations/${invite.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        toast.error(payload.error || t('members.toasts.revokeInviteFailed'));
        return;
      }
      toast.success(t('members.toasts.revokeInviteSuccess'));
      setInvitations((prev) => prev.filter((i) => i.id !== invite.id));
    } catch {
      toast.error(t('members.toasts.networkError'));
    }
  }

  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 className="size-6 animate-spin text-primary" /></div>;

  return (
    <section className="animate-in fade-in-50 space-y-6 duration-200">
      <SettingsPanelHead title={t('members.title')} description={t('members.description')} action={<RequireRole min="admin"><Button onClick={() => setInviteOpen(true)}><Plus className="size-4" />{t('members.invite')}</Button></RequireRole>} />

      {members.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><PresenceDot status="online" />{summarize(members.map((m) => getPresence(m.user_id))).online} {t('members.online')}</span>
          <span className="inline-flex items-center gap-1.5"><PresenceDot status="away" />{summarize(members.map((m) => getPresence(m.user_id))).away} {t('members.away')}</span>
          <span className="inline-flex items-center gap-1.5"><PresenceDot status="offline" />{summarize(members.map((m) => getPresence(m.user_id))).offline} {t('members.offline')}</span>
        </div>
      )}

      <Card><CardContent className="p-0"><ul className="divide-y divide-border">
        {members.map((member) => {
          const roleMeta = ROLE_META[member.role];
          const RoleIcon = roleMeta.icon;
          const presence = getPresence(member.user_id);
          const presenceRow = getRow(member.user_id);
          const presenceText = presenceLabel(presence, presenceRow?.last_seen_at ?? null, now);
          const isSelf = member.user_id === user?.id;
          const isOwner = member.role === 'owner';
          const isBusy = pendingMemberAction === member.user_id;
          return (
            <li key={member.user_id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:gap-4">
              <div className="flex min-w-0 flex-1 items-center gap-4">
                <Tooltip><TooltipTrigger render={<Avatar className="size-9 shrink-0">{member.avatar_url ? <AvatarImage src={member.avatar_url} alt={member.full_name || 'Member'} /> : null}<AvatarFallback className="bg-primary/10 text-sm font-medium text-primary">{(member.full_name || member.email || 'U').charAt(0).toUpperCase()}</AvatarFallback><AvatarBadge role="img" aria-label={presenceText} className={PRESENCE_DOT_CLASS[presence]} /></Avatar>} /><TooltipContent>{presenceText}</TooltipContent></Tooltip>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2"><span className="truncate text-sm font-medium text-foreground">{member.full_name || t('members.untitledInvite')}</span>{isSelf && <Badge className="bg-muted text-muted-foreground border-border text-[10px] uppercase tracking-wide">{t('members.you')}</Badge>}</div>
                  {member.email && <p className="truncate text-xs text-muted-foreground">{member.email}</p>}
                </div>
              </div>
              <div className="hidden sm:block text-right text-xs text-muted-foreground">{t('members.joined', { date: fmtDate(member.joined_at) })}</div>
              <div className="flex items-center gap-2 sm:gap-3">
                {canManageMembers && !isOwner && !isSelf ? (
                  <Select value={member.role} onValueChange={(v) => v && handleRoleChange(member, v as AccountRole)}>
                    <SelectTrigger className="w-32 bg-muted border-border text-foreground" disabled={isBusy}><SelectValue /></SelectTrigger>
                    <SelectContent>{editableRoles.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
                  </Select>
                ) : (
                  <span className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium ${roleMeta.className}`}><RoleIcon className="size-3.5" />{roleMeta.label}</span>
                )}
                {canManageMembers && !isOwner && !isSelf && <Button variant="outline" size="sm" onClick={() => setRemovingMember(member)} disabled={isBusy} className="border-red-500/40 bg-red-500/10 text-red-300 hover:bg-red-500/20 hover:border-red-500/60 hover:text-red-200"><Trash2 className="size-4" /></Button>}
              </div>
            </li>
          );
        })}
      </ul></CardContent></Card>

      <RequireRole min="admin">
        <div>
          <div className="mb-2 flex items-center gap-2"><UsersRound className="size-4 text-muted-foreground" /><h3 className="text-sm font-semibold text-foreground">{t('members.pendingTitle')}</h3><Badge className="bg-muted text-muted-foreground border-border">{invitations.length}</Badge></div>
          {invitations.length > 0 && <p className="mb-3 text-xs text-muted-foreground">{t('members.pendingHint')}</p>}
          {invitations.length === 0 ? (
            <Card><CardContent className="flex flex-col items-center justify-center py-8 text-center"><Mail className="size-6 text-muted-foreground" /><p className="mt-2 text-sm text-muted-foreground">{t('members.noPending')}</p><p className="mt-1 text-xs text-muted-foreground">{t('members.noPendingHint')}</p></CardContent></Card>
          ) : (
            <Card><CardContent className="p-0"><ul className="divide-y divide-border">{invitations.map((inv) => {
              const inviteRoleMeta = ROLE_META[inv.role];
              const InviteRoleIcon = inviteRoleMeta.icon;
              return (
                <li key={inv.id} className="flex items-center gap-4 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2"><span className="text-sm font-medium text-foreground">{inv.label || t('members.untitledInvite')}</span><span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium ${inviteRoleMeta.className}`}><InviteRoleIcon className="size-3" />{inviteRoleMeta.label}</span></div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{t('members.inviteMeta', { date: fmtDate(inv.created_at), expiry: fmtExpiresIn(inv.expires_at, t) })}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleRevoke(inv)} className="border-red-500/40 bg-red-500/10 text-red-300 hover:bg-red-500/20 hover:border-red-500/60 hover:text-red-200"><MailX className="size-4" />{t('members.revoke')}</Button>
                </li>
              );
            })}</ul></CardContent></Card>
          )}
        </div>
      </RequireRole>

      <InviteMemberDialog open={inviteOpen} onOpenChange={setInviteOpen} onCreated={loadEverything} />

      <Dialog open={removingMember !== null} onOpenChange={(open) => { if (!open) setRemovingMember(null); }}>
        <DialogContent className="bg-popover border-border sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-popover-foreground"><AlertTriangle className="size-4 text-amber-400" />{t('members.removeDialog.title')}</DialogTitle>
            <DialogDescription className="text-muted-foreground">{t('members.removeDialog.description', { name: removingMember?.full_name || t('members.untitledInvite') })}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="bg-popover border-border">
            <Button variant="outline" onClick={() => setRemovingMember(null)} className="border-border text-muted-foreground hover:bg-muted">{t('members.removeDialog.cancel')}</Button>
            <Button onClick={handleRemove} disabled={!!pendingMemberAction} className="bg-red-600 hover:bg-red-700 text-white">{pendingMemberAction ? <><Loader2 className="size-4 animate-spin" />{t('members.removeDialog.submitting')}</> : t('members.removeDialog.submit')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
