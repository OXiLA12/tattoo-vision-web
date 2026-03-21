import { ImageData } from '../types';

const MAX_DIMENSION = 2048;

export async function loadImageWithOrientation(file: File): Promise<ImageData> {
    console.log('🔄 Loading media:', file.name, file.type, file.size);

    if (file.type.startsWith('video/')) {
        return extractFrameFromVideo(file);
    }

    const arrayBuffer = await file.arrayBuffer();
    const orientation = await getOrientation(arrayBuffer);
    console.log('📐 EXIF orientation:', orientation);

    // Use { imageOrientation: 'none' } to get raw pixels WITHOUT browser
    // auto-correcting EXIF — prevents double-rotation on iOS Safari / Chrome
    let bitmap: ImageBitmap;
    try {
        bitmap = await createImageBitmap(file, { imageOrientation: 'none' } as any);
    } catch {
        bitmap = await createImageBitmap(file);
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');

    let width = bitmap.width;
    let height = bitmap.height;

    if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
    }

    if (orientation >= 5) {
        canvas.width = height;
        canvas.height = width;
    } else {
        canvas.width = width;
        canvas.height = height;
    }

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
    bitmap.close();

    const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
    const quality = mimeType === 'image/jpeg' ? 0.85 : undefined;
    const correctedUrl = canvas.toDataURL(mimeType, quality);

    console.log('✅ Output:', canvas.width, 'x', canvas.height);
    return { url: correctedUrl, width: canvas.width, height: canvas.height };
}

async function extractFrameFromVideo(file: File): Promise<ImageData> {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        video.setAttribute('playsinline', 'true');
        video.muted = true;

        const objectUrl = URL.createObjectURL(file);
        video.onloadeddata = () => { video.currentTime = 0.1; };

        video.onseeked = () => {
            URL.revokeObjectURL(objectUrl);
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) { reject(new Error('Could not get canvas context')); return; }

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
            resolve({ url: correctedUrl, width: canvas.width, height: canvas.height });
        };

        video.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error('Failed to load video file.')); };
        video.src = objectUrl;
        video.load();
    });
}

async function getOrientation(arrayBuffer: ArrayBuffer): Promise<number> {
    if (arrayBuffer.byteLength < 2) return 1;
    const view = new DataView(arrayBuffer);
    if (view.getUint16(0, false) !== 0xffd8) return 1;

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
                if (jump <= 0) break;
                offset += jump;
            }
        }
    } catch (e) {
        console.warn('⚠️ EXIF parse error', e);
    }
    return 1;
}

export async function loadImageFromDataUrl(dataUrl: string): Promise<ImageData> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve({ url: dataUrl, width: img.width, height: img.height });
        img.onerror = () => reject(new Error('Failed to load image from data URL'));
        img.src = dataUrl;
    });
}

export async function getImageHash(dataUrl: string): Promise<string> {
    const binaryString = atob(dataUrl.split(',')[1]);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
    const hashBuffer = await crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function fileToDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

export async function urlToDataURL(url: string, maxWidth = 2048, maxHeight = 2048, quality = 0.9): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) { reject(new Error('Could not get canvas context')); return; }
                let { width, height } = img;
                if (width > maxWidth || height > maxHeight) {
                    const ratio = Math.min(maxWidth / width, maxHeight / height);
                    width = Math.round(width * ratio);
                    height = Math.round(height * ratio);
                }
                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);
                const mimeType = url.toLowerCase().includes('.png') ? 'image/png' : 'image/jpeg';
                resolve(canvas.toDataURL(mimeType, quality));
            } catch (error) { reject(error); }
        };
        img.onerror = () => reject(new Error(`Failed to load image from URL: ${url}`));
        img.src = url;
    });
}

export async function loadImageFromUrl(url: string): Promise<ImageData> {
    const dataUrl = await urlToDataURL(url);
    return loadImageFromDataUrl(dataUrl);
}

/**
 * Bakes a diagonal tiled "TATTOO VISION" watermark into image pixels.
 * NOT a CSS overlay — survives screenshots and DevTools inspection.
 * Applies a white wash + black text pattern covering the entire image.
 */
export async function applyWatermark(dataUrl: string): Promise<string> {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d')!;

            // 1. Draw original image
            ctx.drawImage(img, 0, 0);

            // 2. White overlay — lightens image so black watermark is visible
            ctx.save();
            ctx.globalAlpha = 0.55;
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.restore();

            // 3. Watermark text setup
            const fontSize = Math.round(Math.max(img.width, img.height) * 0.075);
            ctx.font = `900 ${fontSize}px Arial, Helvetica, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.shadowColor = 'rgba(255,255,255,0.4)';
            ctx.shadowBlur = fontSize * 0.1;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
            ctx.globalAlpha = 1;

            // 4. Tile at -30° with brick offset — impossible to crop cleanly
            ctx.save();
            ctx.translate(img.width / 2, img.height / 2);
            ctx.rotate(-Math.PI / 6);

            const diagonal = Math.sqrt(img.width ** 2 + img.height ** 2);
            const colSpacing = fontSize * 9;
            const rowSpacing = fontSize * 3.5;
            const cols = Math.ceil(diagonal / colSpacing) + 3;
            const rows = Math.ceil(diagonal / rowSpacing) + 3;

            for (let row = -rows; row <= rows; row++) {
                for (let col = -cols; col <= cols; col++) {
                    const xOffset = (row % 2 === 0) ? 0 : colSpacing / 2;
                    ctx.fillText('TATTOO VISION', col * colSpacing + xOffset, row * rowSpacing);
                }
            }
            ctx.restore();

            resolve(canvas.toDataURL('image/jpeg', 0.88));
        };
        img.src = dataUrl;
    });
}
