# Supabase Setup Guide - Pro Parenting App

This guide explains how to set up Supabase for the Pro Parenting app.

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/log in
2. Click "New Project"
3. Fill in project details:
   - **Name**: pro-parenting
   - **Database Password**: (generate a strong password)
   - **Region**: Choose closest to your users
4. Click "Create new project" and wait for setup

## 2. Get API Credentials

1. Go to **Settings** > **API** in your Supabase dashboard
2. Copy the following values:
   - **Project URL** (starts with `https://`)
   - **anon public** key (under Project API keys)

## 3. Configure Environment Variables

Create a `.env` file in your project root (copy from `.env.example`):

```bash
# Mobile App (Expo)
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Admin Dashboard (Vite)
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## 4. Run Database Migration

1. Go to **SQL Editor** in Supabase dashboard
2. Click "New query"
3. Copy the contents of `supabase/migrations/001_initial_schema.sql`
4. Paste and click "Run"

The migration will create:
- All required tables (parents, children, tasks, rewards, exercises, reports, settings, sync_queue)
- Indexes for performance
- Row Level Security (RLS) policies
- Triggers for automatic timestamps and points calculations
- Helper functions for analytics

## 5. Enable Authentication

1. Go to **Authentication** > **Providers**
2. Enable **Email** provider (enabled by default)
3. Optionally configure:
   - **Google** for social login
   - **Apple** for iOS users

## 6. Configure Email Templates (Optional)

1. Go to **Authentication** > **Email Templates**
2. Customize confirmation, password reset emails

## 7. Verify Setup

Run the mobile app or admin dashboard:

```bash
# Mobile app
bun start

# Admin dashboard
bun admin:dev
```

Check the console for any Supabase connection warnings.

## Database Schema Overview

### Tables

| Table | Description |
|-------|-------------|
| `parents` | User accounts (parents and admins) |
| `children` | Child profiles linked to parents |
| `tasks` | Chores, exercises, personal care tasks |
| `rewards` | Redeemable rewards with point costs |
| `exercises` | Learning exercises with questions |
| `reports` | Daily/weekly progress reports |
| `settings` | User preferences |
| `sync_queue` | Offline sync queue |

### Relationships

```
parents
  └── children (1:N)
        ├── tasks (1:N)
        ├── exercises (1:N)
        ├── reports (1:N)
        └── rewards (N:N via redeemed_by_child_id)
```

### Row Level Security

All tables have RLS enabled:
- Parents can only access their own data and their children's data
- Admins can view all data
- Automatic filtering based on `auth.uid()`

## Troubleshooting

### "Supabase credentials not found"
- Check that `.env` file exists and has correct values
- Restart the dev server after adding env variables

### RLS Policy Errors
- Ensure you're logged in before accessing data
- Check that the user has the correct role (parent/admin)

### Connection Issues
- Verify your Supabase project is active
- Check API keys are correct (not the secret key)
