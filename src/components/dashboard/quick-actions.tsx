"use client"

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { UserPlus, Briefcase, Radio, Zap } from 'lucide-react'
import type { ComponentType } from 'react'

interface Action {
  labelKey: string
  href: string
  icon: ComponentType<{ className?: string }>
  tint: string
}

const ACTION_DEFS: Action[] = [
  { labelKey: 'newContact', href: '/contacts', icon: UserPlus, tint: 'text-primary' },
  { labelKey: 'newDeal', href: '/pipelines', icon: Briefcase, tint: 'text-blue-400' },
  { labelKey: 'newBroadcast', href: '/broadcasts/new', icon: Radio, tint: 'text-amber-400' },
  { labelKey: 'newAutomation', href: '/automations/new', icon: Zap, tint: 'text-primary' },
]

export function QuickActions() {
  const t = useTranslations('dashboard.quickActions')
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {ACTION_DEFS.map((a) => {
        const Icon = a.icon
        return (
          <Link
            key={a.href}
            href={a.href}
            className="group flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 transition-colors hover:border-slate-700 hover:bg-slate-800/60"
          >
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800 ${a.tint}`}>
              <Icon className="h-4 w-4" />
            </div>
            <span className="text-sm font-medium text-white">{t(a.labelKey)}</span>
          </Link>
        )
      })}
    </div>
  )
}
