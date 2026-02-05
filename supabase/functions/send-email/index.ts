// FamilyForge - Send Email Edge Function
// Premium Email Templates with Stunning Design
// Brand: Purple & Deep Indigo gradient | "Rewards & Growth for Kids"

// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const FROM_EMAIL = 'FamilyForge <hello@familyforge.app>';

// Brand Colors - Premium palette
const BRAND = {
  primary: '#8b5cf6',
  primaryDark: '#7c3aed',
  secondary: '#4f46e5',
  accent: '#a78bfa',
  gold: '#fbbf24',
  success: '#10b981',
  dark: '#0f0a1f',
  cardBg: '#1a1430',
  text: '#f1f5f9',
  muted: '#94a3b8',
  subtle: '#64748b',
};

const LOGO_URL = 'https://xyntgrgbacvnrdggtpkl.supabase.co/storage/v1/object/public/public-assets/logo.png';

// Premium email header with centered logo and elegant design
const emailHeader = (title: string, subtitle: string = '') => `
  <div style="background: linear-gradient(135deg, ${BRAND.primary} 0%, ${BRAND.secondary} 50%, #312e81 100%); padding: 3px; border-radius: 24px 24px 0 0;">
    <div style="background: linear-gradient(180deg, #1a1033 0%, ${BRAND.dark} 100%); border-radius: 22px 22px 0 0; padding: 48px 32px 40px; text-align: center;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td align="center">
            <div style="background: linear-gradient(145deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%); border: 1px solid rgba(255,255,255,0.1); width: 88px; height: 88px; border-radius: 20px; box-shadow: 0 20px 40px rgba(0,0,0,0.3), 0 0 60px rgba(139, 92, 246, 0.2);">
              <img src="${LOGO_URL}" alt="FamilyForge" width="88" height="88" style="display: block; border-radius: 20px;" />
            </div>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding-top: 20px;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">FamilyForge</h1>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding-top: 8px;">
            <p style="color: ${BRAND.accent}; margin: 0; font-size: 12px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase;">Rewards & Growth for Kids</p>
          </td>
        </tr>
        ${title ? `
        <tr>
          <td align="center" style="padding-top: 32px;">
            <div style="border-top: 1px solid rgba(139, 92, 246, 0.2); padding-top: 24px;">
              <h2 style="color: white; margin: 0; font-size: 24px; font-weight: 700; line-height: 1.3;">${title}</h2>
              ${subtitle ? `<p style="color: ${BRAND.muted}; margin: 8px 0 0; font-size: 15px;">${subtitle}</p>` : ''}
            </div>
          </td>
        </tr>
        ` : ''}
      </table>
    </div>
  </div>
`;

// Premium email footer
const emailFooter = () => `
  <div style="background: linear-gradient(135deg, ${BRAND.primary} 0%, ${BRAND.secondary} 50%, #312e81 100%); padding: 0 3px 3px 3px;">
    <div style="background: ${BRAND.dark}; border-radius: 0 0 22px 22px; padding: 40px 32px; text-align: center;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td align="center">
            <div style="width: 8px; height: 8px; background: ${BRAND.primary}; border-radius: 50%; margin: 0 auto 24px;"></div>
          </td>
        </tr>
        <tr>
          <td align="center">
            <p style="color: ${BRAND.subtle}; font-size: 14px; margin: 0 0 20px; line-height: 1.6;">
              Empowering families to raise confident, responsible children.
            </p>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding: 16px 0;">
            <a href="https://familyforge.app" style="color: ${BRAND.text}; text-decoration: none; font-size: 13px; font-weight: 500; padding: 8px 16px; margin: 4px; background: rgba(139, 92, 246, 0.1); border-radius: 20px; border: 1px solid rgba(139, 92, 246, 0.2); display: inline-block;">Website</a>
            <a href="https://familyforge.app/support" style="color: ${BRAND.text}; text-decoration: none; font-size: 13px; font-weight: 500; padding: 8px 16px; margin: 4px; background: rgba(139, 92, 246, 0.1); border-radius: 20px; border: 1px solid rgba(139, 92, 246, 0.2); display: inline-block;">Support</a>
            <a href="https://familyforge.app/unsubscribe" style="color: ${BRAND.subtle}; text-decoration: none; font-size: 13px; font-weight: 500; padding: 8px 16px; margin: 4px; display: inline-block;">Unsubscribe</a>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding-top: 20px;">
            <p style="color: #475569; font-size: 11px; margin: 0; letter-spacing: 0.5px;">
              © ${new Date().getFullYear()} FamilyForge Inc. All rights reserved.
            </p>
          </td>
        </tr>
      </table>
    </div>
  </div>
`;

// Premium CTA Button
const ctaButton = (text: string, url: string, variant: string = 'primary') => {
  const styles: Record<string, string> = {
    primary: `background: linear-gradient(135deg, ${BRAND.primary} 0%, ${BRAND.secondary} 100%); color: white; box-shadow: 0 8px 24px rgba(139, 92, 246, 0.4);`,
    secondary: `background: transparent; color: ${BRAND.accent}; border: 2px solid ${BRAND.accent};`,
    gold: `background: linear-gradient(135deg, ${BRAND.gold} 0%, #f59e0b 100%); color: #1e1b4b; box-shadow: 0 8px 24px rgba(251, 191, 36, 0.4);`
  };
  return `<a href="${url}" style="display: inline-block; ${styles[variant] || styles.primary} padding: 18px 40px; border-radius: 16px; text-decoration: none; font-weight: 700; font-size: 16px; letter-spacing: 0.3px;">${text}</a>`;
};

