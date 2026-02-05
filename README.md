# Pro Parenting App

A calm, offline-first parenting productivity app designed for modern families to manage children's tasks, learning, rewards, progress, and family coordination. Built with React Native (Expo) for mobile and a web-based admin dashboard with Supabase integration.

---

## 🎯 App Vision

**"Finally, an app that understands the chaos of parenting."**

Pro Parenting helps busy parents:
- Track and motivate children with points and rewards
- Manage daily routines without stress
- Coordinate family schedules and deadlines
- Share caregiving responsibilities with partners, co-parents, and guardians
- Stay organized even when offline

---

## ✨ Current Features

### 📱 Mobile App (5-Tab Navigation)

#### 1. Home Dashboard
- Overview of all children with points summary
- Quick stats: tasks completed today, total points earned
- Quick access to children profiles
- Today's pending tasks at a glance
- Profile avatar in header (tap to view profile)
- **Quick Actions (6 slots in 3x2 grid)**:
  - Add Task → Tasks screen
  - Rewards → Rewards screen
  - Family Calendar → Calendar screen
  - Progress → Progress screen
  - Deadlines → Deadlines screen
  - My Routines → Routines screen

#### 2. Children Profiles
- Add/edit children with photos
- Track: name, age, class, birthday, interests, learning style, special needs
- **Native date picker for date of birth** (auto-calculates age)
- Archive/restore children
- **Delete flow for archived children**:
  - Confirmation modal with name + DOB verification
  - 24-hour countdown before permanent deletion
  - Restore option during countdown
- Points and rewards per child

#### 3. Tasks & Exercises
- Assign chores, learning exercises, personal care tasks
- Point values (positive and negative)
- Categories: chore, personal_care, exercise, learning, social, creative, other
- Mark completion with point awards
- Due dates and status tracking

#### 4. Rewards
- Set point goals for rewards
- Track earned vs required points
- Redeem rewards when points threshold met
- Visual progress indicators

#### 5. Progress & Reports
- Daily/weekly/monthly performance charts
- Child-by-child progress summaries
- Generate printable PDF reports
- Visual streaks and achievements

### 👤 Profile & Settings

#### Profile Overview (Menu-Based Navigation)
- Beautiful profile card with avatar, name, email
- Children count with encouraging message
- Overall completion percentage
- **6 Navigation Menu Items**:
  - Edit Profile → Edit profile details
  - My Routines → Manage daily routines
  - My Goals & Progress → Track parenting goals
  - Give Access → Family permissions management
  - Settings → App settings
  - Support & About → Help and info
- **Quick Actions**: Family Calendar, Deadlines

