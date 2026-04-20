import { createClient } from "@supabase/supabase-js";
import postgres from "postgres";

async function makeAdmin() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error("DATABASE_URL missing");

  console.log("Connecting to Postgres...");
  const sql = postgres(dbUrl);

  try {
    const email = "grina_2@hotmail.com";
    const result = await sql`
      UPDATE users 
      SET is_admin = true 
      WHERE email = ${email}
      RETURNING id, name, email, is_admin;
    `;
    
    if (result.length > 0) {
      console.log(`✅ Success! User ${result[0].email} is now an admin.`);
    } else {
      console.log(`❌ User with email ${email} not found.`);
    }
  } catch (err) {
    console.error("Database error:", err);
  } finally {
    await sql.end();
  }
}

makeAdmin();
