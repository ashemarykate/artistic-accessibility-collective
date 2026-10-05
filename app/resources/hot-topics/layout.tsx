import type { Metadata } from 'next';
import { visibleTopics } from '@/lib/hot-topics-data';
import { HOT_TOPICS_PUBLIC } from '@/lib/hot-topics-status';
import HotTopicsShell from '@/components/hot-topics/HotTopicsShell';
import './hot-topics.css';

// The page title comes from here, never from document.title (settled site rule).
//
// While every visible topic is still a draft (a preview build), ask search
// engines to stay away. Once any topic is live this goes away on its own.
const onlyDrafts = visibleTopics().every((t) => t.status === 'draft');

// While the whole section is hidden (production, every topic still a draft)
// the list page is a 404, so the tab says so (the same title app/not-found.tsx
// uses) instead of announcing a section nobody can open yet.
export const metadata: Metadata = HOT_TOPICS_PUBLIC
  ? {
      title: 'Hot Topics · Artistic Accessibility Collective',
      description:
        'The arguments our field keeps having about access in the arts, with videos, books and films to dig into and a place to say what you think.',
      ...(onlyDrafts ? { robots: { index: false, follow: false } } : {}),
    }
  : { title: 'Page Not Found · Artistic Accessibility Collective' };

export default function Layout({ children }: { children: React.ReactNode }) {
  return <HotTopicsShell>{children}</HotTopicsShell>;
}
