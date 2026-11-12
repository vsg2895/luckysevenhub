import Link from 'next/link'
import { COPY } from '@/constants/copy'
import type { BonusSection } from '@/lib/api'

/**
 * The catch-all heading, which this board deliberately leaves out.
 *
 * Every offer not filed under a real type lands under "Special Offers", so it
 * is not a type at all — it is the whole area, already reachable from the nav
 * and the offers page. Hidden here rather than in the admin: the admin's
 * "Shown" switch would also remove it from the menu and the sections.
 */
const CATCH_ALL_SLUG = 'special-offers'

/** Tile colours in the mockup's order; the board cycles through them. */
const TILE_COLOURS = [
  'bg-brand text-white',
  'bg-accent text-ink',
  'bg-soft text-ink',
  'bg-ink text-white',
  'bg-brand-soft text-ink',
  'bg-soft text-ink',
] as const

/**
 * Column span on the 6-column desktop board. The first two tiles share the top
 * row (3 + 3); the rest go three to a row (2 each), and a short last row
 * stretches to fill it — 2 + 2 + 2, then 3 + 3 or a single 6 — so the board
 * never ends on a gap, however many types the site lists.
 */
function spanClass(index: number, count: number): string {
  if (index < 2) return count === 1 ? 'lg:col-span-6' : 'lg:col-span-3'

  const rest = count - 2
  const tailStart = 2 + rest - (rest % 3)

  if (index < tailStart || rest % 3 === 0) return 'lg:col-span-2'

  return rest % 3 === 2 ? 'lg:col-span-3' : 'lg:col-span-6'
}

/**
 * "Bonus Types We List", from sites/luckysevenhub-redesign.html: a bento board
 * of coloured tiles, each a bonus type with its count set large in Unbounded —
 * beside the name from sm, above it on a phone, where a two-up tile is too
 * narrow for both on one line.
 * Each tile opens that type's own page.
 *
 * The counts are the SITE's — active, claimable, owned by a casino attached
 * here — resolved server-side, so a tile never promises more than its page has.
 * Renders nothing when the site has no Bonus area or every type is empty.
 */
export default function BonusCategoryNav({ sections }: { sections: BonusSection[] }) {
  const types = sections.filter((section) => section.slug !== CATCH_ALL_SLUG)
  if (types.length === 0) return null

  return (
    <nav aria-labelledby="bonus-types-heading">
      <h2 id="bonus-types-heading" className="font-display text-[28px] font-bold leading-[1.08] text-ink sm:text-[clamp(28px,3.6vw,44px)]">
        {COPY.home.bonusTypesTitle}
      </h2>
      <ul className="mt-[26px] grid grid-cols-2 gap-3.5 lg:grid-cols-6" role="list">
        {types.map((section, i) => (
          <li key={section.id} className={spanClass(i, types.length)}>
            <Link
              href={`/bonuses/${section.slug}`}
              className={`flex h-full min-h-[120px] flex-col-reverse items-start justify-between gap-2 rounded-[22px] p-[18px] transition-transform hover:-translate-y-[3px] sm:flex-row sm:items-end sm:gap-3 sm:p-[22px] lg:min-h-[150px] ${TILE_COLOURS[i % TILE_COLOURS.length]}`}
            >
              <span className="min-w-0 font-display text-[15px] font-bold leading-[1.2] [overflow-wrap:anywhere] sm:text-base lg:text-lg">{section.name}</span>
              <span className="shrink-0 font-display text-[40px] font-extrabold leading-[0.9] lg:text-[56px]">
                {section.offers_count}
                <span className="sr-only"> {section.offers_count === 1 ? COPY.bonusCategory.countOne : COPY.bonusCategory.countMany}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