// Stat card component
const statCard = (value: string, label: string, color: string = BRAND.primary) => `
  <td width="33%" style="padding: 8px;">
    <div style="background: linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%); border: 1px solid rgba(255,255,255,0.08); padding: 20px 12px; border-radius: 16px; text-align: center;">
      <p style="color: ${color}; font-size: 28px; font-weight: 800; margin: 0; letter-spacing: -1px;">${value}</p>
      <p style="color: ${BRAND.muted}; font-size: 11px; margin: 8px 0 0; text-transform: uppercase; letter-spacing: 0.5px;">${label}</p>
    </div>
  </td>
`;

// Testimonial component
const testimonialCard = (quote: string, author: string, detail: string) => `
  <div style="background: linear-gradient(145deg, rgba(139, 92, 246, 0.12) 0%, rgba(139, 92, 246, 0.04) 100%); border: 1px solid rgba(139, 92, 246, 0.2); border-radius: 20px; padding: 28px; margin: 28px 0;">
    <p style="color: ${BRAND.text}; font-size: 15px; line-height: 1.7; margin: 0 0 16px; font-style: italic;">
      "${quote}"
    </p>
    <table cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="vertical-align: middle;">
          <div style="width: 40px; height: 40px; background: linear-gradient(135deg, ${BRAND.primary}, ${BRAND.secondary}); border-radius: 50%; text-align: center; line-height: 40px;">
            <span style="color: white; font-weight: 700; font-size: 14px;">${author.charAt(0)}</span>
          </div>
        </td>
        <td style="padding-left: 12px; vertical-align: middle;">
          <p style="color: white; margin: 0; font-size: 14px; font-weight: 600;">${author}</p>
          <p style="color: ${BRAND.subtle}; margin: 2px 0 0; font-size: 12px;">${detail}</p>
        </td>
      </tr>
    </table>
  </div>
`;

interface EmailRequest {
  template: string;
  recipients: { email: string; name: string }[];
  data: Record<string, unknown>;
  attachPdf?: boolean;
}

