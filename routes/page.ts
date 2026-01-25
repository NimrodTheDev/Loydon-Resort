import { Router } from "express";
const axios = require("axios");
require("dotenv").config();
import {
	getRooms,
	getRoomByCategory,
	getHotelInfo,
	createBooking,
	getBookingByCode,
	getBookingByTransactionReference,
	checkInGuest,
} from "../db/queries.js";

const router = Router();

// Temporary API routes for testing
router.get("/page/test", (req, res) => {
	res.json({ message: "Page is working!" });
});


// Get booking details by code for check-in


router.get("/", async (req, res) => {
	try {
		const rooms = await getRooms();
		res.render("index", { page: "home", rooms });
	} catch (error) {
		console.error("Error fetching rooms:", error);
		res.status(500).render("404", { page: "" });
	}
});

router.get("/rooms", async (req, res) => {
	try {
		const rooms = await getRooms();
		console.log(rooms);
		res.render("rooms", { page: "room", rooms });
	} catch (error) {
		console.error("Error fetching rooms:", error);
		res.status(500).render("404", { page: "" });
	}
});

router.get("/rooms/:category", async (req, res) => {
	try {
		const category = req.params.category.toLowerCase();
		const room = await getRoomByCategory(category);
		console.log(room);

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

router.get("/check-in", (req, res) => {
	res.render("checkIn", { page: "checkin" });
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
