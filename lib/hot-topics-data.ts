// Hot Topics: the topic list and the rules around it.
//
// This file is safe to import from client components. It must NOT import
// library-data, cinema-data or resources-data (those are huge). The server-only
// resolver in lib/hot-topics-resolve.ts turns the slugs and urls below into
// real catalog rows.
//
// HOW A TOPIC GOES LIVE (Mary Kate): every topic starts as a draft. A draft is
// invisible on the live site (404, no links, not in the sitemap) because the
// framing text is public editorial writing that has not been read yet. It
// still shows on your computer while developing, and in any build made with
// NEXT_PUBLIC_HOT_TOPICS_SHOW_DRAFTS=1. When you are happy with a topic, add
// its slug to LIVE_TOPIC_SLUGS in lib/hot-topics-status.ts and push. That
// small file is separate on purpose: the site navigation reads it, and it must
// not carry the text of topics nobody has approved. Do not add a status line to
// the topics below, it is filled in from that file.
//
// HOW TO ADD A REEL: put an object in that topic's videos array. Never guess a
// url or a creator. Leave captions, audioDescription and asl as 'not-checked'
// until someone has actually watched the video for them.
//
// shelfNotes: a one line reason an item belongs, used instead of the catalog's
// first sentence when that sentence does not explain the link. Keyed by library
// slug, cinema slug or resource url. Keep each under 180 characters, and no
// em dashes or en dashes, same as all copy on this site.

import { HOT_TOPICS_PUBLIC, HOT_TOPICS_SHOW_DRAFTS, LIVE_TOPIC_SLUGS } from './hot-topics-status';

export { HOT_TOPICS_PUBLIC, HOT_TOPICS_SHOW_DRAFTS };

export type HotTopicStatus = 'draft' | 'live';
export type ReelPlatform = 'instagram' | 'tiktok' | 'youtube' | 'vimeo';
export type CaptionStatus = 'burned-in' | 'app-only' | 'none' | 'not-checked';
export type Tri = 'yes' | 'no' | 'not-checked';

export interface TopicVideo {
  platform: ReelPlatform;
  url: string;
  title: string;
  creator: string;
  creatorUrl?: string;
  /** One line from us on what happens in the video and why it fits. */
  why: string;
  captions: CaptionStatus;
  audioDescription: Tri | 'not-needed';
  asl: Tri;
  transcriptUrl?: string;
  /** ISO date (YYYY-MM-DD) someone last watched it and checked the flags. */
  checkedOn?: string;
}

export interface HotTopic {
  slug: string;
  /** Sentence case, under 10 words, no ampersand, quotes or contractions (the display font draws them badly). */
  title: string;
  /** One plain sentence for the tile. */
  summary: string;
  take: {
    lead: string;
    sides: [{ label: string; text: string }, { label: string; text: string }];
    note?: string;
  };
  /** How split the field is, not who is right. 1 mild to 5 scorching. */
  heat: 1 | 2 | 3 | 4 | 5;
  /** The What do you think question. */
  prompt: string;
  accent: 'red' | 'coal' | 'pink' | 'paper';
  badge?: 'new' | 'staff-pick';
  status: HotTopicStatus;
  /** ISO date (YYYY-MM-DD). */
  updated: string;
  videos: TopicVideo[];
  /** Library catalog slugs. */
  library: string[];
  /** Cinema catalog slugs. */
  cinema: string[];
  /** Resource urls, exactly as they appear in resources-data. */
  resources: string[];
  shelfNotes?: Record<string, string>;
}

