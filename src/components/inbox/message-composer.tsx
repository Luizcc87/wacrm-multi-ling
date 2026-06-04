"use client";

import { useState, useRef, useCallback, KeyboardEvent } from "react";
import { useTranslations } from 'next-intl';
import { Send, LayoutTemplate } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GatedButton } from "@/components/ui/gated-button";
import { useCan } from "@/hooks/use-can";
import { cn } from "@/lib/utils";
import { ReplyQuote } from "./reply-quote";

interface ReplyDraft {
  /** Internal UUID of the message being replied to — sent back through onSend. */
  id: string;
  authorLabel: string;
  preview: string;
}

interface StagedTemplateInfo {
  template: any;
  values: {
    body: string[];
    headerText?: string;
    buttonParams?: Record<number, string>;
  };
  renderedText: string;
}

interface MessageComposerProps {
  conversationId: string;
  sessionExpired: boolean;
  onSend: (text: string, replyToId?: string) => void;
  onOpenTemplates: () => void;
  replyTo?: ReplyDraft | null;
  onClearReply?: () => void;
  stagedTemplate?: StagedTemplateInfo | null;
  onSendStagedTemplate?: () => void;
  onClearStagedTemplate?: () => void;
}

export function MessageComposer({
  conversationId,
  sessionExpired,
  onSend,
  onOpenTemplates,
  replyTo,
  onClearReply,
  stagedTemplate,
  onSendStagedTemplate,
  onClearStagedTemplate,
}: MessageComposerProps) {
  const t = useTranslations('inbox');
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // For solo users this is always true — single-owner accounts pass
  // every capability — so the disabled branch is a no-op there.
  const canSend = useCan("send-messages");
  const readOnly = !canSend;

  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    // Max 4 lines (~96px)
    el.style.height = `${Math.min(el.scrollHeight, 96)}px`;
  }, []);

  const handleSend = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || sending || sessionExpired) return;

    setSending(true);
    try {
      onSend(trimmed, replyTo?.id);
      setText("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    } finally {
      setSending(false);
    }
  }, [text, sending, sessionExpired, onSend, replyTo?.id]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setText(e.target.value);
      adjustHeight();
    },
    [adjustHeight]
  );

  return (
    <div className="border-t border-slate-800 bg-slate-900 p-3">
      {stagedTemplate && (
        <div className="mb-3 rounded-xl border border-slate-700 bg-slate-800/40 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="inline-flex items-center gap-1 rounded bg-primary/20 px-2.5 py-0.5 text-xs font-semibold text-primary">
              <LayoutTemplate className="h-3.5 w-3.5" />
              Template: {stagedTemplate.template.name}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs text-slate-400 hover:bg-slate-700 hover:text-white"
              onClick={onClearStagedTemplate}
            >
              {t('templateCancel') || 'Cancelar'}
            </Button>
          </div>
          {stagedTemplate.values.headerText && (
            <div className="mb-1 text-xs font-semibold text-slate-300">
              {stagedTemplate.values.headerText}
            </div>
          )}
          <p className="whitespace-pre-wrap text-sm text-slate-200">
            {stagedTemplate.renderedText}
          </p>
          {stagedTemplate.template.buttons && stagedTemplate.template.buttons.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {stagedTemplate.template.buttons.map((btn: any, idx: number) => (
                <div
                  key={idx}
                  className="rounded-lg border border-slate-700 bg-slate-900/50 px-2.5 py-1 text-xs text-slate-400"
                >
                  {btn.type === "URL" && stagedTemplate.values.buttonParams?.[idx]
                    ? `${btn.text} (${stagedTemplate.values.buttonParams[idx]})`
                    : btn.text}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {replyTo && !stagedTemplate && (
        <div className="mb-2">
          <ReplyQuote
            authorLabel={replyTo.authorLabel}
            preview={replyTo.preview}
            onDismiss={onClearReply}
          />
        </div>
      )}

      {sessionExpired && !stagedTemplate && (
        <div className="mb-2 flex items-center justify-between rounded-lg bg-amber-500/10 px-3 py-2">
          <p className="text-xs text-amber-400">
            {t('sessionExpired')}
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-amber-400 hover:text-amber-300"
            onClick={onOpenTemplates}
          >
            <LayoutTemplate className="mr-1 h-3 w-3" />
            {t('templateButton')}
          </Button>
        </div>
      )}

      <div className="flex items-end gap-2">
        <GatedButton
          variant="ghost"
          size="sm"
          canAct={!readOnly}
          gateReason="send messages"
          title={readOnly ? undefined : t('templateButton')}
          className="h-9 w-9 shrink-0 p-0 text-slate-400 hover:text-white"
          onClick={onOpenTemplates}
        >
          <LayoutTemplate className="h-4 w-4" />
        </GatedButton>

        <textarea
          ref={textareaRef}
          value={stagedTemplate ? "" : text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={
            readOnly
              ? t('readOnlyPlaceholder')
              : stagedTemplate
                ? t('templateStagedPlaceholder')
                : sessionExpired
                  ? t('sessionExpiredPlaceholder')
                  : t('typeMessage')
          }
          disabled={sessionExpired || readOnly || !!stagedTemplate}
          rows={1}
          title={readOnly ? t('readOnlyTitle') : undefined}
          className={cn(
            "flex-1 resize-none rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition-colors focus:border-primary/50",
            (sessionExpired || readOnly || !!stagedTemplate) && "cursor-not-allowed opacity-50"
          )}
        />

        <GatedButton
          size="sm"
          canAct={!readOnly}
          gateReason="send messages"
          disabled={
            stagedTemplate
              ? sending
              : !text.trim() || sessionExpired || sending
          }
          onClick={stagedTemplate ? onSendStagedTemplate : handleSend}
          className="h-9 w-9 shrink-0 bg-primary p-0 hover:bg-primary/90 disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </GatedButton>
      </div>

      <p className="mt-1 pl-11 text-[10px] text-slate-600">
        {t('quickRepliesHint')}
      </p>
    </div>
  );
}
