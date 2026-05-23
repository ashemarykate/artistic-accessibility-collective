import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://localhost:54321';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
};

/** Returns the canonical profile URL, using the vanity username when set. */
export function profileHref(profile: Pick<Profile, 'id' | 'username'>): string {
  return `/profile/${profile.username ?? profile.id}`;
}

export type Message = {
  id: string;
  sender_id: string;
  recipient_id: string;
  body: string;
  read: boolean;
  created_at: string;
  expires_at: string;
};

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
