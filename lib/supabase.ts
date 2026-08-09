import { createClient, type User } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://localhost:54321';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-key';

// detectSessionInUrl defaults to true, which auto-redeems a PKCE `?code=`
// during client init whenever a code_verifier is already cached (i.e. the
// magic link is clicked in the same browser that requested it). That auto
// exchange races app/auth/callback/page.tsx's own explicit
// exchangeCodeForSession(code) call: exchangeCodeForSession() awaits the
// same initializePromise the auto-detect ran on, so by the time it runs the
// verifier is already consumed and it throws AuthPKCECodeVerifierMissingError
// even though the auto-detect already established a real, saved session. The
// callback page then shows "we couldn't sign you in" to an already-logged-in
// person. Disabling auto-detection makes the callback page's manual exchange
// the only path, so it always runs to completion normally.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { detectSessionInUrl: false },
});

/**
 * Returns the logged-in user from the locally saved session, or null when
 * there is no session. Unlike auth.getUser(), this does not require a network
 * round-trip on every call, so a slow or flaky connection (common on phones)
 * can't bounce a genuinely logged-in member back to the login screen.
 */
export async function getSessionUser(): Promise<User | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user ?? null;
}

export type Profile = {
  id: string;
  user_id?: string;
  created_at: string;
  updated_at: string;
  status: 'pending' | 'approved' | 'rejected';
  approved_at?: string;
  approved_by?: string;
  public_visible: boolean;
  full_name: string;
  display_name?: string;
  pronouns?: string;
  email: string;
  phone?: string;
  website?: string;
  bio?: string;
  avatar_url?: string;
  specialties?: string[];
  languages?: string[];
  certifications?: string[];
  years_of_experience?: number;
  has_captioning?: boolean;
  location_city?: string;
  location_state?: string;
  location_country?: string;
  willing_to_travel: boolean;
  linkedin_url?: string;
  instagram_url?: string;
  twitter_url?: string;
  submission_notes?: string;
  admin_notes?: string;
  profile_version?: number;
  invite_code_used?: string;
  profile_type?: 'individual' | 'business';
  avatar_alt?: string;
  accessibility_features?: string[];
  services_provided?: string;
  email_public?: boolean;
  highlights?: string;
  video_links?: string[];
  activities?: string[];
  profile_bg_color?: string;
  top_8_ids?: string[];
  username?: string;
  member_since_display?: string;
  fav_books?: string[];
  fav_movies?: string[];
  fav_music?: string[];
  fav_tv?: string[];
  mood?: string;
  community_interests?: string[];
  // v6 professional fields
  work_category?: string;
  event_sizes?: string[];
  availability_status?: string;
  timezone?: string;
  communication_style?: string[];
  work_samples_url?: string;
  new_to_roles?: string[];
  education?: string;
  rate_info?: string;
  career_highlights?: string;
  fun_fact?: string;
  favorite_event?: string;
  software_skills?: string[];
  preferred_contact?: string;
  experience_level?: string;
  is_student?: boolean;
  // v16 volunteering fields
  volunteer_status?: 'yes' | 'no' | null;
  volunteer_notes?: string;
  // v17 Access Card tier
  member_type?: 'collective' | 'access_card';
  // v25 demo mascot account
  is_bot?: boolean;
  // v26 profile personalization fields
  passionate_about?: string;
  strengths?: string[];
  not_great_at?: string;
  learning_now?: string;
  want_to_learn?: string;
  // v34 referral system
  recommendations_available?: number;
  last_recommendation_refresh?: string;
  recommendation_code_used?: string;
  // v34 credential / role fields
  colleges?: string[];
  professional_certifications?: string;
  trainings_completed?: string[];
  profile_types?: string[];
  company_event_link?: string;
  // v34 photo gallery
  gallery_photos?: string[];
};

export type SavedResource = {
  id: string;
  user_id: string;
  resource_title: string;
  resource_url: string;
  resource_type?: string;
  saved_at: string;
};

/** Returns the canonical profile URL, using the vanity username when set. */
export function profileHref(profile: Pick<Profile, 'id' | 'username'>): string {
  return `/profile/${profile.username ?? profile.id}`;
}

/** A conversation between two members. profile_a_id is always the lexicographically smaller UUID. */
export type Conversation = {
  id: string;
  profile_a_id: string;
  profile_b_id: string;
  last_message_at: string;
  created_at: string;
};

