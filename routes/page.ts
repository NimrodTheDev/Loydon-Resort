import { Router, Request, Response } from "express";
const axios = require("axios");
require("dotenv").config();
import { requireAdmin } from "../middleware/auth.js";
import {
	getRooms,
	getRoomByCategory,
	getHotelInfo,
	createBooking,
	getBookingByCode,
	getBookingByTransactionReference,
	checkInGuest,
	getBookings,
	getRoomDetailsByIds,
	getRoomsByIds,
	getCategoriesForAdmin,
	getRoomsForAdmin,
} from "../db/queries.js";

import { verifyPayment } from "./api.js";
import { pool } from "../db.js";

const router = Router();

// Protect all /admin/* except /admin/login
router.use((req: Request, res: Response, next) => {
	if (!req.path.startsWith("/admin")) return next();
	requireAdmin(req, res, next);
});

// Temporary API routes for testing
router.get("/page/test", (req, res) => {
	res.json({ message: "Page is working!" });
});


// Get booking details by code for check-in


router.get("/", async (req, res) => {
	try {
		//Room categories
		const roomCategories = await getRooms();
		res.render("index", { page: "home", rooms: roomCategories });
	} catch (error) {
		console.error("Error fetching rooms:", error);
		res.status(500).render("404", { page: "" });
	}
});

router.get("/rooms", async (req, res) => {
	try {
		//Room categories
		const roomCategories = await getRooms();
		res.render("rooms", { page: "room", rooms: roomCategories });
	} catch (error) {
		console.error("Error fetching rooms:", error);
		res.status(500).render("404", { page: "" });
	}
});

router.get("/rooms/:category", async (req, res) => {
	try {
		const hotelInfo = await getHotelInfo();
		const category = req.params.category.toLowerCase();
		const room = await getRoomByCategory(category);
		if (!room) {
			return res.status(404).render("404", { page: "" });
		}
		res.render("roomDetails", { page: "room", room, hotelInfo });
	} catch (error) {
		console.error("Error fetching room details:", error);
		res.status(500).render("404", { page: "" });
	}
});

router.get("/book/:category", async (req, res) => {
	try {
		const category = req.params.category.toLowerCase().replace(/-/g, " ");
		const room = await getRoomByCategory(category);

		if (!room) {
			return res.status(404).render("404", { page: "" });
		}

		res.render("book", {
			page: "book",
			room,
			paymentData: {
				amount: 100,
				reference: "Rooms purchased " + [].length + " " + [].join(","),
				customerFullName: "",
				customerEmail: "",
			},
			monnifyApiKey: "MK_TEST_9PRG55TX52",
			contractCode: "2787035255",
		});
	} catch (error) {
		console.error("Error fetching room for booking:", error);
		res.status(500).render("404", { page: "" });
	}
});

router.get("/contact", async (req, res) => {
	try {
		const hotelInfo = await getHotelInfo();

		if (!hotelInfo) {
			// Fallback to hardcoded data if database is empty
			const fallbackData = {
				address: {
					street: hotelInfo?.street || "Ara Secondary School, Okuku",
					city: hotelInfo?.city || "Umuguma",
					state: hotelInfo?.state || "Owerri",
					country: hotelInfo?.country || "Nigeria",
					zip: hotelInfo?.zip || "460117",
				},
				phone: hotelInfo?.phone || "08037144808",
				email: hotelInfo?.email || "loydon71@gmail.com",
				hotelName: hotelInfo?.name || "Loydon Resort",
				websiteUrl: hotelInfo?.website || "loydonresort.com",
				nearby_landmarks: hotelInfo?.nearby_landmarks || [
					"After Orieukwu market, umuguma",
					"Umuguma, Police station",
					"Before Ara Secondary School, Okuku.",
				],
			};
			return res.render("contact", { page: "contact", ...fallbackData });
		}

		res.render("contact", {
			page: "contact",
			address: {
				street: hotelInfo.street,
				city: hotelInfo.city,
				state: hotelInfo.state,
				country: hotelInfo.country,
				zip: hotelInfo.zip,
			},
			phone: hotelInfo.phone,
			email: hotelInfo.email,
			hotelName: hotelInfo.name,
			websiteUrl: hotelInfo.website,
			nearby_landmarks: hotelInfo.nearby_landmarks
		});
	} catch (error) {
		console.error("Error fetching hotel info:", error);
		res.status(500).render("404", { page: "" });
	}
});

