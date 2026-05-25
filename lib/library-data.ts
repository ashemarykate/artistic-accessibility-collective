// Library data — books, essays, journals, and working documents
// for the AAC Library.
//
// isFree: true  → url points to legal free access; shown with a FREE badge
// isFree: false → show howToAccess instructions instead of a direct link
// isEssential   → highlighted as a top pick in the UI

export type LibraryItemType =
  | 'book'
  | 'essay'
  | 'article'
  | 'journal'
  | 'zine'
  | 'workbook'
  | 'anthology'
  | 'standard'
  | 'blog'
  | 'toolkit';

export type LibraryItem = {
  slug: string;
  title: string;
  author: string;
  year?: number;
  description: string;
  url?: string;          // legal free-access URL (only when isFree: true)
  type: LibraryItemType;
  category: string;      // matches a LibraryCategory id
  tags: string[];
  isFree: boolean;
  format?: string[];     // e.g. ['PDF', 'Web', 'Audiobook']
  howToAccess?: string;  // for non-free items — how to get them
  isEssential?: boolean;
};

export type LibraryCategory = {
  id: string;
  code: string;
  title: string;
  description: string;
};

export const LIBRARY_CATEGORIES: LibraryCategory[] = [
  { id: 'disability-justice', code: '01', title: 'Disability Justice & Arts', description: 'Foundational frameworks, manifestos, and community writing that grounds this work in justice — not just compliance.' },
  { id: 'first-person',       code: '02', title: 'First-Person Accounts',    description: 'Memoirs, essays, and personal writing by disabled people. This is the primary evidence source — start here.' },
  { id: 'crip-theory',        code: '03', title: 'Crip Theory & Mad Pride',  description: 'Academic and activist writing that theorizes disability as identity, aesthetics, and political force.' },
  { id: 'deaf-culture',       code: '04', title: 'Deaf Culture & ASL',        description: 'Writing on Deaf identity, ASL linguistics, and Deaf history — from inside the culture.' },
  { id: 'theater-performance',code: '05', title: 'Theater & Live Performance', description: 'Scholarship and practice guides on disability in theater, dance, and live performance.' },
  { id: 'audio-description',  code: '06', title: 'Audio Description',         description: 'Standards, training texts, and creative writing about audio description practice.' },
  { id: 'captioning',         code: '07', title: 'Captioning & CART',         description: 'Quality standards, style guides, and expressive captioning research.' },
  { id: 'film-media',         code: '08', title: 'Film & Media',              description: 'Scholarship on disability representation, accessible filmmaking, and disability film culture.' },
  { id: 'digital',            code: '09', title: 'Digital & Web',             description: 'Accessible design, alt text, WCAG guidance, and inclusive UX.' },
  { id: 'syllabi',            code: '10', title: 'Syllabi & Teaching',        description: 'Open-access reading lists, journals, and teaching resources from disability studies programs.' },
];

