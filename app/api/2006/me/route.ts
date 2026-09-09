/**
 * GET /api/2006/me  ·  "am I cast?"
 *
 * The public site asks this once on load, sending the main site's access token
 * if it finds one in localStorage. Cast members get their name back and the
 * page grows delete buttons. Everybody else gets {cast:false} and the page
 * looks exactly as it always did. Nothing here is a secret; the answer is only
 * ever "yes" for someone the database already lets curate the show.
 */

import { NextResponse } from 'next/server';
import { adminClient, castFromRequest } from '@/lib/wall';

export const runtime = 'nodejs';

const SLUG = '2006';

export async function GET(req: Request) {
  const admin = adminClient();
  const { data: p } = await admin.from('productions').select('id').eq('slug', SLUG).maybeSingle();
  if (!p) return NextResponse.json({ cast: false });

  const who = await castFromRequest(req, p.id);
  return NextResponse.json(who ? { cast: true, name: who.name } : { cast: false });
}
