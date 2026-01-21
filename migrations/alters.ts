import { query } from "../db";

export const addBookingCodeColumn = async () => {
	await query(`
    ALTER TABLE booking.bookings
    ADD COLUMN IF NOT EXISTS booking_code VARCHAR(10) UNIQUE;
  `);
};
