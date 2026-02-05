# FamilyForge Email System Architecture

## 🎯 System Overview

The FamilyForge email system consists of three distinct components:

```
┌─────────────────────────────────────────────────────────────────┐
│                   EMAIL SYSTEM PRO (Production)                 │
│                                                                 │
│  Location: supabase/functions/send-email/index.ts              │
│  Purpose:  Production email templates (mobile-optimized)       │
│  Status:   ✅ LOCKED - DO NOT EDIT (see WARNING.md)            │
│                                                                 │
│  Templates: 11 premium templates with table-based layouts      │
│             for iOS Mail, Gmail, Outlook compatibility         │
└─────────────────────────────────────────────────────────────────┘
           ▲                                    ▲
           │                                    │
           │ (invokes)                          │ (invokes)
           │                                    │
┌──────────┴─────────────┐         ┌───────────┴─────────────────┐
│   Mobile App Client    │         │   Admin Dashboard Client    │
│                        │         │                             │
│  src/lib/api/email.ts  │         │  admin/src/lib/api/email.ts │
│                        │         │                             │
│  Type-safe wrappers    │         │  + Email management UI      │
│  for edge function     │         │  + Analytics                │
│                        │         │  + Scheduling               │
│                        │         │  + Preview/Testing          │
└────────────────────────┘         └─────────────────────────────┘
```

---

## 📁 File Structure

### 1. **Email System Pro** (Production Templates)
**Location:** `supabase/functions/send-email/`

```
send-email/
├── index.ts              ← 11 production email templates (LOCKED)
└── WARNING.md            ← Critical documentation (READ THIS FIRST)
```

**⚠️ DO NOT EDIT** without reading `WARNING.md`

**Templates:**
- `welcome` - User onboarding
- `email_verification_code` - 4-digit verification
- `abandoned_payment_1hr` - Cart recovery (1h)
- `abandoned_payment_24h` - Cart recovery (24h)
- `abandoned_payment_followup` - Cart recovery (Day 3/5/7)
- `free_plan_weekly_nudge` - Upgrade prompts
- `task_reminder` - Task notifications
- `achievement_alert` - Achievement celebrations
- `weekly_report` - Family progress
- `family_invite` - Invite codes
- `data_export_ready` - GDPR exports

---

### 2. **Mobile App Client** (Type-Safe Wrapper)
**Location:** `src/lib/api/email.ts`

**Purpose:** Client-side TypeScript wrapper for invoking edge function

**Usage:**
```typescript
import { sendWelcomeEmail, sendVerificationCode } from '@/lib/api/email';

await sendWelcomeEmail(
  { email: 'user@example.com', name: 'John' },
  'John Doe'
);

await sendVerificationCode(
  { email: 'user@example.com', name: 'Jane' },
  { parentName: 'Jane', code: '1234' }
);
```

---

### 3. **Admin Dashboard UI** (Email Management)
**Location:** `admin/src/lib/email/`

**Purpose:** Advanced email management utilities for admin dashboard

```
admin/src/lib/email/
├── index.ts                    ← Main exports & docs
├── types.ts                    ← TypeScript interfaces
├── email-api.ts                ← API wrapper
├── email-analytics.tsx         ← Delivery & engagement analytics
├── email-scheduling.tsx        ← Schedule emails for later
├── email-segmentation.tsx      ← Target specific user groups
├── email-preview.tsx           ← Preview before sending
├── email-dry-run.tsx           ← Test without sending
├── email-compliance.tsx        ← GDPR/CAN-SPAM monitoring
├── email-versioning.tsx        ← Template version control
├── email-blocks.ts             ← Reusable HTML components
└── EmailSystemEnhanced.tsx     ← Enhanced email UI wrapper
```

**These are UI utilities, NOT the email templates themselves.**

---

## 🚀 Deployment

### Edge Function Deployment

```bash
# Deploy Email System Pro
cd c:\Users\CCMendel\FamilyForge
npx supabase functions deploy send-email --no-verify-jwt --project-ref xyntgrgbacvnrdggtpkl
```

**Required flags:**
- `--no-verify-jwt` - Allows calls from admin dashboard (no user auth)

### Environment Variables

