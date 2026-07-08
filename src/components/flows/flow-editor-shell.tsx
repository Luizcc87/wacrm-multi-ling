"use client";

/**
 * View-switcher for the flow editor.
 *
 * Renders a small Canvas / List pill above whichever view is active,
 * and conditionally mounts `<FlowCanvas>` or `<FlowBuilder>`. Why a
 * separate component:
 *   - The page itself stays trivially small (loading + error + this).
 *   - Either view can stay unaware of the other — they share data
 *     (`{flow, nodes}`) and nothing else.
 *
 * View choice persists per-browser via localStorage so a power user
 * who prefers the list isn't fighting the default on every load.
 * Canvas is the default for everyone else — the original user
 * feedback was that the list shape made flows "hard to understand".
 */

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { GitFork, List } from "lucide-react";

import { FlowBuilder } from "./flow-builder";
import { FlowCanvas } from "./flow-canvas";
import { FlowEditorProvider } from "./flow-editor-state";
import { EditorHeader } from "./header";
import { ValidationPanel } from "./validation-panel";
import { cn } from "@/lib/utils";
import type { FlowRow, FlowNodeRow } from "@/lib/flows/types";
import { NODE_META, nodeColors, type NodeType } from "./shared";

/**
 * Below this viewport width we force list view and hide the toggle.
 * Canvas with drag-to-connect on a phone is unusable — handles are
 * ~10px and live finger drags from one node to another aren't a
 * practical workflow. Matches Tailwind's `md` breakpoint.
 */
const MOBILE_BREAKPOINT = "(max-width: 767px)";

type View = "canvas" | "list";

const STORAGE_KEY = "wacrm.flowEditor.view";

const LEGEND_TYPES = Object.keys(NODE_META) as NodeType[];

interface Props {
  initialFlow: FlowRow;
  initialNodes: FlowNodeRow[];
}

export function FlowEditorShell({ initialFlow, initialNodes }: Props) {
  const t = useTranslations("flows");
  // Read the persisted choice in the useState initializer. Safe even
  // though this is a client component because the parent page only
  // mounts us AFTER a client-side fetch resolves — there's no SSR
  // pass for this subtree, so no hydration mismatch to worry about.
  // Default to `canvas` (the new default) when nothing is saved.
  const [view, setView] = useState<View>(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === "canvas" || saved === "list") return saved;
    } catch {
      // Private browsing / disabled storage — fall through to default.
    }
    return "canvas";
  });

  // Live mobile detection. We don't render canvas under the
  // breakpoint regardless of `view` — but we keep `view` itself
  // intact so the user's preference comes back when they widen
  // again (e.g. rotating a tablet, resizing a window).
  const isMobile = useMatchMedia(MOBILE_BREAKPOINT);
  const effectiveView: View = isMobile ? "list" : view;

  const choose = (next: View) => {
    setView(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore
    }
  };

  return (
    <FlowEditorProvider initialFlow={initialFlow} initialNodes={initialNodes}>
      <div className="mx-auto flex h-full max-w-4xl flex-col gap-6 p-6">
        <EditorHeader />
        {!isMobile && (
          <div className="flex items-center justify-end">
            <div
              role="group"
              aria-label={t("header.editorView")}
              className="inline-flex items-center gap-1 rounded-md border border-slate-700 bg-slate-900 p-0.5 text-xs"
            >
              <ToggleButton
                active={effectiveView === "canvas"}
                onClick={() => choose("canvas")}
                icon={<GitFork className="h-3.5 w-3.5" />}
                label={t("header.canvas")}
              />
              <ToggleButton
                active={effectiveView === "list"}
                onClick={() => choose("list")}
                icon={<List className="h-3.5 w-3.5" />}
                label={t("header.list")}
              />
            </div>
            <div className="ml-auto hidden flex-wrap items-center gap-x-3.5 gap-y-1.5 lg:flex">
              {LEGEND_TYPES.map((t_type: NodeType) => (
                <span
                  key={t_type}
                  className="inline-flex items-center gap-1.5 text-[11.5px] text-muted-foreground"
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: nodeColors(t_type).solid }}
                  />
                  {t(`nodes.${t_type}.label`)}
                </span>
              ))}
            </div>
          </div>
        )}

        {effectiveView === "canvas" ? <FlowCanvas /> : <FlowBuilder />}

        {/* Sticky-bottom validation panel mirrors the placement used
            when this lived inside FlowBuilder — the activate-readiness
            status follows the user as they scroll, in either view. */}
        <div className="sticky bottom-4 z-10 shadow-xl shadow-slate-950/60">
          <ValidationPanel />
        </div>
      </div>
    </FlowEditorProvider>
  );
}

/**
 * Tiny `useMatchMedia` shim. We could pull in `react-responsive` but
 * this is the only consumer and matchMedia is one of those browser
 * APIs that doesn't need a dependency.
 */
function useMatchMedia(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(query).matches;
  });
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    // Safari < 14 still uses addListener; addEventListener is the
    // modern path. Both fire identically.
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [query]);
  return matches;
}

function ToggleButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-1.5 rounded px-2 py-1 transition-colors",
        active
          ? "bg-slate-700 text-slate-100"
          : "text-slate-400 hover:bg-slate-800 hover:text-slate-200",
      )}
    >
      {icon}
      {label}
    </button>
  );
}
