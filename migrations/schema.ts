import { query } from "../db";

export const runMigrations = async () => {
	console.log("🔄 Running database migrations...");
	try {
		await query(`
			CREATE SCHEMA IF NOT EXISTS hotel;
			CREATE SCHEMA IF NOT EXISTS booking;
			CREATE SCHEMA IF NOT EXISTS event;
			CREATE SCHEMA IF NOT EXISTS billing;

			CREATE TABLE IF NOT EXISTS hotel.hotel_info (
				id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
				name VARCHAR(150) NOT NULL,
				street TEXT NOT NULL,
				city VARCHAR(100),
				state VARCHAR(100),
				country VARCHAR(100),
				zip VARCHAR(20),
				phone VARCHAR(30),
				email VARCHAR(150),
				website VARCHAR(150),
				created_at TIMESTAMP DEFAULT NOW()
			);

			CREATE TABLE IF NOT EXISTS hotel.room_categories (
				id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
				name VARCHAR(50) UNIQUE NOT NULL,
				short_description TEXT,
				price INTEGER NOT NULL,
				icon_svg TEXT,
				amenity_ids UUID[] DEFAULT '{}',
				created_at TIMESTAMP DEFAULT NOW()
			);

			CREATE TABLE IF NOT EXISTS hotel.amenities (
				id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
				name VARCHAR(100) UNIQUE NOT NULL
			);

			CREATE TABLE IF NOT EXISTS hotel.rooms (
				id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
				room_number INTEGER UNIQUE NOT NULL,
				room_category_id UUID NOT NULL REFERENCES hotel.room_categories(id),
				floor INTEGER,
				is_active BOOLEAN DEFAULT true
			);


			CREATE TABLE IF NOT EXISTS booking.bookings (
				id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
				guest_name VARCHAR(150) NOT NULL,
				guest_email VARCHAR(150) NOT NULL,
				guest_phone VARCHAR(30),
				room_ids UUID[] NOT NULL,
				check_in_date DATE NOT NULL,
				check_out_date DATE NOT NULL,
				total_price INTEGER NOT NULL,
				status VARCHAR(50) DEFAULT 'pending',
				booking_code VARCHAR(10) UNIQUE,
				check_in_status VARCHAR(20) DEFAULT 'pending',
				checked_in_at TIMESTAMP,
				created_at TIMESTAMP DEFAULT NOW()
			);
		`);

		console.log("✅ Database migrations completed successfully");
	} catch (error) {
		console.error("❌ Error running migrations:", error);
		throw error;
	}
};
