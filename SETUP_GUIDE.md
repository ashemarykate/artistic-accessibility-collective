# Setup Guide for MK

Quick step-by-step guide to get your Artistic Accessibility Collective running.

## ⚡ Quick Setup (15 minutes)

### Step 1: Get Your Supabase Project URL

1. Go to [supabase.com](https://supabase.com) and log in
2. Open your project (or create a new one if you haven't yet)
3. Go to **Project Settings** (gear icon in sidebar)
4. Click **API** in the settings menu
5. Copy these values:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **anon public key** (long string starting with `eyJ...`)
   - **service_role key** (another long string, keep this secret!)

### Step 2: Update Environment Variables

1. Open the file `accessibility-project/.env.local` in a text editor
2. Replace the placeholder values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-actual-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc... (paste the anon key)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... (paste the service role key)
SUPABASE_DATABASE_PASSWORD=Uqqks7ClaStVHerA
```

3. Save the file

### Step 3: Run Database Migrations

1. In Supabase dashboard, click **SQL Editor** in the sidebar
2. Click **New query**
3. Open the file `accessibility-project/supabase-migration.sql` on your computer
4. Copy the ENTIRE contents
5. Paste into the Supabase SQL Editor
6. Click **Run** (bottom right)
7. Wait for it to complete (should see "Success" message)

### Step 4: Make Yourself an Admin

You need to create an account first, then make yourself admin:

1. **Start the app:**
   ```bash
   cd accessibility-project
   npm run dev
   ```

2. **Create your account:**
   - Open http://localhost:3000/login
   - Click "Don't have an account? Sign up"
   - Sign up with your email and password
   - You'll get a confirmation email from Supabase

3. **Get your User ID:**
   - Go back to Supabase dashboard
   - Click **Authentication** in sidebar
   - Click **Users**
   - Find your email in the list
   - Copy the **ID** (looks like `12345678-abcd-...`)

4. **Make yourself admin:**
   - Go to **SQL Editor** in Supabase
   - Run this query (replace with your actual user ID):
   ```sql
   INSERT INTO admin_users (user_id, role) 
   VALUES ('your-user-id-here', 'super_admin');
   ```
   - Click **Run**

5. **Test admin access:**
   - Go back to http://localhost:3000
   - Click "Admin Dashboard" link
   - You should see the admin panel!

### Step 5: Test the Full Workflow

**Test submission:**
1. Open http://localhost:3000
2. Click "Join the Registry"
3. Fill out the form with test data
4. Submit

**Test approval:**
1. Go to http://localhost:3000/admin
2. See your test submission in "Pending" tab
3. Click "Approve"
4. Check the "Approved" tab to see it there
5. Toggle "Public Visible" checkbox

**Test directories:**
1. Go to http://localhost:3000/directory
2. Should see your approved profile (if you made it public)
3. Log in and go to http://localhost:3000/members
4. Should see all approved profiles with contact info

**Test endorsements:**
1. Create a second test account (or use your main account)
2. Log in with second account
3. View a profile
4. Click "Endorse"
5. See the endorsement appear on the profile

## 🚀 Deploy to Vercel (Optional)

Once it's working locally, deploy to production:

1. Push your changes to GitHub (already done!)
2. Go to [vercel.com](https://vercel.com) and sign in with GitHub
3. Click "Add New Project"
4. Import your repository: `artistic-accessibility-collective`
5. Configure settings:
   - Framework Preset: **Next.js** (auto-detected)
   - Root Directory: `./`
6. Add **Environment Variables**:
   - Click "Environment Variables"
   - Add each variable from your `.env.local` file:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY`
7. Click **Deploy**
8. Wait 2-3 minutes for deployment
9. You'll get a URL like `https://artistic-accessibility-collective.vercel.app`

**After deployment:**
- Test the live site
- Set up a custom domain if you have one (Settings > Domains)
- Your app is now live! 🎉

## 🔧 Common Issues

### "Error connecting to Supabase"
- Check that your `.env.local` has the correct URL and keys
- Make sure you restarted the dev server after updating `.env.local`

### "You do not have admin access"
- Make sure you ran the SQL to insert yourself into `admin_users`
- Check that the `user_id` matches your actual user ID from auth.users

### "No profiles showing in directory"
- Make sure you approved profiles in the admin panel
- For public directory, make sure you toggled "Public Visible"

### Database migration errors
- Make sure you copied the ENTIRE `supabase-migration.sql` file
- Try running it section by section if needed

### App won't start
- Run `npm install` to make sure all dependencies are installed
- Check that Node.js 18+ is installed: `node --version`

## 📧 Next: Email Notifications

If you want to add email notifications (recommended), here's how:

1. In Supabase dashboard, go to **Authentication > Email Templates**
2. Customize the templates for:
   - Confirmation email
   - Magic link email
   - Password reset email

For custom notifications (profile approved, etc.), you'll need:
- A service like SendGrid, Mailgun, or Resend
- Add email-sending code to the admin approval flow

This is on the TODO list but not critical for MVP.

## 🎯 What's Next?

Your prototype is **fully functional**! Here's what you can do:

**Immediately:**
1. Test everything thoroughly
2. Add a few real profiles (or ask friends to test)
3. Get feedback on the UX

**Soon:**
1. Add profile editing (high priority)
2. Set up avatar uploads
3. Polish the design
4. Add email notifications

**Eventually:**
1. Build the learning resources system
2. Add more advanced features (see TODO.md)

## Need Help?

If you get stuck:
1. Check the README.md
2. Check the TODO.md for known issues
3. Ask me! I'm here to help

---

**You've got this!** The hard part (building the prototype) is done. Now it's just polish and launching. 🚀
