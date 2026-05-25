'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase, type Profile, type InviteCode, type TesterFeedback, REQUIRED_PROFILE_VERSION, profileHref } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import BrowserChrome from '@/components/BrowserChrome';

type Tab = 'pending' | 'approved' | 'rejected' | 'invite-codes' | 'feedback' | 'resource-contacts' | 'resource-submissions' | 'content';

type ResourceSubmission = {
  id: string;
  resource_name: string;
  resource_url: string;
  description: string | null;
  category: string | null;
  special_tags: string[];
  submitter_name: string | null;
  submitter_email: string | null;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes: string | null;
  created_at: string;
};
type FeedbackWithProfile = TesterFeedback & { profile: Pick<Profile, 'full_name' | 'email' | 'profile_type'> | null };

export default function AdminDashboard() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [hasMemberProfile, setHasMemberProfile] = useState(false);
  const [pendingProfiles, setPendingProfiles] = useState<Profile[]>([]);
  const [approvedProfiles, setApprovedProfiles] = useState<Profile[]>([]);
  const [rejectedProfiles, setRejectedProfiles] = useState<Profile[]>([]);
  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('pending');
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);
  const [emailStatus, setEmailStatus] = useState<Record<string, 'sent' | 'error'>>({});
  const [generatingCodes, setGeneratingCodes] = useState(false);
  const [generateCount, setGenerateCount] = useState(10);
  const [accessError, setAccessError] = useState<string | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [feedbackEntries, setFeedbackEntries] = useState<FeedbackWithProfile[]>([]);
  const [resourceSubmissions, setResourceSubmissions] = useState<ResourceSubmission[]>([]);
  const [editingCodeId, setEditingCodeId] = useState<string | null>(null);
  const [assignName, setAssignName] = useState('');
  const [assignEmail, setAssignEmail] = useState('');
  const [savingAssign, setSavingAssign] = useState(false);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const assignNameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.title = 'Admin Dashboard — Artistic Accessibility Collective';
    return () => { document.title = 'Artistic Accessibility Collective'; };
  }, []);

  useEffect(() => { checkAdmin(); }, []);

  const checkAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }

    const { data: adminData } = await supabase
      .from('admin_users')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!adminData) {
      setAccessError('You do not have permission to view this page.');
      setLoading(false);
      return;
    }

    setIsAdmin(true);

    // Check whether this admin also has an approved member profile
    const { data: memberProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'approved')
      .maybeSingle();
    setHasMemberProfile(!!memberProfile);

    fetchAll();
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [pending, approved, rejected, codes, feedback, submissions] = await Promise.all([
        supabase.from('profiles').select('*').eq('status', 'pending').order('created_at', { ascending: false }),
        supabase.from('profiles').select('*').eq('status', 'approved').order('approved_at', { ascending: false }),
        supabase.from('profiles').select('*').eq('status', 'rejected').order('updated_at', { ascending: false }),
        supabase.from('invite_codes').select('*').order('created_at', { ascending: false }),
        supabase.from('tester_feedback').select('*, profile:profiles(full_name, email, profile_type)').order('created_at', { ascending: false }),
        supabase.from('resource_submissions').select('*').order('created_at', { ascending: false }),
      ]);
      setPendingProfiles(pending.data || []);
      setApprovedProfiles(approved.data || []);
      setRejectedProfiles(rejected.data || []);
      setInviteCodes(codes.data || []);
      setFeedbackEntries((feedback.data || []) as FeedbackWithProfile[]);
      setResourceSubmissions((submissions.data || []) as ResourceSubmission[]);
    } catch (err) {
      console.error('Admin fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (profileId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: adminProfile } = await supabase
      .from('profiles').select('id').eq('user_id', user!.id).single();

    await supabase.from('profiles').update({
      status: 'approved',
      approved_at: new Date().toISOString(),
      approved_by: adminProfile?.id,
    }).eq('id', profileId);

    fetchAll();
  };

  const handleReject = async (profileId: string) => {
    if (!confirm('Reject this profile?')) return;
    await supabase.from('profiles').update({ status: 'rejected' }).eq('id', profileId);
    fetchAll();
  };

  const handleTogglePublic = async (profileId: string, current: boolean) => {
    await supabase.from('profiles').update({ public_visible: !current }).eq('id', profileId);
    fetchAll();
  };

  const handleSendLoginEmail = async (profileId: string) => {
    setSendingEmail(profileId);
    try {
      const res = await fetch('/api/send-login-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId }),
      });
      if (res.ok) {
        setEmailStatus((prev) => ({ ...prev, [profileId]: 'sent' }));
      } else {
        setEmailStatus((prev) => ({ ...prev, [profileId]: 'error' }));
      }
    } catch {
      setEmailStatus((prev) => ({ ...prev, [profileId]: 'error' }));
    } finally {
      setSendingEmail(null);
    }
  };

  const handleGenerateCodes = async () => {
    setGeneratingCodes(true);
    setGenerateError(null);
    try {
      const { error } = await supabase.rpc('generate_invite_codes', { count: generateCount });
      if (error) throw error;
      fetchAll();
    } catch (err) {
      console.error('Generate codes error:', err);
      setGenerateError('Error generating codes. Make sure migration v2 has been run.');
    } finally {
      setGeneratingCodes(false);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
  };

  const copyAllUnused = () => {
    const unused = inviteCodes.filter((c) => !c.used).map((c) => c.code).join('\n');
    navigator.clipboard.writeText(unused);
  };

  const startAssign = (code: InviteCode) => {
    setEditingCodeId(code.id);
    setAssignName(code.assigned_to_name || '');
    setAssignEmail(code.assigned_to_email || '');
    setTimeout(() => assignNameRef.current?.focus(), 0);
  };

  const cancelAssign = () => {
    setEditingCodeId(null);
    setAssignName('');
    setAssignEmail('');
  };

  const saveAssign = async (codeId: string) => {
    setSavingAssign(true);
    await supabase.from('invite_codes').update({
      assigned_to_name: assignName.trim() || null,
      assigned_to_email: assignEmail.trim() || null,
    }).eq('id', codeId);
    setSavingAssign(false);
    cancelAssign();
    fetchAll();
  };

  const handleTabKeyDown = (e: React.KeyboardEvent, index: number) => {
    const count = tabs.length;
    let next = index;
    if (e.key === 'ArrowRight') next = (index + 1) % count;
    else if (e.key === 'ArrowLeft') next = (index - 1 + count) % count;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = count - 1;
    else return;
    e.preventDefault();
    setActiveTab(tabs[next].id);
    tabRefs.current[next]?.focus();
  };

  const profilesNeedingUpdate = approvedProfiles.filter(
    (p) => (p.profile_version ?? 1) < REQUIRED_PROFILE_VERSION
  );

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'pending', label: 'Pending', count: pendingProfiles.length },
    { id: 'approved', label: 'Approved', count: approvedProfiles.length },
    { id: 'rejected', label: 'Rejected', count: rejectedProfiles.length },
    { id: 'invite-codes', label: 'Invite Codes', count: inviteCodes.filter((c) => !c.used).length },
    { id: 'feedback', label: 'Feedback', count: feedbackEntries.length },
    { id: 'resource-submissions', label: 'Suggestions', count: resourceSubmissions.filter((s) => s.status === 'pending').length },
    { id: 'content', label: 'Content' },
    { id: 'resource-contacts', label: 'Resource Contacts' },
  ];

  if (accessError) {
    return (
      <BrowserChrome variant="mosaic" title="Admin — Artistic Accessibility Collective" url="http://admin.artisticaccessibility.com/">
      <main style={{ background: 'var(--aac-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100%' }}>
        <div role="alert" style={{ color: 'var(--aac-white)', textAlign: 'center' }}>
          <p style={{ fontSize: '1.125rem', marginBottom: '1rem' }}>{accessError}</p>
          <a href="/" className="btn btn-outline-white">Go Home</a>
        </div>
      </main>
      </BrowserChrome>
    );
  }

  if (loading) {
    return (
      <BrowserChrome variant="mosaic" title="Admin — Artistic Accessibility Collective" url="http://admin.artisticaccessibility.com/">
      <main className="page-wrapper">
        <div className="loading-screen" role="status" aria-label="Loading admin dashboard">
          <span className="spinner" aria-hidden="true" style={{ width: 36, height: 36, borderWidth: 4 }} />
          <span>Loading admin…</span>
        </div>
      </main>
      </BrowserChrome>
    );
  }

  return (
    <BrowserChrome variant="mosaic" title="Admin — Artistic Accessibility Collective" url="http://admin.artisticaccessibility.com/">
    <main className="page-wrapper">
      <header className="site-header">
        <Link href="/" className="site-header-logo" aria-label="Artistic Accessibility Collective — Home"><img src="/images/logo-across-blue-bg.svg" alt="" /></Link>
        <nav className="site-nav" aria-label="Main navigation">
          <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem' }}>Admin</span>
          {hasMemberProfile && (
            <Link href="/dashboard" className="nav-link">My Hub</Link>
          )}
          <button
            onClick={async () => { await supabase.auth.signOut(); router.push('/'); }}
            className="btn btn-outline-white btn-sm"
          >
            Sign Out
          </button>
        </nav>
      </header>

      <div className="page-container-wide" style={{ paddingTop: '2rem' }}>
        <h1 style={{ color: 'var(--aac-blue-dark)', fontSize: '1.75rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
          Admin Dashboard
        </h1>

        {/* Profile version alert */}
        {profilesNeedingUpdate.length > 0 && (
          <div className="alert alert-warning" role="status" style={{ marginBottom: '1.5rem' }}>
            <strong>{profilesNeedingUpdate.length} approved profile{profilesNeedingUpdate.length !== 1 ? 's' : ''}</strong> {profilesNeedingUpdate.length === 1 ? 'has' : 'have'} not yet updated to the current profile version.
            Members will see a banner prompting them to update when they log in.
          </div>
        )}

        {/* Tab nav */}
        <div
          role="tablist"
          aria-label="Admin sections"
          style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}
        >
          {tabs.map((tab, index) => (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`panel-${tab.id}`}
              tabIndex={activeTab === tab.id ? 0 : -1}
              ref={(el) => { tabRefs.current[index] = el; }}
              onClick={() => setActiveTab(tab.id)}
              onKeyDown={(e) => handleTabKeyDown(e, index)}
              className="btn btn-sm"
              style={{
                background: activeTab === tab.id ? 'var(--aac-blue)' : 'var(--aac-white)',
                color: activeTab === tab.id ? 'var(--aac-white)' : 'var(--aac-blue)',
                border: '1px solid var(--ms-border)',
                fontWeight: activeTab === tab.id ? 700 : 500,
              }}
            >
              {tab.label}
              {tab.count != null && (
                <span
                  style={{
                    marginLeft: '0.375rem',
                    background: activeTab === tab.id ? 'rgba(255,255,255,0.25)' : 'var(--aac-blue)',
                    color: 'var(--aac-white)',
                    borderRadius: '999px',
                    padding: '0 6px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                  }}
                  aria-label={`${tab.count} ${tab.label.toLowerCase()}`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Panels */}
        {(activeTab === 'pending' || activeTab === 'approved' || activeTab === 'rejected') && (
          <div id={`panel-${activeTab}`} role="tabpanel" aria-labelledby={`tab-${activeTab}`}>
            <ProfileList
              profiles={
                activeTab === 'pending' ? pendingProfiles
                : activeTab === 'approved' ? approvedProfiles
                : rejectedProfiles
              }
              status={activeTab}
              onApprove={handleApprove}
              onReject={handleReject}
              onTogglePublic={handleTogglePublic}
              onSendLoginEmail={handleSendLoginEmail}
              sendingEmail={sendingEmail}
              emailStatus={emailStatus}
            />
          </div>
        )}

        {activeTab === 'invite-codes' && (
          <div id="panel-invite-codes" role="tabpanel" aria-labelledby="tab-invite-codes">
            <div className="content-card" style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ fontWeight: 'bold', color: 'var(--aac-blue)', fontSize: '1.1rem', marginBottom: '1rem' }}>
                Generate Invite Codes
              </h2>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div className="form-group" style={{ flex: '0 1 160px' }}>
                  <label htmlFor="gen-count" className="form-label">How many?</label>
                  <input
                    id="gen-count"
                    type="number"
                    className="form-input"
                    min={1}
                    max={100}
                    value={generateCount}
                    onChange={(e) => setGenerateCount(Number(e.target.value))}
                  />
                </div>
                <button
                  onClick={handleGenerateCodes}
                  className="btn btn-primary"
                  disabled={generatingCodes}
                  style={{ marginBottom: '0.375rem' }}
                >
                  {generatingCodes ? (
                    <><span className="spinner" aria-hidden="true" style={{ width: 16, height: 16, borderWidth: 2 }} /> Generating…</>
                  ) : (
                    `Generate ${generateCount} Code${generateCount !== 1 ? 's' : ''}`
                  )}
                </button>
                {generateError && (
                  <p role="alert" style={{ color: 'var(--color-error)', fontSize: '0.875rem', width: '100%' }}>{generateError}</p>
                )}
                {inviteCodes.some((c) => !c.used) && (
                  <button onClick={copyAllUnused} className="btn btn-outline" style={{ marginBottom: '0.375rem' }}>
                    Copy All Unused Codes
                  </button>
                )}
              </div>
            </div>

            <div className="content-card">
              <h2 style={{ fontWeight: 'bold', color: 'var(--aac-blue)', fontSize: '1.1rem', marginBottom: '1rem' }}>
                All Codes
                <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', fontWeight: 400, color: 'var(--color-text-muted)', marginLeft: '0.5rem' }}>
                  {inviteCodes.filter((c) => !c.used).length} unused · {inviteCodes.filter((c) => c.used).length} used
                </span>
              </h2>

              {inviteCodes.length === 0 ? (
                <p style={{ color: 'var(--color-text-muted)' }}>No codes yet. Generate some above.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }} aria-label="Invite codes">
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                        <th style={{ textAlign: 'left', padding: '0.5rem 0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Code</th>
                        <th style={{ textAlign: 'left', padding: '0.5rem 0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Assigned To</th>
                        <th style={{ textAlign: 'left', padding: '0.5rem 0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Status</th>
                        <th style={{ textAlign: 'left', padding: '0.5rem 0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {inviteCodes.map((code) => (
                        <tr key={code.id} style={{ borderBottom: '1px solid var(--color-border)', opacity: code.used ? 0.55 : 1 }}>
                          <td style={{ padding: '0.625rem 0.75rem' }}>
                            <code style={{ fontFamily: 'monospace', fontWeight: 700, letterSpacing: '0.08em', fontSize: '0.95rem' }}>
                              {code.code}
                            </code>
                          </td>
                          <td style={{ padding: '0.625rem 0.75rem', color: 'var(--color-text-muted)' }}>
                            {editingCodeId === code.id ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                                <input
                                  ref={assignNameRef}
                                  type="text"
                                  className="form-input"
                                  style={{ fontSize: '0.875rem', padding: '0.25rem 0.5rem' }}
                                  placeholder="Name"
                                  value={assignName}
                                  onChange={(e) => setAssignName(e.target.value)}
                                  aria-label="Assign to name"
                                />
                                <input
                                  type="email"
                                  className="form-input"
                                  style={{ fontSize: '0.875rem', padding: '0.25rem 0.5rem' }}
                                  placeholder="Email (optional)"
                                  value={assignEmail}
                                  onChange={(e) => setAssignEmail(e.target.value)}
                                  aria-label="Assign to email"
                                />
                                <div style={{ display: 'flex', gap: '0.375rem' }}>
                                  <button
                                    onClick={() => saveAssign(code.id)}
                                    disabled={savingAssign}
                                    className="btn btn-primary btn-sm"
                                  >
                                    {savingAssign ? 'Saving…' : 'Save'}
                                  </button>
                                  <button onClick={cancelAssign} className="btn btn-ghost btn-sm">
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => startAssign(code)}
                                className="btn btn-ghost btn-sm"
                                style={{ textAlign: 'left', padding: '0.25rem 0.5rem', height: 'auto' }}
                                aria-label={code.assigned_to_name ? `Edit assignment for ${code.code}` : `Assign ${code.code} to someone`}
                              >
                                {code.assigned_to_name ? (
                                  <span>
                                    {code.assigned_to_name}
                                    {code.assigned_to_email && <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{code.assigned_to_email}</span>}
                                  </span>
                                ) : (
                                  <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>+ Assign to someone</span>
                                )}
                              </button>
                            )}
                          </td>
                          <td style={{ padding: '0.625rem 0.75rem' }}>
                            {code.used ? (
                              <span className="tag tag-gray">Used</span>
                            ) : (
                              <span className="tag tag-green">Available</span>
                            )}
                          </td>
                          <td style={{ padding: '0.625rem 0.75rem' }}>
                            {!code.used && (
                              <button
                                onClick={() => copyCode(code.code)}
                                className="btn btn-ghost btn-sm"
                                aria-label={`Copy code ${code.code}`}
                              >
                                Copy
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'resource-submissions' && (
          <div id="panel-resource-submissions" role="tabpanel" aria-labelledby="tab-resource-submissions">
            <ResourceSubmissionsPanel
              submissions={resourceSubmissions}
              onStatusChange={async (id, status, notes) => {
                await supabase.from('resource_submissions').update({
                  status,
                  admin_notes: notes || null,
                  reviewed_at: new Date().toISOString(),
                }).eq('id', id);
                fetchAll();
              }}
            />
          </div>
        )}

        {activeTab === 'content' && (
          <div id="panel-content" role="tabpanel" aria-labelledby="tab-content">
            <ContentManagementPanel />
          </div>
        )}

        {activeTab === 'resource-contacts' && (
          <div id="panel-resource-contacts" role="tabpanel" aria-labelledby="tab-resource-contacts">
            <ResourceContactsPanel />
          </div>
        )}

        {activeTab === 'feedback' && (
          <div id="panel-feedback" role="tabpanel" aria-labelledby="tab-feedback">
            {feedbackEntries.length === 0 ? (
              <div className="content-card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                No feedback submitted yet.
              </div>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {feedbackEntries.map((f) => {
                  const name = f.profile?.full_name || 'Unknown';
                  const type = f.profile?.profile_type === 'business' ? 'Business' : 'Individual';
                  const fields = [
                    { label: 'What would make this most useful?', value: f.missing_profile_info },
                    { label: 'How would you use this at work?', value: f.work_use_case },
                    { label: 'Community features interested in', value: f.community_feature_wish },
                    { label: 'Additional feedback', value: f.additional_feedback },
                    { label: 'Most useful feature', value: f.most_useful_feature },
                    { label: 'Why would you recommend?', value: f.recommend_reason },
                    { label: 'Confusing aspects', value: f.confusing_aspects },
                    { label: 'Resources wanted', value: f.resources_wanted },
                  ].filter((row) => row.value);
                  return (
                    <li key={f.id} className="content-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                        <div>
                          <p style={{ fontWeight: 'bold', color: 'var(--aac-blue)', fontSize: '1rem', marginBottom: '0.125rem' }}>{name}</p>
                          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                            {f.profile?.email} · <span className="tag tag-gray" style={{ fontSize: '0.75rem' }}>{type}</span>
                          </p>
                        </div>
                        <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                          {new Date(f.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                      {fields.length === 0 ? (
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>No answers recorded.</p>
                      ) : (
                        <dl style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', margin: 0 }}>
                          {fields.map((row, i) => (
                            <div key={i}>
                              <dt style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>{row.label}</dt>
                              <dd style={{ margin: 0, color: 'var(--color-text)', fontSize: '0.9375rem', lineHeight: 1.6 }}>{row.value}</dd>
                            </div>
                          ))}
                        </dl>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>
    </main>
  </BrowserChrome>
  );
}

// ── Resource Submissions sub-component ───────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  'audio-description': '🎙️ Audio Description',
  'captioning':        '💬 Captioning & CART',
  'theater':           '🎭 Theater & Live Performance',
  'film':              '🎬 Film & Video Production',
  'live-events':       '🎪 Live Events & Festivals',
  'digital':           '💻 Digital & Web Accessibility',
  'disability-justice':'✊ Disability Justice',
  'deaf-culture':      '👐 Deaf Culture & ASL',
  'representation':    '📽️ Disability Representation in Media',
  'legal':             '⚖️ Legal & Policy',
  'other':             'Other / Not sure',
};

function ResourceSubmissionsPanel({
  submissions,
  onStatusChange,
}: {
  submissions: ResourceSubmission[];
  onStatusChange: (id: string, status: 'approved' | 'rejected', notes?: string) => void;
}) {
  const [notesById, setNotesById] = useState<Record<string, string>>({});

  const pending  = submissions.filter((s) => s.status === 'pending');
  const approved = submissions.filter((s) => s.status === 'approved');
  const rejected = submissions.filter((s) => s.status === 'rejected');

  const renderGroup = (items: ResourceSubmission[], label: string) => {
    if (items.length === 0) return null;
    return (
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontWeight: 'bold', color: 'var(--aac-blue)', fontSize: '1rem', marginBottom: '0.75rem' }}>
          {label} <span style={{ fontWeight: 400, color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>({items.length})</span>
        </h2>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {items.map((s) => (
            <li key={s.id} className="content-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 'bold', color: 'var(--aac-blue)', fontSize: '0.9375rem', marginBottom: '0.125rem' }}>
                    {s.resource_name}
                  </p>
                  <a
                    href={s.resource_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'var(--aac-blue)', fontSize: '0.8125rem', wordBreak: 'break-all' }}
                  >
                    {s.resource_url}
                  </a>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginTop: '0.375rem' }}>
                    {s.category && (
                      <span className="tag tag-blue" style={{ fontSize: '0.75rem' }}>
                        {CATEGORY_LABELS[s.category] ?? s.category}
                      </span>
                    )}
                    {(s.special_tags ?? []).map((t) => (
                      <span key={t} className="tag tag-yellow" style={{ fontSize: '0.75rem' }}>{t}</span>
                    ))}
                  </div>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                  {new Date(s.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>

              {s.description && (
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-text)', marginBottom: '0.5rem', lineHeight: 1.5 }}>
                  {s.description}
                </p>
              )}

              {(s.submitter_name || s.submitter_email) && (
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                  Submitted by {s.submitter_name && <strong>{s.submitter_name}</strong>}
                  {s.submitter_name && s.submitter_email && ' · '}
                  {s.submitter_email && (
                    <a href={`mailto:${s.submitter_email}`} style={{ color: 'var(--aac-blue)' }}>{s.submitter_email}</a>
                  )}
                </p>
              )}

              {s.admin_notes && (
                <div className="alert alert-info" style={{ fontSize: '0.8125rem', marginBottom: '0.5rem' }}>
                  <strong>Notes:</strong> {s.admin_notes}
                </div>
              )}

              {s.status === 'pending' && (
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end', flexWrap: 'wrap', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--color-border)' }}>
                  <div className="form-group" style={{ flex: '1 1 240px', marginBottom: 0 }}>
                    <label htmlFor={`notes-${s.id}`} className="form-label" style={{ fontSize: '0.75rem' }}>
                      Admin notes <span style={{ fontWeight: 400, color: 'var(--color-text-muted)' }}>(optional)</span>
                    </label>
                    <input
                      id={`notes-${s.id}`}
                      type="text"
                      className="form-input"
                      style={{ fontSize: '0.8125rem' }}
                      placeholder="Reason for decision, follow-up needed, etc."
                      value={notesById[s.id] ?? ''}
                      onChange={(e) => setNotesById((prev) => ({ ...prev, [s.id]: e.target.value }))}
                    />
                  </div>
                  <button
                    onClick={() => onStatusChange(s.id, 'approved', notesById[s.id])}
                    className="btn btn-primary btn-sm"
                    aria-label={`Approve suggestion: ${s.resource_name}`}
                  >
                    ✓ Approve
                  </button>
                  <button
                    onClick={() => onStatusChange(s.id, 'rejected', notesById[s.id])}
                    className="btn btn-danger btn-sm"
                    aria-label={`Reject suggestion: ${s.resource_name}`}
                  >
                    Reject
                  </button>
                </div>
              )}

              {s.status === 'approved' && (
                <p style={{ fontSize: '0.75rem', color: '#1a5e38', fontWeight: 600, marginTop: '0.375rem' }}>
                  ✓ Approved — remember to add this to the resources page code!
                </p>
              )}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  if (submissions.length === 0) {
    return (
      <div className="content-card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
        No resource suggestions yet. They&apos;ll appear here when members or visitors submit them.
      </div>
    );
  }

  return (
    <div>
      <div className="content-card" style={{ marginBottom: '1.5rem' }}>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: 0 }}>
          Community-submitted resource suggestions. <strong>Approved suggestions still need to be manually added to the resources page code</strong> — the approval just records your decision and lets you track what&apos;s been vetted.
        </p>
      </div>
      {renderGroup(pending, '⏳ Pending Review')}
      {renderGroup(approved, '✓ Approved')}
      {renderGroup(rejected, '✗ Rejected')}
    </div>
  );
}

// ── Resource Contacts sub-component ─────────────────────────────────────────

type ResourceContact = {
  name: string;
  website: string;
  phone?: string;
  email?: string;
  note?: string;
  category: string;
};

const RESOURCE_CONTACTS: ResourceContact[] = [
  // Audio Description
  { category: 'Audio Description', name: 'DCMP (Described and Captioned Media Program)', website: 'dcmp.org', note: 'Free described/captioned media for students with disabilities' },
  { category: 'Audio Description', name: 'GBH Media Access Group', website: 'wgbh.org/foundation/media-access', note: 'Pioneer in audio description and captioning standards' },
  { category: 'Audio Description', name: 'ACB Audio Description Project', website: 'adp.acb.org', note: 'American Council of the Blind — AD standards and resources' },
  { category: 'Audio Description', name: 'YouDescribe', website: 'youdescribe.org', note: 'Volunteer-driven audio description for YouTube videos' },
  { category: 'Audio Description', name: 'VocalEye', website: 'vocaleye.ca', note: 'Live audio description for theatre and events (Canada)' },
  // Captioning & CART
  { category: 'Captioning & CART', name: 'HLAA (Hearing Loss Association of America)', website: 'hearingloss.org', note: 'Advocates for captioning access and hearing loop standards' },
  // Theater & Live Performance
  { category: 'Theater & Live Performance', name: 'Graeae Theatre Company', website: 'graeae.org/accessibility', note: 'UK disabled-led theater company; accessibility guidance' },
  { category: 'Theater & Live Performance', name: 'Kennedy Center — VSA', website: 'kennedy-center.org/education/vsa', note: 'Arts and disability education programs' },
  { category: 'Theater & Live Performance', name: 'Think Outside the Vox', website: 'thinkoutsidethevox.org', note: 'Accessibility in performing arts spaces' },
  // Film & Media
  { category: 'Film & Media', name: 'FWD-Doc (Documentary Filmmakers with Disabilities)', website: 'fwd-doc.org', note: 'Disability inclusion in documentary filmmaking' },
  { category: 'Film & Media', name: 'Inevitable Foundation', website: 'inevitablefoundation.com', note: 'Grants and support for disabled screenwriters' },
  { category: 'Film & Media', name: 'IDA (International Documentary Association)', website: 'documentary.org', note: 'Fiscal sponsorship and resources for documentary filmmakers' },
  // Live Events & Festivals
  { category: 'Live Events & Festivals', name: 'Attitude is Everything', website: 'attitudeiseverything.org.uk', note: 'UK charity improving live music access for Deaf and disabled fans' },
  { category: 'Live Events & Festivals', name: 'Cultural Access Collaborative', website: 'culturalaccesscollaborative.org', note: 'Consulting and research on cultural access' },
  // Digital & Web Accessibility
  { category: 'Digital & Web Accessibility', name: 'WebAIM (Web Accessibility In Mind)', website: 'webaim.org', note: 'WCAG guides, screen reader surveys, contrast checker' },
  { category: 'Digital & Web Accessibility', name: 'TPGi (The Paciello Group)', website: 'tpgi.com', note: 'Accessibility consulting and Colour Contrast Analyser' },
  { category: 'Digital & Web Accessibility', name: 'Deque (axe)', website: 'deque.com', note: 'axe DevTools browser extension for automated a11y testing' },
  { category: 'Digital & Web Accessibility', name: 'NV Access (NVDA)', website: 'nvaccess.org', note: 'Free, open-source NVDA screen reader for Windows' },
  // Disability Justice
  { category: 'Disability Justice', name: 'Sins Invalid', website: 'sinsinvalid.org', note: 'Disability justice performance project centering BIPOC and LGBTQ+ disabled artists' },
  { category: 'Disability Justice', name: 'Disability Visibility Project', website: 'disabilityvisibilityproject.com', note: 'Online community and media for disabled people' },
  { category: 'Disability Justice', name: 'RespectAbility', website: 'respectability.org', note: 'Disability inclusion in entertainment, employment, and policy' },
  // Deaf Culture & ASL
  { category: 'Deaf Culture & ASL', name: 'NAD (National Association of the Deaf)', website: 'nad.org', note: 'Largest Deaf civil rights organization in the US' },
  { category: 'Deaf Culture & ASL', name: 'Gallaudet University Press', website: 'gallaudet.edu/gallaudet-university-press', note: 'Premier publisher of Deaf culture, sign linguistics, and ASL resources' },
  // Legal & Policy
  { category: 'Legal & Policy', name: 'ADA National Network', website: 'adata.org', phone: '1-800-949-4232', note: 'Free ADA guidance and technical assistance; 10 regional centers' },
  { category: 'Legal & Policy', name: 'Pacific ADA Center', website: 'adapacific.org', note: 'Regional ADA center for CA, AZ, NV, HI, and Pacific Basin' },
];

const CONTACT_CATEGORIES = [
  'Audio Description',
  'Captioning & CART',
  'Theater & Live Performance',
  'Film & Media',
  'Live Events & Festivals',
  'Digital & Web Accessibility',
  'Disability Justice',
  'Deaf Culture & ASL',
  'Legal & Policy',
];

function ResourceContactsPanel() {
  return (
    <div>
      <div className="content-card" style={{ marginBottom: '1.5rem' }}>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: 0 }}>
          Contact and reference information for organizations whose resources appear in the public Resources directory. For internal use — not displayed to members.
        </p>
      </div>

      {CONTACT_CATEGORIES.map((cat) => {
        const contacts = RESOURCE_CONTACTS.filter((c) => c.category === cat);
        if (contacts.length === 0) return null;
        return (
          <div key={cat} className="content-card" style={{ marginBottom: '1.25rem' }}>
            <h2 style={{ fontWeight: 'bold', color: 'var(--aac-blue)', fontSize: '1rem', marginBottom: '0.875rem' }}>
              {cat}
            </h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }} aria-label={`${cat} contacts`}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                    <th style={{ textAlign: 'left', padding: '0.375rem 0.75rem', color: 'var(--color-text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>Organization</th>
                    <th style={{ textAlign: 'left', padding: '0.375rem 0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Website</th>
                    <th style={{ textAlign: 'left', padding: '0.375rem 0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Phone / Email</th>
                    <th style={{ textAlign: 'left', padding: '0.375rem 0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.map((c, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--color-border)', background: i % 2 === 1 ? 'var(--aac-blue-light)' : undefined }}>
                      <td style={{ padding: '0.5rem 0.75rem', fontWeight: 600, color: 'var(--color-text)', whiteSpace: 'nowrap' }}>{c.name}</td>
                      <td style={{ padding: '0.5rem 0.75rem' }}>
                        <a
                          href={`https://${c.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: 'var(--aac-blue)', textDecoration: 'underline' }}
                          aria-label={`${c.name} website (opens in new tab)`}
                        >
                          {c.website}
                        </a>
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                        {c.phone && <span>{c.phone}</span>}
                        {c.email && <a href={`mailto:${c.email}`} style={{ color: 'var(--aac-blue)' }}>{c.email}</a>}
                        {!c.phone && !c.email && <span style={{ color: 'var(--color-border)' }}>—</span>}
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem', color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>{c.note || ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Profile list sub-component ───────────────────────────────────────────────

function ProfileList({
  profiles,
  status,
  onApprove,
  onReject,
  onTogglePublic,
  onSendLoginEmail,
  sendingEmail,
  emailStatus,
}: {
  profiles: Profile[];
  status: 'pending' | 'approved' | 'rejected';
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onTogglePublic: (id: string, current: boolean) => void;
  onSendLoginEmail: (id: string) => void;
  sendingEmail: string | null;
  emailStatus: Record<string, 'sent' | 'error'>;
}) {
  if (profiles.length === 0) {
    return (
      <div className="content-card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
        No {status} profiles.
      </div>
    );
  }

  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {profiles.map((p) => {
        const name = p.display_name || p.full_name;
        const needsUpdate = (p.profile_version ?? 1) < REQUIRED_PROFILE_VERSION;

        return (
          <li key={p.id} className="content-card">
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 240 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                  <Link
                    href={profileHref(p)}
                    style={{ fontWeight: 'bold', color: 'var(--aac-blue)', fontSize: '1rem', textDecoration: 'none' }}
                  >
                    {name}
                  </Link>
                  {p.pronouns && (
                    <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{p.pronouns}</span>
                  )}
                  {p.profile_type && (
                    <span className={`tag ${p.profile_type === 'business' ? 'tag-blue' : 'tag-gray'}`} style={{ fontSize: '0.75rem' }}>
                      {p.profile_type === 'business' ? 'Business' : 'Individual'}
                    </span>
                  )}
                  {needsUpdate && status === 'approved' && (
                    <span className="tag tag-yellow" style={{ fontSize: '0.75rem' }}>Needs profile update</span>
                  )}
                </div>

                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                  {p.email}
                  {p.phone && ` · ${p.phone}`}
                </p>

                {(p.location_city || p.location_state) && (
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '0.375rem' }}>
                    {[p.location_city, p.location_state].filter(Boolean).join(', ')}
                  </p>
                )}

                {p.specialties && p.specialties.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '0.5rem' }}>
                    {p.specialties.map((s, i) => <span key={i} className="tag tag-blue">{s}</span>)}
                  </div>
                )}

                {p.certifications && p.certifications.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '0.5rem' }}>
                    {p.certifications.map((c, i) => <span key={i} className="tag tag-yellow">{c}</span>)}
                  </div>
                )}

                {p.bio && (
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: '0.375rem', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {p.bio}
                  </p>
                )}

                {p.submission_notes && (
                  <div className="alert alert-info" style={{ marginTop: '0.75rem', fontSize: '0.875rem' }}>
                    <strong>Notes:</strong> {p.submission_notes}
                  </div>
                )}

                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem', marginTop: '0.5rem' }}>
                  Submitted {new Date(p.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                  {p.invite_code_used && ` · Code: ${p.invite_code_used}`}
                </p>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: 160 }}>
                {status === 'pending' && (
                  <>
                    <button onClick={() => onApprove(p.id)} className="btn btn-primary btn-sm" aria-label={`Approve ${name}`}>
                      Approve
                    </button>
                    <button onClick={() => onReject(p.id)} className="btn btn-danger btn-sm" aria-label={`Reject ${name}`}>
                      Reject
                    </button>
                  </>
                )}

                {status === 'approved' && (
                  <>
                    <button
                      onClick={() => onTogglePublic(p.id, p.public_visible)}
                      className={`btn btn-sm ${p.public_visible ? 'btn-outline' : 'btn-ghost'}`}
                      aria-pressed={p.public_visible}
                      aria-label={`${name} is ${p.public_visible ? 'public' : 'private'} — click to make ${p.public_visible ? 'private' : 'public'}`}
                    >
                      {p.public_visible ? 'Public' : 'Private'}
                    </button>

                    <button
                      onClick={() => onSendLoginEmail(p.id)}
                      disabled={sendingEmail === p.id || emailStatus[p.id] === 'sent'}
                      className="btn btn-outline btn-sm"
                      aria-label={`Send login setup email to ${name}`}
                    >
                      {sendingEmail === p.id ? (
                        <><span className="spinner" aria-hidden="true" style={{ width: 14, height: 14, borderWidth: 2 }} /> Sending…</>
                      ) : emailStatus[p.id] === 'sent' ? (
                        'Email Sent'
                      ) : emailStatus[p.id] === 'error' ? (
                        'Failed — retry?'
                      ) : (
                        'Send Login Email'
                      )}
                    </button>

                    <button onClick={() => onReject(p.id)} className="btn btn-ghost btn-sm" aria-label={`Revoke access for ${name}`}>
                      Revoke
                    </button>
                  </>
                )}

                {status === 'rejected' && (
                  <button onClick={() => onApprove(p.id)} className="btn btn-primary btn-sm" aria-label={`Re-approve ${name}`}>
                    Re-approve
                  </button>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

// ── ContentManagementPanel ────────────────────────────────────────────────────
// Manage Library, Cinema, and Accessibility Resources items in the DB.
// DB items appear on the public pages alongside (and can override) static items.

type ContentSection = 'library' | 'cinema' | 'accessibility';

type ContentItem = {
  id: string;
  title: string;
  author: string | null;
  director: string | null;
  creator: string | null;
  year: number | null;
  description: string | null;
  url: string | null;
  item_type: string | null;
  category: string | null;
  tags: string[];
  is_free: boolean;
  how_to_access: string | null;
  is_essential: boolean;
  format_list: string[] | null;
  platform_list: string[] | null;
  has_ad: boolean;
  has_captions: boolean;
  duration_minutes: number | null;
  location_note: string | null;
  slug: string | null;
  section: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
};

const BLANK_ITEM = {
  title: '', author: '', director: '', creator: '', year: '',
  description: '', url: '', item_type: '', category: '', tags: '',
  is_free: false, how_to_access: '', is_essential: false,
  format_list: '', platform_list: '', has_ad: false, has_captions: false,
  duration_minutes: '', location_note: '', slug: '', admin_notes: '',
  status: 'approved',
};

const LIBRARY_TYPES  = ['book','essay','article','journal','zine','workbook','anthology','standard','blog','toolkit'];
const CINEMA_TYPES   = ['documentary','film','short-film','podcast','series','talk','video-essay','performance-recording'];
const ACCESS_TYPES   = ['standard','tool','guide','org','media','course'];

const LIBRARY_CATS   = ['foundations-classics','disability-justice','deaf-culture-asl','captioning-ad','producing-arts-access','policy-legal','creative-disability','memoirs-firstperson','academic-theory','toolkits-working'];
const CINEMA_CATS    = ['documentaries','performance','short-film','podcasts','series-tv','narrative-film','talks-lectures','festival-recent'];
const ACCESS_CATS    = ['law-policy','captioning','audio-description','asl-interpretation','theater-live-events','film-media-production','digital-web','disability-justice-arts','funding-organizations','training-education'];

function ContentManagementPanel() {
  const [section,    setSection]    = useState<ContentSection>('library');
  const [items,      setItems]      = useState<ContentItem[]>([]);
  const [loading,    setLoading]    = useState(false);
  const [showAdd,    setShowAdd]    = useState(false);
  const [editingId,  setEditingId]  = useState<string | null>(null);
  const [form,       setForm]       = useState({ ...BLANK_ITEM });
  const [saving,     setSaving]     = useState(false);
  const [saveMsg,    setSaveMsg]    = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchItems = async (sec: ContentSection) => {
    setLoading(true);
    const { data } = await supabase
      .from('resources')
      .select('*')
      .eq('section', sec)
      .order('created_at', { ascending: false });
    setItems((data ?? []) as ContentItem[]);
    setLoading(false);
  };

  useEffect(() => { fetchItems(section); }, [section]);

  const switchSection = (sec: ContentSection) => {
    setSection(sec);
    setShowAdd(false);
    setEditingId(null);
    setSaveMsg('');
  };

  const startAdd = () => {
    setForm({ ...BLANK_ITEM });
    setEditingId(null);
    setShowAdd(true);
    setSaveMsg('');
  };

  const startEdit = (item: ContentItem) => {
    setForm({
      title:            item.title          ?? '',
      author:           item.author         ?? '',
      director:         item.director       ?? '',
      creator:          item.creator        ?? '',
      year:             item.year?.toString()        ?? '',
      description:      item.description    ?? '',
      url:              item.url            ?? '',
      item_type:        item.item_type      ?? '',
      category:         item.category       ?? '',
      tags:             (item.tags ?? []).join(', '),
      is_free:          item.is_free        ?? false,
      how_to_access:    item.how_to_access  ?? '',
      is_essential:     item.is_essential   ?? false,
      format_list:      (item.format_list   ?? []).join(', '),
      platform_list:    (item.platform_list ?? []).join(', '),
      has_ad:           item.has_ad         ?? false,
      has_captions:     item.has_captions   ?? false,
      duration_minutes: item.duration_minutes?.toString() ?? '',
      location_note:    item.location_note  ?? '',
      slug:             item.slug           ?? '',
      admin_notes:      item.admin_notes    ?? '',
      status:           item.status         ?? 'approved',
    });
    setEditingId(item.id);
    setShowAdd(false);
    setSaveMsg('');
  };

  const cancelForm = () => {
    setShowAdd(false);
    setEditingId(null);
    setSaveMsg('');
  };

  const tagsArray = (s: string) =>
    s.split(',').map((t) => t.trim()).filter(Boolean);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    setSaveMsg('');

    const slug = form.slug.trim() ||
      form.title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    const payload = {
      section,
      title:            form.title.trim(),
      author:           form.author.trim()       || null,
      director:         form.director.trim()     || null,
      creator:          form.creator.trim()      || null,
      year:             form.year ? parseInt(form.year) : null,
      description:      form.description.trim()  || null,
      url:              form.url.trim()           || null,
      item_type:        form.item_type            || null,
      category:         form.category             || null,
      tags:             tagsArray(form.tags),
      is_free:          form.is_free,
      how_to_access:    form.how_to_access.trim() || null,
      is_essential:     form.is_essential,
      format_list:      tagsArray(form.format_list),
      platform_list:    tagsArray(form.platform_list),
      has_ad:           form.has_ad,
      has_captions:     form.has_captions,
      duration_minutes: form.duration_minutes ? parseInt(form.duration_minutes) : null,
      location_note:    form.location_note.trim() || null,
      slug,
      admin_notes:      form.admin_notes.trim()   || null,
      status:           form.status,
    };

    let error;
    if (editingId) {
      ({ error } = await supabase.from('resources').update(payload).eq('id', editingId));
    } else {
      ({ error } = await supabase.from('resources').insert(payload));
    }

    setSaving(false);
    if (error) {
      setSaveMsg('Error saving: ' + error.message);
    } else {
      setSaveMsg(editingId ? 'Saved!' : 'Item added!');
      setShowAdd(false);
      setEditingId(null);
      fetchItems(section);
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from('resources').delete().eq('id', id);
    setDeleteConfirm(null);
    fetchItems(section);
  };

  const typesForSection = section === 'library' ? LIBRARY_TYPES : section === 'cinema' ? CINEMA_TYPES : ACCESS_TYPES;
  const catsForSection  = section === 'library' ? LIBRARY_CATS  : section === 'cinema' ? CINEMA_CATS  : ACCESS_CATS;

  const inp: React.CSSProperties = {
    width: '100%', padding: '6px 8px', fontSize: '0.875rem',
    border: '1px solid var(--color-border)', borderRadius: 4,
    fontFamily: 'inherit', boxSizing: 'border-box' as const,
  };
  const label: React.CSSProperties = {
    display: 'block', fontSize: '0.75rem', fontWeight: 600,
    color: 'var(--color-text-muted)', marginBottom: 3,
  };
  const row: React.CSSProperties = { marginBottom: '0.75rem' };
  const row2: React.CSSProperties = { display: 'flex', gap: '0.75rem', marginBottom: '0.75rem', flexWrap: 'wrap' };

  const ItemForm = () => (
    <form onSubmit={handleSave} style={{ background: 'var(--aac-cream)', border: '1px solid var(--color-border)', borderRadius: 6, padding: '1.25rem', marginBottom: '1.5rem' }} noValidate>
      <h3 style={{ fontWeight: 700, color: 'var(--aac-blue)', fontSize: '1rem', marginBottom: '1rem' }}>
        {editingId ? 'Edit Item' : `Add New ${section === 'library' ? 'Library' : section === 'cinema' ? 'Cinema' : 'Accessibility'} Item`}
      </h3>

      {/* Title + Slug */}
      <div style={row2}>
        <div style={{ flex: '2 1 200px' }}>
          <label style={label} htmlFor="cf-title">Title <span style={{ color: 'red' }}>*</span></label>
          <input id="cf-title" style={inp} value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required />
        </div>
        <div style={{ flex: '1 1 160px' }}>
          <label style={label} htmlFor="cf-slug">Slug <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(auto if blank)</span></label>
          <input id="cf-slug" style={inp} value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} placeholder="e.g. crip-camp" />
        </div>
      </div>

      {/* Author (Library) / Director + Creator (Cinema) */}
      {section === 'library' && (
        <div style={row}>
          <label style={label} htmlFor="cf-author">Author <span style={{ color: 'red' }}>*</span></label>
          <input id="cf-author" style={inp} value={form.author} onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))} />
        </div>
      )}
      {section === 'cinema' && (
        <div style={row2}>
          <div style={{ flex: 1, minWidth: 140 }}>
            <label style={label} htmlFor="cf-director">Director</label>
            <input id="cf-director" style={inp} value={form.director} onChange={(e) => setForm((f) => ({ ...f, director: e.target.value }))} />
          </div>
          <div style={{ flex: 1, minWidth: 140 }}>
            <label style={label} htmlFor="cf-creator">Creator <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(podcasts/series)</span></label>
            <input id="cf-creator" style={inp} value={form.creator} onChange={(e) => setForm((f) => ({ ...f, creator: e.target.value }))} />
          </div>
        </div>
      )}

      {/* Type + Category + Year */}
      <div style={row2}>
        <div style={{ flex: 1, minWidth: 140 }}>
          <label style={label} htmlFor="cf-type">Type</label>
          <select id="cf-type" style={{ ...inp, background: '#fff' }} value={form.item_type} onChange={(e) => setForm((f) => ({ ...f, item_type: e.target.value }))}>
            <option value="">-- select --</option>
            {typesForSection.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div style={{ flex: 1, minWidth: 140 }}>
          <label style={label} htmlFor="cf-cat">Category</label>
          <select id="cf-cat" style={{ ...inp, background: '#fff' }} value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
            <option value="">-- select --</option>
            {catsForSection.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div style={{ flex: '0 1 80px' }}>
          <label style={label} htmlFor="cf-year">Year</label>
          <input id="cf-year" type="number" min="1900" max="2099" style={inp} value={form.year} onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))} />
        </div>
      </div>

      {/* Description */}
      <div style={row}>
        <label style={label} htmlFor="cf-desc">Description</label>
        <textarea id="cf-desc" rows={4} style={{ ...inp, resize: 'vertical' }} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
      </div>

      {/* URL + Is Free */}
      <div style={row2}>
        <div style={{ flex: 3, minWidth: 200 }}>
          <label style={label} htmlFor="cf-url">URL <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(free access link)</span></label>
          <input id="cf-url" type="url" style={inp} value={form.url} onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))} placeholder="https://" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', paddingBottom: 2 }}>
          <label style={{ ...label, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
            <input type="checkbox" checked={form.is_free} onChange={(e) => setForm((f) => ({ ...f, is_free: e.target.checked }))} />
            Free to access
          </label>
          <label style={{ ...label, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', marginTop: 4 }}>
            <input type="checkbox" checked={form.is_essential} onChange={(e) => setForm((f) => ({ ...f, is_essential: e.target.checked }))} />
            Mark as Essential ★
          </label>
        </div>
      </div>

      {/* How to access (non-free) */}
      {!form.is_free && (
        <div style={row}>
          <label style={label} htmlFor="cf-access">How to access <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(shown when not free)</span></label>
          <textarea id="cf-access" rows={2} style={{ ...inp, resize: 'vertical' }} value={form.how_to_access} onChange={(e) => setForm((f) => ({ ...f, how_to_access: e.target.value }))} placeholder="e.g. Available on Netflix. Check your library for free streaming." />
        </div>
      )}

      {/* Tags */}
      <div style={row}>
        <label style={label} htmlFor="cf-tags">Tags <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(comma-separated)</span></label>
        <input id="cf-tags" style={inp} value={form.tags} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))} placeholder="Disabled Voice, Deaf-Centered, Free" />
      </div>

      {/* Library: Format */}
      {section === 'library' && (
        <div style={row}>
          <label style={label} htmlFor="cf-fmt">Format <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(comma-separated, e.g. PDF, Web, Audiobook)</span></label>
          <input id="cf-fmt" style={inp} value={form.format_list} onChange={(e) => setForm((f) => ({ ...f, format_list: e.target.value }))} />
        </div>
      )}

      {/* Cinema: Platform + Runtime + AD + Captions */}
      {section === 'cinema' && (
        <>
          <div style={row2}>
            <div style={{ flex: 2, minWidth: 140 }}>
              <label style={label} htmlFor="cf-platform">Platform <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(comma-separated, e.g. Netflix, YouTube)</span></label>
              <input id="cf-platform" style={inp} value={form.platform_list} onChange={(e) => setForm((f) => ({ ...f, platform_list: e.target.value }))} />
            </div>
            <div style={{ flex: '0 1 90px' }}>
              <label style={label} htmlFor="cf-runtime">Runtime (min)</label>
              <input id="cf-runtime" type="number" min="0" style={inp} value={form.duration_minutes} onChange={(e) => setForm((f) => ({ ...f, duration_minutes: e.target.value }))} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
            <label style={{ ...label, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.has_ad} onChange={(e) => setForm((f) => ({ ...f, has_ad: e.target.checked }))} />
              Audio Description available
            </label>
            <label style={{ ...label, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.has_captions} onChange={(e) => setForm((f) => ({ ...f, has_captions: e.target.checked }))} />
              Captions available
            </label>
          </div>
        </>
      )}

      {/* Accessibility Resources: Location */}
      {section === 'accessibility' && (
        <div style={row}>
          <label style={label} htmlFor="cf-loc">Location / jurisdiction <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(optional, e.g. United States)</span></label>
          <input id="cf-loc" style={inp} value={form.location_note} onChange={(e) => setForm((f) => ({ ...f, location_note: e.target.value }))} />
        </div>
      )}

      {/* Status + Admin notes */}
      <div style={row2}>
        <div style={{ flex: '0 1 160px' }}>
          <label style={label} htmlFor="cf-status">Status</label>
          <select id="cf-status" style={{ ...inp, background: '#fff' }} value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
            <option value="approved">Approved (visible on page)</option>
            <option value="pending">Pending (hidden from public)</option>
            <option value="rejected">Rejected (hide this item)</option>
          </select>
        </div>
        <div style={{ flex: 1, minWidth: 180 }}>
          <label style={label} htmlFor="cf-anotes">Admin notes</label>
          <input id="cf-anotes" style={inp} value={form.admin_notes} onChange={(e) => setForm((f) => ({ ...f, admin_notes: e.target.value }))} />
        </div>
      </div>

      {saveMsg && (
        <p role="status" style={{ fontSize: '0.875rem', color: saveMsg.startsWith('Error') ? 'red' : 'green', marginBottom: '0.5rem' }}>
          {saveMsg}
        </p>
      )}

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button type="submit" className="btn btn-primary btn-sm" disabled={saving || !form.title.trim()}>
          {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Add Item'}
        </button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={cancelForm}>Cancel</button>
      </div>
    </form>
  );

  return (
    <div>
      {/* Section tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {(['library', 'cinema', 'accessibility'] as ContentSection[]).map((s) => (
            <button
              key={s}
              onClick={() => switchSection(s)}
              className={`btn btn-sm ${section === s ? 'btn-primary' : 'btn-ghost'}`}
              style={{ textTransform: 'capitalize' }}
            >
              {s === 'library' ? '📚 Library' : s === 'cinema' ? '🎬 Cinema' : '♿ Accessibility Resources'}
            </button>
          ))}
        </div>
        {!showAdd && !editingId && (
          <button onClick={startAdd} className="btn btn-primary btn-sm">
            + Add New Item
          </button>
        )}
      </div>

      <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
        Items added here appear on the public page alongside the existing content.
        Set status to <strong>Approved</strong> to make them visible.
        Adding an item with the same slug as an existing one will override the hardcoded version.
      </p>

      {(showAdd || editingId) && <ItemForm />}

      {saveMsg && !showAdd && !editingId && (
        <p role="status" style={{ fontSize: '0.875rem', color: 'green', marginBottom: '0.75rem' }}>{saveMsg}</p>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
          <span className="spinner" style={{ width: 24, height: 24, borderWidth: 3 }} aria-hidden="true" />
        </div>
      ) : items.length === 0 ? (
        <div className="content-card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
          No {section} items in the database yet.
          <br />
          <span style={{ fontSize: '0.8125rem' }}>
            Click &ldquo;+ Add New Item&rdquo; to add one. Existing hardcoded content still shows on the page.
          </span>
        </div>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {items.map((item) => (
            <li key={item.id} className="content-card">
              {deleteConfirm === item.id ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text)' }}>
                    Delete <strong>{item.title}</strong>? This cannot be undone.
                  </p>
                  <button onClick={() => handleDelete(item.id)} className="btn btn-sm" style={{ background: '#c0392b', color: '#fff', border: 'none' }}>
                    Yes, delete
                  </button>
                  <button onClick={() => setDeleteConfirm(null)} className="btn btn-ghost btn-sm">Cancel</button>
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '0.25rem' }}>
                      <span style={{ fontWeight: 700, color: 'var(--aac-blue)', fontSize: '0.9375rem' }}>{item.title}</span>
                      {item.is_essential && <span className="tag tag-yellow" style={{ fontSize: '0.7rem' }}>★ Essential</span>}
                      {item.is_free && <span className="tag tag-blue" style={{ fontSize: '0.7rem' }}>Free</span>}
                      <span className={`tag ${item.status === 'approved' ? 'tag-green' : item.status === 'pending' ? 'tag-gray' : 'tag-red'}`} style={{ fontSize: '0.7rem' }}>
                        {item.status}
                      </span>
                    </div>
                    {(item.author || item.director || item.creator) && (
                      <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', margin: '0 0 0.25rem' }}>
                        {item.author && `By ${item.author}`}
                        {item.director && `Dir. ${item.director}`}
                        {item.creator && `${item.director ? ' · ' : ''}${item.creator}`}
                        {item.year && ` (${item.year})`}
                      </p>
                    )}
                    <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                      {item.item_type && <span className="tag tag-gray" style={{ fontSize: '0.7rem' }}>{item.item_type}</span>}
                      {item.category && <span className="tag tag-gray" style={{ fontSize: '0.7rem' }}>{item.category}</span>}
                      {item.slug && <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>/{item.slug}</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.375rem', flexShrink: 0 }}>
                    <button onClick={() => startEdit(item)} className="btn btn-ghost btn-sm" aria-label={`Edit ${item.title}`}>Edit</button>
                    <button onClick={() => setDeleteConfirm(item.id)} className="btn btn-sm" style={{ background: '#fce4e4', color: '#c0392b', border: '1px solid #f5c6c6', fontSize: '0.75rem', padding: '4px 10px' }} aria-label={`Delete ${item.title}`}>
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
