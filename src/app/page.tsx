import type { Metadata } from 'next'
import Link from 'next/link'
import { getCategories, getCategory, getSpecialOffers } from '@/lib/api'
import { buildItemListSchema, buildWebPageSchema, jsonLdScript, buildFaqSchema } from '@/lib/seo'
import { COPY } from '@/constants/copy'
import { FAQ_ITEMS } from '@/constants/faq'
import CasinoCard from '@/components/CasinoCard'
import CategoryNav from '@/components/CategoryNav'
import SpecialOfferCard from '@/components/SpecialOfferCard'
import type { Category } from '@shared/types/category'
import type { CasinoWithAttachment } from '@shared/types/casino'
import type { SpecialOffer } from '@shared/types/specialOffer'
import { SITE_URL } from '@/lib/config'

/**
 * Grid placement for the FAQ cards. The grid is 2-up on tablets and 3-up on
 * desktop, and the number of questions is whatever the site's faq.ts holds, so
 * the LAST card stretches across whatever the final row leaves empty — five
 * questions fill a 3-column grid exactly instead of leaving a hole.
 */
function faqSpan(i: number): string {
  const last = i === FAQ_ITEMS.length - 1
  if (!last) return ''
  const sm = FAQ_ITEMS.length % 2 === 1 ? 'sm:col-span-2' : 'sm:col-span-1'
  const lg = { 0: 'lg:col-span-1', 1: 'lg:col-span-3', 2: 'lg:col-span-2' }[FAQ_ITEMS.length % 3] ?? ''
  return `${sm} ${lg}`
}

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? ''
const YEAR = new Date().getFullYear()

type Props = { searchParams: Promise<{ category?: string }> }

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
    openGraph: { type: 'website', url: '/', siteName: SITE_NAME, title, description },
    twitter: { card: 'summary_large_image', title, description },
  }
}