/** A single message inside a conversation. */
export type Message = {
  id: string;
  conversation_id: string;
  sender_profile_id: string;
  body: string;
  sent_at: string;
  read_at: string | null;
  sender_deleted: boolean;
  recipient_deleted: boolean;
};

/**
 * Returns the id of the conversation between two profiles, creating it if it
 * does not yet exist. Always normalises the pair so the smaller UUID is
 * profile_a_id (matching the DB CHECK constraint).
 */
export async function getOrCreateConversation(
  profileIdA: string,
  profileIdB: string,
): Promise<string | null> {
  // Normalise ordering to match DB CHECK (profile_a_id::text < profile_b_id::text)
  const [aId, bId] = [profileIdA, profileIdB].sort() as [string, string];

  // Try to find an existing conversation
  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .eq('profile_a_id', aId)
    .eq('profile_b_id', bId)
    .maybeSingle();

  if (existing) return existing.id;

  // Create a new one
  const { data: created } = await supabase
    .from('conversations')
    .insert({ profile_a_id: aId, profile_b_id: bId })
    .select('id')
    .single();

  return created?.id ?? null;
}

export type Endorsement = {
  id: string;
  created_at: string;
  endorser_id: string;
  endorsed_id: string;
  note?: string;
};

export type InviteCode = {
  id: string;
  code: string;
  assigned_to_name?: string;
  assigned_to_email?: string;
  notes?: string;
  used: boolean;
  used_at?: string;
  used_by_profile_id?: string;
  created_at: string;
};

export type Recommendation = {
  id: string;
  profile_id?: string;
  recommender_id: string;
  recommended_name?: string;
  recommended_email: string;
  invitation_code: string;
  personal_message?: string;
  status: 'pending' | 'accepted' | 'expired';
  sent_at?: string;
  accepted_at?: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
};

export type TesterFeedback = {
  id: string;
  profile_id: string;
  created_at: string;
  updated_at: string;
  tester_round: number;
  most_useful_feature?: string;
  missing_profile_info?: string;
  work_use_case?: string;
  recommend_reason?: string;
  confusing_aspects?: string;
  resources_wanted?: string;
  community_feature_wish?: string;
  additional_feedback?: string;
};

export type Resource = {
  id: string;
  created_at: string;
  updated_at: string;
  status: 'pending' | 'approved' | 'rejected';
  approved_at?: string;
  approved_by?: string;
  visibility: 'public' | 'members_only' | 'custom';
  custom_access_list?: string[];
  title: string;
  description?: string;
  thumbnail_url?: string;
  video_url?: string;
  duration_minutes?: number;
  tags?: string[];
  category?: string;
  difficulty?: string;
  admin_notes?: string;
};

export const REQUIRED_PROFILE_VERSION = 1;

export type CalEvent = {
  id: string;
  title: string;
  organization: string | null;
  description: string | null;
  start_at: string;
  end_at: string | null;
  is_all_day: boolean;
  location_type: 'in-person' | 'online' | 'hybrid';
  location_name: string | null;
  location_url: string | null;
  event_url: string | null;
  tags: string[];
  source: string;
  submitted_by_profile_id: string | null;
  is_visible: boolean;
  created_at: string;
  // v38: set when this row mirrors an Artistic Accessibility production onto
  // the community calendar. source is 'production' on those rows.
  production_id?: string | null;
  production_date_id?: string | null;
};

export type IcsSource = {
  id: string;
  name: string;
  ics_url: string;
  is_active: boolean;
  last_synced_at: string | null;
  last_error: string | null;
  created_at: string;
};

// ── Artistic Accessibility Productions (v38) ─────────────────────────────────
// House-produced shows, workshops and projects shown at /projects and written
// in Admin -> Productions. Every optional field is optional on purpose: the
// patron pages hide anything blank rather than showing an empty label.

/** One person credited on a production. */
export type ProductionPresenter = {
  name: string;
  role?: string;
  bio?: string;
  photo_url?: string;
  photo_alt?: string;
  /** Links the credit to a Collective profile when they're a member. */
  profile_id?: string;
  link_label?: string;
  link_url?: string;
};

/** A way to pay. `url` is an external payment link, never on-site checkout. */
export type ProductionTicketTier = {
  label: string;
  /** Free text so sliding scale and pay-what-you-can read naturally. */
  price_text?: string;
  note?: string;
  url?: string;
  sold_out?: boolean;
};

export type ProductionPhoto = {
  url: string;
  /** Required in the admin form: this is our own site, we describe our images. */
  alt: string;
  caption?: string;
};

export type ProductionLink = { label: string; url: string };

