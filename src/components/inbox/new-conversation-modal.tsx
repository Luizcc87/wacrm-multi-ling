"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, MessageSquarePlus, AlertCircle, CheckCircle2, Search } from "lucide-react";
import { TemplatePicker, type TemplateSendValues } from "./template-picker";
import type { MessageTemplate, Contact } from "@/types";
import { createClient } from "@/lib/supabase/client";

interface NewConversationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pre-fill phone when opened from contact sidebar */
  prefillPhone?: string;
  prefillContactId?: string;
}

interface WindowInfo {
  conversation_id: string;
  contact_id: string;
  free_text_allowed: boolean;
  last_inbound_message_at: string | null;
}

export function NewConversationModal({
  open,
  onOpenChange,
  prefillPhone,
  prefillContactId,
}: NewConversationModalProps) {
  const t = useTranslations("startConversation");
  const router = useRouter();
  const locale = useLocale();

  const [phone, setPhone] = useState(prefillPhone ?? "");
  const [name, setName] = useState("");
  const [windowInfo, setWindowInfo] = useState<WindowInfo | null>(null);
  const [loadingWindow, setLoadingWindow] = useState(false);
  const [windowError, setWindowError] = useState<string | null>(null);

  const [freeText, setFreeText] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Contact[]>([]);
  const [searchingContacts, setSearchingContacts] = useState(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (open) {
      setPhone(prefillPhone ?? "");
      setName("");
      setWindowInfo(null);
      setWindowError(null);
      setFreeText("");
      setSendError(null);
      setSearchTerm("");
      setSearchResults([]);
      if (prefillContactId) {
        void resolveWindow(undefined, prefillContactId);
      } else if (prefillPhone) {
        void resolveWindow(prefillPhone);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Search contacts
  useEffect(() => {
    if (searchTerm.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      setSearchingContacts(true);
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("contacts")
          .select("*")
          .or(`name.ilike.%${searchTerm.trim()}%,phone.ilike.%${searchTerm.trim()}%`)
          .limit(5);

        if (!error && data) {
          setSearchResults(data);
        } else {
          setSearchResults([]);
        }
      } catch (err) {
        console.error("Error searching contacts:", err);
      } finally {
        setSearchingContacts(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  function handleSelectContact(contact: Contact) {
    setPhone(contact.phone);
    setName(contact.name || "");
    setSearchTerm("");
    setSearchResults([]);
    void resolveWindow(undefined, contact.id);
  }

  async function resolveWindow(toPhone?: string, contactId?: string) {
    setLoadingWindow(true);
    setWindowError(null);
    setWindowInfo(null);
    try {
      const body: Record<string, string> = {};
      if (contactId) {
        body.contact_id = contactId;
      } else if (toPhone) {
        body.to = toPhone;
        if (name.trim()) body.name = name.trim();
      }
      const res = await fetch("/api/conversations/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.status === 422) {
        const data = await res.json();
        if (data.error === "whatsapp_not_configured") {
          setWindowError(t("whatsappNotConfigured"));
          return;
        }
        if (data.error === "token_decryption_failed") {
          setWindowError(t("tokenDecryptionFailed"));
          return;
        }
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.error === "token_decryption_failed") {
          setWindowError(t("tokenDecryptionFailed"));
          return;
        }
        setWindowError(data.error ?? t("errorMetaApi"));
        return;
      }
      const data: WindowInfo = await res.json();
      setWindowInfo(data);
    } catch {
      setWindowError(t("errorMetaApi"));
    } finally {
      setLoadingWindow(false);
    }
  }

  function handlePhoneBlur() {
    const trimmed = phone.trim();
    if (trimmed.length >= 8) {
      void resolveWindow(trimmed);
    }
  }

  async function sendMessage(payload: {
    type: "text" | "template";
    text?: string;
    template?: MessageTemplate;
    values?: TemplateSendValues;
  }) {
    if (!windowInfo) return;
    setSending(true);
    setSendError(null);
    try {
      const body: Record<string, unknown> = {
        contact_id: windowInfo.contact_id,
        initial_message:
          payload.type === "text"
            ? { type: "text", text: payload.text }
            : {
                type: "template",
                template_name: payload.template!.name,
                template_language: payload.template!.language,
                template_params: payload.values?.body ?? [],
              },
      };
      const res = await fetch("/api/conversations/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.error === "token_decryption_failed") {
          setSendError(t("tokenDecryptionFailed"));
          return;
        }
        setSendError(data.error ?? t("errorMetaApi"));
        return;
      }
      const data = await res.json();
      onOpenChange(false);
      router.push(`/${locale}/inbox?c=${data.conversation_id}`);
    } catch {
      setSendError(t("errorMetaApi"));
    } finally {
      setSending(false);
    }
  }

  function handleTemplateSelect(tmpl: MessageTemplate, values: TemplateSendValues) {
    void sendMessage({ type: "template", template: tmpl, values });
  }

  const canLookup = phone.trim().length >= 8 && !loadingWindow;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="border-slate-700 bg-slate-900 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <MessageSquarePlus className="h-4 w-4 text-primary" />
              {t("newConversation")}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Phone input — hidden when prefillContactId is set */}
            {!prefillContactId && (
              <div className="space-y-4">
                {/* Search / Autocomplete Field */}
                {!prefillPhone && (
                  <div className="space-y-1.5 relative">
                    <Label className="text-xs text-slate-300 font-medium">
                      {t("searchContactLabel")}
                    </Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                      <Input
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder={t("searchContactPlaceholder")}
                        className="pl-9 border-slate-700 bg-slate-800 text-white placeholder:text-slate-500"
                        disabled={sending}
                      />
                      {searchingContacts && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <Loader2 className="h-3 w-3 animate-spin text-slate-400" />
                        </div>
                      )}
                    </div>

                    {/* Autocomplete Results Dropdown */}
                    {searchResults.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 max-h-60 overflow-auto rounded-md border border-slate-700 bg-slate-800 p-1 shadow-lg divide-y divide-slate-700/50">
                        {searchResults.map((contact) => (
                          <button
                            key={contact.id}
                            type="button"
                            className="w-full text-left px-3 py-2 rounded-sm text-sm text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
                            onClick={() => handleSelectContact(contact)}
                          >
                            <div className="font-medium text-white">{contact.name || "Sem Nome"}</div>
                            <div className="text-xs text-slate-400 font-mono">{contact.phone}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Telefone Field */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-300 font-medium">
                    {t("phoneLabel")}
                  </Label>
                  <Input
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      setWindowInfo(null);
                      setWindowError(null);
                    }}
                    onBlur={handlePhoneBlur}
                    placeholder={t("phonePlaceholder")}
                    className="border-slate-700 bg-slate-800 text-white placeholder:text-slate-500"
                    disabled={sending}
                  />
                </div>

                {/* Nome Field */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-300 font-medium">
                    {t("nameLabel")}
                  </Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t("namePlaceholder")}
                    className="border-slate-700 bg-slate-800 text-white placeholder:text-slate-500"
                    disabled={sending}
                  />
                </div>

                {/* Search Contact / Lookup Button */}
                {!windowInfo && canLookup && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="border-slate-700 text-slate-300 hover:bg-slate-800"
                    onClick={() => resolveWindow(phone.trim())}
                    disabled={loadingWindow}
                  >
                    {loadingWindow ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
                    ) : null}
                    {t("searchContact")}
                  </Button>
                )}
              </div>
            )}

            {/* Loading state */}
            {loadingWindow && (
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span>{t("searchContact")}…</span>
              </div>
            )}

            {/* Error state */}
            {windowError && (
              <div className="flex items-start gap-2 rounded-md border border-red-800/40 bg-red-950/30 p-3 text-sm text-red-400">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>{windowError}</span>
              </div>
            )}

            {/* Window status + composer */}
            {windowInfo && (
              <>
                <div
                  className={`flex items-center gap-2 rounded-md border p-3 text-sm ${
                    windowInfo.free_text_allowed
                      ? "border-green-800/40 bg-green-950/30 text-green-400"
                      : "border-amber-800/40 bg-amber-950/30 text-amber-400"
                  }`}
                >
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                  <span>
                    {windowInfo.free_text_allowed ? t("windowOpen") : t("windowClosed")}
                  </span>
                </div>

                {windowInfo.free_text_allowed ? (
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-300">{t("messageLabel")}</Label>
                    <textarea
                      value={freeText}
                      onChange={(e) => setFreeText(e.target.value)}
                      rows={3}
                      className="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-primary"
                      disabled={sending}
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 p-6 text-center">
                    <AlertCircle className="h-8 w-8 text-amber-500" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-white">
                        {t("windowClosed")}
                      </p>
                      <p className="text-xs text-slate-400">
                        {t("windowExpired")}
                      </p>
                    </div>
                    <Button
                      type="button"
                      onClick={() => setTemplatePickerOpen(true)}
                      className="bg-amber-600 text-white hover:bg-amber-700 font-medium"
                    >
                      {t("selectTemplate")}
                    </Button>
                  </div>
                )}
              </>
            )}

            {/* Send error */}
            {sendError && (
              <div className="flex items-start gap-2 rounded-md border border-red-800/40 bg-red-950/30 p-3 text-sm text-red-400">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>{sendError}</span>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
              disabled={sending}
            >
              {t("cancel")}
            </Button>

            {windowInfo?.free_text_allowed && (
              <Button
                onClick={() => sendMessage({ type: "text", text: freeText })}
                disabled={sending || freeText.trim().length === 0}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {sending ? t("sending") : t("send")}
              </Button>
            )}


          </DialogFooter>
        </DialogContent>
      </Dialog>

      <TemplatePicker
        open={templatePickerOpen}
        onOpenChange={setTemplatePickerOpen}
        onSelect={handleTemplateSelect}
      />
    </>
  );
}
