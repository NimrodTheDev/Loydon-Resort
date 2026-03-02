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
} from "../db/queries.js";
import { sendBookingConfirmationEmail } from "../services/email.js";
import multer from "multer";
import path from "path";

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


//ADMIN AUTHENTICATION
router.post("/admin/login", async (req, res) => {
	const username = (await getHotelInfo())?.email || "admin";
	const password = (await getHotelInfo())?.admin_password || "admin";
	const u = (req.body.username || "").trim();
	const p = req.body.password || "";
	if (u === username && p === password) {
	  (req.session as { adminLoggedIn?: boolean }).adminLoggedIn = true;
	  return res.redirect("/admin");
	}
	// failure path:
	res.render("adminLogin", { page: "admin", error: "Invalid username or password." });
  });

router.post("/admin/logout", (req, res) => {
	req.session?.destroy(() => res.redirect("/admin/login"));
});

export default router;
