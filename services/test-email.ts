#!/usr/bin/env node

/**
 * Standalone Email Test Script using MailSlurp SMTP with nodemailer
 * 
 * Usage:
 *   bun services/test-email.ts [recipient-email]
 *   or
 *   node services/test-email.ts [recipient-email]
 * 
 * Make sure your .env file has:
 *   MAILSLURP_API_KEY=your-api-key (required for MailSlurp SMTP)
 *   MAILSLURP_INBOX_ID=your-inbox-id (optional, will use default if not set)
 * 
 * Or use regular SMTP:
 *   SMTP_HOST=smtp.gmail.com
 *   SMTP_PORT=587
 *   SMTP_SECURE=false
 *   SMTP_USER=your-email@gmail.com
 *   SMTP_PASS=your-app-password
 * 
 * Optional:
 *   SMTP_USER=your-email@example.com (for "from" address)
 */

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { getEmailConfig, createTransporter } from "./email.js";

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "..", ".env") });

// Test email function
async function testEmail() {
	console.log("🧪 Email Service Test Script");
	console.log("=".repeat(50));
	console.log();

	// Step 1: Check environment variables
	console.log("📋 Step 1: Checking Environment Variables");
	console.log("-".repeat(50));
	
	const apiKey = process.env.MAILSLURP_API_KEY;
	const inboxId = process.env.MAILSLURP_INBOX_ID;
	const fromEmail = process.env.SMTP_USER || process.env.HOTEL_EMAIL || "noreply@hotel.com";
	
	console.log(`   MAILSLURP_API_KEY: ${apiKey ? "✅ SET" : "❌ NOT SET"}`);
	console.log(`   MAILSLURP_INBOX_ID: ${inboxId || "⚠️  NOT SET (will use default)"}`);
	console.log(`   SMTP_HOST: ${process.env.SMTP_HOST || "⚠️  NOT SET"}`);
	console.log(`   SMTP_USER: ${process.env.SMTP_USER || "⚠️  NOT SET"}`);
	console.log(`   From Email: ${fromEmail}`);
	console.log();

	// Validate configuration
	if (!apiKey && !process.env.SMTP_USER) {
		console.error("❌ ERROR: Either MAILSLURP_API_KEY or SMTP_USER must be set");
		console.error();
		console.error("   Option 1 - Use MailSlurp SMTP:");
		console.error("     MAILSLURP_API_KEY=your-api-key");
		console.error("     MAILSLURP_INBOX_ID=your-inbox-id (optional)");
		console.error();
		console.error("   Option 2 - Use regular SMTP:");
		console.error("     SMTP_HOST=smtp.gmail.com");
		console.error("     SMTP_PORT=587");
		console.error("     SMTP_USER=your-email@gmail.com");
		console.error("     SMTP_PASS=your-app-password");
		process.exit(1);
	}

	console.log("✅ Environment variables are set");
	console.log();

	// Step 2: Get SMTP configuration (using email.ts)
	console.log("🔧 Step 2: Getting SMTP Configuration");
	console.log("-".repeat(50));
	
	let config;
	try {
		config = await getEmailConfig();
		console.log("✅ SMTP configuration retrieved");
		console.log();
	} catch (error: any) {
		console.error("❌ Failed to get SMTP configuration");
		console.error(`   Error: ${error.message || error}`);
		if (error.statusCode === 401) {
			console.error();
			console.error("💡 Authentication failed:");
			console.error("   1. Verify your MAILSLURP_API_KEY is correct");
			console.error("   2. Check if your API key has expired");
			console.error("   3. Get a new API key from MailSlurp dashboard");
		}
		process.exit(1);
	}

	// Step 3: Create transporter (using email.ts)
	console.log("🔧 Step 3: Creating SMTP Transporter");
	console.log("-".repeat(50));
	
	let transporter;
	try {
		transporter = await createTransporter();
		console.log("✅ Transporter created");
		console.log();
	} catch (error: any) {
		console.error("❌ Failed to create transporter");
		console.error(`   Error: ${error.message || error}`);
		process.exit(1);
	}

	// Step 4: Verify connection
	console.log("🔍 Step 4: Verifying SMTP Connection");
	console.log("-".repeat(50));
	
	try {
		console.log("   Attempting to connect to SMTP server...");
		await Promise.race([
			transporter.verify(),
			new Promise((_, reject) => 
				setTimeout(() => reject(new Error("Connection timeout after 10 seconds")), 10000)
			)
		]);
		console.log("✅ SMTP connection verified successfully!");
		console.log();
	} catch (error: any) {
		console.error("❌ SMTP connection verification FAILED");
		console.error(`   Error: ${error.message || error}`);
		console.error(`   Code: ${error.code || "N/A"}`);
		console.error();
		
		if (error.code === "ETIMEDOUT" || error.message?.includes("timeout")) {
			console.error("💡 Troubleshooting:");
			console.error("   1. Check your internet connection");
			console.error("   2. Verify SMTP_HOST and SMTP_PORT are correct");
			console.error("   3. Check if firewall/VPN is blocking the connection");
			console.error("   4. Try port 465 with SMTP_SECURE=true");
		}
		
		if (error.code === "EAUTH") {
			console.error("💡 Authentication failed:");
			console.error("   1. Verify SMTP_USER and SMTP_PASS are correct");
			console.error("   2. For Gmail, use an App Password (not regular password)");
			console.error("   3. Enable 2-Step Verification and generate App Password");
		}
		
		process.exit(1);
	}

	// Step 5: Get test email address
	console.log("📧 Step 5: Preparing Test Email");
	console.log("-".repeat(50));
	
	// Get test email from command line argument or use SMTP_USER
	const testEmail = process.argv[2] || config.auth.user;
	
	if (!testEmail || !testEmail.includes("@")) {
		console.error("❌ ERROR: Invalid email address");
		console.error("   Usage: bun services/test-email.ts [recipient-email]");
		console.error("   Example: bun services/test-email.ts test@example.com");
		process.exit(1);
	}

	// Validate email format
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	if (!emailRegex.test(testEmail)) {
		console.error("❌ ERROR: Invalid email address format");
		console.error(`   Provided: "${testEmail}"`);
		console.error("   Please provide a valid email address");
		process.exit(1);
	}

	console.log(`   From: ${fromEmail}`);
	console.log(`   To: ${testEmail}`);
	console.log();

	// Step 6: Send test email
	console.log("📤 Step 6: Sending Test Email");
	console.log("-".repeat(50));
	
	const htmlContent = `
		<!DOCTYPE html>
		<html>
		<head>
			<meta charset="utf-8">
			<style>
				body {
					font-family: Arial, sans-serif;
					line-height: 1.6;
					color: #333;
					max-width: 600px;
					margin: 0 auto;
					padding: 20px;
				}
				.header {
					background-color: #4a5568;
					color: white;
					padding: 20px;
					text-align: center;
					border-radius: 8px 8px 0 0;
				}
				.content {
					background-color: #f7fafc;
					padding: 30px;
					border: 1px solid #e2e8f0;
				}
				.success {
					background-color: #c6f6d5;
					border-left: 4px solid #38a169;
					padding: 15px;
					margin: 20px 0;
					border-radius: 5px;
				}
				.info-box {
					background-color: white;
					padding: 15px;
					margin: 15px 0;
					border-radius: 5px;
					border-left: 4px solid #4a5568;
				}
			</style>
		</head>
		<body>
			<div class="header">
				<h1>✅ Email Test Successful!</h1>
			</div>
			<div class="content">
				<div class="success">
					<strong>Congratulations!</strong> Your email service is working correctly.
				</div>
				<p>This is a test email from your HotelExpress booking system.</p>
				<div class="info-box">
					<p><strong>Configuration Details:</strong></p>
					<ul>
						<li>Provider: Regular SMTP</li>
						<li>SMTP Host: ${config.host}</li>
						<li>SMTP Port: ${config.port}</li>
						<li>Secure: ${config.secure ? "Yes (SSL/TLS)" : "No (STARTTLS)"}</li>
						<li>From: ${fromEmail}</li>
						<li>To: ${testEmail}</li>
					</ul>
				</div>
				<p>If you received this email, your email service is properly configured and ready to send booking confirmations!</p>
				<p><strong>Next Steps:</strong></p>
				<ul>
					<li>Test the booking flow to ensure emails are sent automatically</li>
					<li>Monitor email delivery</li>
				</ul>
			</div>
		</body>
		</html>
	`;

	const textContent = `
Email Test Successful!

Congratulations! Your email service is working correctly.

This is a test email from your HotelExpress booking system.

Configuration Details:
- Provider: Regular SMTP
- SMTP Host: ${config.host}
- SMTP Port: ${config.port}
- Secure: ${config.secure ? "Yes (SSL/TLS)" : "No (STARTTLS)"}
- From: ${fromEmail}
- To: ${testEmail}

If you received this email, your email service is properly configured and ready to send booking confirmations!

Next Steps:
- Test the booking flow to ensure emails are sent automatically
- Monitor email delivery
	`;

	const mailOptions = {
		from: fromEmail,
		to: testEmail,
		subject: "🧪 Test Email from HotelExpress",
		html: htmlContent,
		text: textContent,
	};

	try {
		const info = await transporter.sendMail(mailOptions);
		console.log("✅ Test email sent successfully!");
		console.log();
		console.log("📬 Email Details:");
		console.log(`   Message ID: ${info.messageId}`);
		console.log(`   Response: ${info.response || "N/A"}`);
		console.log();
		console.log("🎉 SUCCESS! Check your inbox (and spam folder) for the test email.");
		console.log();
		console.log("=".repeat(50));
		console.log("✅ All tests passed! Email service is working correctly.");
		console.log("=".repeat(50));
	} catch (error: any) {
		console.error("❌ Failed to send test email");
		console.error(`   Error: ${error.message || error}`);
		console.error(`   Code: ${error.code || "N/A"}`);
		if (error.response) {
			console.error(`   SMTP Response: ${error.response}`);
		}
		console.error();
		console.error("💡 Check the error above and verify your SMTP settings");
		process.exit(1);
	}
}

// Run the test
testEmail().catch((error) => {
	console.error("❌ Unexpected error:", error);
	process.exit(1);
});
