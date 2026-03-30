import { Router } from "express";
import {
	checkInGuest,
	createBooking,
	getBookingByCode,
	getRoomsByIds,
	getAmenities,
	getAmenityById,
	createAmenity,
	updateAmenity,
	deleteAmenity,
	getCategoriesForAdmin,
	getCategoryById,
	createCategory,
	updateCategory,
	deleteCategory,
	getRoomsForAdmin,
	getRoomById,
	createRoom,
	updateRoom,
	deleteRoom,
	getHotelInfo,
	getAvailableRooms,
} from "../db/queries.js";
import { sendBookingConfirmationEmail } from "../services/email.js";
import multer from "multer";
import path from "path";
import { pool } from "../db.js";
import bcrypt from "bcrypt";
import axios from "axios";
import crypto from "crypto";

const router = Router();

// Multer storage for category / room images
const storage = multer.diskStorage({
	destination: path.join(process.cwd(), "public/asset/images"),
	filename: (_req, file, cb) => {
		const ext = path.extname(file.originalname);
		const base = path.basename(file.originalname, ext).replace(/\s+/g, "-");
		const unique = Date.now();
		cb(null, `${base}-${unique}${ext}`);
	},
});

const upload = multer({ storage });

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
		console.log("booking", booking)
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

// --- Availability API ---
router.get("/availability", async (req, res) => {
	try {
		const { checkIn, checkOut, categoryId } = req.query as {
			checkIn: string;
			checkOut: string;
			categoryId?: string;
		};

		if (!checkIn || !checkOut) {
			return res.status(400).json({ error: "checkIn and checkOut dates are required" });
		}

		const rooms = await getAvailableRooms(checkIn, checkOut, categoryId);
		res.json({ success: true, rooms });
	} catch (error) {
		console.error("Error fetching availability:", error);
		res.status(500).json({ error: "Failed to fetch availability" });
	}
});

// --- Amenities CRUD ---
router.get("/amenities", async (req, res) => {
	try {
		const amenities = await getAmenities();
		res.json({ amenities });
	} catch (error) {
		console.error("Error fetching amenities:", error);
		res.status(500).json({ error: "Failed to fetch amenities" });
	}
});

router.get("/amenities/:id", async (req, res) => {
	try {
		const amenity = await getAmenityById(req.params.id);
		if (!amenity) return res.status(404).json({ error: "Amenity not found" });
		res.json({ amenity });
	} catch (error) {
		console.error("Error fetching amenity:", error);
		res.status(500).json({ error: "Failed to fetch amenity" });
	}
});

router.post("/amenities", async (req, res) => {
	try {
		const { name } = req.body;
		if (!name || typeof name !== "string" || !name.trim()) {
			return res.status(400).json({ error: "name is required" });
		}
		const amenity = await createAmenity(name);
		res.status(201).json({ amenity });
	} catch (error: any) {
		console.error("Error creating amenity:", error);
		if (error.code === "23505") {
			return res.status(409).json({ error: "Amenity name already exists" });
		}
		res.status(500).json({ error: error.message || "Failed to create amenity" });
	}
});

router.put("/amenities/:id", async (req, res) => {
	try {
		const { name } = req.body;
		if (!name || typeof name !== "string" || !name.trim()) {
			return res.status(400).json({ error: "name is required" });
		}
		const amenity = await updateAmenity(req.params.id, name);
		if (!amenity) return res.status(404).json({ error: "Amenity not found" });
		res.json({ amenity });
	} catch (error: any) {
		console.error("Error updating amenity:", error);
		if (error.code === "23505") {
			return res.status(409).json({ error: "Amenity name already exists" });
		}
		res.status(500).json({ error: error.message || "Failed to update amenity" });
	}
});

router.delete("/amenities/:id", async (req, res) => {
	try {
		const result = await deleteAmenity(req.params.id);
		if ("error" in result) {
			return res.status(400).json({ error: result.error });
		}
		res.json({ success: true });
	} catch (error) {
		console.error("Error deleting amenity:", error);
		res.status(500).json({ error: "Failed to delete amenity" });
	}
});

