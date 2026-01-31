'use client';

import { useEffect, useState } from 'react';
import { supabase, type Profile } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [pendingProfiles, setPendingProfiles] = useState<Profile[]>([]);
  const [approvedProfiles, setApprovedProfiles] = useState<Profile[]>([]);
  const [rejectedProfiles, setRejectedProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      router.push('/login');
      return;
    }

    setUser(user);

    // Check if user is admin
    const { data: adminData } = await supabase
      .from('admin_users')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!adminData) {
      alert('You do not have admin access.');
      router.push('/');
      return;
    }

    setIsAdmin(true);
    fetchProfiles();
  };

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      const { data: pending } = await supabase
        .from('profiles')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      const { data: approved } = await supabase
        .from('profiles')
        .select('*')
        .eq('status', 'approved')
        .order('approved_at', { ascending: false });

      const { data: rejected } = await supabase
        .from('profiles')
        .select('*')
        .eq('status', 'rejected')
        .order('updated_at', { ascending: false });

      setPendingProfiles(pending || []);
      setApprovedProfiles(approved || []);
      setRejectedProfiles(rejected || []);
    } catch (error) {
      console.error('Error fetching profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (profileId: string) => {
    try {
      // Get current user's profile to use as approved_by
      const { data: adminProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      const { error } = await supabase
        .from('profiles')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: adminProfile?.id || null,
        })
        .eq('id', profileId);

      if (error) throw error;

      alert('Profile approved!');
      fetchProfiles();
    } catch (error) {
      console.error('Error approving profile:', error);
      alert('Error approving profile. Please try again.');
    }
  };

  const handleReject = async (profileId: string) => {
    const reason = prompt('Reason for rejection (optional):');
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          status: 'rejected',
          admin_notes: reason || 'Rejected',
        })
        .eq('id', profileId);

      if (error) throw error;

      alert('Profile rejected.');
      fetchProfiles();
    } catch (error) {
      console.error('Error rejecting profile:', error);
      alert('Error rejecting profile. Please try again.');
    }
  };

  const togglePublicVisibility = async (profileId: string, currentValue: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          public_visible: !currentValue,
        })
        .eq('id', profileId);

      if (error) throw error;

      fetchProfiles();
    } catch (error) {
      console.error('Error updating visibility:', error);
      alert('Error updating visibility. Please try again.');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading admin dashboard...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const currentProfiles = activeTab === 'pending' 
    ? pendingProfiles 
    : activeTab === 'approved' 
    ? approvedProfiles 
    : rejectedProfiles;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-gray-600">Manage profile submissions and approvals</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
          >
            Log Out
          </button>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-3xl font-bold text-yellow-600 mb-2">
              {pendingProfiles.length}
            </div>
            <div className="text-gray-600">Pending Review</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {approvedProfiles.length}
            </div>
            <div className="text-gray-600">Approved</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-3xl font-bold text-red-600 mb-2">
              {rejectedProfiles.length}
            </div>
            <div className="text-gray-600">Rejected</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b flex">
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-6 py-4 font-medium ${
                activeTab === 'pending'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Pending ({pendingProfiles.length})
            </button>
            <button
              onClick={() => setActiveTab('approved')}
              className={`px-6 py-4 font-medium ${
                activeTab === 'approved'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Approved ({approvedProfiles.length})
            </button>
            <button
              onClick={() => setActiveTab('rejected')}
              className={`px-6 py-4 font-medium ${
                activeTab === 'rejected'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Rejected ({rejectedProfiles.length})
            </button>
          </div>
        </div>

        {/* Profile List */}
        <div className="space-y-4">
          {currentProfiles.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center text-gray-500">
              No {activeTab} profiles.
            </div>
          ) : (
            currentProfiles.map((profile) => (
              <div key={profile.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2">{profile.full_name}</h3>
                    <p className="text-gray-600 mb-2">{profile.email}</p>
                    
                    {profile.specialties && profile.specialties.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {profile.specialties.map((specialty, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-blue-100 text-blue-700 text-sm rounded-full"
                          >
                            {specialty}
                          </span>
                        ))}
                      </div>
                    )}

                    {profile.location_city && profile.location_state && (
                      <p className="text-sm text-gray-500 mb-2">
                        📍 {profile.location_city}, {profile.location_state}
                      </p>
                    )}
                  </div>

                  <div className="ml-4 text-right">
                    <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                      profile.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      profile.status === 'approved' ? 'bg-green-100 text-green-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {profile.status.toUpperCase()}
                    </div>
                    {profile.status === 'approved' && (
                      <div className="mt-2">
                        <label className="flex items-center text-sm">
                          <input
                            type="checkbox"
                            checked={profile.public_visible}
                            onChange={() => togglePublicVisibility(profile.id, profile.public_visible)}
                            className="mr-2"
                          />
                          Public Visible
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                {profile.bio && (
                  <div className="mb-4">
                    <span className="font-medium">Bio:</span>
                    <p className="text-gray-700 mt-1">{profile.bio}</p>
                  </div>
                )}

                {profile.submission_notes && (
                  <div className="mb-4">
                    <span className="font-medium">Submission Notes:</span>
                    <p className="text-gray-700 mt-1">{profile.submission_notes}</p>
                  </div>
                )}

                {profile.admin_notes && (
                  <div className="mb-4">
                    <span className="font-medium">Admin Notes:</span>
                    <p className="text-gray-700 mt-1">{profile.admin_notes}</p>
                  </div>
                )}

                <div className="text-sm text-gray-500 mb-4">
                  Submitted: {new Date(profile.created_at).toLocaleString()}
                  {profile.approved_at && (
                    <> • Approved: {new Date(profile.approved_at).toLocaleString()}</>
                  )}
                </div>

                {activeTab === 'pending' && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleApprove(profile.id)}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                    >
                      ✓ Approve
                    </button>
                    <button
                      onClick={() => handleReject(profile.id)}
                      className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                    >
                      ✗ Reject
                    </button>
                    <Link
                      href={`/profile/${profile.id}`}
                      className="px-6 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
                    >
                      View Full Profile
                    </Link>
                  </div>
                )}

                {activeTab === 'approved' && (
                  <div className="flex gap-3">
                    <Link
                      href={`/profile/${profile.id}`}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                      View Full Profile
                    </Link>
                    <button
                      onClick={() => handleReject(profile.id)}
                      className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                    >
                      Revoke Approval
                    </button>
                  </div>
                )}

                {activeTab === 'rejected' && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleApprove(profile.id)}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                    >
                      Approve Now
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div className="mt-12 text-center">
          <Link href="/" className="text-blue-600 hover:underline">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
