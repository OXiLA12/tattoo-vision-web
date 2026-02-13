import { ImageData } from '../types';

const MAX_DIMENSION = 2048;

export async function loadImageWithOrientation(
  file: File
): Promise<ImageData> {
  console.log('🔄 Loading image with orientation:', file.name, file.type, file.size);

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      const arrayBuffer = e.target?.result as ArrayBuffer;
      const orientation = await getOrientation(arrayBuffer);
      console.log('📐 Image orientation:', orientation);

      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        console.log('✅ Blob URL loaded, converting to data URL...');
        // Avoid leaking object URLs
        URL.revokeObjectURL(objectUrl);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        let width = img.width;
        let height = img.height;
        console.log('📏 Original dimensions:', width, 'x', height);

        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
          console.log('📉 Resized to:', width, 'x', height);
        }

        if (orientation > 4) {
          canvas.width = height;
          canvas.height = width;
        } else {
          canvas.width = width;
          canvas.height = height;
        }

        switch (orientation) {
          case 2:
            ctx.transform(-1, 0, 0, 1, width, 0);
            break;
          case 3:
            ctx.transform(-1, 0, 0, -1, width, height);
            break;
          case 4:
            ctx.transform(1, 0, 0, -1, 0, height);
            break;
          case 5:
            ctx.transform(0, 1, 1, 0, 0, 0);
            break;
          case 6:
            ctx.transform(0, 1, -1, 0, height, 0);
            break;
          case 7:
            ctx.transform(0, -1, -1, 0, height, width);
            break;
          case 8:
            ctx.transform(0, -1, 1, 0, 0, width);
            break;
        }

        // Draw with calculated dimensions. The transform handles the orientation.
        ctx.drawImage(img, 0, 0, width, height);

        const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const quality = mimeType === 'image/jpeg' ? 0.85 : undefined;
        const correctedUrl = canvas.toDataURL(mimeType, quality);

        console.log('✅ Data URL created:', correctedUrl.substring(0, 50) + '...', 'Length:', correctedUrl.length);

        resolve({
          url: correctedUrl,
          width: canvas.width,
          height: canvas.height,
        });
      };

      img.onerror = (err) => {
        console.error('❌ Failed to load blob URL');
        URL.revokeObjectURL(objectUrl);
        reject(err);
      };
      img.src = objectUrl;
    };

    reader.onerror = (err) => {
      console.error('❌ FileReader error');
      reject(err);
    };
    reader.readAsArrayBuffer(file);
  });
}

async function getOrientation(arrayBuffer: ArrayBuffer): Promise<number> {
  const view = new DataView(arrayBuffer);

  if (view.getUint16(0, false) !== 0xffd8) {
    return 1;
  }

  const length = view.byteLength;
  let offset = 2;

  while (offset < length) {
    if (view.getUint16(offset + 2, false) <= 8) return 1;
    const marker = view.getUint16(offset, false);
    offset += 2;

    if (marker === 0xffe1) {
      const littleEndian = view.getUint16((offset += 2), false) === 0x4949;
      offset += view.getUint32(offset + 4, littleEndian);
      const tags = view.getUint16(offset, littleEndian);
      offset += 2;

      for (let i = 0; i < tags; i++) {
        if (view.getUint16(offset + i * 12, littleEndian) === 0x0112) {
          return view.getUint16(offset + i * 12 + 8, littleEndian);
        }
      }
    } else if ((marker & 0xff00) !== 0xff00) {
      break;
    } else {
      offset += view.getUint16(offset, false);
    }
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