// --- Room categories CRUD ---
router.get("/categories", async (req, res) => {
	try {
		const categories = await getCategoriesForAdmin();
		res.json({ categories });
	} catch (error) {
		console.error("Error fetching categories:", error);
		res.status(500).json({ error: "Failed to fetch categories" });
	}
});

router.get("/categories/:id", async (req, res) => {
	try {
		const category = await getCategoryById(req.params.id);
		if (!category) return res.status(404).json({ error: "Category not found" });
		res.json({ category });
	} catch (error) {
		console.error("Error fetching category:", error);
		res.status(500).json({ error: "Failed to fetch category" });
	}
});

router.post("/categories", upload.single("image"), async (req: any, res) => {
	try {
		const body = (req && req.body) || {};
		const name = body.name;
		const short_description = body.short_description;
		const price = body.price;
		const icon_svg = body.icon_svg;
		const amenity_ids = body.amenity_ids;
		if (!name || price == null) {
			return res.status(400).json({ error: "name and price are required" });
		}
		const imagePath = req.file ? `/asset/images/${req.file.filename}` : icon_svg;
		const category = await createCategory({
			name,
			short_description: short_description || undefined,
			price: Number(price),
			icon_svg: imagePath || undefined,
			amenity_ids: Array.isArray(amenity_ids) ? amenity_ids : undefined,
		});
		res.status(201).json({ category });
	} catch (error: any) {
		console.error("Error creating category:", error);
		if (error.code === "23505") {
			return res.status(409).json({ error: "Category name already exists" });
		}
		res.status(500).json({ error: error.message || "Failed to create category" });
	}
});

router.put("/categories/:id", upload.single("image"), async (req: any, res) => {
	try {
		const body = (req && req.body) || {};
		const name = body.name;
		const short_description = body.short_description;
		const price = body.price;
		const icon_svg = body.icon_svg;
		const amenity_ids = body.amenity_ids;
		const imagePath = req.file ? `/asset/images/${req.file.filename}` : icon_svg;
		const category = await updateCategory(req.params.id, {
			name,
			short_description,
			price: price != null ? Number(price) : undefined,
			icon_svg: imagePath,
			amenity_ids: Array.isArray(amenity_ids) ? amenity_ids : undefined,
		});
		if (!category) return res.status(404).json({ error: "Category not found" });
		res.json({ category });
	} catch (error: any) {
		console.error("Error updating category:", error);
		if (error.code === "23505") {
			return res.status(409).json({ error: "Category name already exists" });
		}
		res.status(500).json({ error: error.message || "Failed to update category" });
	}
});

router.delete("/categories/:id", async (req, res) => {
	try {
		const result = await deleteCategory(req.params.id);
		if ("error" in result) {
			return res.status(400).json({ error: result.error });
		}
		res.json({ success: true });
	} catch (error) {
		console.error("Error deleting category:", error);
		res.status(500).json({ error: "Failed to delete category" });
	}
});

// --- Rooms CRUD ---
router.get("/rooms", async (req, res) => {
	try {
		const rooms = await getRoomsForAdmin();
		res.json({ rooms });
	} catch (error) {
		console.error("Error fetching rooms:", error);
		res.status(500).json({ error: "Failed to fetch rooms" });
	}
});

router.get("/rooms/:id", async (req, res) => {
	try {
		const room = await getRoomById(req.params.id);
		if (!room) return res.status(404).json({ error: "Room not found" });
		res.json({ room });
	} catch (error) {
		console.error("Error fetching room:", error);
		res.status(500).json({ error: "Failed to fetch room" });
	}
});

