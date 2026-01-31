'use client';

import { useEffect, useState } from 'react';
import { supabase, type Profile, type Endorsement } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

type EndorsementWithProfile = Endorsement & {
  endorser: Profile;
};

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const profileId = params.id as string;
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [endorsements, setEndorsements] = useState<EndorsementWithProfile[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [endorsing, setEndorsing] = useState(false);
  const [hasEndorsed, setHasEndorsed] = useState(false);

  useEffect(() => {
    fetchData();
  }, [profileId]);

  const fetchData = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      // Get current user's profile if logged in
      if (user) {
        const { data: userProfileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'approved')
          .single();
        setCurrentUserProfile(userProfileData);
      }

      // Get the profile being viewed
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Get endorsements with endorser profiles
      const { data: endorsementsData, error: endorsementsError } = await supabase
        .from('endorsements')
        .select(`
          *,
          endorser:profiles!endorser_id(*)
        `)
        .eq('endorsed_id', profileId);

      if (endorsementsError) throw endorsementsError;
      
      // Type assertion for the joined data
      const endorsementsWithProfiles = endorsementsData.map((e: any) => ({
        ...e,
        endorser: e.endorser
      })) as EndorsementWithProfile[];
      
      setEndorsements(endorsementsWithProfiles);

      // Check if current user has endorsed
      if (user && userProfileData) {
        const hasEndorsement = endorsementsData.some(
          (e: any) => e.endorser_id === userProfileData.id
        );
        setHasEndorsed(hasEndorsement);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEndorse = async () => {
    if (!currentUserProfile) {
      router.push('/login');
      return;
    }

    setEndorsing(true);
    try {
      if (hasEndorsed) {
        // Remove endorsement
        const { error } = await supabase
          .from('endorsements')
          .delete()
          .eq('endorser_id', currentUserProfile.id)
          .eq('endorsed_id', profileId);

        if (error) throw error;
      } else {
        // Add endorsement
        const { error } = await supabase
          .from('endorsements')
          .insert({
            endorser_id: currentUserProfile.id,
            endorsed_id: profileId,
          });

        if (error) throw error;
      }

      // Refresh data
      await fetchData();
    } catch (error) {
      console.error('Error toggling endorsement:', error);
      alert('Error updating endorsement. Please try again.');
    } finally {
      setEndorsing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading profile...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Profile Not Found</h1>
          <Link href="/directory" className="text-blue-600 hover:underline">
            ← Back to Directory
          </Link>
        </div>
      </div>
    );
  }

  const canEndorse = currentUserProfile && currentUserProfile.id !== profile.id;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          {/* Header */}
          <div className="flex items-start mb-6">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.full_name}
                className="w-32 h-32 rounded-full mr-8"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-blue-100 flex items-center justify-center mr-8 text-5xl font-bold text-blue-600">
                {profile.full_name.charAt(0)}
              </div>
            )}
            
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-2">
                {profile.display_name || profile.full_name}
              </h1>
              
              {profile.location_city && profile.location_state && (
                <p className="text-lg text-gray-600 mb-2">
                  📍 {profile.location_city}, {profile.location_state}
                  {profile.willing_to_travel && ' • Will travel'}
                </p>
              )}

              {canEndorse && (
                <button
                  onClick={handleEndorse}
                  disabled={endorsing}
                  className={`mt-4 px-6 py-2 rounded-lg transition ${
                    hasEndorsed
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {endorsing ? 'Updating...' : (hasEndorsed ? '✓ Endorsed' : 'Endorse')}
                </button>
              )}
            </div>
          </div>

          {/* Specialties */}
          {profile.specialties && profile.specialties.length > 0 && (
            <div className="mb-6">
              <h2 className="font-bold text-lg mb-2">Specialties</h2>
              <div className="flex flex-wrap gap-2">
                {profile.specialties.map((specialty, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full"
                  >
                    {specialty}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Bio */}
          {profile.bio && (
            <div className="mb-6">
              <h2 className="font-bold text-lg mb-2">About</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{profile.bio}</p>
            </div>
          )}

          {/* Contact Info (for logged-in members) */}
          {currentUser && (
            <div className="mb-6">
              <h2 className="font-bold text-lg mb-2">Contact Information</h2>
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <span className="font-medium">Email:</span>{' '}
                  <a href={`mailto:${profile.email}`} className="text-blue-600 hover:underline">
                    {profile.email}
                  </a>
                </div>
                {profile.phone && (
                  <div>
                    <span className="font-medium">Phone:</span>{' '}
                    <a href={`tel:${profile.phone}`} className="text-blue-600 hover:underline">
                      {profile.phone}
                    </a>
                  </div>
                )}
                {profile.website && (
                  <div>
                    <span className="font-medium">Website:</span>{' '}
                    <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {profile.website}
                    </a>
                  </div>
                )}
                {profile.linkedin_url && (
                  <div>
                    <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      LinkedIn Profile →
                    </a>
                  </div>
                )}
                {profile.instagram_url && (
                  <div>
                    <a href={profile.instagram_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      Instagram →
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Endorsements */}
          <div>
            <h2 className="font-bold text-lg mb-4">
              Endorsements ({endorsements.length})
            </h2>
            
            {endorsements.length > 0 ? (
              <div className="space-y-4">
                {endorsements.map((endorsement) => (
                  <div key={endorsement.id} className="flex items-start p-4 bg-gray-50 rounded-lg">
                    {endorsement.endorser.avatar_url ? (
                      <img
                        src={endorsement.endorser.avatar_url}
                        alt={endorsement.endorser.full_name}
                        className="w-12 h-12 rounded-full mr-4"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mr-4 text-lg font-bold text-blue-600">
                        {endorsement.endorser.full_name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <p className="font-medium">
                        {endorsement.endorser.display_name || endorsement.endorser.full_name}
                      </p>
                      {endorsement.note && (
                        <p className="text-gray-600 text-sm mt-1">{endorsement.note}</p>
                      )}
                      <p className="text-gray-400 text-xs mt-1">
                        {new Date(endorsement.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No endorsements yet.</p>
            )}
          </div>
        </div>

        <div className="text-center">
          <Link href="/directory" className="text-blue-600 hover:underline mr-4">
            ← Back to Public Directory
          </Link>
          {currentUser && (
            <Link href="/members" className="text-blue-600 hover:underline">
              View Member Directory →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
