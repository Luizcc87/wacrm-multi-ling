'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { Plus, Loader2, RefreshCw, X, Upload, Edit } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { uploadAccountMedia, MEDIA_MAX_BYTES_BY_KIND } from '@/lib/storage/upload-media';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { SettingsPanelHead } from './settings-panel-head';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { MessageTemplate, TemplateButton, TemplateSampleValues } from '@/types';
import { templateStatusConfig } from '@/lib/template-status';
import { extractVariableIndices, TEMPLATE_LIMITS } from '@/lib/whatsapp/template-validators';

type HeaderFormat = 'none' | 'text' | 'image' | 'video' | 'document';

const HEADER_FORMATS: HeaderFormat[] = ['none', 'text', 'image', 'video', 'document'];

interface TemplateFormData {
  name: string;
  category: MessageTemplate['category'];
  language: string;
  header_format: HeaderFormat;
  header_content: string;
  header_media_url: string;
  header_sample: string;
  body_text: string;
  body_samples: string[];
  footer_text: string;
  buttons: TemplateButton[];
}

const emptyForm: TemplateFormData = { name: '', category: 'Marketing', language: 'en_US', header_format: 'none', header_content: '', header_media_url: '', header_sample: '', body_text: '', body_samples: [], footer_text: '', buttons: [] };

function emptyButton(type: TemplateButton['type']): TemplateButton {
  if (type === 'URL') return { type, text: '', url: '' };
  if (type === 'PHONE_NUMBER') return { type, text: '', phone_number: '' };
  if (type === 'COPY_CODE') return { type, text: '', example: '' };
  return { type: 'QUICK_REPLY', text: '' };
}

