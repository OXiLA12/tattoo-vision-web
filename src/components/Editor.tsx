import { useRef, useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, ZoomIn, ZoomOut, RotateCw, Maximize2, Minimize2, Eraser, Loader2, AlertCircle } from 'lucide-react';
import { ImageData, TattooTransform } from '../types';
import { renderCompositeImage } from '../utils/canvasUtils';
import { useAuth } from '../contexts/AuthContext';
import { removeBackground } from '../utils/backgroundRemoval';
import PlanPricingModal from './PlanPricingModal';
import OnboardingTour from './OnboardingTour';
import { useLanguage } from '../contexts/LanguageContext';

interface EditorProps {
  bodyImage: ImageData;
  tattooImage: ImageData;
  transform: TattooTransform;
  onTransformChange: (transform: TattooTransform) => void;
  onTattooImageChange: (image: ImageData) => void;
  onBack: () => void;
  onNext: (exportedUrl: string) => void;
  onRealistic: () => void;
}

type InteractionMode =
  | 'none'
  | 'dragging'
  | 'scaling-tl'
  | 'scaling-tr'
  | 'scaling-bl'
  | 'scaling-br'
  | 'rotating';

export default function Editor({
  bodyImage,
  tattooImage,
  transform,
  onTransformChange,
  onTattooImageChange,
  onBack,
  onNext,
  onRealistic,
}: EditorProps) {
  const { t } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);
  const [interactionMode, setInteractionMode] = useState<InteractionMode>('none');
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [imageFit, setImageFit] = useState<'contain' | 'cover'>('contain');
  const [imageZoom, setImageZoom] = useState(1);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Background Removal State
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const [bgError, setBgError] = useState<string | null>(null);

  const startState = useRef({
    x: 0,
    y: 0,
    clientX: 0,
    clientY: 0,
    scale: 1,
    rotation: 0,
  });

  // Pinch-to-zoom state
  const pinchState = useRef<{
    initialDistance: number;
    initialScale: number;
  } | null>(null);

  // When the stage is visually zoomed (CSS scale), pointer deltas are in screen pixels.
  // We keep transforms in *un-zoomed* container coordinates and convert deltas accordingly.
  const toUnzoomedDelta = (delta: number) => delta / (imageZoom || 1);

  const toScreenPoint = (x: number, y: number, rect: DOMRect) => {
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    return {
      x: cx + (x - rect.width / 2) * (imageZoom || 1),
      y: cy + (y - rect.height / 2) * (imageZoom || 1),
    };
  };

  useEffect(() => {
    if (transform.opacity > 0.8) {
      onTransformChange({ ...transform, opacity: 0.8 });
    }
  }, [transform.opacity]);

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({ width: rect.width, height: rect.height });

        if (transform.x === 0 && transform.y === 0) {
          const tattooAspectRatio = tattooImage.width / tattooImage.height;
          const containerAspectRatio = rect.width / rect.height;

          let targetScale;
          if (tattooAspectRatio > containerAspectRatio) {
            targetScale = (rect.width * 0.25) / tattooImage.width;
          } else {
            targetScale = (rect.height * 0.30) / tattooImage.height;
          }

          targetScale = Math.max(0.1, Math.min(1.0, targetScale));

          onTransformChange({
            ...transform,
            x: rect.width / 2,
            y: rect.height / 2,
            scale: targetScale,
          });
        }
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => {
    if (containerRef.current && tattooImage.url) {
      const rect = containerRef.current.getBoundingClientRect();
      const tattooAspectRatio = tattooImage.width / tattooImage.height;
      const containerAspectRatio = rect.width / rect.height;

      let targetScale;
      if (tattooAspectRatio > containerAspectRatio) {
        targetScale = (rect.width * 0.25) / tattooImage.width;
      } else {
        targetScale = (rect.height * 0.30) / tattooImage.height;
      }

      targetScale = Math.max(0.1, Math.min(1.0, targetScale));

      onTransformChange({
        ...transform,
        x: rect.width / 2,
        y: rect.height / 2,
        scale: targetScale,
        rotation: 0,
      });
    }
  }, [tattooImage.url]);

  const handleImageMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return;

    setInteractionMode('dragging');
    startState.current = {
      x: transform.x,
      y: transform.y,
      clientX: e.clientX,
      clientY: e.clientY,
      scale: transform.scale,
      rotation: transform.rotation,
    };
  };

  const handleCornerMouseDown = (
    e: React.MouseEvent,
    corner: 'tl' | 'tr' | 'bl' | 'br'
  ) => {
    e.stopPropagation();
    setInteractionMode(`scaling-${corner}`);
    startState.current = {
      x: transform.x,
      y: transform.y,
      clientX: e.clientX,
      clientY: e.clientY,
      scale: transform.scale,
      rotation: transform.rotation,
    };
  };

  const handleRotateMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setInteractionMode('rotating');
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return;

    startState.current = {
      x: transform.x,
      y: transform.y,
      clientX: e.clientX,
      clientY: e.clientY,
      scale: transform.scale,
      rotation: transform.rotation,
    };
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (interactionMode === 'none') return;
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return;

    if (interactionMode === 'dragging') {
      const dx = toUnzoomedDelta(e.clientX - startState.current.clientX);
      const dy = toUnzoomedDelta(e.clientY - startState.current.clientY);
      onTransformChange({
        ...transform,
        x: startState.current.x + dx,
        y: startState.current.y + dy,
      });
    } else if (interactionMode.startsWith('scaling-')) {
      const dx = toUnzoomedDelta(e.clientX - startState.current.clientX);
      const dy = toUnzoomedDelta(e.clientY - startState.current.clientY);
      const distance = Math.sqrt(dx * dx + dy * dy);
      const direction = (interactionMode === 'scaling-br' || interactionMode === 'scaling-tr') && dx > 0 ? 1 : -1;
      const scaleDelta = (distance * direction) / 200;
      const newScale = Math.max(0.01, Math.min(5, startState.current.scale + scaleDelta));
      onTransformChange({ ...transform, scale: newScale });
    } else if (interactionMode === 'rotating') {
      const center = toScreenPoint(transform.x, transform.y, containerRect);
      const angle = Math.atan2(e.clientY - center.y, e.clientX - center.x) * (180 / Math.PI);
      onTransformChange({ ...transform, rotation: angle + 90 });
    }
  };

  const handleMouseUp = () => {
    setInteractionMode('none');
  };

  const handleTouchStart = (e: React.TouchEvent, type: 'drag' | 'corner' | 'rotate', corner?: 'tl' | 'tr' | 'bl' | 'br') => {
    e.stopPropagation();
    const touch = e.touches[0];
    if (type === 'drag') setInteractionMode('dragging');
    else if (type === 'corner' && corner) setInteractionMode(`scaling-${corner}`);
    else if (type === 'rotate') setInteractionMode('rotating');

    startState.current = {
      x: transform.x,
      y: transform.y,
      clientX: touch.clientX,
      clientY: touch.clientY,
      scale: transform.scale,
      rotation: transform.rotation,
    };
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (interactionMode === 'none' && !pinchState.current) return;
    e.preventDefault();
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return;

    if (e.touches.length === 2 && interactionMode === 'dragging') {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const dx = touch2.clientX - touch1.clientX;
      const dy = touch2.clientY - touch1.clientY;
      const currentDistance = Math.sqrt(dx * dx + dy * dy);

      if (!pinchState.current) {
        pinchState.current = { initialDistance: currentDistance, initialScale: transform.scale };
      } else {
        const scaleFactor = currentDistance / pinchState.current.initialDistance;
        const newScale = Math.max(0.1, Math.min(5, pinchState.current.initialScale * scaleFactor));
        onTransformChange({ ...transform, scale: newScale });
      }
      return;
    }

    if (e.touches.length !== 2) pinchState.current = null;
    const touch = e.touches[0];
    if (interactionMode === 'dragging') {
      const dx = toUnzoomedDelta(touch.clientX - startState.current.clientX);
      const dy = toUnzoomedDelta(touch.clientY - startState.current.clientY);
      onTransformChange({ ...transform, x: startState.current.x + dx, y: startState.current.y + dy });
    } else if (interactionMode.startsWith('scaling-')) {
      const dx = toUnzoomedDelta(touch.clientX - startState.current.clientX);
      const dy = toUnzoomedDelta(touch.clientY - startState.current.clientY);
      const distance = Math.sqrt(dx * dx + dy * dy);
      const direction = (interactionMode === 'scaling-br' || interactionMode === 'scaling-tr') && dx > 0 ? 1 : -1;
      const scaleDelta = (distance * direction) / 200;
      const newScale = Math.max(0.01, Math.min(5, startState.current.scale + scaleDelta));
      onTransformChange({ ...transform, scale: newScale });
    } else if (interactionMode === 'rotating') {
      const center = toScreenPoint(transform.x, transform.y, containerRect);
      const angle = Math.atan2(touch.clientY - center.y, touch.clientX - center.x) * (180 / Math.PI);
      onTransformChange({ ...transform, rotation: angle + 90 });
    }
  };

  const handleTouchEnd = () => {
    setInteractionMode('none');
    pinchState.current = null;
  };

  useEffect(() => {
    if (interactionMode !== 'none') {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleTouchEnd);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [interactionMode, transform]);

  const { profile } = useAuth();
  const [showPaywall, setShowPaywall] = useState(false);

  const handleExport = async () => {
    const exportUrl = await renderCompositeImage(bodyImage, tattooImage, transform, containerSize, profile?.plan === 'free');
    onNext(exportUrl);
  };

  const handleRemoveBackground = async () => {
    setBgError(null);
    setIsRemovingBg(true);
    try {
      const processedImage = await removeBackground(tattooImage.url);
      onTattooImageChange(processedImage);
    } catch (err: any) {
      console.error(err);
      setBgError(err.message || "Background removal failed");
    } finally {
      setIsRemovingBg(false);
    }
  };

  const width = tattooImage.width * transform.scale;
  const height = tattooImage.height * transform.scale;
  const padding = 30;

  const adjustScale = (delta: number) => {
    const newScale = Math.max(0.1, Math.min(5, transform.scale + delta));
    onTransformChange({ ...transform, scale: newScale });
  };

  const adjustRotation = (delta: number) => {
    onTransformChange({ ...transform, rotation: transform.rotation + delta });
  };

  const moveTattoo = (dx: number, dy: number) => {
    onTransformChange({ ...transform, x: transform.x + dx, y: transform.y + dy });
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-neutral-950 animate-fade-in" style={{ height: '100vh' }}>
      {showPaywall && <PlanPricingModal onClose={() => setShowPaywall(false)} />}

      {/* Header */}
      <div className="bg-neutral-900/60 backdrop-blur-md border-b border-neutral-800/50 px-6 py-5 flex-shrink-0">
        <div className="flex items-center justify-between gap-4">
          <button onClick={onBack} className="flex items-center gap-2 px-4 py-2 text-neutral-300 hover:bg-neutral-800/50 rounded-xl transition-premium btn-premium">
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline font-light">{t('editor_back')}</span>
          </button>
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-xl tracking-tight font-light text-neutral-50">{t('editor_title')}</h1>
              <div className="text-xs text-neutral-400 font-light tracking-wide mt-1">{t('editor_subtitle')}</div>
            </div>
          </div>
          <button id="tour-export" onClick={handleExport} className="flex items-center gap-2 px-5 py-2 bg-[#0091FF] text-white rounded-xl hover:bg-[#007AFF] hover:shadow-lg hover:shadow-[#0091FF]/50 transition-premium btn-premium">
            <span className="hidden sm:inline font-medium">{t('editor_continue')}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className={`flex-1 relative overflow-hidden bg-black ${isMobile ? 'min-h-[300px]' : 'min-h-[400px]'}`}>
        <div id="tour-canvas" ref={containerRef} className="w-full h-full relative touch-none overflow-hidden">
          <div className="absolute inset-0" style={{ transform: `scale(${imageZoom})`, transformOrigin: 'center' }}>
            <img src={bodyImage.url} alt="Body" draggable={false} className="absolute inset-0 w-full h-full select-none" style={{ objectFit: imageFit, objectPosition: 'center', pointerEvents: 'none', zIndex: 1, display: 'block' }} />
            <div className="absolute select-none" style={{ left: `${transform.x}px`, top: `${transform.y}px`, transform: `translate(-50%, -50%) rotate(${transform.rotation}deg)`, width: `${width + padding * 2}px`, height: `${height + padding * 2}px`, zIndex: 10 }}>
              <div className="absolute inset-0 border-2 border-dashed border-blue-400/70 cursor-move touch-none rounded-lg hover:border-blue-300 transition-colors" onMouseDown={handleImageMouseDown} onTouchStart={(e) => handleTouchStart(e, 'drag')}>
                <img src={tattooImage.url} alt="Tattoo" draggable={false} className="absolute" style={{ left: `${padding}px`, top: `${padding}px`, width: `${width}px`, height: `${height}px`, pointerEvents: 'none', opacity: transform.opacity, zIndex: 2, display: 'block' }} />
                {isRemovingBg && <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-30 rounded-lg"><Loader2 className="w-8 h-8 text-white animate-spin" /></div>}
                <div className="absolute w-6 h-6 bg-[#0091FF] border-2 border-white rounded-full cursor-nwse-resize touch-none shadow-xl hover:bg-blue-400" style={{ left: '-12px', top: '-12px', padding: '15px' }} onMouseDown={(e) => handleCornerMouseDown(e, 'tl')} onTouchStart={(e) => handleTouchStart(e, 'corner', 'tl')} />
                <div className="absolute w-6 h-6 bg-[#0091FF] border-2 border-white rounded-full cursor-nesw-resize touch-none shadow-xl hover:bg-blue-400" style={{ right: '-12px', top: '-12px', padding: '15px' }} onMouseDown={(e) => handleCornerMouseDown(e, 'tr')} onTouchStart={(e) => handleTouchStart(e, 'corner', 'tr')} />
                <div className="absolute w-6 h-6 bg-[#0091FF] border-2 border-white rounded-full cursor-nesw-resize touch-none shadow-xl hover:bg-blue-400" style={{ left: '-12px', bottom: '-12px', padding: '15px' }} onMouseDown={(e) => handleCornerMouseDown(e, 'bl')} onTouchStart={(e) => handleTouchStart(e, 'corner', 'bl')} />
                <div className="absolute w-6 h-6 bg-[#0091FF] border-2 border-white rounded-full cursor-nwse-resize touch-none shadow-xl hover:bg-blue-400" style={{ right: '-12px', bottom: '-12px', padding: '15px' }} onMouseDown={(e) => handleCornerMouseDown(e, 'br')} onTouchStart={(e) => handleTouchStart(e, 'corner', 'br')} />
                <div className="absolute w-10 h-10 bg-[#0091FF] border-2 border-white rounded-full cursor-grab flex items-center justify-center touch-none shadow-xl hover:bg-blue-400" style={{ left: '50%', top: '-50px', transform: 'translateX(-50%)', padding: '10px' }} onMouseDown={handleRotateMouseDown} onTouchStart={(e) => handleTouchStart(e, 'rotate')}><RotateCw className="w-5 h-5 text-white" /></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls Panel */}
      <div className={`bg-neutral-900/60 backdrop-blur-md border-t border-neutral-800/50 transition-premium overflow-y-auto ${isMobile ? 'max-h-[50vh]' : ''}`}>
        <div className={`${isMobile ? 'p-4' : 'p-6'} max-w-5xl mx-auto space-y-6`}>
          <div className="flex items-center gap-6">
            <div id="tour-opacity" className="flex-1 min-w-[120px]">
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] font-medium text-neutral-400 uppercase tracking-widest">{t('editor_opacity')}</label>
                <span className="text-xs text-neutral-300">{Math.round(transform.opacity * 100)}%</span>
              </div>
              <input type="range" min="0" max="80" value={Math.round(transform.opacity * 100)} onChange={(e) => onTransformChange({ ...transform, opacity: parseInt(e.target.value) / 100 })} className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-[#0091FF]" />
            </div>

            <div className="flex gap-1.5">
              <button id="tour-remove-bg" onClick={handleRemoveBackground} disabled={isRemovingBg} className={`flex items-center gap-2 ${isMobile ? 'px-3 py-2.5' : 'px-4 py-3'} bg-neutral-800/50 border border-neutral-700 hover:bg-neutral-800 rounded-xl transition-premium text-neutral-300 group`}>
                {isRemovingBg ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eraser className="w-3.5 h-3.5" />}
                <span className="text-[10px] font-bold uppercase tracking-wide">{t('editor_remove_bg')}</span>
              </button>
              <div id="tour-zoom" className="flex gap-1.5 ml-2">
                <button onClick={() => adjustScale(-0.1)} className="p-3 bg-neutral-800/50 border border-neutral-700 hover:bg-neutral-800 rounded-xl transition-premium"><ZoomOut className="w-4 h-4 text-neutral-300" /></button>
                <button onClick={() => adjustScale(0.1)} className="p-3 bg-neutral-800/50 border border-neutral-700 hover:bg-neutral-800 rounded-xl transition-premium"><ZoomIn className="w-4 h-4 text-neutral-300" /></button>
                <button onClick={() => adjustRotation(15)} className="p-3 bg-neutral-800/50 border border-neutral-700 hover:bg-neutral-800 rounded-xl transition-premium"><RotateCw className="w-4 h-4 text-neutral-300" /></button>
              </div>
            </div>
          </div>

          {bgError && <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs"><AlertCircle className="w-4 h-4" />{bgError}</div>}

          <div className="pt-4 border-t border-neutral-800/30">
            <div className={`flex ${isMobile ? 'flex-col gap-4' : 'items-center justify-between gap-6'}`}>
              <div className="flex-1">
                <label className="text-[10px] font-medium text-neutral-400 uppercase block mb-2 tracking-widest">{t('editor_photo_display')}</label>
                <div className="flex gap-3">
                  <button onClick={() => setImageFit('contain')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border ${imageFit === 'contain' ? 'bg-neutral-800 border-neutral-700 text-neutral-50' : 'bg-neutral-800/30 border-neutral-700/50 text-neutral-400'}`}><Minimize2 className="w-3.5 h-3.5" /><span className="text-sm">{t('editor_fit')}</span></button>
                  <button onClick={() => setImageFit('cover')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border ${imageFit === 'cover' ? 'bg-neutral-800 border-neutral-700 text-neutral-50' : 'bg-neutral-800/30 border-neutral-700/50 text-neutral-400'}`}><Maximize2 className="w-3.5 h-3.5" /><span className="text-sm">{t('editor_fill')}</span></button>
                </div>
              </div>
              <div className={`${isMobile ? 'w-full' : 'w-52'}`}>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[10px] font-medium text-neutral-400 uppercase tracking-widest">{t('editor_zoom')}</label>
                  <span className="text-xs text-neutral-300">{Math.round(imageZoom * 100)}%</span>
                </div>
                <input type="range" min="50" max="200" value={Math.round(imageZoom * 100)} onChange={(e) => setImageZoom(parseInt(e.target.value) / 100)} className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-[#0091FF]" />
              </div>
            </div>
          </div>

          <p className="text-xs text-neutral-500 text-center pt-4 border-t border-neutral-800/20">{t('editor_hint')}</p>
        </div>
      </div>
      <OnboardingTour />
    </div>
  );
}