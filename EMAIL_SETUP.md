# Email Configuration Guide

## Overview

The booking system sends automatic confirmation emails to customers after a successful booking. The email includes:
- Booking confirmation details
- Booking code (HXL-XXXXXX)
- Check-in and check-out dates
- Room details
- Total amount paid
- Hotel contact information

## Email Service Setup

### Required Environment Variables

Add the following environment variables to your `.env` file:

```env
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Email Provider Configuration

#### Gmail Setup

1. **Enable 2-Step Verification** on your Google account
2. **Generate an App Password**:
   - Go to [Google Account Settings](https://myaccount.google.com/)
   - Navigate to Security → 2-Step Verification
   - Scroll down to "App passwords"
   - Generate a new app password for "Mail"
   - Use this password as `SMTP_PASS` (not your regular Gmail password)

#### Other SMTP Providers

For other email providers, update the configuration accordingly:

**Outlook/Hotmail:**
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
```

**SendGrid:**
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

**Mailgun:**
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=your-mailgun-username
SMTP_PASS=your-mailgun-password
```

### Testing Email Configuration

To test if your email configuration is working, you can:

1. Make a test booking through the application
2. Check the server logs for email sending status:
   - ✅ Success: `Booking confirmation email sent to user@example.com`
   - ❌ Error: `Error sending booking confirmation email: [error details]`

## Email Template

The email is sent in both HTML and plain text formats and includes:

- **Header**: Hotel name and booking confirmation title
- **Booking Code**: Prominently displayed (HXL-XXXXXX format)
- **Booking Details**:
  - Guest name
  - Check-in date
  - Check-out date
  - Number of nights
  - Total amount
- **Room Details**: List of all booked rooms with room numbers and categories
- **Important Information**: Instructions for check-in
- **Footer**: Hotel contact information

## Troubleshooting

### Email Not Sending

1. **Check Environment Variables**: Ensure all SMTP variables are set correctly
2. **Verify Credentials**: Double-check your email and password/app password
3. **Check Firewall**: Ensure port 587 or 465 is not blocked
4. **Review Server Logs**: Look for specific error messages in the console

### Common Errors

- **Authentication Failed**: Usually means wrong password or need to use app password
- **Connection Timeout**: Check if SMTP host and port are correct
- **TLS/SSL Error**: Try changing `SMTP_SECURE` setting (true for 465, false for 587)

### Note on Booking Failure

If the email fails to send, **the booking will still be created** in the database. The email failure is logged but does not prevent the booking from being completed. This ensures customers don't lose their bookings due to email service issues.

## Email Service File

The email service is located at: `services/email.ts`

Key functions:
- `sendBookingConfirmationEmail()`: Sends booking confirmation email with all details

## Dependencies

- `nodemailer`: Email sending library
- `@types/nodemailer`: TypeScript types for nodemailer

Install with:
```bash
npm install nodemailer @types/nodemailer
```
