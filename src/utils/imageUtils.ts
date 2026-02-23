import { ImageData } from '../types';

const MAX_DIMENSION = 2048;

export async function loadImageWithOrientation(
  file: File
): Promise<ImageData> {
  console.log('🔄 Loading media with orientation:', file.name, file.type, file.size);

  if (file.type.startsWith('video/')) {
    return extractFrameFromVideo(file);
  }

  // Read EXIF orientation from raw file bytes
  const arrayBuffer = await file.arrayBuffer();
  const orientation = await getOrientation(arrayBuffer);
  console.log('📐 Image orientation:', orientation);

  // KEY FIX: Use { imageOrientation: 'none' } to get raw pixels WITHOUT
  // browser auto-correcting EXIF orientation. Modern iOS Safari and Chrome
  // auto-apply EXIF when loading via img.src, causing a second unwanted
  // rotation that made portrait/selfie images appear small and wrong.
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'none' } as any);
    console.log('✅ createImageBitmap (raw, no auto-orientation):', bitmap.width, 'x', bitmap.height);
  } catch {
    // Fallback for browsers that don't support imageOrientation option.
    // These browsers also don't auto-correct, so the raw pixels are correct.
    bitmap = await createImageBitmap(file);
    console.log('⚠️ createImageBitmap fallback (may already be corrected):', bitmap.width, 'x', bitmap.height);
  }

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  let width = bitmap.width;
  let height = bitmap.height;
  console.log('📏 Raw dimensions:', width, 'x', height);

  // Scale down if needed, preserving aspect ratio
  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
    console.log('📉 Resized to:', width, 'x', height);
  }

  // For orientations 5-8 (90°/270°), canvas dimensions are swapped
  if (orientation >= 5) {
    canvas.width = height;
    canvas.height = width;
  } else {
    canvas.width = width;
    canvas.height = height;
  }

  // Apply EXIF rotation/flip transform
  switch (orientation) {
    case 2: ctx.transform(-1, 0, 0, 1, width, 0); break;
    case 3: ctx.transform(-1, 0, 0, -1, width, height); break;
    case 4: ctx.transform(1, 0, 0, -1, 0, height); break;
    case 5: ctx.transform(0, 1, 1, 0, 0, 0); break;
    case 6: ctx.transform(0, 1, -1, 0, height, 0); break;
    case 7: ctx.transform(0, -1, -1, 0, height, width); break;
    case 8: ctx.transform(0, -1, 1, 0, 0, width); break;
  }

  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close(); // Free GPU memory

  const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
  const quality = mimeType === 'image/jpeg' ? 0.85 : undefined;
  const correctedUrl = canvas.toDataURL(mimeType, quality);

  console.log('✅ Output:', canvas.width, 'x', canvas.height, '— orientation corrected');

  return {
    url: correctedUrl,
    width: canvas.width,
    height: canvas.height,
  };
}

async function extractFrameFromVideo(file: File): Promise<ImageData> {
  console.log('🎥 Extracting frame from video...');
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.setAttribute('playsinline', 'true');
    video.muted = true;

    const objectUrl = URL.createObjectURL(file);

    video.onloadeddata = () => {
      // Seek to 0.1s to avoid black frames at the very beginning of the video
      video.currentTime = 0.1;
    };

    video.onseeked = () => {
      URL.revokeObjectURL(objectUrl);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context for video extraction'));
        return;
      }

      let width = video.videoWidth;
      let height = video.videoHeight;

      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      canvas.width = width;
      canvas.height = height;

      ctx.drawImage(video, 0, 0, width, height);

      const correctedUrl = canvas.toDataURL('image/jpeg', 0.85);
      console.log('✅ Video frame extracted:', canvas.width, 'x', canvas.height);

      resolve({
        url: correctedUrl,
        width: canvas.width,
        height: canvas.height,
      });
    };

    video.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load video file.'));
    };

    video.src = objectUrl;
    video.load();
  });
}

async function getOrientation(arrayBuffer: ArrayBuffer): Promise<number> {
  if (arrayBuffer.byteLength < 2) return 1;

  const view = new DataView(arrayBuffer);

  if (view.getUint16(0, false) !== 0xffd8) {
    return 1;
  }

  const length = view.byteLength;
  let offset = 2;

  try {
    while (offset < length) {
      if (offset + 2 > length) return 1;
      if (view.getUint16(offset + 2, false) <= 8) return 1;
      const marker = view.getUint16(offset, false);
      offset += 2;

      if (marker === 0xffe1) {
        if (offset + 6 > length) return 1;
        const littleEndian = view.getUint16((offset += 2), false) === 0x4949;
        offset += view.getUint32(offset + 4, littleEndian);

        if (offset + 2 > length) return 1;
        const tags = view.getUint16(offset, littleEndian);
        offset += 2;

        for (let i = 0; i < tags; i++) {
          if (offset + i * 12 + 10 > length) break;
          if (view.getUint16(offset + i * 12, littleEndian) === 0x0112) {
            return view.getUint16(offset + i * 12 + 8, littleEndian);
          }
        }
      } else if ((marker & 0xff00) !== 0xff00) {
        break;
      } else {
        if (offset + 2 > length) break;
        const jump = view.getUint16(offset, false);
        if (jump <= 0) break; // Prevent infinite loop on corrupted data
        offset += jump;
      }
    }
  } catch (e) {
    console.warn('⚠️ Error parsing image orientation, returning default', e);
  }

  return 1;
}

export async function loadImageFromDataUrl(dataUrl: string): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      resolve({
        url: dataUrl,
        width: img.width,
        height: img.height,
      });
    };

    img.onerror = () => {
      reject(new Error('Failed to load image from data URL'));
    };

    img.src = dataUrl;
  });
}
export async function getImageHash(dataUrl: string): Promise<string> {
  const binaryString = atob(dataUrl.split(',')[1]);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const hashBuffer = await crypto.subtle.digest('SHA-256', bytes);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Convert a File object to a data URL (base64).
 * This ensures the image is persistent and won't be invalidated like blob URLs.
 */
export async function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Convert any image URL (including blob URLs or http URLs) to a data URL.
 * This loads the image, draws it to a canvas, and exports as base64.
 * Useful for converting Supabase storage URLs or blob URLs to persistent data URLs.
 */
export async function urlToDataURL(
  url: string,
  maxWidth: number = 2048,
  maxHeight: number = 2048,
  quality: number = 0.9
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // Enable CORS for external URLs

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        let { width, height } = img;

        // Calculate new dimensions if image is too large
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        // Determine format based on URL or default to JPEG
        const mimeType = url.toLowerCase().includes('.png') ? 'image/png' : 'image/jpeg';
        const dataURL = canvas.toDataURL(mimeType, quality);

        resolve(dataURL);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error(`Failed to load image from URL: ${url}`));
    };

    img.src = url;
  });
}

/**
 * Load an image from a URL and return ImageData with data URL.
 * This is useful for loading images from Supabase storage or other sources
 * and converting them to persistent data URLs.
 */
export async function loadImageFromUrl(url: string): Promise<ImageData> {
  const dataUrl = await urlToDataURL(url);
  return loadImageFromDataUrl(dataUrl);
}