export const LIBRARY_ITEMS: LibraryItem[] = [

  // ── Disability Justice & Arts ────────────────────────────────────────────────

  {
    slug: 'skin-tooth-and-bone',
    title: 'Skin, Tooth, and Bone: The Basis of Movement Is Our People',
    author: 'Sins Invalid',
    year: 2016,
    description: 'The foundational text of the Disability Justice framework — the 10 Principles that have shaped organizing, arts practice, and access work globally. Short, accessible, visually rich. Every accessibility training should begin here. Free PDF at sinsinvalid.org.',
    url: 'https://sinsinvalid.org/skin-tooth-and-bone',
    type: 'zine',
    category: 'disability-justice',
    tags: ['Disabled Voice', 'Disability Justice', 'Free'],
    isFree: true,
    format: ['PDF', 'Print'],
    isEssential: true,
  },
  {
    slug: 'access-intimacy-the-missing-link',
    title: 'Access Intimacy: The Missing Link',
    author: 'Mia Mingus',
    year: 2011,
    description: 'The essay that introduced the concept of "access intimacy" — the feeling when someone understands your access needs intuitively, without it being a burden or transaction. One of the most widely assigned pieces in the field. Free at Leaving Evidence.',
    url: 'https://leavingevidence.wordpress.com/2011/05/05/access-intimacy-the-missing-link/',
    type: 'essay',
    category: 'disability-justice',
    tags: ['Disabled Voice', 'Disability Justice', 'Free'],
    isFree: true,
    format: ['Web'],
    isEssential: true,
  },
  {
    slug: 'leaving-evidence-blog',
    title: 'Leaving Evidence (Blog Archive)',
    author: 'Mia Mingus',
    year: 2010,
    description: 'Mia Mingus\'s searchable blog archive — essays on access intimacy, transformative justice, disability and race, pod mapping, and access as love. One of the most important ongoing writing projects in the field. Freely available in full.',
    url: 'https://leavingevidence.wordpress.com',
    type: 'blog',
    category: 'disability-justice',
    tags: ['Disabled Voice', 'Disability Justice', 'Free'],
    isFree: true,
    format: ['Web'],
  },
  {
    slug: 'disability-visibility-anthology',
    title: 'Disability Visibility: First-Person Stories from the Twenty-First Century',
    author: 'Alice Wong (ed.)',
    year: 2020,
    description: '37 essays by disabled writers across race, gender, sexuality, and diagnosis — one of the most widely read and accessible entry points to disability culture. Widely available at public libraries, on Bookshare (free for print-disabled individuals), and in paperback.',
    type: 'anthology',
    category: 'disability-justice',
    tags: ['Disabled Voice', 'Disability Justice', 'Anthology'],
    isFree: false,
    howToAccess: 'Available at most public libraries, on Bookshare (free for print-disabled individuals at bookshare.org), and to purchase from Vintage Books ($18 paperback). Large print and audiobook editions exist.',
    isEssential: true,
  },
  {
    slug: 'care-work-dreaming-disability-justice',
    title: 'Care Work: Dreaming Disability Justice',
    author: 'Leah Lakshmi Piepzna-Samarasinha',
    year: 2018,
    description: 'Essays on collective access, care webs, and disabled femme of color experience. One of the most practically useful and beautifully written books in this field — essential for anyone building access into organizations and events, not just into architecture.',
    type: 'book',
    category: 'disability-justice',
    tags: ['Disabled Voice', 'Disability Justice', 'Intersectionality'],
    isFree: false,
    howToAccess: 'Available at many public libraries, on Bookshare (free for print-disabled individuals), and from Arsenal Pulp Press. Ebook and audiobook available.',
    isEssential: true,
  },
  {
    slug: 'the-future-is-disabled',
    title: 'The Future Is Disabled',
    author: 'Leah Lakshmi Piepzna-Samarasinha',
    year: 2022,
    description: 'Follow-up to Care Work — written during and after COVID. Explicitly addresses disabled people\'s pandemic experience, collective access in crisis, and what disability justice looks like after a mass disabling event.',
    type: 'book',
    category: 'disability-justice',
    tags: ['Disabled Voice', 'Disability Justice'],
    isFree: false,
    howToAccess: 'Available from Arsenal Pulp Press, at libraries, and on Bookshare (free for print-disabled individuals).',
  },
  {
    slug: 'disability-visibility-project-essays',
    title: 'Disability Visibility Project — Essays & Media',
    author: 'Alice Wong (curator)',
    year: 2014,
    description: 'Alice Wong\'s curated archive of disability media criticism, cultural commentary, and first-person essays — an ongoing collection of essential reading by disabled writers. Fully free online with transcripts.',
    url: 'https://disabilityvisibilityproject.com/essays',
    type: 'blog',
    category: 'disability-justice',
    tags: ['Disabled Voice', 'Free'],
    isFree: true,
    format: ['Web'],
  },
  {
    slug: 'sins-invalid-10-principles',
    title: 'The 10 Principles of Disability Justice',
    author: 'Sins Invalid',
    year: 2015,
    description: 'The concise statement of the 10 Disability Justice principles — intersectionality, leadership of most impacted, sustainability, cross-movement solidarity, and more. The framework that has shaped the field. Free at the Sins Invalid website.',
    url: 'https://www.sinsinvalid.org/disability-justice-primer',
    type: 'toolkit',
    category: 'disability-justice',
    tags: ['Disabled Voice', 'Disability Justice', 'Free'],
    isFree: true,
    format: ['Web'],
    isEssential: true,
  },
  {
    slug: 'being-heumann',
    title: 'Being Heumann: An Unrepentant Memoir of a Disability Rights Activist',
    author: 'Judith Heumann with Kristen Joiner',
    year: 2020,
    description: 'Judy Heumann led the 504 Sit-In in 1977 — the longest occupation of a federal building in US history — and is arguably the most important disability rights activist in American history. Essential history through first-person narrative.',
    type: 'book',
    category: 'disability-justice',
    tags: ['Disabled Voice', 'Disability History'],
    isFree: false,
    howToAccess: 'Available at most public libraries, on Bookshare (free for print-disabled), and from Beacon Press. Audiobook narrated by Heumann herself.',
  },
  {
    slug: 'disability-history-of-the-united-states',
    title: 'A Disability History of the United States',
    author: 'Kim Nielsen',
    year: 2012,
    description: 'A sweeping historical narrative from precolonial America through the ADA and beyond — disability woven into the full history of the nation. Essential context for understanding how and why disability rights developed the way they did.',
    type: 'book',
    category: 'disability-justice',
    tags: ['Disability History'],
    isFree: false,
    howToAccess: 'Available at most public libraries and from Beacon Press. Widely used in undergraduate courses.',
  },

  // ── First-Person Accounts ────────────────────────────────────────────────────

  {
    slug: 'unspeakable-conversations',
    title: 'Unspeakable Conversations',
    author: 'Harriet McBryde Johnson',
    year: 2003,
    description: 'A 2003 New York Times essay in which disability rights attorney Harriet McBryde Johnson debates philosopher Peter Singer on the value of disabled lives — and refuses to be either tragic or polite about it. A masterpiece of disability rights writing. May require a free NYT account or library card to access.',
    url: 'https://www.nytimes.com/2003/02/16/magazine/unspeakable-conversations.html',
    type: 'essay',
    category: 'first-person',
    tags: ['Disabled Voice', 'Disability Justice'],
    isFree: true,
    format: ['Web'],
    isEssential: true,
  },
  {
    slug: 'too-late-to-die-young',
    title: 'Too Late to Die Young: Nearly True Tales from a Life',
    author: 'Harriet McBryde Johnson',
    year: 2006,
    description: 'Brilliant, funny, fierce memoir by disability rights attorney Harriet McBryde Johnson. Her writing is among the best disability memoir in print — she refuses every tragic or inspirational frame. Widely available in libraries.',
    type: 'book',
    category: 'first-person',
    tags: ['Disabled Voice'],
    isFree: false,
    howToAccess: 'Available at many public libraries and from Picador (now out of print in hardcover; used copies widely available). Check Bookshare for accessible formats.',
  },
  {
    slug: 'haben-the-deafblind-woman',
    title: 'Haben: The DeafBlind Woman Who Conquered Harvard Law',
    author: 'Haben Girma',
    year: 2019,
    description: 'DeafBlind activist and lawyer Haben Girma\'s memoir makes assistive technology and disability rights law concrete and human. One of the most accessible entry points to disability memoir for general audiences.',
    type: 'book',
    category: 'first-person',
    tags: ['Disabled Voice', 'Deaf Culture'],
    isFree: false,
    howToAccess: 'Available at most public libraries, on Bookshare (free for print-disabled), and from Twelve Books. Audiobook available.',
  },
  {
    slug: 'year-of-the-tiger',
    title: 'Year of the Tiger: An Activist\'s Life',
    author: 'Alice Wong',
    year: 2022,
    description: 'Alice Wong\'s memoir — experimental in form, told through fragments, photos, and essays. An honest account of disabled Asian American activist life: the labor, the joy, the exhaustion, the community. A model for what disability writing can look like when it refuses linear narrative.',
    type: 'book',
    category: 'first-person',
    tags: ['Disabled Voice', 'Disability Justice', 'Intersectionality'],
    isFree: false,
    howToAccess: 'Available at many public libraries, on Bookshare, and from Vintage Books.',
  },
  {
    slug: 'brilliant-imperfection',
    title: 'Brilliant Imperfection: Grappling with Cure',
    author: 'Eli Clare',
    year: 2017,
    description: 'Essential on the politics of cure and the intersection of trans and disability experience. Clare writes at the edge of what disability theory and disability memoir can do — beautifully.',
    type: 'book',
    category: 'first-person',
    tags: ['Disabled Voice', 'Crip Theory', 'Intersectionality'],
    isFree: false,
    howToAccess: 'Available at many public libraries and from Duke University Press. Audiobook available.',
  },

  // ── Crip Theory & Mad Pride ─────────────────────────────────────────────────

  {
    slug: 'feminist-queer-crip',
    title: 'Feminist, Queer, Crip',
    author: 'Alison Kafer',
    year: 2013,
    description: 'The most readable and rigorous intersection of feminist, queer, and disability politics. Essential on "curative time" — the assumption that disabled people\'s futures require cure rather than accommodation. Widely used in graduate courses worldwide.',
    type: 'book',
    category: 'crip-theory',
    tags: ['Crip Theory', 'Intersectionality'],
    isFree: false,
    howToAccess: 'Available at most academic and many public libraries, and from Indiana University Press. A standard text for graduate disability studies courses.',
    isEssential: true,
  },
  {
    slug: 'crip-theory-mcRuer',
    title: 'Crip Theory: Cultural Signs of Queerness and Disability',
    author: 'Robert McRuer',
    year: 2006,
    description: 'The book that named the field. McRuer argues that compulsory able-bodiedness and compulsory heterosexuality are structurally related — and that crip and queer resistance share common ground. Dense but essential.',
    type: 'book',
    category: 'crip-theory',
    tags: ['Crip Theory'],
    isFree: false,
    howToAccess: 'Available at most academic libraries and from NYU Press.',
  },
  {
    slug: 'disability-theory-siebers',
    title: 'Disability Theory',
    author: 'Tobin Siebers',
    year: 2008,
    description: 'A clear and rigorous introduction to disability as an academic field — one of the most accessible entry points into disability studies theory. Covers the medical model, social model, and minority model; engages with identity politics, aesthetics, and embodiment.',
    type: 'book',
    category: 'crip-theory',
    tags: ['Crip Theory', 'Disability Studies'],
    isFree: false,
    howToAccess: 'Available at most academic libraries and from University of Michigan Press.',
  },
  {
    slug: 'disability-studies-quarterly',
    title: 'Disability Studies Quarterly — Full Archive',
    author: 'Society for Disability Studies',
    year: 1982,
    description: 'The most important open-access peer-reviewed journal in disability studies — published since 1982, freely available online in full. Covers arts, culture, media, law, and history. Searchable archive is one of the best free research resources in the field.',
    url: 'https://dsq-sds.org',
    type: 'journal',
    category: 'crip-theory',
    tags: ['Open Access', 'Free', 'Academic'],
    isFree: true,
    format: ['Web'],
    isEssential: true,
  },

  // ── Deaf Culture & ASL ───────────────────────────────────────────────────────

  {
    slug: 'deaf-in-america',
    title: 'Deaf in America: Voices from a Culture',
    author: 'Carol Padden & Tom Humphries',
    year: 1988,
    description: 'The foundational text of Deaf cultural studies — written from inside the culture by Deaf scholars. Essential first read for any hearing practitioner working with Deaf artists or audiences. Establishes the cultural/linguistic model of Deafness.',
    type: 'book',
    category: 'deaf-culture',
    tags: ['Deaf Culture', 'Disabled Voice'],
    isFree: false,
    howToAccess: 'Available at most academic libraries and many public libraries. Published by Harvard University Press.',
    isEssential: true,
  },
  {
    slug: 'nad-position-papers',
    title: 'National Association of the Deaf — Position Papers',
    author: 'National Association of the Deaf (NAD)',
    description: 'Free position papers from the leading US Deaf advocacy organization — on cochlear implants, ASL recognition, captioning quality, Deaf civil rights, and more. This is what the Deaf community itself says about these issues — not what hearing organizations say about Deaf people.',
    url: 'https://www.nad.org/resources/technology/telephone-and-relay-services/',
    type: 'toolkit',
    category: 'deaf-culture',
    tags: ['Deaf Culture', 'Disabled Voice', 'Free'],
    isFree: true,
    format: ['Web'],
  },
  {
    slug: 'through-deaf-eyes-companion',
    title: 'Through Deaf Eyes: A Documentary History of Deaf America',
    author: 'Brenda Jo Brueggemann (ed.)',
    year: 2007,
    description: 'The companion volume to the PBS documentary — a documentary history of Deaf America covering education, arts, technology, and community. Produced alongside the 2007 PBS series.',
    type: 'anthology',
    category: 'deaf-culture',
    tags: ['Deaf Culture'],
    isFree: false,
    howToAccess: 'Available at most academic libraries and from Gallaudet University Press. The PBS documentary is free to watch at pbs.org.',
  },

  // ── Theater & Live Performance ───────────────────────────────────────────────

  {
    slug: 'bodies-in-commotion',
    title: 'Bodies in Commotion: Disability and Performance',
    author: 'Carrie Sandahl & Philip Auslander (eds.)',
    year: 2005,
    description: 'The essential academic anthology on disability in theater, dance, and performance art. Essays from performers, scholars, and critics — covering crip aesthetics, access as artistic practice, and the politics of the disabled body on stage. Standard text for graduate performance studies.',
    type: 'anthology',
    category: 'theater-performance',
    tags: ['Disability Arts', 'Performance'],
    isFree: false,
    howToAccess: 'Available at most academic libraries and from University of Michigan Press.',
    isEssential: true,
  },
  {
    slug: 'disability-culture-community-performance',
    title: 'Disability Culture and Community Performance',
    author: 'Petra Kuppers',
    year: 2011,
    description: 'Petra Kuppers\' rigorous and generous book on community performance with and by disabled people — moving between theory and practice, international and community contexts. Essential for anyone working in disability arts at the community level.',
    type: 'book',
    category: 'theater-performance',
    tags: ['Disability Arts', 'Performance'],
    isFree: false,
    howToAccess: 'Available at academic libraries and from Palgrave Macmillan.',
  },
  {
    slug: 'howlround-disability-archive',
    title: 'HowlRound — Disability & Accessibility Archive',
    author: 'HowlRound Theatre Commons',
    description: 'Free, searchable archive of essays, articles, and recorded conversations on disability aesthetics, accessibility in theater, and disabled theater artists. Published continuously; globally accessible; one of the best ongoing free resources for disability in theater.',
    url: 'https://howlround.com/tags/disability-and-accessibility',
    type: 'blog',
    category: 'theater-performance',
    tags: ['Disability Arts', 'Theater', 'Free'],
    isFree: true,
    format: ['Web'],
  },

  // ── Audio Description ────────────────────────────────────────────────────────

  {
    slug: 'more-than-meets-the-eye',
    title: 'More Than Meets the Eye: What Blindness Brings to Art',
    author: 'Georgina Kleege',
    year: 2018,
    description: 'Rigorous, accessible, and beautiful — Kleege argues that audio description is not a neutral transcription but a creative act that reflects the describer\'s assumptions, aesthetics, and values. Essential for anyone working on AD as artistic practice, not just compliance.',
    type: 'book',
    category: 'audio-description',
    tags: ['Disabled Voice', 'Audio Description'],
    isFree: false,
    howToAccess: 'Available at many academic libraries and from Oxford University Press.',
    isEssential: true,
  },
  {
    slug: 'adlab-international-guidelines',
    title: 'ADLAB International Guidelines for Audio Description',
    author: 'ADLAB Project (EU-funded consortium)',
    year: 2014,
    description: 'The most comprehensive AD guidelines available — covering theory, methodology, and practical guidance across media formats. EU-funded; free PDF. The most widely cited international AD standard and the place to start for understanding the full scope of the practice.',
    url: 'https://www.adlabproject.eu/Docs/adlab%20book/',
    type: 'standard',
    category: 'audio-description',
    tags: ['Audio Description', 'Free', 'Open Access'],
    isFree: true,
    format: ['PDF'],
    isEssential: true,
  },
  {
    slug: 'dcmp-audio-description-tip-sheet',
    title: 'DCMP Audio Description Tip Sheet',
    author: 'Described and Captioned Media Program',
    description: 'One-page free guide covering core AD principles: objective language, present tense, visual identity description including race and disability. A perfect starting handout for workshops or AD training. Free from the federally-funded DCMP.',
    url: 'https://dcmp.org/learn/227-audio-description-tip-sheet',
    type: 'toolkit',
    category: 'audio-description',
    tags: ['Audio Description', 'Free'],
    isFree: true,
    format: ['PDF', 'Web'],
  },
  {
    slug: 'the-visual-made-verbal',
    title: 'The Visual Made Verbal: A Comprehensive Training Manual and Guide to the History and Applications of Audio Description',
    author: 'Joel Snyder',
    year: 2014,
    description: 'The professional training manual for audio description in the US — written by one of the field\'s veteran practitioners and former director of the American Council of the Blind\'s Audio Description Project. The standard reference for AD training programs.',
    type: 'book',
    category: 'audio-description',
    tags: ['Audio Description'],
    isFree: false,
    howToAccess: 'Available from the American Council of the Blind and through audio description training programs. Check with ACB at adp.acb.org for current availability.',
  },

  // ── Captioning & CART ────────────────────────────────────────────────────────

  {
    slug: 'dcmp-captioning-key',
    title: 'DCMP Captioning Key',
    author: 'Described and Captioned Media Program',
    description: 'The most detailed and widely-used quality standard for captions in educational media — and broadly applied across the industry. Covers accuracy, placement, speaker identification, timing, and sound effects. Free from the federally-funded DCMP. The US captioner\'s primary reference.',
    url: 'https://dcmp.org/learn/captioningkey',
    type: 'standard',
    category: 'captioning',
    tags: ['Captioning', 'Free', 'Standard'],
    isFree: true,
    format: ['Web'],
    isEssential: true,
  },
  {
    slug: 'caption-with-intention',
    title: 'Caption with Intention — Open-Source Design System',
    author: 'Caption with Intention Project',
    year: 2023,
    description: 'The defining resource on expressive/creative captioning — developed with the Deaf community, recognized by the Academy of Motion Picture Arts and Sciences. Explores style, color, animation, and personality in captions beyond compliance defaults. Free to download: includes full design system PDF and After Effects project files.',
    url: 'https://captionwithintention.org',
    type: 'standard',
    category: 'captioning',
    tags: ['Captioning', 'Deaf Culture', 'Free', 'Open Access'],
    isFree: true,
    format: ['PDF', 'Web'],
    isEssential: true,
  },
  {
    slug: 'netflix-timed-text-style-guide',
    title: 'Netflix Timed Text Style Guide',
    author: 'Netflix',
    description: 'Publicly available guide required for all Netflix content — and one of the most detailed practical industry references for anyone producing captions, even for non-Netflix projects. Covers accuracy, timing, speaker IDs, formatting, and platform-specific requirements. Free to read.',
    url: 'https://partnerhelp.netflixstudios.com/hc/en-us/articles/215758617',
    type: 'standard',
    category: 'captioning',
    tags: ['Captioning', 'Free', 'Industry Standard'],
    isFree: true,
    format: ['Web'],
  },

  // ── Film & Media ─────────────────────────────────────────────────────────────

  {
    slug: 'disability-and-the-media',
    title: 'Disability and the Media',
    author: 'Katie Ellis & Gerard Goggin',
    year: 2015,
    description: 'The most comprehensive academic study of disability representation across media — television, film, digital platforms, and journalism. Covers both representation in content and accessibility of media delivery. Essential for anyone arguing for systemic change in media.',
    type: 'book',
    category: 'film-media',
    tags: ['Disability Arts', 'Media'],
    isFree: false,
    howToAccess: 'Available at most academic libraries and from Palgrave Macmillan.',
    isEssential: true,
  },
  {
    slug: 'cinema-of-isolation',
    title: 'The Cinema of Isolation: A History of Physical Disability in the Movies',
    author: 'Martin Norden',
    year: 1994,
    description: 'The definitive historical survey of Hollywood disability tropes from silent film through the early 1990s — cataloguing every major disability film cliché and its cultural implications. Still the most comprehensive single historical account of disability in mainstream cinema.',
    type: 'book',
    category: 'film-media',
    tags: ['Film', 'Disability History'],
    isFree: false,
    howToAccess: 'Available at academic libraries. Published by Rutgers University Press; used copies widely available.',
  },

  // ── Digital & Web ────────────────────────────────────────────────────────────

  {
    slug: 'alt-text-as-poetry',
    title: 'Alt Text as Poetry — Workbook',
    author: 'Bojana Coklyat & Shannon Finnegan',
    year: 2020,
    description: 'A free workbook that reframes alt text as a creative and political practice — not just a technical requirement. Includes exercises, principles, and examples from museums and artists. Changes how you think about image description entirely. Written by a blind curator and a disabled artist.',
    url: 'https://alt-text-as-poetry.net',
    type: 'workbook',
    category: 'digital',
    tags: ['Disabled Voice', 'Free', 'Open Access', 'Digital'],
    isFree: true,
    format: ['Web', 'PDF'],
    isEssential: true,
  },
  {
    slug: 'w3c-wai-understanding-wcag',
    title: 'Understanding WCAG 2.1 — W3C WAI',
    author: 'W3C Web Accessibility Initiative',
    description: 'The authoritative "Understanding" documents for each WCAG success criterion — explaining why each requirement exists, what it means, and how to meet it. Essential for web developers, designers, and platform builders. Freely available from the W3C.',
    url: 'https://www.w3.org/WAI/WCAG21/Understanding/',
    type: 'standard',
    category: 'digital',
    tags: ['Digital', 'WCAG', 'Free', 'Open Access'],
    isFree: true,
    format: ['Web'],
  },
  {
    slug: 'microsoft-inclusive-design-toolkit',
    title: 'Inclusive Design Toolkit',
    author: 'Microsoft Design',
    description: 'Free framework introducing the "persona spectrum" model of permanent, temporary, and situational disability — a powerful reframe for designers. The key insight: designing for disability improves design for everyone. Free download.',
    url: 'https://www.microsoft.com/design/inclusive',
    type: 'toolkit',
    category: 'digital',
    tags: ['Digital', 'Inclusive Design', 'Free'],
    isFree: true,
    format: ['PDF', 'Web'],
  },

  // ── Syllabi & Teaching ───────────────────────────────────────────────────────

  {
    slug: 'disability-studies-reader',
    title: 'The Disability Studies Reader',
    author: 'Lennard J. Davis (ed.)',
    year: 2017,
    description: 'The standard comprehensive anthology used in graduate disability studies courses — now in its fifth edition. Covers all major theoretical approaches: social model, crip theory, feminist disability studies, postcolonial perspectives, and more. The shelf-building text for anyone new to the field.',
    type: 'anthology',
    category: 'syllabi',
    tags: ['Disability Studies', 'Academic'],
    isFree: false,
    howToAccess: 'Available at most academic libraries and from Routledge. Widely used in graduate courses; used copies of earlier editions are often much cheaper.',
    isEssential: true,
  },
  {
    slug: 'asan-autistic-community-toolkits',
    title: 'Autistic Self Advocacy Network — Free Toolkits & Guides',
    author: 'Autistic Self Advocacy Network (ASAN)',
    description: 'Free guides, policy briefs, and community toolkits from the leading US autistic-led advocacy organization — developed by autistic people. Includes guides on neurodivergent inclusion, sensory-friendly programming, and disability rights. The correct organization to reference for autistic community perspectives.',
    url: 'https://autisticadvocacy.org/resources/',
    type: 'toolkit',
    category: 'syllabi',
    tags: ['Disabled Voice', 'Neurodivergent', 'Free'],
    isFree: true,
    format: ['PDF', 'Web'],
  },
];

// ── Lookup helpers ─────────────────────────────────────────────────────────────

export const LIBRARY_ITEM_BY_SLUG: Record<string, LibraryItem> =
  Object.fromEntries(LIBRARY_ITEMS.map((item) => [item.slug, item]));

export const LIBRARY_CATEGORY_BY_ID: Record<string, LibraryCategory> =
  Object.fromEntries(LIBRARY_CATEGORIES.map((cat) => [cat.id, cat]));

export const FREE_LIBRARY_ITEMS = LIBRARY_ITEMS.filter((i) => i.isFree);
export const ESSENTIAL_LIBRARY_ITEMS = LIBRARY_ITEMS.filter((i) => i.isEssential);
