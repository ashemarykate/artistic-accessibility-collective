'use client';

import { useEffect, useState } from 'react';
import { supabase, type Profile } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type ProfileWithEndorsements = Profile & {
  endorsement_count: number;
};

export default function MemberDirectory() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<ProfileWithEndorsements[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }
    setUser(user);
    fetchProfiles();
  };

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('status', 'approved');

      if (error) throw error;

      // Get endorsement counts for each profile
      const profilesWithCounts = await Promise.all(
        (data || []).map(async (profile) => {
          const { count } = await supabase
            .from('endorsements')
            .select('*', { count: 'exact', head: true })
            .eq('endorsed_id', profile.id);

          return {
            ...profile,
            endorsement_count: count || 0,
          };
        })
      );

      setProfiles(profilesWithCounts);
    } catch (error) {
      console.error('Error fetching profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  // Get all unique specialties
  const allSpecialties = Array.from(
    new Set(
      profiles.flatMap((p) => p.specialties || [])
    )
  ).sort();

  // Filter profiles
  const filteredProfiles = profiles.filter((profile) => {
    const matchesSearch =
      !searchTerm ||
      profile.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.bio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.specialties?.some((s) =>
        s.toLowerCase().includes(searchTerm.toLowerCase())
      );

    const matchesSpecialty =
      !selectedSpecialty ||
      profile.specialties?.includes(selectedSpecialty);

    return matchesSearch && matchesSpecialty;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading directory...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold mb-2">Member Directory</h1>
            <p className="text-gray-600">
              Full directory with contact information for approved members
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
          >
            Log Out
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Search
              </label>
              <input
                type="text"
                placeholder="Search by name, email, bio, or specialty..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Filter by Specialty
              </label>
              <select
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Specialties</option>
                {allSpecialties.map((specialty) => (
                  <option key={specialty} value={specialty}>
                    {specialty}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="mb-4 text-gray-600">
          Showing {filteredProfiles.length} of {profiles.length} members
        </div>

        <div className="space-y-4">
          {filteredProfiles.map((profile) => (
            <div
              key={profile.id}
              className="bg-white rounded-lg shadow-md p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start flex-1">
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.full_name}
                      className="w-20 h-20 rounded-full mr-6"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mr-6 text-3xl font-bold text-blue-600">
                      {profile.full_name.charAt(0)}
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <h3 className="font-bold text-xl mb-1">
                      {profile.display_name || profile.full_name}
                    </h3>
                    
                    {profile.location_city && profile.location_state && (
                      <p className="text-sm text-gray-500 mb-2">
                        📍 {profile.location_city}, {profile.location_state}
                        {profile.willing_to_travel && ' • Will travel'}
                      </p>
                    )}

                    {profile.specialties && profile.specialties.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {profile.specialties.map((specialty, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full"
                          >
                            {specialty}
                          </span>
                        ))}
                      </div>
                    )}

                    {profile.bio && (
                      <p className="text-gray-700 mb-3">{profile.bio}</p>
                    )}

                    <div className="grid md:grid-cols-2 gap-2 text-sm">
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
                            LinkedIn Profile
                          </a>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                      <span>👍 {profile.endorsement_count} endorsements</span>
                    </div>
                  </div>
                </div>

                <Link
                  href={`/profile/${profile.id}`}
                  className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition whitespace-nowrap"
                >
                  View Profile
                </Link>
              </div>
            </div>
          ))}
        </div>

        {filteredProfiles.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No members found matching your criteria.
          </div>
        )}

        <div className="mt-12 text-center">
          <Link
            href="/"
            className="text-blue-600 hover:underline"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