const TOPIC_CONTENT: Omit<HotTopic, 'status'>[] = [
  // ───────────────────────────────────────────────────────────────────────────
  {
    slug: 'inspiration-stories',
    title: 'When is a disability story inspiration porn?',
    summary:
      'Stella Young named stories that use disabled people to make others feel good, and people still argue about where the line is.',
    take: {
      lead:
        'Stella Young gave this a name, inspiration porn, in a 2012 essay, and a nine-minute talk in 2014 made it famous. Inspiration porn is the habit of turning disabled people into feel-good material for nondisabled audiences, and the argument now is about where the line is.',
      sides: [
        {
          label: 'One side says',
          text:
            'A story that exists so the audience can feel better about their own life is using the person in it, however kind the intent. The test is who the story is for and who gets to tell it.',
        },
        {
          label: 'The other side says',
          text:
            'Disabled people have real wins worth sharing, and a story can move an audience without using anyone. If every uplifting story gets called a problem, there are fewer stories about disabled lives to tell.',
        },
      ],
      note: 'Our Resources shelf has little on this one so far, so most of what is below is books and film.',
    },
    heat: 3,
    prompt:
      'Where is the line for you between a story that celebrates a disabled person and one that uses them? Share an example of each if you have one.',
    accent: 'red',
    badge: 'staff-pick',
    updated: '2026-10-05',
    videos: [],
    library: [
      'too-late-to-die-young',
      'find-another-dream-zayid',
      'mean-little-deaf-queer',
      'the-problem-body-film',
      'against-technoableism-shew',
    ],
    cinema: [
      'stella-young-not-your-inspiration',
      'maysoon-zayid-99-problems',
      'murderball',
      'rising-phoenix',
      'lost-voice-guy-cerebral-lolsy',
      'the-miracle-worker-1962',
    ],
    resources: ['https://disabilityvisibilityproject.com/essays'],
    shelfNotes: {
      'too-late-to-die-young': 'A memoir that refuses every tragic or inspirational frame.',
      'find-another-dream-zayid':
        'A short audio memoir that jokes through disability and ambition and refuses every inspirational frame.',
      'mean-little-deaf-queer':
        "A deaf performance artist's memoir, sharp on refusing to be anyone's inspiration.",
      'the-problem-body-film':
        'Film essays on moving past the single tragic or inspirational frame.',
      'against-technoableism-shew':
        'Skewers exoskeleton hype and inspiration robotics coverage, and the belief that technology exists to fix disabled people.',
      'stella-young-not-your-inspiration':
        'The nine-minute talk that made the term famous.',
      'maysoon-zayid-99-problems':
        "A very funny set about refusing to be anyone's inspiration.",
      murderball: 'No inspirational arc and no cure story, just fierce wheelchair rugby players.',
      'rising-phoenix':
        'Paralympians on media condescension and why they refuse the inspiration frame.',
      'lost-voice-guy-cerebral-lolsy':
        'His earlier show was called Inspiration Porn, a takedown of the genre.',
      'the-miracle-worker-1962':
        'Worth watching critically, for how it frames the teacher as the savior.',
      'https://disabilityvisibilityproject.com/essays':
        'Disabled writers on how disability gets shown in film, theater, and media.',
    },
  },

  // ───────────────────────────────────────────────────────────────────────────
  {
    slug: 'cripping-up',
    title: 'Who gets to play disabled characters?',
    summary: 'Should nondisabled actors ever play disabled roles, and who gets hired behind the camera?',
    take: {
      lead:
        'Disability communities call it cripping up when a nondisabled actor plays a disabled character. People disagree about whether it is ever fine, and about what it would take to change who gets cast.',
      sides: [
        {
          label: 'One side says',
          text:
            'Disabled roles should go to disabled actors. Nondisabled actors already play most disabled roles on screen, so each one is a job a disabled actor did not get, and lived experience adds things a performance can miss.',
        },
        {
          label: 'The other side says',
          text:
            'Acting means playing people you are not, and the best actor should get the part. Some also point out that money tends to follow a famous face, so casting gets tangled up with how films get funded.',
        },
      ],
    },
    heat: 5,
    prompt:
      'Should a nondisabled actor ever play a disabled character? Tell us where you land, and what you would want casting to look like.',
    accent: 'coal',
    updated: '2026-10-05',
    videos: [],
    library: [
      'respectability-hollywood-disability',
      'cinema-of-isolation',
      'being-seen-sjunneson',
      'ill-scream-later',
    ],
    cinema: [
      'my-left-foot',
      'a-different-man',
      'the-war-on-wheels-podcast',
      'a-quiet-place-part-ii',
      'echo-marvel',
      'the-peanut-butter-falcon',
    ],
    resources: [
      'https://rudermanfoundation.org/advocacy-media/white-papers/',
      'https://annenberg.usc.edu/research/aii',
      'https://www.filmdis.com',
      'https://www.1in4coalition.org',
      'https://inevitable.foundation',
      'https://phamaly.org/',
    ],
    shelfNotes: {
      'respectability-hollywood-disability':
        'Free toolkits on authentic casting. The organization is now called Disability Belongs.',
      'cinema-of-isolation':
        'The history of how Hollywood has shown physical disability, from silent film on.',
      'being-seen-sjunneson':
        'A DeafBlind writer takes apart how film and fiction imagine blindness and deafness.',
      'ill-scream-later':
        "Marlee Matlin, the first Deaf performer to win an Oscar, on a career spent refusing to be the industry's only Deaf actor.",
      'my-left-foot':
        'Daniel Day-Lewis won an Oscar for it, and it is the most cited example in this argument.',
      'a-different-man':
        'Adam Pearson, who has neurofibromatosis, plays without prosthetics while the nondisabled lead wears them, and the film knows it.',
      'the-war-on-wheels-podcast':
        'A podcast on authentic casting, cripping up, and disability tropes.',
      'a-quiet-place-part-ii':
        'Deaf actor Millicent Simmonds frames her work as a corrective to hearing actors playing Deaf roles.',
      'echo-marvel':
        'Alaqua Cox, who is Deaf and uses a prosthetic leg, plays the lead exactly as she is.',
      'the-peanut-butter-falcon':
        'The role was written for Zack Gottsagen, who has Down syndrome, and the filmmakers turned down money to recast it with a star.',
      'https://www.filmdis.com':
        'A disabled-led watchdog on how disabled people are shown in film, TV, and games.',
    },
  },

  // ───────────────────────────────────────────────────────────────────────────
  {
    slug: 'access-as-art',
    title: 'Should access be part of the art itself?',
    summary:
      'Some artists build captions, description, and signing into the work, while others want access that stays plain and predictable.',
    take: {
      lead:
        'Graeae weaves captions, sign language, and audio description into its shows, and Kinetic Light built a multi-track description app for its dance. The question is whether access should always be part of the art like that.',
      sides: [
        {
          label: 'One side says',
          text:
            'Access added at the end can flatten a work. A 2024 University of Sheffield study found that captions which leave out plot-critical sounds can keep Deaf viewers from feeling suspense, and designing access in from the start gives disabled audiences the piece as it was meant to land.',
        },
        {
          label: 'The other side says',
          text:
            'Many people want access they can count on. Captions should be easy to read and description easy to follow, and a bold creative choice can get in the way of someone who just wants to keep up with the show.',
        },
      ],
      note:
        'Our shelves lean toward the first side. For the plain and predictable side, start with the standards: the Audio Description Coalition standards and the DCMP tip sheet in the Library, and the DCMP Captioning Key in Resources.',
    },
    heat: 2,
    prompt:
      'Have you seen access built into the art itself, or did you prefer it plain? Tell us what it changed for you as an audience member or an artist.',
    accent: 'pink',
    updated: '2026-10-05',
    videos: [],
    library: [
      'graeae-aesthetics-of-access',
      'kinetic-light-audimance-lib',
      'caption-with-intention',
      'subtxt-creative-captioning',
      'alt-text-as-poetry',
      'bodies-in-commotion',
      'audio-description-coalition-standards',
      'dcmp-audio-description-tip-sheet',
    ],
    cinema: [
      'christine-sun-kim-close-readings',
      'the-tuba-thieves-2023',
      'kinetic-light-descent-research',
      'graeae-reasons-to-be-cheerful',
      'alice-sheppard-kinetic-light-talks',
    ],
    resources: [
      'https://rampsonthemoon.co.uk/',
      'https://www.boptheatre.co.uk/',
      'https://tbtb.org',
      'https://dcmp.org/learn/captioningkey',
    ],
    shelfNotes: {
      'graeae-aesthetics-of-access':
        'A UK disability-led company that treats captioning, sign language, and audio description as part of its theatrical language, not add-ons.',
      'kinetic-light-audimance-lib':
        'An app that lets audiences choose and blend several description tracks, from poetic to screenplay style.',
      'bodies-in-commotion': 'Essays on crip aesthetics and on access as artistic practice.',
      'audio-description-coalition-standards':
        'A free US standard for describers, written by working describers and trainers.',
      'dcmp-audio-description-tip-sheet':
        'A one-page free guide to the core principles of plain, objective description.',
      'graeae-reasons-to-be-cheerful':
        'A filmed Graeae musical where sign language, captioning, and audio description are woven into the show, not bolted on.',
      'the-tuba-thieves-2023':
        'Made with open captions and an audio description track as part of the work itself, not an add-on.',
      'kinetic-light-descent-research':
        "Wheelchair dancers on a ramp, with access built in through Audimance, the company's multi-track description app.",
      'alice-sheppard-kinetic-light-talks':
        'Talks on crip aesthetics and on access as part of the art itself.',
      'https://rampsonthemoon.co.uk/':
        'A UK consortium of mainstream theatres embedding Deaf and disabled people on and off stage in large touring productions.',
      'https://www.boptheatre.co.uk/':
        "Scotland's disabled-led touring theatre company, which embeds Creative Access in its work.",
      'https://tbtb.org': 'A New York company that builds visual description into its staging and direction.',
      'https://dcmp.org/learn/captioningkey':
        'A detailed quality standard for captions: accuracy, placement, speaker names, and sound effects.',
    },
  },

  // ───────────────────────────────────────────────────────────────────────────
  {
    slug: 'ai-captions',
    title: 'Are auto captions good enough?',
    summary:
      'Machine captions are cheap and common now, so when are they enough, and when does a person need to do the job?',
    take: {
      lead:
        'Many video and meeting tools can caption themselves now, often for free. The argument is about when that is enough and when a person has to do the job.',
      sides: [
        {
          label: 'One side says',
          text:
            'Auto captions beat no captions, and for a lot of small teams and live conversations no captions is the real alternative. Free tools get captions to more people faster, and a person can fix the mistakes afterward.',
        },
        {
          label: 'The other side says',
          text:
            'Machines miss names, jargon, who is talking, and the sounds that matter, and a caption that looks confident but is wrong can mislead. Rikki Poynter, the Deaf YouTuber behind the #NoMoreCraptions campaign, has made caption quality her cause and captions every video by hand.',
        },
      ],
      note:
        'Our shelves have tools for machine captions but little that argues about them, so most of the reading below is about caption quality in general.',
    },
    heat: 4,
    prompt:
      'When is an auto caption good enough for you, and when do you want a person doing it? Tell us what has worked and what has not.',
    accent: 'paper',
    updated: '2026-10-05',
    videos: [],
    library: ['whoamitostopit-caption-quality', 'reading-sounds-zdenek', 'against-technoableism-shew'],
    cinema: ['rikki-poynter-channel'],
    resources: [
      'https://www.nad.org/resources/technology/television-and-closed-captioning/',
      'https://github.com/openai/whisper',
      'https://www.android.com/accessibility/live-transcribe/',
      'https://blog.pope.tech/2024/05/24/a-complete-guide-for-adding-captions-to-youtube-videos/',
      'https://www.ncra.org',
      'https://ccacaptioning.org/',
    ],
    shelfNotes: {
      'whoamitostopit-caption-quality':
        'Cheryl Green, a captioner and audio describer, writes about caption quality as a craft standard: captions should be good, not just exist.',
      'reading-sounds-zdenek':
        'Argues that captioners do not just transcribe, they decide which sounds matter and find words for them.',
      'against-technoableism-shew':
        'On the belief that technology exists to fix disabled people rather than serve them, and why that matters for AI debates.',
      'https://www.nad.org/resources/technology/television-and-closed-captioning/':
        'The captioning hub of the National Association of the Deaf, including its position on automatic speech recognition.',
      'https://github.com/openai/whisper':
        'Free speech recognition that makes a first draft. The output always needs human editing.',
      'https://www.ncra.org': 'Where to find vetted human captioners for live events.',
    },
  },

  // ───────────────────────────────────────────────────────────────────────────
  {
    slug: 'open-captions',
    title: 'Captions on screen or on a device?',
    summary:
      'Should captions sit on the screen for everyone, or on a phone, glasses, or seat screen for the people who ask?',
    take: {
      lead:
        'At a movie or a show, captions can sit on the screen where everyone sees them, or show up on a personal device that only one person sees. The argument is over which should be the default.',
      sides: [
        {
          label: 'One side says',
          text:
            'Open captions, the kind on the screen, work for the whole room with no device to ask for, charge, or hand back. The Superfest film festival shows every film that way.',
        },
        {
          label: 'The other side says',
          text:
            'A personal device, like a phone app, lets the person who needs captions sit anywhere in the house and use them at any showing, without putting text over the picture for everyone else.',
        },
      ],
      note:
        'Our shelves do not cover caption glasses or seat screens yet, and they lean toward open captions, so the device side below is thinner and mostly phone apps.',
    },
    heat: 4,
    prompt:
      'At a movie or a show, would you rather have captions on the screen for everyone or on a personal device? Tell us why, and what has worked for you.',
    accent: 'red',
    updated: '2026-10-05',
    videos: [],
    library: ['nad-captioning-advocacy', 'university-sheffield-captioning-suspense'],
    cinema: [
      'see-what-im-saying',
      'the-tuba-thieves-2023',
      'superfest-disability-film-festival',
      'reunion-bbc',
    ],
    resources: ['https://www.tdf.org', 'https://galapro.com', 'https://www.stagetext.org'],
    shelfNotes: {
      'nad-captioning-advocacy':
        "The community's own position on captioning, including where the law applies to movies and live events.",
      'university-sheffield-captioning-suspense':
        'A 2024 study of captions in film and TV that recommends letting viewers personalize them.',
      'see-what-im-saying': 'The first open-captioned film to get a mainstream US theatrical release.',
      'the-tuba-thieves-2023':
        'Made with open captions and an audio description track as part of the work itself, not an add-on.',
      'https://www.tdf.org':
        'A New York nonprofit that pioneered open captions and GalaPro integration in New York theater.',
    },
  },

  // ───────────────────────────────────────────────────────────────────────────
  {
    slug: 'audio-description-craft',
    title: 'How should audio description describe people?',
    summary:
      'Should audio describers say what people look like, including race and disability, or leave it out?',
    take: {
      lead:
        'Audio description tells blind and low-vision audiences what is happening on screen or on stage. One of the biggest questions is whether and how to describe people, including their race, gender, and disability.',
      sides: [
        {
          label: 'One side says',
          text:
            'Description should say what a sighted audience would see, in plain objective language, and that includes race, gender, and disability. Leaving those out can hide something sighted viewers take in right away.',
        },
        {
          label: 'The other side says',
          text:
            'Description is never neutral, because every describer chooses what to say and guesses at who people are. It should name identity only when that helps, and give listeners some say in how much they get.',
        },
      ],
      note:
        'Our shelves cover the human craft of description well and have nothing on AI voices in description yet.',
    },
    heat: 3,
    prompt:
      'When a describer tells you about a person on screen, what do you want to know, and what would you rather they leave out? If you describe, tell us how you decide.',
    accent: 'coal',
    updated: '2026-10-05',
    videos: [],
    library: [
      'more-than-meets-the-eye',
      'dcmp-audio-description-tip-sheet',
      'audio-description-coalition-standards',
      'kinetic-light-audimance-lib',
      'think-outside-the-vox-lib',
    ],
    cinema: [
      'reid-my-mind-radio',
      'thomas-reid-audio-description-demo',
      'talk-description-to-me',
      'joybubbles-2026',
    ],
    resources: [
      'https://vocaleyes.co.uk/research/describing-diversity/',
      'https://whoamitostopit.com/media-accessibility/',
    ],
    shelfNotes: {
      'more-than-meets-the-eye':
        "Kleege argues description is a creative act that reflects the describer's assumptions, not a neutral transcript.",
      'kinetic-light-audimance-lib':
        'An app that lets audiences choose and blend several description tracks, from poetic to screenplay style.',
      'reid-my-mind-radio':
        "A blind describer's podcast, with free audio description training episodes.",
      'thomas-reid-audio-description-demo':
        'Free talks on objectivity, identity description, and the aesthetics of description.',
      'talk-description-to-me':
        'A blind co-host and an audio describer talk through current events so listeners can hear how describing works.',
      'joybubbles-2026':
        'The first film at Sundance shown with open audio description, written by Cheryl Green and narrated by Thomas Reid.',
      'https://vocaleyes.co.uk/research/describing-diversity/':
        'Twelve principles on when and how to describe race, gender, disability, age, and body in theater description.',
    },
  },

  // ───────────────────────────────────────────────────────────────────────────
  {
    slug: 'sign-language-as-art',
    title: 'Is sign language art or access?',
    summary:
      'Is signed performance its own art form, or mostly a way to make hearing art reachable?',
    take: {
      lead:
        'Signed performance reaches audiences two ways, as work Deaf artists make in sign language from the start and as hearing work brought into sign by interpreters. People weigh the two differently.',
      sides: [
        {
          label: 'One side says',
          text:
            'Sign language is a full language and a living art form, with its own poetry, rhythm, and humor. The strongest signed work is made by Deaf artists from the start, not translated after the fact.',
        },
        {
          label: 'The other side says',
          text:
            'Interpreting a song, a play, or a speech live takes real artistry, and it is how a Deaf audience gets into a hearing show at all. That work deserves to be treated as craft, not just a service.',
        },
      ],
      note:
        'Our shelves lean toward work made by Deaf artists and are thin on interpreted performance so far.',
    },
    heat: 2,
    prompt:
      'What is the best signed performance you have seen? Tell us if it was made by Deaf artists or interpreted from a hearing show, and what made it work.',
    accent: 'pink',
    updated: '2026-10-05',
    videos: [],
    library: ['deaf-republic-kaminsky', 'how-to-communicate-clark', 'black-disabled-art-history-101'],
    cinema: [
      'deaf-jam',
      'deaf-west-spring-awakening',
      'deaf-west-theatre-video-channel',
      'antoine-hunter-urban-jazz-dance',
      'sign-short-film',
      'the-disability-collective-podcast',
    ],
    resources: [
      'https://dpan.tv',
      'https://www.aslslam.org',
      'https://howlround.com/happenings/disability-deaf-performance-conversation',
      'https://lumotv.co.uk',
      'https://www.deafspotlight.org/',
    ],
    shelfNotes: {
      'how-to-communicate-clark':
        'Poems by a DeafBlind poet, including translations from ASL and work built out of tactile language.',
      'deaf-jam': 'One of the only films about ASL poetry as a living art form.',
      'deaf-west-spring-awakening':
        'Performed in ASL and English at once on Broadway, with deaf and hearing actors. Only excerpts are free to watch.',
      'deaf-west-theatre-video-channel':
        "Deaf West's own clips, showing how the company weaves ASL and voiced English into one theatrical language.",
      'sign-short-film': 'A love story told entirely in ASL, led by a Deaf ensemble.',
      'the-disability-collective-podcast':
        'Episodes on sign-singing, Deaf music performance, and Deaf interpretation, with working Deaf performers and interpreters.',
      'https://howlround.com/happenings/disability-deaf-performance-conversation':
        'Essays and recorded conversations on UK Deaf performance, theatrical interpreting, and BSL aesthetics.',
    },
  },

  // ───────────────────────────────────────────────────────────────────────────
  {
    slug: 'access-labor',
    title: 'Who pays for the work of access?',
    summary:
      'Access takes real work, and people argue about who should do it, who should get paid, and who ends up doing it for free.',
    take: {
      lead:
        'Captions, description, interpreters, access riders, and the care people give each other all take work. People disagree about how to think of that work: as a paid, budgeted skill, or as something a community shares. Plenty of people hold some of both.',
      sides: [
        {
          label: 'One side says',
          text:
            'Access is skilled labor, so it belongs in the budget with fair pay, and disabled people should not be left quietly doing it for free. Access keeps running into money, so money has to be part of the answer.',
        },
        {
          label: 'The other side says',
          text:
            'Access works best when it grows out of care and shared responsibility, not box ticking, and pricing every piece of it can turn something personal into a transaction.',
        },
      ],
      note:
        "Our shelves have no pay rates or contract examples yet, so what is below is about the ideas, not the numbers. Mia Mingus's essay on access intimacy and the Access Is Love campaign are here for how they think about access as care. They are not answers about pay.",
    },
    heat: 3,
    prompt:
      'Has getting access ever turned into unpaid work for you? Or has someone giving it freely meant a lot? Tell us what fair would look like.',
    accent: 'paper',
    updated: '2026-10-05',
    videos: [],
    library: [
      'access-intimacy-the-missing-link',
      'care-work-dreaming-disability-justice',
      'disability-intimacy',
      'capitalism-and-disability-russell',
      'university-sheffield-captioning-suspense',
      'think-outside-the-vox-lib',
    ],
    cinema: ['contra-podcast', 'alice-wong-disability-visibility-talks'],
    resources: [
      'https://www.accessdocsforartists.com',
      'https://www.disabilityintersectionalitysummit.com/access-is-love/',
      'https://disabledlist.org',
      'https://nationaldisabilitytheatre.org',
    ],
    shelfNotes: {
      'disability-intimacy':
        'Forty essays by disabled writers on intimacy, including care webs and access intimacy.',
      'university-sheffield-captioning-suspense':
        'A 2024 study that recommends treating caption design as a paid profession.',
      'think-outside-the-vox-lib':
        'A disability-led approach to who describes, who gets trained, and how new describers move into the field.',
      'contra-podcast':
        'A podcast with episodes on access labor, captioning, and description, with transcripts.',
      'alice-wong-disability-visibility-talks':
        'Talks on disability media representation and the labor of disabled activists.',
      'https://www.accessdocsforartists.com':
        'A guide to writing an access doc, a rider that spells out the access an artist needs.',
      'https://www.disabilityintersectionalitysummit.com/access-is-love/':
        'A campaign by Mia Mingus, Alice Wong, and Sandy Ho reframing access as collective love and shared responsibility, not compliance or burden.',
      'https://nationaldisabilitytheatre.org':
        'A theater company focused on hiring disabled directors, designers, playwrights, and performers.',
    },
  },
];

