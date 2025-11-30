import { Router } from "express";

const router = Router();

const roomsData = [
	{
		name: "Standard",
		icon: `<svg viewBox="0 0 200 150" fill="none" xmlns="http://www.w3.org/2000/svg"> <rect x="40" y="60" width="120" height="70" rx="5" fill="#c4b5a0" stroke="#4a4238" stroke-width="2"/> <rect x="50" y="50" width="100" height="50" fill="#d4c4b0" stroke="#4a4238" stroke-width="2"/> <line x1="100" y1="50" x2="100" y2="100" stroke="#4a4238" stroke-width="2"/> <rect x="20" y="100" width="15" height="30" fill="#8a7d6f"/> <rect x="15" y="90" width="25" height="15" fill="#b4a495"/> <rect x="55" y="20" width="90" height="25" fill="#b4a495" stroke="#4a4238" stroke-width="2"/> </svg>`,
		short_description:
			"Cozy room with essential amenities — perfect for solo travelers or couples.",
		price: 7000,
		ammedities: [
			"Television",
			"Fan",
			"A/C",
			"Shower",
			"3 socket spots",
			"Clothes rack",
			"drawer",
			"Bed size for 1",
		],
		available: [201, 202, 203, 204, 205, 206, 303, 304, 305, 306],
	},
	{
		name: "Deluxe",
		icon: `<svg viewBox="0 0 200 150" fill="none" xmlns="http://www.w3.org/2000/svg"> <rect x="30" y="60" width="140" height="70" rx="5" fill="#c4b5a0" stroke="#4a4238" stroke-width="2"/> <rect x="50" y="50" width="100" height="50" fill="#d4c4b0" stroke="#4a4238" stroke-width="2"/> <line x1="100" y1="50" x2="100" y2="100" stroke="#4a4238" stroke-width="2"/> <rect x="180" y="100" width="15" height="30" fill="#8a7d6f"/> <circle cx="187" cy="95" r="8" fill="#b4a495"/> <rect x="5" y="100" width="15" height="30" fill="#8a7d6f"/> <circle cx="12" cy="95" r="8" fill="#b4a495"/> <path d="M 85 30 Q 100 20 115 30" fill="#b4a495" stroke="#4a4238" stroke-width="2"/> </svg>`,
		short_description:
			"Spacious with upgraded furnishings — ideal for a comfortable stay.",
		price: 9000,
		ammedities: [
			"Television",
			"Fan",
			"A/C",
			"Shower",
			"3 socket spots",
			"Clothes rack",
			"drawer",
			"Bed size for 2",
		],
		available: [301, 308, 309],
	},
	{
		name: "Suite",
		icon: `<svg viewBox="0 0 200 150" fill="none" xmlns="http://www.w3.org/2000/svg"> <rect x="40" y="70" width="120" height="60" rx="5" fill="#c4b5a0" stroke="#4a4238" stroke-width="2"/> <rect x="50" y="60" width="100" height="40" fill="#d4c4b0" stroke="#4a4238" stroke-width="2"/> <line x1="70" y1="60" x2="70" y2="100" stroke="#4a4238" stroke-width="2"/> <line x1="130" y1="60" x2="130" y2="100" stroke="#4a4238" stroke-width="2"/> <rect x="15" y="105" width="15" height="25" fill="#8a7d6f"/> <rect x="10" y="95" width="25" height="15" fill="#b4a495"/> <rect x="165" y="30" width="30" height="40" fill="#b4a495" stroke="#4a4238" stroke-width="2"/> </svg>`,
		short_description:
			"Luxurious suite with extra space and premium amenities.",
		price: 10000,
		available: [302],
		ammedities: [
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
	},
];

const address = {
	street: "Ara Secondary School, Okuku",
	city: "Umuguma",
	state: "Owerri",
	country: "Nigeria",
	zip: "460117",
};
const phone = "08037144808";
const email = "nkemakolam.martin@gmail.com";
const hotelName = "Loydon Resort";
const website = "loydonresort.com";

router.get("/", (req, res) => {
	res.render("index", { page: "home", rooms: roomsData });
});
router.get("/rooms", (req, res) => {
	res.render("rooms", { page: "room", rooms: roomsData });
});
router.get("/rooms/:category", (req, res) => {
	const category = req.params.category.toLowerCase();
	res.render("roomDetails", {
		page: "room",
		room: roomsData.find((room) => room.name.toLowerCase() === category),
	});
});

router.get("/contact", (req, res) => {
	res.render("contact", {
		page: "contact",
		address,
		phone,
		email,
		hotelName,
		websiteUrl: website,
		nearbyLandmarks: [
			"After Orieukwu market, umuguma",
			"Umuguma, Police station",
			"Before Ara Secondary School, Okuku.",
		],
	});
});

router.use((req, res) => {
	res.status(404).render("404", { page: "" });
});

export default router;