export function TemplateManager() {
  const supabase = createClient();
  const { user, loading: authLoading } = useAuth();
  const t = useTranslations('settings');
  const tc = useTranslations('common');
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [form, setForm] = useState<TemplateFormData>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [templateToDelete, setTemplateToDelete] = useState<MessageTemplate | null>(null);
  const [uploadingHeader, setUploadingHeader] = useState(false);
  const headerFileRef = useRef<HTMLInputElement>(null);

  const bodyVarCount = useMemo(() => extractVariableIndices(form.body_text).length, [form.body_text]);
  const headerVarCount = useMemo(() => form.header_format === 'text' ? extractVariableIndices(form.header_content).length : 0, [form.header_format, form.header_content]);

  useEffect(() => {
    setForm((prev) => {
      const next = prev.body_samples.slice(0, bodyVarCount);
      while (next.length < bodyVarCount) next.push('');
      return { ...prev, body_samples: next };
    });
  }, [bodyVarCount]);

  useEffect(() => { if (authLoading) return; if (!user) { setLoading(false); return; } (async () => { setLoading(false); const { data } = await supabase.from('message_templates').select('*').eq('user_id', user.id).order('created_at', { ascending: false }); setTemplates(data || []); })(); }, [authLoading, user?.id, supabase]);

  async function handleSubmit() {
    try {
      setSubmitting(true);
      const sample_values: TemplateSampleValues = {};
      if (form.body_samples.some((v) => v.trim())) sample_values.body = form.body_samples.map((v) => v.trim());
      if (form.header_format === 'text' && form.header_sample.trim()) sample_values.header = [form.header_sample.trim()];
      const payload = { name: form.name.trim(), category: form.category, language: form.language.trim() || 'en_US', header_type: form.header_format === 'none' ? undefined : form.header_format, header_content: form.header_format === 'text' ? form.header_content.trim() : undefined, header_media_url: form.header_format !== 'none' && form.header_format !== 'text' ? form.header_media_url.trim() || undefined : undefined, body_text: form.body_text.trim(), footer_text: form.footer_text.trim() || undefined, buttons: form.buttons.length > 0 ? form.buttons : undefined, sample_values: Object.keys(sample_values).length > 0 ? sample_values : undefined };
      const res = await fetch(editingId ? `/api/whatsapp/templates/${editingId}` : '/api/whatsapp/templates/submit', { method: editingId ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Template save failed');
      toast.success(editingId ? t('templates.toasts.editSubmitted') : t('templates.toasts.submitted'));
      setDialogOpen(false);
      setEditingId(null);
    } catch (err) { toast.error(err instanceof Error ? err.message : t('templates.toasts.submitFailed')); } finally { setSubmitting(false); }
  }

  async function handleSyncFromMeta() {
    try { setSyncing(true); await fetch('/api/whatsapp/templates/sync', { method: 'POST' }); toast.success(t('templates.toasts.synced', { total: templates.length })); } catch { toast.error(t('templates.toasts.syncFailed')); } finally { setSyncing(false); }
  }

  async function handleHeaderImageFile(file: File) {
    if (file.size > MEDIA_MAX_BYTES_BY_KIND.image) return toast.error('Image too large.');
    setUploadingHeader(true);
    try { const { publicUrl } = await uploadAccountMedia('chat-media', file); setForm((f) => ({ ...f, header_media_url: publicUrl })); toast.success('Image uploaded.'); } catch (err) { toast.error(err instanceof Error ? err.message : 'Upload failed.'); } finally { setUploadingHeader(false); }
  }

  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 className="size-6 animate-spin text-primary" /></div>;

  return (
    <section className="animate-in fade-in-50 space-y-4 duration-200">
      <SettingsPanelHead title={t('templates.managerTitle')} description={t('templates.managerDesc')} action={<div className="flex items-center gap-2"><Button variant="outline" onClick={handleSyncFromMeta} disabled={syncing}><RefreshCw className={`size-4 ${syncing ? 'animate-spin' : ''}`} />{syncing ? t('templates.syncing') : t('templates.sync')}</Button><Button onClick={() => { setForm(emptyForm); setEditingId(null); setDialogOpen(true); }}><Plus className="size-4" />{t('templates.newTemplate')}</Button></div>} />
      {templates.length === 0 ? <Card><CardContent className="flex flex-col items-center justify-center py-12 text-center"><p className="text-sm text-muted-foreground">{t('templates.noTemplates')}</p><p className="mt-1 text-xs text-muted-foreground">{t('templates.noTemplatesHint')}</p></CardContent></Card> : <div className="grid gap-3 xl:grid-cols-2">{templates.map((template) => <Card key={template.id}><CardContent className="flex items-start justify-between pt-4"><div className="space-y-2 min-w-0 flex-1"><div className="flex items-center gap-2 flex-wrap"><h3 className="font-medium text-foreground">{template.name}</h3><Badge className="text-xs border">{template.category}</Badge><Badge className="text-xs border">{templateStatusConfig[(template.status || 'DRAFT') as keyof typeof templateStatusConfig]?.label || template.status || 'Draft'}</Badge></div><p className="text-xs text-muted-foreground">{template.language}</p></div><div className="flex items-center gap-2"><Button variant="ghost" size="icon" onClick={() => { setEditingId(template.id); setForm({ name: template.name, category: template.category, language: template.language || 'en_US', header_format: (template.header_type ?? 'none') as HeaderFormat, header_content: template.header_content ?? '', header_media_url: template.header_media_url ?? '', header_sample: template.sample_values?.header?.[0] ?? '', body_text: template.body_text, body_samples: template.sample_values?.body ?? [], footer_text: template.footer_text ?? '', buttons: template.buttons ?? [] }); setDialogOpen(true); }}><Edit className="size-4" /></Button></div></CardContent></Card>)}</div>}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogContent className="bg-popover border-border"><DialogHeader><DialogTitle>{editingId ? t('templates.editMessageTemplate') : t('templates.newMessageTemplate')}</DialogTitle><DialogDescription>{editingId ? t('templates.editDialogDesc') : t('templates.newDialogDesc')}</DialogDescription></DialogHeader><div className="space-y-4"><div className="space-y-2"><Label>{t('templates.formName')}</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div><div className="space-y-2"><Label>{t('templates.formCategory')}</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as TemplateFormData['category'] })} /></div><div className="space-y-2"><Label>{t('templates.formLanguage')}</Label><Input value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })} /></div><div className="space-y-2"><Label>{t('templates.formHeader')}</Label><Select value={form.header_format} onValueChange={(v) => setForm({ ...form, header_format: (v || 'none') as HeaderFormat })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{HEADER_FORMATS.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent></Select>{form.header_format === 'text' && <Input value={form.header_content} onChange={(e) => setForm({ ...form, header_content: e.target.value })} />}{form.header_format === 'image' && <div className="flex items-center gap-2"><input ref={headerFileRef} type="file" accept="image/jpeg,image/png" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleHeaderImageFile(f); e.target.value = ''; }} /><Button type="button" variant="outline" size="sm" onClick={() => headerFileRef.current?.click()} disabled={uploadingHeader}>{uploadingHeader ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}{t('templates.headerImage')}</Button><Input value={form.header_media_url} onChange={(e) => setForm({ ...form, header_media_url: e.target.value })} /></div>}</div><div className="space-y-2"><Label>{t('templates.formBody')}</Label><Textarea value={form.body_text} onChange={(e) => setForm({ ...form, body_text: e.target.value })} rows={4} />{bodyVarCount > 0 && <div className="space-y-1.5">{Array.from({ length: bodyVarCount }).map((_, i) => <Input key={i} value={form.body_samples[i] || ''} onChange={(e) => { const next = [...form.body_samples]; next[i] = e.target.value; setForm({ ...form, body_samples: next }); }} />)}</div>}</div><div className="space-y-2"><Label>{t('templates.formFooter')}</Label><Input value={form.footer_text} onChange={(e) => setForm({ ...form, footer_text: e.target.value })} /></div></div><DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>{tc('cancel')}</Button><Button onClick={handleSubmit} disabled={submitting}>{submitting ? <><Loader2 className="size-4 animate-spin" />{t('templates.deleting')}</> : editingId ? t('templates.saveAndResubmit') : t('templates.submitForApproval')}</Button></DialogFooter></DialogContent></Dialog>
    </section>
  );
}
