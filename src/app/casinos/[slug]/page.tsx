import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound, permanentRedirect } from 'next/navigation'
import { getCasinos, getCasino } from '@/lib/api'
import { buildCasinoReviewSchema, buildBreadcrumbSchema, buildWebPageSchema, breadcrumbIdFor, jsonLdScript, SHARE_IMAGES } from '@/lib/seo'
import { resolveImageUrl } from '@/lib/images'
import CasinoSpecialOffers from '@/components/CasinoSpecialOffers'
import CasinoReviews from '@/components/CasinoReviews'
import CasinoCard, { LogoTile, Stars } from '@/components/CasinoCard'
import { COPY } from '@/constants/copy'
import { SITE_URL } from '@/lib/config'

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? ''

/** `sizes` for the page-wide banner: the 90rem container less its 16 / 24 / 32px gutters, as on winpalack. */
const BANNER_SIZES =
  '(min-width: 1504px) 1440px, (min-width: 1024px) calc(100vw - 4rem), (min-width: 640px) calc(100vw - 3rem), calc(100vw - 2rem)'

type Props = { params: Promise<{ slug: string }> }


/*
 * NO generateStaticParams, deliberately — this route renders on demand.
 *
 * Next classifies a dynamic route from what that function RETURNS: a non-empty
 * list builds `f` (dynamic), an EMPTY list builds a fully static route. A
 * static render then throws DYNAMIC_SERVER_USAGE, because the root layout
 * reads the session cookie for the header's account control and a static
 * render may not touch cookies — taking the whole route down with a 500 for
 * every slug, valid or not.
 *
 * Not hypothetical: that is exactly how /special-offers/[slug] broke on the
 * one site with no visible offers. It was reachable here too, because the
 * params lookup failed CLOSED to an empty list, so one API blip was enough to
 * change the build shape.
 *
 * Removing the function pins the route dynamic whatever the data does.
 * `force-dynamic` is deliberately NOT used: it would also downgrade fetchCache
 * to no-store and send every request to the API, where this leaves the
 * existing per-fetch cache and its tags exactly as they were.
 */

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  try {
    const { data: casino } = await getCasino(slug)
    const title = casino.meta_title ?? `${casino.name} Review`
    // A casino record is shared by every site, so the fallback must carry THIS
    // site's voice — otherwise all four domains ship the same description for
    // the same casino. An admin-set meta_description still wins, and is shared
    // by design; per-site overrides would need columns on the casino_site pivot.
    // An admin-entered meta_description is shared master data, so this site's
    // short signature is appended rather than the value being used verbatim —
    // otherwise filling the field in the admin would put the identical
    // description back on all four domains. No value set: fall back to the
    // site's own full line.
    const description = casino.meta_description
      ? `${casino.meta_description} ${COPY.casinos.reviewSignature}`
      : `${casino.name} — ${COPY.casinos.reviewSummary}`
    // The `title` above is the casino's own meta_title — shared master data, so
    // it is byte-identical on every domain in the network. The share card is
    // where that was most visible: six results, one headline. This site's tail
    // makes the card its own without touching the shared record.
    const shareTitle = `${title} — ${COPY.casinos.reviewTitleTail}`
    return {
      title,
      description,
      alternates: { canonical: `/casinos/${slug}` },
      openGraph: { type: 'article', url: `/casinos/${slug}`, siteName: SITE_NAME, title: shareTitle, description, images: SHARE_IMAGES },
      twitter: { card: 'summary_large_image', title: shareTitle, description, images: SHARE_IMAGES },
    }
  } catch {
    return { title: COPY.errors.notFound }
  }
}

