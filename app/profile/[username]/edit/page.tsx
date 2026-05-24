'use client';

// Thin redirect: /profile/[username]/edit → /profile/edit
// The edit page lives at /profile/edit and loads the current user's
// own profile via auth — no need to trust the URL slug.

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function EditProfileRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/profile/edit'); }, [router]);
  return null;
}
