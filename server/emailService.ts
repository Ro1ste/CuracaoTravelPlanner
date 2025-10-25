import 'dotenv/config';
import nodemailer from 'nodemailer';

export interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
  qrCodeDataUrl?: string;
}

export class EmailService {
  private static SMTP_HOST = process.env.SMTP_HOST || 'smtp.hostinger.com';
  private static SMTP_PORT = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
  private static SMTP_USER = process.env.SMTP_USER || 'info@curacaointernationsportsweek.com';
  private static SMTP_PASS = process.env.SMTP_PASS || 'Zait@1234';
  private static FROM_EMAIL = process.env.SMTP_FROM || 'info@curacaointernationsportsweek.com';

  static async sendEmail(options: EmailOptions): Promise<void> {
    const transporter = nodemailer.createTransport({
      host: this.SMTP_HOST,
      port: this.SMTP_PORT,
      secure: this.SMTP_PORT === 465,
      auth: {
        user: this.SMTP_USER,
        pass: this.SMTP_PASS,
      },
    });

    let htmlContent = options.html || `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;"><p>${options.text.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>')}</p></div>`;
    const attachments: { filename: string; content: Buffer; cid: string }[] = [];

    if (options.qrCodeDataUrl) {
      const match = options.qrCodeDataUrl.match(/^data:image\/(png|jpeg);base64,(.+)$/);
      if (match) {
        const mime = match[1];
        const base64 = match[2];
        const filename = `qr-code.${mime === 'jpeg' ? 'jpg' : 'png'}`;
        attachments.push({ filename, content: Buffer.from(base64, 'base64'), cid: 'qr-code' });
        htmlContent += `
          <div style="margin-top: 30px; text-align: center;">
            <h3 style="margin-bottom: 20px; color: #333; font-size: 18px;">Your Event QR Code</h3>
            <img src="cid:qr-code" alt="QR Code" style="max-width: 300px; display: block; margin: 0 auto 20px auto;" />
            <p style="margin-top: 20px; font-size: 12px; color: #666; line-height: 1.4;">
              You can also show this QR code to event staff for manual check-in.
            </p>
          </div>
        `;
      }
    }

    await transporter.sendMail({
      from: this.FROM_EMAIL,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: htmlContent,
      attachments,
    });

    console.log('✅ Email sent via SMTP', {
      to: options.to,
      subject: options.subject,
      hasQRCode: !!options.qrCodeDataUrl,
    });
  }

  static getDefaultTemplate(eventTitle: string, attendeeName: string): { subject: string; text: string } {
    return {
      subject: `Your Registration for ${eventTitle} is Approved!`,
      text: `Dear ${attendeeName},\n\nYour registration for ${eventTitle} has been approved!\n\nPlease find your QR code below. You'll need to present this at the event for check-in.\n\nWe look forward to seeing you!\n\nBest regards,\nFDDK Team`
    };
  }

  static formatEmailText(text: string): string {
    // Convert line breaks to proper formatting
    return text
      .replace(/\n\n/g, '\n\n') // Preserve double line breaks for paragraphs
      .replace(/\n/g, '\n') // Preserve single line breaks
      .trim();
  }

