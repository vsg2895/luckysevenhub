import Link from 'next/link'

/**
 * LuckySevenHub brand logo: a cobalt rounded square carrying a "7" drawn as two
 * strokes, with a lemon star at its foot, beside the wordmark. Taken from
 * sites/luckysevenhub.html.
 *
 * Inlined SVG rather than an image: it renders instantly with no extra request,
 * stays crisp at any size, and takes its colours from the theme tokens, so a
 * palette change here is a palette change everywhere. The Link carries the
 * accessible name; the artwork is aria-hidden to avoid a duplicate
 * announcement.
 */
export default function Logo({ className = '' }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="LuckySevenHub home"
      className={`inline-flex min-h-11 shrink-0 items-center gap-3 rounded-xl focus:outline-none focus-visible:ring-[3px] focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-cream ${className}`.trim()}
    >
      <svg
        viewBox="0 0 34 34"
        className="h-9 w-9 shrink-0 sm:h-[38px] sm:w-[38px]"
        aria-hidden="true"
        focusable="false"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="34" height="34" rx="10" fill="var(--color-brand)" />
        {/* The seven, as a stroke so it keeps its weight at any size. */}
        <path
          d="M10 9.5h14l-7.6 15.5"
          fill="none"
          stroke="var(--color-brand-ink)"
          strokeWidth="3.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* The one lemon mark in the logo — "lucky", stated once. */}
        <path
          d="M24.5 19.2l1.15 2.35 2.6.38-1.88 1.83.44 2.59-2.31-1.22-2.31 1.22.44-2.59-1.88-1.83 2.6-.38z"
          fill="var(--color-accent)"
        />
      </svg>

      <span className="font-display text-[17px] font-bold leading-none tracking-tight text-ink sm:text-[19px]">
        Lucky<span className="text-brand">Seven</span>Hub
      </span>
    </Link>
  )
}
