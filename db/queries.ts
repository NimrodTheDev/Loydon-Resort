import { query } from "../db";

export const getRooms = async () => {
	const result = await query(`
		SELECT
			rc.id,
			rc.name,
			rc.icon_svg as icon,
			rc.short_description,
			rc.price,
			COALESCE(array_agg(a.name) FILTER (WHERE a.name IS NOT NULL), '{}') as amenities
		FROM hotel.room_categories rc
		LEFT JOIN hotel.amenities a ON a.id = ANY(rc.amenity_ids)
		GROUP BY rc.id, rc.name, rc.icon_svg, rc.short_description, rc.price
		ORDER BY rc.price;
	`);
	return result.rows;
};

export const getRoomByCategory = async (categoryName: string) => {
	const result = await query(
		`
		SELECT
			rc.id,
			rc.name,
			rc.icon_svg as icon,
			rc.short_description,
			rc.price,
			COALESCE(
				array_agg(DISTINCT a.name) FILTER (WHERE a.name IS NOT NULL),
				'{}'
			) as amenities,
			COALESCE(
				array_agg(DISTINCT r.id) FILTER (WHERE r.id IS NOT NULL),
				'{}'
			) as available_room_ids,
			COALESCE(
				array_agg(DISTINCT r.room_number) FILTER (WHERE r.id IS NOT NULL),
				'{}'
			) as available_room_numbers
		FROM hotel.room_categories rc
		LEFT JOIN hotel.amenities a ON a.id = ANY(rc.amenity_ids)
		LEFT JOIN hotel.rooms r ON r.room_category_id = rc.id AND r.is_active = true
		WHERE LOWER(rc.name) = LOWER($1)
		GROUP BY rc.id, rc.name, rc.icon_svg, rc.short_description, rc.price;
	`,
		[categoryName]
	);

	const room = result.rows[0];
	if (room) {
		// Combine room IDs and numbers into objects
		room.available_rooms = room.available_room_ids.map(
			(id: string, index: number) => ({
				id,
				number: room.available_room_numbers[index],
			})
		);
		room.available = room.available_rooms.map((r: any) => r.number);
		// Clean up temporary arrays
		delete room.available_room_ids;
		delete room.available_room_numbers;
	}

	return room || null;
};

export const getHotelInfo = async () => {
	const result = await query(`
		SELECT * FROM hotel.hotel_info LIMIT 1;
	`);
	return result.rows[0] || null;
};

export const createBooking = async (bookingData: {
	guestName: string;
	guestEmail: string;
	guestPhone?: string;
	roomIds: string[];
	checkInDate: string;
	checkOutDate: string;
	totalPrice: number;
	transactionReference?: string;
}) => {
	const {
		guestName,
		guestEmail,
		guestPhone,
		roomIds,
		checkInDate,
		checkOutDate,
		totalPrice,
		transactionReference,
	} = bookingData;

	// Generate unique booking code
	const bookingCode = await generateBookingCode();

	const result = await query(
		`
		INSERT INTO booking.bookings (guest_name, guest_email, guest_phone, room_ids, check_in_date, check_out_date, total_price, booking_code, transaction_reference)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING *;
	`,
		[
			guestName,
			guestEmail,
			guestPhone,
			roomIds,
			checkInDate,
			checkOutDate,
			totalPrice,
			bookingCode,
			transactionReference || null,
		]
	);

	return result.rows[0];
};

// Generate unique booking code
export const generateBookingCode = async (): Promise<string> => {
	const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
	let code: string;
	let exists = true;

	do {
		code = "HXL-";
		for (let i = 0; i < 6; i++) {
			code += chars.charAt(Math.floor(Math.random() * chars.length));
		}

		// Check if code already exists
		const result = await query(
			"SELECT id FROM booking.bookings WHERE booking_code = $1",
			[code]
		);
		exists = result.rows.length > 0;
	} while (exists);

	return code;
};

// Get all bookings for admin (recent first)
export const getBookings = async (limit = 100, offset = 0) => {
	const result = await query(
		`
		SELECT 
			id, guest_name, guest_email, guest_phone, room_ids, 
			check_in_date, check_out_date, total_price, status,
			booking_code, check_in_status, checked_in_at, created_at,
			transaction_reference
		FROM booking.bookings 
		ORDER BY created_at DESC
		LIMIT $1 OFFSET $2
	`,
		[limit, offset]
	);
	return result.rows;
};

