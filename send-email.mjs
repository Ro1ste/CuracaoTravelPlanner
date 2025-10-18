#!/usr/bin/env node

import 'dotenv/config';
import nodemailer from 'nodemailer';

async function sendEmail() {
  try {
    console.log('📧 Sending email to hassanejaz400@gmail.com...');
    
    // Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    
    const result = await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: 'hassanejaz400@gmail.com',
      subject: '🧪 Test Email - Curacao Travel Planner',
      text: 'This is a test email from the Curacao Travel Planner system.',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #211100;">🧪 Test Email</h2>
          <p>Hello!</p>
          <p>This is a test email from the <strong>Curacao Travel Planner</strong> system to verify that email functionality is working correctly.</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">System Information</h3>
            <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
            <p><strong>SMTP Host:</strong> ${process.env.SMTP_HOST}</p>
            <p><strong>SMTP Port:</strong> ${process.env.SMTP_PORT}</p>
            <p><strong>From:</strong> ${process.env.SMTP_FROM}</p>
          </div>
          
          <p>If you received this email, the email service is working properly! 🎉</p>
          
          <hr style="margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">
            This is an automated test email from the Curacao Travel Planner system.
          </p>
        </div>
      `
    });
    
    console.log('✅ Email sent successfully!');
    console.log('📬 Message ID:', result.messageId);
    console.log('📬 Sent to: hassanejaz400@gmail.com');
    console.log('📬 From:', process.env.SMTP_FROM);
    
  } catch (error) {
    console.error('❌ Email sending failed:', error.message);
    console.error('Full error:', error);
  }
}

sendEmail();
