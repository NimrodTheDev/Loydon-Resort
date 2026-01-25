import { Router } from "express";
import {
	checkInGuest,
	createBooking,
	getBookingByCode,
	getRoomsByIds,
} from "../db/queries.js";
import { sendBookingConfirmationEmail } from "../services/email.js";

const router = Router();

// Test route to verify API is working
router.get("/test", (req, res) => {
	res.json({ message: "API is working!" });
});

// Test email endpoint for debugging
router.post("/test-email", async (req, res) => {
	try {
		const { email } = req.body;

		if (!email) {
			return res.status(400).json({ error: "Email address is required" });
		}

		console.log("🧪 Testing email service...");
		const result = await sendBookingConfirmationEmail({
			guestName: "Test User",
			guestEmail: email,
			bookingCode: "TEST-123456",
			checkInDate: new Date().toISOString().split("T")[0],
			checkOutDate: new Date(Date.now() + 86400000).toISOString().split("T")[0],
			totalPrice: 10000,
			roomDetails: [
				{ roomNumber: 201, roomCategory: "Standard" },
			],
		});

		if (result) {
			res.json({ 
				success: true, 
				message: "Test email sent successfully! Check your inbox.",
				email 
			});
		} else {
			res.status(500).json({ 
				success: false, 
				error: "Failed to send test email. Check server logs for details.",
				email 
			});
		}
	} catch (error: any) {
		console.error("Error in test email endpoint:", error);
		res.status(500).json({ 
			success: false, 
			error: error.message || "Failed to send test email" 
		});
	}
});

router.get("/booking/:code", async (req, res) => {
	try {
		const { code } = req.params;
		const booking = await getBookingByCode(code.toUpperCase());

		if (!booking) {
			return res.status(404).json({ error: "Booking not found" });
		}

		// Get room details for the booking
		const roomDetails = await getRoomsByIds(booking.room_ids || []);

		// Add room details to booking object
		const bookingWithRooms = {
			...booking,
			room_details: roomDetails,
		};

		res.json({ booking: bookingWithRooms });
	} catch (error) {
		console.error("Error fetching booking:", error);
		res.status(500).json({ error: "Failed to fetch booking" });
	}
});

// Check in guest with booking code
router.post("/checkin", async (req, res) => {
	try {
		const { code } = req.body;

		if (!code) {
			return res.status(400).json({ error: "Booking code is required" });
		}

		const booking = await checkInGuest(code.toUpperCase());

		if (!booking) {
			return res
				.status(404)
				.json({ error: "Invalid booking code or already checked in" });
		}

		// Get room details for the booking
		const roomDetails = await getRoomsByIds(booking.room_ids || []);

		// Add room details to booking object
		const bookingWithRooms = {
			...booking,
			room_details: roomDetails,
		};

		res.json({
			success: true,
			message: "Guest checked in successfully",
			booking: bookingWithRooms,
		});
	} catch (error) {
		console.error("Error checking in guest:", error);
		res.status(500).json({ error: "Failed to check in guest" });
	}
});

router.post("/bookings", async (req, res) => {
	try {
		const {
			guestName,
			guestEmail,
			guestPhone,
			roomIds,
			checkInDate,
			checkOutDate,
			totalPrice,
			transactionReference,
		} = req.body;

		// Basic validation
		if (
			!guestName ||
			!guestEmail ||
			!roomIds ||
			!checkInDate ||
			!checkOutDate ||
			!totalPrice
		) {
			return res.status(400).json({ error: "Missing required fields" });
		}

		if (!Array.isArray(roomIds) || roomIds.length === 0) {
			return res
				.status(400)
				.json({ error: "At least one room must be selected" });
		}

		const booking = await createBooking({
			guestName,
			guestEmail,
			guestPhone,
			roomIds,
			checkInDate,
			checkOutDate,
			totalPrice,
			transactionReference,
		});

		// Get room details for email
		const roomDetails = await getRoomsByIds(roomIds);

		// Send booking confirmation email
		console.log("📧 Attempting to send booking confirmation email...");
		const emailSent = await sendBookingConfirmationEmail({
			guestName: booking.guest_name,
			guestEmail: booking.guest_email,
			bookingCode: booking.booking_code,
			checkInDate: booking.check_in_date,
			checkOutDate: booking.check_out_date,
			totalPrice: booking.total_price,
			roomDetails,
		});

		if (emailSent) {
			console.log("✅ Email sent successfully");
		} else {
			console.error("❌ Email failed to send, but booking was created");
		}

		res.status(201).json({ success: true, booking });
	} catch (error) {
		console.error("Error creating booking:", error);
		res.status(500).json({ error: "Failed to create booking" });
	}
});


export default router;