// Get booking by code for check-in
export const getBookingByCode = async (code: string) => {
	const result = await query(
		`
		SELECT 
			id, guest_name, guest_email, guest_phone, room_ids, 
			check_in_date, check_out_date, total_price, status,
			booking_code, check_in_status, checked_in_at, created_at,
			transaction_reference
		FROM booking.bookings 
		WHERE booking_code = $1
	`,
		[code]
	);

	return result.rows[0] || null;
};

// Get booking by transaction reference
export const getBookingByTransactionReference = async (transactionRef: string) => {
	const result = await query(
		`
		SELECT 
			id, guest_name, guest_email, guest_phone, room_ids, 
			check_in_date, check_out_date, total_price, status,
			booking_code, check_in_status, checked_in_at, created_at,
			transaction_reference
		FROM booking.bookings 
		WHERE transaction_reference = $1
	`,
		[transactionRef]
	);

	return result.rows[0] || null;
};

// Check in guest with booking code
export const checkInGuest = async (code: string) => {
	const result = await query(
		`
		UPDATE booking.bookings 
		SET check_in_status = 'checked_in', checked_in_at = NOW()
		WHERE booking_code = $1 AND check_in_status = 'pending'
		RETURNING *
	`,
		[code]
	);

	return result.rows[0] || null;
};

// Get room details by IDs (for email)
export const getRoomsByIds = async (roomIds: string[]) => {
	if (!roomIds || roomIds.length === 0) {
		return [];
	}

	const result = await query(
		`
		SELECT 
			r.id,
			r.room_number,
			rc.name as category_name
		FROM hotel.rooms r
		JOIN hotel.room_categories rc ON r.room_category_id = rc.id
		WHERE r.id = ANY($1::uuid[])
		ORDER BY r.room_number;
	`,
		[roomIds]
	);

	return result.rows.map((row) => ({
		roomNumber: row.room_number,
		roomCategory: row.category_name,
	}));
};

// Get room details by IDs keyed by id (for admin list)
export const getRoomDetailsByIds = async (
	roomIds: string[]
): Promise<Record<string, { roomNumber: number; roomCategory: string }>> => {
	if (!roomIds || roomIds.length === 0) {
		return {};
	}
	const result = await query(
		`
		SELECT 
			r.id,
			r.room_number,
			rc.name as category_name
		FROM hotel.rooms r
		JOIN hotel.room_categories rc ON r.room_category_id = rc.id
		WHERE r.id = ANY($1::uuid[]);
	`,
		[roomIds]
	);
	const map: Record<string, { roomNumber: number; roomCategory: string }> = {};
	result.rows.forEach((row) => {
		map[row.id] = {
			roomNumber: row.room_number,
			roomCategory: row.category_name,
		};
	});
	return map;
};

// --- Amenities CRUD ---
export const getAmenities = async () => {
	const result = await query(`SELECT id, name FROM hotel.amenities ORDER BY name`);
	return result.rows;
};

export const getAmenityById = async (id: string) => {
	const result = await query(
		`SELECT id, name FROM hotel.amenities WHERE id = $1`,
		[id]
	);
	return result.rows[0] || null;
};

export const createAmenity = async (name: string) => {
	const result = await query(
		`INSERT INTO hotel.amenities (name) VALUES ($1) RETURNING *`,
		[name.trim()]
	);
	return result.rows[0];
};

export const updateAmenity = async (id: string, name: string) => {
	const result = await query(
		`UPDATE hotel.amenities SET name = $2 WHERE id = $1 RETURNING *`,
		[id, name.trim()]
	);
	return result.rows[0] || null;
};

export const deleteAmenity = async (id: string) => {
	const inUse = await query(
		`SELECT 1 FROM hotel.room_categories WHERE $1 = ANY(amenity_ids) LIMIT 1`,
		[id]
	);
	if (inUse.rows.length > 0) {
		return { error: "Amenity is used by one or more room categories. Remove it from categories first." };
	}
	await query(`DELETE FROM hotel.amenities WHERE id = $1`, [id]);
	return { success: true };
};

// --- Room categories CRUD ---

