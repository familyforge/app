/**
 * FamilyForge Email System - Reusable Email Blocks
 * 
 * Pre-built HTML blocks for consistent email design.
 * These blocks use the EMAIL_BRAND constants for styling consistency.
 */

import { EmailBlock, EMAIL_BRAND } from './types';

// Helper to safely interpolate variables in templates
export function interpolateBlock(html: string, variables: Record<string, string>): string {
  let result = html;
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    result = result.replace(regex, value ?? '');
  });
  return result;
}

// ============== HEADER BLOCKS ==============

export const HEADER_BLOCK_STANDARD: EmailBlock = {
  id: 'header-standard',
  name: 'Standard Header',
  description: 'Logo with greeting and optional subtitle',
  type: 'header',
  htmlTemplate: `
    <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, ${EMAIL_BRAND.primaryColor} 0%, ${EMAIL_BRAND.secondaryColor} 100%); border-radius: 12px 12px 0 0;">
      <tr>
        <td align="center" style="padding: 40px 20px;">
          <img src="{{logoUrl}}" alt="FamilyForge" width="160" style="display: block;" />
          <h1 style="color: white; font-family: ${EMAIL_BRAND.fontFamily}; font-size: 28px; margin: 20px 0 8px; font-weight: 700;">{{greeting}}</h1>
          <p style="color: rgba(255,255,255,0.9); font-family: ${EMAIL_BRAND.fontFamily}; font-size: 16px; margin: 0;">{{subtitle}}</p>
        </td>
      </tr>
    </table>
  `,
  variables: ['logoUrl', 'greeting', 'subtitle'],
  previewImage: '/blocks/header-standard.png',
  isSystem: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const HEADER_BLOCK_MINIMAL: EmailBlock = {
  id: 'header-minimal',
  name: 'Minimal Header',
  description: 'Simple logo-only header for transactional emails',
  type: 'header',
  htmlTemplate: `
    <table width="100%" cellpadding="0" cellspacing="0" style="background: ${EMAIL_BRAND.backgroundColor};">
      <tr>
        <td align="center" style="padding: 24px 20px;">
          <img src="{{logoUrl}}" alt="FamilyForge" width="120" style="display: block;" />
        </td>
      </tr>
    </table>
  `,
  variables: ['logoUrl'],
  previewImage: '/blocks/header-minimal.png',
  isSystem: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// ============== CTA BLOCKS ==============

export const CTA_BLOCK_PRIMARY: EmailBlock = {
  id: 'cta-primary',
  name: 'Primary CTA Button',
  description: 'Large attention-grabbing call-to-action button',
  type: 'cta',
  htmlTemplate: `
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding: 24px 20px;">
          <!--[if mso]>
          <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="{{buttonUrl}}" style="height:56px;v-text-anchor:middle;width:280px;" arcsize="14%" stroke="f" fillcolor="${EMAIL_BRAND.primaryColor}">
          <w:anchorlock/>
          <center>
          <![endif]-->
          <a href="{{buttonUrl}}" target="_blank" style="background: linear-gradient(135deg, ${EMAIL_BRAND.primaryColor} 0%, ${EMAIL_BRAND.secondaryColor} 100%); color: white; font-family: ${EMAIL_BRAND.fontFamily}; font-size: 18px; font-weight: 600; text-decoration: none; padding: 16px 48px; border-radius: 28px; display: inline-block; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.35);">
            {{buttonText}}
          </a>
          <!--[if mso]>
          </center>
          </v:roundrect>
          <![endif]-->
        </td>
      </tr>
    </table>
  `,
  variables: ['buttonUrl', 'buttonText'],
  previewImage: '/blocks/cta-primary.png',
  isSystem: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const CTA_BLOCK_SECONDARY: EmailBlock = {
  id: 'cta-secondary',
  name: 'Secondary CTA Button',
  description: 'Outlined button for secondary actions',
  type: 'cta',
  htmlTemplate: `
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding: 16px 20px;">
          <a href="{{buttonUrl}}" target="_blank" style="color: ${EMAIL_BRAND.primaryColor}; font-family: ${EMAIL_BRAND.fontFamily}; font-size: 16px; font-weight: 600; text-decoration: none; padding: 12px 32px; border: 2px solid ${EMAIL_BRAND.primaryColor}; border-radius: 24px; display: inline-block;">
            {{buttonText}}
          </a>
        </td>
      </tr>
    </table>
  `,
  variables: ['buttonUrl', 'buttonText'],
  previewImage: '/blocks/cta-secondary.png',
  isSystem: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const CTA_BLOCK_DUAL: EmailBlock = {
  id: 'cta-dual',
  name: 'Dual CTA Buttons',
  description: 'Primary and secondary buttons side by side',
  type: 'cta',
  htmlTemplate: `
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding: 24px 20px;">
          <table cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding-right: 12px;">
                <a href="{{primaryUrl}}" target="_blank" style="background: ${EMAIL_BRAND.primaryColor}; color: white; font-family: ${EMAIL_BRAND.fontFamily}; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 28px; border-radius: 24px; display: inline-block;">
                  {{primaryText}}
                </a>
              </td>
              <td style="padding-left: 12px;">
                <a href="{{secondaryUrl}}" target="_blank" style="color: ${EMAIL_BRAND.primaryColor}; font-family: ${EMAIL_BRAND.fontFamily}; font-size: 16px; font-weight: 600; text-decoration: none; padding: 12px 26px; border: 2px solid ${EMAIL_BRAND.primaryColor}; border-radius: 24px; display: inline-block;">
                  {{secondaryText}}
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `,
  variables: ['primaryUrl', 'primaryText', 'secondaryUrl', 'secondaryText'],
  previewImage: '/blocks/cta-dual.png',
  isSystem: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// ============== QUOTE BLOCKS ==============

export const QUOTE_BLOCK_STANDARD: EmailBlock = {
  id: 'quote-standard',
  name: 'Quote Block',
  description: 'Highlighted quote with author attribution',
  type: 'quote',
  htmlTemplate: `
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding: 20px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(168, 85, 247, 0.08) 100%); border-radius: 12px; border-left: 4px solid ${EMAIL_BRAND.primaryColor};">
            <tr>
              <td style="padding: 24px 28px;">
                <p style="color: ${EMAIL_BRAND.textDark}; font-family: ${EMAIL_BRAND.fontFamily}; font-size: 18px; font-style: italic; line-height: 1.6; margin: 0 0 12px;">
                  "{{quoteText}}"
                </p>
                <p style="color: ${EMAIL_BRAND.textMuted}; font-family: ${EMAIL_BRAND.fontFamily}; font-size: 14px; margin: 0;">
                  — {{authorName}}
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `,
  variables: ['quoteText', 'authorName'],
  previewImage: '/blocks/quote-standard.png',
  isSystem: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const QUOTE_BLOCK_TESTIMONIAL: EmailBlock = {
  id: 'quote-testimonial',
  name: 'Parent Testimonial',
  description: 'Quote with avatar and parent info',
  type: 'testimonial',
  htmlTemplate: `
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding: 20px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background: white; border-radius: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
            <tr>
              <td style="padding: 28px;">
                <table cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="vertical-align: top; padding-right: 16px;">
                      <img src="{{avatarUrl}}" alt="" width="56" height="56" style="border-radius: 50%; display: block;" />
                    </td>
                    <td style="vertical-align: top;">
                      <p style="color: ${EMAIL_BRAND.textDark}; font-family: ${EMAIL_BRAND.fontFamily}; font-size: 16px; line-height: 1.5; margin: 0 0 12px;">
                        "{{testimonialText}}"
                      </p>
                      <p style="color: ${EMAIL_BRAND.textDark}; font-family: ${EMAIL_BRAND.fontFamily}; font-size: 14px; font-weight: 600; margin: 0;">
                        {{parentName}}
                      </p>
                      <p style="color: ${EMAIL_BRAND.textMuted}; font-family: ${EMAIL_BRAND.fontFamily}; font-size: 13px; margin: 4px 0 0;">
                        {{parentSubtitle}}
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `,
  variables: ['avatarUrl', 'testimonialText', 'parentName', 'parentSubtitle'],
  previewImage: '/blocks/quote-testimonial.png',
  isSystem: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// ============== STEPS BLOCKS ==============

export const STEPS_BLOCK: EmailBlock = {
  id: 'steps-standard',
  name: 'Steps List',
  description: 'Numbered steps with icons for instructions',
  type: 'steps',
  htmlTemplate: `
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding: 20px;">
          <h3 style="color: ${EMAIL_BRAND.textDark}; font-family: ${EMAIL_BRAND.fontFamily}; font-size: 20px; font-weight: 600; margin: 0 0 20px;">{{stepsTitle}}</h3>
          
          <!-- Step 1 -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 16px;">
            <tr>
              <td width="40" style="vertical-align: top;">
                <div style="width: 32px; height: 32px; background: ${EMAIL_BRAND.primaryColor}; border-radius: 50%; text-align: center; line-height: 32px; color: white; font-family: ${EMAIL_BRAND.fontFamily}; font-weight: 600;">1</div>
              </td>
              <td style="vertical-align: top; padding-left: 12px;">
                <p style="color: ${EMAIL_BRAND.textDark}; font-family: ${EMAIL_BRAND.fontFamily}; font-size: 15px; margin: 6px 0 0; line-height: 1.5;">{{step1}}</p>
              </td>
            </tr>
          </table>
          
          <!-- Step 2 -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 16px;">
            <tr>
              <td width="40" style="vertical-align: top;">
                <div style="width: 32px; height: 32px; background: ${EMAIL_BRAND.secondaryColor}; border-radius: 50%; text-align: center; line-height: 32px; color: white; font-family: ${EMAIL_BRAND.fontFamily}; font-weight: 600;">2</div>
              </td>
              <td style="vertical-align: top; padding-left: 12px;">
                <p style="color: ${EMAIL_BRAND.textDark}; font-family: ${EMAIL_BRAND.fontFamily}; font-size: 15px; margin: 6px 0 0; line-height: 1.5;">{{step2}}</p>
              </td>
            </tr>
          </table>
          
          <!-- Step 3 -->
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td width="40" style="vertical-align: top;">
                <div style="width: 32px; height: 32px; background: ${EMAIL_BRAND.accentColor}; border-radius: 50%; text-align: center; line-height: 32px; color: white; font-family: ${EMAIL_BRAND.fontFamily}; font-weight: 600;">3</div>
              </td>
              <td style="vertical-align: top; padding-left: 12px;">
                <p style="color: ${EMAIL_BRAND.textDark}; font-family: ${EMAIL_BRAND.fontFamily}; font-size: 15px; margin: 6px 0 0; line-height: 1.5;">{{step3}}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `,
  variables: ['stepsTitle', 'step1', 'step2', 'step3'],
  previewImage: '/blocks/steps-standard.png',
  isSystem: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// ============== FEATURE BLOCKS ==============

export const FEATURE_CARD_BLOCK: EmailBlock = {
  id: 'feature-card',
  name: 'Feature Card',
  description: 'Highlight a feature with icon and description',
  type: 'feature_card',
  htmlTemplate: `
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding: 12px 20px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background: ${EMAIL_BRAND.backgroundColor}; border-radius: 12px; border: 1px solid #e5e7eb;">
            <tr>
              <td style="padding: 24px;">
                <table cellpadding="0" cellspacing="0">
                  <tr>
                    <td width="48" style="vertical-align: top;">
                      <div style="width: 44px; height: 44px; background: linear-gradient(135deg, ${EMAIL_BRAND.primaryColor} 0%, ${EMAIL_BRAND.secondaryColor} 100%); border-radius: 10px; text-align: center; line-height: 44px;">
                        <span style="font-size: 22px;">{{emoji}}</span>
                      </div>
                    </td>
                    <td style="vertical-align: top; padding-left: 16px;">
                      <h4 style="color: ${EMAIL_BRAND.textDark}; font-family: ${EMAIL_BRAND.fontFamily}; font-size: 16px; font-weight: 600; margin: 0 0 6px;">{{featureTitle}}</h4>
                      <p style="color: ${EMAIL_BRAND.textMuted}; font-family: ${EMAIL_BRAND.fontFamily}; font-size: 14px; line-height: 1.5; margin: 0;">{{featureDescription}}</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `,
  variables: ['emoji', 'featureTitle', 'featureDescription'],
  previewImage: '/blocks/feature-card.png',
  isSystem: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// ============== DIVIDER BLOCKS ==============

export const DIVIDER_BLOCK_GRADIENT: EmailBlock = {
  id: 'divider-gradient',
  name: 'Gradient Divider',
  description: 'Colorful gradient line separator',
  type: 'divider',
  htmlTemplate: `
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding: 24px 20px;">
          <div style="height: 3px; background: linear-gradient(90deg, ${EMAIL_BRAND.primaryColor} 0%, ${EMAIL_BRAND.secondaryColor} 50%, ${EMAIL_BRAND.accentColor} 100%); border-radius: 2px;"></div>
        </td>
      </tr>
    </table>
  `,
  variables: [],
  previewImage: '/blocks/divider-gradient.png',
  isSystem: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const DIVIDER_BLOCK_SIMPLE: EmailBlock = {
  id: 'divider-simple',
  name: 'Simple Divider',
  description: 'Subtle gray line separator',
  type: 'divider',
  htmlTemplate: `
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding: 20px;">
          <div style="height: 1px; background: #e5e7eb;"></div>
        </td>
      </tr>
    </table>
  `,
  variables: [],
  previewImage: '/blocks/divider-simple.png',
  isSystem: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// ============== FOOTER BLOCKS ==============

export const FOOTER_BLOCK_STANDARD: EmailBlock = {
  id: 'footer-standard',
  name: 'Standard Footer',
  description: 'Full footer with links, social, and legal',
  type: 'footer',
  htmlTemplate: `
    <table width="100%" cellpadding="0" cellspacing="0" style="background: ${EMAIL_BRAND.backgroundColor}; border-radius: 0 0 12px 12px;">
      <tr>
        <td align="center" style="padding: 32px 20px;">
          <!-- Social Links -->
          <table cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
            <tr>
              <td style="padding: 0 8px;">
                <a href="{{twitterUrl}}" target="_blank" style="display: inline-block;">
                  <img src="https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/twitter.svg" alt="Twitter" width="24" height="24" style="opacity: 0.6;" />
                </a>
              </td>
              <td style="padding: 0 8px;">
                <a href="{{instagramUrl}}" target="_blank" style="display: inline-block;">
                  <img src="https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/instagram.svg" alt="Instagram" width="24" height="24" style="opacity: 0.6;" />
                </a>
              </td>
              <td style="padding: 0 8px;">
                <a href="{{facebookUrl}}" target="_blank" style="display: inline-block;">
                  <img src="https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/facebook.svg" alt="Facebook" width="24" height="24" style="opacity: 0.6;" />
                </a>
              </td>
            </tr>
          </table>
          
          <!-- Links -->
          <p style="color: ${EMAIL_BRAND.textMuted}; font-family: ${EMAIL_BRAND.fontFamily}; font-size: 13px; margin: 0 0 8px;">
            <a href="{{privacyUrl}}" target="_blank" style="color: ${EMAIL_BRAND.textMuted}; text-decoration: underline;">Privacy Policy</a>
            &nbsp;&nbsp;•&nbsp;&nbsp;
            <a href="{{termsUrl}}" target="_blank" style="color: ${EMAIL_BRAND.textMuted}; text-decoration: underline;">Terms of Service</a>
            &nbsp;&nbsp;•&nbsp;&nbsp;
            <a href="{{unsubscribeUrl}}" target="_blank" style="color: ${EMAIL_BRAND.textMuted}; text-decoration: underline;">Unsubscribe</a>
          </p>
          
          <!-- Legal -->
          <p style="color: #9ca3af; font-family: ${EMAIL_BRAND.fontFamily}; font-size: 12px; margin: 12px 0 0; line-height: 1.5;">
            {{companyName}}<br />
            {{companyAddress}}
          </p>
          
          <p style="color: #9ca3af; font-family: ${EMAIL_BRAND.fontFamily}; font-size: 11px; margin: 16px 0 0;">
            © {{year}} FamilyForge. All rights reserved.
          </p>
        </td>
      </tr>
    </table>
  `,
  variables: ['twitterUrl', 'instagramUrl', 'facebookUrl', 'privacyUrl', 'termsUrl', 'unsubscribeUrl', 'companyName', 'companyAddress', 'year'],
  previewImage: '/blocks/footer-standard.png',
  isSystem: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const FOOTER_BLOCK_MINIMAL: EmailBlock = {
  id: 'footer-minimal',
  name: 'Minimal Footer',
  description: 'Simple unsubscribe-only footer',
  type: 'footer',
  htmlTemplate: `
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding: 24px 20px;">
          <p style="color: #9ca3af; font-family: ${EMAIL_BRAND.fontFamily}; font-size: 12px; margin: 0;">
            You received this email because you're a FamilyForge user.
            <br />
            <a href="{{unsubscribeUrl}}" target="_blank" style="color: #9ca3af; text-decoration: underline;">Unsubscribe</a>
          </p>
        </td>
      </tr>
    </table>
  `,
  variables: ['unsubscribeUrl'],
  previewImage: '/blocks/footer-minimal.png',
  isSystem: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// ============== COLLECTION ==============

export const ALL_EMAIL_BLOCKS: EmailBlock[] = [
  HEADER_BLOCK_STANDARD,
  HEADER_BLOCK_MINIMAL,
  CTA_BLOCK_PRIMARY,
  CTA_BLOCK_SECONDARY,
  CTA_BLOCK_DUAL,
  QUOTE_BLOCK_STANDARD,
  QUOTE_BLOCK_TESTIMONIAL,
  STEPS_BLOCK,
  FEATURE_CARD_BLOCK,
  DIVIDER_BLOCK_GRADIENT,
  DIVIDER_BLOCK_SIMPLE,
  FOOTER_BLOCK_STANDARD,
  FOOTER_BLOCK_MINIMAL,
];

// Get blocks by type
export function getBlocksByType(type: EmailBlock['type']): EmailBlock[] {
  return ALL_EMAIL_BLOCKS.filter(block => block.type === type);
}

// Generate default variables for a block
export function getDefaultVariables(block: EmailBlock): Record<string, string> {
  const defaults: Record<string, string> = {
    logoUrl: 'https://familyforge.app/logo.png',
    greeting: 'Welcome to FamilyForge!',
    subtitle: 'Your family productivity journey starts here.',
    buttonUrl: 'https://familyforge.app',
    buttonText: 'Get Started',
    primaryUrl: 'https://familyforge.app',
    primaryText: 'Get Started',
    secondaryUrl: 'https://familyforge.app/learn',
    secondaryText: 'Learn More',
    quoteText: 'FamilyForge has transformed how our family manages tasks and rewards.',
    authorName: 'A Happy Parent',
    avatarUrl: 'https://i.pravatar.cc/112',
    testimonialText: 'Finally, an app that makes chores fun for my kids!',
    parentName: 'Sarah M.',
    parentSubtitle: 'Mom of 3, using FamilyForge for 6 months',
    stepsTitle: 'Getting Started',
    step1: 'Download the FamilyForge app from your app store',
    step2: 'Create your family account and add your children',
    step3: 'Start assigning tasks and watch motivation soar!',
    emoji: '✨',
    featureTitle: 'Smart Rewards',
    featureDescription: 'Set up customizable rewards that motivate your kids to complete their tasks.',
    twitterUrl: 'https://twitter.com/familyforge',
    instagramUrl: 'https://instagram.com/familyforge',
    facebookUrl: 'https://facebook.com/familyforge',
    privacyUrl: 'https://familyforge.app/privacy',
    termsUrl: 'https://familyforge.app/terms',
    unsubscribeUrl: '{{unsubscribe_url}}',
    companyName: 'FamilyForge, Inc.',
    companyAddress: '123 Family Way, San Francisco, CA 94102',
    year: new Date().getFullYear().toString(),
  };

  const result: Record<string, string> = {};
  block.variables.forEach(v => {
    result[v] = defaults[v] || `{{${v}}}`;
  });
  return result;
}

// Compose multiple blocks into a full email
export function composeEmailFromBlocks(blocks: { block: EmailBlock; variables: Record<string, string> }[]): string {
  const bodyContent = blocks
    .map(({ block, variables }) => interpolateBlock(block.htmlTemplate, variables))
    .join('\n');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>FamilyForge Email</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    body, table, td, p, a, li, blockquote {
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    table, td {
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    img {
      -ms-interpolation-mode: bicubic;
      border: 0;
      height: auto;
      line-height: 100%;
      outline: none;
      text-decoration: none;
    }
    @media only screen and (max-width: 600px) {
      .email-container {
        width: 100% !important;
        margin: auto !important;
      }
      .stack-column {
        display: block !important;
        width: 100% !important;
        max-width: 100% !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; -webkit-font-smoothing: antialiased;">
  <center style="width: 100%; background-color: #f3f4f6; padding: 40px 0;">
    <!--[if mso]>
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" align="center">
    <tr>
    <td>
    <![endif]-->
    <table class="email-container" role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);">
      ${bodyContent}
    </table>
    <!--[if mso]>
    </td>
    </tr>
    </table>
    <![endif]-->
  </center>
</body>
</html>
  `.trim();
}
