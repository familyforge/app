// Test sending FamilyForge branded emails via Resend
// Run with: node test-branded-email.js

const RESEND_API_KEY = 're_N7EV6471_5Nx2kTvijYq98MwVtDxCUGWb';

// Brand configuration
const BRAND = {
  primary: '#8b5cf6',      // Purple
  primaryDark: '#4f46e5',  // Deep Indigo
  accent: '#a78bfa',       // Light purple
  dark: '#1e1b4b',         // Deep purple-black
  gradient: 'linear-gradient(135deg, #8b5cf6 0%, #4f46e5 100%)',
};

// Email header component
function emailHeader() {
  return `
    <div style="text-align: center; padding: 40px 20px; background: ${BRAND.gradient};">
      <img src="https://familyforge.app/logo.png" alt="FamilyForge" style="height: 60px; margin-bottom: 16px;" onerror="this.style.display='none'">
      <h1 style="color: white; font-size: 28px; margin: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">FamilyForge</h1>
      <p style="color: rgba(255,255,255,0.9); font-size: 14px; margin: 8px 0 0 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">Rewards & Growth for Kids</p>
    </div>
  `;
}

// Email footer component
function emailFooter() {
  return `
    <div style="text-align: center; padding: 30px 20px; background: #f8f7ff; border-top: 1px solid #e9e3ff;">
      <p style="color: ${BRAND.primaryDark}; font-size: 14px; margin: 0 0 10px 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        Made with 💜 by the FamilyForge Team
      </p>
      <p style="color: #666; font-size: 12px; margin: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <a href="https://familyforge.app" style="color: ${BRAND.primary}; text-decoration: none;">Website</a> · 
        <a href="https://familyforge.app/privacy" style="color: ${BRAND.primary}; text-decoration: none;">Privacy</a> · 
        <a href="https://familyforge.app/unsubscribe" style="color: ${BRAND.primary}; text-decoration: none;">Unsubscribe</a>
      </p>
      <p style="color: #999; font-size: 11px; margin: 15px 0 0 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        © 2024 FamilyForge. All rights reserved.
      </p>
    </div>
  `;
}

// CTA Button component
function ctaButton(text, url) {
  return `
    <a href="${url}" style="display: inline-block; padding: 16px 40px; background: ${BRAND.gradient}; color: white; text-decoration: none; border-radius: 30px; font-weight: 600; font-size: 16px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; box-shadow: 0 4px 15px rgba(139, 92, 246, 0.4);">
      ${text}
    </a>
  `;
}

// Welcome email template
function welcomeEmailHTML(parentName) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f4f0ff; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(139, 92, 246, 0.15);">
        ${emailHeader()}
        
        <div style="padding: 40px 30px;">
          <h2 style="color: ${BRAND.dark}; font-size: 24px; margin: 0 0 20px 0;">Welcome to the Family, ${parentName}! 🎉</h2>
          
          <p style="color: #4a4a6a; font-size: 16px; line-height: 1.7; margin: 0 0 20px 0;">
            We're so excited you've joined us! We know parenting is a beautiful journey filled with 
            challenges, and we're here to make it just a little bit easier—and a lot more fun.
          </p>
          
          <p style="color: #4a4a6a; font-size: 16px; line-height: 1.7; margin: 0 0 25px 0;">
            FamilyForge helps you teach responsibility, celebrate achievements, and build lasting 
            habits with your children through gamified tasks and rewards.
          </p>
          
          <div style="background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%); border-radius: 12px; padding: 25px; margin: 25px 0;">
            <h3 style="color: ${BRAND.primaryDark}; font-size: 18px; margin: 0 0 15px 0;">🚀 Getting Started</h3>
            <ol style="color: #4a4a6a; font-size: 15px; line-height: 2; margin: 0; padding-left: 20px;">
              <li>Add your children to your family</li>
              <li>Create your first task with point rewards</li>
              <li>Set up rewards they can earn</li>
              <li>Watch them grow and learn! 🌱</li>
            </ol>
          </div>
          
          <div style="text-align: center; margin: 35px 0;">
            ${ctaButton('Open FamilyForge', 'https://familyforge.app')}
          </div>
          
          <p style="color: #4a4a6a; font-size: 16px; line-height: 1.7; margin: 25px 0 0 0; text-align: center; font-style: italic;">
            "The greatest gift we can give our children is the roots of responsibility and the wings of independence."
          </p>
        </div>
        
        ${emailFooter()}
      </div>
    </body>
    </html>
  `;
}

// Abandoned payment 1hr email template
function abandonedPayment1hrHTML(parentName) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f4f0ff; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(139, 92, 246, 0.15);">
        ${emailHeader()}
        
        <div style="padding: 40px 30px;">
          <h2 style="color: ${BRAND.dark}; font-size: 24px; margin: 0 0 20px 0;">Still thinking about it, ${parentName}? 🤔</h2>
          
          <p style="color: #4a4a6a; font-size: 16px; line-height: 1.7; margin: 0 0 20px 0;">
            We noticed you were exploring FamilyForge Pro and didn't finish signing up. No pressure at all—we totally get it! 
            Choosing the right tools for your family is an important decision.
          </p>
          
          <p style="color: #4a4a6a; font-size: 16px; line-height: 1.7; margin: 0 0 25px 0;">
            If something stopped you or you have questions, we're here to help! Just reply to this email—a real human 
            (that's us! 👋) will get back to you.
          </p>
          
          <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 12px; padding: 20px; margin: 25px 0; border-left: 4px solid #f59e0b;">
            <p style="color: #92400e; font-size: 15px; margin: 0; font-weight: 500;">
              💡 Your cart is still saved and waiting for you whenever you're ready!
            </p>
          </div>
          
          <div style="text-align: center; margin: 35px 0;">
            ${ctaButton('Complete Your Subscription', 'https://familyforge.app/checkout')}
          </div>
        </div>
        
        ${emailFooter()}
      </div>
    </body>
    </html>
  `;
}

