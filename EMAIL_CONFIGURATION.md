# 📧 Email Configuration Guide for EISW System

## 🔧 Current Setup

The EISW system supports both **Mock Email Mode** (for development) and **Real Email Mode** (for production). The system automatically detects which mode to use based on your configuration.

## 📋 Configuration Options

### **Option 1: Resend (Recommended - Easy Setup)**

**Step 1: Get Resend API Key**
1. Go to [https://resend.com](https://resend.com)
2. Sign up for a free account
3. Go to API Keys section
4. Create a new API key
5. Copy the API key

**Step 2: Configure Environment Variables**
```bash
# In your .env file
RESEND_API_KEY=re_1234567890abcdef  # Your actual Resend API key
```

**Step 3: Verify Domain (Optional)**
- Resend allows sending from `onboarding@resend.dev` for testing
- For production, verify your domain in Resend dashboard
- Update `FROM_EMAIL` in `server/emailService.ts` to your verified domain

### **Option 2: SMTP (Gmail, Outlook, etc.)**

**Step 1: Enable App Passwords**
- Gmail: Enable 2FA, then create App Password
- Outlook: Enable 2FA, then create App Password

**Step 2: Configure Environment Variables**
```bash
# In your .env file
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=your-email@gmail.com
```

**Step 3: Update Email Service**
You'll need to modify `server/emailService.ts` to use SMTP instead of Resend API.

### **Option 3: SendGrid**

**Step 1: Get SendGrid API Key**
1. Go to [https://sendgrid.com](https://sendgrid.com)
2. Sign up for free account
3. Create API key in Settings > API Keys

**Step 2: Configure Environment Variables**
```bash
# In your .env file
SENDGRID_API_KEY=SG.your-sendgrid-api-key
SENDGRID_FROM_EMAIL=your-verified-email@yourdomain.com
```

## 🚀 Quick Setup (Resend - Recommended)

### **1. Get Resend API Key**
```bash
# Visit: https://resend.com/api-keys
# Create new API key
# Copy the key (starts with 're_')
```

### **2. Update .env File**
```bash
# Replace this line in your .env file:
RESEND_API_KEY=your_resend_api_key_here

# With your actual API key:
RESEND_API_KEY=re_1234567890abcdef
```

### **3. Restart Server**
```bash
npm run dev
```

### **4. Test Email**
- Register for an event
- Admin approves the registration
- Check console logs for email sending status
- Check recipient's email inbox

## 📧 Email Types Sent by EISW System

### **1. Event Registration Approval**
- **Trigger:** Admin approves event registration
- **Recipient:** Event attendee
- **Content:** QR code for event entry
- **Subject:** "Your Registration for [Event Name] is Approved!"

### **2. Admin Welcome Email**
- **Trigger:** New admin account created
- **Recipient:** New admin user
- **Content:** Login credentials
- **Subject:** "Welcome to EISW Admin Portal"

### **3. QR Code Resend**
- **Trigger:** Admin resends QR code
- **Recipient:** Event attendee
- **Content:** QR code for event entry
- **Subject:** "Your Event QR Code - Resent"

## 🔍 Troubleshooting

### **Mock Mode (Development)**
```bash
# If you see this in console:
📧 EMAIL SENT (Mock Mode)
✅ Email sent successfully (Mock Mode)

# This means emails are being logged but not sent
# Configure RESEND_API_KEY to enable real emails
```

### **Real Email Mode (Production)**
```bash
# If you see this in console:
✅ Email sent successfully via Resend: re_1234567890

# This means emails are being sent successfully
# Check recipient's inbox (including spam folder)
```

### **Common Issues**

**1. "Failed to send email" Error**
- Check API key is correct
- Verify domain is verified in Resend
- Check API key permissions

**2. Emails Going to Spam**
- Verify your domain in Resend
- Use a professional FROM_EMAIL address
- Add SPF/DKIM records to your domain

**3. Rate Limiting**
- Resend free tier: 3,000 emails/month
- Upgrade plan for higher limits

## 📊 Email Monitoring

### **Console Logs**
The system logs all email activity:
```bash
📧 Email Details: {
  to: "attendee@company.com",
  subject: "Your Registration for EISW 2025 is Approved!",
  hasQRCode: true,
  timestamp: "2025-01-06T10:30:00.000Z"
}
```

### **Resend Dashboard**
- View email delivery status
- Check bounce rates
- Monitor email performance

## 🎯 Production Checklist

- [ ] Get Resend API key
- [ ] Update .env with real API key
- [ ] Verify domain in Resend (optional)
- [ ] Test email sending
- [ ] Monitor email delivery
- [ ] Set up email monitoring/alerts

## 📞 Support

If you need help with email configuration:
1. Check console logs for error messages
2. Verify API key is correct
3. Test with a simple email first
4. Check Resend dashboard for delivery status

---

**Current Status:** Mock Mode (emails logged to console)
**To Enable Real Emails:** Set `RESEND_API_KEY` in .env file
