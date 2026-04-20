import { createClient } from "@supabase/supabase-js";

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error("DATABASE_URL missing");
  
  const match = dbUrl.match(/@db\.(.+?)\.supabase\.co/);
  const supabaseUrl = match ? `https://${match[1]}.supabase.co` : "";
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing supabase URL or Service Role Key");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log("Checking if ads-images bucket exists...");
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  
  if (listError) {
    console.error("Error listing buckets:", listError);
    process.exit(1);
  }

  const bucketExists = buckets.some(b => b.name === "ads-images");

  if (!bucketExists) {
    console.log("Bucket not found. Creating 'ads-images' as a public bucket...");
    const { data, error } = await supabase.storage.createBucket('ads-images', {
      public: true,
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'],
      fileSizeLimit: 10485760 // 10MB
    });

    if (error) {
      console.error("Error creating bucket:", error);
    } else {
      console.log("✅ Bucket 'ads-images' created successfully!");
    }
  } else {
    console.log("✅ Bucket 'ads-images' already exists!");
    
    // Ensure it's public just in case
    await supabase.storage.updateBucket('ads-images', {
      public: true
    });
  }
}

main().catch(console.error);
