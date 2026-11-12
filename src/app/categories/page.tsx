import type { Metadata } from 'next'
import Link from 'next/link'
import { resolveImageUrl } from '@/lib/images'
import { getCategories } from '@/lib/api'
import { buildWebPageSchema, jsonLdScript, SHARE_IMAGES } from '@/lib/seo'
import { COPY } from '@/constants/copy'
import { SITE_URL } from '@/lib/config'

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? ''

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: COPY.categories.pageTitle,
    description: COPY.categories.pageDescription,
    alternates: { canonical: `/categories` },
    openGraph: { type: 'website', url: `/categories`, siteName: SITE_NAME, title: COPY.categories.pageTitle, description: COPY.categories.pageDescription, images: SHARE_IMAGES },
  }
}

export default async function CategoriesPage() {
  const res = await getCategories()
  const categories = res.data

  // These listing pages carried no structured data at all. A WebPage node
  // anchors them into the site graph so they are not read as orphans.
  const webPage = buildWebPageSchema({
    name: COPY.categories.pageTitle,
    url: `${SITE_URL}/categories`,
    description: COPY.categories.pageDescription,
  })

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(webPage) }} />
      <main className="py-6 px-4 sm:py-12">
      <div className="mx-auto max-w-[1200px]">
        <header className="mb-4 sm:mb-8">
          <h1 className="font-display text-[30px] font-bold leading-[1.08] text-ink sm:text-[44px]">{COPY.categories.pageTitle}</h1>
          <p className="mt-3 max-w-[560px] text-muted">{COPY.categories.pageDescription}</p>
        </header>
        {categories.length === 0 ? (
          <p className="text-muted">{COPY.categories.noResults}</p>
        ) : (
          <ul className="grid auto-rows-fr grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {categories.map((c) => (
              <li key={c.id}>
                <Link href={`/categories/${c.slug}`} className="card-pop flex h-full items-center justify-center rounded-[22px] border-2 border-line bg-white p-4 text-center font-bold text-ink sm:p-6">
                  {/* Icon beside the name, as on the chips and in the Casinos menu. */}
                  <span className="inline-flex items-center justify-center gap-2">
                    {c.logo_path && (
                      <img src={resolveImageUrl(c.logo_path)!} alt="" width={20} height={20} className="h-5 w-5 shrink-0" />
                    )}
                    {c.name}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
      </main>
    </>
  )
}