export type ProductionKind = 'workshop' | 'show' | 'screening' | 'project' | 'series' | 'other';
export type ProductionStatus = 'draft' | 'published' | 'archived';

export type Production = {
  id: string;
  slug: string;
  title: string;
  tagline: string | null;
  kind: ProductionKind;
  status: ProductionStatus;
  sort_order: number;
  summary: string | null;
  /** Sanitized HTML. Render only through sanitizeHtml() in lib/sanitize-html.ts. */
  body_html: string | null;
  presenters: ProductionPresenter[];
  ticket_tiers: ProductionTicketTier[];
  gallery: ProductionPhoto[];
  links: ProductionLink[];
  hero_photo_url: string | null;
  hero_photo_alt: string | null;
  price_note: string | null;
  access_features: string[];
  access_note: string | null;
  schedule_note: string | null;
  contact_email: string | null;
  rsvp_enabled: boolean;
  rsvp_capacity: number | null;
  /** v44: which icon this project wears in the home page Projects folder.
   *  A key from PROJECT_ICONS in lib/project-icons.ts, never a URL. NULL means
   *  "choose one from the kind", which is the normal case. */
  desktop_icon?: string | null;
  created_at: string;
  updated_at: string;
};

/** One occurrence. A show running online in September and in person in
 *  November is one Production and several ProductionDates. */
export type ProductionDate = {
  id: string;
  production_id: string;
  start_at: string;
  end_at: string | null;
  is_all_day: boolean;
  location_type: 'in-person' | 'online' | 'hybrid';
  venue_name: string | null;
  venue_address: string | null;
  venue_note: string | null;
  online_url: string | null;
  online_note: string | null;
  label: string | null;
  ticket_url: string | null;
  is_sold_out: boolean;
  note: string | null;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
};

export type ProductionRsvp = {
  id: string;
  user_id: string;
  production_id: string;
  production_date_id: string | null;
  note: string | null;
  created_at: string;
};

/** A production with its dates attached, which is how the pages use it. */
export type ProductionWithDates = Production & { dates: ProductionDate[] };

export const PRODUCTION_KIND_LABELS: Record<ProductionKind, string> = {
  workshop:  'Workshop',
  show:      'Show',
  screening: 'Screening',
  project:   'Project',
  series:    'Series',
  other:     'Event',
};

/** Suggested access chips in the admin form. Free text is allowed too, and
 *  note the house rule: never the wheelchair symbol as an icon anywhere. */
export const PRODUCTION_ACCESS_OPTIONS = [
  'ASL Interpreted',
  'Certified Deaf Interpreter',
  'Open Captions',
  'Live Captioning (CART)',
  'Audio Description',
  'Touch Tour',
  'Relaxed Performance',
  'Sensory Friendly',
  'Wheelchair Accessible Venue',
  'Accessible Restrooms',
  'Quiet Room Available',
  'Service Animals Welcome',
  'Large Print Materials',
  'Braille Materials',
  'Scent Free',
  'Masks Required',
  'Mask Friendly',
  'Livestream Available',
  'Recording Available Afterward',
  'Sliding Scale Pricing',
  'Free for Deaf and Disabled Patrons',
];

export const SPECIALTY_OPTIONS = [
  'ASL Interpreter',
  'Certified Deaf Interpreter (CDI)',
  'CART Captioner',
  'Audio Describer',
  'Communication Access Specialist',
  'Tactile Interpreter',
  'DeafBlind Interpreter',
  'Oral Transliterator',
  'Cued Speech Transliterator',
  'Sign Language Instructor',
  'Accessibility Consultant',
  'Event Accessibility Coordinator',
  'Content Creator',
  'Other',
];

/** Fixed set of values for profiles.profile_types (a member's role tags, distinct from profile_type). */
export const PROFILE_TYPES_OPTIONS: { value: string; label: string }[] = [
  { value: 'service_provider', label: 'Service Provider' },
  { value: 'artist',           label: 'Artist' },
  { value: 'event_company',    label: 'Event Company' },
];

export const CERTIFICATION_OPTIONS = [
  'RID (Registry of Interpreters for the Deaf)',
  'NIC (National Interpreter Certification)',
  'CDI (Certified Deaf Interpreter)',
  'BEI (Board for Evaluation of Interpreters)',
  'NAD (National Association of the Deaf)',
  'NCRA (National Court Reporters Association)',
  'ACPCM (Association of Professional Captioners)',
  'DCMP (Described and Captioned Media Program)',
  'Other',
];
