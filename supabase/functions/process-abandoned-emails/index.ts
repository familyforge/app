// Supabase Edge Function: process-abandoned-emails
// Runs via cron to send abandoned payment reminder emails

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PendingSession {
  session_id: string;
  user_id: string;
  email: string;
  parent_name: string | null;
  plan_name: string;
  abandoned_at: string;
  hours_since_abandoned: number;
  emails_sent: string[] | null;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get pending abandoned sessions
    const { data: sessions, error: fetchError } = await supabase
      .rpc('get_pending_abandoned_emails');

    if (fetchError) {
      console.error('Error fetching pending sessions:', fetchError);
      throw fetchError;
    }

    if (!sessions || sessions.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No pending emails to send', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results = {
      processed: 0,
      sent: 0,
      skipped: 0,
      errors: [] as string[],
    };

    for (const session of sessions as PendingSession[]) {
      results.processed++;
      
      const emailsSent = session.emails_sent || [];
      const hours = Math.floor(session.hours_since_abandoned);
      
      let emailType: string | null = null;
      let template: string | null = null;
      let dayNumber: number | null = null;

      // Determine which email to send based on time elapsed
      if (hours >= 1 && hours < 24 && !emailsSent.includes('1hr')) {
        emailType = '1hr';
        template = 'abandoned_payment_1hr';
      } else if (hours >= 24 && hours < 48 && !emailsSent.includes('24hr')) {
        emailType = '24hr';
        template = 'abandoned_payment_24hr';
      } else if (hours >= 48 && hours < 72 && !emailsSent.includes('day2')) {
        emailType = 'day2';
        template = 'abandoned_payment_followup';
        dayNumber = 2;
      } else if (hours >= 72 && hours < 96 && !emailsSent.includes('day3')) {
        emailType = 'day3';
        template = 'abandoned_payment_followup';
        dayNumber = 3;
      } else if (hours >= 96 && hours < 120 && !emailsSent.includes('day4')) {
        emailType = 'day4';
        template = 'abandoned_payment_followup';
        dayNumber = 4;
      } else if (hours >= 120 && hours < 144 && !emailsSent.includes('day5')) {
        emailType = 'day5';
        template = 'abandoned_payment_followup';
        dayNumber = 5;
      } else if (hours >= 144 && hours < 168 && !emailsSent.includes('day6')) {
        emailType = 'day6';
        template = 'abandoned_payment_followup';
        dayNumber = 6;
      } else if (hours >= 168 && !emailsSent.includes('day7')) {
        emailType = 'day7';
        template = 'abandoned_payment_followup';
        dayNumber = 7;
      }

      if (!emailType || !template) {
        results.skipped++;
        continue;
      }

      try {
        // Send the email
        const emailData: Record<string, unknown> = {
          parentName: session.parent_name || 'there',
          planName: session.plan_name,
          sessionId: session.session_id,
        };

        if (dayNumber !== null) {
          emailData.dayNumber = dayNumber;
        }

        const { data: emailResult, error: sendError } = await supabase.functions.invoke('send-email', {
          body: {
            template,
            recipients: [{ email: session.email, name: session.parent_name }],
            data: emailData,
          },
        });

        if (sendError) {
          console.error(`Error sending ${emailType} email to ${session.email}:`, sendError);
          results.errors.push(`${session.email}: ${sendError.message}`);
          continue;
        }

        // Record that we sent this email
        const { error: recordError } = await supabase.rpc('record_abandoned_email_sent', {
          p_session_id: session.session_id,
          p_email_type: emailType,
          p_resend_email_id: emailResult?.id || null,
        });

        if (recordError) {
          console.error('Error recording sent email:', recordError);
        }

        results.sent++;
        console.log(`Sent ${emailType} email to ${session.email}`);

      } catch (emailError) {
        console.error(`Failed to send email to ${session.email}:`, emailError);
        results.errors.push(`${session.email}: ${String(emailError)}`);
      }
    }

    return new Response(
      JSON.stringify({
        message: 'Abandoned email processing complete',
        ...results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in process-abandoned-emails:', error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
