import type { CSSProperties } from 'react'

/**
 * The home page FAQ, from sites/luckysevenhub-redesign.html: the questions as a
 * numbered list, the chosen one's answer in a dark panel beside them.
 *
 * CSS-only tabs — radio inputs, no client JavaScript — so EVERY answer is in
 * the server HTML. That is not optional here: the page emits FAQPage
 * structured data from the same items, and Google requires the answers to be
 * on the page. Only the checked answer is displayed.
 *
 * ONE grid, questions and answers interleaved in source order (question 1,
 * answer 1, question 2, …). Below lg that order is the layout: the open answer
 * sits directly under its own question, instead of under the whole list where
 * tapping question 6 opened an answer off-screen. From lg every answer is
 * placed in the second column across all the question rows, so the one shown
 * reads as the mockup's side panel.
 */
export default function FaqBoard({ items }: { items: ReadonlyArray<{ question: string; answer: string }> }) {
  if (items.length === 0) return null

  const rules = items
    .map((_, i) => `.ls-faq:has(#fq-${i}:checked) [data-fq="${i}"]{display:block}`)
    .join('')

  return (
    <fieldset className="ls-faq mt-[26px] min-w-0">
      <style>{rules}</style>
      <legend className="sr-only">Questions</legend>
      <div
        className="grid grid-cols-1 items-start gap-2 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-x-5"
        style={{ '--fq-rows': items.length } as CSSProperties}
      >
        {items.map((item, i) => [
          <span key={`q-${item.question}`} className="relative lg:col-start-1">
            <input type="radio" name="faq-board" id={`fq-${i}`} defaultChecked={i === 0} className="peer sr-only" />
            <label
              htmlFor={`fq-${i}`}
              className="grid min-h-14 cursor-pointer grid-cols-[36px_minmax(0,1fr)] items-center gap-3 rounded-2xl border-2 border-line bg-white px-4 py-2.5 text-[15px] font-bold text-ink transition-colors hover:border-line-soft peer-checked:border-brand peer-checked:bg-brand-soft peer-checked:[&>span]:bg-brand peer-checked:[&>span]:text-white peer-focus-visible:outline-3 peer-focus-visible:outline-accent"
            >
              <span aria-hidden className="grid h-8 w-8 place-items-center rounded-[10px] bg-soft font-display text-[13px] font-extrabold">{i + 1}</span>
              {item.question}
            </label>
          </span>,
          <article
            key={`a-${item.question}`}
            data-fq={i}
            className="hidden rounded-[26px] bg-ink p-6 text-white sm:p-[34px] lg:sticky lg:top-24 lg:col-start-2 lg:min-h-[300px] lg:[grid-row:1/span_var(--fq-rows)]"
          >
            <p aria-hidden className="font-display text-[44px] font-extrabold leading-none text-accent sm:text-[72px]">{String(i + 1).padStart(2, '0')}</p>
            <h3 className="mt-4 font-display text-xl font-bold text-white sm:text-2xl">{item.question}</h3>
            <p className="mt-3.5 text-[17px] leading-[1.7] text-[#c9ccd6]">{item.answer}</p>
          </article>,
        ])}
      </div>
    </fieldset>
  )
}