// Free plan weekly email template
function freePlanWeeklyHTML(parentName, childName) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f4f0ff; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(139, 92, 246, 0.15);">
        ${emailHeader()}
        
        <div style="padding: 40px 30px;">
          <h2 style="color: ${BRAND.dark}; font-size: 24px; margin: 0 0 20px 0;">What ${childName || 'your kids'} could be achieving this week 🌟</h2>
          
          <p style="color: #4a4a6a; font-size: 16px; line-height: 1.7; margin: 0 0 20px 0;">
            Hi ${parentName}! We wanted to share some exciting things other FamilyForge Pro families accomplished this week:
          </p>
          
          <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border-radius: 12px; padding: 25px; margin: 25px 0;">
            <h3 style="color: #065f46; font-size: 18px; margin: 0 0 15px 0;">🏆 Pro Families This Week</h3>
            <ul style="color: #047857; font-size: 15px; line-height: 2; margin: 0; padding-left: 20px;">
              <li><strong>847 children</strong> earned unlimited rewards</li>
              <li><strong>2,340 custom tasks</strong> completed with photos</li>
              <li><strong>92%</strong> of kids improved their routines</li>
              <li><strong>1,200+ families</strong> used advanced analytics</li>
            </ul>
          </div>
          
          <p style="color: #4a4a6a; font-size: 16px; line-height: 1.7; margin: 0 0 20px 0;">
            With <strong>FamilyForge Pro</strong>, you get:
          </p>
          
          <ul style="color: #4a4a6a; font-size: 15px; line-height: 2; margin: 0 0 25px 0; padding-left: 20px;">
            <li>📊 Detailed progress analytics & insights</li>
            <li>🎯 Unlimited custom tasks & rewards</li>
            <li>👨‍👩‍👧‍👦 Unlimited family members</li>
            <li>📸 Photo verification for tasks</li>
            <li>🏅 Priority support & new features first</li>
          </ul>
          
          <div style="text-align: center; margin: 35px 0;">
            ${ctaButton('Upgrade to Pro - $4.99/mo', 'https://familyforge.app/upgrade')}
          </div>
          
          <p style="color: #666; font-size: 13px; margin: 20px 0 0 0; text-align: center;">
            Not ready? No worries! You can continue using FamilyForge free forever. 💜
          </p>
        </div>
        
        ${emailFooter()}
      </div>
    </body>
    </html>
  `;
}

async function sendTestEmail(to, template = 'welcome') {
  const parentName = 'Test Parent';
  const childName = 'Emma';
  
  let subject, html;
  
  switch(template) {
    case 'welcome':
      subject = 'Welcome to FamilyForge! 🎉 Your parenting journey just got easier';
      html = welcomeEmailHTML(parentName);
      break;
    case 'abandoned':
      subject = 'Still thinking about FamilyForge Pro? 💭';
      html = abandonedPayment1hrHTML(parentName);
      break;
    case 'free_plan':
      subject = `What ${childName} could be achieving this week 🌟`;
      html = freePlanWeeklyHTML(parentName, childName);
      break;
    default:
      subject = 'Test Email from FamilyForge';
      html = welcomeEmailHTML(parentName);
  }
  
  console.log(`\n📧 Sending "${template}" email to: ${to}`);
  
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'FamilyForge <noreply@familyforge.app>',
      to: [to],
      subject,
      html,
    }),
  });

  const data = await response.json();
  
  if (response.ok) {
    console.log('✅ Email sent successfully!');
    console.log('📬 Email ID:', data.id);
    return data;
  } else {
    console.log('❌ Failed to send email:', data);
    return null;
  }
}

async function main() {
  console.log('🚀 FamilyForge Branded Email Test');
  console.log('==================================');
  console.log('Brand: Purple (#8b5cf6) to Deep Indigo (#4f46e5) gradient');
  console.log('Tagline: "Rewards & Growth for Kids"');
  console.log('From: noreply@familyforge.app');
  console.log('');
  
  // Helper to wait
  const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  
  // Send all three template types to test (with delays to avoid rate limiting)
  await sendTestEmail('profmendel@gmail.com', 'welcome');
  await wait(1500);
  
  await sendTestEmail('hello@familyforge.app', 'welcome');
  await wait(1500);
  
  await sendTestEmail('profmendel@gmail.com', 'abandoned');
  await wait(1500);
  
  await sendTestEmail('profmendel@gmail.com', 'free_plan');
  
  console.log('\n✨ Test complete!');
  console.log('Check your inboxes to verify the branded emails.');
  console.log('\nEmails sent:');
  console.log('  1. Welcome email → profmendel@gmail.com');
  console.log('  2. Welcome email → hello@familyforge.app');
  console.log('  3. Abandoned payment (1hr) → profmendel@gmail.com');
  console.log('  4. Free plan weekly nudge → profmendel@gmail.com');
}

main().catch(console.error);
