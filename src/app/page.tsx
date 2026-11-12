import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getBonusArea, getCategories, getCategory, getSpecialOffers } from '@/lib/api'
import type { BonusSection } from '@/lib/api'
import { buildItemListSchema, buildWebPageSchema, jsonLdScript, buildFaqSchema, SHARE_IMAGES } from '@/lib/seo'
import { COPY } from '@/constants/copy'
import { FAQ_ITEMS } from '@/constants/faq'
import CasinoCard, { CASINO_GRID } from '@/components/CasinoCard'
import BonusCategoryNav from '@/components/BonusCategoryNav'
import BonusBoard from '@/components/BonusBoard'
import CategoryNav from '@/components/CategoryNav'
import FaqBoard from '@/components/FaqBoard'
import SpecialOfferCard from '@/components/SpecialOfferCard'
import type { Category } from '@shared/types/category'
import type { CasinoWithAttachment } from '@shared/types/casino'
import type { SpecialOffer } from '@shared/types/specialOffer'
import { SITE_URL } from '@/lib/config'
import { casinosHeading } from '@/lib/categories'

/** Offers shown per bonus type in the home page's Bonuses section — one row. */
const HOME_BONUSES_PER_CATEGORY = 3

/**
 * The seven checks, in the order the site always states them (COPY.site and
 * the first FAQ answer name the same seven). The hero's blue tile lists them.
 */
const SEVEN_CHECKS = ['Licence', 'Payouts', 'Bonus terms', 'Game fairness', 'Support', 'Deposit & loss limits', 'Safer-play tools'] as const

/** Icons and tints for the hero's three small tiles, in COPY.home.heroChecks order. */
const CHECK_TILES = [
  { tint: 'bg-brand-soft text-brand', path: 'M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z M9 12l2 2 4-4' },
  { tint: 'bg-surface text-[#9a7300]', path: 'M12 5a8 8 0 1 0 0 16 8 8 0 0 0 0-16z M12 9v4l2.5 2 M10 2h4' },
  { tint: 'bg-win-bg text-win', path: 'M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z M14 3v6h6 M8 13h8 M8 17h5' },
] as const

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? ''
const YEAR = new Date().getFullYear()

type Props = { searchParams: Promise<{ category?: string; page?: string }> }

// Resolve the selected category (default = first/highest-priority) for the home casinos section.
async function resolveCategory(searchParams: Props['searchParams']) {
  const sp = await searchParams
  const categories = (await getCategories()).data
  const selected =
    sp.category && categories.some((c) => c.slug === sp.category) ? sp.category : categories[0]?.slug
  return { categories: categories as Category[], selected }
}

export async function generateMetadata(): Promise<Metadata> {
  const title = `${COPY.home.homeTitle} ${YEAR} | ${SITE_NAME}`
  const description = COPY.home.metaDescription
  return {
    title,
    description,
    alternates: { canonical: '/' },
    openGraph: { type: 'website', url: '/', siteName: SITE_NAME, title, description, images: SHARE_IMAGES },
    twitter: { card: 'summary_large_image', title, description, images: SHARE_IMAGES },
  }
}

