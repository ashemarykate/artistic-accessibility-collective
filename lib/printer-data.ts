// ── The Printer: shared data ─────────────────────────────────────────────────
// A shared print room: printable checklists, posters, worksheets, and guides.
// Everything here links to a legal, free, print-friendly source.
// Used by both the tray listing (app/printer/page.tsx) and the per-document
// page (app/printer/[slug]/page.tsx).

export const PRINTER_PALETTE = {
  paper:  '#f4f1e8',
  ink:    '#2b2b2b',
  faint:  '#5a5550',
  rule:   '#c9c3b2',
  accent: '#263590',
  green:  '#1d6b4f',
  mono:   '"Courier New", Courier, monospace',
};

export type Printable = {
  slug: string;
  title: string;
  source: string;
  description: string;
  url: string;
  format: string;      // e.g. 'PDF', 'Web page (print friendly)'
  pagesNote?: string;  // e.g. 'One page', 'Poster set'
};

export type Tray = { id: string; label: string; blurb: string; items: Printable[] };

export const TRAYS: Tray[] = [
  {
    id: 'checklists',
    label: 'TRAY 1 · CHECKLISTS',
    blurb: 'Print, walk your venue or website with a pen, and see where you stand.',
    items: [
      {
        slug: 'ada-checklist',
        title: 'ADA Checklist for Existing Facilities',
        source: 'New England ADA Center',
        description: 'The classic printable walk-through checklist for physical access: parking, entrances, restrooms, seating, and signage. The standard first self-assessment for any venue in the United States.',
        url: 'https://adachecklist.org/doc/fullchecklist/ada-checklist.pdf',
        format: 'PDF',
        pagesNote: 'Full checklist',
      },
      {
        slug: 'sins-invalid-access-suggestions',
        title: 'Access Suggestions for Public Events',
        source: 'Sins Invalid',
        description: 'A disability justice checklist for event organizers, going well past compliance: fragrance-free practice, ASL and CART, image description, rest space, and mobility access. Copy-ready.',
        url: 'https://sinsinvalid.org/resources/',
        format: 'Web page (print friendly)',
      },
      {
        slug: 'wcag-quickref',
        title: 'How to Meet WCAG (Quick Reference)',
        source: 'W3C Web Accessibility Initiative',
        description: 'The working WCAG checklist most teams actually use. Filter to Level AA, print your filtered view, and use it for audits and sign-off on your website or digital program.',
        url: 'https://www.w3.org/WAI/WCAG22/quickref/',
        format: 'Web page (print friendly)',
      },
    ],
  },
  {
    id: 'posters',
    label: 'TRAY 2 · POSTERS & SIGNS',
    blurb: 'For the studio wall, the box office, and the volunteer break room.',
    items: [
      {
        slug: 'govuk-dos-donts',
        title: 'Designing for Accessibility: Dos and Don\'ts Posters',
        source: 'UK Home Office',
        description: 'The famous one-page posters covering design for people who are autistic, blind, low vision, D/deaf, dyslexic, or have motor impairments. Creative Commons licensed and made to be printed and hung where a whole team will see them.',
        url: 'https://accessibility.blog.gov.uk/2016/09/02/dos-and-donts-on-designing-for-accessibility/',
        format: 'Poster set (downloadable)',
        pagesNote: '6 posters',
      },
    ],
  },
  {
    id: 'worksheets',
    label: 'TRAY 3 · WORKSHEETS & WORKBOOKS',
    blurb: 'Hands-on materials for workshops, trainings, and your own practice.',
    items: [
      {
        slug: 'alt-text-as-poetry-workbook',
        title: 'Alt Text as Poetry Workbook',
        source: 'Bojana Coklyat & Shannon Finnegan',
        description: 'A free workbook of exercises that treat alt text as a creative practice, not a compliance chore. Perfect for a solo afternoon or a group workshop. Also available as audio and EPUB on the project site.',
        url: 'https://alt-text-as-poetry.net/assets/Alt-Text-as-Poetry-Workbook-PDF-2020-12-01.pdf',
        format: 'PDF',
        pagesNote: 'Full workbook',
      },
      {
        slug: 'dcmp-ad-tip-sheet',
        title: 'Audio Description Tip Sheet',
        source: 'Described and Captioned Media Program',
        description: 'A one-page primer on the core principles of audio description: objective language, present tense, and describing visual identity. The ideal handout for a first AD workshop.',
        url: 'https://dcmp.org/learn/227-audio-description-tip-sheet',
        format: 'Web page (print friendly)',
        pagesNote: 'One page',
      },
    ],
  },
  {
    id: 'guides',
    label: 'TRAY 4 · GUIDES & TOOLKITS',
    blurb: 'Longer reads worth printing, binding, and keeping on the shelf.',
    items: [
      {
        slug: 'fwd-doc-toolkit',
        title: 'FWD-Doc Toolkit for Inclusion & Accessibility',
        source: 'FWD-Doc & Doc Society',
        description: 'The 62-page toolkit on disability inclusion across development, production, post-production, and exhibition, written by disabled documentary makers. The single best print-and-keep guide for filmmakers.',
        url: 'https://fwd-doc.org/toolkit',
        format: 'PDF',
        pagesNote: '62 pages',
      },
      {
        slug: 'graeae-access-rider',
        title: 'How to Create an Access Rider',
        source: 'Graeae Theatre Company',
        description: 'Graeae\'s free guide for disabled artists on writing an access rider: the document that tells venues and producers what you need to do your best work. Pairs well with Access Docs for Artists in our Resources room.',
        url: 'https://graeae.org/resource/how-to-create-an-access-rider/',
        format: 'Web page with downloads',
      },
      {
        slug: 'crpd-full-text',
        title: 'UN Convention on the Rights of Persons with Disabilities',
        source: 'United Nations',
        description: 'The foundational international disability rights treaty. Article 30 guarantees access to cultural life: theater, film, museums, and the arts. Worth having on paper when you need to point at the source.',
        url: 'https://www.un.org/disabilities/documents/convention/convoptprot-e.pdf',
        format: 'PDF',
      },
    ],
  },
];

// ── Map a resources DB row (section='printer') → Printable + its tray ────────
// Admins manage these at /admin → Website Content → Page Content → The Printer.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function dbRowToPrintable(row: any): Printable & { tray: string } {
  return {
    slug:        row.slug ?? row.id,
    title:       row.title ?? '',
    source:      row.author ?? '',
    description: row.description ?? '',
    url:         row.url ?? '',
    format:      (row.format_list ?? []).join(', ') || 'PDF',
    pagesNote:   row.location_note ?? undefined,
    tray:        row.category ?? 'guides',
  };
}

// Static lookup for the detail page: slug → item + which tray it lives in.
// DB-managed items aren't in here (the detail page falls back to Supabase
// for those); this only covers the hardcoded seed items.
export const PRINTER_ITEM_BY_SLUG: Record<string, Printable & { trayId: string; trayLabel: string }> = {};
for (const tray of TRAYS) {
  for (const item of tray.items) {
    PRINTER_ITEM_BY_SLUG[item.slug] = { ...item, trayId: tray.id, trayLabel: tray.label };
  }
}

export const TRAY_LABEL_BY_ID: Record<string, string> = Object.fromEntries(TRAYS.map((t) => [t.id, t.label]));
