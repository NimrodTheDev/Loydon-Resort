import { Pool, PoolConfig } from "pg";

// Get database configuration
const getDbConfig = (): PoolConfig => {
	// SSL configuration - check environment variable
	// Options: "require" (force SSL), "prefer" (try SSL first), "disable" (no SSL)
	const sslMode = process.env.DB_SSL_MODE || "prefer";
	
	// If DATABASE_URL is provided, use it
	if (process.env.DATABASE_URL) {
		const config: PoolConfig = {
			connectionString: process.env.DATABASE_URL,
			// Connection pool settings
			max: 20,
			idleTimeoutMillis: 30000,
			connectionTimeoutMillis: 10000,
		};
		
		// Configure SSL based on mode
		if (sslMode === "disable") {
			config.ssl = false;
		} else if (sslMode === "require") {
			// Force SSL (for cloud providers like Supabase)
			config.ssl = {
				rejectUnauthorized: false // Allow self-signed certificates
			};
		} else {
			// "prefer" mode - try with SSL first, but allow fallback
			// Default to false for local servers that don't support SSL
			config.ssl = false;
		}
		
		return config;
	}
	
	// Fallback to individual parameters (for local development)
	return {
		host: process.env.DB_HOST || 'localhost',
		port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
		database: process.env.DB_NAME || 'social_media_manager',
		user: process.env.DB_USER || 'postgres',
		password: process.env.DB_PASSWORD || '',
		ssl: sslMode === "require" ? { rejectUnauthorized: false } : false,
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

// Test connection on startup with retry logic
const testConnection = async (retries = 3, delay = 2000) => {
	for (let i = 0; i < retries; i++) {
		try {
			await pool.query("SELECT NOW()");
			console.log("✅ Database connection test successful");
			return;
		} catch (err: any) {
			if (i === retries - 1) {
				// Last retry failed
				console.error("❌ Database connection test failed after retries:");
				console.error(`   Error: ${err.message}`);
				console.error(`   Code: ${err.code || "N/A"}`);
				
				if (err.message?.includes("does not support SSL")) {
					console.error("\n💡 SSL not supported - Solution:");
					console.error("   Add this to your .env file:");
					console.error("   DB_SSL_MODE=disable");
					console.error("\n   Or if you need SSL (for cloud providers like Supabase):");
					console.error("   DB_SSL_MODE=require");
				} else if (err.code === "ETIMEDOUT" || err.message?.includes("timeout")) {
					console.error("\n💡 Connection timeout - Possible causes:");
					console.error("   1. Database server is down or unreachable");
					console.error("   2. Firewall/security group blocking the connection");
					console.error("   3. Wrong IP address or hostname in DATABASE_URL");
					console.error("   4. Network connectivity issues");
					console.error("   5. Supabase pooler might be overloaded - try again later");
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
				} else if (err.message?.includes("terminated")) {
					console.error("\n💡 Connection terminated - Possible causes:");
					console.error("   1. Supabase connection pool limit reached");
					console.error("   2. Connection idle timeout");
					console.error("   3. Network interruption");
					console.error("   4. Try using direct connection instead of pooler");
				}
				
				console.error("\n📋 Current DATABASE_URL format:");
				if (process.env.DATABASE_URL) {
					// Mask password in URL
					const maskedUrl = process.env.DATABASE_URL.replace(
						/:([^:@]+)@/,
						":***@"
					);
					console.error(`   ${maskedUrl}`);
					
					if (maskedUrl.includes("supabase.com")) {
						console.error("\n💡 Supabase-specific tips:");
						console.error("   1. Check Supabase dashboard for connection status");
						console.error("   2. Verify your project is active (not paused)");
						console.error("   3. Try using direct connection URL instead of pooler");
						console.error("   4. Check connection pool limits in Supabase dashboard");
						console.error("   5. Ensure SSL is enabled (already configured)");
					}
				} else {
					console.error("   DATABASE_URL not set, using individual parameters");
				}
			} else {
				// Retry
				console.log(`⚠️  Connection attempt ${i + 1} failed, retrying in ${delay}ms...`);
				await new Promise(resolve => setTimeout(resolve, delay));
			}
		}
	}
};

// Run connection test
testConnection();

export const query = (text: string, params?: any[]) => pool.query(text, params);