/**
 * Resolve a TRUNCATED slug to the real one, or return null.
 *
 * Search Console reported `/casinos/7` as a 404. There is no casino "7" and
 * there never was: slugs come from the operator name via spatie/sluggable, and
 * not one of them is numeric. What does exist is `7-bit-casino` — and cutting
 * that at its first hyphen gives exactly the URL that was crawled. Email
 * clients, chat apps and some link parsers end a URL at punctuation, so a
 * hyphenated slug is the one shape that reliably arrives truncated.
 *
 * A PREFIX, and only up to the hyphen. `startsWith(fragment + '-')` means the
 * fragment has to end where a slug segment ends, so `/casinos/7` can reach
 * `7-bit-casino` but `/casinos/bit` cannot reach `bitstarz` — that would be
 * guessing at a substring rather than restoring a cut.
 *
 * EXACTLY ONE MATCH, or nothing. With `7-bit-casino` and a hypothetical
 * `7-bit-casino-vip` both present, `/casinos/7` is genuinely ambiguous and a
 * redirect would be picking one on the visitor's behalf. Ambiguity falls
 * through to the 404, which is the honest answer.
 *
 * Costs nothing on the happy path: it is only reached when `getCasino()` has
 * already failed, and `getCasinos()` is the same cached, `casinos`-tagged fetch
 * the listing and the sitemap use.
 */
async function resolveTruncatedSlug(fragment: string): Promise<string | null> {
  // A fragment that already contains a hyphen is not a cut at a segment
  // boundary — it is just a wrong slug. Bail before spending the fetch.
  if (fragment === '' || fragment.includes('-')) return null

  try {
    const { data: casinos } = await getCasinos()
    const matches = casinos.filter((c) => c.slug.startsWith(`${fragment}-`))

    return matches.length === 1 ? matches[0].slug : null
  } catch {
    // The list being unreachable must not turn a 404 into a 500.
    return null
  }
}

