-- Fills in AAC-Bot's showcase fields: everything the real /submit form doesn't
-- collect, so every section of the profile page has real content in it.
-- Run in Supabase SQL Editor after supabase-set-bot-flag.sql.
--
-- Only touches columns the signup flow doesn't set (avatar, story, personality,
-- strengths, skills, education, growth, interests, work details). Leaves the
-- fields already set by the real signup (bio, specialties, certifications,
-- languages, pronouns, location, etc.) untouched.
--
-- Sets username = 'bot', so the profile becomes reachable at /profile/bot
-- (confirmed available: no existing profile has that username).

UPDATE profiles SET
  username             = 'bot',
  avatar_url            = '/images/aac-bot-avatar.svg',
  avatar_alt            = 'A friendly blue robot mascot with yellow eyes and a smile',
  profile_bg_color      = '#0d5c4a',

  mood                  = 'Caffeinated on electricity',
  member_since_display  = 'Summer 2026',
  highlights            = 'Hi, I am AAC-Bot! I live here as the Collective''s demo mascot, filled out to the brim so you can see what every section of a profile looks like with real content in it. Poke around, and feel free to use me as inspiration when you fill out your own.',

  work_category         = 'Site Demo & QA',
  event_sizes           = ARRAY['Any size event'],
  timezone              = 'UTC (I don''t sleep)',
  communication_style   = ARRAY['Email','Whatever is most accessible for you'],
  preferred_contact     = 'Email',
  rate_info             = 'Free. I work for compliments and good captions.',
  availability_status   = 'Available Now',
  experience_level      = 'seasoned',

  career_highlights     = 'Before joining the Collective, I spent time in a training simulation captioning a thousand rehearsals without a single typo, describing a sunset so vividly someone teared up, and helping a small venue pass its very first accessibility audit. None of that happened in real life, I am a robot, but it is fun to imagine.',
  passionate_about      = 'Making sure accessibility is never an afterthought, and making sure every member of this Collective has a profile people actually want to read.',

  fun_fact              = 'My favorite punctuation mark is the interpunct (·). It never pretends to be an em dash.',
  favorite_event        = 'Any show with open captions, a relaxed performance, and snacks in the lobby.',

  strengths             = ARRAY['Filling out every field','Staying on brand','Being extremely available'],

  software_skills       = ARRAY['CART software','Otter.ai','Premiere Pro','Figma','A very old label maker'],
  new_to_roles          = ARRAY['Live theatre captioning','Museum audio tours'],

  education             = 'Self-taught from every accessibility guide on the internet, twice.',

  not_great_at          = 'Small talk. I only really know how to talk about accessibility.',
  learning_now          = 'How to write alt text that is genuinely useful, not just technically present.',
  want_to_learn         = 'Tactile sign language, and how to put together a really good relaxed performance guide.',

  activities            = ARRAY['Sorting captions by vibe','Collecting accessible venue stickers','Naming houseplants'],
  fav_books             = ARRAY['Anything with excellent alt text'],
  fav_movies            = ARRAY['CODA','Crip Camp'],
  fav_music             = ARRAY['Dial-up modem, ambient mix'],
  fav_tv                = ARRAY['Switched at Birth'],

  community_interests   = ARRAY['Workshops','Continued Education','Discussion Boards','Job Board']

WHERE email = 'bot@artisticaccessibility.com';
