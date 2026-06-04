import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/flows/admin-client'
import { sendTextMessage, sendTemplateMessage } from '@/lib/whatsapp/meta-api'
import { decrypt } from '@/lib/whatsapp/encryption'
import {
  normalizePhone,
  sanitizePhoneForMeta,
  isValidE164,
  phonesMatch,
} from '@/lib/whatsapp/phone-utils'
import {
  canSendMessages,
  isAccountRole,
} from '@/lib/auth/roles'
import { isMessageTemplate } from '@/lib/whatsapp/template-row-guard'
import type { MessageTemplate } from '@/types'

const WINDOW_MS = 24 * 60 * 60 * 1000

interface InitialMessage {
  type: 'text' | 'template'
  text?: string
  template_name?: string
  template_language?: string
  template_params?: string[]
}

interface StartConversationBody {
  contact_id?: string
  to?: string
  name?: string
  initial_message?: InitialMessage
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Resolve account + role
    const { data: profile } = await supabase
      .from('profiles')
      .select('account_id, role')
      .eq('user_id', user.id)
      .maybeSingle()

    const accountId = profile?.account_id as string | undefined
    if (!accountId) {
      return NextResponse.json(
        { error: 'Your profile is not linked to an account.' },
        { status: 403 },
      )
    }

    const role = profile?.role
    if (!isAccountRole(role) || !canSendMessages(role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body: StartConversationBody = await request.json()
    const { contact_id, to, name, initial_message } = body

    if (!contact_id && !to) {
      return NextResponse.json(
        { error: 'contact_id or to is required' },
        { status: 400 },
      )
    }

    // Fetch WhatsApp config (needed for phone_number_id + access_token)
    const { data: config } = await supabase
      .from('whatsapp_config')
      .select('*')
      .eq('account_id', accountId)
      .maybeSingle()

    if (!config) {
      return NextResponse.json(
        { error: 'whatsapp_not_configured' },
        { status: 422 },
      )
    }

    // Fetch config owner user_id for audit column in inserts
    const { data: configOwnerProfile } = await supabaseAdmin()
      .from('profiles')
      .select('user_id')
      .eq('account_id', accountId)
      .eq('role', 'owner')
      .maybeSingle()
    const configOwnerUserId: string = configOwnerProfile?.user_id ?? user.id

    // Resolve contact
    let contact: Record<string, unknown> | null = null

    if (contact_id) {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', contact_id)
        .eq('account_id', accountId)
        .maybeSingle()
      if (error || !data) {
        return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
      }
      contact = data
    } else {
      // Resolve by phone number
      const normalized = normalizePhone(to!)
      if (!normalized) {
        return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 })
      }

      const suffix =
        normalized.replace(/\D/g, '').length >= 8
          ? normalized.replace(/\D/g, '').slice(-8)
          : normalized.replace(/\D/g, '')

      const { data: candidates } = await supabaseAdmin()
        .from('contacts')
        .select('*')
        .eq('account_id', accountId)
        .like('phone', `%${suffix}`)

      const existing = (candidates ?? []).find((c: Record<string, unknown>) =>
        phonesMatch(c.phone as string, normalized),
      )

      if (existing) {
        contact = existing
      } else {
        // Create contact
        const { data: created, error: createErr } = await supabaseAdmin()
          .from('contacts')
          .insert({
            account_id: accountId,
            user_id: configOwnerUserId,
            phone: normalized,
            name: name || normalized,
          })
          .select()
          .single()

        if (createErr || !created) {
          return NextResponse.json({ error: 'Failed to create contact' }, { status: 500 })
        }
        contact = created
      }
    }

    if (!contact) {
      return NextResponse.json({ error: 'Failed to resolve contact' }, { status: 500 })
    }

    const contactPhone = contact.phone as string
    const sanitizedPhone = sanitizePhoneForMeta(contactPhone)
    if (!isValidE164(sanitizedPhone)) {
      return NextResponse.json({ error: 'Invalid phone number format' }, { status: 400 })
    }

    // Find or create conversation
    const { data: existingConv } = await supabaseAdmin()
      .from('conversations')
      .select('*')
      .eq('account_id', accountId)
      .eq('contact_id', contact.id as string)
      .maybeSingle()

