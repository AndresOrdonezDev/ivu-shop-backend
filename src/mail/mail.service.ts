import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { verifyEmailTemplate } from './templates/verify-email.template';
import { resetPasswordTemplate } from './templates/reset-password.template';

@Injectable()
export class MailService {
  private readonly resend: Resend;
  private readonly from: string;
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly config: ConfigService) {
    this.resend = new Resend(config.get<string>('RESEND_API_KEY'));
    this.from = config.get<string>('RESEND_FROM_EMAIL')!;
  }

  async sendVerificationEmail(
    to: string,
    name: string,
    token: string,
  ): Promise<void> {
    const frontendUrl = this.config.get<string>('FRONTEND_URL');
    const verifyUrl = `${frontendUrl}/verify-email?token=${token}`;

    const { error } = await this.resend.emails.send({
      from: this.from,
      to,
      subject: 'Verify your email address',
      html: verifyEmailTemplate(name, verifyUrl),
    });

    if (error) {
      this.logger.error(`Failed to send verification email to ${to}`, error);
    }
  }

  async sendResetPasswordEmail(
    to: string,
    name: string,
    token: string,
  ): Promise<void> {
    const frontendUrl = this.config.get<string>('FRONTEND_URL');
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

    const { error } = await this.resend.emails.send({
      from: this.from,
      to,
      subject: 'Reset your password',
      html: resetPasswordTemplate(name, resetUrl),
    });

    if (error) {
      this.logger.error(
        `Failed to send reset password email to ${to}`,
        error,
      );
    }
  }
}
