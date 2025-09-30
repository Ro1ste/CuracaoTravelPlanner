import QRCode from 'qrcode';
import crypto from 'crypto';

export interface QRCodePayload {
  attendeeId: string;
  eventId: string;
  token: string;
  issuedAt: number;
}

export class QRCodeService {
  private static SECRET = process.env.SESSION_SECRET || 'default-secret-change-me';

  static generateToken(attendeeId: string, eventId: string): string {
    const nonce = crypto.randomBytes(16).toString('hex');
    const data = `${attendeeId}:${eventId}:${nonce}:${Date.now()}`;
    const hmac = crypto.createHmac('sha256', this.SECRET);
    hmac.update(data);
    return `${nonce}.${hmac.digest('hex')}`;
  }

  static async generateQRCode(payload: QRCodePayload): Promise<string> {
    try {
      const dataString = JSON.stringify(payload);
      const qrCodeDataUrl = await QRCode.toDataURL(dataString, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        width: 300,
        margin: 2,
      });
      return qrCodeDataUrl;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  static verifyToken(token: string, attendeeId: string, eventId: string): boolean {
    try {
      const [nonce, expectedHmac] = token.split('.');
      if (!nonce || !expectedHmac) return false;

      const parts = nonce.split(':');
      if (parts.length < 4) return false;

      const timestamp = parseInt(parts[3], 10);
      const data = `${attendeeId}:${eventId}:${nonce}:${timestamp}`;
      
      const hmac = crypto.createHmac('sha256', this.SECRET);
      hmac.update(data);
      const actualHmac = hmac.digest('hex');

      return actualHmac === expectedHmac;
    } catch (error) {
      console.error('Error verifying token:', error);
      return false;
    }
  }
}
