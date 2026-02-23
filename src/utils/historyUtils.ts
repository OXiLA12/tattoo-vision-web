import { supabase } from '../lib/supabaseClient';
import { ImageData, TattooTransform } from '../types';
import { getImageHash } from './imageUtils';

/**
 * Upload a base64 data URL to Supabase Storage and return the public URL.
 * If the URL is already an http/https URL (already uploaded), returns it as-is.
 * Falls back to the original data URL if upload fails.
 */
async function uploadToStorage(userId: string, dataUrl: string, prefix: string): Promise<string> {
    // Already a remote URL — no upload needed
    if (dataUrl.startsWith('http://') || dataUrl.startsWith('https://')) {
        return dataUrl;
    }

    try {
        // Convert base64 to Blob
        const [header, base64] = dataUrl.split(',');
        const mimeMatch = header.match(/data:([^;]+)/);
        const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
        const ext = mimeType === 'image/png' ? 'png' : 'jpeg';

        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: mimeType });

        const fileName = `${userId}/${prefix}_${Date.now()}.${ext}`;

        const { error } = await supabase.storage
            .from('tattoo-history')
            .upload(fileName, blob, { contentType: mimeType, upsert: false });

        if (error) {
            console.warn('Storage upload failed, falling back to data URL:', error.message);
            return dataUrl; // fallback — better than crashing
        }

        const { data: publicData } = supabase.storage
            .from('tattoo-history')
            .getPublicUrl(fileName);

        return publicData.publicUrl;
    } catch (err) {
        console.warn('uploadToStorage error, using data URL fallback:', err);
        return dataUrl;
    }
}

export async function saveToHistory(
    userId: string,
    bodyImage: ImageData,
    tattooImage: ImageData,
    resultImageUrl: string,
    transform: TattooTransform,
    isRealistic: boolean = false
): Promise<boolean> {
    try {
        const hash = await getImageHash(resultImageUrl);

        // Upload images to Storage — keeps DB lightweight (URLs only, not base64 blobs)
        const [bodyUrl, tattooUrl, resultUrl] = await Promise.all([
            uploadToStorage(userId, bodyImage.url, 'body'),
            uploadToStorage(userId, tattooImage.url, 'tattoo'),
            uploadToStorage(userId, resultImageUrl, isRealistic ? 'render' : 'draft'),
        ]);

        const { error } = await supabase.rpc('save_to_history_v2', {
            p_user_id: userId,
            p_body_image_url: bodyUrl,
            p_tattoo_image_url: tattooUrl,
            p_result_image_url: resultUrl,
            p_hash: hash,
            p_is_realistic: isRealistic,
            p_transform_data: transform as unknown as any,
        });

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error saving to history:', error);
        return false;
    }
}

export async function getHistory(userId: string) {
    const { data, error } = await supabase
        .from('tattoo_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching history:', error);
        return [];
    }

    return data;
}

export async function deleteFromHistory(id: string): Promise<boolean> {
    const { error } = await supabase
        .from('tattoo_history')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting from history:', error);
        return false;
    }

    return true;
}
