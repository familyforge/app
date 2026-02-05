-- Fix RLS recursion: avoid self-referencing parents table in policies

-- Helper function to check admin role without RLS recursion
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
set row_security = off
as $$
  select exists (
    select 1
    from public.parents p
    where p.id = auth.uid()
      and p.role in ('admin', 'superadmin')
  );
$$;

-- Parents policies
DROP POLICY IF EXISTS "Admins can view all parents" ON parents;
CREATE POLICY "Admins can view all parents" ON parents
  FOR SELECT USING (public.is_admin());

-- Children policies
DROP POLICY IF EXISTS "Admins can view all children" ON children;
CREATE POLICY "Admins can view all children" ON children
  FOR SELECT USING (public.is_admin());
