'use client';

/**
 * ProductionsPanel — Admin -> Website Content -> Productions
 *
 * Where the Artistic Accessibility Productions at /projects get written. Two
 * screens: a list of everything, and an editor for one production.
 *
 * Design rules this panel follows, because they're the whole point of it:
 *
 *  - Nothing is required except a title. Every other field is optional and a
 *    blank field simply doesn't render on the patron page, so a production can
 *    be published knowing only its name and filled in as details firm up.
 *
 *  - Drafts are genuinely private. RLS hides them from patrons, and publishing
 *    is the only thing that puts a production on /calendar (see
 *    syncProductionToCalendar). So a half-written page can sit here for weeks.
 *
 *  - Photo descriptions are asked for, not assumed. The uploader flags an
 *    undescribed photo and the save warns once before publishing without.
 *
 * The one non-obvious mechanic: a production has many dates, and each date
 * carries its own venue, format and ticket link. That's what lets one show run
 * online in September and in person in November as a single page.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  supabase,
  PRODUCTION_ACCESS_OPTIONS,
  PRODUCTION_KIND_LABELS,
  type Production,
  type ProductionDate,
  type ProductionKind,
  type ProductionLink,
  type ProductionPhoto,
  type ProductionPresenter,
  type ProductionStatus,
  type ProductionTicketTier,
  type ProductionWithDates,
  type Profile,
} from '@/lib/supabase';
import {
  fetchAllProductions,
  formatDate,
  formatDateShort,
  nextDate,
  syncProductionToCalendar,
  uniqueSlug,
  slugify,
} from '@/lib/productions';
import ProjectIconPicker from '@/components/ProjectIconPicker';
import RichTextEditor from '@/components/RichTextEditor';
import ProductionPhotoUploader from '@/components/ProductionPhotoUploader';

// ── Shared styles, matching the other admin panels ───────────────────────────

const inp: React.CSSProperties = {
  width: '100%', padding: '10px 8px', fontSize: '0.875rem', minHeight: 44,
  border: '1px solid var(--color-border, #c8c4bc)', borderRadius: 4,
  fontFamily: 'inherit', boxSizing: 'border-box', background: '#fff',
};
const lbl: React.CSSProperties = {
  display: 'block', fontSize: '0.75rem', fontWeight: 600,
  color: 'var(--color-text-muted, #5a5a5a)', marginBottom: 3,
};
const row: React.CSSProperties  = { marginBottom: '0.75rem' };
const row2: React.CSSProperties = { display: 'flex', gap: '0.75rem', marginBottom: '0.75rem', flexWrap: 'wrap' };
const card: React.CSSProperties = {
  border: '1px solid var(--color-border, #c8c4bc)', borderRadius: 6,
  background: '#fff', padding: '1rem', marginBottom: '1rem',
};
const btn = (kind: 'primary' | 'outline' | 'danger' | 'ghost'): React.CSSProperties => ({
  minHeight: 44, padding: '0 16px', borderRadius: 4, cursor: 'pointer',
  fontFamily: 'inherit', fontSize: '0.875rem', fontWeight: 600,
  border: kind === 'danger' ? '1px solid #c88' : '1px solid var(--aac-blue)',
  background: kind === 'primary' ? 'var(--aac-blue)' : '#fff',
  color: kind === 'primary' ? '#fff' : kind === 'danger' ? '#a33' : 'var(--aac-blue)',
  ...(kind === 'ghost' ? { border: '1px solid var(--color-border, #c8c4bc)', color: '#333' } : {}),
});

const STATUS_META: Record<ProductionStatus, { label: string; bg: string; fg: string }> = {
  draft:     { label: 'Draft',     bg: '#fdf1b8', fg: '#6b5300' },
  published: { label: 'Published', bg: '#d6f0dc', fg: '#125c2a' },
  archived:  { label: 'Archived',  bg: '#e6e4de', fg: '#4a4a4a' },
};

// ── Editor form model ─────────────────────────────────────────────────────────
// Dates are held as separate date + time strings because that's what <input
// type="date"> and <input type="time"> give us; they're combined into
// timestamps only at save time, the same way EventsPanel does it.

type DateRow = {
  key: string;
  id?: string;
  start_date: string; start_time: string;
  end_date: string;   end_time: string;
  is_all_day: boolean;
  location_type: ProductionDate['location_type'];
  venue_name: string; venue_address: string; venue_note: string;
  online_url: string; online_note: string;
  label: string; ticket_url: string; note: string;
  is_sold_out: boolean; is_visible: boolean;
};

type FormState = {
  id?: string;
  slug: string;
  slugTouched: boolean;
  title: string;
  tagline: string;
  kind: ProductionKind;
  status: ProductionStatus;
  sort_order: number;
  summary: string;
  body_html: string;
  hero: ProductionPhoto[];        // 0 or 1 entries; the uploader runs in single mode
  gallery: ProductionPhoto[];
  presenters: ProductionPresenter[];
  ticket_tiers: ProductionTicketTier[];
  links: ProductionLink[];
  price_note: string;
  access_features: string[];
  access_note: string;
  schedule_note: string;
  contact_email: string;
  rsvp_enabled: boolean;
  rsvp_capacity: string;
  /** '' means "choose one for me from the kind". */
  desktop_icon: string;
  dates: DateRow[];
};

let keySeq = 0;
const nextKey = () => `row-${++keySeq}`;

const blankDate = (): DateRow => ({
  key: nextKey(),
  start_date: '', start_time: '', end_date: '', end_time: '',
  is_all_day: false,
  location_type: 'in-person',
  venue_name: '', venue_address: '', venue_note: '',
  online_url: '', online_note: '',
  label: '', ticket_url: '', note: '',
  is_sold_out: false, is_visible: true,
});

const blankForm = (): FormState => ({
  slug: '', slugTouched: false,
  title: '', tagline: '', kind: 'workshop', status: 'draft', sort_order: 0,
  summary: '', body_html: '',
  hero: [], gallery: [], presenters: [], ticket_tiers: [], links: [],
  price_note: '', access_features: [], access_note: '', schedule_note: '',
  contact_email: '', rsvp_enabled: true, rsvp_capacity: '',
  desktop_icon: '',
  dates: [],
});

/** Splits a stored timestamp back into the date and time inputs. Uses local
 *  time on purpose: the admin entered 10am meaning 10am where the event is. */