/** Every topic, with its status filled in from lib/hot-topics-status.ts. Anything not listed there is a draft. */
export const HOT_TOPICS: HotTopic[] = TOPIC_CONTENT.map((t) => ({
  ...t,
  status: LIVE_TOPIC_SLUGS.includes(t.slug) ? 'live' : 'draft',
}));

// A typo in LIVE_TOPIC_SLUGS would otherwise fail silently, so say so while developing.
if (process.env.NODE_ENV !== 'production') {
  for (const slug of LIVE_TOPIC_SLUGS) {
    if (!TOPIC_CONTENT.some((t) => t.slug === slug)) {
      console.warn(`lib/hot-topics-status.ts lists "${slug}" as live, but no topic has that slug.`);
    }
  }
}

export const HOT_TOPIC_BY_SLUG: Record<string, HotTopic> = Object.assign(
  // No prototype, so a url like /resources/hot-topics/constructor cannot match an inherited property.
  Object.create(null) as Record<string, HotTopic>,
  Object.fromEntries(HOT_TOPICS.map((t) => [t.slug, t])),
);

/** Topics a visitor may see: live ones, plus drafts when drafts are switched on. */
export function visibleTopics(): HotTopic[] {
  return HOT_TOPICS.filter((t) => t.status === 'live' || HOT_TOPICS_SHOW_DRAFTS);
}

/** True when this slug is a topic a visitor may open. Anything else should 404. */
export function isTopicOpen(slug: string): boolean {
  return visibleTopics().some((t) => t.slug === slug);
}

export function heatWord(heat: HotTopic['heat']): 'Mild' | 'Warm' | 'Hot' | 'Spicy' | 'Scorching' {
  switch (heat) {
    case 1:
      return 'Mild';
    case 2:
      return 'Warm';
    case 3:
      return 'Hot';
    case 4:
      return 'Spicy';
    default:
      return 'Scorching';
  }
}

// Takes (what do you think) limits, shared by the form and the API route.
export const TAKE_MAX_LENGTH = 600;
export const TAKE_NAME_MAX = 60;
/** The anonymous per-browser tag the form sends so the server can rate limit. */
export const DEVICE_TAG_PATTERN = /^[A-Za-z0-9_-]{16,64}$/;