Set in Supabase (not in `.env`):

```bash
npx supabase secrets set RESEND_API_KEY=re_xxx --project-ref xyntgrgbacvnrdggtpkl
npx supabase secrets set RESEND_FROM_EMAIL="FamilyForge <hello@familyforge.app>" --project-ref xyntgrgbacvnrdggtpkl
```

---

## 🎨 Email Design Principles

### Mobile-First Architecture

All templates use **table-based layouts** (NOT divs) for maximum email client compatibility:

```html
✅ CORRECT (works on iOS Mail, Gmail, Outlook):
<table bgcolor="#0f0a1f"><tr><td>Content</td></tr></table>

❌ WRONG (fails on iOS Mail):
<div style="background: #0f0a1f">Content</div>
```

### Key Rules

1. **Always use `<table>` + `<td>` for layouts**
2. **Always use `bgcolor="#hex"` attribute** (NOT CSS background)
3. **Keep all CSS inline** (no external stylesheets or `<style>` tags)
4. **Use `cellpadding="0" cellspacing="0" border="0"`** on all tables
5. **NEVER use flexbox, grid, position: absolute, or float**

See `supabase/functions/send-email/WARNING.md` for complete guidelines.

---

## 🧪 Testing

### Before Deploying Changes

Test on REAL devices (not just desktop browsers):

- [ ] iOS Mail (iPhone/iPad)
- [ ] Gmail app (Android + iOS)
- [ ] Outlook mobile
- [ ] Desktop Gmail (Chrome)
- [ ] Desktop Outlook

### Test Checklist

- [ ] Dark background renders correctly
- [ ] White text is readable
- [ ] Buttons are clickable
- [ ] Images load (or alt text shows)
- [ ] No horizontal scrolling on mobile
- [ ] All links work

**Recommended:** Use [Litmus](https://litmus.com) or [Email on Acid](https://www.emailonacid.com) for comprehensive testing.

---

## 📊 Monitoring

### Email Analytics (Admin Dashboard)

View real-time email metrics:
- Delivery rates
- Open rates
- Click-through rates
- Bounce rates
- Spam complaints

**Location:** Admin Dashboard → Email System → Analytics tab

### Error Logging

Check Supabase logs:
```
https://supabase.com/dashboard/project/xyntgrgbacvnrdggtpkl/logs/edge-functions
```

---

## ⚠️ Critical Rules

### DO THIS:
✅ Use Email System Pro templates (edge function)  
✅ Call via `supabase.functions.invoke('send-email', ...)`  
✅ Test on real mobile devices before deploying  
✅ Use admin UI utilities for management features  
✅ Read `WARNING.md` before editing templates  

### NEVER DO THIS:
❌ Edit Email System Pro templates without reading `WARNING.md`  
❌ Use `<div>` with CSS backgrounds in emails  
❌ Create duplicate email template systems  
❌ Hard-code email HTML in React components  
❌ Deploy without `--no-verify-jwt` flag  
❌ Set secrets in `.env` file (use Supabase secrets)  

---

## 📞 Support

### Problems?

1. **Email not sending?**
   - Check Supabase secrets are set (`RESEND_API_KEY`)
   - Check edge function logs for errors
   - Verify recipient email is valid

2. **Email looks broken on mobile?**
   - Verify you're using `<table>` layouts (NOT `<div>`)
   - Check `bgcolor` attributes are set on `<td>` elements
   - Read mobile email client rules in `WARNING.md`

3. **Need to add new template?**
   - **STOP.** Read `WARNING.md` first.
   - Copy existing template structure exactly
   - Use table-based layouts only
   - Test on iOS Mail before deploying

---

## 📝 Change Log

- **Feb 5, 2026** - Mobile optimization complete. All templates use table layouts.
- **Feb 4, 2026** - Added CORS headers for admin dashboard
- **Feb 3, 2026** - Deployed with `--no-verify-jwt` flag
- **Feb 2, 2026** - Set Supabase secrets for Resend API
- **Feb 1, 2026** - Created Email System Pro with 11 templates

---

**Status:** ✅ Production-ready | Mobile-optimized | LOCKED

**Last Updated:** February 5, 2026
