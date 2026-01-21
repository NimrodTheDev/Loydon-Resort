import { Pool } from "pg";

export const pool = new Pool({
	connectionString: "postgres://postgres:root@localhost:5432/loydonresort",
});

export const query = (text: string, params?: any[]) => pool.query(text, params);
