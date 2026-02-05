import { supabase, isSupabaseConfigured } from './supabase';
import type { SubscriptionTier } from './database.types';

export async function updateParentPlan(planCode: 'free' | 'pro' | 'forge'): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const subscriptionTier: SubscriptionTier = planCode === 'free' ? 'free' : 'premium';

  await supabase
    .from('parents')
    .update({
      plan_code: planCode,
      subscription_tier: subscriptionTier,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);
}
