import nodemailer from 'nodemailer';

let transporter: nodemailer.Transporter;

async function getTransporter() {
  if (transporter) return transporter;

  if (process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  } else {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
    console.log(`[Email] Using Ethereal test account: ${testAccount.user}`);
  }

  return transporter;
}

export async function sendVerificationEmail(to: string, code: string) {
  const t = await getTransporter();

  const info = await t.sendMail({
    from: process.env.MAIL_FROM || '"InterCollab" <noreply@intercollab.com>',
    to,
    subject: `${code} is your InterCollab verification code`,
    text: `Your verification code is: ${code}\n\nThis code expires in 10 minutes.\n\nIf you didn't request this, please ignore this email.`,
    html: `
      <div style="font-family:'Outfit',system-ui,sans-serif;max-width:440px;margin:0 auto;padding:32px 0">
        <div style="text-align:center;margin-bottom:28px">
          <span style="display:inline-block;padding:6px 14px;background:linear-gradient(135deg,#eef2ff,#f5f3ff);border-radius:10px;font-weight:700;color:#4f46e5;font-size:16px">InterCollab</span>
        </div>
        <div style="background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:32px;text-align:center">
          <h2 style="margin:0 0 8px;font-size:18px;font-weight:600;color:#111827">Verify your email</h2>
          <p style="margin:0 0 24px;font-size:14px;color:#6b7280">Enter this code to continue registration</p>
          <div style="font-size:32px;font-weight:700;letter-spacing:6px;color:#111827;padding:16px;background:#f9fafb;border-radius:8px;border:1px solid #e5e7eb">${code}</div>
          <p style="margin:20px 0 0;font-size:13px;color:#9ca3af">Expires in 10 minutes</p>
        </div>
        <p style="text-align:center;font-size:12px;color:#9ca3af;margin-top:24px">If you didn't request this code, you can safely ignore this email.</p>
      </div>
    `,
  });

  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log(`[Email] Preview URL: ${previewUrl}`);
  }
}
