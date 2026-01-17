import nodemailer from 'nodemailer';
import appConfig from '../config/app-config';

/**
 * Email service utility for sending emails
 */
class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  /**
   * Initialize email transporter
   */
  private getTransporter(): nodemailer.Transporter {
    if (this.transporter) {
      return this.transporter;
    }

    // Validate email credentials are provided
    if (!appConfig.SYSTEM_EMAIL || !appConfig.SYSTEM_EMAIL_PASSWORD) {
      throw new Error('SYSTEM_EMAIL and SYSTEM_EMAIL_PASSWORD must be set in environment variables');
    }

    // Gmail SMTP configuration
    // Remove spaces from app password if present
    const emailPassword = appConfig.SYSTEM_EMAIL_PASSWORD.replace(/\s+/g, '');
    
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: appConfig.SYSTEM_EMAIL,
        pass: emailPassword,
      },
    });

    return this.transporter;
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(
    to: string,
    resetToken: string,
    userId: string,
    userName?: string
  ): Promise<void> {
    const transporter = this.getTransporter();
    const frontendUrl = appConfig.FRONT_END_PORTAL || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}&user_id=${userId}`;

    const mailOptions = {
      from: `"Task Management System" <${appConfig.SYSTEM_EMAIL}>`,
      to,
      subject: 'Password Reset Request',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f4f4f4; padding: 20px; border-radius: 5px;">
            <h2 style="color: #2c3e50;">Password Reset Request</h2>
            <p>Hello ${userName || 'User'},</p>
            <p>We received a request to reset your password for your Task Management System account.</p>
            <p>Click the button below to reset your password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Reset Password
              </a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #007bff;">${resetUrl}</p>
            <p><strong>This link will expire in 1 hour.</strong></p>
            <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #666;">
              This is an automated message. Please do not reply to this email.
            </p>
          </div>
        </body>
        </html>
      `,
      text: `
        Password Reset Request
        
        Hello ${userName || 'User'},
        
        We received a request to reset your password for your Task Management System account.
        
        Click the link below to reset your password:
        ${resetUrl}
        
        This link will expire in 1 hour.
        
        If you didn't request a password reset, please ignore this email. Your password will remain unchanged.
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`Password reset email sent to ${to}`);
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw new Error('Failed to send password reset email');
    }
  }

  /**
   * Send user setup password email
   */
  async sendSetupPasswordEmail(
    to: string,
    setupToken: string,
    userId: string,
    userName?: string
  ): Promise<void> {
    const transporter = this.getTransporter();
    const frontendUrl = appConfig.FRONT_END_PORTAL || 'http://localhost:3000';
    const setupUrl = `${frontendUrl}/setup-password?token=${setupToken}&user_id=${userId}`;

    const mailOptions = {
      from: `"Task Management System" <${appConfig.SYSTEM_EMAIL}>`,
      to,
      subject: 'Welcome! Set Up Your Account Password',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Set Up Your Account</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f4f4f4; padding: 20px; border-radius: 5px;">
            <h2 style="color: #2c3e50;">Welcome to Task Management System!</h2>
            <p>Hello ${userName || 'User'},</p>
            <p>Your account has been created. To complete your registration and set up your password, please click the button below:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${setupUrl}" 
                 style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Set Up Password
              </a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #007bff;">${setupUrl}</p>
            <p><strong>This link will expire in 24 hours.</strong></p>
            <p>If you didn't expect this email, please contact your administrator.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #666;">
              This is an automated message. Please do not reply to this email.
            </p>
          </div>
        </body>
        </html>
      `,
      text: `
        Welcome to Task Management System!
        
        Hello ${userName || 'User'},
        
        Your account has been created. To complete your registration and set up your password, please click the link below:
        ${setupUrl}
        
        This link will expire in 24 hours.
        
        If you didn't expect this email, please contact your administrator.
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`Setup password email sent to ${to}`);
    } catch (error) {
      console.error('Error sending setup password email:', error);
      throw new Error('Failed to send setup password email');
    }
  }

  /**
   * Verify email transporter connection
   */
  async verifyConnection(): Promise<boolean> {
    try {
      const transporter = this.getTransporter();
      await transporter.verify();
      return true;
    } catch (error) {
      console.error('Email transporter verification failed:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();
