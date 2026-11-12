import type { Metadata } from 'next'
import { getSpecialOffers } from '@/lib/api'
import { buildWebPageSchema, jsonLdScript, SHARE_IMAGES } from '@/lib/seo'
import { COPY } from '@/constants/copy'
import SpecialOfferCard from '@/components/SpecialOfferCard'
import { SITE_URL } from '@/lib/config'

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? ''

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: COPY.specialOffers.pageTitle,
    description: COPY.specialOffers.pageDescription,
    alternates: { canonical: `/special-offers` },
    openGraph: { type: 'website', url: `/special-offers`, siteName: SITE_NAME, title: COPY.specialOffers.pageTitle, description: COPY.specialOffers.pageDescription, images: SHARE_IMAGES },
  }
}

export default async function SpecialOffersPage() {
  const res = await getSpecialOffers()
  const offers = res.data

  // These listing pages carried no structured data at all. A WebPage node
  // anchors them into the site graph so they are not read as orphans.
  const webPage = buildWebPageSchema({
    name: COPY.specialOffers.pageTitle,
    url: `${SITE_URL}/special-offers`,
    description: COPY.specialOffers.pageDescription,
  })

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(webPage) }} />
      <main className="py-6 px-4 sm:py-12">
      <div className="mx-auto max-w-[1200px]">
        <header className="mb-4 sm:mb-8">
          <h1 className="font-display text-[30px] font-bold leading-[1.08] text-ink sm:text-[44px]">{COPY.specialOffers.pageTitle}</h1>
          <p className="mt-3 max-w-[560px] text-muted">{COPY.specialOffers.pageDescription}</p>
        </header>
        {offers.length === 0 ? (
          <p className="text-muted">{COPY.specialOffers.noResults}</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {offers.map((offer) => <SpecialOfferCard key={offer.id} offer={offer} />)}
          </div>
        )}
      </div>
      </main>
    </>
  )
}