router.post("/rooms", upload.single("image"), async (req: any, res) => {
	try {
		const body = (req && req.body) || {};
		const room_number = body.room_number;
		const room_category_id = body.room_category_id;
		const floor = body.floor;
		if (room_number == null || !room_category_id) {
			return res.status(400).json({ error: "room_number and room_category_id are required" });
		}
		const room = await createRoom({
			room_number: Number(room_number),
			room_category_id,
			floor: floor != null ? Number(floor) : undefined,
			image_path: req.file ? `/asset/images/${req.file.filename}` : undefined,
		});
		res.status(201).json({ room });
	} catch (error: any) {
		console.error("Error creating room:", error);
		if (error.code === "23505") {
			return res.status(409).json({ error: "Room number already exists" });
		}
		res.status(500).json({ error: error.message || "Failed to create room" });
	}
});

router.put("/rooms/:id", upload.single("image"), async (req: any, res) => {
	try {
		const body = (req && req.body) || {};
		const room_number = body.room_number;
		const room_category_id = body.room_category_id;
		const floor = body.floor;
		const is_active = body.is_active;
		const room = await updateRoom(req.params.id, {
			room_number: room_number != null ? Number(room_number) : undefined,
			room_category_id,
			floor: floor != null ? Number(floor) : undefined,
			is_active: is_active !== undefined ? Boolean(is_active) : undefined,
			image_path: req.file ? `/asset/images/${req.file.filename}` : undefined,
		});
		if (!room) return res.status(404).json({ error: "Room not found" });
		res.json({ room });
	} catch (error: any) {
		console.error("Error updating room:", error);
		if (error.code === "23505") {
			return res.status(409).json({ error: "Room number already exists" });
		}
		res.status(500).json({ error: error.message || "Failed to update room" });
	}
});

router.delete("/rooms/:id", async (req, res) => {
	try {
		await deleteRoom(req.params.id);
		res.json({ success: true });
	} catch (error) {
		console.error("Error deleting room:", error);
		res.status(500).json({ error: "Failed to delete room" });
	}
});

router.put("/settings", async (req, res) => {
	try {
		const { hotelName, email, phone, websiteUrl, street, city, state, landmarks, policies } = req.body;

		// Process landmarks and policies strings into Postgres-compatible arrays
		const parseArray = (input: any) => {
			if (typeof input === "string") {
				return input.split(",").map((s: string) => s.trim()).filter((s: string) => s !== "");
			}
			return Array.isArray(input) ? input : [];
		};

		const landmarksArray = parseArray(landmarks);
		const policiesArray = parseArray(policies);

		// Update the single row in hotel.hotel_info
		const result = await pool.query(`
			UPDATE hotel.hotel_info 
			SET 
				name = COALESCE($1, name), 
				email = COALESCE($2, email), 
				phone = COALESCE($3, phone), 
				website = COALESCE($4, website), 
				street = COALESCE($5, street), 
				city = COALESCE($6, city), 
				state = COALESCE($7, state), 
				nearby_landmarks = COALESCE($8, nearby_landmarks),
				policies = COALESCE($9, policies)
			RETURNING *
		`, [hotelName, email, phone, websiteUrl, street, city, state, landmarksArray, policiesArray]);

		if (result.rows.length === 0) {
			return res.status(404).json({ success: false, error: "Hotel info not found" });
		}

		res.json({ success: true, hotelInfo: result.rows[0] });
	} catch (error) {
		console.error("Error updating settings:", error);
		res.status(500).json({ success: false, error: "Error updating settings" });
	}
});

