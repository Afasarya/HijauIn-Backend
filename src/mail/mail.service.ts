import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private configService: ConfigService) {}

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const resetUrl = `${this.configService.get('RESET_PASSWORD_URL')}${token}`;
    const apiKey = this.configService.get('RESEND_API_KEY');

    try {
      await axios.post(
        'https://api.resend.com/emails',
        {
          from: 'HijauIn <onboarding@resend.dev>',
          to: email,
          subject: 'Reset Password - HijauIn',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2ecc71;">Reset Password - HijauIn</h2>
              <p>Halo,</p>
              <p>Kami menerima permintaan untuk mereset password akun Anda.</p>
              <p>Klik tombol di bawah ini untuk mereset password Anda:</p>
              <div style="margin: 30px 0;">
                <a href="${resetUrl}" 
                   style="background-color: #2ecc71; color: white; padding: 12px 30px; 
                          text-decoration: none; border-radius: 5px; display: inline-block;">
                  Reset Password
                </a>
              </div>
              <p>Atau copy link berikut ke browser Anda:</p>
              <p style="color: #666; word-break: break-all;">${resetUrl}</p>
              <p style="color: #999; font-size: 12px; margin-top: 30px;">
                Link ini akan kadaluarsa dalam 15 menit.<br>
                Jika Anda tidak meminta reset password, abaikan email ini.
              </p>
            </div>
          `,
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      this.logger.log(`Password reset email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${email}:`, error.response?.data || error.message);
      throw new Error('Failed to send password reset email');
    }
  }
}
