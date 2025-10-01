export interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
  qrCodeDataUrl?: string;
}

export class EmailService {
  private static RESEND_API_KEY = process.env.RESEND_API_KEY;
  private static FROM_EMAIL = 'onboarding@resend.dev';

  static async sendEmail(options: EmailOptions): Promise<void> {
    if (!this.RESEND_API_KEY) {
      console.error('RESEND_API_KEY not configured');
      throw new Error('Email service not configured');
    }

    try {
      let htmlContent = options.html || `<p>${options.text}</p>`;
      
      if (options.qrCodeDataUrl) {
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

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: this.FROM_EMAIL,
          to: [options.to],
          subject: options.subject,
          html: htmlContent,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Resend API error:', errorData);
        throw new Error(`Failed to send email: ${errorData.message || response.statusText}`);
      }

      const data = await response.json();
      console.log('Email sent successfully:', data.id);
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
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