export default async function HomePage({ searchParams }: Props) {
  /*
   * THE HOME PAGE HAS ONE PAGE, so `?page=2` is a page past the end.
   *
   * Nothing here is paginated (the full list is /casinos), yet `/?page=2` and
   * every other number a crawler guessed answered 200 with the whole home page
   * and an `index` robots tag: a duplicate of `/` at a URL of its own. A 404
   * says it is not a page at all, the rule every paginated listing here applies
   * past its last page. `?page=1` never reaches this: proxy.ts 301s it to `/`.
   */
  if (Math.max(1, Number((await searchParams).page) || 1) > 1) notFound()

  const { categories, selected } = await resolveCategory(searchParams)

  const [categoryRes, offersRes, anyOffersRes, bonusRes] = await Promise.allSettled([
    selected ? getCategory(selected) : Promise.resolve(null),
    getSpecialOffers(selected, 6),
    // Site-wide, unfiltered, limit 1 — just "does a visible offer exist at all?".
    // Runs alongside the others, so it costs no extra round-trip of latency, and
    // the public endpoint already excludes offers whose visibility is off.
    getSpecialOffers(undefined, 1),
    // The bonus TYPES: the chip row under the hero AND the per-type Bonuses
    // section further down, so each type brings its first
    // HOME_BONUSES_PER_CATEGORY offers (one full row of the three-up grid).
    // The chips only read names, marks and counts, which the server counts
    // over the unlimited set. allSettled means a site without the Bonus area
    // renders neither, and falls back to the plain Special offers grid.
    getBonusArea(HOME_BONUSES_PER_CATEGORY),
  ])

  // Empty when the site does not publish the Bonus area, or when the
  // request failed — the strip renders nothing either way.
  const bonusSections: BonusSection[] = bonusRes.status === 'fulfilled' ? bonusRes.value : []

  const catData =
    categoryRes.status === 'fulfilled' && categoryRes.value ? categoryRes.value.data : null
  const casinos: CasinoWithAttachment[] = catData?.casinos ?? []
  const activeCategory = catData?.category ?? null
  // "See More" is only an affordance when there is actually more: compare the
  // category's full count against the rows this page received, rather than
  // hard-coding the page size on both sides where the two could drift apart.
  const hasMoreCasinos = (catData?.meta?.total ?? 0) > casinos.length
  // Offers are already scoped to the selected category and capped by the backend (?category=&limit=).
  const topOffers: SpecialOffer[] = offersRes.status === 'fulfilled' ? offersRes.value.data : []

  // Whether ANY special offer is visible on this site. Drives the hero CTA:
  // a button leading to an empty page is worse than no button. On a failed
  // request this stays false, so the CTA hides rather than promising content
  // that may not be there.
  const anyOffersVisible: boolean =
    anyOffersRes.status === 'fulfilled' && anyOffersRes.value.data.length > 0

  // Organization schema is emitted site-wide from the root layout; the home
  // page only adds its page-specific ItemList of top casinos.
  //
  // The list is the SELECTED category, not the whole catalogue, so it is named
  // and addressed as that category — it previously claimed the generic name
  // "Top Casinos at <brand>" and pointed at /casinos, describing neither the
  // rows below it nor a URL that renders them.
  const listSchema = buildItemListSchema(
    activeCategory ? `${activeCategory.name} — ${COPY.home.topCasinosTitle}` : COPY.home.topCasinosTitle,
    selected ? `${SITE_URL}/categories/${selected}` : `${SITE_URL}/casinos`,
    casinos.map((c, i) => ({ position: i + 1, name: c.name, url: `${SITE_URL}/casinos/${c.slug}` })),
  )

  const graph = [
    buildWebPageSchema({
      // Mirrors the actual <title>. The previous "Best Online Casinos <year>"
      // was generic boilerplate shipped identically by the sibling domains and
      // matched neither this page's title nor its H1.
      name: `${COPY.home.homeTitle} ${YEAR}`,
      url: SITE_URL,
      description: COPY.home.metaDescription,
    }),
    listSchema,
    // Same array the section below renders — markup-only FAQ is a violation.
    buildFaqSchema(SITE_URL, FAQ_ITEMS),
  ]

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(graph) }} />

      <main>
        {/* Hero: a bento board — the claim, the seven checks, and three of them
            called out. */}
        <section className="mx-auto max-w-[1200px] px-4 pb-14 pt-10">
          <div className="grid grid-cols-12 gap-3.5">
            <div className="relative col-span-12 flex flex-col overflow-hidden rounded-[26px] bg-soft p-7 sm:min-h-[420px] lg:col-span-8 lg:row-span-2">
              {/* In the flow, not absolute: `mb-auto` keeps them at the top and
                  the text at the bottom, and they can never overlap the headline
                  however many lines it wraps to. */}
              <div aria-hidden className="mb-auto flex gap-2 pb-8">
                <div className="reel"><span>7</span></div>
                <div className="reel"><span>7</span></div>
                <div className="reel"><span>7</span></div>
              </div>
              <h1 className="font-display text-[34px] font-extrabold leading-[1.04] text-ink sm:text-[clamp(34px,4.6vw,60px)]">
                {COPY.home.heroHeadline}{' '}
                <span className="hl">{COPY.home.heroHighlight}</span>{' '}
                needed to pick a casino.
              </h1>
              <p className="mt-[18px] max-w-[560px] text-[17px] text-muted">{COPY.home.heroSubtitle}</p>
              <div className="mt-[26px] flex flex-wrap gap-3">
                <Link href="/casinos" className="btn-blue inline-flex min-h-12 items-center justify-center whitespace-nowrap px-[22px] text-[15px] font-bold">
                  {COPY.home.featuredCasinos}
                </Link>
                {/* Only when a visible offer exists: a button to an empty page
                    is worse than no button. */}
                {anyOffersVisible && (
                  <Link href="/special-offers" className="btn-white inline-flex min-h-12 items-center justify-center whitespace-nowrap px-[22px] text-[15px] font-bold">
                    {COPY.home.specialOffers}
                  </Link>
                )}
              </div>
            </div>

            <aside aria-labelledby="seven-checks" className="col-span-12 flex flex-col rounded-[26px] bg-brand p-7 text-white lg:col-span-4 lg:row-span-2">
              <h2 id="seven-checks" className="font-display text-[22px] font-bold text-white">The seven checks</h2>
              <ol className="mt-[18px] flex flex-col gap-2">
                {SEVEN_CHECKS.map((check, i) => (
                  <li key={check} className="flex items-center gap-3 rounded-xl bg-white/10 px-3 py-[9px] text-[15px] font-semibold">
                    <span aria-hidden className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-accent font-display text-[13px] font-extrabold text-ink">{i + 1}</span>
                    {check}
                  </li>
                ))}
              </ol>
              <p className="mt-auto pt-4 text-sm text-[#d6dcff]">Same seven, same order, for every casino.</p>
            </aside>

            {COPY.home.heroChecks.map((check, i) => (
              <div key={check} className={`flex items-center gap-3.5 rounded-[26px] border-2 border-brand bg-white px-[22px] py-5 shadow-[0_5px_0_var(--color-brand-dark)] ${i === COPY.home.heroChecks.length - 1 ? 'col-span-12 lg:col-span-4' : 'col-span-12 sm:col-span-6 lg:col-span-4'}`}>
                <span aria-hidden className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${CHECK_TILES[i % CHECK_TILES.length].tint}`}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d={CHECK_TILES[i % CHECK_TILES.length].path} /></svg>
                </span>
                <b className="font-display text-base font-bold text-ink">{check}</b>
              </div>
            ))}
          </div>
        </section>

        {/* Top-rated casinos */}
        <section className="pb-[72px] pt-6" aria-labelledby="top-casinos-heading">
          <div className="mx-auto max-w-[1200px] px-4">
            <h2 id="top-casinos-heading" className="font-display text-[28px] font-bold leading-[1.08] text-ink sm:text-[clamp(28px,3.6vw,44px)]">{COPY.home.topCasinosTitle}</h2>
            <p className="mt-2.5 text-muted">{COPY.home.topCasinosSubtitle}</p>

            {categories.length > 0 && selected && (
              <div className="mt-6"><CategoryNav categories={categories} selected={selected} /></div>
            )}

            {casinos.length === 0 ? (
              <p className="mt-6 text-muted">{COPY.casinos.noResults}</p>
            ) : (
              <ol className={`mt-[22px] ${CASINO_GRID}`}>
                {casinos.map((casino, i) => <CasinoCard key={casino.id} casino={casino} rank={i + 1} />)}
              </ol>
            )}

            {activeCategory && hasMoreCasinos && (
              <div className="mt-[26px] flex justify-center">
                <Link href={`/categories/${selected}`} aria-label={`See more casinos — ${casinosHeading(activeCategory.name)}`} className="btn-white inline-flex min-h-12 items-center px-[22px] text-[15px] font-bold">
                  See more casinos →
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Bonus types — renders nothing when the site does not publish the
            Bonus area, so the band collapses rather than leaving a gap. */}
        {bonusSections.length > 0 && (
          <section className="pb-[72px]">
            <div className="mx-auto max-w-[1200px] px-4">
              <BonusCategoryNav sections={bonusSections} />
            </div>
          </section>
        )}

        {/* Bonuses — the types down a side panel, built from the same
            getBonusArea payload as the board above and the header/footer menus.
            A site without the Bonus area keeps the flat offers grid instead. */}
        {bonusSections.length > 0 ? (
          <section className="pb-[72px]" aria-labelledby="bonus-heading">
            <div className="mx-auto max-w-[1200px] px-4">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <h2 id="bonus-heading" className="font-display text-[28px] font-bold leading-[1.08] text-ink sm:text-[clamp(28px,3.6vw,44px)]">{COPY.home.bonus}</h2>
                <Link href="/special-offers" aria-label={`${COPY.home.viewAll} bonuses`} className="inline-flex min-h-11 items-center font-bold text-brand hover:text-brand-dark">{COPY.home.viewAll} →</Link>
              </div>
              <BonusBoard sections={bonusSections} />
            </div>
          </section>
        ) : topOffers.length > 0 && (
          <section className="pb-[72px]" aria-labelledby="offers-heading">
            <div className="mx-auto max-w-[1200px] px-4">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <h2 id="offers-heading" className="font-display text-[28px] font-bold leading-[1.08] text-ink sm:text-[clamp(28px,3.6vw,44px)]">{COPY.home.specialOffers}</h2>
                <Link href="/special-offers" aria-label={`${COPY.home.viewAll} offers`} className="inline-flex min-h-11 items-center font-bold text-brand hover:text-brand-dark">{COPY.home.viewAll} →</Link>
              </div>
              <div className="mt-[26px] grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {topOffers.map((offer) => <SpecialOfferCard key={offer.id} offer={offer} />)}
              </div>
            </div>
          </section>
        )}

        {/* FAQ — rendered visibly because FAQPage structured data requires it,
            from the same FAQ_ITEMS array the schema is built from. */}
        <section aria-labelledby="faq-heading">
          <div className="mx-auto max-w-[1200px] px-4">
            <h2 id="faq-heading" className="font-display text-[28px] font-bold leading-[1.08] text-ink sm:text-[clamp(28px,3.6vw,44px)]">{COPY.home.faqTitle}</h2>
            <FaqBoard items={FAQ_ITEMS} />
          </div>
        </section>
      </main>
    </>
  )
}
