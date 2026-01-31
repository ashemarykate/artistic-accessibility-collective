import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
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
  email: string;
  phone?: string;
  website?: string;
  bio?: string;
  avatar_url?: string;
  specialties?: string[];
  location_city?: string;
  location_state?: string;
  location_country?: string;
  willing_to_travel: boolean;
  linkedin_url?: string;
  instagram_url?: string;
  twitter_url?: string;
  submission_notes?: string;
  admin_notes?: string;
};

export type Endorsement = {
  id: string;
  created_at: string;
  endorser_id: string;
  endorsed_id: string;
  note?: string;
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
