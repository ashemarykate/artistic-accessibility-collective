# Artistic Accessibility Collective

A professional registry and learning resources platform for accessibility professionals (ASL interpreters, captioners, audio describers, event accessibility specialists, and more).

## 🎯 Project Status

**Working Prototype** ✅

This is a functional MVP with the core workflow implemented:
- Public submission form
- Admin approval dashboard
- Public directory (opt-in visibility)
- Member directory (login required)
- Peer endorsement system
- Basic authentication

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- A Supabase account and project
- Git

### 1. Set Up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** in your Supabase dashboard
3. Run the entire `supabase-migration.sql` file to create all tables, policies, and functions
4. After running migrations, create your first admin user:
   - Sign up for an account in your app first (or use Supabase Auth UI)
   - Note your `user_id` from the `auth.users` table
   - Run this SQL to make yourself an admin:
   ```sql
   INSERT INTO admin_users (user_id, role) 
   VALUES ('your-auth-user-id-here', 'super_admin');
   ```

### 2. Configure Environment Variables

1. Copy `.env.local.example` to `.env.local` (or edit the existing `.env.local`)
2. Get your Supabase credentials from **Project Settings > API**:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your project URL (format: `https://xxxxx.supabase.co`)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your anon/public API key
   - `SUPABASE_SERVICE_ROLE_KEY`: Your service role key (for server-side operations)

**Update `.env.local`:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
SUPABASE_DATABASE_PASSWORD=your-db-password
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📋 Features Implemented

### ✅ Core Workflow

1. **Public Submission Form** (`/submit`)
   - Anyone can submit their profile
   - Creates profile with `status='pending'`
   - Captures all relevant professional information

2. **Admin Dashboard** (`/admin`)
   - Review pending submissions
   - Approve or reject profiles
   - Toggle public visibility for approved profiles
   - View all profiles (pending, approved, rejected)

3. **Public Directory** (`/directory`)
   - Shows only approved profiles with `public_visible=true`
   - Search and filter by specialty
   - Shows endorsement counts
   - No login required

4. **Member Directory** (`/members`)
   - Login required
   - Shows ALL approved profiles (including those not publicly visible)
   - Displays full contact information
   - Search and filter functionality

5. **Profile Pages** (`/profile/[id]`)
   - Individual profile view
   - Shows all endorsements with endorser avatars
   - Logged-in members can endorse other members
   - Contact info visible to logged-in users

6. **Authentication** (`/login`)
   - Email/password signup and login
   - Magic link authentication
   - Supabase Auth integration

### 🔒 Security (Row-Level Security)

All data access is controlled by Supabase RLS policies:
- Public can only see approved + public_visible profiles
- Members can see all approved profiles
- Admins can see everything
- Users can only create endorsements if they're approved members
- Users cannot endorse themselves

## 🎨 User Flows

### New Professional Joins

1. Visit `/submit` and fill out the form
2. Profile created with `status='pending'`
3. Admin reviews in `/admin`
4. Admin approves → profile visible in member directory
5. Member can opt into public directory (admin toggles `public_visible`)

### Member Endorses Another Member

1. Login at `/login`
2. Browse `/members` or `/directory`
3. Click on a profile
4. Click "Endorse" button
5. Endorsement appears on their profile with your avatar

### Admin Workflow

1. Login at `/login`
2. Visit `/admin`
3. See pending profiles in yellow "Pending" tab
4. Click "Approve" or "Reject"
5. For approved profiles, toggle "Public Visible" checkbox to add to public directory

## 📁 Project Structure

```
├── app/
│   ├── page.tsx              # Home page
│   ├── submit/page.tsx       # Public submission form
│   ├── directory/page.tsx    # Public directory
│   ├── members/page.tsx      # Member directory (login required)
│   ├── profile/[id]/page.tsx # Individual profile view
│   ├── admin/page.tsx        # Admin dashboard
│   └── login/page.tsx        # Authentication page
├── lib/
│   └── supabase.ts           # Supabase client & types
├── supabase-migration.sql    # Complete database schema
├── DATABASE_SCHEMA.md        # Schema documentation
├── PROJECT_OVERVIEW.md       # Project planning doc
└── .env.local                # Environment variables (not in git)
```

## 🔧 Tech Stack

- **Frontend**: Next.js 15 (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + RLS)
- **Deployment**: Vercel (recommended)

## 🚀 Deployment

### Option 1: Vercel (Recommended)

1. Push your code to GitHub
2. Import the repo in [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy!

### Option 2: Other Platforms

Works on any platform that supports Next.js:
- Netlify
- Railway
- Fly.io
- Your own server with Node.js

Just make sure to set the environment variables.

## ✅ What Works

- ✅ Public profile submissions
- ✅ Admin approval workflow
- ✅ Public directory (opt-in)
- ✅ Member directory (full access)
- ✅ Endorsement system (create/remove)
- ✅ Profile pages with endorsement display
- ✅ Authentication (email/password + magic link)
- ✅ Row-level security (RLS)
- ✅ Search and filtering
- ✅ Responsive design

## 🚧 What's TODO

### High Priority

- [ ] **Email notifications** when profile is approved/rejected
- [ ] **Profile editing** for approved members
- [ ] **Avatar uploads** (Supabase Storage)
- [ ] **Better admin notes** (add notes to approved profiles)
- [ ] **Endorsement notes** (members can add context when endorsing)

### Medium Priority

- [ ] **Learning resources system** (videos, workshops)
  - Tables already in schema, just need UI
- [ ] **Advanced search** (full-text search, location radius)
- [ ] **Profile analytics** for admins
- [ ] **Export directory** as CSV/PDF
- [ ] **Batch actions** in admin (approve multiple at once)

### Nice to Have

- [ ] **Social sharing** (share profiles on social media)
- [ ] **Calendar integration** (availability tracking)
- [ ] **Messaging system** (direct contact between members)
- [ ] **Recommendations** (suggest similar professionals)
- [ ] **Mobile app** (React Native?)

## 🐛 Known Issues

1. **Supabase URL must be configured manually** in `.env.local` (not included in `keys.txt`)
2. **First admin must be created via SQL** (no UI for this yet)
3. **No password reset flow** (Supabase supports it, just need to add UI)
4. **Avatar placeholder** is just first initial (no default avatar)
5. **No loading states** for some operations
6. **Search is client-side** (could be slow with many profiles)

## 🤝 Contributing

This is a personal project for MK, but suggestions welcome!

## 📝 Notes for MK

### Creating Your First Admin Account

After running migrations:
1. Sign up at `/login` with your email
2. Check the `auth.users` table in Supabase for your `user_id`
3. Run this SQL:
   ```sql
   INSERT INTO admin_users (user_id, role) 
   VALUES ('your-user-id', 'super_admin');
   ```
4. Now you can access `/admin`

### Adding Test Data

To test the directory, you can:
1. Use the public form at `/submit` to add test profiles
2. Approve them in `/admin`
3. Toggle public visibility
4. Create multiple accounts to test endorsements

### Customization Ideas

- Update colors in `tailwind.config.js`
- Add your logo to `app/page.tsx`
- Customize email templates in Supabase Auth settings
- Add custom domain in Vercel

## 📧 Questions?

Built by: Your OpenClaw AI Assistant  
For: Mary Kate Ashe (MK)  
Project started: 2026-01-30

---

**Ready to go!** 🎉
