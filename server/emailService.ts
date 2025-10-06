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
  // Prefer server-side envs; fall back to VITE_ for compatibility
  private static SMTP_HOST = process.env.SMTP_HOST || process.env.VITE_SMTP_HOST;
  private static SMTP_PORT = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : (process.env.VITE_SMTP_PORT ? Number(process.env.VITE_SMTP_PORT) : 587);
  private static SMTP_USER = process.env.SMTP_USER || process.env.VITE_SMTP_USER;
  private static SMTP_PASS = process.env.SMTP_PASS || process.env.VITE_SMTP_PASS;
  private static FROM_EMAIL = process.env.SMTP_FROM || process.env.VITE_SMTP_FROM || process.env.SMTP_USER || process.env.VITE_SMTP_USER || 'no-reply@localhost';

  private static ensureConfigured(): void {
    if (!this.SMTP_HOST || !this.SMTP_PORT || !this.SMTP_USER || !this.SMTP_PASS) {
      throw new Error('SMTP not configured. Please set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS (and optionally SMTP_FROM) in .env');
    }
  }

  static async sendEmail(options: EmailOptions): Promise<void> {
    this.ensureConfigured();

    const transporter = nodemailer.createTransport({
      host: this.SMTP_HOST,
      port: this.SMTP_PORT!,
      secure: this.SMTP_PORT === 465, // true for 465, false for others
      auth: {
        user: this.SMTP_USER!,
        pass: this.SMTP_PASS!,
      },
    });

    let htmlContent = options.html || `<p>${options.text}</p>`;

    const attachments: { filename: string; content: Buffer; cid: string }[] = [];

    if (options.qrCodeDataUrl) {
      const match = options.qrCodeDataUrl.match(/^data:image\/(png|jpeg);base64,(.+)$/);
      if (match) {
        const mime = match[1];
        const base64 = match[2];
        const filename = `qr-code.${mime === 'jpeg' ? 'jpg' : 'png'}`;
        attachments.push({ filename, content: Buffer.from(base64, 'base64'), cid: 'qr-code' });
        htmlContent += `
          <div style="margin-top: 20px; text-align: center;">
            <h3>Your Event QR Code</h3>
            <img src="cid:qr-code" alt="QR Code" style="max-width: 300px; display: block; margin: 0 auto;" />
            <p style="margin-top: 10px; font-size: 12px; color: #;">
              Present this QR code at the event for check-in
            </p>
          </div>
        `;
      } else {
        // Fallback to data URL if parsing failed
        htmlContent += `
          <div style="margin-top: 20px; text-align: center;">
            <h3>Your Event QR Code</h3>
            <img src="${options.qrCodeDataUrl}" alt="QR Code" style="max-width: 300px;" />
            <p style="margin-top: 10px; font-size: 12px; color: #666;">
              Present this QR code at the event for check-in
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
      timestamp: new Date().toISOString(),
    });
  }

  static getDefaultTemplate(eventTitle: string, attendeeName: string): { subject: string; text: string } {
    return {
      subject: `Your Registration for ${eventTitle} is Approved!`,
      text: `Dear ${attendeeName},\n\nYour registration for ${eventTitle} has been approved!\n\nPlease find your QR code below. You'll need to present this at the event for check-in.\n\nWe look forward to seeing you!\n\nBest regards,\nFDDK Team`
    };
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
}