export default async function CasinoDetailPage({ params }: Props) {
  const { slug } = await params

  let casino
  try {
    casino = (await getCasino(slug)).data
  } catch {
    /*
     * Before 404ing, try the one recoverable case: a slug truncated at a
     * hyphen. `permanentRedirect` is a 308, not a 301 — the App Router cannot
     * set an arbitrary status from a page, and 308 is the permanent redirect
     * that preserves the method. Google treats the two identically for
     * canonicalisation, so the signal is the same one a 301 would send.
     */
    const real = await resolveTruncatedSlug(slug)

    if (real !== null) permanentRedirect(`/casinos/${real}`)

    notFound()
  }

  const banner = resolveImageUrl(casino.banner_image)
  const pageUrl = `${SITE_URL}/casinos/${slug}`
  // Facts for the summary panel below the CTA.
  const categoryNames = (casino.categories ?? []).map((c) => c.name)
  const liveOffers = (casino.special_offers ?? []).length
  // "More top-rated casinos": the next four in this site's list. The same
  // cached, `casinos`-tagged fetch the listing uses; unreachable, the section
  // is simply left out.
  const others = await getCasinos()
    .then(({ data }) => data.filter((c) => c.slug !== casino.slug).slice(0, 4))
    .catch(() => [])
  const reviewSchema = buildCasinoReviewSchema(casino)
  const breadcrumb = buildBreadcrumbSchema(
    [
      { name: 'Home', url: SITE_URL },
      { name: 'Casinos', url: `${SITE_URL}/casinos` },
      { name: casino.name, url: pageUrl },
    ],
    pageUrl,
  )
  // One graph per page: the WebPage node anchors this URL into the site graph
  // and points at its own breadcrumb, so the review and the trail are read as
  // parts of one page rather than three unrelated blocks.
  const graph = [
    buildWebPageSchema({
      name: `${casino.name} Review`,
      url: pageUrl,
      // Same composition as the <meta> description in generateMetadata. Passing
      // the raw shared `meta_description` here put an identical WebPage
      // description on all six domains for the same casino.
      description: casino.meta_description
        ? `${casino.meta_description} ${COPY.casinos.reviewSignature}`
        : `${casino.name} — ${COPY.casinos.reviewSummary}`,
      breadcrumbId: breadcrumbIdFor(pageUrl),
      dateModified: casino.updated_at,
    }),
    breadcrumb,
    reviewSchema,
  ]

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(graph) }} />

      {/* winpalack's detail-page measure — 90rem of content inside 16 / 24 / 32px
          gutters (94rem = 90rem + the 2rem desktop gutter on each side), so the
          banner box is the same size on both sites; the sections below share it. */}
      <main className="mx-auto max-w-[94rem] px-4 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="flex flex-wrap gap-2 pt-[22px] text-[13px] text-faint">
          <Link href="/" className="-my-3 inline-block py-3 hover:text-brand">Home</Link>/<Link href="/casinos" className="-my-3 inline-block py-3 hover:text-brand">Casinos</Link>/<b className="font-semibold text-ink">{casino.name}</b>
        </nav>

        {/* The banner, laid out as on winpalack: the artwork whole (object-contain)
            in a 16:5 frame straight under the breadcrumb, and nothing at all for
            a casino without artwork. `preload` + `fetchPriority`, not `priority`: in
            Next 16 `priority` emits the preload at the browser's default Low
            priority, and this image is the mobile LCP. */}
        {banner && (
          <div className="relative mt-6 aspect-[16/5] overflow-hidden rounded-2xl bg-soft">
            <Image src={banner} alt={`${casino.name} banner`} fill className="object-contain object-center" sizes={BANNER_SIZES} preload fetchPriority="high" />
          </div>
        )}

        {/* The ID card: logo, name, score, offer, and the CTA at the end of the
            row from lg (under the rest below it). */}
        <div className="mt-3.5 grid grid-cols-[88px_minmax(0,1fr)] items-center gap-x-5 gap-y-4 rounded-[26px] border-2 border-brand p-5 shadow-[0_6px_0_var(--color-brand-dark)] sm:grid-cols-[150px_minmax(0,1fr)] sm:p-[22px] lg:grid-cols-[180px_minmax(0,1fr)_auto]">
          <LogoTile casino={casino} className="h-[88px] w-[88px] rounded-[18px] sm:h-[110px] sm:w-[150px] lg:w-[180px]" sizes="180px" />
          <div className="flex min-w-0 flex-col gap-2">
            <h1 className="font-display text-[26px] font-bold leading-tight text-ink sm:text-[32px]">{casino.name}</h1>
            <p className="flex items-center gap-2 text-sm font-semibold text-muted">
              <Stars rating={casino.rating} />
              {casino.rating.toFixed(1)}
            </p>
            {casino.bonuses && <p className="font-display text-lg font-bold text-brand">{casino.bonuses}</p>}
          </div>
          <a href={casino.attachment.affiliate_url} target="_blank" rel="nofollow sponsored noopener" className="btn-blue col-span-2 inline-flex min-h-12 items-center justify-center whitespace-nowrap px-8 text-[15px] font-bold lg:col-span-1">
            {COPY.casinos.visitCasino}
          </a>
        </div>

        {/*
          The facts an answer engine has to dig out of the prose otherwise: the
          score, how many offers are live and where the operator sits in the
          catalogue. Every value is read from the record, and the same figures
          appear in the Review and WebPage nodes above, so markup and visible
          text cannot disagree.
        */}
        <section className="mt-10" aria-labelledby="at-a-glance">
          <h2 id="at-a-glance" className="font-display text-[24px] font-bold text-ink sm:text-[28px]">
            {casino.name} {COPY.casinos.glanceHeadingTail}
          </h2>
          <dl className="mt-3.5 grid grid-cols-1 gap-3.5 sm:grid-cols-3">
            <div className="rounded-[22px] bg-soft p-5">
              <dt className="text-xs font-extrabold tracking-[0.1em] text-faint">SCORE</dt>
              <dd className="mt-1.5 font-display text-xl font-bold text-ink">{casino.rating} out of 5</dd>
            </div>
            <div className="rounded-[22px] bg-soft p-5">
              <dt className="text-xs font-extrabold tracking-[0.1em] text-faint">OFFERS LISTED</dt>
              <dd className="mt-1.5 font-display text-xl font-bold text-ink">{liveOffers} {liveOffers === 1 ? 'offer' : 'offers'} on this page</dd>
            </div>
            <div className="rounded-[22px] bg-soft p-5">
              <dt className="text-xs font-extrabold tracking-[0.1em] text-faint">LISTED UNDER</dt>
              <dd className="mt-1.5 font-display text-xl font-bold text-ink">{categoryNames.length} {categoryNames.length === 1 ? 'category' : 'categories'}</dd>
            </div>
          </dl>
        </section>

        <div className="mt-11 flex flex-wrap items-start gap-9">
          <div className="min-w-0 flex-[2_1_520px]">
            {casino.description && (
              <>
                <h2 className="mb-4 font-display text-[24px] font-bold text-ink sm:text-[28px]">Full review</h2>
                <div className="prose max-w-[68ch] prose-p:text-[17px] prose-p:leading-[1.8] prose-p:text-muted prose-headings:text-ink prose-a:text-brand" dangerouslySetInnerHTML={{ __html: casino.description }} />
              </>
            )}

            {casino.categories && casino.categories.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {casino.categories.map((c) => (
                  <Link key={c.id} href={`/categories/${c.slug}`} className="inline-flex min-h-11 items-center rounded-xl bg-soft px-3.5 text-sm font-semibold text-ink transition-colors hover:bg-accent">{c.name}</Link>
                ))}
              </div>
            )}

            <CasinoSpecialOffers offers={casino.special_offers ?? []} logo={resolveImageUrl(casino.image_path)} />

            {/* Renders nothing at all until this site's "Visitor reviews"
                switch is on in the admin — the component gates itself on the
                endpoint's 404, so no per-site conditional is needed here. */}
            <CasinoReviews casinoSlug={casino.slug} casinoName={casino.name} />
          </div>

          {/* Quick facts: the record's own figures beside the review, sticky
              from lg. */}
          <aside aria-labelledby="quick-facts" className="min-w-0 flex-[1_1_300px] rounded-[24px] border-2 border-line p-5 lg:sticky lg:top-24">
            <h2 id="quick-facts" className="font-display text-lg font-bold text-ink">Quick facts</h2>
            <dl className="mt-3">
              <div className="flex items-center justify-between gap-2.5 border-b border-line py-2.5 text-[15px] font-semibold last:border-b-0">
                <dt className="text-muted">Score</dt>
                <dd className="rounded-full bg-win-bg px-2.5 py-0.5 text-xs font-extrabold text-win">{casino.rating} / 5</dd>
              </div>
              {casino.bonuses && (
                <div className="flex items-center justify-between gap-2.5 border-b border-line py-2.5 text-[15px] font-semibold last:border-b-0">
                  <dt className="text-muted">Welcome offer</dt>
                  <dd className="text-right text-brand">{casino.bonuses}</dd>
                </div>
              )}
              <div className="flex items-center justify-between gap-2.5 border-b border-line py-2.5 text-[15px] font-semibold last:border-b-0">
                <dt className="text-muted">Offers listed</dt>
                <dd>{liveOffers}</dd>
              </div>
              <div className="flex items-center justify-between gap-2.5 border-b border-line py-2.5 text-[15px] font-semibold last:border-b-0">
                <dt className="text-muted">Listed under</dt>
                <dd>{categoryNames.length} {categoryNames.length === 1 ? 'category' : 'categories'}</dd>
              </div>
            </dl>
            <a href={casino.attachment.affiliate_url} target="_blank" rel="nofollow sponsored noopener" className="btn-blue mt-3.5 flex min-h-12 w-full items-center justify-center px-6 text-[15px] font-bold">
              {COPY.casinos.visitCasino}
            </a>
          </aside>
        </div>

        {others.length > 0 && (
          <section className="mt-14" aria-labelledby="other-casinos">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 id="other-casinos" className="font-display text-[24px] font-bold text-ink sm:text-[30px]">More top-rated casinos</h2>
              <Link href="/casinos" className="inline-flex min-h-11 items-center font-bold text-brand hover:text-brand-dark">See all →</Link>
            </div>
            <ol className="mt-5 grid grid-cols-1 gap-3.5 min-[360px]:grid-cols-2 md:grid-cols-4">
              {others.map((c) => <CasinoCard key={c.id} casino={c} />)}
            </ol>
          </section>
        )}
      </main>
    </>
  )
}
