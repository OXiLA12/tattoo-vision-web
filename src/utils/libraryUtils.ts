import { supabase } from '../lib/supabaseClient';
import { getImageHash } from './imageUtils';

export async function saveToMyLibrary(
    userId: string,
    imageData: string,
    name: string,
    source: 'generated' | 'imported',
    prompt?: string
) {
    try {
        // 1. Compute Hash
        const hash = await getImageHash(imageData);

        // 2. Prepare path
        const path = `${userId}/${hash}.png`;

        // 3. Convert dataUrl to Blob
        const response = await fetch(imageData);
        const blob = await response.blob();

        // 4. Upload to Storage (UPSERT)
        const { error: uploadError } = await supabase.storage
            .from('tattoos')
            .upload(path, blob, {
                upsert: true,
                contentType: 'image/png'
            });

        if (uploadError) throw uploadError;

        // 5. Get Public URL
        const { data: { publicUrl } } = supabase.storage
            .from('tattoos')
            .getPublicUrl(path);

        // 6. Insert into DB (using the new function or plain RPC if we prefer)
        const { data, error: dbError } = await supabase.rpc('save_to_library', {
            p_user_id: userId,
            p_name: name,
            p_image_url: publicUrl,
            p_hash: hash,
            p_source: source,
            p_prompt: prompt
        });

        if (dbError) throw dbError;

        return { success: true, data };
    } catch (error) {
        console.error('Error saving to library:', error);
        return { success: false, error };
    }
}
