/**
 * POST /api/2006/react  ·  notes and warns on a confession.
 *
 * Same reasoning as the confess route: the audience holds no write permission
 * on these tables, so this handler is the only way a count moves.
 *
 * One note and one warn per browser per post. That is enforced by a primary key
 * in the database rather than by this code, so pressing twice cannot count
 * twice even from a script. The counts on the post itself are maintained by a
 * trigger, and so is the automatic takedown at three warns, which means neither
 * can drift from the rows they are counting.
 */

import { NextResponse } from 'next/server';
import { adminClient, loadWallSettings, cleanDeviceTag } from '@/lib/wall';

export const runtime = 'nodejs';

const SLUG = '2006';

function no(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}

export async function POST(req: Request) {
  let payload: { id?: string; kind?: string; device?: string; undo?: boolean };
  try {
    payload = await req.json();
  } catch {
    return no('that did not go through.');
  }

  const kind = payload.kind === 'warn' ? 'warn' : 'note';
  const device = cleanDeviceTag(payload.device);
  const id = String(payload.id ?? '');
  if (!device) return no('reload the page and try again?');
  if (!/^[0-9a-f-]{36}$/i.test(id)) return no('that post does not look real.');

  const admin = adminClient();
  const settings = await loadWallSettings(admin, SLUG);
  if (!settings) return no('the wall is not set up yet.', 404);
  if (!settings.wallOpen) return no('the wall is closed right now.', 403);

  // The post has to be on this show's wall. Without this check, an id from
  // anywhere would do, and the counts on some other production's wall could be
  // moved from this one.
  const { data: post } = await admin
    .from('production_confessions')
    .select('id, production_id, visible')
    .eq('id', id)
    .eq('production_id', settings.productionId)
    .maybeSingle();
  if (!post) return no('that post is not here any more.', 404);

  const table = kind === 'warn'
    ? 'production_confession_warns'
    : 'production_confession_notes';

  // Notes come off again, because changing your mind about liking something is
  // normal. Warns do not: taking a warn back would let somebody warn a post,
  // watch it come down, and quietly release it, which is a way to test whether
  // anybody is paying attention.
  if (payload.undo && kind === 'note') {
    await admin.from(table).delete().eq('confession_id', id).eq('device_tag', device);
  } else {
    const { error } = await admin.from(table).insert({ confession_id: id, device_tag: device });
    // A duplicate key here means this browser already pressed it. That is the
    // constraint doing its job, not a failure worth reporting.
    if (error && error.code !== '23505') return no('that did not land. try again?', 502);
  }

  const { data: fresh } = await admin
    .from('production_confessions')
    .select('id, notes_count, visible')
    .eq('id', id)
    .maybeSingle();

  return NextResponse.json({
    ok: true,
    notes: fresh?.notes_count ?? 0,
    // The page uses this to take the card off screen on the spot when the third
    // warn lands, rather than leaving it up until the next reload.
    gone: fresh ? !fresh.visible : false,
  });
}
