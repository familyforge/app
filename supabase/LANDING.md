
You are working inside an existing Expo React Native project (built with Expo Router) that already runs on Android, iOS, and Web.

IMPORTANT CONTEXT
- The mobile apps (iOS and Android) must remain unchanged.
- ONLY the WEB version of the app should show a new marketing landing page.
- When the app is opened on mobile devices, it should behave exactly as it does now.
- When accessed via web, users should see this landing page first, not the app UI.
- Clicking “Get Started” on the landing page must route directly into the existing app signup flow at the parenting role selection screen (Father or Mother).

SCOPE OF WORK
Update the Expo Web entry experience to introduce a high-conversion, emotionally driven landing page while preserving the existing app architecture.

LANDING PAGE PURPOSE
This landing page is designed to emotionally connect with overwhelmed parents and move them confidently into app signup.

It must:
- Speak directly to the pain, guilt, exhaustion, and mental load parents experience.
- Validate both mothers and fathers using empathetic, human language.
- Avoid feature dumping or sales language.
- Make users feel understood before asking them to act.

BRAND & DESIGN SYSTEM (MANDATORY)
The entire landing page must strictly follow this brand direction:

- Dark, sophisticated base theme with background color: #0f0a1f
- Premium purple and indigo gradient borders throughout
- Glass-morphism effect with glow for ALL headings and subheadings
- Elegant gradient CTA buttons with shadows and soft glow
- Beautiful numbered step cards using green, purple, and gold accents
- Elegant quote block with left accent border
- Premium footer with pill-style links
- Polished, premium, emotionally calm aesthetic
- Mobile-first responsive design
- responsive to all device screens

STRUCTURE & CONTENT REQUIREMENTS

1. HERO SECTION
- Headline acknowledging parenting pressure and emotional fatigue
- Subheadline validating that parenting is harder than most people admit
- One primary CTA: “Get Started”
- CTA must be visible immediately, no scrolling required

2. PAIN-FOCUSED EMPATHY SECTIONS
- Explicit emotional copy addressing:
  - Mothers’ mental load, guilt, exhaustion, and invisible labor
  - Fathers’ pressure, responsibility, fear of failure, and emotional distance
- No technical explanation yet

3. RESULTS-FOCUSED FEATURE FRAMING
Introduce the product ONLY through outcomes and problems solved, not technical details.

Each item must be framed as:
Problem → Result → Emotional Relief

Include the following, in clear sections or cards:

- Onboarding & Quick Start
  Fast signup and guided onboarding → parents see value in minutes instead of feeling lost

- Personal Profile & Preferences
  Editable profile, avatar, language, country, parenting role, app tone → a personalized experience that feels built for them

- Multi-Child Profiles & Dashboards
  Individual child dashboards → parents manage each child without mental overload

- Shared Family Access & Invites
  Invite co-parents or guardians with role-based access → shared parenting without chaos or duplicated effort

- Tasks & Routines
  Assign tasks, routines, deadlines → consistency without constant nagging

- Smart Reminders & Overdue Handling
  In-app notifications and reminder emails → fewer missed tasks and less tension

- Points & Rewards System
  Progress tracking and redeemable rewards → motivation replaces arguments

- Learning Assignments & Exercises
  Learning tied to daily responsibility → growth beyond chores

- Progress Visualization & Goals
  Streaks and goal tracking → visible progress that builds confidence

- Weekly Reports
  In-app summaries and downloadable reports → clarity for busy parents

- Leaderboards & Friendly Competition
  Family and global rankings → healthy motivation without pressure

- Calendar & Deadlines
  Centralized family calendar → fewer forgotten events and deadlines

- Email Preferences & Opt-outs
  Full control over communications → no spam, no irritation

- GDPR-Ready Data Export
  Secure data downloads → transparency and trust

4. VALIDATION & TRUST SECTION
- Reinforce that struggling does not mean failing
- Emphasize support, structure, and calm
- Include an elegant quote block reinforcing this message

5. FINAL CTA SECTION
- Emotional reinforcement before action
- “Get Started” button routes directly to existing signup flow at parenting role selection

INTELLIGENT DEVICE DETECTION (WEB ONLY)

On the WEB version only:
- Detect if the user is on a mobile device
- Detect whether the device is iOS or Android

If a mobile device is detected:
- Replace the landing page header with a sticky, fixed download prompt
- Prompt must:
  - Appear at the top of the screen
  - Visually glow subtly (not aggressive)
  - Include the app icon and app name:
    FamilyForge: Rewards and Growth for Kids
  - Contain gentle, persuasive, non-salesy copy
  - Display the correct store button:
    - Apple App Store for iOS
    - Google Play Store for Android
  - All store links must be placeholders set to "#"

AUDIO FEEDBACK
- When the sticky download prompt appears:
  - Play a short, pleasant “ding” sound (iOS-style message notification)
  - The sound should autoplay immediately
  - Use a free, lightweight audio file bundled locally

FOOTER REQUIREMENTS
- Footer must include:
  - Apple App Store download button (placeholder link "#")
  - Google Play Store download button (placeholder link "#")
  - Privacy Policy link
  - Terms of Service link
- App store buttons must appear just above the legal links

LEGAL PAGES
- Create a Privacy Policy page
- Create a Terms of Service page
- Both must be accessible from the footer
- Use compliant, professional, parent-friendly language

TECHNICAL IMPLEMENTATION NOTES
- Web-only routing logic using Expo Router
- Ensure mobile platforms bypass the landing page entirely
- Keep code clean, modular, and production-ready
- Do not alter existing mobile app screens or flows
- All “Get Started” actions must route into the existing app onboarding flow

DELIVERABLE
Provide production-ready implementation using Expo Web compatible React components, styles, and logic that fully integrate with the existing project.
