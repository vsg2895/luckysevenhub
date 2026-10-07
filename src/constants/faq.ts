/**
 * Frequently asked questions for this site.
 *
 * Rendered VISIBLY on the home page and emitted as FAQPage structured data from
 * this same array. Google requires the two to match; markup-only FAQ is a
 * guidelines violation, which is why the page maps over this constant rather
 * than duplicating the text.
 *
 * The wording is unique to this site: these answers are indexable page content,
 * and they are exactly the kind of text an answer engine quotes. Here they
 * explain the seven checks, because that is what this brand is.
 *
 * Nothing below claims a figure this site cannot show. The checks are described
 * by what is looked at, never by a score nobody could verify.
 */
export const FAQ_ITEMS = [
  {
    question: "What are the seven checks?",
    answer:
      "Licence, payouts, bonus terms, game fairness, support, deposit and loss limits, and safer-play tools. The same seven, in the same order, for every casino — so two reviews can actually be compared.",
  },
  {
    question: "What happens if a casino fails one?",
    answer:
      "It does not appear on the list. There is no weighting and no partial credit: a casino that pays quickly but buries a max-bet clause in its bonus terms has failed the bonus check, and that is enough.",
  },
  {
    question: "How is the licence checked?",
    answer:
      "By opening the regulator's own register and matching the company name and licence number against what the casino publishes in its footer. A licence badge that links nowhere, or names a company the register does not list, fails this check.",
  },
  {
    question: "How are payouts tested?",
    answer:
      "By making real withdrawals and timing them from request to wallet, including any verification step. We publish observed times rather than advertised ones, because the advertised figure almost never includes the checks.",
  },
  {
    question: "What counts as fair bonus terms?",
    answer:
      "Terms you can read in full before you deposit: the wagering multiplier and what it applies to, the maximum conversion cap, the maximum bet while wagering, the expiry, and which games contribute. A term that is only discoverable after depositing fails.",
  },
  {
    question: "Does a casino pay to be listed?",
    answer:
      "No. We earn a commission when somebody signs up through a link here, and it has no bearing on whether a casino passes or where it ranks. A casino that fails a check is removed regardless of what it pays.",
  },
  {
    question: "How often is the list re-checked?",
    answer:
      "Every month. Terms change, payout times drift and support teams get rebuilt, so a review that is a year old is a guess. Each casino carries the date it was last checked.",
  },
] as const
