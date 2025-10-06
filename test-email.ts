#!/usr/bin/env tsx
/**
 * Test Email System
 * 
 * This script tests the email system with QR codes.
 */

import { EmailService } from './server/emailService';
import { QRCodeService } from './server/qrService';
import dotenv from 'dotenv';

dotenv.config();

async function testEmailSystem() {
  try {
    console.log('🧪 Testing Email System with QR Code...\n');
    
    // Generate a test QR code
    const testPayload = {
      attendeeId: 'test-attendee-123',
      eventId: 'test-event-456',
      token: QRCodeService.generateToken('test-attendee-123', 'test-event-456'),
      issuedAt: Date.now(),
    };
    
    const qrCodeDataUrl = await QRCodeService.generateQRCode(testPayload);
    console.log('✅ QR Code generated successfully');
    console.log('📊 QR Code size:', qrCodeDataUrl.length, 'characters');
    
    // Test email with QR code
    const emailOptions = {
      to: 'test@example.com',
      subject: 'Test Event Registration - QR Code Included',
      text: 'Dear Test User,\n\nYour registration for Test Event has been approved!\n\nPlease find your QR code below. You\'ll need to present this at the event for check-in.\n\nWe look forward to seeing you!\n\nBest regards,\nFDDK Team',
      qrCodeDataUrl: qrCodeDataUrl
    };
    
    console.log('\n📧 Sending test email...');
    await EmailService.sendEmail(emailOptions);
    
    console.log('\n✅ Email system test completed successfully!');
    console.log('📝 Check the server logs above to see the email details.');
    
  } catch (error: any) {
    console.error('\n❌ Error testing email system:', error.message);
    console.error('\nFull error:', error);
  }
}

testEmailSystem();
