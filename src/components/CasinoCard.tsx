import Image from 'next/image'
import Link from 'next/link'
import { resolveImageUrl } from '@/lib/images'
import { COPY } from '@/constants/copy'
import type { CasinoWithAttachment } from '@shared/types/casino'

export function Stars({ rating, className = '' }: { rating: number; className?: string }) {
  return (
    <span className={`tracking-[1px] text-gold ${className}`.trim()} role="img" aria-label={`Rated ${rating} out of 5`}>
      {'★'.repeat(rating)}
      <span className="text-line-soft">{'★'.repeat(5 - rating)}</span>
    </span>
  )
}

/**
 * The casino's logo on the white tile every logo sits on, so dark and light
 * artwork alike stay legible. With no artwork, the name itself.
 */
export function LogoTile({ casino, className = '', sizes = '200px' }: { casino: CasinoWithAttachment; className?: string; sizes?: string }) {
  // The casino's "Image" (logo), NOT the wide "Banner Image" (that's used big
  // on the single casino page). Falls back to the banner if no Image.
  const image = resolveImageUrl(casino.image_path ?? casino.banner_image)

  return (
    <span className={`relative flex shrink-0 items-center justify-center overflow-hidden border border-line bg-white p-2 text-center font-extrabold leading-tight text-ink ${className}`.trim()}>
      {image ? (
        <Image src={image} alt={casino.name} width={400} height={240} sizes={sizes} className="h-auto max-h-full w-auto max-w-full object-contain" />
      ) : (
        casino.name
      )}
    </span>
  )
}

/**
 * One casino on the board, from sites/luckysevenhub-redesign.html: the mockup's
 * "podium" card — the logo on white, the name, the score, the headline offer in
 * cobalt and the two actions (stacked, side by side from lg). It lifts onto a
 * hard cobalt shadow on hover or keyboard focus (`.card-pop`). Rendered as an <li>, so the <ol> keeps the
 * order; the list order is the ranking and no number is printed.
 */
export default function CasinoCard({ casino }: { casino: CasinoWithAttachment; rank?: number }) {
  return (
    <li className="card-pop flex flex-col gap-3 rounded-[22px] border-2 border-line bg-white p-4 lg:gap-3.5 lg:p-5">
      <LogoTile casino={casino} className="h-[120px] w-full rounded-2xl md:h-[150px] lg:h-[170px]" sizes="(min-width: 768px) 360px, 240px" />
      {/* 15px on a phone, where two cards share 375px: "Luckydreams" in
          Unbounded is wider than a 128px card at 17px. A name longer still
          breaks rather than running into the border. */}
      <h3 className="font-display text-[15px] font-bold leading-[1.2] text-ink [overflow-wrap:anywhere] min-[420px]:text-[17px] md:text-[20px] lg:text-[22px]">{casino.name}</h3>
      <p className="flex items-center gap-1.5 text-[13px] font-semibold text-muted lg:text-sm">
        <Stars rating={casino.rating} />
        {casino.rating.toFixed(1)}
      </p>
      {casino.bonuses && <p className="min-h-[38px] text-sm font-bold leading-[1.35] text-brand md:min-h-[44px] md:text-base lg:text-[17px]">{casino.bonuses}</p>}
      <div className="mt-auto grid grid-cols-1 gap-2 lg:grid-cols-2">
        <a
          href={casino.attachment.affiliate_url}
          target="_blank"
          rel="nofollow sponsored noopener"
          className="btn-blue inline-flex min-h-[42px] items-center justify-center whitespace-nowrap px-2.5 text-sm font-bold md:min-h-12 md:text-[15px]"
        >
          {COPY.casinos.visitCasino}
        </a>
        <Link
          href={`/casinos/${casino.slug}`}
          className="btn-white inline-flex min-h-[42px] items-center justify-center whitespace-nowrap px-2.5 text-sm font-bold md:min-h-12 md:text-[15px]"
        >
          {COPY.casinos.readReview}
        </Link>
      </div>
    </li>
  )
}

/**
 * The <ol> classes every list of CasinoCards uses: 1 / 2 / 3 across — one below
 * 360px, where two cards' buttons do not fit side by side. Three from md up, so
 * the six a list page holds fill two even rows, each card large.
 */
export const CASINO_GRID = 'grid grid-cols-1 gap-4 min-[360px]:grid-cols-2 md:grid-cols-3 lg:gap-5'
