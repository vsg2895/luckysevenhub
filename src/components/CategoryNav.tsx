import Link from 'next/link'
import { resolveImageUrl } from '@/lib/images'
import type { Category } from '@shared/types/category'

/**
 * LuckySevenHub category selector, from sites/luckysevenhub-redesign.html:
 * chunky tags with the count in a badge on the corner; the current category is
 * the blue tag with a yellow badge.
 *
 * On a phone the chips stack, one per row, each the full width of the column;
 * from sm they are one row of EQUAL chips — `w-max` + `1fr` columns, so every
 * track resolves to the widest label — scrolling sideways in its own track if
 * the row is wider than the page. The padding above and to the right leaves
 * room for the corner badge, which sits outside each chip.
 *
 * The chips NAVIGATE rather than filter in place: always the canonical
 * /categories/<slug> route. The query forms (`/?category=`,
 * `/casinos?category=`) are 301'd to it at the edge (lib/seo/redirects.ts), so
 * linking either would spend a redirect per visitor and crawl budget on URLs
 * that resolve elsewhere.
 */
export default function CategoryNav({
  categories,
  selected,
}: {
  categories: Category[]
  selected: string
}) {
  return (
    <nav aria-label="Casino categories" className="no-scrollbar -mx-4 overflow-x-auto px-4 pb-2 pt-2.5">
      <ul className="grid grid-cols-1 gap-x-2.5 gap-y-3.5 pr-2 sm:w-max sm:auto-cols-[1fr] sm:grid-flow-col sm:grid-cols-none" role="list">
        {categories.map((c) => {
          const active = c.slug === selected
          return (
            <li key={c.id}>
              <Link
                href={`/categories/${c.slug}`}
                aria-current={active ? 'page' : undefined}
                className={`relative flex min-h-11 w-full items-center justify-center gap-2 whitespace-nowrap rounded-[14px] border-2 px-[18px] text-sm font-bold transition-colors ${
                  active ? 'border-brand bg-brand text-white' : 'border-line-soft bg-white text-ink hover:border-brand'
                }`}
              >
                {/* The category's own icon, as in the Casinos menu. A plain <img>:
                    next/image refuses SVG. alt="" because the label names it. */}
                {c.logo_path && (
                  <img src={resolveImageUrl(c.logo_path)!} alt="" width={18} height={18} className="h-[18px] w-[18px] shrink-0" />
                )}
                {c.name}
                {typeof c.casinos_count === 'number' && (
                  <span
                    className={`absolute -right-1.5 -top-[9px] flex h-[22px] min-w-6 items-center justify-center rounded-full px-1.5 text-[11px] ${
                      active ? 'bg-accent text-ink' : 'bg-soft-2 text-muted'
                    }`}
                  >
                    {c.casinos_count}
                  </span>
                )}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