export default async function HomePage({ searchParams }: Props) {
  const { categories, selected } = await resolveCategory(searchParams)

  const [categoryRes, offersRes, anyOffersRes] = await Promise.allSettled([
    selected ? getCategory(selected) : Promise.resolve(null),
    getSpecialOffers(selected, 6),
    // Site-wide, unfiltered, limit 1 — just "does a visible offer exist at all?".
    // Runs alongside the others, so it costs no extra round-trip of latency, and
    // the public endpoint already excludes offers whose visibility is off.
    getSpecialOffers(undefined, 1),
  ])

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
        {/* Hero.

            Centred, opening on three slot reels showing 777 — the one piece of
            ornament this design allows itself, and the reason the brand is
            called what it is. Decorative, so it is hidden from assistive tech:
            the headline below says the same thing in words.

            The highlighted phrase sits on a LEMON PLATE rather than taking the
            brand colour, which is how the mockup does it: cobalt on white is
            the reading colour here, and tinting the headline would put two
            competing blues on the same line. */}
        <section className="hero-wash relative overflow-hidden">
          <div className="relative mx-auto flex max-w-[1220px] flex-col items-center px-5 pt-14 pb-20 text-center lg:px-10 lg:pt-20 lg:pb-28">
            <div className="flex gap-3 lg:gap-4" aria-hidden>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={`reel grid h-[84px] w-[64px] place-items-center lg:h-[118px] lg:w-[92px] ${
                    i === 1 ? 'bg-accent' : ''
                  }`}
                >
                  <span className={`font-display text-[44px] font-extrabold lg:text-[64px] ${i === 1 ? 'text-ink' : 'text-brand'}`}>
                    7
                  </span>
                </div>
              ))}
            </div>

            <h1 className="font-display mt-9 max-w-[980px] text-[34px] font-extrabold leading-[1.08] text-balance text-ink sm:text-[48px] lg:text-[64px]">
              {COPY.home.heroHeadline}{' '}
              <span className="inline-block rounded-xl bg-accent px-3">{COPY.home.heroHighlight}</span>{' '}
              needed to pick a casino.
            </h1>

            <p className="mt-6 max-w-[620px] text-pretty text-[17px] leading-relaxed text-muted lg:text-[19px]">
              {COPY.home.heroSubtitle}
            </p>

            <div className="mt-9 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <Link
                href="/casinos"
                className="inline-flex min-h-12 items-center justify-center rounded-[14px] bg-brand px-8 py-4 text-[16px] font-extrabold text-brand-ink shadow-[0_3px_0_var(--color-brand-dark)] transition-all hover:translate-y-px hover:shadow-[0_2px_0_var(--color-brand-dark)] focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-accent motion-reduce:transition-none motion-reduce:hover:translate-y-0"
              >
                {COPY.home.featuredCasinos}
              </Link>
              {anyOffersVisible && (
                <Link
                  href="/special-offers"
                  className="inline-flex min-h-12 items-center justify-center rounded-[14px] border-2 border-ink px-8 py-4 text-[16px] font-extrabold text-ink transition-colors hover:bg-ink hover:text-cream focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  {COPY.home.specialOffers}
                </Link>
              )}
            </div>

            {/* What the checks cover, in three words each. Wording only — no
                counts, no scores, nothing this site cannot show. */}
            <ul className="mt-10 flex flex-wrap justify-center gap-x-6 gap-y-2 text-[14px] font-semibold text-muted" role="list">
              {COPY.home.heroChecks.map((check) => (
                <li key={check} className="flex items-center gap-2">
                  <span className="h-2 w-2 shrink-0 rounded-full bg-brand" aria-hidden />
                  {check}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Casinos by category */}
        <section className="px-4 py-14" aria-labelledby="top-casinos-heading">
          <div className="container mx-auto max-w-6xl">
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 id="top-casinos-heading" className="font-display text-3xl font-semibold text-ink sm:text-4xl">{COPY.home.topCasinosTitle}</h2>
                <p className="mt-2 text-muted">{COPY.home.topCasinosSubtitle}</p>
              </div>
              {selected && (
                <Link href={`/categories/${selected}`} className="inline-block -mx-1 px-1 py-3 -my-3 text-sm font-bold text-brand hover:text-brand-dark whitespace-nowrap">{COPY.home.viewAll} →</Link>
              )}
            </div>

            {categories.length > 0 && selected && (
              <div className="mb-8"><CategoryNav categories={categories} selected={selected} basePath="/" /></div>
            )}

            {casinos.length === 0 ? (
              <p className="text-muted">{COPY.casinos.noResults}</p>
            ) : (
              <ol className="flex flex-col gap-5">
                {casinos.map((casino, i) => <CasinoCard key={casino.id} casino={casino} rank={i + 1} />)}
              </ol>
            )}

            {activeCategory && hasMoreCasinos && (
              <div className="mt-9 text-center">
                <Link href={`/categories/${selected}`} aria-label={`See all ${activeCategory.name} casinos`} className="inline-flex rounded-full border border-line-soft bg-paper px-7 py-3.5 text-sm font-semibold text-ink transition-colors hover:border-brand hover:text-brand">
                  See More →
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Special offers */}
        {topOffers.length > 0 && (
          <section className="border-t border-line px-4 py-16" aria-labelledby="offers-heading">
            <div className="container mx-auto max-w-6xl">
              <div className="mb-10 flex items-end justify-between gap-4">
                <h2 id="offers-heading" className="font-display text-3xl font-semibold text-ink sm:text-4xl">{COPY.home.specialOffers}</h2>
                <Link href="/special-offers" className="hidden py-3 -my-3 text-sm font-bold text-brand hover:text-brand-dark sm:block whitespace-nowrap">{COPY.home.viewAll} →</Link>
              </div>
              <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
                {topOffers.map((offer) => <SpecialOfferCard key={offer.id} offer={offer} />)}
              </div>

              <div className="mt-9 text-center">
                <Link href="/special-offers" aria-label="See all special offers" className="inline-flex rounded-full border border-line-soft bg-paper px-7 py-3.5 text-sm font-semibold text-ink transition-colors hover:border-brand hover:text-brand">
                  See More →
                </Link>
              </div>
            </div>
          </section>
        )}
        {/* FAQ — rendered visibly because FAQPage structured data requires it.
            Wider than the rest of the page (90rem, not the 6xl the listings
            use) and with roomier cards on desktop: a block of prose reads better with a
            longer measure than a list of casino cards does, and the old
            max-w-3xl column left a third of the screen empty on each side.
            Three-up card grid, two-up on tablets, one column on phones. */}
        <section className="border-t border-line px-4 py-16 sm:px-6 lg:px-8 lg:py-20" aria-labelledby="faq-heading">
          <div className="mx-auto max-w-[90rem]">
            <h2 id="faq-heading" className="font-display text-3xl font-semibold text-ink sm:text-4xl">{COPY.home.faqTitle}</h2>
            <dl className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-7">
              {FAQ_ITEMS.map((item, i) => (
                <div key={item.question} className={`${faqSpan(i)} rounded-2xl bg-paper p-6 lg:p-8 shadow-[0_10px_30px_rgba(28,36,48,0.07)]`}>
                  <dt className="font-bold text-ink text-base lg:text-lg">{item.question}</dt>
                  <dd className="mt-3 text-sm leading-relaxed text-muted lg:text-base">{item.answer}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      </main>
    </>
  )
}
