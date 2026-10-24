import "server-only";

import { Resend } from "resend";

type PasswordResetEmail = {
  to: string;
  url: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export async function sendPasswordResetEmail({ to, url }: PasswordResetEmail) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.AUTH_EMAIL_FROM;

  if (!apiKey || !from) {
    throw new Error("RESEND_API_KEY and AUTH_EMAIL_FROM are required to send password reset emails.");
  }

  const safeUrl = escapeHtml(url);
  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to,
    subject: "Reset your TechBondhu password",
    text: [
      "We received a request to reset your TechBondhu password.",
      "",
      `Reset your password: ${url}`,
      "",
      "This link expires in 60 minutes. If you did not request it, you can safely ignore this email.",
    ].join("\n"),
    html: `
      <div style="margin:0;background:#f3f7f8;padding:32px 16px;font-family:Arial,sans-serif;color:#111214">
        <div style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #d9dadd;padding:32px">
          <p style="margin:0 0 28px;font-size:13px;font-weight:700;letter-spacing:.16em">TECHBONDHU<span style="color:#1769e0">.</span></p>
          <h1 style="margin:0 0 12px;font-size:26px;line-height:1.2">Reset your password</h1>
          <p style="margin:0 0 24px;color:#65676c;font-size:15px;line-height:1.6">We received a request to reset your TechBondhu password.</p>
          <a href="${safeUrl}" style="display:inline-block;padding:13px 20px;border-radius:6px;background:#111214;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700">Choose a new password</a>
          <p style="margin:24px 0 0;color:#65676c;font-size:12px;line-height:1.6">This secure link expires in 60 minutes. If you did not request a password reset, you can safely ignore this email.</p>
        </div>
      </div>
    `,
  });

  if (error) {
    throw new Error(`Resend rejected the password reset email: ${error.message}`);
  }
}
