import nodemailer from "nodemailer";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set`);
  }
  return value;
}

function getTransporter() {
  const host = requireEnv("EMAIL_HOST");
  const port = Number(requireEnv("EMAIL_PORT"));
  const user = requireEnv("EMAIL_USER");
  const pass = requireEnv("EMAIL_PASS").replace(/\s/g, "");
  const from = requireEnv("EMAIL_FROM");

  return {
    from,
    transporter: nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    }),
  };
}

function codeEmailHtml(title: string, body: string, code: string) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0a0f0d;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:420px;background:#111916;border:1px solid #1f2e28;border-radius:16px;overflow:hidden;">
        <tr><td style="padding:32px 28px;">
          <p style="margin:0 0 8px;font-size:13px;color:#6b8f7d;letter-spacing:0.08em;text-transform:uppercase;">Time Since</p>
          <h1 style="margin:0 0 16px;font-size:22px;color:#e8f5ef;font-weight:600;">${title}</h1>
          <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#9cb8aa;">${body}</p>
          <div style="text-align:center;padding:20px;background:#0d1512;border-radius:12px;border:1px solid #1f2e28;">
            <span style="font-size:36px;font-weight:700;letter-spacing:0.35em;color:#34d399;font-family:ui-monospace,monospace;">${code}</span>
          </div>
          <p style="margin:24px 0 0;font-size:13px;line-height:1.5;color:#6b8f7d;">This code expires in 15 minutes. If you didn't request this, you can safely ignore this email.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendVerificationCode(
  email: string,
  code: string,
  name?: string,
) {
  const { from, transporter } = getTransporter();
  const greeting = name ? `Hi ${name},` : "Hi,";

  await transporter.sendMail({
    from,
    to: email,
    subject: "Your Time Since verification code",
    text: `${greeting}\n\nYour verification code is: ${code}\n\nIt expires in 15 minutes.`,
    html: codeEmailHtml(
      "Verify your email",
      `${greeting} enter this code to complete your signup and start tracking time.`,
      code,
    ),
  });
}

export async function sendPasswordResetCode(email: string, code: string) {
  const { from, transporter } = getTransporter();

  await transporter.sendMail({
    from,
    to: email,
    subject: "Your Time Since password reset code",
    text: `Your password reset code is: ${code}\n\nIt expires in 15 minutes.`,
    html: codeEmailHtml(
      "Reset your password",
      "Enter this code to set a new password for your account.",
      code,
    ),
  });
}
