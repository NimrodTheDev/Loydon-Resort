import { query } from "../db";

export const addBookingCodeColumn = async () => {
	await query(`
    ALTER TABLE booking.bookings
    ADD COLUMN IF NOT EXISTS booking_code VARCHAR(10) UNIQUE,
    ADD COLUMN IF NOT EXISTS check_in_status VARCHAR(20) DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
  `);
};

export const addTransactionReferenceColumn = async () => {
	await query(`
    ALTER TABLE booking.bookings
    ADD COLUMN IF NOT EXISTS transaction_reference VARCHAR(255);
  `);
};
