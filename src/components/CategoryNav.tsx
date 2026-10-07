import Link from 'next/link'
import type { Category } from '@shared/types/category'

/**
 * LuckySevenHub category selector — squared chips, cobalt when active.
 * Works on the home page (basePath="/") and the casinos listing.
 */
export default function CategoryNav({
  categories,
  selected,
  basePath = '/casinos',
}: {
  categories: Category[]
  selected: string
  basePath?: string
}) {
  return (
    <nav aria-label="Casino categories" className="flex flex-wrap gap-3">
      {categories.map((c) => {
        const active = c.slug === selected
        return (
          <Link
            key={c.id}
            // On the home page the nav is an in-page filter (basePath="/"), so it
            // keeps the query form. Anywhere else it links straight at the
            // canonical category route — never through the 301.
            href={basePath === '/' ? `/?category=${c.slug}` : `/categories/${c.slug}`}
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
