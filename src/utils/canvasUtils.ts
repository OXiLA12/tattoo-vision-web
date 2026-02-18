import { ImageData, TattooTransform } from '../types';

export async function renderCompositeImage(
  bodyImage: ImageData,
  tattooImage: ImageData,
  transform: TattooTransform,
  containerSize: { width: number; height: number },
  watermark: boolean = false
): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Could not get canvas context');
    }

    const exportWidth = 1024;
    const aspectRatio = bodyImage.height / bodyImage.width;
    const exportHeight = exportWidth * aspectRatio;

    canvas.width = exportWidth;
    canvas.height = exportHeight;

    const bodyImg = new Image();
    bodyImg.crossOrigin = 'anonymous';
    bodyImg.onload = () => {
      ctx.drawImage(bodyImg, 0, 0, exportWidth, exportHeight);

      const tattooImg = new Image();
      tattooImg.crossOrigin = 'anonymous';
      tattooImg.onload = () => {
        const containerAspect = containerSize.width / containerSize.height;
        const imageAspect = bodyImage.width / bodyImage.height;

        let displayedWidth: number;
        let displayedHeight: number;
        let offsetX = 0;
        let offsetY = 0;

        if (containerAspect > imageAspect) {
          displayedHeight = containerSize.height;
          displayedWidth = displayedHeight * imageAspect;
          offsetX = (containerSize.width - displayedWidth) / 2;
        } else {
          displayedWidth = containerSize.width;
          displayedHeight = displayedWidth / imageAspect;
          offsetY = (containerSize.height - displayedHeight) / 2;
        }

        const scaleRatio = exportWidth / displayedWidth;

        const scaledX = (transform.x - offsetX) * scaleRatio;
        const scaledY = (transform.y - offsetY) * scaleRatio;
        const scaledWidth = tattooImage.width * transform.scale * scaleRatio;
        const scaledHeight = tattooImage.height * transform.scale * scaleRatio;

        ctx.save();
        ctx.translate(scaledX, scaledY);
        ctx.rotate((transform.rotation * Math.PI) / 180);
        ctx.globalAlpha = transform.opacity;

        if (transform.mask) {
          const maskImg = new Image();
          maskImg.onload = () => {
            // Create offscreen canvas for masked tattoo
            const offCanvas = document.createElement('canvas');
            offCanvas.width = scaledWidth;
            offCanvas.height = scaledHeight;
            const offCtx = offCanvas.getContext('2d')!;

            // Draw tattoo
            offCtx.drawImage(tattooImg, 0, 0, scaledWidth, scaledHeight);

            // Apply mask
            offCtx.globalCompositeOperation = 'destination-in';
            offCtx.drawImage(maskImg, 0, 0, scaledWidth, scaledHeight);

            // Draw result to main canvas
            ctx!.drawImage(offCanvas, -scaledWidth / 2, -scaledHeight / 2);
            finishRendering();
          };
          maskImg.src = transform.mask;
        } else {
          ctx!.drawImage(
            tattooImg,
            -scaledWidth / 2,
            -scaledHeight / 2,
            scaledWidth,
            scaledHeight
          );
          finishRendering();
        }

        function finishRendering() {
          ctx!.restore();

          if (watermark) {
            ctx!.font = 'bold 32px sans-serif';
            ctx!.fillStyle = 'rgba(255, 255, 255, 0.4)';
            ctx!.textAlign = 'right';
            ctx!.textBaseline = 'bottom';
            ctx!.shadowColor = 'rgba(0, 0, 0, 0.5)';
            ctx!.shadowBlur = 4;
            ctx!.fillText('Tattoo Vision', exportWidth - 30, exportHeight - 30);
          }

          resolve(canvas.toDataURL('image/png'));
        }
      };

      tattooImg.src = tattooImage.url;
    };

    bodyImg.src = bodyImage.url;
  });
}
