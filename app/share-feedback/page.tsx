import { redirect } from 'next/navigation';

/**
 * Retired 2026-09-09. This was a public feedback form that nothing linked to,
 * so it had never collected anything, and its answers went to the same inbox
 * the contact form already reaches. Its two questions now live on /contact as
 * the "a suggestion" reason, alongside the barrier questions, so there is one
 * findable door instead of two and only one of them visible.
 *
 * Kept as a redirect rather than deleted, in case the address was ever shared
 * somewhere outside this repo.
 */
export default function ShareFeedbackPage() {
  redirect('/contact?reason=suggestion');
}
