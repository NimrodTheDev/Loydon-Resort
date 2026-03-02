import { query } from "../db";

export const addBookingCodeColumn = async () => {
  try {
    await query(`
      ALTER TABLE booking.bookings
      ADD COLUMN IF NOT EXISTS booking_code VARCHAR(10) UNIQUE,
      ADD COLUMN IF NOT EXISTS check_in_status VARCHAR(20) DEFAULT 'pending',
      ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
    `); 
    console.log("✅ Booking code column added successfully");
  } catch (error) {
    console.error("❌ Error adding booking code column:", error);
    throw error;
  }
};
  
export const addTransactionReferenceColumn = async () => {
  try {
    await query(`
      ALTER TABLE booking.bookings
      ADD COLUMN IF NOT EXISTS transaction_reference VARCHAR(255);
    `);
    console.log("✅ Transaction reference column added successfully");
  } catch (error) {
    console.error("❌ Error adding transaction reference column:", error);
    throw error;
  }
};


export const addUniqueTransactionReferenceColumn = async () => {
  try {
    await query(`
      CREATE UNIQUE INDEX IF NOT EXISTS transaction_reference_unique_idx
      ON booking.bookings (transaction_reference);
    `);
    console.log("✅ Unique transaction reference column added successfully");
  } catch (error) {
    console.error("❌ Error adding unique transaction reference column:", error);
    throw error;
  }
};

export const addPasswordColumns = async () => {
  try {
    await query(`
      ALTER TABLE hotel.hotel_info
      ADD COLUMN IF NOT EXISTS admin_password VARCHAR(150);
    `);
    console.log("✅ Password columns added successfully");
  } catch (error) {
    console.error("❌ Error adding password columns:", error);
    throw error;
  }
};

// Optional image path columns for rooms (categories reuse icon_svg as image path)
export const addRoomImagePathColumn = async () => {
  try {
    await query(`
      ALTER TABLE hotel.rooms
      ADD COLUMN IF NOT EXISTS image_path TEXT;
    `);
    console.log("✅ Room image_path column added successfully");
  } catch (error) {
    console.error("❌ Error adding room image_path column:", error);
    throw error;
  }
};

