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
		ORDER BY created_at DESC
		LIMIT 1
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
