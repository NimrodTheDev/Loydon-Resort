import { Pool, PoolConfig } from "pg";

// Get database configuration
const getDbConfig = (): PoolConfig => {
	// If DATABASE_URL is provided, use it
	if (process.env.DATABASE_URL) {
		return {
			connectionString: process.env.DATABASE_URL,
			// Connection pool settings
			max: 20, // Maximum number of clients in the pool
			idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
			connectionTimeoutMillis: 10000, // Return an error after 10 seconds if connection cannot be established
		};
	}

	// Otherwise, use individual connection parameters
	return {
		host: process.env.DB_HOST || "localhost",
		port: parseInt(process.env.DB_PORT || "5432"),
		database: process.env.DB_NAME || "loydonresort",
		user: process.env.DB_USER || "postgres",
		password: process.env.DB_PASSWORD || "root",
		max: 20,
		idleTimeoutMillis: 30000,
		connectionTimeoutMillis: 10000,
	};
};

// Create connection pool with error handling
export const pool = new Pool(getDbConfig());

// Handle pool errors
pool.on("error", (err) => {
	console.error("❌ Unexpected database pool error:", err);
});

pool.on("connect", () => {
	console.log("✅ Database connection established");
});

// Test connection on startup
pool.query("SELECT NOW()")
	.then(() => {
		console.log("✅ Database connection test successful");
	})
	.catch((err) => {
		console.error("❌ Database connection test failed:");
		console.error(`   Error: ${err.message}`);
		console.error(`   Code: ${err.code || "N/A"}`);
		
		if (err.code === "ETIMEDOUT") {
			console.error("\n💡 Connection timeout - Possible causes:");
			console.error("   1. Database server is down or unreachable");
			console.error("   2. Firewall/security group blocking the connection");
			console.error("   3. Wrong IP address or hostname in DATABASE_URL");
			console.error("   4. Network connectivity issues");
		} else if (err.code === "ECONNREFUSED") {
			console.error("\n💡 Connection refused - Possible causes:");
			console.error("   1. Database server is not running");
			console.error("   2. Wrong port number");
			console.error("   3. Database is not accepting connections");
			console.error("   4. Security group/firewall blocking the port");
		} else if (err.code === "ENOTFOUND") {
			console.error("\n💡 Host not found - Possible causes:");
			console.error("   1. Wrong hostname in DATABASE_URL");
			console.error("   2. DNS resolution failure");
		}
		
		console.error("\n📋 Current DATABASE_URL format:");
		if (process.env.DATABASE_URL) {
			// Mask password in URL
			const maskedUrl = process.env.DATABASE_URL.replace(
				/:([^:@]+)@/,
				":***@"
			);
			console.error(`   ${maskedUrl}`);
		} else {
			console.error("   DATABASE_URL not set, using individual parameters");
		}
	});

export const query = (text: string, params?: any[]) => pool.query(text, params);
