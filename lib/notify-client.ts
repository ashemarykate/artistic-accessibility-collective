'use client';

/**
 * Asks the server to email somebody about a thing that just happened.
 *
 * Fire and forget on purpose. The message is already sent and the endorsement
 * is already saved by the time this runs; if the email fails, that is a worse
 * day for the recipient but not a failure of the thing the member did, and they
 * should never see an error about it.
 *
 * The server does not trust anything passed here. It re-reads the row and
 * checks the signed-in person really is the sender or endorser.
 */

import { supabase } from '@/lib/supabase';

export async function notifyAbout(kind: 'message' | 'endorsement', refId: string): Promise<void> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return;
    await fetch('/api/notify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ kind, refId }),
    });
  } catch (err) {
    console.warn('Could not send a notification email:', err);
  }
}
