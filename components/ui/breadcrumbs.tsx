import Link from "next/link";
import { ChevronRight } from "lucide-react";

export type Crumb = { label: string; href?: string };

/**
 * A visible trail back through nested pages. Low-literacy / low-confidence
 * users navigate hierarchies less easily than expert users, and often don't
 * think to use the browser back button — a clickable trail gives them a
 * always-visible, low-risk way back (Nielsen's "user control and freedom").
 */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-3 flex flex-wrap items-center gap-1 text-sm text-slate-500">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <span key={index} className="flex items-center gap-1">
            {index > 0 && <ChevronRight size={14} aria-hidden="true" className="text-slate-300" />}
            {item.href && !isLast ? (
              <Link href={item.href} className="hover:text-brand-green hover:underline">
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? "font-medium text-slate-700" : ""}>{item.label}</span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
