// Supabase Edge Function: free-plan-weekly-cron
// Runs weekly to send "what you're missing" emails to free plan users

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { assertCronCaller } from '../_shared/guard.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FreePlanUser {
  id: string;
  user_id: string;
  email: string;
  parent_name: string | null;
  nudge_count: number;
}

serve(async (req) => {

  // Scheduled/bulk work: requires the shared secret. Posting with just the
  // anon key used to return 200 and email every user.
  const denied = assertCronCaller(req);
  if (denied) return denied;
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get free plan users who need weekly email
    const { data: users, error: fetchError } = await supabase
      .rpc('get_free_plan_users_for_weekly_email');

    if (fetchError) {
      console.error('Error fetching free plan users:', fetchError);
      throw fetchError;
    }

    if (!users || users.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No free plan emails to send', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results = {
      processed: 0,
      sent: 0,
      errors: [] as string[],
    };

    for (const user of users as FreePlanUser[]) {
      results.processed++;

      try {
        // Get a random child name for personalization (if they have children)
        const { data: children } = await supabase
          .from('children')
          .select('name')
          .eq('family_id', user.user_id)
          .limit(1)
          .single();

        // Send the email
        const { error: sendError } = await supabase.functions.invoke('send-email', {
          body: {
            template: 'free_plan_weekly',
            recipients: [{ email: user.email, name: user.parent_name }],
            data: {
              parentName: user.parent_name || 'there',
              childName: children?.name,
              proPrice: '$4.99/month',
            },
          },
        });

        if (sendError) {
          console.error(`Error sending free plan email to ${user.email}:`, sendError);
          results.errors.push(`${user.email}: ${sendError.message}`);
          continue;
        }

        // Mark as sent
        const { error: markError } = await supabase.rpc('mark_free_plan_email_sent', {
          p_id: user.id,
        });

        if (markError) {
          console.error('Error marking email as sent:', markError);
        }

        results.sent++;
        console.log(`Sent free plan weekly email to ${user.email} (nudge #${user.nudge_count + 1})`);

      } catch (emailError) {
        console.error(`Failed to send email to ${user.email}:`, emailError);
        results.errors.push(`${user.email}: ${String(emailError)}`);
      }
    }

    return new Response(
      JSON.stringify({
        message: 'Free plan weekly email processing complete',
        ...results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in free-plan-weekly-cron:', error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
