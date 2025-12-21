import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { config } from '../../config';
import { logger } from '../../logger';

export interface PasswordResetEmailOptions {
  email: string;
  resetToken: string;
  userName: string;
}

export interface PasswordChangedEmailOptions {
  email: string;
  userName: string;
}

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.EMAIL_HOST,
      port: config.EMAIL_PORT,
      secure: config.EMAIL_SECURE,
      auth: {
        user: config.EMAIL_USER,
        pass: config.EMAIL_PASSWORD,
      },
    });
  }

  /**
   * Send password reset email with token
   */
  async sendPasswordResetEmail(options: PasswordResetEmailOptions): Promise<void> {
    const { email, resetToken, userName } = options;

    const resetUrl = `${config.FRONTEND_URL}/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: `"${config.EMAIL_FROM_NAME}" <${config.EMAIL_FROM}>`,
      to: email,
      subject: 'Password Reset Request',
      html: this.getPasswordResetEmailTemplate(userName, resetUrl),
      text: `
Hello ${userName},

You requested to reset your password. Please click the link below to reset your password:

${resetUrl}

This link will expire in 1 hour.

If you did not request a password reset, please ignore this email or contact support if you have concerns.

Best regards,
${config.EMAIL_FROM_NAME}
      `.trim(),
    };

    try {
      await this.transporter.sendMail(mailOptions);
      logger.info('Password reset email sent successfully', { email });
    } catch (error) {
      logger.error('Failed to send password reset email', { email, error });
      throw new Error('Failed to send password reset email');
    }
  }

  /**
   * Send password changed notification email
   */
  async sendPasswordChangedEmail(options: PasswordChangedEmailOptions): Promise<void> {
    const { email, userName } = options;

    const mailOptions = {
      from: `"${config.EMAIL_FROM_NAME}" <${config.EMAIL_FROM}>`,
      to: email,
      subject: 'Your Password Has Been Changed',
      html: this.getPasswordChangedEmailTemplate(userName),
      text: `
Hello ${userName},

This is a confirmation that your password has been successfully changed.

If you did not make this change, please contact our support team immediately.

Best regards,
${config.EMAIL_FROM_NAME}
      `.trim(),
    };

    try {
      await this.transporter.sendMail(mailOptions);
      logger.info('Password changed notification email sent successfully', { email });
    } catch (error) {
      logger.error('Failed to send password changed email', { email, error });
      // Don't throw error for notification emails - password was already changed
      logger.warn('Password changed but notification email failed', { email });
    }
  }

  /**
   * HTML template for password reset email
   */
  private getPasswordResetEmailTemplate(userName: string, resetUrl: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .container {
      background-color: #f9f9f9;
      border-radius: 8px;
      padding: 30px;
      margin: 20px 0;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background-color: #007bff;
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 4px;
      margin: 20px 0;
    }
    .button:hover {
      background-color: #0056b3;
    }
    .warning {
      background-color: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 12px;
      margin: 20px 0;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      font-size: 12px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="container">
    <h2>Password Reset Request</h2>
    <p>Hello ${userName},</p>
    <p>You requested to reset your password. Click the button below to create a new password:</p>

    <a href="${resetUrl}" class="button">Reset Password</a>

    <p>Or copy and paste this link into your browser:</p>
    <p style="word-break: break-all; color: #007bff;">${resetUrl}</p>

    <div class="warning">
      <strong>⚠️ Important:</strong> This link will expire in 1 hour.
    </div>

    <p>If you did not request a password reset, please ignore this email or contact our support team if you have concerns.</p>

    <div class="footer">
      <p>Best regards,<br>${config.EMAIL_FROM_NAME}</p>
      <p style="color: #999;">This is an automated message, please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * HTML template for password changed notification
   */
  private getPasswordChangedEmailTemplate(userName: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Changed</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .container {
      background-color: #f9f9f9;
      border-radius: 8px;
      padding: 30px;
      margin: 20px 0;
    }
    .success {
      background-color: #d4edda;
      border-left: 4px solid #28a745;
      padding: 12px;
      margin: 20px 0;
    }
    .warning {
      background-color: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 12px;
      margin: 20px 0;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      font-size: 12px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="container">
    <h2>Password Changed Successfully</h2>
    <p>Hello ${userName},</p>

    <div class="success">
      <strong>✓ Success:</strong> Your password has been changed successfully.
    </div>

    <p>This email confirms that your account password was recently changed.</p>

    <div class="warning">
      <strong>⚠️ Didn't make this change?</strong>
      <p>If you did not authorize this password change, please contact our support team immediately. Your account may have been compromised.</p>
    </div>

    <p>For your security:</p>
    <ul>
      <li>All existing sessions have been logged out</li>
      <li>You'll need to log in again with your new password</li>
      <li>Make sure your new password is strong and unique</li>
    </ul>

    <div class="footer">
      <p>Best regards,<br>${config.EMAIL_FROM_NAME}</p>
      <p>Date: ${new Date().toLocaleString()}</p>
      <p style="color: #999;">This is an automated message, please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Verify email configuration
   */
  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      logger.info('Email service connection verified');
      return true;
    } catch (error) {
      logger.error('Email service connection failed', { error });
      return false;
    }
  }
}
