import nodemailer from "nodemailer";

import { getHotelInfo } from "../db/queries.js";

// Check if MailSlurp should be used for SMTP credentials



// Get email configuration from environment variables or MailSlurp
export const getEmailConfig = async () => {
	
	// Fallback to regular SMTP configuration
	return {
		host: process.env.SMTP_HOST || "smtp.gmail.com",
		port: parseInt(process.env.SMTP_PORT || "465"),
		secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
		auth: {
			user: process.env.SMTP_USER || "",
			pass: process.env.SMTP_PASS || "",
		},
	};
};

// Create reusable transporter
export const createTransporter = async () => {
	const config = await getEmailConfig();
	
	// Connection options with timeouts to avoid hanging / unexpected socket close
	const transporterOptions: any = {
		host: config.host,
		port: config.port,
		secure: config.secure, // true for 465, false for other ports
		auth: config.auth,
		connectionTimeout: 10000,   // 10s to establish connection
		greetingTimeout: 10000,     // 10s for server greeting
		socketTimeout: 15000,       // 15s for socket inactivity (prevents stale connections)
		pool: false,               // one-off connection per send, less chance of socket close
	};

	return nodemailer.createTransport(transporterOptions);
};

export interface BookingEmailData {
	guestName: string;
	guestEmail: string;
	bookingCode: string;
	checkInDate: string;
	checkOutDate: string;
	totalPrice: number;
	roomDetails: Array<{
		roomNumber: number;
		roomCategory: string;
	}>;
}