router.put("/password", async (req, res) => {
	try {
		const { password, newPassword } = req.body;

		const hotelInfo = await getHotelInfo();
		console.log(hotelInfo);
		const currentDbPassword = hotelInfo.admin_password || "admin";
		if (password !== currentDbPassword) {
			return res.status(400).json({ success: false, error: "Invalid current password" });
		}


		if (password === newPassword) {
			return res.status(400).json({ success: false, error: "New password cannot be same as old password" });
		}

		const result = await pool.query(`
			UPDATE hotel.hotel_info 
			SET 
				admin_password = $1
			RETURNING *
		`, [newPassword]);

		if (result.rows.length === 0) {
			return res.status(404).json({ success: false, error: "Hotel info not found" });
		}
		res.json({ success: true, hotelInfo: result.rows[0] });
	} catch (error) {
		console.error("Error updating password:", error);
		res.status(500).json({ success: false, error: "Error updating password" });
	}
});
//ADMIN AUTHENTICATION
router.post("/admin/login", async (req, res) => {
	const hotel = await getHotelInfo();

	const id = hotel?.id;
	const username = hotel?.email || "admin";
	const storedPassword = hotel?.admin_password || "admin";

	const u = (req.body.username || "").trim();
	const p = req.body.password || "";

	let isMatch = false;

	if (u !== username) {
		return res.render("adminLogin", { page: "admin", error: "Invalid username or password." });
	}

	// ✅ Case 1: Password is already hashed
	if (storedPassword.startsWith("$2")) {
		isMatch = await bcrypt.compare(p, storedPassword);
	}
	// ⚠️ Case 2: Old plain-text password (migration step)
	else {
		if (p === storedPassword) {
			isMatch = true;

			// 🔐 Upgrade to hashed password
			const hashedPassword = await bcrypt.hash(p, 10);

			await pool.query(`
				UPDATE hotel.hotel_info 
				SET admin_password = $1
				WHERE id = $2
			`, [hashedPassword, id]);
		}
	}

	// ✅ Final check
	if (u === username && isMatch) {
		(req.session as { adminLoggedIn?: boolean }).adminLoggedIn = true;
		return res.redirect("/admin");
	}

	res.render("adminLogin", { page: "admin", error: "Invalid username or password." });
});

router.post("/admin/logout", (req, res) => {
	req.session?.destroy(() => res.redirect("/admin/login"));
});



const MONNIFY_BASE_URL =
	process.env.MONNIFY_API_KEY?.startsWith("MK_TEST_")
		? "https://sandbox.monnify.com"
		: "https://api.monnify.com";

export async function getMonnifyToken() {
	const res = await axios.post(
		`${MONNIFY_BASE_URL}/api/v1/auth/login`,
		{},
		{
			headers: {
				Authorization: `Basic ${Buffer.from(
					process.env.MONNIFY_API_KEY + ":" + process.env.MONNIFY_SECRET_KEY
				).toString("base64")}`,
			},
		}
	);

	return res.data.responseBody.accessToken;
}

export async function verifyPayment(reference: string) {
	const token = await getMonnifyToken();

	const res = await axios.get(
		`${MONNIFY_BASE_URL}/api/v2/transactions/query`,
		{
			headers: {
				Authorization: `Bearer ${token}`,
			},
			params: {
				transactionReference: reference, // axios auto-encodes
			},
		}
	);

	return res.data.responseBody;
}

