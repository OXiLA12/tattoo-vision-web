
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_KEY) {
    console.error("No service key!");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false }
});

async function test() {
    console.log("Testing connection...");

    // 1. Check Key Role
    // Manually decode part of JWT
    const parts = SERVICE_KEY.split('.');
    if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        console.log("Key Role Claim:", payload.role);
    } else {
        console.log("Could not parse JWT (might be malformed)");
    }

    // 2. List Buckets
    const { data: buckets, error } = await supabase.storage.listBuckets();
    if (error) {
        console.error("❌ List Buckets Error:", error);
    } else {
        console.log("✅ Buckets found:", buckets.map(b => b.name));
    }

    // 3. Try to upload a tiny file as test
    const testBuffer = Buffer.from("test");
    const { data, error: uploadError } = await supabase.storage.from('tattoos').upload('official/test.txt', testBuffer, { upsert: true });

    if (uploadError) {
        console.error("❌ Upload Error:", uploadError);
    } else {
        console.log("✅ Upload worked!");
    }
}

test();
