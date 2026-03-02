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
} from "../db/queries.js";

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
		res.render("index", { page: "home", rooms:roomCategories });
	} catch (error) {
		console.error("Error fetching rooms:", error);
		res.status(500).render("404", { page: "" });
	}
});

router.get("/rooms", async (req, res) => {
	try {
		//Room categories
		const roomCategories = await getRooms();
		res.render("rooms", { page: "room", rooms:roomCategories });
	} catch (error) {
		console.error("Error fetching rooms:", error);
		res.status(500).render("404", { page: "" });
	}
});

router.get("/rooms/:category", async (req, res) => {
	try {
		const category = req.params.category.toLowerCase();
		const room = await getRoomByCategory(category);
		if (!room) {
			return res.status(404).render("404", { page: "" });
		}
		res.render("roomDetails", { page: "room", room });
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
					street: "Ara Secondary School, Okuku",
					city: "Umuguma",
					state: "Owerri",
					country: "Nigeria",
					zip: "460117",
				},
				phone: "08037144808",
				email: "nkemakolam.martin@gmail.com",
				hotelName: "Loydon Resort",
				websiteUrl: "loydonresort.com",
				nearbyLandmarks: [
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
			nearbyLandmarks: [
				"After Orieukwu market, umuguma",
				"Umuguma, Police station",
				"Before Ara Secondary School, Okuku.",
			],
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

router.get("/admin/check-in", (req, res) => {
	res.render("checkIn", { page: "admin", fromAdmin: true });
});

router.get("/verify-payment", async (req, res) => {
	const { reference } = req.query;
	try {
		// Try to get payment details, but always redirect to success
		let payment: { transactionReference: string; amountPaid: number } = { transactionReference: "", amountPaid: 0 };

		if(reference) {
			// Try to find booking by transaction reference (Monnify reference)
			const booking = await getBookingByTransactionReference(reference.toString());
			if(booking) {
				payment = {
					transactionReference: booking.transaction_reference || reference.toString(),
					amountPaid: booking.total_price
				};
			} else {
				// Fallback: use the reference as-is (might be transaction reference or booking code)
				payment = {
					transactionReference: reference.toString(),
					amountPaid: 0
				};
			}
		}
		

		// Always render success page
		const paymentData = payment || { 
			transactionReference: reference || "N/A",
			
			amountPaid: payment || 0
		};
		
		return res.render("success", { 
			payment: paymentData,
			page: "success"
		});
	} catch (err) {
		console.error(err);
		// Even on error, show success page
		return res.render("success", { 
			payment: { 
				transactionReference: reference?.toString() || "N/A",
				amountPaid: 0
			},
			page: "success"
		});
	}
});

router.use((req, res) => {
	res.status(404).render("404", { page: "" });
});

export default router;
