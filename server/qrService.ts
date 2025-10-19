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
  private static TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

  static generateToken(attendeeId: string, eventId: string): string {
    const timestamp = Date.now();
    const nonce = crypto.randomBytes(16).toString('hex');
    const data = `${attendeeId}:${eventId}:${nonce}:${timestamp}`;
    const hmac = crypto.createHmac('sha256', this.SECRET);
    hmac.update(data);
    const signature = hmac.digest('hex');
    
    // Return format: attendeeId:eventId:nonce:timestamp.signature
    return `${data}.${signature}`;
  }

  static async generateQRCode(payload: QRCodePayload): Promise<string> {
    try {
      // Generate URL for public check-in instead of JSON data
      const baseUrl = process.env.BASE_URL || 'http://localhost:5003';
      const checkInUrl = `${baseUrl}/checkin/${payload.token}`;
      
      const qrCodeDataUrl = await QRCode.toDataURL(checkInUrl, {
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
      // Token format: attendeeId:eventId:nonce:timestamp.signature
      const [data, expectedSignature] = token.split('.');
      if (!data || !expectedSignature) {
        console.error('Invalid token format: missing data or signature');
        return false;
      }

      const parts = data.split(':');
      if (parts.length !== 4) {
        console.error('Invalid token data format: expected 4 parts, got', parts.length);
        return false;
      }

      const [tokenAttendeeId, tokenEventId, nonce, timestampStr] = parts;
      
      // Verify attendeeId and eventId match
      if (tokenAttendeeId !== attendeeId || tokenEventId !== eventId) {
        console.error('Token attendeeId or eventId mismatch');
        return false;
      }

      // Verify timestamp is valid and not expired
      const timestamp = parseInt(timestampStr, 10);
      if (isNaN(timestamp)) {
        console.error('Invalid timestamp in token');
        return false;
      }

      const now = Date.now();
      const age = now - timestamp;
      if (age > this.TOKEN_EXPIRY_MS) {
        console.error('Token expired:', { age, limit: this.TOKEN_EXPIRY_MS });
        return false;
      }

      // Verify HMAC signature
      const hmac = crypto.createHmac('sha256', this.SECRET);
      hmac.update(data);
      const actualSignature = hmac.digest('hex');

      const isValid = actualSignature === expectedSignature;
      if (!isValid) {
        console.error('Token signature verification failed');
      }

      return isValid;
    } catch (error) {
      console.error('Error verifying token:', error);
      return false;
    }
  }
}
