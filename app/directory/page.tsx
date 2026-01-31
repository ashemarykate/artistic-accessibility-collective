'use client';

import { useEffect, useState } from 'react';
import { supabase, type Profile } from '@/lib/supabase';
import Link from 'next/link';

type ProfileWithEndorsements = Profile & {
  endorsement_count: number;
};

export default function PublicDirectory() {
  const [profiles, setProfiles] = useState<ProfileWithEndorsements[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('status', 'approved')
        .eq('public_visible', true);

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
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Public Directory</h1>
          <p className="text-gray-600">
            Browse accessibility professionals who have opted into the public directory
          </p>
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
                placeholder="Search by name, bio, or specialty..."
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
          Showing {filteredProfiles.length} of {profiles.length} professionals
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProfiles.map((profile) => (
            <Link
              key={profile.id}
              href={`/profile/${profile.id}`}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer"
            >
              <div className="flex items-start mb-4">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.full_name}
                    className="w-16 h-16 rounded-full mr-4"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mr-4 text-2xl font-bold text-blue-600">
                    {profile.full_name.charAt(0)}
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-bold text-lg">
                    {profile.display_name || profile.full_name}
                  </h3>
                  {profile.location_city && profile.location_state && (
                    <p className="text-sm text-gray-500">
                      {profile.location_city}, {profile.location_state}
                    </p>
                  )}
                </div>
              </div>

              {profile.specialties && profile.specialties.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {profile.specialties.slice(0, 3).map((specialty, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                    >
                      {specialty}
                    </span>
                  ))}
                  {profile.specialties.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                      +{profile.specialties.length - 3} more
                    </span>
                  )}
                </div>
              )}

              {profile.bio && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {profile.bio}
                </p>
              )}

              <div className="flex items-center text-sm text-gray-500">
                <span className="mr-2">👍</span>
                <span>{profile.endorsement_count} endorsements</span>
              </div>
            </Link>
          ))}
        </div>

        {filteredProfiles.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No professionals found matching your criteria.
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
