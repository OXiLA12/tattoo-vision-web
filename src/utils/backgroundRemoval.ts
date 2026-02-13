import { ImageData } from '../types';
import { loadImageFromDataUrl } from './imageUtils';
import { supabase } from '../lib/supabaseClient';
import { invokeWithAuth } from '../lib/invokeWithAuth';
import { generateUUID } from './uuid';

export async function removeBackground(imageUrl: string): Promise<ImageData> {
  try {
    console.log('🔄 Starting background removal...');

    const { data: sess } = await supabase.auth.getSession();
    console.log("✅ Session exists?", !!sess.session, "User ID:", sess.session?.user?.id);

    if (!sess.session?.user) {
      throw new Error('You must be logged in to remove backgrounds');
    }

    console.log('📤 Calling remove-background function...');
    const { data, error: invokeError } = await invokeWithAuth('remove-background', {
      body: {
        imageBase64: imageUrl.split(',')[1] || imageUrl,
        request_id: generateUUID(),
      },
    }) as { data: any; error: any };

    if (invokeError) {
      console.error("❌ Invoke error:", invokeError);
      throw new Error(invokeError.message || 'Failed to remove background');
    }

    console.log('📥 Response received:', data);

    // Check for specific error responses
    if (data?.error) {
      console.error("❌ API returned error:", data.error);

      if (data.error === 'PLAN_RESTRICTED') {
        throw new Error('🔒 Fonctionnalité Premium\n\nLa suppression d\'arrière-plan nécessite un plan PLUS ou supérieur.\n\n💡 Passez à un plan supérieur pour débloquer cette fonctionnalité et bien plus encore!');
      }

      if (data.error === 'INSUFFICIENT_POINTS') {
        const needed = data.requiredPoints || 250;
        const current = data.balance || 0;
        const missing = needed - current;
        throw new Error(`💰 Vision Points Insuffisants\n\nVous avez besoin de ${needed} VP mais vous n'en avez que ${current}.\nIl vous manque ${missing} VP.\n\n💡 Passez à un plan supérieur pour obtenir plus de Vision Points chaque mois!`);
      }

      throw new Error(data.error);
    }

    if (!data?.imageBase64) {
      console.error("❌ No image data in response:", data);
      throw new Error('No image data returned from service');
    }

    console.log('✅ Background removed successfully, converting to ImageData...');
    const resultUrl = `data:image/png;base64,${data.imageBase64}`;
    return await loadImageFromDataUrl(resultUrl);
  } catch (error) {
    console.error('❌ Error removing background:', error);

    // Provide more specific error messages
    if (error instanceof Error) {
      throw error;
    }

    throw new Error('An unexpected error occurred while removing the background. Please try again.');
  }
}
