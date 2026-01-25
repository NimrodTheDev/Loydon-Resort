#!/usr/bin/env node

/**
 * Standalone Email Test Script
 * 
 * Usage:
 *   bun services/test-email.ts
 *   or
 *   node services/test-email.ts
 * 
 * Make sure your .env file has:
 *   SMTP_HOST=smtp.gmail.com
 *   SMTP_PORT=587
 *   SMTP_SECURE=false
 *   SMTP_USER=your-email@gmail.com
 *   SMTP_PASS=your-app-password
 */

import dotenv from "dotenv";
import nodemailer from "nodemailer";
import path from "path";
import { fileURLToPath } from "url";

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "..", ".env") });

// Get email configuration
const getEmailConfig = () => {
	return {
		host: process.env.SMTP_HOST || "smtp.gmail.com",
		port: parseInt(process.env.SMTP_PORT || "587"),
		secure: process.env.SMTP_SECURE === "true",
		auth: {
			user: process.env.SMTP_USER || "",
			pass: process.env.SMTP_PASS || "",
		},
	};
};

// Test email function
async function testEmail() {
	console.log("🧪 Email Service Test Script");
	console.log("=".repeat(50));
	console.log();

	// Step 1: Check environment variables
	console.log("📋 Step 1: Checking Environment Variables");
	console.log("-".repeat(50));
	const config = getEmailConfig();
	
	console.log(`   SMTP_HOST: ${config.host || "❌ NOT SET"}`);
	console.log(`   SMTP_PORT: ${config.port || "❌ NOT SET"}`);
	console.log(`   SMTP_SECURE: ${config.secure}`);
	console.log(`   SMTP_USER: ${config.auth.user || "❌ NOT SET"}`);
	console.log(`   SMTP_PASS: ${config.auth.pass ? "✅ SET" : "❌ NOT SET"}`);
	console.log();

	// Validate configuration
	if (!config.auth.user || !config.auth.pass) {
		console.error("❌ ERROR: SMTP_USER and SMTP_PASS must be set in .env file");
		console.error("   Please add these to your .env file:");
		console.error("   SMTP_USER=your-email@gmail.com");
		console.error("   SMTP_PASS=your-app-password");
		process.exit(1);
	}

	if (!config.host) {
		console.error("❌ ERROR: SMTP_HOST must be set");
		process.exit(1);
	}

	console.log("✅ Environment variables are set");
	console.log();

	// Step 2: Create transporter
	console.log("🔧 Step 2: Creating SMTP Transporter");
	console.log("-".repeat(50));
	
	const transporterOptions: any = {
		host: config.host,
		port: config.port,
		secure: config.secure,
		auth: config.auth,
		connectionTimeout: 10000,
		greetingTimeout: 10000,
		socketTimeout: 10000,
		requireTLS: !config.secure,
		tls: {
			rejectUnauthorized: false,
		},
	};

	// Gmail-specific settings
	if (config.host.includes("gmail.com")) {
		transporterOptions.service = "gmail";
		delete transporterOptions.host;
		delete transporterOptions.port;
	}

	const transporter = nodemailer.createTransport(transporterOptions);
	console.log("✅ Transporter created");
	console.log();

	// Step 3: Verify connection
	console.log("🔍 Step 3: Verifying SMTP Connection");
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
			console.error("   5. Test connection manually: telnet " + config.host + " " + config.port);
		}
		
		if (error.code === "EAUTH") {
			console.error("💡 Authentication failed:");
			console.error("   1. Verify SMTP_USER and SMTP_PASS are correct");
			console.error("   2. For Gmail, use an App Password (not regular password)");
			console.error("   3. Enable 2-Step Verification and generate App Password");
		}
		
		process.exit(1);
	}

	// Step 4: Get test email address
	console.log("📧 Step 4: Preparing Test Email");
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
	if (!emailRegex.test(config.auth.user)) {
		console.error("❌ ERROR: SMTP_USER is not a valid email address");
		console.error(`   Current value: "${config.auth.user}"`);
		console.error("   Please set a valid email address in .env file");
		process.exit(1);
	}

	console.log(`   From: ${config.auth.user}`);
	console.log(`   To: ${testEmail}`);
	console.log();

	// Step 5: Send test email
	console.log("📤 Step 5: Sending Test Email");
	console.log("-".repeat(50));
	
	// Use simple email format to avoid issues
	const mailOptions = {
		from: config.auth.user, // Simple format without display name
		to: testEmail,
		subject: "🧪 Test Email from HotelExpress",
		html: `
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
					<p><strong>Configuration Details:</strong></p>
					<ul>
						<li>SMTP Host: ${config.host}</li>
						<li>SMTP Port: ${config.port}</li>
						<li>Secure: ${config.secure ? "Yes (SSL/TLS)" : "No (STARTTLS)"}</li>
						<li>From: ${config.auth.user}</li>
					</ul>
					<p>If you received this email, your email service is properly configured and ready to send booking confirmations!</p>
				</div>
			</body>
			</html>
		`,
		text: `
Email Test Successful!

Congratulations! Your email service is working correctly.

This is a test email from your HotelExpress booking system.

Configuration Details:
- SMTP Host: ${config.host}
- SMTP Port: ${config.port}
- Secure: ${config.secure ? "Yes (SSL/TLS)" : "No (STARTTLS)"}
- From: ${config.auth.user}

If you received this email, your email service is properly configured and ready to send booking confirmations!
		`,
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