const emailTemplates: Record<string, (data: Record<string, unknown>) => { subject: string; html: string }> = {
  
  // ============================================
  // WELCOME EMAIL - Premium Design
  // ============================================
  welcome: (data) => ({
    subject: `Welcome to FamilyForge, ${data.parentName} — Let's transform your family's daily routine`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #080510; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          
          ${emailHeader('Welcome to the Family!', 'Your parenting journey just leveled up')}
          
          <div style="background: linear-gradient(135deg, ${BRAND.primary} 0%, ${BRAND.secondary} 50%, #312e81 100%); padding: 0 3px;">
            <div style="background: ${BRAND.dark}; padding: 40px 32px;">
              
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td width="48" style="vertical-align: top;">
                    <div style="width: 48px; height: 48px; background: linear-gradient(135deg, ${BRAND.primary}, ${BRAND.secondary}); border-radius: 50%; text-align: center; line-height: 48px;">
                      <span style="color: white; font-weight: 700; font-size: 18px;">${String(data.parentName).charAt(0).toUpperCase()}</span>
                    </div>
                  </td>
                  <td style="padding-left: 16px; vertical-align: top;">
                    <p style="color: white; font-size: 20px; font-weight: 600; margin: 0 0 4px;">Hi ${data.parentName}!</p>
                    <p style="color: ${BRAND.muted}; font-size: 14px; margin: 0;">Welcome to your new parenting superpower</p>
                  </td>
                </tr>
              </table>
              
              <p style="color: ${BRAND.text}; line-height: 1.8; margin: 28px 0 24px; font-size: 15px;">
                We're absolutely thrilled you've joined the FamilyForge family. As parents ourselves, we understand the daily juggle of raising confident, responsible children while maintaining your sanity.
              </p>
              
              <p style="color: ${BRAND.text}; line-height: 1.8; margin: 0 0 32px; font-size: 15px;">
                <strong style="color: white;">You're not just downloading an app</strong> — you're joining thousands of families who've discovered that small daily wins lead to extraordinary transformations.
              </p>
              
              <p style="color: white; font-size: 16px; font-weight: 700; margin: 0 0 16px;">Get started in 3 simple steps:</p>
              
              <div style="background: linear-gradient(145deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.02) 100%); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 16px; padding: 20px; margin-bottom: 12px;">
                <table cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td width="44" style="vertical-align: top;">
                      <div style="width: 44px; height: 44px; background: rgba(16, 185, 129, 0.15); border-radius: 12px; text-align: center; line-height: 44px;">
                        <span style="color: #10b981; font-weight: 700; font-size: 18px;">1</span>
                      </div>
                    </td>
                    <td style="padding-left: 16px; vertical-align: top;">
                      <p style="color: white; margin: 0 0 4px; font-weight: 600;">Add your children</p>
                      <p style="color: ${BRAND.muted}; margin: 0; font-size: 13px;">Create profiles for each child with their age and interests</p>
                    </td>
                  </tr>
                </table>
              </div>
              
              <div style="background: linear-gradient(145deg, rgba(139, 92, 246, 0.1) 0%, rgba(139, 92, 246, 0.02) 100%); border: 1px solid rgba(139, 92, 246, 0.2); border-radius: 16px; padding: 20px; margin-bottom: 12px;">
                <table cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td width="44" style="vertical-align: top;">
                      <div style="width: 44px; height: 44px; background: rgba(139, 92, 246, 0.15); border-radius: 12px; text-align: center; line-height: 44px;">
                        <span style="color: ${BRAND.primary}; font-weight: 700; font-size: 18px;">2</span>
                      </div>
                    </td>
                    <td style="padding-left: 16px; vertical-align: top;">
                      <p style="color: white; margin: 0 0 4px; font-weight: 600;">Create your first task</p>
                      <p style="color: ${BRAND.muted}; margin: 0; font-size: 13px;">Start simple — even "Make your bed" counts as a win</p>
                    </td>
                  </tr>
                </table>
              </div>
              
              <div style="background: linear-gradient(145deg, rgba(251, 191, 36, 0.1) 0%, rgba(251, 191, 36, 0.02) 100%); border: 1px solid rgba(251, 191, 36, 0.2); border-radius: 16px; padding: 20px; margin-bottom: 32px;">
                <table cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td width="44" style="vertical-align: top;">
                      <div style="width: 44px; height: 44px; background: rgba(251, 191, 36, 0.15); border-radius: 12px; text-align: center; line-height: 44px;">
                        <span style="color: ${BRAND.gold}; font-weight: 700; font-size: 18px;">3</span>
                      </div>
                    </td>
                    <td style="padding-left: 16px; vertical-align: top;">
                      <p style="color: white; margin: 0 0 4px; font-weight: 600;">Set up rewards</p>
                      <p style="color: ${BRAND.muted}; margin: 0; font-size: 13px;">What motivates YOUR kids? Screen time? Treats? Choose what works</p>
                    </td>
                  </tr>
                </table>
              </div>
              
              <div style="background: linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(79, 70, 229, 0.1) 100%); border-left: 4px solid ${BRAND.primary}; padding: 20px 24px; border-radius: 0 16px 16px 0; margin: 32px 0;">
                <p style="color: ${BRAND.accent}; font-size: 15px; font-style: italic; margin: 0; line-height: 1.6;">
                  "Every great journey begins with a single step. Your children's transformation starts today."
                </p>
              </div>
              
              <div style="text-align: center; margin: 40px 0 32px;">
                ${ctaButton("Launch FamilyForge", 'https://familyforge.app', 'primary')}
              </div>
              
              <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 16px 20px; text-align: center;">
                <p style="color: ${BRAND.muted}; font-size: 13px; margin: 0; line-height: 1.6;">
                  Questions? Just reply to this email — a real human will respond within 24 hours.
                </p>
              </div>
              
              <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.06);">
                <p style="color: ${BRAND.text}; margin: 0 0 4px; font-size: 15px;">With warmth and excitement,</p>
                <p style="color: white; margin: 0; font-weight: 700; font-size: 15px;">The FamilyForge Team</p>
              </div>
              
            </div>
          </div>
          
          ${emailFooter()}
        </div>
      </body>
      </html>
    `,
  }),

  // ============================================
  // ABANDONED PAYMENT - 1 HOUR
  // ============================================
  abandoned_payment_1hr: (data) => ({
    subject: `${data.parentName}, your family's transformation is waiting...`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #080510; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          
          ${emailHeader("We Noticed You Didn't Finish...", "Your checkout is still waiting")}
          
          <div style="background: linear-gradient(135deg, ${BRAND.primary} 0%, ${BRAND.secondary} 50%, #312e81 100%); padding: 0 3px;">
            <div style="background: ${BRAND.dark}; padding: 40px 32px;">
              
              <p style="color: ${BRAND.text}; font-size: 16px; line-height: 1.7; margin: 0 0 20px;">
                Hi <strong style="color: white;">${data.parentName}</strong>,
              </p>
              
              <p style="color: ${BRAND.text}; line-height: 1.8; margin: 0 0 24px; font-size: 15px;">
                We noticed you were exploring <strong style="color: ${BRAND.accent};">${data.planName}</strong> but didn't complete your subscription. Life gets busy — we totally get it.
              </p>
              
              <p style="color: ${BRAND.text}; line-height: 1.8; margin: 0 0 28px; font-size: 15px;">
                But here's something to consider: <strong style="color: white;">every day that passes is a day your children could be building better habits, earning rewards, and growing into their best selves.</strong>
              </p>
              
              <div style="background: linear-gradient(135deg, rgba(251, 191, 36, 0.15) 0%, rgba(245, 158, 11, 0.1) 100%); border: 2px solid rgba(251, 191, 36, 0.3); padding: 24px; border-radius: 16px; margin: 32px 0; text-align: center;">
                <p style="color: ${BRAND.gold}; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px; font-weight: 600;">Still Available</p>
                <p style="color: white; font-size: 22px; font-weight: 700; margin: 0;">${data.specialOffer || 'Your spot is saved!'}</p>
              </div>
              
              <p style="color: white; font-size: 15px; font-weight: 600; margin: 0 0 16px;">Is something holding you back?</p>
              
              <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 16px 20px; margin-bottom: 12px;">
                <p style="color: white; margin: 0 0 4px; font-weight: 600; font-size: 14px;">Unsure if it's right for your family?</p>
                <p style="color: ${BRAND.muted}; margin: 0; font-size: 13px;">Try it completely risk-free with our money-back guarantee</p>
              </div>
              
              <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 16px 20px; margin-bottom: 12px;">
                <p style="color: white; margin: 0 0 4px; font-weight: 600; font-size: 14px;">Need more time to decide?</p>
                <p style="color: ${BRAND.muted}; margin: 0; font-size: 13px;">Start with our free plan — no pressure, upgrade anytime</p>
              </div>
              
              <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 16px 20px; margin-bottom: 32px;">
                <p style="color: white; margin: 0 0 4px; font-weight: 600; font-size: 14px;">Technical issue?</p>
                <p style="color: ${BRAND.muted}; margin: 0; font-size: 13px;">Reply to this email and we'll help you right away</p>
              </div>
              
              <div style="text-align: center; margin: 40px 0 24px;">
                ${ctaButton('Complete My Subscription', `https://familyforge.app/checkout?session=${data.sessionId}`, 'gold')}
              </div>
              
              <p style="color: ${BRAND.subtle}; font-size: 13px; text-align: center; margin: 0;">
                Or <a href="https://familyforge.app/pricing?plan=free" style="color: ${BRAND.accent}; text-decoration: underline;">start with our free plan</a> and upgrade anytime
              </p>
              
            </div>
          </div>
          
          ${emailFooter()}
        </div>
      </body>
      </html>
    `,
  }),

  // ============================================
  // ABANDONED PAYMENT - 24 HOURS
  // ============================================
  abandoned_payment_24hr: (data) => ({
    subject: `${data.parentName}, we saved your spot (but not for long)`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #080510; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          
          ${emailHeader("Your Family's Growth Matters", "It's been 24 hours...")}
          
          <div style="background: linear-gradient(135deg, ${BRAND.primary} 0%, ${BRAND.secondary} 50%, #312e81 100%); padding: 0 3px;">
            <div style="background: ${BRAND.dark}; padding: 40px 32px;">
              
              <p style="color: ${BRAND.text}; font-size: 16px; line-height: 1.7; margin: 0 0 24px;">
                Hi <strong style="color: white;">${data.parentName}</strong>,
              </p>
              
              <p style="color: ${BRAND.text}; line-height: 1.8; margin: 0 0 28px; font-size: 15px;">
                It's been 24 hours since you started signing up for FamilyForge. We've been thinking about you and wanted to share something special...
              </p>
              
              ${testimonialCard(
                "I was skeptical at first, but within a week my kids were actually ASKING to do their chores. The points system made everything click. I wish I'd started sooner.",
                "Sarah M.",
                "Mom of 3"
              )}
              
              <p style="color: white; font-size: 16px; font-weight: 600; margin: 32px 0 20px;">Here's what families experience in their first week:</p>
              
              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 28px;">
                <tr>
                  ${statCard('73%', 'More tasks done', BRAND.success)}
                  ${statCard('89%', 'Less nagging', BRAND.primary)}
                  ${statCard('4.9', 'Parent rating', BRAND.gold)}
                </tr>
              </table>
              
              <p style="color: ${BRAND.text}; line-height: 1.8; margin: 28px 0; font-size: 15px;">
                You took the first step yesterday. The hardest part is already done. <strong style="color: white;">Don't let this moment slip away.</strong>
              </p>
              
              <div style="text-align: center; margin: 40px 0 24px;">
                ${ctaButton('Yes, I Want This For My Family', `https://familyforge.app/checkout?session=${data.sessionId}`, 'primary')}
              </div>
              
              <p style="color: ${BRAND.subtle}; font-size: 13px; text-align: center; margin: 0;">
                Not ready to commit? <a href="https://familyforge.app/pricing?plan=free" style="color: ${BRAND.accent}; text-decoration: underline;">Start free instead</a>
              </p>
              
            </div>
          </div>
          
          ${emailFooter()}
        </div>
      </body>
      </html>
    `,
  }),

  // ============================================
  // ABANDONED PAYMENT - FOLLOWUP (Day 3/5/7)
  // ============================================
  abandoned_payment_followup: (data) => ({
    subject: `${data.dayNumber === 7 ? 'Final notice:' : ''} ${data.parentName}, is FamilyForge right for your family?`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #080510; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          
          ${emailHeader(data.dayNumber === 7 ? "Last Chance to Transform Your Family's Routine" : "We're Still Here for You", '')}
          
          <div style="background: linear-gradient(135deg, ${BRAND.primary} 0%, ${BRAND.secondary} 50%, #312e81 100%); padding: 0 3px;">
            <div style="background: ${BRAND.dark}; padding: 40px 32px;">
              
              <p style="color: ${BRAND.text}; font-size: 16px; line-height: 1.7; margin: 0 0 24px;">
                Hi <strong style="color: white;">${data.parentName}</strong>,
              </p>
              
              <p style="color: ${BRAND.text}; line-height: 1.8; margin: 0 0 24px; font-size: 15px;">
                We know you're busy — being a parent is a full-time job (actually, multiple jobs). We just wanted to check in one more time.
              </p>
              
              ${data.dayNumber === 7 ? `
              <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); padding: 20px; border-radius: 12px; margin: 28px 0; text-align: center;">
                <p style="color: #f87171; font-weight: 600; margin: 0;">Your saved checkout will expire in 24 hours</p>
              </div>
              ` : ''}
              
              <p style="color: white; font-size: 15px; font-weight: 600; margin: 28px 0 16px;">The difference FamilyForge makes:</p>
              
              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 28px;">
                <tr>
                  <td width="50%" style="padding: 8px; vertical-align: top;">
                    <p style="color: ${BRAND.muted}; margin: 0 0 12px; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Without FamilyForge</p>
                    <p style="color: #f87171; margin: 0 0 8px; font-size: 14px;">- Constant reminders</p>
                    <p style="color: #f87171; margin: 0 0 8px; font-size: 14px;">- Chore battles</p>
                    <p style="color: #f87171; margin: 0; font-size: 14px;">- No sense of progress</p>
                  </td>
                  <td width="50%" style="padding: 8px; vertical-align: top;">
                    <p style="color: ${BRAND.muted}; margin: 0 0 12px; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">With FamilyForge</p>
                    <p style="color: #4ade80; margin: 0 0 8px; font-size: 14px;">+ Kids self-motivated</p>
                    <p style="color: #4ade80; margin: 0 0 8px; font-size: 14px;">+ Excited about tasks</p>
                    <p style="color: #4ade80; margin: 0; font-size: 14px;">+ Visible growth & rewards</p>
                  </td>
                </tr>
              </table>
              
              <div style="text-align: center; margin: 40px 0 24px;">
                ${ctaButton(data.dayNumber === 7 ? "Claim My Spot Now" : "Complete My Subscription", `https://familyforge.app/checkout?session=${data.sessionId}`, 'primary')}
              </div>
              
              <p style="color: ${BRAND.subtle}; font-size: 13px; text-align: center;">
                <a href="https://familyforge.app/pricing?plan=free" style="color: ${BRAND.accent};">Or start with our free plan</a>
              </p>
              
              ${data.dayNumber === 7 ? `
              <p style="color: ${BRAND.muted}; font-size: 14px; text-align: center; margin: 24px 0 0;">
                This will be our last email. We respect your inbox and your decision.
              </p>
              ` : ''}
              
            </div>
          </div>
          
          ${emailFooter()}
        </div>
      </body>
      </html>
    `,
  }),

  // ============================================
  // FREE PLAN WEEKLY NUDGE
  // ============================================
  free_plan_weekly: (data) => ({
    subject: `${data.parentName}, see what ${data.childName || 'your kids'} could unlock this week`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #080510; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          
          ${emailHeader("Here's What You're Missing...", 'Unlock the full potential')}
          
          <div style="background: linear-gradient(135deg, ${BRAND.primary} 0%, ${BRAND.secondary} 50%, #312e81 100%); padding: 0 3px;">
            <div style="background: ${BRAND.dark}; padding: 40px 32px;">
              
              <p style="color: ${BRAND.text}; font-size: 16px; line-height: 1.7; margin: 0 0 20px;">
                Hi <strong style="color: white;">${data.parentName}</strong>,
              </p>
              
              <p style="color: ${BRAND.text}; line-height: 1.8; margin: 0 0 24px; font-size: 15px;">
                You've been using FamilyForge Free for a while now, and we hope it's been helpful! But we wanted to share what <strong style="color: white;">families on our Pro plan</strong> are experiencing...
              </p>
              
              <div style="background: rgba(139, 92, 246, 0.1); border-radius: 16px; padding: 24px; margin: 28px 0;">
                <p style="color: white; font-weight: 600; margin: 0 0 16px;">Pro Features You're Missing:</p>
                
                <div style="margin-bottom: 16px;">
                  <p style="color: ${BRAND.accent}; margin: 0 0 4px; font-weight: 600; font-size: 14px;">Leaderboards</p>
                  <p style="color: ${BRAND.muted}; margin: 0; font-size: 13px;">${data.childName || 'Your kids'} could compete with children worldwide</p>
                </div>
                
                <div style="margin-bottom: 16px;">
                  <p style="color: ${BRAND.accent}; margin: 0 0 4px; font-weight: 600; font-size: 14px;">Advanced Reports</p>
                  <p style="color: ${BRAND.muted}; margin: 0; font-size: 13px;">See exactly where your children are thriving</p>
                </div>
                
                <div style="margin-bottom: 16px;">
                  <p style="color: ${BRAND.accent}; margin: 0 0 4px; font-weight: 600; font-size: 14px;">Custom Goals</p>
                  <p style="color: ${BRAND.muted}; margin: 0; font-size: 13px;">Set personalized milestones for YOUR family</p>
                </div>
                
                <div>
                  <p style="color: ${BRAND.accent}; margin: 0 0 4px; font-weight: 600; font-size: 14px;">Unlimited Children + Co-Parent Access</p>
                  <p style="color: ${BRAND.muted}; margin: 0; font-size: 13px;">Add everyone without restrictions</p>
                </div>
              </div>
              
              <div style="background: linear-gradient(135deg, rgba(251, 191, 36, 0.15) 0%, rgba(245, 158, 11, 0.1) 100%); border: 1px solid rgba(251, 191, 36, 0.3); padding: 20px; border-radius: 12px; margin: 28px 0; text-align: center;">
                <p style="color: ${BRAND.gold}; font-size: 14px; margin: 0 0 8px;">This week only</p>
                <p style="color: white; font-size: 20px; font-weight: 700; margin: 0;">Upgrade to Pro for just $${data.proPrice || '6.99'}/mo</p>
              </div>
              
              <p style="color: ${BRAND.text}; line-height: 1.8; margin: 0 0 28px; font-size: 15px;">
                You've already taken the first step. <strong style="color: ${BRAND.accent};">Don't let ${data.childName || 'your kids'} miss out on their full potential.</strong>
              </p>
              
              <div style="text-align: center; margin: 40px 0 24px;">
                ${ctaButton('Unlock Pro Features', 'https://familyforge.app/upgrade', 'gold')}
              </div>
              
              <p style="color: ${BRAND.muted}; font-size: 14px; text-align: center;">
                Questions? Just reply to this email — we're real humans who care.
              </p>
              
            </div>
          </div>
          
          ${emailFooter()}
        </div>
      </body>
      </html>
    `,
  }),

  // ============================================
  // TASK REMINDER
  // ============================================
  task_reminder: (data) => ({
    subject: `Reminder: "${data.taskTitle}" is waiting for ${data.assignedTo}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #080510; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          
          ${emailHeader('Task Reminder', '')}
          
          <div style="background: linear-gradient(135deg, ${BRAND.primary} 0%, ${BRAND.secondary} 50%, #312e81 100%); padding: 0 3px;">
            <div style="background: ${BRAND.dark}; padding: 40px 32px;">
              
              <p style="color: ${BRAND.text}; font-size: 16px; margin: 0 0 24px;">
                Just a friendly reminder that <strong style="color: white;">${data.assignedTo}</strong> has a task waiting!
              </p>
              
              <div style="background: linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 24px; margin: 24px 0;">
                <h3 style="color: white; margin: 0 0 12px; font-size: 20px;">${data.taskTitle}</h3>
                ${data.taskDescription ? `<p style="color: ${BRAND.muted}; margin: 0 0 16px;">${data.taskDescription}</p>` : ''}
                
                <table cellpadding="0" cellspacing="0" border="0">
                  ${data.dueDate ? `
                  <tr>
                    <td style="padding-right: 24px;">
                      <p style="color: ${BRAND.muted}; font-size: 12px; margin: 0;">Due</p>
                      <p style="color: ${BRAND.gold}; font-weight: 600; margin: 4px 0 0;">${data.dueDate}</p>
                    </td>
                  </tr>
                  ` : ''}
                  <tr>
                    <td>
                      <p style="color: ${BRAND.muted}; font-size: 12px; margin: 16px 0 0;">Reward</p>
                      <p style="color: #4ade80; font-weight: 600; margin: 4px 0 0;">+${data.pointsValue} points</p>
                    </td>
                  </tr>
                </table>
              </div>
              
              <p style="color: ${BRAND.text}; line-height: 1.7; margin: 24px 0; font-size: 15px;">
                A little encouragement goes a long way! Maybe check in with ${data.assignedTo} and see if they need any help?
              </p>
              
              <div style="text-align: center; margin: 32px 0;">
                ${ctaButton('View Task in App', 'https://familyforge.app', 'primary')}
              </div>
              
            </div>
          </div>
          
          ${emailFooter()}
        </div>
      </body>
      </html>
    `,
  }),

  // ============================================
  // ACHIEVEMENT ALERT
  // ============================================
  achievement_alert: (data) => ({
    subject: `${data.childName} just achieved something amazing!`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #080510; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          
          ${emailHeader('Achievement Unlocked!', '')}
          
          <div style="background: linear-gradient(135deg, ${BRAND.primary} 0%, ${BRAND.secondary} 50%, #312e81 100%); padding: 0 3px;">
            <div style="background: ${BRAND.dark}; padding: 40px 32px; text-align: center;">
              
              <div style="width: 80px; height: 80px; background: linear-gradient(135deg, ${BRAND.gold}, #f59e0b); border-radius: 50%; margin: 0 auto 24px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 40px;">&#127942;</span>
              </div>
              
              <h2 style="color: white; margin: 0 0 8px; font-size: 28px;">${data.childName}</h2>
              <p style="color: ${BRAND.accent}; font-size: 20px; font-weight: 600; margin: 0 0 16px;">${data.achievementTitle}</p>
              
              <p style="color: ${BRAND.muted}; line-height: 1.7; margin: 0 0 24px;">
                ${data.achievementDetails}
              </p>
              
              ${data.pointsEarned ? `
              <div style="background: rgba(74, 222, 128, 0.1); border: 1px solid rgba(74, 222, 128, 0.3); padding: 20px 32px; border-radius: 16px; display: inline-block; margin: 20px 0;">
                <span style="color: #4ade80; font-size: 32px; font-weight: 700;">+${data.pointsEarned}</span>
                <span style="color: #4ade80; font-size: 16px;"> points earned!</span>
              </div>
              ` : ''}
              
              ${data.rank ? `
              <div style="background: linear-gradient(135deg, ${BRAND.gold} 0%, #f59e0b 100%); padding: 20px; border-radius: 16px; margin: 20px 0;">
                <p style="color: #1e293b; margin: 0; font-weight: 700; font-size: 18px;">
                  Ranked #${data.rank} ${data.rankScope === 'worldwide' ? 'Worldwide!' : 'in ' + data.rankScope + '!'}
                </p>
              </div>
              ` : ''}
              
              <p style="color: ${BRAND.muted}; line-height: 1.7; margin: 28px 0 0; font-style: italic;">
                "Every small win builds confidence for the bigger challenges ahead."
              </p>
              
              <p style="color: white; margin: 20px 0 0;">
                <strong>Take a moment to celebrate with ${data.childName} — they've earned it!</strong>
              </p>
              
              <div style="margin: 32px 0;">
                ${ctaButton('Celebrate Together', 'https://familyforge.app', 'gold')}
              </div>
              
            </div>
          </div>
          
          ${emailFooter()}
        </div>
      </body>
      </html>
    `,
  }),

  // ============================================
  // WEEKLY REPORT
  // ============================================
  weekly_report: (data) => ({
    subject: `${data.parentName}'s Family Report - ${data.weekEndDate}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #080510; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          
          ${emailHeader('Your Weekly Family Report', `${data.weekStartDate} - ${data.weekEndDate}`)}
          
          <div style="background: linear-gradient(135deg, ${BRAND.primary} 0%, ${BRAND.secondary} 50%, #312e81 100%); padding: 0 3px;">
            <div style="background: ${BRAND.dark}; padding: 40px 32px;">
              
              <p style="color: ${BRAND.text}; font-size: 16px; margin: 0 0 24px; line-height: 1.7;">
                Hi <strong style="color: white;">${data.parentName}</strong>! Here's how your amazing family did this week. Take pride in every step forward — growth isn't always linear, but consistency is key!
              </p>
              
              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 24px 0;">
                <tr>
                  <td width="50%" style="padding: 8px;">
                    <div style="background: rgba(139, 92, 246, 0.15); padding: 24px; border-radius: 16px; text-align: center;">
                      <p style="color: ${BRAND.accent}; font-size: 36px; font-weight: 700; margin: 0;">${data.familyStats?.totalTasksCompleted || 0}</p>
                      <p style="color: ${BRAND.muted}; font-size: 13px; margin: 8px 0 0;">Tasks Completed</p>
                    </div>
                  </td>
                  <td width="50%" style="padding: 8px;">
                    <div style="background: rgba(74, 222, 128, 0.15); padding: 24px; border-radius: 16px; text-align: center;">
                      <p style="color: #4ade80; font-size: 36px; font-weight: 700; margin: 0;">${data.familyStats?.totalPointsEarned || 0}</p>
                      <p style="color: ${BRAND.muted}; font-size: 13px; margin: 8px 0 0;">Points Earned</p>
                    </div>
                  </td>
                </tr>
              </table>
              
              ${data.familyStats?.topPerformer ? `
              <div style="background: linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(245, 158, 11, 0.1) 100%); border: 1px solid rgba(251, 191, 36, 0.3); padding: 20px; border-radius: 16px; margin: 24px 0; text-align: center;">
                <p style="color: ${BRAND.gold}; font-size: 14px; margin: 0 0 4px;">Star of the Week</p>
                <p style="color: white; font-size: 20px; font-weight: 700; margin: 0;">${data.familyStats.topPerformer}</p>
              </div>
              ` : ''}
              
              <p style="color: ${BRAND.text}; line-height: 1.7; margin: 24px 0;">
                <strong style="color: white;">Tip for this week:</strong> ${data.weeklyTip || 'Try adding a fun family reward — something you can all enjoy together when goals are met!'}
              </p>
              
              <div style="background: rgba(255,255,255,0.03); padding: 16px 20px; border-radius: 12px; margin: 24px 0;">
                <p style="color: ${BRAND.muted}; margin: 0; font-size: 14px;">Your detailed PDF report is attached to this email</p>
              </div>
              
              <div style="text-align: center; margin: 32px 0;">
                ${ctaButton('See Full Details', 'https://familyforge.app/progress', 'primary')}
              </div>
              
              <p style="color: ${BRAND.muted}; font-size: 14px; text-align: center; font-style: italic;">
                "The goal isn't perfection — it's progress. And your family is making it!"
              </p>
              
            </div>
          </div>
          
          ${emailFooter()}
        </div>
      </body>
      </html>
    `,
  }),

  // ============================================
  // FAMILY INVITE
  // ============================================
  family_invite: (data) => ({
    subject: `${data.inviterName} wants you to join their FamilyForge family!`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #080510; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          
          ${emailHeader("You're Invited!", '')}
          
          <div style="background: linear-gradient(135deg, ${BRAND.primary} 0%, ${BRAND.secondary} 50%, #312e81 100%); padding: 0 3px;">
            <div style="background: ${BRAND.dark}; padding: 40px 32px; text-align: center;">
              
              <p style="font-size: 18px; margin: 0 0 8px; color: ${BRAND.muted};">
                <strong style="color: white;">${data.inviterName}</strong> has invited you to join
              </p>
              <h2 style="color: ${BRAND.accent}; margin: 0 0 24px; font-size: 26px;">${data.familyName}</h2>
              
              <p style="color: ${BRAND.text}; line-height: 1.7; margin: 0 0 24px; text-align: left;">
                They're using FamilyForge to help their children build great habits, earn rewards, and grow into their best selves. And they want <strong style="color: white;">you</strong> to be part of the journey!
              </p>
              
              <div style="background: rgba(139, 92, 246, 0.15); padding: 24px; border-radius: 16px; margin: 24px 0;">
                <p style="color: ${BRAND.muted}; margin: 0 0 8px; font-size: 13px;">Your role</p>
                <p style="color: white; font-weight: 600; font-size: 18px; margin: 0;">${data.inviteRole}</p>
              </div>
              
              <div style="background: linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%); border: 1px solid rgba(255,255,255,0.1); padding: 24px; border-radius: 16px; margin: 24px 0;">
                <p style="color: ${BRAND.muted}; margin: 0 0 8px; font-size: 13px;">Your invite code</p>
                <p style="color: white; font-size: 36px; font-weight: 700; letter-spacing: 6px; margin: 0;">${data.inviteCode}</p>
              </div>
              
              <p style="color: ${BRAND.muted}; font-size: 14px; margin: 0 0 28px;">
                This invitation expires on ${data.expiresAt}
              </p>
              
              <div style="margin: 32px 0;">
                ${ctaButton('Accept Invitation', `https://familyforge.app/join?code=${data.inviteCode}`, 'primary')}
              </div>
              
              <p style="color: ${BRAND.muted}; font-size: 14px; line-height: 1.6;">
                Together, you'll make parenting a little easier and childhood a lot more rewarding.
              </p>
              
            </div>
          </div>
          
          ${emailFooter()}
        </div>
      </body>
      </html>
    `,
  }),

  // ============================================
  // DATA EXPORT READY
  // ============================================
  data_export_ready: (data) => ({
    subject: `Your FamilyForge data is ready to download`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #080510; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          
          ${emailHeader('Your Data Export is Ready', '')}
          
          <div style="background: linear-gradient(135deg, ${BRAND.primary} 0%, ${BRAND.secondary} 50%, #312e81 100%); padding: 0 3px;">
            <div style="background: ${BRAND.dark}; padding: 40px 32px;">
              
              <p style="color: ${BRAND.text}; font-size: 16px; margin: 0 0 24px; line-height: 1.7;">
                Good news! Your requested data export has been prepared and is ready for download. We believe your data belongs to you, always.
              </p>
              
              <div style="background: rgba(251, 191, 36, 0.1); border: 1px solid rgba(251, 191, 36, 0.3); padding: 20px; border-radius: 12px; margin: 24px 0; text-align: center;">
                <p style="color: ${BRAND.gold}; margin: 0;">This download link expires on <strong>${data.expiresAt}</strong></p>
              </div>
              
              <div style="text-align: center; margin: 32px 0;">
                ${ctaButton('Download My Data', data.downloadUrl, 'primary')}
              </div>
              
              <p style="color: ${BRAND.muted}; font-size: 14px; line-height: 1.6; margin: 24px 0 0;">
                <strong style="color: white;">Didn't request this?</strong> If you didn't request a data export, please contact us immediately at <a href="mailto:support@familyforge.app" style="color: ${BRAND.accent};">support@familyforge.app</a>
              </p>
              
            </div>
          </div>
          
          ${emailFooter()}
        </div>
      </body>
      </html>
    `,
  }),
};

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { template, recipients, data, attachPdf } = await req.json() as EmailRequest;

    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY not configured');
    }

    const templateFn = emailTemplates[template];
    if (!templateFn) {
      throw new Error(`Unknown email template: ${template}`);
    }

    const { subject, html } = templateFn(data);

    const results = await Promise.all(
      recipients.map(async (recipient) => {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: FROM_EMAIL,
            to: recipient.email,
            subject,
            html: html.replace('{{name}}', recipient.name),
          }),
        });

        if (!response.ok) {
          const error = await response.text();
          console.error(`Failed to send to ${recipient.email}:`, error);
          return { email: recipient.email, success: false, error };
        }

        return { email: recipient.email, success: true };
      })
    );

    const failed = results.filter((r) => !r.success);
    if (failed.length > 0) {
      return new Response(
        JSON.stringify({ success: false, failed }),
        { status: 207, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Email send error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