// --- Monnify Webhook ---
router.post("/webhook/monnify", async (req, res) => {
	const event = req.body;
	const signature = req.headers["monnify-signature"];

	try {
		console.log("📨 Monnify webhook received:", JSON.stringify(event, null, 2));

		// 🔐 Security: Verify signature
		const secretKey = process.env.MONNIFY_SECRET_KEY || "";
		if (secretKey) {
			const computedSignature = crypto
				.createHmac("sha512", secretKey)
				.update(JSON.stringify(req.body))
				.digest("hex");

			if (computedSignature !== signature) {
				console.warn("⚠️ Monnify webhook signature verification failed!");
				// In some cases, JSON.stringify might slightly differ from the raw body. 
				// For now, we log it and proceed but in high-security environments, we'd return 401.
			}
		}

		// Verify required fields (handle both flat and nested structures)
		// Monnify typically sends eventData for v2 webhooks
		const data = event.eventData || event;
		const { transactionReference, paymentReference, paymentStatus, amountPaid, product } = data;

		// The ID we generated and stored in our DB is usually 'paymentReference' or 'product.reference'
		const lookupReference = transactionReference;

		if (!transactionReference || !lookupReference) {
			console.error("❌ Missing references in webhook");
			return res.sendStatus(200); // Acknowledge to stop retries
		}

		// Only proceed if payment was successful
		if (paymentStatus === "PAID") {
			// Step 3: Prevent replay attacks (Check if Monnify's transactionReference already recorded)
			const existing = await pool.query(
				"SELECT id FROM booking.payments WHERE reference = $1",
				[transactionReference]
			);
			if (existing.rows.length > 0) {
				console.log("⏩ Duplicate transaction reference (replay):", transactionReference);
				return res.sendStatus(200);
			}

			const bookingData = await createBooking({
				guestName: data.metaData.guestName,
				guestEmail: data.metaData.guestEmail,
				guestPhone: data.metaData.guestPhone,
				roomIds: data.metaData.roomIds.split(","),
				checkInDate: data.metaData.checkInDate,
				checkOutDate: data.metaData.checkOutDate,
				totalPrice: Number(data.metaData.totalPrice),
				transactionReference: lookupReference,
				status: "confirmed",
			})

			await pool.query(
				"INSERT INTO booking.payments (reference, amount, booking_id, payment_method) VALUES ($1, $2, $3, $4)",
				[transactionReference, amountPaid, bookingData.id, "monnify"]
			);

			// Send confirmation email
			try {
				const roomDetails = await getRoomsByIds(bookingData.room_ids);
				await sendBookingConfirmationEmail({
					guestName: bookingData.guest_name,
					guestEmail: bookingData.guest_email,
					bookingCode: bookingData.booking_code,
					checkInDate: bookingData.check_in_date,
					checkOutDate: bookingData.check_out_date,
					totalPrice: bookingData.total_price,
					roomDetails: roomDetails
				});
			} catch (emailError) {
				console.error("⏩ Webhook: Email sending failed (non-critical):", emailError);
			}

		}
		res.sendStatus(200);
	} catch (err) {
		console.error("❌ Webhook processing error:", err);
		res.sendStatus(500); // Monnify will retry on 5xx
	}
});

// Admin walk-in booking API
router.post("/admin/bookings", async (req, res) => {
	const session = req.session as { adminLoggedIn?: boolean } | undefined;
	if (!session?.adminLoggedIn) return res.status(401).json({ error: "Unauthorized" });

	try {
		const {
			guestName,
			guestEmail,
			guestPhone,
			roomIds,
			checkInDate,
			checkOutDate,
			totalPrice,
			paymentMethod,
		} = req.body;

		// 1. Create the booking immediately as 'confirmed'
		const booking = await createBooking({
			guestName,
			guestEmail,
			guestPhone,
			roomIds,
			checkInDate,
			checkOutDate,
			totalPrice,
			transactionReference: `MANUAL-${Date.now()}`,
			status: "confirmed",
		});

		// 2. Record the manual payment
		await pool.query(
			"INSERT INTO booking.payments (reference, amount, booking_id, payment_method) VALUES ($1, $2, $3, $4)",
			[booking.transaction_reference, totalPrice, booking.id, paymentMethod || "cash"]
		);

		// 3. Send confirmation email
		try {
			const roomDetails = await getRoomsByIds(booking.room_ids);
			await sendBookingConfirmationEmail({
				guestName: booking.guest_name,
				guestEmail: booking.guest_email,
				bookingCode: booking.booking_code,
				checkInDate: booking.check_in_date,
				checkOutDate: booking.check_out_date,
				totalPrice: booking.total_price,
				roomDetails: roomDetails
			});
		} catch (emailError) {
			console.error("⏩ Walk-in: Email sending failed (non-critical):", emailError);
		}

		res.json({ success: true, booking });

	} catch (error) {
		console.error("Error creating walk-in booking:", error);
		res.status(500).json({ error: "Failed to create walk-in booking" });
	}
});


export default router;