// Redirect old check-in URL to admin check-in
router.get("/check-in", (req, res) => {
	res.redirect("/admin/check-in");
});

// Admin login (no auth required)
router.get("/admin/login", (req, res) => {
	const session = req.session as { adminLoggedIn?: boolean } | undefined;
	if (session?.adminLoggedIn) return res.redirect("/admin");
	res.render("adminLogin", { page: "admin", error: null });
});


router.get("/admin", async (req, res) => {
	try {
		const page = parseInt(req.query.page as string) || 1;
		const limit = 100;
		const offset = (page - 1) * limit;
		const bookings = await getBookings(limit, offset);
		const allRoomIds = [...new Set(bookings.flatMap((b) => b.room_ids || []))];
		const roomDetailsWithId = await getRoomDetailsByIds(allRoomIds);
		bookings.forEach((b) => {
			b.room_details = (b.room_ids || []).map((id: string) => roomDetailsWithId[id] || { roomNumber: "—", roomCategory: "—" });
		});
		const stats = {
			total: bookings.length,
			pending: bookings.filter((b) => b.check_in_status !== "checked_in").length,
			checkedIn: bookings.filter((b) => b.check_in_status === "checked_in").length,
			walkIns: bookings.filter((b) => b.transaction_reference && b.transaction_reference.startsWith("MANUAL-")).length,
		};
		res.render("admin", { page: "admin", bookings, stats, offset: offset || 0, limit: limit || 100, pageCount: page || 1 });

	} catch (error) {
		console.error("Error loading admin:", error);
		res.status(500).render("404", { page: "" });
	}
});

router.get("/admin/categories", (req, res) => {
	res.render("adminCategories", { page: "admin" });
});

router.get("/admin/rooms", (req, res) => {
	res.render("adminRooms", { page: "admin" });
});

router.get("/admin/amenities", (req, res) => {
	res.render("adminAmenities", { page: "admin" });
});

router.get("/admin/settings", async (req, res) => {
	const hotelInfo = await getHotelInfo();
	res.render("adminSettings", { page: "admin", hotelInfo });
});

router.get("/admin/walk-in", async (req, res) => {
	const session = req.session as { adminLoggedIn?: boolean } | undefined;
	if (!session?.adminLoggedIn) return res.redirect("/admin/login");

	const categories = await getCategoriesForAdmin();
	res.render("adminWalkIn", { page: "admin", categories });
});

router.get("/booking-success", async (req, res) => {
	const { code } = req.query as { code: string };
	if (!code) return res.redirect("/");

	const booking = await getBookingByCode(code.toUpperCase());
	if (!booking) return res.redirect("/");

	const roomDetails = await getRoomsByIds(booking.room_ids);

	res.render("booking-success", {
		page: "booking",
		booking: {
			...booking,
			room_details: roomDetails
		}
	});
});

router.get("/admin/check-in", (req, res) => {
	res.render("checkIn", { page: "admin", fromAdmin: true });
});

router.get("/verify-payment", async (req, res) => {
	const { reference } = req.query;
	if (!reference) return res.redirect("/");

	try {
		// 1. Find booking in our DB by transaction reference
		// This relies on the Webhook to update the status to 'confirmed'
		const booking = await getBookingByTransactionReference(reference.toString());

		if (booking && (booking.status === "confirmed" || booking.status === "paid")) {
			// ✅ SUCCESS CASE (Already updated by Webhook)
			const paymentData = {
				transactionReference: reference.toString(),
				amountPaid: booking.total_price,
				bookingCode: booking.booking_code || "N/A"
			};
			return res.render("success", { 
				payment: paymentData, 
				page: "success" 
			});
		} else {
			// ⏳ PENDING OR FAILED CASE (Still 'pending' in our DB)
			return res.render("payment-status", {
				status: booking?.status.toUpperCase() || "NOT_FOUND",
				reference: reference.toString(),
				message: booking 
					? "We are currently waiting for payment confirmation from Monnify. This usually takes a few moments." 
					: "We couldn't find a booking associated with this transaction reference.",
				page: "payment-status"
			});
		}
	} catch (err) {
		console.error("❌ Verification error:", err);
		return res.render("payment-status", {
			status: "ERROR",
			reference: reference.toString(),
			message: "An error occurred while checking your payment status. Please contact support.",
			page: "payment-status"
		});
	}
});

router.use((req, res) => {
	res.status(404).render("404", { page: "" });
});

export default router;
