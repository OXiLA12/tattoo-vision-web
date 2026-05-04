export async function addWatermark(imageUrl: string): Promise<string> {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';

        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) { resolve(imageUrl); return; }

            ctx.drawImage(img, 0, 0);

            const fontSize = Math.max(13, Math.round(img.width * 0.022));
            const padding = Math.max(12, Math.round(img.width * 0.018));

            ctx.font = `500 ${fontSize}px 'Arial', sans-serif`;
            ctx.textAlign = 'right';
            ctx.textBaseline = 'bottom';

            // Subtle dark shadow so it's visible on light backgrounds too
            ctx.shadowColor = 'rgba(0,0,0,0.55)';
            ctx.shadowBlur = 6;
            ctx.shadowOffsetX = 1;
            ctx.shadowOffsetY = 1;

            ctx.fillStyle = 'rgba(255,255,255,0.50)';
            ctx.fillText('tattoo_vision', img.width - padding, img.height - padding);

            resolve(canvas.toDataURL('image/png'));
        };

        img.onerror = () => resolve(imageUrl);
        img.src = imageUrl;
    });
}
