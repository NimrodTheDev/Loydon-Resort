import { query } from "../db";

export const seedDatabase = async () => {
	try {
		// Insert hotel info
		await query(`
			INSERT INTO hotel.hotel_info (name, street, city, state, country, zip, phone, email, website)
			VALUES ('Loydon Resort', 'Ara Secondary School, Okuku', 'Umuguma', 'Owerri', 'Nigeria', '460117', '08037144808', 'nkemakolam.martin@gmail.com', 'loydonresort.com')
			ON CONFLICT DO NOTHING;
		`);

		// Insert amenities
		const amenities = [
			"Television",
			"Fan",
			"A/C",
			"Shower",
			"3 socket spots",
			"Clothes rack",
			"drawer",
			"Bed size for 1",
			"Bed size for 2",
			"Bed size for 3",
			"Extra space",
		];

		for (const amenity of amenities) {
			await query(
				`
				INSERT INTO hotel.amenities (name)
				VALUES ($1)
				ON CONFLICT (name) DO NOTHING;
			`,
				[amenity]
			);
		}

		// Get amenity IDs
		const amenityRows = await query(`SELECT id, name FROM hotel.amenities`);
		const amenityMap = new Map(
			amenityRows.rows.map((row) => [row.name, row.id])
		);

		// Insert room categories with amenities
		const categories = [
			{
				name: "Standard",
				short_description:
					"Cozy room with essential amenities — perfect for solo travelers or couples.",
				price: 7000,
				icon_svg: `<svg viewBox="0 0 200 150" fill="none" xmlns="http://www.w3.org/2000/svg"> <rect x="40" y="60" width="120" height="70" rx="5" fill="#c4b5a0" stroke="#4a4238" stroke-width="2"/> <rect x="50" y="50" width="100" height="50" fill="#d4c4b0" stroke="#4a4238" stroke-width="2"/> <line x1="100" y1="50" x2="100" y2="100" stroke="#4a4238" stroke-width="2"/> <rect x="20" y="100" width="15" height="30" fill="#8a7d6f"/> <rect x="15" y="90" width="25" height="15" fill="#b4a495"/> <rect x="55" y="20" width="90" height="25" fill="#b4a495" stroke="#4a4238" stroke-width="2"/> </svg>`,
				amenities: [
					"Television",
					"Fan",
					"A/C",
					"Shower",
					"3 socket spots",
					"Clothes rack",
					"drawer",
					"Bed size for 1",
				],
				rooms: [201, 202, 203, 204, 205, 206, 303, 304, 305, 306],
			},
			{
				name: "Deluxe",
				short_description:
					"Spacious with upgraded furnishings — ideal for a comfortable stay.",
				price: 9000,
				icon_svg: `<svg viewBox="0 0 200 150" fill="none" xmlns="http://www.w3.org/2000/svg"> <rect x="30" y="60" width="140" height="70" rx="5" fill="#c4b5a0" stroke="#4a4238" stroke-width="2"/> <rect x="50" y="50" width="100" height="50" fill="#d4c4b0" stroke="#4a4238" stroke-width="2"/> <line x1="100" y1="50" x2="100" y2="100" stroke="#4a4238" stroke-width="2"/> <rect x="180" y="100" width="15" height="30" fill="#8a7d6f"/> <circle cx="187" cy="95" r="8" fill="#b4a495"/> <rect x="5" y="100" width="15" height="30" fill="#8a7d6f"/> <circle cx="12" cy="95" r="8" fill="#b4a495"/> <path d="M 85 30 Q 100 20 115 30" fill="#b4a495" stroke="#4a4238" stroke-width="2"/> </svg>`,
				amenities: [
					"Television",
					"Fan",
					"A/C",
					"Shower",
					"3 socket spots",
					"Clothes rack",
					"drawer",
					"Bed size for 2",
				],
				rooms: [301, 308, 309],
			},
			{
				name: "Suite",
				short_description:
					"Luxurious suite with extra space and premium amenities.",
				price: 10000,
				icon_svg: `<svg viewBox="0 0 200 150" fill="none" xmlns="http://www.w3.org/2000/svg"> <rect x="40" y="70" width="120" height="60" rx="5" fill="#c4b5a0" stroke="#4a4238" stroke-width="2"/> <rect x="50" y="60" width="100" height="40" fill="#d4c4b0" stroke="#4a4238" stroke-width="2"/> <line x1="70" y1="60" x2="70" y2="100" stroke="#4a4238" stroke-width="2"/> <line x1="130" y1="60" x2="130" y2="100" stroke="#4a4238" stroke-width="2"/> <rect x="15" y="105" width="15" height="25" fill="#8a7d6f"/> <rect x="10" y="95" width="25" height="15" fill="#b4a495"/> <rect x="165" y="30" width="30" height="40" fill="#b4a495" stroke="#4a4238" stroke-width="2"/> </svg>`,
				amenities: [
					"Television",
					"Fan",
					"A/C",
					"Shower",
					"3 socket spots",
					"Clothes rack",
					"drawer",
					"Bed size for 3",
					"Extra space",
				],
				rooms: [302],
			},
		];

		for (const category of categories) {
			const amenityIds = category.amenities
				.map((name) => amenityMap.get(name))
				.filter(Boolean);

			const categoryResult = await query(
				`
				INSERT INTO hotel.room_categories (name, short_description, price, icon_svg, amenity_ids)
				VALUES ($1, $2, $3, $4, $5)
				ON CONFLICT (name) DO UPDATE SET
					short_description = EXCLUDED.short_description,
					price = EXCLUDED.price,
					icon_svg = EXCLUDED.icon_svg,
					amenity_ids = EXCLUDED.amenity_ids
				RETURNING id;
			`,
				[
					category.name,
					category.short_description,
					category.price,
					category.icon_svg,
					amenityIds,
				]
			);

			const categoryId = categoryResult.rows[0].id;

			// Insert rooms for this category
			for (const roomNumber of category.rooms) {
				await query(
					`
					INSERT INTO hotel.rooms (room_number, room_category_id, floor)
					VALUES ($1, $2, $3)
					ON CONFLICT (room_number) DO NOTHING;
				`,
					[roomNumber, categoryId, Math.floor(roomNumber / 100)]
				);
			}
		}

		console.log("✅ Database seeded successfully");
	} catch (error) {
		console.error("❌ Error seeding database:", error);
		throw error;
	}
};