    let conversation = existingConv
    if (!conversation) {
      const { data: newConv, error: convErr } = await supabaseAdmin()
        .from('conversations')
        .insert({
          account_id: accountId,
          user_id: configOwnerUserId,
          contact_id: contact.id as string,
        })
        .select()
        .single()

      if (convErr || !newConv) {
        return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 })
      }
      conversation = newConv
    }

    // Determine WABA 24h window status
    const { data: lastInbound } = await supabaseAdmin()
      .from('messages')
      .select('created_at')
      .eq('conversation_id', conversation.id as string)
      .eq('sender_type', 'customer')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const lastInboundAt = lastInbound?.created_at as string | undefined
    const freeTextAllowed = lastInboundAt
      ? Date.now() - new Date(lastInboundAt).getTime() < WINDOW_MS
      : false

    // If no message to send, return metadata only
    if (!initial_message) {
      return NextResponse.json(
        {
          conversation_id: conversation.id,
          contact_id: contact.id,
          free_text_allowed: freeTextAllowed,
          last_inbound_message_at: lastInboundAt ?? null,
        },
        { status: existingConv ? 200 : 201 },
      )
    }

    // Validate window for text messages
    if (initial_message.type === 'text') {
      if (!freeTextAllowed) {
        return NextResponse.json(
          { error: 'Free text not allowed outside 24h window. Use a template.' },
          { status: 422 },
        )
      }
      if (!initial_message.text) {
        return NextResponse.json({ error: 'text is required for text messages' }, { status: 400 })
      }
    }

    if (initial_message.type === 'template') {
      if (!initial_message.template_name) {
        return NextResponse.json(
          { error: 'template_name is required for template messages' },
          { status: 400 },
        )
      }
    }

    const accessToken = decrypt(config.access_token)

    // Load and validate template row if needed
    let templateRow: MessageTemplate | null = null
    if (initial_message.type === 'template') {
      const { data: tmpl } = await supabase
        .from('message_templates')
        .select('*')
        .eq('account_id', accountId)
        .eq('name', initial_message.template_name!)
        .eq('language', initial_message.template_language ?? 'en_US')
        .eq('status', 'APPROVED')
        .maybeSingle()

      if (!tmpl) {
        return NextResponse.json(
          { error: 'Template not found or not approved' },
          { status: 422 },
        )
      }
      if (!isMessageTemplate(tmpl)) {
        return NextResponse.json(
          { error: 'Template row is malformed — run "Sync from Meta" in Settings.' },
          { status: 500 },
        )
      }
      templateRow = tmpl
    }

    // Send via Meta API
    let waMessageId = ''
    try {
      if (initial_message.type === 'template') {
        const result = await sendTemplateMessage({
          phoneNumberId: config.phone_number_id,
          accessToken,
          to: sanitizedPhone,
          templateName: initial_message.template_name!,
          language: initial_message.template_language ?? 'en_US',
          template: templateRow ?? undefined,
          params: initial_message.template_params ?? [],
        })
        waMessageId = result.messageId
      } else {
        const result = await sendTextMessage({
          phoneNumberId: config.phone_number_id,
          accessToken,
          to: sanitizedPhone,
          text: initial_message.text!,
        })
        waMessageId = result.messageId
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown Meta API error'
      console.error('[conversations/start] Meta API error:', message)
      return NextResponse.json({ error: `Meta API error: ${message}` }, { status: 502 })
    }

    // Persist message
    const { data: messageRecord, error: msgErr } = await supabaseAdmin()
      .from('messages')
      .insert({
        conversation_id: conversation.id as string,
        sender_type: 'agent',
        content_type: initial_message.type,
        content_text: initial_message.text ?? null,
        template_name: initial_message.template_name ?? null,
        message_id: waMessageId,
        status: 'sent',
      })
      .select()
      .single()

    if (msgErr) {
      console.error('[conversations/start] message insert failed:', msgErr)
      return NextResponse.json(
        { error: `Message sent but failed to save: ${msgErr.message}` },
        { status: 500 },
      )
    }

    // Update conversation metadata
    await supabaseAdmin()
      .from('conversations')
      .update({
        last_message_text:
          initial_message.text ?? `[${initial_message.template_name ?? 'template'}]`,
        last_message_at: new Date().toISOString(),
        status: 'open',
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversation.id as string)

    return NextResponse.json({
      conversation_id: conversation.id,
      contact_id: contact.id,
      message_id: messageRecord.id,
      whatsapp_message_id: waMessageId,
      free_text_allowed: freeTextAllowed,
      last_inbound_message_at: lastInboundAt ?? null,
    })
  } catch (error) {
    console.error('[conversations/start] unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
