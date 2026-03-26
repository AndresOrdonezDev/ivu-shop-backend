export function verifyEmailTemplate(name: string, verifyUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Verify your email</title>
      </head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Hello, ${name}!</h2>
        <p>Thanks for registering. Please verify your email address by clicking the button below:</p>
        <a
          href="${verifyUrl}"
          style="
            display: inline-block;
            padding: 12px 24px;
            background-color: #4F46E5;
            color: #ffffff;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
          "
        >
          Verify Email
        </a>
        <p style="margin-top: 24px; color: #6B7280; font-size: 14px;">
          This link expires in 24 hours. If you did not create an account, you can safely ignore this email.
        </p>
      </body>
    </html>
  `;
}