function splitTs(ts: string | null): { date: string; time: string } {
  if (!ts) return { date: '', time: '' };
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return { date: '', time: '' };
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

function toForm(p: ProductionWithDates): FormState {
  return {
    id: p.id,
    slug: p.slug,
    slugTouched: true,          // an existing slug is a live URL; never auto-rewrite it
    title: p.title,
    tagline: p.tagline ?? '',
    kind: p.kind,
    status: p.status,
    sort_order: p.sort_order,
    summary: p.summary ?? '',
    body_html: p.body_html ?? '',
    hero: p.hero_photo_url ? [{ url: p.hero_photo_url, alt: p.hero_photo_alt ?? '' }] : [],
    gallery: p.gallery,
    presenters: p.presenters,
    ticket_tiers: p.ticket_tiers,
    links: p.links,
    price_note: p.price_note ?? '',
    access_features: p.access_features,
    access_note: p.access_note ?? '',
    schedule_note: p.schedule_note ?? '',
    contact_email: p.contact_email ?? '',
    rsvp_enabled: p.rsvp_enabled,
    rsvp_capacity: p.rsvp_capacity == null ? '' : String(p.rsvp_capacity),
    desktop_icon: p.desktop_icon ?? '',
    dates: p.dates.map((d) => {
      const s = splitTs(d.start_at);
      const e = splitTs(d.end_at);
      return {
        key: nextKey(), id: d.id,
        start_date: s.date, start_time: d.is_all_day ? '' : s.time,
        end_date: e.date,   end_time: d.is_all_day ? '' : e.time,
        is_all_day: d.is_all_day,
        location_type: d.location_type,
        venue_name: d.venue_name ?? '', venue_address: d.venue_address ?? '', venue_note: d.venue_note ?? '',
        online_url: d.online_url ?? '', online_note: d.online_note ?? '',
        label: d.label ?? '', ticket_url: d.ticket_url ?? '', note: d.note ?? '',
        is_sold_out: d.is_sold_out, is_visible: d.is_visible,
      };
    }),
  };
}

// ─────────────────────────────────────────────────────────────────────────────

export default function ProductionsPanel() {
  const [productions, setProductions] = useState<ProductionWithDates[]>([]);
  const [loading, setLoading]   = useState(true);
  const [loadError, setLoadError] = useState('');
  const [mode, setMode] = useState<'list' | 'edit' | 'attendees'>('list');
  const [form, setForm] = useState<FormState>(blankForm);
  const [attendeesFor, setAttendeesFor] = useState<ProductionWithDates | null>(null);
  const [rsvpCounts, setRsvpCounts] = useState<Record<string, number>>({});
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [saveErr, setSaveErr] = useState('');
  const editorHeadingRef = useRef<HTMLHeadingElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setProductions(await fetchAllProductions());

    // Attendance totals for the list. One query, counted client side, because
    // the numbers here are small and it keeps the round trips down.
    const { data, error } = await supabase.from('production_rsvps').select('production_id');
    if (error) {
      // The productions themselves loaded, so this is a footnote rather than a
      // failure: the list still works, the counts just read as zero.
      setLoadError('Could not load the attending counts. Everything else is fine.');
    } else {
      setLoadError('');
    }
    const counts: Record<string, number> = {};
    for (const r of (data ?? []) as Array<{ production_id: string }>) {
      counts[r.production_id] = (counts[r.production_id] ?? 0) + 1;
    }
    setRsvpCounts(counts);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  // Move focus to the editor heading on entry, matching how the submit flow
  // handles its step transitions.
  useEffect(() => {
    if (mode === 'edit') editorHeadingRef.current?.focus();
  }, [mode, form.id]);

  const startNew = () => {
    setForm(blankForm());
    setSaveMsg(''); setSaveErr('');
    setMode('edit');
  };

  const startEdit = (p: ProductionWithDates) => {
    setForm(toForm(p));
    setSaveMsg(''); setSaveErr('');
    setMode('edit');
  };

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  // ── Save ───────────────────────────────────────────────────────────────────

  const handleSave = async (publishNow?: boolean) => {
    setSaveErr(''); setSaveMsg('');

    if (!form.title.trim()) {
      setSaveErr('A production needs a title. Everything else can wait.');
      return;
    }
    const badDate = form.dates.find((d) => !d.start_date);
    if (badDate) {
      setSaveErr('Every date needs at least a start date. Remove the empty one or fill it in.');
      return;
    }

    const targetStatus: ProductionStatus = publishNow === true ? 'published'
      : publishNow === false ? 'draft'
      : form.status;

    // Publishing with undescribed photos is allowed, but not silently.
    if (targetStatus === 'published') {
      const undescribed = [...form.hero, ...form.gallery].filter((p) => !p.alt.trim()).length;
      if (undescribed > 0) {
        const ok = window.confirm(
          `${undescribed} photo${undescribed === 1 ? '' : 's'} ${undescribed === 1 ? 'has' : 'have'} no description yet. ` +
          'Screen reader users will not know what they show.\n\nPublish anyway?',
        );
        if (!ok) return;
      }
    }

    setSaving(true);
    try {
      const slug = form.slugTouched && form.slug.trim()
        ? await uniqueSlug(form.slug, form.id)
        : await uniqueSlug(form.title, form.id);

      const payload = {
        slug,
        title: form.title.trim(),
        tagline: form.tagline.trim() || null,
        kind: form.kind,
        status: targetStatus,
        sort_order: form.sort_order,
        summary: form.summary.trim() || null,
        body_html: form.body_html.trim() || null,
        presenters: form.presenters.filter((p) => p.name.trim()),
        ticket_tiers: form.ticket_tiers.filter((t) => t.label.trim()),
        gallery: form.gallery,
        links: form.links.filter((l) => l.label.trim() && l.url.trim()),
        hero_photo_url: form.hero[0]?.url ?? null,
        hero_photo_alt: form.hero[0]?.alt ?? null,
        price_note: form.price_note.trim() || null,
        access_features: form.access_features,
        access_note: form.access_note.trim() || null,
        schedule_note: form.schedule_note.trim() || null,
        contact_email: form.contact_email.trim() || null,
        rsvp_enabled: form.rsvp_enabled,
        rsvp_capacity: form.rsvp_capacity.trim() ? Number(form.rsvp_capacity) : null,
        desktop_icon: form.desktop_icon || null,
      };

      // Save, and survive the one ordering mistake that is easy to make: this
      // code knows about desktop_icon (migration v44) but the database might not
      // yet. Postgres answers 42703 "column does not exist", which on its own
      // reads like a crash to anyone who did not write it. So the save drops
      // just that field and goes again, then says plainly what happened. Once
      // v44 has run this branch never fires again.
      let missingIconColumn = false;

      const writeProduction = async (body: Record<string, unknown>) => {
        if (form.id) {
          const { error } = await supabase.from('productions').update(body).eq('id', form.id);
          return { id: form.id, error };
        }
        const { data, error } = await supabase.from('productions').insert(body).select('id').single();
        return { id: (data as { id: string } | null)?.id, error };
      };

      const isMissingIconColumn = (e: { code?: string; message?: string } | null) =>
        !!e && (e.code === '42703' || /column .*desktop_icon.* does not exist/i.test(e.message ?? ''))
        && /desktop_icon/i.test(e.message ?? '');

      let { id: productionId, error: writeErr } = await writeProduction(payload);

      if (isMissingIconColumn(writeErr)) {
        missingIconColumn = true;
        const withoutIcon: Record<string, unknown> = { ...payload };
        delete withoutIcon.desktop_icon;
        ({ id: productionId, error: writeErr } = await writeProduction(withoutIcon));
      }

      if (writeErr) throw writeErr;
      if (!productionId) throw new Error('The production saved but did not come back with an id.');

      // ── Dates: delete the ones removed in the form, then write the rest ────
      const keptIds = form.dates.map((d) => d.id).filter(Boolean) as string[];
      const { data: existing } = await supabase
        .from('production_dates').select('id').eq('production_id', productionId);
      const toDelete = ((existing ?? []) as Array<{ id: string }>)
        .map((r) => r.id)
        .filter((id) => !keptIds.includes(id));
      if (toDelete.length > 0) {
        await supabase.from('production_dates').delete().in('id', toDelete);
      }

      for (const d of form.dates) {
        const startTs = d.is_all_day
          ? new Date(`${d.start_date}T00:00:00`).toISOString()
          : new Date(`${d.start_date}T${d.start_time || '00:00'}`).toISOString();
        const endTs = d.end_date
          ? (d.is_all_day
              ? new Date(`${d.end_date}T23:59:59`).toISOString()
              : d.end_time
                ? new Date(`${d.end_date}T${d.end_time}`).toISOString()
                : null)
          // An end time with no end date means "same day, ends at".
          : (!d.is_all_day && d.end_time
              ? new Date(`${d.start_date}T${d.end_time}`).toISOString()
              : null);

        const datePayload = {
          production_id: productionId,
          start_at: startTs,
          end_at: endTs,
          is_all_day: d.is_all_day,
          location_type: d.location_type,
          venue_name: d.venue_name.trim() || null,
          venue_address: d.venue_address.trim() || null,
          venue_note: d.venue_note.trim() || null,
          online_url: d.online_url.trim() || null,
          online_note: d.online_note.trim() || null,
          label: d.label.trim() || null,
          ticket_url: d.ticket_url.trim() || null,
          note: d.note.trim() || null,
          is_sold_out: d.is_sold_out,
          is_visible: d.is_visible,
        };

        if (d.id) {
          const { error } = await supabase.from('production_dates').update(datePayload).eq('id', d.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('production_dates').insert(datePayload);
          if (error) throw error;
        }
      }

      // ── Calendar mirror ───────────────────────────────────────────────────
      const { data: freshProd } = await supabase
        .from('productions').select('*').eq('id', productionId).single();
      const { data: freshDates } = await supabase
        .from('production_dates').select('*').eq('production_id', productionId).order('start_at');

      let mirrorNote = '';
      if (freshProd) {
        const sync = await syncProductionToCalendar(
          freshProd as Production,
          (freshDates ?? []) as ProductionDate[],
        );
        if (sync.error) {
          mirrorNote = ' The production saved, but adding it to the calendar failed. Saving again will retry.';
        } else if (sync.mirrored > 0) {
          mirrorNote = ` ${sync.mirrored} date${sync.mirrored === 1 ? '' : 's'} now showing on the calendar.`;
        }
      }

      const iconNote = missingIconColumn
        ? ' One thing did not save: the folder icon. Run supabase-migration-v44.sql in the Supabase SQL Editor, then pick it again and save. Everything else went through.'
        : '';

      setSaveMsg(
        (targetStatus === 'published' ? 'Published.' : 'Saved as a draft. Only admins can see it.')
        + mirrorNote + iconNote,
      );
      await load();
      setMode('list');
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setSaveErr(`Could not save: ${message}`);
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async (p: ProductionWithDates) => {
    const status: ProductionStatus = p.status === 'published' ? 'draft' : 'published';
    const { error } = await supabase.from('productions').update({ status }).eq('id', p.id);
    if (error) { setSaveErr(error.message); return; }
    await syncProductionToCalendar({ ...p, status }, p.dates);
    setSaveMsg(status === 'published'
      ? `"${p.title}" is now live at /projects/${p.slug}.`
      : `"${p.title}" is back to a draft and off the calendar.`);
    await load();
  };

  const handleDelete = async (p: ProductionWithDates) => {
    // Dates, RSVPs and mirrored calendar rows all cascade from this.
    const { error } = await supabase.from('productions').delete().eq('id', p.id);
    setDeleteConfirm(null);
    if (error) { setSaveErr(error.message); return; }
    setSaveMsg(`Deleted "${p.title}".`);
    await load();
  };

  const openAttendees = (p: ProductionWithDates) => {
    setAttendeesFor(p);
    setMode('attendees');
  };

  // ── Repeatable-block helpers ───────────────────────────────────────────────

  const addPresenter = () =>
    set('presenters', [...form.presenters, { name: '', role: '', bio: '' }]);
  const updPresenter = (i: number, patch: Partial<ProductionPresenter>) =>
    set('presenters', form.presenters.map((p, n) => (n === i ? { ...p, ...patch } : p)));
  const delPresenter = (i: number) =>
    set('presenters', form.presenters.filter((_, n) => n !== i));

  const addTier = () =>
    set('ticket_tiers', [...form.ticket_tiers, { label: '', price_text: '', url: '' }]);
  const updTier = (i: number, patch: Partial<ProductionTicketTier>) =>
    set('ticket_tiers', form.ticket_tiers.map((t, n) => (n === i ? { ...t, ...patch } : t)));
  const delTier = (i: number) =>
    set('ticket_tiers', form.ticket_tiers.filter((_, n) => n !== i));

  const addLink = () => set('links', [...form.links, { label: '', url: '' }]);
  const updLink = (i: number, patch: Partial<ProductionLink>) =>
    set('links', form.links.map((l, n) => (n === i ? { ...l, ...patch } : l)));
  const delLink = (i: number) => set('links', form.links.filter((_, n) => n !== i));

  const addDate = () => set('dates', [...form.dates, blankDate()]);
  const updDate = (i: number, patch: Partial<DateRow>) =>
    set('dates', form.dates.map((d, n) => (n === i ? { ...d, ...patch } : d)));
  const delDate = (i: number) => set('dates', form.dates.filter((_, n) => n !== i));

  const toggleAccess = (feature: string) =>
    set('access_features', form.access_features.includes(feature)
      ? form.access_features.filter((f) => f !== feature)
      : [...form.access_features, feature]);

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return <p role="status" aria-live="polite" style={{ padding: '1rem' }}>Loading productions…</p>;
  }

  if (mode === 'attendees' && attendeesFor) {
    return (
      <AttendeeList
        production={attendeesFor}
        onBack={() => { setAttendeesFor(null); setMode('list'); }}
      />
    );
  }

  if (mode === 'edit') {
    return (
      <div>
        <h3
          ref={editorHeadingRef}
          tabIndex={-1}
          style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.25rem', color: 'var(--aac-blue)' }}
        >
          {form.id ? `Editing: ${form.title || 'Untitled production'}` : 'New Production'}
        </h3>
        <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted, #5a5a5a)', marginBottom: '1rem' }}>
          Only the title is required. Anything you leave blank just will not show up on the public page.
        </p>

        {saveErr && (
          <p role="alert" style={{ padding: '0.625rem 0.75rem', background: '#fdeceb', color: '#8e1a11', borderRadius: 4, marginBottom: '1rem', fontSize: '0.875rem' }}>
            {saveErr}
          </p>
        )}

        {/* ── The basics ── */}
        <fieldset style={{ ...card, border: '1px solid var(--color-border, #c8c4bc)' }}>
          <legend style={{ fontWeight: 700, fontSize: '0.9375rem', padding: '0 6px', color: 'var(--aac-blue)' }}>
            The basics
          </legend>

          <div style={row}>
            <label style={lbl} htmlFor="prod-title">Title (required)</label>
            <input
              id="prod-title" type="text" style={inp} value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="Creative Access Intensive"
            />
          </div>

          <div style={row}>
            <label style={lbl} htmlFor="prod-tagline">Tagline</label>
            <input
              id="prod-tagline" type="text" style={inp} value={form.tagline}
              onChange={(e) => set('tagline', e.target.value)}
              placeholder="Two days of making access part of the art"
            />
          </div>

          <div style={row2}>
            <div style={{ flex: '1 1 180px' }}>
              <label style={lbl} htmlFor="prod-kind">What kind of thing is this</label>
              <select
                id="prod-kind" style={inp} value={form.kind}
                onChange={(e) => set('kind', e.target.value as ProductionKind)}
              >
                {(Object.keys(PRODUCTION_KIND_LABELS) as ProductionKind[]).map((k) => (
                  <option key={k} value={k}>{PRODUCTION_KIND_LABELS[k]}</option>
                ))}
              </select>
              <p style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted, #5a5a5a)', margin: '0.25rem 0 0' }}>
                Workshops also appear in the Learning Hub.
              </p>
            </div>
            <div style={{ flex: '1 1 120px' }}>
              <label style={lbl} htmlFor="prod-order">Order on the page</label>
              <input
                id="prod-order" type="number" style={inp} value={form.sort_order}
                onChange={(e) => set('sort_order', Number(e.target.value) || 0)}
              />
              <p style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted, #5a5a5a)', margin: '0.25rem 0 0' }}>
                Lower numbers come first.
              </p>
            </div>
          </div>

          <div style={row}>
            <label style={lbl} htmlFor="prod-slug">Web address</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted, #5a5a5a)' }}>/projects/</span>
              <input
                id="prod-slug" type="text" style={{ ...inp, flex: '1 1 200px' }}
                value={form.slug || slugify(form.title)}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value, slugTouched: true }))}
                placeholder="creative-access-intensive"
              />
            </div>
            <p style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted, #5a5a5a)', margin: '0.25rem 0 0' }}>
              Filled in from the title. {form.id ? 'Changing it changes the link, so any link you already shared will stop working.' : 'You can change it before publishing.'}
            </p>
          </div>

          <ProjectIconPicker
            value={form.desktop_icon}
            onChange={(key) => set('desktop_icon', key)}
            kind={form.kind}
            kindLabel={PRODUCTION_KIND_LABELS[form.kind]}
          />

          <div style={row}>
            <label style={lbl} htmlFor="prod-summary">Short summary</label>
            <textarea
              id="prod-summary" rows={3} style={{ ...inp, minHeight: 72 }} value={form.summary}
              onChange={(e) => set('summary', e.target.value)}
              placeholder="One or two sentences. This is what shows on the listing card and the calendar."
            />
          </div>
        </fieldset>

        {/* ── The post ── */}
        <fieldset style={card}>
          <legend style={{ fontWeight: 700, fontSize: '0.9375rem', padding: '0 6px', color: 'var(--aac-blue)' }}>
            The post
          </legend>
          <RichTextEditor
            label="Production post"
            value={form.body_html}
            onChange={(html) => set('body_html', html)}
            hint="Write this however you want. Headings, lists, quotes, links and photos all work. This is the main body of the page."
            onRequestImage={undefined}
          />
        </fieldset>

        {/* ── Photos ── */}
        <fieldset style={card}>
          <legend style={{ fontWeight: 700, fontSize: '0.9375rem', padding: '0 6px', color: 'var(--aac-blue)' }}>
            Photos
          </legend>

          <div style={{ marginBottom: '1.25rem' }}>
            <p style={{ ...lbl, marginBottom: 6 }}>Main photo, shown at the top of the page</p>
            <ProductionPhotoUploader
              productionId={form.id ?? 'new'}
              photos={form.hero}
              onChange={(photos) => set('hero', photos)}
              single
              label="Main photo"
            />
          </div>

          <div>
            <p style={{ ...lbl, marginBottom: 6 }}>Photo gallery</p>
            <ProductionPhotoUploader
              productionId={form.id ?? 'new'}
              photos={form.gallery}
              onChange={(photos) => set('gallery', photos)}
              label="Gallery photos"
            />
          </div>
        </fieldset>

        {/* ── Dates ── */}
        <fieldset style={card}>
          <legend style={{ fontWeight: 700, fontSize: '0.9375rem', padding: '0 6px', color: 'var(--aac-blue)' }}>
            When and where
          </legend>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted, #5a5a5a)', marginTop: 0, marginBottom: '0.75rem' }}>
            Add one block per date. A show that runs online in September and in person in November is one production with two dates, each with its own venue and ticket link.
          </p>

          <div style={row}>
            <label style={lbl} htmlFor="prod-schedule-note">Schedule in your own words (optional)</label>
            <input
              id="prod-schedule-note" type="text" style={inp} value={form.schedule_note}
              onChange={(e) => set('schedule_note', e.target.value)}
              placeholder="Two half days, September 5 and 6, 10am to 2pm each day"
            />
          </div>

          {form.dates.map((d, i) => (
            <div key={d.key} style={{
              border: '1px solid var(--color-border, #c8c4bc)', borderRadius: 4,
              padding: '0.875rem', marginBottom: '0.75rem',
              background: d.is_visible ? '#fbfaf7' : '#f0eee8',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.625rem', gap: '0.5rem', flexWrap: 'wrap' }}>
                <strong style={{ fontSize: '0.875rem', color: 'var(--aac-blue)' }}>
                  Date {i + 1}{d.label ? `: ${d.label}` : ''}
                </strong>
                <button
                  type="button" onClick={() => delDate(i)} style={btn('danger')}
                  aria-label={`Remove date ${i + 1}`}
                >Remove date</button>
              </div>

              <div style={row}>
                <label style={lbl} htmlFor={`d-label-${d.key}`}>Name for this date (optional)</label>
                <input
                  id={`d-label-${d.key}`} type="text" style={inp} value={d.label}
                  onChange={(e) => updDate(i, { label: e.target.value })}
                  placeholder="Opening night, or Day 1, or November run"
                />
              </div>

              <div style={row2}>
                <div style={{ flex: '1 1 150px' }}>
                  <label style={lbl} htmlFor={`d-sd-${d.key}`}>Start date</label>
                  <input
                    id={`d-sd-${d.key}`} type="date" style={inp} value={d.start_date}
                    onChange={(e) => updDate(i, { start_date: e.target.value })}
                  />
                </div>
                {!d.is_all_day && (
                  <div style={{ flex: '1 1 120px' }}>
                    <label style={lbl} htmlFor={`d-st-${d.key}`}>Start time</label>
                    <input
                      id={`d-st-${d.key}`} type="time" style={inp} value={d.start_time}
                      onChange={(e) => updDate(i, { start_time: e.target.value })}
                    />
                  </div>
                )}
                <div style={{ flex: '1 1 150px' }}>
                  <label style={lbl} htmlFor={`d-ed-${d.key}`}>End date (optional)</label>
                  <input
                    id={`d-ed-${d.key}`} type="date" style={inp} value={d.end_date}
                    onChange={(e) => updDate(i, { end_date: e.target.value })}
                  />
                </div>
                {!d.is_all_day && (
                  <div style={{ flex: '1 1 120px' }}>
                    <label style={lbl} htmlFor={`d-et-${d.key}`}>End time (optional)</label>
                    <input
                      id={`d-et-${d.key}`} type="time" style={inp} value={d.end_time}
                      onChange={(e) => updDate(i, { end_time: e.target.value })}
                    />
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8125rem', minHeight: 44 }}>
                  <input
                    type="checkbox" checked={d.is_all_day}
                    onChange={(e) => updDate(i, { is_all_day: e.target.checked })}
                    style={{ width: 20, height: 20 }}
                  />
                  All day
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8125rem', minHeight: 44 }}>
                  <input
                    type="checkbox" checked={d.is_sold_out}
                    onChange={(e) => updDate(i, { is_sold_out: e.target.checked })}
                    style={{ width: 20, height: 20 }}
                  />
                  Sold out
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8125rem', minHeight: 44 }}>
                  <input
                    type="checkbox" checked={d.is_visible}
                    onChange={(e) => updDate(i, { is_visible: e.target.checked })}
                    style={{ width: 20, height: 20 }}
                  />
                  Show this date publicly
                </label>
              </div>

              <div style={row}>
                <label style={lbl} htmlFor={`d-lt-${d.key}`}>Online or in person</label>
                <select
                  id={`d-lt-${d.key}`} style={inp} value={d.location_type}
                  onChange={(e) => updDate(i, { location_type: e.target.value as DateRow['location_type'] })}
                >
                  <option value="in-person">In person</option>
                  <option value="online">Online</option>
                  <option value="hybrid">Online and in person</option>
                </select>
              </div>

              {d.location_type !== 'online' && (
                <>
                  <div style={row2}>
                    <div style={{ flex: '1 1 200px' }}>
                      <label style={lbl} htmlFor={`d-vn-${d.key}`}>Venue name</label>
                      <input
                        id={`d-vn-${d.key}`} type="text" style={inp} value={d.venue_name}
                        onChange={(e) => updDate(i, { venue_name: e.target.value })}
                        placeholder="The Wilma Theater"
                      />
                    </div>
                    <div style={{ flex: '2 1 260px' }}>
                      <label style={lbl} htmlFor={`d-va-${d.key}`}>Street address</label>
                      <input
                        id={`d-va-${d.key}`} type="text" style={inp} value={d.venue_address}
                        onChange={(e) => updDate(i, { venue_address: e.target.value })}
                        placeholder="265 S Broad St, Philadelphia, PA 19107"
                      />
                    </div>
                  </div>
                  <div style={row}>
                    <label style={lbl} htmlFor={`d-vnote-${d.key}`}>Getting in, parking, entrance notes</label>
                    <input
                      id={`d-vnote-${d.key}`} type="text" style={inp} value={d.venue_note}
                      onChange={(e) => updDate(i, { venue_note: e.target.value })}
                      placeholder="Step free entrance on Spruce Street, elevator to the second floor"
                    />
                  </div>
                </>
              )}

              {d.location_type !== 'in-person' && (
                <div style={row2}>
                  <div style={{ flex: '2 1 260px' }}>
                    <label style={lbl} htmlFor={`d-ou-${d.key}`}>Link to join online</label>
                    <input
                      id={`d-ou-${d.key}`} type="url" style={inp} value={d.online_url}
                      onChange={(e) => updDate(i, { online_url: e.target.value })}
                      placeholder="https://zoom.us/j/..."
                    />
                  </div>
                  <div style={{ flex: '1 1 200px' }}>
                    <label style={lbl} htmlFor={`d-on-${d.key}`}>Note about joining</label>
                    <input
                      id={`d-on-${d.key}`} type="text" style={inp} value={d.online_note}
                      onChange={(e) => updDate(i, { online_note: e.target.value })}
                      placeholder="Link goes out the morning of"
                    />
                  </div>
                </div>
              )}

              <div style={row2}>
                <div style={{ flex: '2 1 260px' }}>
                  <label style={lbl} htmlFor={`d-tu-${d.key}`}>Ticket link for this date</label>
                  <input
                    id={`d-tu-${d.key}`} type="url" style={inp} value={d.ticket_url}
                    onChange={(e) => updDate(i, { ticket_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div style={{ flex: '1 1 200px' }}>
                  <label style={lbl} htmlFor={`d-note-${d.key}`}>Anything else about this date</label>
                  <input
                    id={`d-note-${d.key}`} type="text" style={inp} value={d.note}
                    onChange={(e) => updDate(i, { note: e.target.value })}
                    placeholder="ASL interpreted performance"
                  />
                </div>
              </div>
            </div>
          ))}

          <button type="button" onClick={addDate} style={btn('outline')}>+ Add a date</button>
        </fieldset>

        {/* ── Presenters ── */}
        <fieldset style={card}>
          <legend style={{ fontWeight: 700, fontSize: '0.9375rem', padding: '0 6px', color: 'var(--aac-blue)' }}>
            Who is presenting
          </legend>

          {form.presenters.map((p, i) => (
            <div key={i} style={{ border: '1px solid var(--color-border, #c8c4bc)', borderRadius: 4, padding: '0.875rem', marginBottom: '0.75rem', background: '#fbfaf7' }}>
              <div style={row2}>
                <div style={{ flex: '1 1 200px' }}>
                  <label style={lbl} htmlFor={`p-name-${i}`}>Name</label>
                  <input
                    id={`p-name-${i}`} type="text" style={inp} value={p.name}
                    onChange={(e) => updPresenter(i, { name: e.target.value })}
                    placeholder="Mary Kate Ashe"
                  />
                </div>
                <div style={{ flex: '1 1 200px' }}>
                  <label style={lbl} htmlFor={`p-role-${i}`}>Role</label>
                  <input
                    id={`p-role-${i}`} type="text" style={inp} value={p.role ?? ''}
                    onChange={(e) => updPresenter(i, { role: e.target.value })}
                    placeholder="Facilitator, or Director, or ASL Interpreter"
                  />
                </div>
              </div>
              <div style={row}>
                <label style={lbl} htmlFor={`p-bio-${i}`}>Short bio</label>
                <textarea
                  id={`p-bio-${i}`} rows={3} style={{ ...inp, minHeight: 72 }} value={p.bio ?? ''}
                  onChange={(e) => updPresenter(i, { bio: e.target.value })}
                />
              </div>
              <div style={row2}>
                <div style={{ flex: '1 1 160px' }}>
                  <label style={lbl} htmlFor={`p-ll-${i}`}>Link label</label>
                  <input
                    id={`p-ll-${i}`} type="text" style={inp} value={p.link_label ?? ''}
                    onChange={(e) => updPresenter(i, { link_label: e.target.value })}
                    placeholder="Their website"
                  />
                </div>
                <div style={{ flex: '2 1 240px' }}>
                  <label style={lbl} htmlFor={`p-lu-${i}`}>Link address</label>
                  <input
                    id={`p-lu-${i}`} type="url" style={inp} value={p.link_url ?? ''}
                    onChange={(e) => updPresenter(i, { link_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              </div>
              <div style={row}>
                <label style={lbl} htmlFor={`p-pid-${i}`}>Collective profile ID (optional)</label>
                <input
                  id={`p-pid-${i}`} type="text" style={inp} value={p.profile_id ?? ''}
                  onChange={(e) => updPresenter(i, { profile_id: e.target.value })}
                  placeholder="Paste a member's profile ID to link their credit to their directory page"
                />
              </div>
              <button
                type="button" onClick={() => delPresenter(i)} style={btn('danger')}
                aria-label={`Remove presenter ${p.name || i + 1}`}
              >Remove presenter</button>
            </div>
          ))}

          <button type="button" onClick={addPresenter} style={btn('outline')}>+ Add a presenter</button>
        </fieldset>

        {/* ── Tickets ── */}
        <fieldset style={card}>
          <legend style={{ fontWeight: 700, fontSize: '0.9375rem', padding: '0 6px', color: 'var(--aac-blue)' }}>
            Tickets and payment
          </legend>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted, #5a5a5a)', marginTop: 0 }}>
            Each row becomes a button on the page. The link can go anywhere you take payment: Eventbrite, a Stripe payment link, PayPal, Venmo.
          </p>

          {form.ticket_tiers.map((t, i) => (
            <div key={i} style={{ border: '1px solid var(--color-border, #c8c4bc)', borderRadius: 4, padding: '0.875rem', marginBottom: '0.75rem', background: '#fbfaf7' }}>
              <div style={row2}>
                <div style={{ flex: '1 1 180px' }}>
                  <label style={lbl} htmlFor={`t-label-${i}`}>What to call it</label>
                  <input
                    id={`t-label-${i}`} type="text" style={inp} value={t.label}
                    onChange={(e) => updTier(i, { label: e.target.value })}
                    placeholder="General admission"
                  />
                </div>
                <div style={{ flex: '1 1 160px' }}>
                  <label style={lbl} htmlFor={`t-price-${i}`}>Price, in words</label>
                  <input
                    id={`t-price-${i}`} type="text" style={inp} value={t.price_text ?? ''}
                    onChange={(e) => updTier(i, { price_text: e.target.value })}
                    placeholder="Sliding scale, $15 to $40"
                  />
                </div>
              </div>
              <div style={row}>
                <label style={lbl} htmlFor={`t-url-${i}`}>Where people pay</label>
                <input
                  id={`t-url-${i}`} type="url" style={inp} value={t.url ?? ''}
                  onChange={(e) => updTier(i, { url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div style={row}>
                <label style={lbl} htmlFor={`t-note-${i}`}>Note (optional)</label>
                <input
                  id={`t-note-${i}`} type="text" style={inp} value={t.note ?? ''}
                  onChange={(e) => updTier(i, { note: e.target.value })}
                  placeholder="No one turned away for lack of funds"
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8125rem', minHeight: 44 }}>
                  <input
                    type="checkbox" checked={!!t.sold_out}
                    onChange={(e) => updTier(i, { sold_out: e.target.checked })}
                    style={{ width: 20, height: 20 }}
                  />
                  Sold out
                </label>
                <button
                  type="button" onClick={() => delTier(i)} style={btn('danger')}
                  aria-label={`Remove ticket type ${t.label || i + 1}`}
                >Remove</button>
              </div>
            </div>
          ))}

          <button type="button" onClick={addTier} style={btn('outline')}>+ Add a ticket type</button>

          <div style={{ ...row, marginTop: '1rem' }}>
            <label style={lbl} htmlFor="prod-price-note">Anything else about money</label>
            <textarea
              id="prod-price-note" rows={2} style={{ ...inp, minHeight: 60 }} value={form.price_note}
              onChange={(e) => set('price_note', e.target.value)}
              placeholder="Free for Deaf and disabled patrons. Email us and we will sort it out, no questions asked."
            />
          </div>
        </fieldset>

        {/* ── Access ── */}
        <fieldset style={card}>
          <legend style={{ fontWeight: 700, fontSize: '0.9375rem', padding: '0 6px', color: 'var(--aac-blue)' }}>
            Accessibility
          </legend>
          <fieldset style={{ border: 'none', padding: 0, margin: '0 0 0.75rem' }}>
            <legend style={{ ...lbl, padding: 0 }}>What is in place for this production</legend>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
              {PRODUCTION_ACCESS_OPTIONS.map((feature) => {
                const on = form.access_features.includes(feature);
                return (
                  <label
                    key={feature}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '0 12px', minHeight: 44, borderRadius: 22,
                      border: `1px solid ${on ? 'var(--aac-blue)' : 'var(--color-border, #c8c4bc)'}`,
                      background: on ? 'var(--aac-blue-light, #d8dcf5)' : '#fff',
                      fontSize: '0.8125rem', cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox" checked={on}
                      onChange={() => toggleAccess(feature)}
                      style={{ width: 18, height: 18 }}
                    />
                    {feature}
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div style={row}>
            <label style={lbl} htmlFor="prod-access-note">Access details in your own words</label>
            <textarea
              id="prod-access-note" rows={3} style={{ ...inp, minHeight: 72 }} value={form.access_note}
              onChange={(e) => set('access_note', e.target.value)}
              placeholder="ASL interpreted both days. Captions on every video. Tell us what you need and we will make it happen."
            />
          </div>

          <div style={row}>
            <label style={lbl} htmlFor="prod-contact">Who to email about access</label>
            <input
              id="prod-contact" type="email" style={inp} value={form.contact_email}
              onChange={(e) => set('contact_email', e.target.value)}
              placeholder="access@artisticaccessibility.com"
            />
          </div>
        </fieldset>

        {/* ── Links + RSVP ── */}
        <fieldset style={card}>
          <legend style={{ fontWeight: 700, fontSize: '0.9375rem', padding: '0 6px', color: 'var(--aac-blue)' }}>
            Extra links and attending
          </legend>

          {form.links.map((l, i) => (
            <div key={i} style={row2}>
              <div style={{ flex: '1 1 160px' }}>
                <label style={lbl} htmlFor={`l-label-${i}`}>Link label</label>
                <input
                  id={`l-label-${i}`} type="text" style={inp} value={l.label}
                  onChange={(e) => updLink(i, { label: e.target.value })}
                  placeholder="Read the press release"
                />
              </div>
              <div style={{ flex: '2 1 240px' }}>
                <label style={lbl} htmlFor={`l-url-${i}`}>Address</label>
                <input
                  id={`l-url-${i}`} type="url" style={inp} value={l.url}
                  onChange={(e) => updLink(i, { url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button
                  type="button" onClick={() => delLink(i)} style={btn('danger')}
                  aria-label={`Remove link ${l.label || i + 1}`}
                >Remove</button>
              </div>
            </div>
          ))}
          <button type="button" onClick={addLink} style={btn('outline')}>+ Add a link</button>

          <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border, #c8c4bc)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.875rem', minHeight: 44 }}>
              <input
                type="checkbox" checked={form.rsvp_enabled}
                onChange={(e) => set('rsvp_enabled', e.target.checked)}
                style={{ width: 20, height: 20 }}
              />
              Let signed in people mark themselves as attending
            </label>
            {form.rsvp_enabled && (
              <div style={{ ...row, maxWidth: 260, marginTop: '0.5rem' }}>
                <label style={lbl} htmlFor="prod-cap">Cap on how many (optional)</label>
                <input
                  id="prod-cap" type="number" min={1} style={inp} value={form.rsvp_capacity}
                  onChange={(e) => set('rsvp_capacity', e.target.value)}
                  placeholder="Leave blank for no limit"
                />
              </div>
            )}
          </div>
        </fieldset>

        {/* ── Save bar ── */}
        <div style={{
          display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center',
          padding: '1rem', background: '#ece9d8', borderRadius: 6,
          border: '1px solid var(--color-border, #c8c4bc)', marginBottom: '1rem',
        }}>
          <button type="button" onClick={() => void handleSave(false)} disabled={saving} style={btn('ghost')}>
            {saving ? 'Saving…' : 'Save as draft'}
          </button>
          <button type="button" onClick={() => void handleSave(true)} disabled={saving} style={btn('primary')}>
            {saving ? 'Saving…' : form.status === 'published' ? 'Save and keep live' : 'Publish'}
          </button>
          <button
            type="button"
            onClick={() => { setMode('list'); setSaveErr(''); }}
            disabled={saving}
            style={btn('ghost')}
          >
            Cancel
          </button>
          {form.id && (
            <a
              href={`/projects/${form.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ ...btn('outline'), display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}
            >
              Preview page
            </a>
          )}
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted, #5a5a5a)', margin: 0, flex: '1 1 200px' }}>
            {form.status === 'published'
              ? 'This production is live right now.'
              : 'Drafts are only visible to admins, and stay off the calendar.'}
          </p>
        </div>
      </div>
    );
  }

  // ── List view ──────────────────────────────────────────────────────────────

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--aac-blue)' }}>
            Artistic Accessibility Productions
          </h3>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted, #5a5a5a)', margin: '0.25rem 0 0' }}>
            Our own shows, workshops and projects. These appear at{' '}
            <a href="/projects" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--aac-blue)' }}>/projects</a>
            {' '}and on the calendar once published.
          </p>
        </div>
        <button type="button" onClick={startNew} style={btn('primary')}>+ New production</button>
      </div>

      {saveMsg && (
        <p role="status" aria-live="polite" style={{ padding: '0.625rem 0.75rem', background: '#d6f0dc', color: '#125c2a', borderRadius: 4, marginBottom: '1rem', fontSize: '0.875rem' }}>
          {saveMsg}
        </p>
      )}
      {saveErr && (
        <p role="alert" style={{ padding: '0.625rem 0.75rem', background: '#fdeceb', color: '#8e1a11', borderRadius: 4, marginBottom: '1rem', fontSize: '0.875rem' }}>
          {saveErr}
        </p>
      )}
      {loadError && (
        <p role="alert" style={{ fontSize: '0.875rem', color: '#8e1a11' }}>{loadError}</p>
      )}

      {productions.length === 0 ? (
        <div style={{ ...card, textAlign: 'center', padding: '2rem 1rem' }}>
          <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>No productions yet.</p>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted, #5a5a5a)', marginBottom: '1rem' }}>
            Hit New production to write the first one. It saves as a draft, so nothing goes public until you say so.
          </p>
          <button type="button" onClick={startNew} style={btn('primary')}>+ New production</button>
        </div>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {productions.map((p) => {
            const meta = STATUS_META[p.status];
            const next = nextDate(p);
            const visibleDates = p.dates.filter((d) => d.is_visible);
            const rsvps = rsvpCounts[p.id] ?? 0;
            return (
              <li key={p.id} style={card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 1 260px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                      <span style={{
                        fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase',
                        letterSpacing: '0.04em', padding: '3px 8px', borderRadius: 3,
                        background: meta.bg, color: meta.fg,
                      }}>
                        {meta.label}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted, #5a5a5a)' }}>
                        {PRODUCTION_KIND_LABELS[p.kind]}
                      </span>
                    </div>
                    <p style={{ fontSize: '1.0625rem', fontWeight: 700, margin: '0 0 0.25rem', color: 'var(--aac-blue)' }}>
                      {p.title}
                    </p>
                    {p.tagline && (
                      <p style={{ fontSize: '0.875rem', margin: '0 0 0.375rem', color: '#333' }}>{p.tagline}</p>
                    )}
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted, #5a5a5a)', margin: 0 }}>
                      /projects/{p.slug}
                      {visibleDates.length > 0 && (
                        <> · {visibleDates.length} date{visibleDates.length === 1 ? '' : 's'}</>
                      )}
                      {next && <> · next: {formatDateShort(next)}</>}
                      {!next && visibleDates.length > 0 && <> · all dates have passed</>}
                      {visibleDates.length === 0 && <> · no dates yet</>}
                    </p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', flexShrink: 0 }}>
                    <button type="button" onClick={() => startEdit(p)} style={btn('primary')}>Edit</button>
                    <button type="button" onClick={() => void togglePublish(p)} style={btn('outline')}>
                      {p.status === 'published' ? 'Unpublish' : 'Publish'}
                    </button>
                    <button type="button" onClick={() => openAttendees(p)} style={btn('ghost')}>
                      Attending ({rsvps})
                    </button>
                    {deleteConfirm === p.id ? (
                      <div style={{ display: 'flex', gap: '0.375rem' }}>
                        <button type="button" onClick={() => void handleDelete(p)} style={btn('danger')}>
                          Really delete
                        </button>
                        <button type="button" onClick={() => setDeleteConfirm(null)} style={btn('ghost')}>
                          Keep
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button" onClick={() => setDeleteConfirm(p.id)} style={btn('danger')}
                        aria-label={`Delete ${p.title}`}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>

                {deleteConfirm === p.id && (
                  <p role="alert" style={{ fontSize: '0.8125rem', color: '#8e1a11', margin: '0.75rem 0 0' }}>
                    Deleting removes the page, its {p.dates.length} date{p.dates.length === 1 ? '' : 's'},
                    {' '}its {rsvps} attending {rsvps === 1 ? 'person' : 'people'}, and its calendar entries. This cannot be undone.
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ── Attendee list ─────────────────────────────────────────────────────────────

/**
 * Who said they're coming. Read in two queries rather than a join because RSVPs
 * key off auth.users while names live on profiles, and there's no foreign key
 * between them for PostgREST to follow.
 */
function AttendeeList({ production, onBack }: { production: ProductionWithDates; onBack: () => void }) {
  const [rows, setRows] = useState<Array<{
    id: string; user_id: string; production_date_id: string | null; note: string | null; created_at: string;
  }>>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => { headingRef.current?.focus(); }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error: rsvpErr } = await supabase
        .from('production_rsvps')
        .select('id, user_id, production_date_id, note, created_at')
        .eq('production_id', production.id)
        .order('created_at');
      if (cancelled) return;
      if (rsvpErr) { setError(rsvpErr.message); setLoading(false); return; }

      const rsvps = (data ?? []) as typeof rows;
      setRows(rsvps);

      const userIds = Array.from(new Set(rsvps.map((r) => r.user_id)));
      if (userIds.length > 0) {
        const { data: profs } = await supabase
          .from('profiles')
          .select('*')
          .in('user_id', userIds);
        if (cancelled) return;
        const map: Record<string, Profile> = {};
        for (const prof of (profs ?? []) as Profile[]) {
          if (prof.user_id) map[prof.user_id] = prof;
        }
        setProfiles(map);
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [production.id]);

  const byDate = useMemo(() => {
    const groups: Array<{ date: ProductionDate | null; rsvps: typeof rows }> = [];
    for (const d of production.dates) {
      const group = rows.filter((r) => r.production_date_id === d.id);
      if (group.length > 0) groups.push({ date: d, rsvps: group });
    }
    const undated = rows.filter((r) => !r.production_date_id);
    if (undated.length > 0) groups.push({ date: null, rsvps: undated });
    return groups;
  }, [production.dates, rows]);

  /** Tab separated, so it pastes straight into a spreadsheet. */
  const copyList = async () => {
    const lines = ['Name\tEmail\tDate\tNote\tRSVP made'];
    for (const g of byDate) {
      for (const r of g.rsvps) {
        const prof = profiles[r.user_id];
        lines.push([
          prof?.full_name ?? 'Name not on file',
          prof?.email ?? '',
          g.date ? formatDate(g.date) : 'No particular date',
          r.note ?? '',
          new Date(r.created_at).toLocaleDateString('en-US'),
        ].join('\t'));
      }
    }
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setError('');
    } catch {
      setError('Could not copy to the clipboard. You can still read the list below.');
    }
  };

  return (
    <div>
      <button type="button" onClick={onBack} style={{ ...btn('ghost'), marginBottom: '1rem' }}>
        ← Back to productions
      </button>

      <h3
        ref={headingRef} tabIndex={-1}
        style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.25rem', color: 'var(--aac-blue)' }}
      >
        Who is attending {production.title}
      </h3>
      <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted, #5a5a5a)', margin: '0 0 1rem' }}>
        {rows.length} {rows.length === 1 ? 'person has' : 'people have'} marked themselves as attending.
        {production.rsvp_capacity != null && ` Cap is ${production.rsvp_capacity}.`}
        {' '}This is not a ticket list: people who bought tickets elsewhere may not appear here.
      </p>

      {loading && <p role="status" aria-live="polite">Loading the list…</p>}
      {error && <p role="alert" style={{ color: '#8e1a11', fontSize: '0.875rem' }}>{error}</p>}

      {!loading && rows.length === 0 && (
        <p style={{ ...card, fontSize: '0.875rem' }}>Nobody yet.</p>
      )}

      {!loading && rows.length > 0 && (
        <>
          <button type="button" onClick={() => void copyList()} style={{ ...btn('outline'), marginBottom: '1rem' }}>
            Copy the list for a spreadsheet
          </button>

          {byDate.map((g) => (
            <div key={g.date?.id ?? 'undated'} style={card}>
              <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, margin: '0 0 0.75rem', color: 'var(--aac-blue)' }}>
                {g.date ? formatDate(g.date) : 'No particular date'}
                {g.date?.label ? ` · ${g.date.label}` : ''}
                {' '}({g.rsvps.length})
              </h4>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '0.5rem' }}>
                {g.rsvps.map((r) => {
                  const prof = profiles[r.user_id];
                  return (
                    <li key={r.id} style={{
                      padding: '0.5rem 0.625rem', background: '#fbfaf7', borderRadius: 4,
                      border: '1px solid var(--color-border, #c8c4bc)', fontSize: '0.875rem',
                    }}>
                      <strong>{prof?.full_name ?? 'Name not on file'}</strong>
                      {prof?.member_type === 'access_card' && (
                        <span style={{ fontSize: '0.6875rem', marginLeft: 6, padding: '2px 6px', borderRadius: 3, background: '#e6ecfb', color: 'var(--aac-blue)' }}>
                          Access Card
                        </span>
                      )}
                      {prof?.email && (
                        <span style={{ color: 'var(--color-text-muted, #5a5a5a)' }}> · {prof.email}</span>
                      )}
                      {r.note && (
                        <p style={{ margin: '0.25rem 0 0', fontSize: '0.8125rem', color: '#333' }}>
                          <span style={{ fontWeight: 600 }}>They said:</span> {r.note}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