export const getCategoriesForAdmin = async () => {
	const result = await query(`
		SELECT rc.id, rc.name, rc.short_description, rc.price, rc.icon_svg, rc.amenity_ids, rc.created_at, ARRAY_AGG(a.name) as amenities
		FROM hotel.room_categories as rc
		LEFT JOIN hotel.amenities a ON a.id = ANY(rc.amenity_ids)
		GROUP BY
			rc.id,
			rc.name,
			rc.short_description,
			rc.price,
			rc.icon_svg,
			rc.amenity_ids,
			rc.created_at
		ORDER BY rc.name
	`);
	return result.rows;
};

export const getCategoryById = async (id: string) => {
	const result = await query(
		`SELECT id, name, short_description, price, icon_svg, amenity_ids, created_at
		 FROM hotel.room_categories WHERE id = $1`,
		[id]
	);
	return result.rows[0] || null;
};

export const createCategory = async (data: {
	name: string;
	short_description?: string;
	price: number;
	icon_svg?: string;
	amenity_ids?: string[];
}) => {
	const result = await query(
		`INSERT INTO hotel.room_categories (name, short_description, price, icon_svg, amenity_ids)
		 VALUES ($1, $2, $3, $4, $5)
		 RETURNING *`,
		[
			data.name,
			data.short_description || null,
			data.price,
			data.icon_svg || null,
			data.amenity_ids || [],
		]
	);
	return result.rows[0];
};

export const updateCategory = async (
	id: string,
	data: {
		name?: string;
		short_description?: string;
		price?: number;
		icon_svg?: string;
		amenity_ids?: string[];
	}
) => {
	const result = await query(
		`UPDATE hotel.room_categories
		 SET name = COALESCE($2, name),
		     short_description = COALESCE($3, short_description),
		     price = COALESCE($4, price),
		     icon_svg = COALESCE($5, icon_svg),
		     amenity_ids = COALESCE($6, amenity_ids)
		 WHERE id = $1
		 RETURNING *`,
		[
			id,
			data.name,
			data.short_description,
			data.price,
			data.icon_svg,
			data.amenity_ids,
		]
	);
	return result.rows[0] || null;
};

export const deleteCategory = async (id: string) => {
	const count = await query(
		`SELECT 1 FROM hotel.rooms WHERE room_category_id = $1 LIMIT 1`,
		[id]
	);
	if (count.rows.length > 0) {
		return { error: "Category has rooms. Remove or reassign rooms first." };
	}
	await query(`DELETE FROM hotel.room_categories WHERE id = $1`, [id]);
	return { success: true };
};

// --- Rooms CRUD ---
export const getRoomsForAdmin = async () => {
	const result = await query(`
		SELECT r.id, r.room_number, r.room_category_id, r.floor, r.is_active,
		       rc.name as category_name,
		       r.image_path
		FROM hotel.rooms r
		LEFT JOIN hotel.room_categories rc ON r.room_category_id = rc.id
		ORDER BY r.room_number
	`);
	return result.rows;
};

export const getRoomById = async (id: string) => {
	const result = await query(
		`SELECT id, room_number, room_category_id, floor, is_active, image_path
		 FROM hotel.rooms WHERE id = $1`,
		[id]
	);
	return result.rows[0] || null;
};

export const createRoom = async (data: {
	room_number: number;
	room_category_id: string;
	floor?: number;
	image_path?: string;
}) => {
	const result = await query(
		`INSERT INTO hotel.rooms (room_number, room_category_id, floor, image_path)
		 VALUES ($1, $2, $3, $4)
		 RETURNING *`,
		[data.room_number, data.room_category_id, data.floor ?? null, data.image_path || null]
	);
	return result.rows[0];
};

export const updateRoom = async (
	id: string,
	data: {
		room_number?: number;
		room_category_id?: string;
		floor?: number;
		is_active?: boolean;
		image_path?: string;
	}
) => {
	const result = await query(
		`UPDATE hotel.rooms
		 SET room_number = COALESCE($2, room_number),
		     room_category_id = COALESCE($3, room_category_id),
		     floor = COALESCE($4, floor),
		     is_active = COALESCE($5, is_active),
		     image_path = COALESCE($6, image_path)
		 WHERE id = $1
		 RETURNING *`,
		[id, data.room_number, data.room_category_id, data.floor, data.is_active, data.image_path]
	);
	return result.rows[0] || null;
};

export const deleteRoom = async (id: string) => {
	await query(`DELETE FROM hotel.rooms WHERE id = $1`, [id]);
	return { success: true };
};
