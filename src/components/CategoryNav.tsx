import Link from 'next/link'
import type { Category } from '@shared/types/category'

/**
 * LuckySevenHub category selector — squared chips, cobalt when active.
 * Mounted on the home page and on the casinos listing; both link at the
 * canonical /categories/<slug> route.
 */
export default function CategoryNav({
  categories,
  selected,
}: {
  categories: Category[]
  selected: string
}) {
  return (
    <nav aria-label="Casino categories" className="flex flex-wrap gap-3">
      {categories.map((c) => {
        const active = c.slug === selected
        return (
          <Link
            key={c.id}
            /*
             * ALWAYS the canonical category route.
             *
             * The home page used to take the query form `/?category=<slug>` and
             * filter in place; `site-template` linked `/casinos?category=<slug>`,
             * which went through a redirect. Both are now 301'd to this very URL
             * at the edge (lib/seo/redirects.ts), so emitting either would mean
             * linking a redirect — one wasted hop per visitor, and, multiplied by
             * the number of categories, a page's worth of crawl budget spent on
             * URLs that resolve elsewhere. It is also what Search Console
             * reported as "Alternate page with proper canonical tag": the home
             * page existed once per category, each copy canonical-tagged at `/`.
             *
             * The chips therefore NAVIGATE rather than filter in place. The
             * destination renders the same list from the same endpoint, under a
             * URL that can be linked, shared and indexed.
             */
            href={`/categories/${c.slug}`}
            aria-current={active ? 'page' : undefined}
            // The active chip carries a TRANSPARENT border purely so its box model
            // matches the inactive ones, which are bordered. Without it the selected
            // chip is 2px shorter — invisible while chips share a row and are
            // stretched to match, obvious the moment they wrap to one per row.
            //
            // `bg-origin-border` is what that transparent border costs, and it is
            // not optional. A gradient is sized to the PADDING box by default but
            // clipped to the BORDER box, and the leftover strip is filled by the
            // image repeating — so the 1px above the padding box showed the tail of
            // the previous tile, i.e. the gradient's DARK end, as a dark hairline
            // across the top of the selected chip. Sizing the gradient to the border
            // box instead leaves nothing to repeat. No other button on this site
            // hits it: they all have gradients but none has a border.
            className={`flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition-all ${
              active
                ? 'border border-transparent bg-origin-border bg-gradient-to-b from-brand-soft to-brand-dark text-white shadow-md shadow-brand/25'
                : 'border border-line-soft bg-paper text-ink hover:border-brand hover:text-brand'
            }`}
          >
            {c.name}
            {typeof c.casinos_count === 'number' && (
              <span className={`text-xs ${active ? 'text-white/70' : 'text-faint'}`}>{c.casinos_count}</span>
            )}
          </Link>
        )
      })}
    </nav>
  )
}