  async sendAdminWelcomeEmail(to: string, name: string, email: string, temporaryPassword: string): Promise<void> {
    const subject = 'Welcome to FDDK Admin Portal';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #211100;">Welcome to FDDK Admin Portal</h2>
        <p>Hi ${name},</p>
        <p>An administrator account has been created for you. You can now access the FDDK Corporate Wellness & Event Management Platform with admin privileges.</p>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Your Login Credentials</h3>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Temporary Password:</strong> ${temporaryPassword}</p>
        </div>
        
        <p><strong>Important:</strong> Please change your password after your first login for security purposes.</p>
        
        <p>You can access the admin portal at the login page and use these credentials to sign in.</p>
        
        <p>If you have any questions or need assistance, please don't hesitate to reach out.</p>
        
        <p>Best regards,<br/>FDDK Team</p>
      </div>
    `;
    
    const text = `Welcome to FDDK Admin Portal\n\nHi ${name},\n\nAn administrator account has been created for you.\n\nYour Login Credentials:\nEmail: ${email}\nTemporary Password: ${temporaryPassword}\n\nImportant: Please change your password after your first login for security purposes.\n\nBest regards,\nFDDK Team`;

    await EmailService.sendEmail({
      to,
      subject,
      text,
      html,
    });
  }

  async sendPasswordResetEmail(to: string, name: string, resetToken: string, resetUrl: string): Promise<void> {
    const subject = 'Password Reset Request - FDDK Platform';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #211100; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">FDDK Platform</h1>
          <p style="margin: 5px 0 0 0;">Password Reset Request</p>
        </div>
        <div style="padding: 20px; line-height: 1.6;">
          <p>Hi ${name},</p>
          <p>We received a request to reset your password for your FDDK Platform account.</p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <h3 style="margin-top: 0; color: #211100;">Reset Your Password</h3>
            <a href="${resetUrl}" style="display: inline-block; background-color: #211100; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Reset Password</a>
          </div>
          
          <p><strong>Or copy and paste this link into your browser:</strong></p>
          <p style="word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 4px; font-family: monospace;">${resetUrl}</p>
          
          <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0;"><strong>⚠️ Important Security Information:</strong></p>
            <ul style="margin: 10px 0 0 0; padding-left: 20px;">
              <li>This link will expire in 1 hour for security reasons</li>
              <li>If you didn't request this password reset, please ignore this email</li>
              <li>Your password will not be changed until you click the link above</li>
            </ul>
          </div>
          
          <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
          
          <p>Best regards,<br/>FDDK Team</p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 0.8em; color: #666;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
      </div>
    `;
    
    const text = `Password Reset Request - FDDK Platform\n\nHi ${name},\n\nWe received a request to reset your password for your FDDK Platform account.\n\nTo reset your password, please click the following link:\n${resetUrl}\n\nThis link will expire in 1 hour for security reasons.\n\nIf you didn't request this password reset, please ignore this email.\n\nBest regards,\nFDDK Team`;

    await EmailService.sendEmail({
      to,
      subject,
      text,
      html,
    });
  }

  async sendCompanyRemovalNotification(to: string, companyName: string, deletedData: any): Promise<void> {
    const subject = 'Account Removal Notice - FDDK Platform';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #dc3545; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">FDDK Platform</h1>
          <p style="margin: 5px 0 0 0;">Account Removal Notice</p>
        </div>
        <div style="padding: 20px; line-height: 1.6;">
          <p>Dear ${companyName} Team,</p>
          <p>We are writing to inform you that your company account has been removed from the FDDK Corporate Wellness & Event Management Platform.</p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #dc3545;">Account Details Removed:</h3>
            <ul style="margin: 10px 0 0 0; padding-left: 20px;">
              <li><strong>Company:</strong> ${deletedData.company.name}</li>
              <li><strong>Email:</strong> ${deletedData.company.email}</li>
              <li><strong>Total Points Earned:</strong> ${deletedData.company.totalPoints || 0}</li>
              <li><strong>Total Calories Burned:</strong> ${deletedData.company.totalCaloriesBurned || 0}</li>
              <li><strong>Proof Submissions:</strong> ${deletedData.proofsDeleted} submissions removed</li>
              <li><strong>User Account:</strong> ${deletedData.userDeleted ? 'Removed' : 'Not found'}</li>
            </ul>
          </div>
          
          <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0;"><strong>⚠️ Important Information:</strong></p>
            <ul style="margin: 10px 0 0 0; padding-left: 20px;">
              <li>All your company data has been permanently deleted from our system</li>
              <li>You will no longer be able to access the platform with this account</li>
              <li>All associated proof submissions and points have been removed</li>
              <li>This action cannot be undone</li>
            </ul>
          </div>
          
          <p>If you believe this removal was made in error or if you have any questions, please contact our support team immediately.</p>
          
          <p>We thank you for your participation in the FDDK Corporate Wellness Program.</p>
          
          <p>Best regards,<br/>FDDK Team</p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 0.8em; color: #666;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
      </div>
    `;
    
    const text = `Account Removal Notice - FDDK Platform\n\nDear ${companyName} Team,\n\nWe are writing to inform you that your company account has been removed from the FDDK Corporate Wellness & Event Management Platform.\n\nAccount Details Removed:\n- Company: ${deletedData.company.name}\n- Email: ${deletedData.company.email}\n- Total Points Earned: ${deletedData.company.totalPoints || 0}\n- Total Calories Burned: ${deletedData.company.totalCaloriesBurned || 0}\n- Proof Submissions: ${deletedData.proofsDeleted} submissions removed\n- User Account: ${deletedData.userDeleted ? 'Removed' : 'Not found'}\n\nImportant Information:\n- All your company data has been permanently deleted from our system\n- You will no longer be able to access the platform with this account\n- All associated proof submissions and points have been removed\n- This action cannot be undone\n\nIf you believe this removal was made in error or if you have any questions, please contact our support team immediately.\n\nWe thank you for your participation in the FDDK Corporate Wellness Program.\n\nBest regards,\nFDDK Team`;

    await EmailService.sendEmail({
      to,
      subject,
      text,
      html,
    });
  }
}