import { query } from "../db";

export const seedDatabase = async () => {
	try {
		// Insert hotel info
		const count = await query(`SELECT 1 FROM hotel.hotel_info LIMIT 1`)
		if (count.rows.length > 0) {
			return;
		}
		await query(`
			INSERT INTO hotel.hotel_info (name, street, city, state, country, zip, phone, email, website, admin_password)
			VALUES ('Loydon Resort', 'Ara Secondary School, Okuku', 'Umuguma', 'Owerri', 'Nigeria', '460117', '08037144808', 'loydon71@gmail.com', 'loydonresort.com', 'admin')
			ON CONFLICT DO NOTHING;
		`);

		console.log("✅ Database seeded successfully");
	} catch (error) {
		console.error("❌ Error seeding database:", error);
		throw error;
	}
};
