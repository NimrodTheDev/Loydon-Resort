import express from "express";
import path from "path";
import router from "./routes/page.js";
import { runMigrations } from "./migrations/schema";
import { seedDatabase } from "./migrations/seed";
import { addBookingCodeColumn, addTransactionReferenceColumn } from "./migrations/alters.js";
import apiRouter from "./routes/api.js";

(async () => {
	const App = express();
	App.use(express.json());
	App.set("view engine", "ejs");
	App.set("views", path.join(process.cwd(), "views"));
	App.use("/api/", apiRouter);
	App.use(express.static("public"));
	App.use("/", router);
	

	// Run database migrations and seed data before starting the server
	await runMigrations();
	await addBookingCodeColumn()
		.then(() => addTransactionReferenceColumn())
		.then(() => seedDatabase())
		.then(() => {
			App.listen(3010, () =>
				console.log("✅ Server listening on http://localhost:3010")
			);
		})
		.catch((error) => {
			console.error("Failed to start server:", error);
			process.exit(1);
		});
})();
