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

export interface ContactMessageNotificationOptions {
  messageId: string;
  senderName: string;
  senderEmail: string;
  message: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

export interface NewsletterWelcomeOptions {
  email: string;
  unsubscribeToken: string;
}

export interface NewsletterCampaignOptions {
  email: string;
  subject: string;
  content: string;
  htmlContent: string;
  unsubscribeToken: string;
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
   * Send contact form notification to admin
   */
  async sendContactNotification(options: ContactMessageNotificationOptions): Promise<void> {
    const { messageId, senderName, senderEmail, message, ipAddress, userAgent, createdAt } = options;

    const mailOptions = {
      from: `"${config.EMAIL_FROM_NAME}" <${config.EMAIL_FROM}>`,
      to: config.ADMIN_EMAIL,
      replyTo: senderEmail,
      subject: `New Contact Message from ${senderName}`,
      html: this.getContactNotificationEmailTemplate(options),
      text: `
New Contact Message Received

From: ${senderName} <${senderEmail}>
Date: ${createdAt.toLocaleString()}
Message ID: ${messageId}

Message:
${message}

${ipAddress ? `IP Address: ${ipAddress}` : ''}
${userAgent ? `User Agent: ${userAgent}` : ''}

---
This is an automated notification from the contact form.
      `.trim(),
    };

    try {
      await this.transporter.sendMail(mailOptions);
      logger.info('Contact notification email sent to admin', { messageId, senderEmail });
    } catch (error) {
      logger.error('Failed to send contact notification email', { messageId, error });
      // Don't throw error - message is already saved in database
      logger.warn('Contact message saved but admin notification email failed', { messageId });
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
   * HTML template for contact notification email
   */
  private getContactNotificationEmailTemplate(options: ContactMessageNotificationOptions): string {
    const { messageId, senderName, senderEmail, message, ipAddress, userAgent, createdAt } = options;

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Contact Message</title>
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
    .header {
      background-color: #007bff;
      color: white;
      padding: 20px;
      border-radius: 8px 8px 0 0;
      margin: -30px -30px 20px -30px;
    }
    .info-row {
      display: flex;
      padding: 10px 0;
      border-bottom: 1px solid #ddd;
    }
    .info-label {
      font-weight: bold;
      width: 120px;
      color: #666;
    }
    .info-value {
      flex: 1;
    }
    .message-box {
      background-color: white;
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 15px;
      margin: 20px 0;
      white-space: pre-wrap;
      word-wrap: break-word;
    }
    .metadata {
      background-color: #f0f0f0;
      padding: 12px;
      border-radius: 4px;
      margin: 20px 0;
      font-size: 12px;
      color: #666;
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
    <div class="header">
      <h2 style="margin: 0;">📧 New Contact Message</h2>
    </div>

    <div class="info-row">
      <div class="info-label">From:</div>
      <div class="info-value">${senderName}</div>
    </div>

    <div class="info-row">
      <div class="info-label">Email:</div>
      <div class="info-value"><a href="mailto:${senderEmail}">${senderEmail}</a></div>
    </div>

    <div class="info-row">
      <div class="info-label">Date:</div>
      <div class="info-value">${createdAt.toLocaleString()}</div>
    </div>

    <div class="info-row" style="border-bottom: none;">
      <div class="info-label">Message ID:</div>
      <div class="info-value" style="font-family: monospace; font-size: 11px;">${messageId}</div>
    </div>

    <h3 style="margin-top: 25px; margin-bottom: 10px;">Message:</h3>
    <div class="message-box">${message}</div>

    ${ipAddress || userAgent ? `
    <div class="metadata">
      <strong>Metadata:</strong><br>
      ${ipAddress ? `IP Address: ${ipAddress}<br>` : ''}
      ${userAgent ? `User Agent: ${userAgent}` : ''}
    </div>
    ` : ''}

    <p style="margin-top: 20px;">
      <strong>💡 Tip:</strong> You can reply directly to this email to respond to ${senderName}.
    </p>

    <div class="footer">
      <p style="color: #999;">This is an automated notification from the contact form.</p>
      <p style="color: #999;">Kemetra Portal - ${config.EMAIL_FROM_NAME}</p>
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Send newsletter welcome email
   */
  async sendNewsletterWelcome(email: string, unsubscribeToken: string): Promise<void> {
    // Use API endpoint directly for unsubscribe (will work without frontend page)
    const unsubscribeUrl = `${config.API_URL}/api/v1/portal/newsletter/unsubscribe?token=${unsubscribeToken}`;

    const mailOptions = {
      from: `"${config.EMAIL_FROM_NAME}" <${config.EMAIL_FROM}>`,
      to: email,
      subject: 'Welcome to Kemetra Newsletter',
      html: this.getNewsletterWelcomeTemplate(unsubscribeUrl),
      text: `Welcome to Kemetra Newsletter! You've been successfully subscribed.\n\nUnsubscribe: ${unsubscribeUrl}`,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      logger.info('Newsletter welcome email sent', { email });
    } catch (error) {
      logger.error('Failed to send newsletter welcome email', { email, error });
    }
  }

  /**
   * Send newsletter campaign email
   */
  async sendNewsletterCampaign(options: NewsletterCampaignOptions): Promise<void> {
    const { email, subject, content, htmlContent, unsubscribeToken } = options;

    // Use API endpoint directly for unsubscribe (will work without frontend page)
    // Frontend can implement a nicer unsubscribe page at /newsletter/unsubscribe later
    const unsubscribeUrl = `${config.API_URL}/api/v1/portal/newsletter/unsubscribe?token=${unsubscribeToken}`;
    const finalHtmlContent = this.addUnsubscribeLinkToNewsletter(htmlContent, unsubscribeUrl);

    const mailOptions = {
      from: `"${config.EMAIL_FROM_NAME}" <${config.EMAIL_FROM}>`,
      to: email,
      subject: subject,
      html: finalHtmlContent,
      text: content + `\n\nUnsubscribe: ${unsubscribeUrl}`,
    };

    await this.transporter.sendMail(mailOptions);
  }

  /**
   * HTML template for newsletter welcome email
   */
  private getNewsletterWelcomeTemplate(unsubscribeUrl: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Kemetra Newsletter</title>
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
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      font-size: 12px;
      color: #666;
    }
    a {
      color: #007bff;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="container">
    <h2>Welcome to Kemetra Newsletter!</h2>
    <p>Thank you for subscribing to our newsletter. You'll receive updates about ancient Egyptian monuments, discoveries, and historical insights.</p>
    <p>Our newsletters are sent monthly with curated content featuring:</p>
    <ul>
      <li>Monument of the Month deep-dives</li>
      <li>Recent additions to our database</li>
      <li>Historical spotlights on eras and dynasties</li>
      <li>Fascinating facts about Ancient Egypt</li>
    </ul>
    <p>If you wish to unsubscribe at any time, click <a href="${unsubscribeUrl}">here</a>.</p>
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
   * Add unsubscribe link to newsletter HTML content
   */
  private addUnsubscribeLinkToNewsletter(htmlContent: string, unsubscribeUrl: string): string {
    // First, try to replace the {{unsubscribe_url}} placeholder if it exists
    const result = htmlContent.replace(/\{\{unsubscribe_url\}\}/gi, unsubscribeUrl);

    // If the placeholder was found and replaced, return the result
    if (result !== htmlContent) {
      return result;
    }

    // Otherwise, append the footer as a fallback (for legacy templates)
    const footer = `
    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; font-size: 12px; color: #666;">
      <p>You're receiving this email because you subscribed to ${config.EMAIL_FROM_NAME} newsletter.</p>
      <p><a href="${unsubscribeUrl}" style="color: #007bff; text-decoration: none;">Unsubscribe</a></p>
    </div>
  `;

    if (htmlContent.includes('</body>')) {
      return htmlContent.replace('</body>', `${footer}</body>`);
    }
    return htmlContent + footer;
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
