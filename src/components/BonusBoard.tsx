import Image from 'next/image'
import Link from 'next/link'
import { COPY } from '@/constants/copy'
import { resolveImageUrl } from '@/lib/images'
import { CLAIMABLE_BONUS_CATEGORY } from '@/components/SpecialOfferCard'
import type { BonusSection } from '@/lib/api'
import type { SpecialOffer } from '@shared/types/specialOffer'

/** Up to two initials, for a casino with no logo artwork. */
function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

/**
 * One offer as a row, from sites/luckysevenhub-redesign.html: the casino's
 * logo on white, whose offer it is, its name and amount, then the actions.
 *
 * Claim follows the same rule as SpecialOfferCard: it exists only on the
 * Special Offers type, and only when the offer has an affiliate link (the
 * link-less case falls back to Details, which reaches the same offer page).
 */
export function OfferRow({ offer, eyebrow, logo: logoOverride }: { offer: SpecialOffer; eyebrow?: string | null; logo?: string | null }) {
  const claimable = offer.bonus_category_slug === CLAIMABLE_BONUS_CATEGORY && !!offer.affiliate_url
  // A casino page passes its own logo: the offers it lists come without their
  // casino attached, and every one of them is that casino's.
  const logo = logoOverride ?? (offer.casino ? resolveImageUrl(offer.casino.image_path) : null)
  const label = eyebrow ?? offer.casino?.name ?? null

  return (
    <li className="grid grid-cols-[52px_minmax(0,1fr)] items-center gap-x-4 gap-y-3 rounded-[20px] border-2 border-line px-[18px] py-4 transition-[border-color,box-shadow] hover:border-brand hover:shadow-[0_5px_0_var(--color-brand-dark)] sm:grid-cols-[64px_minmax(0,1fr)_auto]">
      <span aria-hidden className="flex h-[52px] w-[52px] items-center justify-center overflow-hidden rounded-2xl border border-line bg-white p-1 text-sm font-extrabold text-ink sm:h-16 sm:w-16">
        {logo ? <Image src={logo} alt="" width={128} height={128} sizes="64px" className="h-auto max-h-full w-auto max-w-full object-contain" /> : initials(offer.casino?.name ?? offer.title)}
      </span>
      <span className="min-w-0">
        {label && <span className="block text-[13px] font-semibold text-faint">{label}</span>}
        <Link href={`/special-offers/${offer.slug}`} className="block py-0.5 font-bold text-ink hover:text-brand">{offer.title}</Link>
        {offer.bonuses && <span className="mt-0.5 block font-display text-base font-bold text-brand">{offer.bonuses}</span>}
      </span>
      <span className="col-span-2 flex gap-2 sm:col-span-1">
        <Link
          href={`/special-offers/${offer.slug}`}
          aria-label={`Details: ${offer.title}`}
          className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-accent px-4 text-sm font-bold text-ink transition-colors hover:bg-accent-dark sm:flex-none"
        >
          Details
        </Link>
        {claimable && (
          <a
            href={offer.affiliate_url!}
            target="_blank"
            rel="nofollow sponsored noopener"
            className="btn-blue inline-flex min-h-11 flex-1 items-center justify-center px-4 text-sm font-bold sm:flex-none"
          >
            Claim ↗
          </a>
        )}
      </span>
    </li>
  )
}

/**
 * The home page's Bonuses, from sites/luckysevenhub-redesign.html: the bonus
 * types down a side panel (one scrolling row below lg), the chosen type's
 * offers as rows beside it.
 *
 * CSS-only tabs — radio inputs, no client JavaScript — so EVERY type's offers
 * are in the server HTML, where crawlers read them; only the checked panel is
 * displayed. The rules tying each radio to its panel and its label are
 * generated, because the number of types comes from the admin. Each panel
 * keeps the `#bonus-<slug>` anchor every site's home page exposes.
 */
export default function BonusBoard({ sections }: { sections: BonusSection[] }) {
  if (sections.length === 0) return null

  const rules = sections
    .map((_, i) => `.ls-bonus:has(#bb-${i}:checked) [data-bb="${i}"]{display:flex}`)
    .join('')

  return (
    <div className="ls-bonus mt-[26px] grid grid-cols-1 items-start gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
      <style>{rules}</style>
      <fieldset className="min-w-0 lg:sticky lg:top-24">
        <legend className="sr-only">Bonus types</legend>
        <div className="no-scrollbar flex gap-1.5 overflow-x-auto rounded-[22px] bg-soft p-2.5 lg:flex-col">
          {sections.map((section, i) => (
            <span key={section.id} className="relative shrink-0">
              <input type="radio" name="bonus-board" id={`bb-${i}`} defaultChecked={i === 0} className="peer sr-only" />
              <label
                htmlFor={`bb-${i}`}
                className="flex min-h-12 cursor-pointer items-center justify-between gap-2.5 whitespace-nowrap rounded-[14px] px-3.5 text-[15px] font-bold text-muted transition-colors hover:text-ink peer-checked:bg-white peer-checked:text-ink peer-checked:shadow-[0_2px_0_var(--color-line-soft)] peer-focus-visible:outline-3 peer-focus-visible:outline-accent peer-checked:[&>span]:bg-accent peer-checked:[&>span]:text-ink"
              >
                {section.name}
                <span className="rounded-full bg-white px-2 py-0.5 text-xs text-faint">{section.offers_count}</span>
              </label>
            </span>
          ))}
        </div>
      </fieldset>

      <div className="min-w-0">
        {sections.map((section, i) => (
          <div key={section.id} id={`bonus-${section.slug}`} data-bb={i} className="hidden scroll-mt-24 flex-col gap-3">
            <h3 className="sr-only">{section.name}</h3>
            {section.description && <p className="text-sm text-faint">{section.description}</p>}
            <ul role="list" className="flex flex-col gap-3">
              {section.offers.map((offer) => <OfferRow key={offer.id} offer={offer} />)}
            </ul>
            <Link
              href={`/bonuses/${section.slug}`}
              aria-label={`${COPY.home.seeMore} — ${section.name}`}
              className="btn-white mt-1.5 inline-flex min-h-12 items-center self-start px-[22px] text-[15px] font-bold"
            >
              {COPY.home.seeMore} →
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}
