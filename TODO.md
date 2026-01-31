# TODO List - Artistic Accessibility Collective

## ✅ Completed (MVP)

### Core Features
- [x] Database schema designed and documented
- [x] Supabase migration SQL ready to run
- [x] Next.js app initialized with TypeScript & Tailwind
- [x] Supabase client integration
- [x] Public submission form
- [x] Admin dashboard with approval workflow
- [x] Public directory (opt-in visibility)
- [x] Member directory (login required, full contact info)
- [x] Individual profile pages
- [x] Endorsement system (add/remove endorsements)
- [x] Authentication (email/password + magic link)
- [x] Row-level security (RLS) policies
- [x] Search and filter functionality
- [x] Responsive design (mobile-friendly)
- [x] GitHub repository created and pushed
- [x] Comprehensive README with setup instructions

### Security
- [x] RLS policies for profiles
- [x] RLS policies for endorsements
- [x] RLS policies for resources
- [x] Admin role system
- [x] Can't endorse yourself
- [x] Only approved members can endorse

## 🚧 High Priority (Core Functionality)

### Must Have Before Launch
- [ ] **Configure Supabase URL** - Update `.env.local` with actual project URL
- [ ] **Run database migrations** - Execute `supabase-migration.sql` in Supabase
- [ ] **Create first admin user** - Insert admin record via SQL
- [ ] **Test full workflow** - Submit → Approve → Display → Endorse

### Important Features Missing
- [ ] **Email notifications**
  - [ ] Profile approved/rejected notifications
  - [ ] New endorsement notifications
  - [ ] Welcome email on signup
- [ ] **Profile editing** 
  - [ ] Members can update their own profiles
  - [ ] Need UI for editing
  - [ ] Handle re-approval if needed?
- [ ] **Avatar uploads**
  - [ ] Set up Supabase Storage bucket
  - [ ] Add upload UI to submission form
  - [ ] Add upload UI to profile edit
  - [ ] Image resize/optimization
- [ ] **Password reset flow**
  - [ ] Forgot password link
  - [ ] Reset password page
  - [ ] Supabase already supports this

## 🎯 Medium Priority (Polish)

### User Experience
- [ ] **Loading states** for all async operations
- [ ] **Error handling** with user-friendly messages
- [ ] **Success messages** (toasts/notifications)
- [ ] **Form validation** improvements
- [ ] **Accessibility (a11y) audit** - ironic if our accessibility platform isn't accessible!
- [ ] **SEO optimization** (meta tags, Open Graph)

### Admin Features
- [ ] **Admin notes UI** - Add notes to approved profiles
- [ ] **Batch actions** - Approve multiple profiles at once
- [ ] **Profile analytics** - View counts, popular searches
- [ ] **Export directory** - CSV/PDF download
- [ ] **Admin activity log** - Track who approved what

### Member Features
- [ ] **Endorsement notes** - Add context when endorsing
- [ ] **Edit endorsements** - Change note after endorsing
- [ ] **Profile preview** - See what your profile looks like
- [ ] **Notification preferences** - Control email notifications

## 🌟 Low Priority (Future Enhancements)

### Learning Resources System
All tables are in the schema, just need UI:
- [ ] Resource submission form
- [ ] Resource approval workflow
- [ ] Resource library/gallery
- [ ] Video player integration
- [ ] Resource search and filtering
- [ ] Link resources to creators (profiles)
- [ ] Custom access lists for paid workshops

### Advanced Features
- [ ] **Full-text search** (PostgreSQL FTS)
- [ ] **Location-based search** (radius search)
- [ ] **Availability calendar** integration
- [ ] **Direct messaging** between members
- [ ] **Profile recommendations** (similar professionals)
- [ ] **Social sharing** (share profiles on Twitter, etc.)
- [ ] **Public API** for integrations
- [ ] **Mobile app** (React Native)
- [ ] **Multi-language support** (i18n)

### Analytics & Insights
- [ ] Profile view tracking
- [ ] Popular specialties
- [ ] Geographic distribution
- [ ] Endorsement network visualization
- [ ] Member growth over time

## 🐛 Known Bugs & Issues

1. **Supabase URL not in environment** - Must be manually configured
2. **No first-admin UI** - Must create via SQL
3. **Client-side search** - Could be slow with many profiles
4. **No image optimization** - Avatars not resized
5. **Missing loading spinners** - Some operations feel unresponsive
6. **No error boundaries** - App could crash on errors
7. **Public submission has no captcha** - Could get spam

## 📝 Technical Debt

- [ ] Add TypeScript strict mode
- [ ] Add unit tests (Jest/Vitest)
- [ ] Add E2E tests (Playwright)
- [ ] Add Storybook for components
- [ ] Extract reusable components
- [ ] Set up CI/CD pipeline
- [ ] Add logging/monitoring (Sentry?)
- [ ] Database backups strategy
- [ ] Staging environment

## 🎨 Design Improvements

- [ ] Custom design system (vs default Tailwind)
- [ ] Add logo and branding
- [ ] Professional illustrations
- [ ] Dark mode support
- [ ] Better empty states
- [ ] Animated transitions
- [ ] Print-friendly styles

## 📚 Documentation Needed

- [ ] API documentation (if we add one)
- [ ] Contributing guide
- [ ] Code of conduct
- [ ] Privacy policy
- [ ] Terms of service
- [ ] User guide/help docs
- [ ] Video tutorials for admin

## 🚀 Deployment Checklist

- [ ] Set up Vercel project
- [ ] Configure environment variables in Vercel
- [ ] Set up custom domain
- [ ] Configure DNS
- [ ] Set up email service (SendGrid/Mailgun)
- [ ] Test production build locally
- [ ] Performance audit (Lighthouse)
- [ ] Security audit
- [ ] SSL certificate
- [ ] Monitoring/analytics setup

## Next Steps for MK

**Immediate (This Week):**
1. Get Supabase project URL from Supabase dashboard
2. Update `.env.local` with real Supabase URL
3. Run `supabase-migration.sql` in Supabase SQL editor
4. Create first admin user via SQL
5. Test the full workflow locally
6. Deploy to Vercel

**Short Term (Next 2 Weeks):**
1. Add email notifications
2. Enable profile editing
3. Set up avatar uploads
4. Deploy to production
5. Invite first beta testers

**Medium Term (Next Month):**
1. Collect feedback from beta testers
2. Fix bugs and polish UX
3. Add learning resources system
4. Launch publicly!

---

**Questions for MK:**
1. Do you want to deploy now or test locally first?
2. Should I help you set up Vercel deployment?
3. What's your priority: more features or polish what we have?
4. Do you need help creating email templates?
5. Should we add the learning resources system before launch?
