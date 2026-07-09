import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { listFlowTemplates, getLocalizedTemplate } from '@/lib/flows/templates'
import { getTranslations } from 'next-intl/server'

/**
 * GET /api/flows/templates
 *
 * Returns the static template gallery (slug + name + description +
 * icon hint + node_count) so the New-flow dialog can render cards
 * without bundling the full template payloads client-side. Bodies
 * are fetched only on actual clone via POST /api/flows.
 *
 * Available to any signed-in user. Flows is in soft-GA.
 */
export async function GET(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const locale = searchParams.get('locale') || 'pt-BR'

  const t = await getTranslations({ locale, namespace: 'FlowTemplates' })

  // Shallow shape so the client gallery doesn't have to know about
  // the full node tree.
  const templates = listFlowTemplates().map((tRaw) => {
    const tLoc = getLocalizedTemplate(tRaw, t)
    return {
      slug: tLoc.slug,
      name: tLoc.name,
      description: tLoc.description,
      icon: tLoc.icon,
      trigger_type: tLoc.trigger_type,
      node_count: tLoc.nodes.length,
    }
  })
  return NextResponse.json({ templates })
}