export const sendBookingConfirmationEmail = async (
	bookingData: BookingEmailData
): Promise<boolean> => {
	try {
		const hotelInfo = await getHotelInfo();
		const hotelName = hotelInfo?.name || "Loydon Resort";
		let hotelEmail = hotelInfo?.email || process.env.SMTP_USER || "";
		const hotelPhone = hotelInfo?.phone || "";
		
		// If using MailSlurp, try to get the inbox email address

		// Calculate number of nights
		const checkIn = new Date(bookingData.checkInDate);
		const checkOut = new Date(bookingData.checkOutDate);
		const nights = Math.ceil(
			(checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
		);

		// Format dates
		const formatDate = (dateString: string) => {
			const date = new Date(dateString);
			return date.toLocaleDateString("en-US", {
				weekday: "long",
				year: "numeric",
				month: "long",
				day: "numeric",
			});
		};

		// Generate room list HTML
		const roomListHTML = bookingData.roomDetails
			.map(
				(room) =>
					`<li style="margin-bottom: 8px;">Room ${room.roomNumber} - ${room.roomCategory}</li>`
			)
			.join("");

		// Generate HTML content
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
					.booking-code {
						background-color: #2d3748;
						color: white;
						padding: 15px;
						text-align: center;
						font-size: 24px;
						font-weight: bold;
						border-radius: 5px;
						margin: 20px 0;
						letter-spacing: 2px;
					}
					.info-section {
						background-color: white;
						padding: 20px;
						margin: 15px 0;
						border-radius: 5px;
						border-left: 4px solid #4a5568;
					}
					.info-row {
						display: flex;
						justify-content: space-between;
						padding: 8px 0;
						border-bottom: 1px solid #e2e8f0;
					}
					.info-row:last-child {
						border-bottom: none;
					}
					.label {
						font-weight: bold;
						color: #4a5568;
					}
					.value {
						color: #2d3748;
					}
					.footer {
						text-align: center;
						padding: 20px;
						color: #718096;
						font-size: 14px;
						border-top: 1px solid #e2e8f0;
						margin-top: 20px;
					}
					.important {
						background-color: #fed7d7;
						border-left: 4px solid #e53e3e;
						padding: 15px;
						margin: 20px 0;
						border-radius: 5px;
					}
				</style>
			</head>
			<body>
				<div class="header">
					<h1>${hotelName}</h1>
					<p>Booking Confirmation</p>
				</div>
				
				<div class="content">
					<p>Dear ${bookingData.guestName},</p>
					
					<p>Thank you for your booking! We are delighted to confirm your reservation.</p>
					
					<div class="booking-code">
						Your Booking Code: ${bookingData.bookingCode}
					</div>
					
					<div class="important">
						<strong>Please keep this booking code safe!</strong> You will need it when you check in.
					</div>
					
					<div class="info-section">
						<h3 style="margin-top: 0; color: #2d3748;">Booking Details</h3>
						<div class="info-row">
							<span class="label">Guest Name:</span>
							<span class="value">${bookingData.guestName}</span>
						</div>
						<div class="info-row">
							<span class="label">Check-in Date:</span>
							<span class="value">${formatDate(bookingData.checkInDate)}</span>
						</div>
						<div class="info-row">
							<span class="label">Check-out Date:</span>
							<span class="value">${formatDate(bookingData.checkOutDate)}</span>
						</div>
						<div class="info-row">
							<span class="label">Number of Nights:</span>
							<span class="value">${nights} night${nights > 1 ? "s" : ""}</span>
						</div>
						<div class="info-row">
							<span class="label">Total Amount:</span>
							<span class="value" style="font-weight: bold; color: #2d3748;">₦${bookingData.totalPrice.toLocaleString()}</span>
						</div>
					</div>
					
					<div class="info-section">
						<h3 style="margin-top: 0; color: #2d3748;">Room Details</h3>
						<ul style="list-style: none; padding: 0;">
							${roomListHTML}
						</ul>
					</div>
					
					<div class="info-section">
						<h3 style="margin-top: 0; color: #2d3748;">Important Information</h3>
						<ul style="color: #4a5568;">
							<li>Please arrive at the hotel on your check-in date</li>
							<li>Have your booking code (${bookingData.bookingCode}) ready for check-in</li>
							<li>If you have any questions or need to modify your booking, please contact us</li>
						</ul>
					</div>
				</div>
				
				<div class="footer">
					<p>We look forward to welcoming you!</p>
					${hotelPhone ? `<p>Phone: ${hotelPhone}</p>` : ""}
					${hotelEmail ? `<p>Email: ${hotelEmail}</p>` : ""}
					<p style="margin-top: 20px;">
						<strong>${hotelName}</strong>
					</p>
				</div>
			</body>
			</html>
		`;

		// Generate text content
		const textContent = `
Booking Confirmation - ${bookingData.bookingCode}

Dear ${bookingData.guestName},

Thank you for your booking! We are delighted to confirm your reservation.

YOUR BOOKING CODE: ${bookingData.bookingCode}
Please keep this booking code safe! You will need it when you check in.

BOOKING DETAILS:
- Guest Name: ${bookingData.guestName}
- Check-in Date: ${formatDate(bookingData.checkInDate)}
- Check-out Date: ${formatDate(bookingData.checkOutDate)}
- Number of Nights: ${nights} night${nights > 1 ? "s" : ""}
- Total Amount: ₦${bookingData.totalPrice.toLocaleString()}

ROOM DETAILS:
${bookingData.roomDetails
	.map((room) => `- Room ${room.roomNumber} - ${room.roomCategory}`)
	.join("\n")}

IMPORTANT INFORMATION:
- Please arrive at the hotel on your check-in date
- Have your booking code (${bookingData.bookingCode}) ready for check-in
- If you have any questions or need to modify your booking, please contact us

We look forward to welcoming you!

${hotelName}
${hotelPhone ? `Phone: ${hotelPhone}` : ""}
${hotelEmail ? `Email: ${hotelEmail}` : ""}
		`;

		// Get email configuration (from MailSlurp or environment variables)
		const config = await getEmailConfig();
		
		// Log email configuration (without password)
		
		console.log("📧 Using SMTP (nodemailer) for email delivery");
		
		console.log("📧 Email Configuration:");
		console.log(`   Host: ${config.host}`);
		console.log(`   Port: ${config.port}`);
		console.log(`   Secure: ${config.secure}`);
		console.log(`   User: ${config.auth.user || "NOT SET"}`);
		console.log(`   Password: ${config.auth.pass ? "***SET***" : "NOT SET"}`);
		console.log(`   Recipient: ${bookingData.guestEmail}`);

		if (!config.auth.user || !config.auth.pass) {
			console.error("❌ SMTP credentials not configured!");
				console.error("   Please set SMTP_USER and SMTP_PASS environment variables");
				console.error("   Or set MAILSLURP_API_KEY to use MailSlurp SMTP server");
			return false;
		}

		if (!hotelEmail) {
			console.error("❌ Hotel email not configured!");
			console.error("   Please set hotel email in database or SMTP_USER environment variable");
			return false;
		}

		// Validate email format
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(hotelEmail)) {
			console.error("❌ Invalid hotel email format!");
			console.error(`   Current value: "${hotelEmail}"`);
			console.error("   Please set a valid email address");
			return false;
		}

		if (!emailRegex.test(bookingData.guestEmail)) {
			console.error("❌ Invalid guest email format!");
			console.error(`   Guest email: "${bookingData.guestEmail}"`);
			return false;
		}

		console.log(`📧 Sending email from: ${hotelEmail} to: ${bookingData.guestEmail}`);

		const mailOptions = {
			from: hotelEmail,
			to: bookingData.guestEmail,
			subject: `Booking Confirmation - ${bookingData.bookingCode}`,
			html: htmlContent,
			text: textContent,
		};

		// Retry up to 2 times on transient errors (e.g. Unexpected socket close)
		const maxTries = 2;
		let lastError: any;

		for (let attempt = 1; attempt <= maxTries; attempt++) {
			const transporter = await createTransporter();
			try {
				const info = await transporter.sendMail(mailOptions);
				transporter.close();
				console.log(`✅ Booking confirmation email sent successfully!`);
				console.log(`   Message ID: ${info.messageId}`);
				console.log(`   To: ${bookingData.guestEmail}`);
				console.log(`   Response: ${info.response || "N/A"}`);
				return true;
			} catch (err: any) {
				lastError = err;
				try {
					transporter.close();
				} catch (_) {}
				const isRetryable =
					err.message?.includes("Unexpected socket close") ||
					err.message?.includes("Connection closed") ||
					err.code === "ECONNRESET" ||
					err.code === "ETIMEDOUT";
				if (attempt < maxTries && isRetryable) {
					console.log(`⚠️  Send failed (${err.message}), retrying (${attempt}/${maxTries})...`);
					await new Promise((r) => setTimeout(r, 1500)); // brief delay before retry
				} else {
					throw err;
				}
			}
		}

		throw lastError;
	} catch (error: any) {
		console.error("❌ Error sending booking confirmation email:");
		console.error(`   Error Code: ${error.code || "N/A"}`);
		console.error(`   Error Message: ${error.message || "Unknown error"}`);
		if (error.response) {
			console.error(`   SMTP Response: ${error.response}`);
		}
		if (error.command) {
			console.error(`   Failed Command: ${error.command}`);
		}
		console.error("   Full Error:", error);
		return false;
	}
};
