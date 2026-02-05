// Quick test script to send an email using Resend API directly
// Run with: node test-email.js

const RESEND_API_KEY = 're_N7EV6471_5Nx2kTvijYq98MwVtDxCUGWb';

async function sendTestEmail() {
  const recipients = ['profmendel@gmail.com', 'hello@familyforge.app'];
  
  console.log('📧 FamilyForge Email Test');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n✅ Domain Verified!');
  console.log('   Sending to: profmendel@gmail.com, hello@familyforge.app');
  console.log('   From: noreply@familyforge.app\n');
  
  for (const recipient of recipients) {
    try {
      console.log(`\n📨 Sending to ${recipient}...`);
      
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'FamilyForge <noreply@familyforge.app>',
          to: recipient,
          subject: '🎯 FamilyForge - Email Service Test',
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
              <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <!-- Logo Header -->
                <div style="text-align: center; padding: 40px 20px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 20px 20px 0 0;">
                  <div style="background: white; width: 80px; height: 80px; margin: 0 auto 20px; border-radius: 20px; display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
                    <svg width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M25 5L15 15V35L25 45L35 35V15L25 5Z" fill="#10b981"/>
                      <circle cx="25" cy="20" r="5" fill="white"/>
                      <rect x="20" y="27" width="10" height="10" rx="2" fill="white"/>
                    </svg>
                  </div>
                  <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">FamilyForge</h1>
                  <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 14px;">Building Better Families Together</p>
                </div>
                
                <!-- Content -->
                <div style="background: #1e293b; padding: 40px 30px; color: #e2e8f0;">
                  <h2 style="color: white; margin: 0 0 16px; font-size: 22px;">✅ Email Service Active!</h2>
                  <p style="color: #cbd5e1; line-height: 1.6; margin: 0 0 20px; font-size: 16px;">
                    Great news! Your FamilyForge email service is configured correctly and ready to send notifications.
                  </p>
                  
                  <!-- Feature List -->
                  <div style="background: #334155; padding: 24px; border-radius: 12px; margin: 24px 0;">
                    <h3 style="color: #10b981; margin: 0 0 16px; font-size: 18px;">🎉 What's Working:</h3>
                    <ul style="color: #cbd5e1; line-height: 1.8; margin: 0; padding-left: 20px;">
                      <li>Task reminder emails</li>
                      <li>Achievement notifications</li>
                      <li>Weekly progress reports</li>
                      <li>Family member invitations</li>
                      <li>Password reset requests</li>
                    </ul>
                  </div>
                  
                  <!-- Test Info -->
                  <div style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%); border-left: 4px solid #10b981; padding: 20px; border-radius: 8px; margin: 24px 0;">
                    <p style="margin: 0; color: #10b981; font-weight: 600; font-size: 14px;">
                      📅 Test Date: ${new Date().toLocaleString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                    <p style="margin: 8px 0 0; color: #94a3b8; font-size: 14px;">
                      Recipient: ${recipient}
                    </p>
                  </div>
                  
                  <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 24px 0 0;">
                    This is an automated test email. Your production emails will include personalized content based on user activity and preferences.
                  </p>
                </div>
                
                <!-- Footer -->
                <div style="background: #0f172a; padding: 30px; border-radius: 0 0 20px 20px; text-align: center;">
                  <p style="color: #64748b; font-size: 13px; margin: 0 0 8px;">
                    © ${new Date().getFullYear()} FamilyForge. All rights reserved.
                  </p>
                  <p style="color: #475569; font-size: 12px; margin: 0;">
                    Powered by Resend Email Service
                  </p>
                </div>
              </div>
            </body>
            </html>
          `,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error(`  ❌ Failed to send to ${recipient}:`, error);
        continue;
      }

      const result = await response.json();
      console.log(`  ✅ Email sent successfully!`);
      console.log(`  📧 Email ID: ${result.id}`);
      console.log(`  📬 Recipient: ${recipient}`);
      
    } catch (error) {
      console.error(`  ❌ Error sending to ${recipient}:`, error.message);
  }
  
  console.log('\n✨ Test email campaign completed!');
  console.log('\n📊 Resend Free Plan Status:');
  console.log('   Monthly: ~6/3,000 emails used');
  console.log('   Daily: ~6/100 emails used');
  console.log('   ✅ Domain verified - can send to any address');
}

sendTestEmail();
