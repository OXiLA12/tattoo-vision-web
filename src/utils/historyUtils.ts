import { supabase } from '../lib/supabaseClient';
import { ImageData, TattooTransform } from '../types';

import { getImageHash } from './imageUtils';

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

        const { error } = await supabase.rpc('save_to_history_v2', {
            p_user_id: userId,
            p_body_image_url: bodyImage.url,
            p_tattoo_image_url: tattooImage.url,
            p_result_image_url: resultImageUrl,
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
