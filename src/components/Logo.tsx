import Link from 'next/link'

/**
 * LuckySevenHub brand logo, from sites/luckysevenhub-redesign.html: a cobalt
 * tile holding a chunky white "7", set slightly askew, beside the wordmark with
 * "Seven" in cobalt.
 *
 * Same component contract as the sibling sites: one optional `className`. The
 * Link has NO aria-label: its visible text is its accessible name, and a label
 * that did not start with that text failed Lighthouse's
 * label-content-name-mismatch audit.
 */

/** The bare "7" tile. Exported because the footer shows the same artwork. */
export function LogoMark({ size = 40 }: { size?: number }) {
  return (
    <span
      aria-hidden="true"
      className="grid shrink-0 -rotate-6 place-items-center rounded-xl bg-brand font-display font-extrabold text-white"
      style={{ width: size, height: size, fontSize: size / 2 }}
    >
      7
    </span>
  )
}

export default function Logo({ className = '' }: { className?: string }) {
  return (
    <Link href="/" className={`inline-flex min-h-11 shrink-0 items-center gap-2.5 rounded-xl ${className}`.trim()}>
      <LogoMark />
      <span className="font-display text-lg font-bold text-ink">
        Lucky<span className="text-brand">Seven</span>Hub
      </span>
    </Link>
  )
}
