export function resetPasswordTemplate(name: string, resetUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Reset your password</title>
      </head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Hello, ${name}!</h2>
        <p>We received a request to reset your password. Click the button below to set a new password:</p>
        <a
          href="${resetUrl}"
          style="
            display: inline-block;
            padding: 12px 24px;
            background-color: #DC2626;
            color: #ffffff;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
          "
        >
          Reset Password
        </a>
        <p style="margin-top: 24px; color: #6B7280; font-size: 14px;">
          This link expires in 1 hour. If you did not request a password reset, you can safely ignore this email.
        </p>
      </body>
    </html>
  `;
}
