# FamilyForge Email Integration

## Overview
FamilyForge uses **Resend API** for sending transactional emails through Supabase Edge Functions. Emails are triggered automatically for key user actions and can be customized through user preferences.

## Brand Identity

All emails feature:
- **Logo**: FamilyForge logo at top
- **Tagline**: "Rewards & Growth for Kids"
- **Primary Colors**: Purple (#8b5cf6) to Deep Indigo (#4f46e5) gradient
- **Accent**: Light Purple (#a78bfa)
- **Emotional Messaging**: Empathetic, trust-building copy throughout

## Email Templates

### Transactional Emails

#### 1. Welcome Email (`welcome`)
Sent immediately when a new user signs up.
- **Trigger**: User registration
- **Recipients**: New parent
- **Data**: Parent name
- **Content**: Getting started steps, emotional welcome message

#### 2. Task Reminders (`task_reminder`)
Sent when tasks are due or overdue.
- **Trigger**: Task due date approaching or passed
- **Recipients**: Parent assigned to child
- **Data**: Task title, description, assignee, due date, points

#### 3. Achievement Alerts (`achievement_alert`)
Celebrate when children reach milestones.
- **Trigger**: Task completion (50+ points), streaks, leaderboard ranks
- **Recipients**: Parent
- **Data**: Child name, achievement type, points earned, rank

#### 4. Weekly Reports (`weekly_report`)
Summary of family progress every week.
- **Trigger**: Weekly cron job (Sundays)
- **Recipients**: All parents
- **Data**: Family stats, child progress, top achievements

#### 5. Family Invitations (`family_invite`)
Invite co-parents or guardians.
- **Trigger**: Parent sends invitation
- **Recipients**: Invited user
- **Data**: Inviter name, family name, role, invite code, expiration

#### 6. Data Export Ready (`data_export_ready`)
GDPR compliance - notify when data export is complete.
- **Trigger**: Admin processes data export request
- **Recipients**: Requesting user
- **Data**: Download URL, expiration date

### Abandoned Payment Sequence

When a user abandons the payment page, they receive a sequence of emotionally engaging emails:

#### 7. Abandoned Payment - 1 Hour (`abandoned_payment_1hr`)
- **Trigger**: 1 hour after payment abandonment
- **Content**: Gentle nudge, "Still thinking about it?", offer to help

#### 8. Abandoned Payment - 24 Hours (`abandoned_payment_24hr`)
- **Trigger**: 24 hours after payment abandonment
- **Content**: Social proof (testimonials, 10,000+ families stat), urgency

#### 9. Abandoned Payment - Day 2-7 (`abandoned_payment_followup`)
- **Trigger**: Daily from day 2 to day 7
- **Data**: Day number for customized messaging
- **Day 7 Content**: Final "last chance" message with urgency

### Free Plan Retention

#### 10. Free Plan Weekly Nudge (`free_plan_weekly`)
- **Trigger**: Weekly (7 days since last nudge)
- **Recipients**: Users on free plan
- **Content**: Shows what Pro features they're missing out on
- **Data**: Parent name, child name (if available), Pro price

## Setup Instructions

### 1. Configure Resend API Key

Add the API key to Supabase Project Settings:
1. Go to https://supabase.com/dashboard
2. Select your project: `xyntgrgbacvnrdggtpkl`
3. Navigate to **Project Settings → Edge Functions → Secrets**
4. Add secret:
   - Name: `RESEND_API_KEY`
   - Value: your Resend API key from https://resend.com/api-keys

> **Never paste the actual key into this file or any other tracked file.** This
> repository is public. Secrets belong in Supabase Edge Function secrets only.

### 2. Verify Domain (Production)

✅ **Domain Verified**: `familyforge.app`

Your domain is now verified and you can send emails to any address using:
- From: `noreply@familyforge.app`
- Any recipient email address

The Edge Function is already configured with:
```ts
const FROM_EMAIL = 'FamilyForge <noreply@familyforge.app>';
```

### 3. Apply Database Migration

Run the abandoned payment tracking migration:
```bash
supabase db push
# Or manually apply:
supabase db execute --file supabase/migrations/004_abandoned_payment_tracking.sql
```

### 4. Deploy Edge Functions

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link project
supabase link --project-ref xyntgrgbacvnrdggtpkl

# Deploy all email functions
supabase functions deploy send-email
supabase functions deploy weekly-report-cron
supabase functions deploy process-abandoned-emails
supabase functions deploy free-plan-weekly-cron
```

### 5. Set Up Cron Jobs

In Supabase Dashboard → Edge Functions → Schedules:

**Weekly Reports (Sundays 9 AM UTC)**:
- Function: `weekly-report-cron`
- Schedule: `0 9 * * 0`

**Abandoned Payment Processing (Every Hour)**:
- Function: `process-abandoned-emails`
- Schedule: `0 * * * *`

**Free Plan Weekly Nudge (Mondays 10 AM UTC)**:
- Function: `free-plan-weekly-cron`
- Schedule: `0 10 * * 1`

## Usage in Mobile App

### Send Welcome Email
```typescript
import { sendWelcomeEmail } from '@/lib/api/email';

await sendWelcomeEmail(
  { email: 'parent@example.com', name: 'John Doe' },
  'John'
);
```

### Send Task Reminder
```typescript
import { sendTaskReminder } from '@/lib/api/email';

await sendTaskReminder({
  parentEmail: 'parent@example.com',
  parentName: 'John Doe',
  taskTitle: 'Clean your room',
  taskDescription: 'Make bed and organize toys',
  assignedTo: 'Emma',
  dueDate: 'Tomorrow at 3 PM',
  pointsValue: 50,
});
```

### Send Achievement Alert
```typescript
import { sendAchievementAlert } from '@/lib/api/email';

await sendAchievementAlert({
  parentEmail: 'parent@example.com',
  parentName: 'John Doe',
  childName: 'Emma',
  achievementTitle: 'Task Master!',
  achievementDetails: 'Emma completed 10 tasks in a row!',
  pointsEarned: 100,
  rank: 15,
  rankScope: 'worldwide',
});
```

### Manage Email Preferences
```typescript
import { getEmailPreferences, updateEmailPreferences } from '@/lib/api/email';

// Get preferences
const prefs = await getEmailPreferences(userId);

// Update preferences
await updateEmailPreferences(userId, {
  task_reminders: true,
  achievement_alerts: true,
  weekly_reports: false,
});
```

### Track Abandoned Payment
```typescript
// When user starts checkout
const { data } = await supabase.rpc('track_abandoned_payment', {
  p_user_id: user.id,
  p_email: user.email,
  p_parent_name: user.name,
  p_plan_name: 'Pro Monthly',
  p_stripe_session_id: stripeSession.id,
});

// When payment completes
await supabase.rpc('complete_payment_session', {
  p_session_id: sessionId,
});
```

### Register Free Plan User
```typescript
// When user chooses free plan
await supabase.rpc('register_free_plan_user', {
  p_user_id: user.id,
  p_email: user.email,
  p_parent_name: user.name,
});

// When user upgrades to Pro
await supabase.rpc('remove_from_free_plan_schedule', {
  p_user_id: user.id,
});
```

## Abandoned Payment Email Sequence

The abandoned payment sequence automatically sends:

| Time After Abandonment | Email Type | Content Focus |
|------------------------|------------|---------------|
| 1 hour | `abandoned_payment_1hr` | Gentle nudge, offer to help |
| 24 hours | `abandoned_payment_24hr` | Social proof, testimonials |
| Day 2 | `abandoned_payment_followup` | Feature benefits |
| Day 3 | `abandoned_payment_followup` | Child success stories |
| Day 4 | `abandoned_payment_followup` | Comparison with free |
| Day 5 | `abandoned_payment_followup` | Limited time offer hint |
| Day 6 | `abandoned_payment_followup` | Almost there message |
| Day 7 | `abandoned_payment_followup` | Final "last chance" |

Emails stop automatically when:
- User completes payment
- User unsubscribes
- 7 days have passed

## Email Preference Management

Users can control which emails they receive:
- **Task Reminders**: Due/overdue task notifications
- **Achievement Alerts**: Milestone celebrations
- **Weekly Reports**: Sunday summary emails
- **Marketing Emails**: Tips and feature updates
- **Family Invitations**: Co-parent invites
- **Security Alerts**: Account security (required, cannot be disabled)

Access via: **Settings → Email Preferences**

## Free Plan Limitations

Current Resend free plan limits:
- **Monthly**: 3,000 emails (3 used)
- **Daily**: 100 emails (3 used)
- ✅ **Recipients**: Any email address (domain verified)

### Domain Status:
✅ `familyforge.app` - Verified and active
- Can send from: `noreply@familyforge.app`
- Can send to: Any valid email address

## Email Logging

All sent emails are logged to `email_logs` table:
```sql
SELECT * FROM email_logs 
WHERE recipient_email = 'parent@example.com' 
ORDER BY created_at DESC 
LIMIT 10;
```

Fields:
- `user_id`: Sender
- `recipient_email`: Recipient
- `template`: Email template used
- `subject`: Email subject line
- `status`: pending | sent | failed | bounced
- `error_message`: Error details if failed
- `sent_at`: Timestamp

## Testing

Run local test:
```bash
node test-email.js
```

This sends a test email to your verified Resend address with FamilyForge logo and branding.

## Troubleshooting

### Email not sending
1. Check RESEND_API_KEY is set in Supabase Edge Function secrets
2. Verify recipient email is your verified Resend address (free plan)
3. Check email_logs table for error messages
4. Ensure user hasn't disabled email type in preferences

### Wrong template
1. Verify template name matches exactly: `task_reminder`, `achievement_alert`, etc.
2. Check template data includes all required fields
3. Review `supabase/functions/send-email/index.ts` for template structure

### Domain verification issues
1. Wait up to 48 hours for DNS propagation
2. Use Resend DNS checker: https://resend.com/domains
3. Ensure all records (TXT, MX, CNAME) are added correctly

## Admin Dashboard

View email analytics in admin dashboard:
- **Total emails sent**: Monthly/daily counts
- **Delivery rates**: Success vs failed
- **Popular templates**: Most used email types
- **User preferences**: Opt-out statistics

Access: https://admin.familyforge.app/analytics

## Future Enhancements

- [ ] Email templates with user's theme preferences
- [ ] Localized emails based on user language
- [ ] In-app email preview before sending
- [ ] Batch send optimization for weekly reports
- [ ] Email bounce handling and retry logic
- [ ] Unsubscribe links (GDPR compliance)
- [ ] A/B testing for email content
