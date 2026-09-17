import "dotenv/config";
import { drizzle } from "drizzle-orm/neon-http";
import { neon, neonConfig } from "@neondatabase/serverless";

const sql = neon(process.env.Database_URL);
const db = drizzle(sql);

export { db, sql };