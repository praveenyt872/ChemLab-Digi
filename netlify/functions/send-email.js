// Netlify Serverless Function: send-email
// Dispatches automated notification emails directly to students without requiring activation.
// Supports Brevo (Sendinblue) or Resend API via Netlify environment variables.

export const handler = async (event, context) => {
  // Only accept POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, error: 'Method not allowed' })
    };
  }

  try {
    const payload = JSON.parse(event.body || '{}');
    const {
      targetEmail,
      studentName = 'Student',
      registerNumber = '',
      experimentName = 'Laboratory Experiment',
      facultyRemarks = '',
      facultyEmail = 'faculty@rajalakshmi.edu.in',
      facultyName = 'Faculty In-Charge',
      subject = `[ChemZ Lab] Corrections Required: ${experimentName} - Not Approved`
    } = payload;

    if (!targetEmail) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: false, error: 'Missing targetEmail' })
      };
    }

    const remarksText = facultyRemarks || 'There are corrections required in your submitted experiment calculations, observations, or report. Please review your record and meet the faculty in the laboratory to get it approved.';

    // Professional HTML Email Template
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>ChemZ Lab Experiment Review Notice</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <!-- Header -->
          <tr>
            <td style="background-color: #4f46e5; padding: 24px 32px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 17px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em;">
                RAJALAKSHMI ENGINEERING COLLEGE
              </h1>
              <p style="margin: 4px 0 0 0; color: #e0e7ff; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">
                Department of Chemical Engineering • ChemZ Lab
              </p>
            </td>
          </tr>

          <!-- Status Banner -->
          <tr>
            <td style="padding: 24px 32px 16px 32px;">
              <div style="background-color: #fffbeb; border: 1px solid #fef3c7; border-left: 4px solid #f59e0b; padding: 14px 16px; border-radius: 8px;">
                <p style="margin: 0; color: #b45309; font-size: 14px; font-weight: bold;">
                  ⚠️ Experiment Submission Status: Not Approved
                </p>
                <p style="margin: 4px 0 0 0; color: #78350f; font-size: 12px;">
                  Corrections are required in your submitted laboratory experiment report.
                </p>
              </div>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 16px 32px 24px 32px;">
              <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #334155;">
                Dear <strong>${studentName}</strong> (Register Number: <strong>${registerNumber}</strong>),
              </p>
              <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #334155;">
                Your submitted experiment report for <strong>${experimentName}</strong> has been reviewed by the faculty advisor and is <strong>NOT APPROVED</strong> due to necessary corrections.
              </p>

              <!-- Faculty Remarks Box -->
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 20px 0;">
                <p style="margin: 0 0 8px 0; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b;">
                  Faculty Remarks & Corrections Required:
                </p>
                <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #0f172a; font-style: italic;">
                  "${remarksText}"
                </p>
              </div>

              <!-- Action Instructions -->
              <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 14px 16px; margin: 16px 0;">
                <p style="margin: 0; font-size: 12px; color: #166534; font-weight: 700;">
                  📌 Action Required:
                </p>
                <p style="margin: 4px 0 0 0; font-size: 12px; color: #14532d; line-height: 1.5;">
                  Please revise your experimental observations, calculations, or plots, make the required corrections in your record, and meet <strong>${facultyName}</strong> (${facultyEmail}) in the laboratory to obtain final approval.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 20px 32px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; line-height: 1.5;">
              <p style="margin: 0;">This is an automated notification from the <strong>ChemZ Lab</strong> Portal.</p>
              <p style="margin: 4px 0 0 0;">Department of Chemical Engineering • Rajalakshmi Engineering College, Chennai</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

    const plainText = `Dear ${studentName} (Register Number: ${registerNumber}),

Your submitted experiment report for:
"${experimentName}"
has NOT BEEN APPROVED by faculty.

Faculty Remarks & Corrections Required:
----------------------------------------
"${remarksText}"

Please review your experimental observations, calculations, or plots, make the necessary corrections, and meet ${facultyName} (${facultyEmail}) in the laboratory to obtain final approval.

Department of Chemical Engineering
Rajalakshmi Engineering College, Chennai
ChemZ Lab Digital Laboratory Platform`;

    // 1. Try Brevo (Sendinblue) API if configured
    const brevoKey = process.env.BREVO_API_KEY || process.env.SENDINBLUE_API_KEY;
    if (brevoKey) {
      const brevoSenderEmail = process.env.BREVO_SENDER_EMAIL || process.env.SENDER_EMAIL || 'chemzlab.rec@gmail.com';
      const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': brevoKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          sender: { name: `${facultyName} (ChemZ Lab)`, email: brevoSenderEmail },
          to: [{ email: targetEmail, name: studentName }],
          replyTo: { email: facultyEmail },
          subject: subject,
          htmlContent: htmlContent,
          textContent: plainText
        })
      });

      if (brevoRes.ok) {
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            success: true,
            provider: 'brevo',
            message: `Email dispatched directly to ${targetEmail} via Brevo`
          })
        };
      } else {
        const errorText = await brevoRes.text();
        console.warn('Brevo API error:', brevoRes.status, errorText);
      }
    }

    // 2. Try Resend API if configured
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      const resendSender = process.env.RESEND_FROM_EMAIL || 'ChemZ Lab <onboarding@resend.dev>';
      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: resendSender,
          to: [targetEmail],
          reply_to: facultyEmail,
          subject: subject,
          html: htmlContent,
          text: plainText
        })
      });

      if (resendRes.ok) {
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            success: true,
            provider: 'resend',
            message: `Email dispatched directly to ${targetEmail} via Resend`
          })
        };
      } else {
        const errorText = await resendRes.text();
        console.warn('Resend API error:', resendRes.status, errorText);
      }
    }

    // 3. No API key configured yet
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        notConfigured: true,
        message: 'No email API key (BREVO_API_KEY or RESEND_API_KEY) found in Netlify environment variables.'
      })
    };
  } catch (err) {
    console.error('send-email function error:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, error: err.message || 'Internal server error' })
    };
  }
};
