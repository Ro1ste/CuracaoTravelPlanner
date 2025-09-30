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
}
