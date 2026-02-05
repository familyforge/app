// FamilyForge - Weekly Report Cron Job
// Runs every Sunday at 9:00 AM UTC to send weekly reports

// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const resendApiKey = Deno.env.get('RESEND_API_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  // Verify this is a scheduled invocation or admin call
  const authHeader = req.headers.get('Authorization');
  
  try {
    console.log('Starting weekly report generation...');

    // Get all users with weekly reports enabled
    const { data: users, error: usersError } = await supabase
      .from('parents')
      .select('id, name, email')
      .contains('notification_settings', { weeklyReports: true });

    if (usersError) {
      throw new Error(`Failed to fetch users: ${usersError.message}`);
    }

    console.log(`Found ${users?.length || 0} users with weekly reports enabled`);

    const results = {
      processed: 0,
      successful: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const user of users || []) {
      try {
        // Generate report data
        const reportData = await generateReportData(user.id);
        
        if (!reportData) {
          console.log(`No data for user ${user.id}, skipping`);
          continue;
        }

        results.processed++;

        // Send email with report
        const emailSent = await sendReportEmail(user, reportData);
        
        if (emailSent) {
          results.successful++;
        } else {
          results.failed++;
          results.errors.push(`Failed to send to ${user.email}`);
        }
      } catch (error) {
        results.failed++;
        results.errors.push(`Error for ${user.email}: ${error.message}`);
      }
    }

    console.log('Weekly report generation complete:', results);

    return new Response(
      JSON.stringify(results),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Weekly report cron error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

async function generateReportData(parentId: string) {
  // Calculate week dates
  const now = new Date();
  const weekEnd = new Date(now);
  weekEnd.setDate(weekEnd.getDate() - weekEnd.getDay());
  const weekStart = new Date(weekEnd);
  weekStart.setDate(weekStart.getDate() - 6);

  const weekStartStr = weekStart.toISOString().split('T')[0];
  const weekEndStr = weekEnd.toISOString().split('T')[0];

  // Get children
  const { data: children } = await supabase
    .from('children')
    .select('id, name, points')
    .eq('parent_id', parentId);

  if (!children || children.length === 0) return null;

  const childIds = children.map((c) => c.id);

  // Get task completions
  const { data: taskCompletions } = await supabase
    .from('task_history')
    .select('child_id, points_earned, completed_at')
    .in('child_id', childIds)
    .gte('completed_at', weekStartStr)
    .lte('completed_at', weekEndStr + 'T23:59:59');

  // Get reward redemptions
  const { data: rewardRedemptions } = await supabase
    .from('reward_history')
    .select('child_id')
    .in('child_id', childIds)
    .gte('redeemed_at', weekStartStr)
    .lte('redeemed_at', weekEndStr + 'T23:59:59');

  // Build children stats
  const childrenStats = children.map((child) => {
    const completions = taskCompletions?.filter((t) => t.child_id === child.id) || [];
    const redemptions = rewardRedemptions?.filter((r) => r.child_id === child.id) || [];
    const pointsEarned = completions.reduce((sum, t) => sum + (t.points_earned || 0), 0);

    return {
      name: child.name,
      tasksCompleted: completions.length,
      pointsEarned,
      rewardsRedeemed: redemptions.length,
    };
  });

  const totalTasks = childrenStats.reduce((sum, c) => sum + c.tasksCompleted, 0);
  const totalPoints = childrenStats.reduce((sum, c) => sum + c.pointsEarned, 0);
  const totalRewards = childrenStats.reduce((sum, c) => sum + c.rewardsRedeemed, 0);

  return {
    weekStart: weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    weekEnd: weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    children: childrenStats,
    totalTasks,
    totalPoints,
    totalRewards,
  };
}

async function sendReportEmail(
  user: { id: string; name: string; email: string },
  reportData: any
): Promise<boolean> {
  const html = generateReportHtml(user.name, reportData);

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'FamilyForge <noreply@familyforge.app>',
      to: user.email,
      subject: `📊 Your Weekly Family Report - ${reportData.weekEnd}`,
      html,
    }),
  });

  return response.ok;
}

function generateReportHtml(userName: string, data: any): string {
  const childrenRows = data.children
    .map((c: any) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #334155; color: white;">${c.name}</td>
        <td style="padding: 12px; border-bottom: 1px solid #334155; color: #10b981; text-align: center;">${c.tasksCompleted}</td>
        <td style="padding: 12px; border-bottom: 1px solid #334155; color: #fbbf24; text-align: center;">${c.pointsEarned}</td>
        <td style="padding: 12px; border-bottom: 1px solid #334155; color: #8b5cf6; text-align: center;">${c.rewardsRedeemed}</td>
      </tr>
    `)
    .join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 30px; border-radius: 16px 16px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">📊 Weekly Family Report</h1>
          <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0;">${data.weekStart} - ${data.weekEnd}</p>
        </div>

        <!-- Body -->
        <div style="background: #1e293b; padding: 30px; border-radius: 0 0 16px 16px;">
          <p style="color: #e2e8f0; font-size: 16px; margin-top: 0;">Hi ${userName}! 👋</p>
          <p style="color: #94a3b8;">Here's how your family did this week:</p>

          <!-- Summary Stats -->
          <div style="display: flex; gap: 12px; margin: 24px 0;">
            <div style="flex: 1; background: #334155; padding: 20px; border-radius: 12px; text-align: center;">
              <p style="color: #10b981; font-size: 32px; font-weight: bold; margin: 0;">${data.totalTasks}</p>
              <p style="color: #94a3b8; margin: 8px 0 0; font-size: 14px;">Tasks Completed</p>
            </div>
            <div style="flex: 1; background: #334155; padding: 20px; border-radius: 12px; text-align: center;">
              <p style="color: #fbbf24; font-size: 32px; font-weight: bold; margin: 0;">${data.totalPoints}</p>
              <p style="color: #94a3b8; margin: 8px 0 0; font-size: 14px;">Points Earned</p>
            </div>
            <div style="flex: 1; background: #334155; padding: 20px; border-radius: 12px; text-align: center;">
              <p style="color: #8b5cf6; font-size: 32px; font-weight: bold; margin: 0;">${data.totalRewards}</p>
              <p style="color: #94a3b8; margin: 8px 0 0; font-size: 14px;">Rewards Claimed</p>
            </div>
          </div>

          <!-- Per-Child Table -->
          <h3 style="color: white; margin: 24px 0 16px;">Individual Progress</h3>
          <table style="width: 100%; border-collapse: collapse; background: #334155; border-radius: 12px; overflow: hidden;">
            <thead>
              <tr style="background: #475569;">
                <th style="padding: 12px; text-align: left; color: #94a3b8; font-weight: 500;">Child</th>
                <th style="padding: 12px; text-align: center; color: #94a3b8; font-weight: 500;">Tasks</th>
                <th style="padding: 12px; text-align: center; color: #94a3b8; font-weight: 500;">Points</th>
                <th style="padding: 12px; text-align: center; color: #94a3b8; font-weight: 500;">Rewards</th>
              </tr>
            </thead>
            <tbody>
              ${childrenRows}
            </tbody>
          </table>

          <!-- CTA -->
          <div style="text-align: center; margin-top: 32px;">
            <a href="https://familyforge.app" style="display: inline-block; background: #3b82f6; color: white; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 600;">View Full Details</a>
          </div>

          <!-- Footer -->
          <p style="color: #64748b; font-size: 12px; text-align: center; margin-top: 32px;">
            You're receiving this because you enabled Weekly Reports in FamilyForge settings.
            <br><a href="https://familyforge.app/settings" style="color: #64748b;">Manage preferences</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}
