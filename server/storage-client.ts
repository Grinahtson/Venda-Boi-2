import { createClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";

// We will use existing DATABASE_URL to parse the project ID if there is no explicit SUPABASE_URL.
// But Ideally, we expect SUPABASE_URL and SUPABASE_KEY in the environment.
const supabaseUrl = process.env.SUPABASE_URL || getSupabaseUrlFromDbUrl(process.env.DATABASE_URL);
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || "dummy-key-for-typing";

export const supabase = createClient(supabaseUrl, supabaseKey);

function getSupabaseUrlFromDbUrl(dbUrl?: string): string {
  if (!dbUrl) return "";
  // Ex: postgresql://postgres:password@db.trylxjagmpkovbnkxucn.supabase.co:5432/postgres
  const match = dbUrl.match(/@db\.(.+?)\.supabase\.co/);
  if (match && match[1]) {
    return `https://${match[1]}.supabase.co`;
  }
  return "";
}

export async function uploadImageBase64(base64Data: string, bucketName: string = "ads-images"): Promise<string> {
  // Strip the prefix if present (e.g. data:image/png;base64,)
  const base64Content = base64Data.replace(/^data:image\/\w+;base64,/, "");
  const buffer = Buffer.from(base64Content, "base64");
  
  // Create a unique filename
  const extension = "jpg"; // You could sniff this from the buffer magic bytes for production
  const fileName = `${uuidv4()}.${extension}`;

  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(fileName, buffer, {
      contentType: "image/jpeg",
      cacheControl: "3600",
      upsert: false
    });

  if (error) {
    console.error("Supabase storage error:", error);
    throw new Error("Failed to upload image to Supabase Storage");
  }

  // Get public URL
  const { data: publicUrlData } = supabase.storage
    .from(bucketName)
    .getPublicUrl(fileName);

  return publicUrlData.publicUrl;
}
