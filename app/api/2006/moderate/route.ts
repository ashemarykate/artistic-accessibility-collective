/**
 * POST /api/2006/moderate  ·  the delete button on the public site.
 *
 * Mary Kate's call: instead of a queue in Backstage, every cast member sees a
 * delete button on every audience submission, right where it is, and anyone
 * can take down anything that should not be there. This is the other end of
 * that button.
 *
 * Deletes are real deletes. A wall post's photo goes with it, so a picture
 * somebody regretted is not left sitting in storage under a public URL after
 * the post it belonged to is gone.
 *
 * Only audience content: wall posts, and blog entries with is_audience on.
 * Cast blog posts are edited in Backstage, where they were written, and this
 * route refuses to touch them so a mis-tap on the public page cannot remove a
 * colleague's writing.
 */

import { NextResponse } from 'next/server';
import { adminClient, castFromRequest } from '@/lib/wall';

export const runtime = 'nodejs';

const SLUG = '2006';

function no(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}

export async function POST(req: Request) {
  let payload: { kind?: string; id?: string };
  try { payload = await req.json(); } catch { return no('that did not arrive in one piece.'); }

  const id = String(payload.id ?? '');
  const kind = payload.kind === 'post' ? 'post' : payload.kind === 'wall' ? 'wall' : null;
  if (!kind) return no('what kind of thing is that?');
  if (!/^[0-9a-f-]{36}$/i.test(id)) return no('that id does not look real.');

  const admin = adminClient();
  const { data: p } = await admin.from('productions').select('id').eq('slug', SLUG).maybeSingle();
  if (!p) return no('the show is not set up yet.', 404);

  const who = await castFromRequest(req, p.id);
  if (!who) return no('only the cast can do that.', 403);

  if (kind === 'wall') {
    const { data: row } = await admin
      .from('production_confessions')
      .select('id, image_path')
      .eq('id', id).eq('production_id', p.id)
      .maybeSingle();
    if (!row) return no('that post is already gone.', 404);

    if (row.image_path) {
      const key = row.image_path.split('/confession-photos/')[1];
      if (key) await admin.storage.from('confession-photos').remove([key]);
    }
    const { error } = await admin.from('production_confessions').delete().eq('id', id);
    if (error) return no('it would not delete. try once more?', 502);
    return NextResponse.json({ ok: true });
  }

  const { data: post } = await admin
    .from('production_posts')
    .select('id, is_audience')
    .eq('id', id).eq('production_id', p.id)
    .maybeSingle();
  if (!post) return no('that entry is already gone.', 404);
  if (!post.is_audience) return no('that one is a cast post. edit it in Backstage.', 403);

  const { error } = await admin.from('production_posts').delete().eq('id', id);
  if (error) return no('it would not delete. try once more?', 502);
  return NextResponse.json({ ok: true });
}