#### Edit Profile (Separate Page)
- Name, email, gender
- Country (195+ countries with search)
- Language (50 languages with search)
- Parenting role (Single parent, Co-parent, Guardian, Other)
- App tone preference (Gentle, Structured, Motivational)
- Personal parenting goal (#1 goal dropdown)
- Avatar photo upload

#### My Routines Screen ✅
- Morning, after-school, bedtime routine types
- Custom routine steps with list editor
- **Native time picker** for routine times
- Completion tracking with streak counts
- Add/edit/delete routines

#### My Goals & Progress Screen ✅
- Personal parenting goals with progress bars
- Quick adjust buttons (+10% / -10%)
- Overall progress calculation
- Color-coded progress indicators
- Add/edit/delete goals

#### Give Access System ✅
- **Access types**: Partner, Co-parent, Guardian, Child
- Invitation system with unique codes
- Permission levels per access type:
  - Partner: Full access (all permissions)
  - Co-parent: Limited edit (assigned children only)
  - Guardian: Approve only (no editing)
  - Child: View only (calendar, deadlines, family)
- Family member management
- Revoke access capability
- Copy invitation codes to clipboard

#### Family Calendar ✅
- Monthly grid view with navigation
- **Native date picker** for event dates
- **Native time pickers** for start/end times
- Event categories: School, Activity, Appointment, Family, Birthday, Holiday, Other
- Category colors and emoji indicators
- All-day event toggle
- Recurrence options: None, Daily, Weekly, Monthly, Yearly
- Family vs. child-specific events
- Event creation/editing modal

#### Deadlines Screen ✅
- Time-sensitive task tracking
- **Native date picker** for due dates
- **Native time picker** for optional due times
- Categories: School, Medical, Financial, Activity, Travel, Other
- Priority levels: Low, Medium, High, Urgent
- Urgency color coding (overdue = red)
- Overdue / Upcoming / Completed sections
- Stats overview (overdue, upcoming, done counts)
- Child assignment support

#### Settings Screen ✅
- **Notifications**: Task reminders, achievement alerts, weekly reports
- **Privacy & Safety**: Show points to children, hide personal in reports, analytics
- **Sync**: Enable sync, auto-sync toggle, connection status
- **Data Management**: Export data, delete account with confirmation
- Account deletion modal with safety warnings

#### Support & About Screen ✅
- FAQ section with expandable answers
- Parenting tips with actionable advice
- Contact support information
- App version display
- External links for help resources

### 🔐 Authentication
- Email/password signup and login
- Forgot password flow
- Session management
- Offline-capable authentication state

### 🎨 Onboarding (20 Steps)
- Pain-point focused flow
- Builds empathy before asking for info
- Collects: challenges, stress areas, tracking methods
- Parent info: name, email, gender
- Children setup: count, names, ages, classes, photos
- Subscription selection (Free/Monthly/Yearly)
- Personalized loading experience
- Welcome email trigger

---

## 🎯 Global UX Rules

### Date & Time Input (Mandatory)
❗ **No date or time can ever be typed manually**

All dates and times use:
- Native date pickers (platform-appropriate)
- Native time pickers (platform-appropriate)
- Calendar selectors where applicable

This applies to:
- Child date of birth
- Calendar events (date, start time, end time)
- Deadlines (due date, due time)
- Routine times
- Any scheduling or time-based data

### Child Account Deletion Flow
1. **Archive first** - Children must be archived before deletion
2. **Delete button appears** - Only on archived children
3. **Confirmation required**:
   - Enter child's exact full name
   - Select child's date of birth (native picker)
   - Validation against stored records
4. **24-hour countdown**:
   - Child visible in disabled state
   - Countdown timer displayed (HH:MM:SS)
   - Restore option available
5. **Permanent deletion** - After countdown expires, unrecoverable

### Child Account Capabilities ✅
Children with app access can **VIEW ONLY** (not modify):
- Their parents and all caregivers
- Their siblings
- Family Calendar
- Family Deadlines
- Their own:
  - Growth progress
  - Points balance
  - Rewards earned
  - Assigned tasks
  - Routines
  - Learning assignments
  - Activity history (last 180 days only)

**Children CANNOT:**
- Edit events or deadlines
- Edit any profiles
- Change permissions
- View items older than 180 days

### History & Visibility Limits ✅
**180-Day Rule** - No user (adult or child) can view:
- Events older than 180 days
- Deadlines older than 180 days
- Tasks older than 180 days
- Learning activities older than 180 days

Older items are hidden from UI but may remain in database for analytics.

### Media Auto-Deletion Policy ✅
Media uploaded to events, tasks, deadlines, or learning activities:
- **Retained**: Until 30 days after the associated item's date passes
- **After 30 days**: Automatically deleted from cloud storage and database
- **Offline cache**: Remains locally but won't sync to cloud
- **Hard requirement**: No expired media in cloud storage

### Log Out Button ✅
Every profile type must have a Log Out button:
- Parent (primary account holder)
- Partner
- Co-parent
- Guardian
- Child

Log out clears local session safely but does not delete data.

---

## 📚 Learning Assignments System ✅

### Overview
Parents and caregivers can assign daily learning tasks based on:
- Child's age
- Academic year (class level)

### Academic Year Levels
Each child profile includes an Academic Year selector:
- Reception
- Year 1 through Year 13

This drives age-appropriate learning content.

### Default Learning Tasks (Always Available)
Two default tasks are **ON by default** for all children:

| Task | Points | Negative Points | Frequency |
|------|--------|-----------------|-----------|
| Learn 3 new words daily | 10 | Yes (if not completed) | Daily |
| 10 maths questions daily | 10 (1 per correct) | Yes (if not completed) | Daily |

### Additional Learning Categories (20 Optional)
These are **OFF by default** but can be enabled by parents:

1. Read a short story passage
2. Write about your day
3. English comprehension questions
4. History questions
5. Geography questions
6. Physics questions
7. Chemistry questions
8. Biology questions
9. Primary Science questions
10. Civic Education questions
11. Government questions
12. Finance basics questions
13. Current affairs questions
14. General knowledge questions
15. Economics questions
16. Computer questions
17. Literature in English questions
18. Music questions
19. French questions
20. Agriculture questions

**Total: 22 learning task categories** (2 default + 20 optional)

### Learning Task Settings (Parent Control)
- Turn tasks ON/OFF per category
- Apply to: All children OR selected children
- Customize time of day (native picker)
- Customize days of week
- Default: 10 points per task
- Only default tasks have negative points

### Learning Task Execution

**Question-Based Tasks (e.g., Maths, Comprehension)**
- Exam-style multiple choice UI
- Instant scoring on submission
- Immediate feedback with explanations
- Correct answers shown
- Points awarded automatically (no parent approval)
- 1 point per correct answer for 10-question tasks

**Non-Question Tasks (e.g., Reading, Writing)**
- Child marks task as done
- **Parent approval required** for completion
- Points awarded only after parent approves

---

## 🛠️ Tech Stack

### Mobile App
- **Framework**: React Native (Expo SDK 54)
- **State Management**: Zustand with AsyncStorage persistence
- **Styling**: NativeWind (Tailwind CSS)
- **Animations**: react-native-reanimated v3
- **Gestures**: react-native-gesture-handler
- **Icons**: lucide-react-native
- **Data Fetching**: React Query (@tanstack/react-query)
- **Navigation**: Expo Router (file-based)
- **Date/Time Pickers**: @react-native-community/datetimepicker
- **Clipboard**: expo-clipboard

### Admin Dashboard
- **Framework**: React + Vite
- **State Management**: Zustand
- **Styling**: Tailwind CSS
- **Backend**: Supabase (optional)

**Active Admin UI (Web Only)**
- The admin dashboard runs as a Vite web app in the admin/ folder.
- Start it with: `npm run admin:dev`
- Open: http://localhost:3001
- The mobile app no longer includes admin routes.

**Admin Login (Web)**
- Set these environment variables to enable the login screen:
  - `VITE_ADMIN_EMAILS` (comma-separated)
  - `VITE_SUPER_ADMIN_EMAILS` (comma-separated; super admins only)
  - `VITE_ADMIN_PASSWORD_HASH` (SHA-256 hash of your password)
- Optional financials:
  - `VITE_PREMIUM_PRICE` (monthly price used for Estimated MRR)
- The login gate is client-side for now; move to a server-backed auth flow for production.

### Database (Supabase)
- Parent profiles and authentication
- Children data
- Tasks and exercises
- Rewards and points
- Routines and goals
- Family members and permissions
- Calendar events
- Deadlines
- **Learning tasks and questions**
- **Learning progress tracking**
- Analytics and reports

---

## 📁 Project Structure

```
src/
├── app/
│   ├── _layout.tsx              # Root layout with providers
│   ├── index.tsx                # Entry point / auth check
│   ├── login.tsx                # Login screen
│   ├── signup.tsx               # Signup screen
│   ├── forgot-password.tsx      # Password recovery
│   ├── onboarding.tsx           # 20-step onboarding flow
│   ├── edit-profile.tsx         # Edit profile page
│   ├── my-routines.tsx          # Routines management ✅
│   ├── goals-progress.tsx       # Goals & progress ✅
│   ├── give-access.tsx          # Family permissions ✅
│   ├── family-calendar.tsx      # Family calendar ✅
│   ├── deadlines.tsx            # Deadlines tracking ✅
│   ├── settings-full.tsx        # Full settings page ✅
│   ├── support.tsx              # Support & about ✅
│   ├── settings.tsx             # Settings modal
│   ├── admin.tsx                # Admin dashboard entry
│   ├── child-dashboard.tsx      # Child-friendly dashboard ✅
│   ├── learning-assignments.tsx # Parent learning task manager ✅
│   ├── child-learning.tsx       # Child learning experience ✅
│   └── (tabs)/
│       ├── _layout.tsx          # Tab navigation
│       ├── index.tsx            # Redirects to home
│       ├── home.tsx             # Home dashboard (6 Quick Actions)
│       ├── children.tsx         # Children profiles (delete flow)
│       ├── tasks.tsx            # Tasks & exercises (recurring)
│       ├── rewards.tsx          # Rewards system
│       ├── progress.tsx         # Progress & reports
│       └── profile.tsx          # Profile menu (6 nav buttons)
├── components/
│   ├── TaskCard.tsx
│   ├── ChildCard.tsx
│   ├── RewardCard.tsx
│   ├── PointsProgress.tsx
│   └── ChartCard.tsx
├── lib/
│   ├── cn.ts                    # className utility
│   ├── types.ts                 # TypeScript types
│   ├── state/
│   │   ├── app-store.ts         # Main app store (180-day filtering)
│   │   ├── profile-store.ts     # Profile, routines, goals store
│   │   ├── onboarding-store.ts  # Onboarding flow store
│   │   ├── family-store.ts      # Family members & permissions ✅
│   │   ├── calendar-store.ts    # Calendar events ✅
│   │   ├── deadlines-store.ts   # Deadlines tracking ✅
│   │   └── learning-store.ts    # Learning tasks & progress ✅
│   ├── api/
│   │   ├── supabase.ts          # Supabase client
│   │   ├── auth.ts              # Authentication
│   │   ├── auth-context.tsx     # Auth provider
│   │   ├── children.ts          # Children API
│   │   ├── tasks.ts             # Tasks API
│   │   ├── rewards.ts           # Rewards API
│   │   ├── profile.ts           # Profile sync
│   │   └── mappers.ts           # Data mappers
│   └── utils/
│       ├── pdf-generator.ts     # PDF exports
│       ├── points.ts            # Points calculations
│       └── history-filter.ts    # 180-day visibility filter ✅
admin/
├── src/
│   ├── App.tsx                  # Admin dashboard
│   └── lib/
│       ├── supabase.ts          # Admin Supabase client
│       └── api/                 # Admin API functions
│           └── learning-content.ts # CSV upload/management ✅
supabase/
├── migrations/                  # Database migrations
└── config.json                  # Supabase config
```

---

## 🎨 Design System

### Colors

**Dark Mode (Default)**
- Background: `#0f172a` (slate-950)
- Cards: `#1e293b` (slate-800/900)
- Primary: `#10b981` (emerald-500)
- Accent: `#f59e0b` (amber-500)
- Text: `#f8fafc` (slate-50)
- Muted: `#94a3b8` (slate-400)

**Light Mode**
- Background: `#f8fafc`
- Cards: `#ffffff`
- Same accent colors

### Typography
- Font: Plus Jakarta Sans
- Clean, readable hierarchy
- Minimal visual clutter

### UX Principles
- Calm, low-stimulation design
- Subtle animations with Reanimated
- Haptic feedback on interactions
- One child at a time focus
- Reward progress, not perfection
- **No manual date/time typing**

---

## 📊 Data Models

### Parent Profile
```typescript
interface ParentProfile {
  name: string;
  email: string;
  avatarUrl: string;
  gender: "male" | "female" | "other" | null;
  country: string;
  language: string;
  role: "single_parent" | "co_parent" | "guardian" | "other" | null;
  tone: "gentle" | "structured" | "motivational" | null;
  parentalGoal: ParentalGoal | null;
}
```

### Child
```typescript
interface Child {
  id: string;
  parentId?: string;
  name: string;
  nickname?: string;
  avatar?: string;
  picture: string | null;
  age: number;
  birthday?: string | null;  // YYYY-MM-DD format
  class: string;
  academicYear: AcademicYear;  // Reception, Year 1-13 ✅
  interests?: string[];
  learningStyle?: string;
  specialNeeds?: string;
  archived?: boolean;
  points: number;
  rewards: string[];
  createdAt: string;
  updatedAt: string;
}

type AcademicYear = 
  | "reception" | "year_1" | "year_2" | "year_3" | "year_4" 
  | "year_5" | "year_6" | "year_7" | "year_8" | "year_9" 
  | "year_10" | "year_11" | "year_12" | "year_13";
```

### Task (Updated with Recurring) ✅
```typescript
interface Task {
  id: string;
  childId?: string;           // Optional - can be assigned to parent
  assignedTo: "child" | "parent";
  title: string;
  description?: string;
  type: "chore" | "exercise" | "personal_care";
  category: TaskCategory;     // Dropdown selector
  points: number;
  negativePoints: number;
  status: "pending" | "completed" | "skipped";
  dueDate?: string;
  isRecurring: boolean;       // Recurring toggle ✅
  recurrenceFrequency?: "daily" | "weekly" | "monthly";
  recurrenceTime?: string;    // HH:mm
  createdAt: string;
  updatedAt: string;
}
```

### Reward
```typescript
interface Reward {
  id: string;
  childId: string;
  title: string;
  description: string;
  pointsRequired: number;
  iconName: string;
  timesRedeemed: number;
  createdAt: string;
}
```

### Family Member ✅
```typescript
interface FamilyMember {
  id: string;
  name: string;
  email: string;
  accessType: "partner" | "co_parent" | "guardian" | "child";
  permissions: MemberPermissions;
  assignedChildIds?: string[];
  invitedAt: string;
  acceptedAt?: string;
  status: "pending" | "active" | "revoked";
}
```

### Calendar Event ✅
```typescript
interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  category: EventCategory;
  color: string;
  date: string;           // YYYY-MM-DD
  startTime?: string;     // HH:mm
  endTime?: string;       // HH:mm
  allDay: boolean;
  recurrence: RecurrenceType;
  isFamily: boolean;
  childIds?: string[];
  createdAt: string;
}
```

### Deadline ✅
```typescript
interface Deadline {
  id: string;
  title: string;
  description?: string;
  category: DeadlineCategory;
  priority: DeadlinePriority;
  dueDate: string;        // YYYY-MM-DD
  dueTime?: string;       // HH:mm
  childIds?: string[];
  isCompleted: boolean;
  completedAt?: string;
  isRecurring: boolean;   // Recurring toggle ✅
  recurrenceFrequency?: "daily" | "weekly" | "monthly";
  recurrenceTime?: string;
  createdAt: string;
}
```

### Learning Task ✅
```typescript
interface LearningTask {
  id: string;
  categoryId: LearningCategory;
  title: string;
  description: string;
  isDefault: boolean;           // True for the 2 default tasks
  isEnabled: boolean;           // ON/OFF toggle
  points: number;               // Default: 10
  hasNegativePoints: boolean;   // Only defaults have this
  frequency: "daily" | "weekly";
  daysOfWeek: number[];         // 0-6 for Sun-Sat
  timeOfDay?: string;           // HH:mm
  appliesTo: "all" | "selected";
  selectedChildIds?: string[];
  isQuestionBased: boolean;     // True = exam style, False = parent approval
  questionsPerSession: number;  // Default: 10 for question-based
}

type LearningCategory =
  | "words" | "maths" | "reading" | "writing" | "english_comprehension"
  | "history" | "geography" | "physics" | "chemistry" | "biology"
  | "primary_science" | "civic_education" | "government" | "finance"
  | "current_affairs" | "general_knowledge" | "economics" | "computer"
  | "literature" | "music" | "french" | "agriculture";
```

### Learning Question (Admin-Uploaded) ✅
```typescript
interface LearningQuestion {
  id: string;
  categoryId: LearningCategory;
  academicYear: AcademicYear;
  question: string;
  choices: string[];          // 4 choices
  correctChoiceIndex: number; // 0-3
  explanation: string;
  createdAt: string;
  usedByChildIds: string[];   // Track which children have seen this
}
```

### Word Learning Entry (Admin-Uploaded) ✅
```typescript
interface WordEntry {
  id: string;
  academicYear: AcademicYear;
  word: string;
  meaning: string;            // noun, verb, adjective, etc.
  opposites: string[];
  synonyms: string[];
  context: string;
  examples: string[];         // Up to 5 example sentences
  createdAt: string;
  usedByChildIds: string[];
}
```

### Child Learning Progress ✅
```typescript
interface ChildLearningProgress {
  childId: string;
  categoryId: LearningCategory;
  completedToday: boolean;
  questionsAnswered: number;
  correctAnswers: number;
  pointsEarned: number;
  lastCompletedAt: string;
  streak: number;
}
```

---

## ✅ Phase 2 Implementation Status

### 1. Profile Menu Restructure ✅
- [x] Convert profile page to menu with navigation buttons
- [x] Edit Profile → Dedicated screen (EXISTS)
- [x] My Routines → New dedicated screen
- [x] My Goals & Progress → New dedicated screen
- [x] Give Access → New family permissions screen
- [x] Settings → New dedicated settings screen
- [x] Support & About → New help screen

### 2. My Routines Screen ✅
- [x] View all routines (morning, school, bedtime)
- [x] Native time picker for routine times
- [x] Edit routine structure (steps, times)
- [x] Add/delete routines
- [x] Completion tracking

### 3. My Goals & Progress Screen ✅
- [x] View all parenting goals
- [x] Track progress with visual bars
- [x] Quick adjust buttons
- [x] Calm, encouraging visual indicators

### 4. Give Access System ✅
- [x] Create family-store.ts for family members & permissions
- [x] Access types: Partner, Co-parent, Guardian, Child
- [x] Invite flow: select type → generate code → share
- [x] Permission rules per access type
- [x] Children can only view (calendar, deadlines, family)
- [x] Member management with revoke capability

### 5. Family Calendar ✅
- [x] Create calendar-store.ts
- [x] Add to Home Quick Actions
- [x] Monthly grid view with navigation
- [x] Native date/time pickers
- [x] Event categories with colors/emojis
- [x] Recurrence options
- [x] Family vs child-specific events

### 6. Deadlines ✅
- [x] Create deadlines-store.ts
- [x] Native date/time pickers
- [x] Categories and priority levels
- [x] Appears in Home Quick Actions
- [x] Urgency color coding
- [x] Completion tracking

### 7. Settings Screen ✅
- [x] Notification settings
- [x] Privacy & Safety options
- [x] Sync control
- [x] Account deletion flow

### 8. Support & About Screen ✅
- [x] FAQ section
- [x] Parenting tips
- [x] Contact support
- [x] App version info

### 9. UX Improvements ✅
- [x] Native date pickers everywhere (no typing)
- [x] Native time pickers everywhere (no typing)
- [x] Child deletion with confirmation flow
- [x] 24-hour countdown before permanent deletion
- [x] 6 Quick Actions on Home (3x2 grid)

### 10. Pending Items
- [ ] Cloud sync implementation
- [ ] Push notifications

---

## ✅ Phase 3 Implementation Status

### 1. Child Account Capabilities ✅
- [x] Child dashboard (child-dashboard.tsx)
- [x] View-only access to: Tasks, Rewards, Calendar, Deadlines, Family
- [x] Visual progress & points display
- [x] Learning assignments access
- [x] Logout button for child profiles

### 2. Learning Assignments System ✅
- [x] Create learning-store.ts
- [x] 22 learning categories
- [x] 2 default tasks: "Word of the Day" and "Maths"
- [x] Default tasks have negative points if skipped
- [x] Parent management screen (learning-assignments.tsx)
- [x] Child learning screen (child-learning.tsx)

### 3. Learning Task Types ✅
- [x] Question-based tasks (exam style, auto-scored)
- [x] Non-question tasks (parent approval flow)
- [x] 10 questions per session by default
- [x] Random question selection per academic year
- [x] Track questions already shown to child

### 4. Task Screen Updates ⏳
- [ ] Category dropdown selector
- [ ] Assign-to dropdown (family or individual child)
- [ ] Recurring toggle with frequency options
- [ ] Native date picker for one-time tasks

### 5. Admin Dashboard - Learning Content ⏳
- [ ] CSV upload for each category
- [ ] Academic year selection for questions
- [ ] Word entries with full structure
- [ ] Question entries with 4 choices
- [ ] Preview & validation before import

### 6. Data Management ✅
- [x] 180-day history visibility limit
- [x] 30-day media auto-deletion policy
- [x] history-filter.ts utility

---

## MAJOR APP UPDATE – EMOTIONAL ONBOARDING & MONETIZATION FLOW

Apply this update to the onboarding and authentication process without breaking existing features.

---

### 1. SIGN IN & SIGN UP ENTRY POINT

**Sign In**
- Requires:
  - Email address
  - 6-digit PIN
- No password login 
- f

**If user is not registered**
- Clicking **Sign Up** starts the full onboarding flow
- User must complete onboarding before account creation
- If the user is coming to the app for the first time the onboarding flow opens after the splash screen but that part 

---

### 2. ONBOARDING GOAL & PRINCIPLES
WE ALREADY HAVE AN ONBOARDING FLOW, YOU ARE ONLY GOING TO UPDATE IT.
The onboarding experience must:
- Make the user feel:
  - Finally heard
  - Understood
  - Emotionally invested
- Use language that resonates deeply with parents
- Gradually build commitment before payment
- Make paying feel like a natural next step, not a decision

Tone must adapt based on whether the user is a **Father** or **Mother**.

---

### 3. FIRST STEP – PARENT IDENTITY SELECTION

**Screen: Who Are You?**
- Options:
  - I am a Father
  - I am a Mother
  - (there will be a small button that says) already registered somewhere at the top or bottom but clicking either I am a father or I am a Mother will instantly take the user to the next screen. 

**Behavior**
- Selection of the above determines:
  - Tone
  - Language
  - Emotional framing
  - Pain points used in later onboarding screens

**Tone differences**
- Mothers:
  - Emotional load
  - Guilt
  - Mental overwhelm
  - Fear of missing important moments
- Fathers:
  - Responsibility
  - Leadership
  - Fear of failing their children
  - Desire to be present and respected


---

### 4a. PERSONAL IDENTITY STEP

**Screen: What should we call you?** (required though)
- First name: Required
- Last name: Optional

Friendly, affirming language encouraging honesty and warmth.

### 4b. PARENT ROLE STEP (required though)

**Screen: Whats your role?**
- Role picked (They will pick a role from our list of roles)

Friendly, affirming language encouraging honesty and warmth.

---

### 5. CHILDREN COUNT

**Screen: Your Family**
- Ask for number of children
- Simple selector (stepper or picker)

---

### 6. CHILDREN BASIC INFO (SINGLE SCREEN, MULTI-CHILD)

Parents enter basic info for all children in one smooth flow.
(All required)
**For each child** 
- First name
- Academic class (Year 1 → Year 13) (picked from our options not typed)
- Gender (picked not typed: Only Male and female)
- Date of birth (date picker only)
- Favourite color (colour picker only)
- Academic struggle (they will be asked to pick 3 subject areas from our list of learning tasks where they struggle the most, 

**Notes**
- Favourite color becomes the default theme color for that child’s dashboard
- Used later when the child sets up their own profile

---
Total onboarding screen before the summary screen will be 25 screens.

### 7. ONBOARDING SUMMARY SCREEN (WOW MOMENT) ✅

**Pre-Summary Loading Screen (15 seconds)**

Before the summary screen loads, a beautiful anticipation screen displays rotating reassuring messages:
- "Personalizing your dashboard..."
- "Setting up your child's learning plan..."
- "Creating your family's growth roadmap..."
- "Building custom routines for your family..."
- "Preparing rewards that motivate..."
- "Configuring progress tracking..."
- "Adding the finishing touches..."
- "You're going to love this..."
- "Almost ready to transform your parenting..."
- "Your family hub is coming together..."

Visual elements:
- Animated pulsing circle with spinner
- Progress dots that fill as messages rotate
- Centered, calm layout
- Parent's theme color throughout

**Summary Screen Design**

**Purpose**
- Reflect everything the parent has shared
- Create emotional resonance
- Build confidence in the product
- Make the parent feel truly understood

**Content**
- Header: "We See You, [Parent Name]" with sparkle icon
- Emotional insight card with personalized message:
  - Fathers: Focus on presence, legacy, showing up daily
  - Mothers: Acknowledge mental load, invisible work, love in small moments
- Family overview section:
  - Parent role and name
  - Each child with avatar (first letter), name, academic year, gender
  - Favorite color indicators
- Closing affirmation:
  - Fathers: "You're not just raising kids. You're building a legacy."
  - Mothers: "You're not just a mother. You're the heart of your family."

This screen achieves:
- “This app understands me”
- “I want to continue”
- “I desperately need this app”
- “All my prayers have been answered”
---

### 8. EMAIL COLLECTION (EMOTIONAL ASK) (required though)

**Screen: Stay Connected**
- Ask for email address
- Language must feel:
  - Warm
  - Exciting
  - Safe
- No technical wording

**Behavior**
- Upon submission:
  - Account is registered
  - System triggers first email delivery countdown

---

### 9. EMAIL COUNTDOWN CONFIRMATION

**Screen**
- Displays:
  - Countdown timer (5 minutes)
  - Message:
    - “Your first email is on the way”
    - Builds anticipation

---

### 10. PIN CREATION

**Screen: Secure Your Account**
- User selects a 6-digit PIN
- Used for all future logins

---

### 11. PAYWALL & PLAN SELECTION (CRITICAL)

**Plans displayed**

plan prices shows actualy daily cost in bold
they can toggle between monthly and annually at the top. easy and noticeable. but the default would be monthly. 

**Free Plan**
- 1 child
- Limited features:
  - Tasks
  - Rewards
  - Tracking
- No learning system
- No family calendar

**Pro Plan**
- Monthly: $6.99
- Yearly: $4.99/month
- 4 children limit
- Access to most features
- Excludes:
  - Learning assignments
  - Family calendar

**Forge Plan (Most Popular)**
- Monthly: $9.99
- Yearly: $7.99/month
- Unlimited access to everything

**Forge Plan positioning**
- Highlighted visually
- Labeled as “Most Popular”
- Language subtly suggests:
  - This is the smart choice
  - Not choosing it feels like missing out
- No aggressive upselling

---

### 12. POST-PAYMENT – AVATAR SETUP (MANDATORY)

**Welcome Screen**
- User is prompted to choose a profile avatar
- This step is mandatory

**Avatar options**
- Choose from photo library
- Take a new photo

**Rules**
- Image size: Max 5MB
- Image type: png or jpeg

**Navigation lock**
- User cannot proceed or go back without selecting an avatar
- even if the user closes the app and opens it again if they haven't completed this step, they will come back to this avatar screen.

---

### 13. CLOUD SYNC & ACCESS RULES

**Cloud Sync**
- Enabled only for Forge plan users
- Stores profile images and data in the cloud

**Access Sharing**
- Forge Plan:
  - Can give access to partner or another adult
- Other plans:
  - Can only give access/link to children

---

### 14. FIRST HOME ENTRY

After avatar is saved:
- User is taken directly to the Home screen

**Post-entry behavior**
- User is gently and randomly prompted to:
  - Complete their own profile
  - Complete each child’s profile
- Prompts continue until all required information is provided. prompts will carry two buttons unless completed to be 100%. the two buttons will be *My children* and *My profile*

---

### END OF UPDATE


## 🧘 Philosophy

1. **One child at a time** – Avoid overwhelming UI
2. **Reward progress, not perfection** – Motivate with points & rewards
3. **Calm UX** – Low-stimulation, clean dashboards
4. **Offline-first** – Works without internet
5. **Family-centered** – Supports multiple caregivers
6. **Private by default** – Each profile is personal
7. **No manual typing for dates/times** – Always use native pickers

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Bun (package manager)
- Expo CLI
- iOS Simulator or Android Emulator (or physical device)

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd Pro-parenting

# Install dependencies
bun install

# Start the development server
bun run start

# Run on iOS
bun run ios

# Run on Android
bun run android

# Run admin dashboard
cd admin && bun run dev
```

### Environment Variables

Create a `.env` file:
```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

---

## 📄 License

Proprietary - All rights reserved

---

## 🤝 Support

For support inquiries, contact the development team.

---

*Built with ❤️ for busy parents everywhere*
