
import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load env vars
dotenv.config();

// Config
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://zggkmqxnxtjizcygmyfj.supabase.co';
// Priority: Service Role Key (env) > Anon Key (env) > Hardcoded Anon
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpnZ2ttcXhueHRqaXpjeWdteWZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwMjYzODUsImV4cCI6MjA4NDYwMjM4NX0.Gl60adwYGd19vSCmjBAM7xXIzCptDj2dvKINvzePfFw';

// New path as requested
const SOURCE_DIR = 'C:/Users/Kali/Desktop/tattoo-vision-updated/project/Banque free tatouage';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
    }
});

function cleanName(filename) {
    // Remove extension
    let name = path.parse(filename).name;
    // Remove generated prefixes if common
    name = name.replace(/^vecteezy_/, '').replace(/^Gemini_Generated_Image_/, '').replace(/^—Pngtree—/, '');
    // Replace symbols with spaces
    name = name.replace(/[-_]/g, ' ');
    // Capitalize words
    return name.replace(/\b\w/g, l => l.toUpperCase()).trim();
}

async function main() {
    console.log('Starting upload from:', SOURCE_DIR);

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.warn('⚠️  WARNING: SUPABASE_SERVICE_ROLE_KEY not found in environment.');
        console.warn('   Using ANON KEY. This will likely fail due to Row Level Security (RLS).');
        console.warn('   To fix: ensure SUPABASE_SERVICE_ROLE_KEY is in your .env file.');
        console.log('   Current SUPABASE_KEY starts with:', SUPABASE_KEY.substring(0, 10));
    } else {
        console.log('✅ Using Service Role Key (Admin Mode)');
    }

    // Get a user ID to assign these tattoos to (required by DB schema)
    // We'll use the first user we find
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
    if (userError || !users || users.length === 0) {
        console.error("❌ Could not find any user to assign tattoos to. Please create a user first.");
        return;
    }
    const OWNER_ID = users[0].id;
    console.log(`ℹ️  Assigning tattoos to user ID: ${OWNER_ID} (${users[0].email})`);


    try {
        const files = await fs.readdir(SOURCE_DIR);

        for (const file of files) {
            if (['.jpg', '.jpeg', '.png', '.webp'].includes(path.extname(file).toLowerCase())) {
                console.log(`Processing ${file}...`);

                const filePath = path.join(SOURCE_DIR, file);
                const fileBuffer = await fs.readFile(filePath);
                const name = cleanName(file);

                // 1. Upload to Supabase Storage
                // We use a specific 'official' folder
                // Sanitize filename for storage path (remove special chars, spaces to underscores)
                const safeFilename = file.replace(/[^a-zA-Z0-9._-]/g, '_');
                const storagePath = `official/${safeFilename}`;

                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('tattoos')
                    .upload(storagePath, fileBuffer, {
                        contentType: path.extname(file) === '.png' ? 'image/png' : 'image/jpeg',
                        upsert: true
                    });

                if (uploadError) {
                    console.error(`  ❌ Upload failed for ${file}:`, uploadError.message);
                    continue;
                }

                // 2. Get Public URL
                const { data: { publicUrl } } = supabase.storage
                    .from('tattoos')
                    .getPublicUrl(storagePath);

                console.log(`  ✅ Uploaded. Public URL: ${publicUrl}`);

                // 3. Database Sync (Manual Upsert)
                const { data: existing } = await supabase
                    .from('tattoo_library')
                    .select('id')
                    .eq('image_url', publicUrl)
                    .single();

                let dbError;

                if (existing) {
                    console.log(`  🔄 Updating existing record for "${name}"`);
                    const { error } = await supabase
                        .from('tattoo_library')
                        .update({
                            name: name,
                            source: 'predefined',
                            category: 'Official',
                            is_favorite: false,
                            user_id: OWNER_ID // Assign owner
                        })
                        .eq('id', existing.id);
                    dbError = error;
                } else {
                    console.log(`  ➕ Creating new record for "${name}"`);
                    const { error } = await supabase
                        .from('tattoo_library')
                        .insert({
                            name: name,
                            image_url: publicUrl,
                            source: 'predefined',
                            category: 'Official',
                            is_favorite: false,
                            user_id: OWNER_ID // Assign owner
                        });
                    dbError = error;
                }

                if (dbError) {
                    console.error(`  ⚠️ Database sync failed for ${file}:`, dbError.message);
                } else {
                    console.log(`  ✅ Database record created for "${name}"`);
                }
            }
        }
    } catch (err) {
        console.error('Fatal error:', err);
        if (err.code === 'ENOENT') {
            console.error(`Directory not found: ${SOURCE_DIR}`);
        }
    }
}

main();
