import { useRef, useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, RotateCw, Eraser, Loader2, AlertCircle, Sliders, Palette, Move } from 'lucide-react';
import { ImageData, TattooTransform } from '../types';
import { renderCompositeImage } from '../utils/canvasUtils';
import { useAuth } from '../contexts/AuthContext';
import { removeBackground } from '../utils/backgroundRemoval';
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

type InteractionMode = 'none' | 'dragging' | 'scaling' | 'rotating';

export default function Editor({
  bodyImage,
  tattooImage,
  transform,
  onTransformChange,
  onTattooImageChange,
  onBack,
  onNext,
}: EditorProps) {
  const { t } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);
  const [interactionMode, setInteractionMode] = useState<InteractionMode>('none');
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [activeTab, setActiveTab] = useState<'transform' | 'style'>('transform');
  const [isEraserMode, setIsEraserMode] = useState(false);
  const [eraserSize, setEraserSize] = useState(30);
  const [isDrawing, setIsDrawing] = useState(false);
  const eraserCanvasRef = useRef<HTMLCanvasElement>(null);

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

  const pinchState = useRef<{
    initialDistance: number;
    initialScale: number;
  } | null>(null);

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
            targetScale = (rect.width * 0.4) / tattooImage.width;
          } else {
            targetScale = (rect.height * 0.4) / tattooImage.height;
          }

          onTransformChange({
            ...transform,
            x: rect.width / 2,
            y: rect.height / 2,
            scale: Math.max(0.1, Math.min(1.0, targetScale)),
            opacity: 1.0,
          });
        }
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setInteractionMode('dragging');
      startState.current = {
        x: transform.x,
        y: transform.y,
        clientX: touch.clientX,
        clientY: touch.clientY,
        scale: transform.scale,
        rotation: transform.rotation,
      };
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (interactionMode === 'none' && e.touches.length !== 2) return;

    if (e.touches.length === 2) {
      e.preventDefault();
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const currentDistance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) + Math.pow(touch2.clientY - touch1.clientY, 2)
      );

      if (!pinchState.current) {
        pinchState.current = { initialDistance: currentDistance, initialScale: transform.scale };
      } else {
        const factor = currentDistance / pinchState.current.initialDistance;
        onTransformChange({ ...transform, scale: Math.max(0.05, Math.min(3, pinchState.current.initialScale * factor)) });
      }
    } else if (e.touches.length === 1 && interactionMode === 'dragging') {
      const touch = e.touches[0];
      const dx = touch.clientX - startState.current.clientX;
      const dy = touch.clientY - startState.current.clientY;
      onTransformChange({ ...transform, x: startState.current.x + dx, y: startState.current.y + dy });
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (interactionMode === 'dragging') {
      const dx = e.clientX - startState.current.clientX;
      const dy = e.clientY - startState.current.clientY;
      onTransformChange({ ...transform, x: startState.current.x + dx, y: startState.current.y + dy });
    }
  };

  const handleMouseUp = () => {
    setInteractionMode('none');
  };

  const handleTouchEnd = () => {
    setInteractionMode('none');
    pinchState.current = null;
  };

  useEffect(() => {
    if (isEraserMode) return;
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [interactionMode, transform, isEraserMode]);

  // Eraser Canvas Initialization
  useEffect(() => {
    if (isEraserMode && eraserCanvasRef.current) {
      const canvas = eraserCanvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Just clear the canvas - it will be our stroke layer
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, [isEraserMode]);

  const getCanvasCoords = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    if (!eraserCanvasRef.current) return null;
    const canvas = eraserCanvasRef.current;
    const rect = canvas.getBoundingClientRect();

    let clientX, clientY;
    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    } else {
      return null;
    }

    // Scale coordinates to internal canvas resolution
    const x = ((clientX - rect.left) / rect.width) * canvas.width;
    const y = ((clientY - rect.top) / rect.height) * canvas.height;
    return { x, y };
  };

  const handleEraserStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isEraserMode) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDrawing(true);
    const coords = getCanvasCoords(e);
    if (coords && eraserCanvasRef.current) {
      const ctx = eraserCanvasRef.current.getContext('2d');
      if (ctx) {
        ctx.beginPath();
        ctx.moveTo(coords.x, coords.y);
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#FF3B30'; // Premium iOS Red
        ctx.lineWidth = eraserSize * (eraserCanvasRef.current.width / eraserCanvasRef.current.clientWidth);
        ctx.globalCompositeOperation = 'source-over';
      }
    }
  };

  const handleEraserMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !isEraserMode) return;
    e.preventDefault();
    e.stopPropagation();
    const coords = getCanvasCoords(e);
    if (coords && eraserCanvasRef.current) {
      const ctx = eraserCanvasRef.current.getContext('2d');
      if (ctx) {
        ctx.lineTo(coords.x, coords.y);
        ctx.stroke();
      }
    }
  };

  const handleEraserEnd = () => {
    setIsDrawing(false);
  };

  const applyEraser = async () => {
    if (!eraserCanvasRef.current) return;

    const canvas = eraserCanvasRef.current;
    const finalMaskCanvas = document.createElement('canvas');
    finalMaskCanvas.width = tattooImage.width;
    finalMaskCanvas.height = tattooImage.height;
    const fCtx = finalMaskCanvas.getContext('2d')!;

    // 1. Fill background with white (Keep) or existing mask
    if (transform.mask) {
      const existingMask = new Image();
      await new Promise((resolve) => {
        existingMask.onload = resolve;
        existingMask.src = transform.mask!;
      });
      fCtx.drawImage(existingMask, 0, 0);
    } else {
      fCtx.fillStyle = 'white';
      fCtx.fillRect(0, 0, finalMaskCanvas.width, finalMaskCanvas.height);
    }

    // 2. Subtract the red strokes from the mask
    fCtx.globalCompositeOperation = 'destination-out';
    fCtx.drawImage(canvas, 0, 0);

    const maskUrl = finalMaskCanvas.toDataURL('image/png');
    onTransformChange({ ...transform, mask: maskUrl });
    setIsEraserMode(false);
  };

  const resetEraser = () => {
    onTransformChange({ ...transform, mask: undefined });
    if (eraserCanvasRef.current) {
      const ctx = eraserCanvasRef.current.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, eraserCanvasRef.current.width, eraserCanvasRef.current.height);
    }
  };

  const { profile } = useAuth();
  const handleExport = async () => {
    // Force a basic fit for export
    const exportSize = { width: containerSize.width, height: containerSize.height };
    const exportUrl = await renderCompositeImage(bodyImage, tattooImage, transform, exportSize, profile?.plan === 'free');
    onNext(exportUrl);
  };

  const handleRemoveBackground = async () => {
    setBgError(null);
    setIsRemovingBg(true);
    try {
      const processedImage = await removeBackground(tattooImage.url);
      onTattooImageChange(processedImage);
    } catch (err: any) {
      setBgError(err.message || t('editor_remove_bg_error') || "Background removal failed");
    } finally {
      setIsRemovingBg(false);
    }
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-black text-white overflow-hidden" style={{ height: '100dvh' }}>
      {/* Header - Compact */}
      <div className="flex items-center justify-between px-4 h-16 bg-neutral-900/80 backdrop-blur-md border-b border-white/5 z-50 shrink-0">
        <button onClick={onBack} className="p-2 text-neutral-400">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-sm font-bold uppercase tracking-widest">{t('editor_title')}</h1>
        <button onClick={handleExport} className="bg-[#0091FF] text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-2">
          {t('editor_continue')}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Main Control Area */}
      <div className="flex-1 relative flex flex-col min-h-0 bg-neutral-950">
        {/* Stage / Canvas Container */}
        <div ref={containerRef} className="flex-1 relative overflow-hidden bg-black touch-none">
          {/* Base Image */}
          <img
            src={bodyImage.url}
            alt="Body"
            className="absolute inset-0 w-full h-full pointer-events-none select-none overflow-hidden"
            style={{ objectFit: 'contain', backgroundColor: 'black' }}
          />

          {/* Tattoo Overlay */}
          <div
            onTouchStart={isEraserMode ? undefined : handleTouchStart}
            onMouseDown={isEraserMode ? undefined : (e) => {
              setInteractionMode('dragging');
              startState.current = {
                x: transform.x,
                y: transform.y,
                clientX: e.clientX,
                clientY: e.clientY,
                scale: transform.scale,
                rotation: transform.rotation,
              };
            }}
            className={`absolute select-none ${isEraserMode ? '' : 'cursor-move'}`}
            style={{
              left: `${transform.x}px`,
              top: `${transform.y}px`,
              width: `${tattooImage.width * transform.scale}px`,
              height: `${tattooImage.height * transform.scale}px`,
              transform: `translate(-50%, -50%) rotate(${transform.rotation}deg)`,
              zIndex: 10
            }}
          >
            <div className={`relative w-full h-full ${interactionMode === 'dragging' ? 'ring-2 ring-blue-500/50' : ''}`}>
              <img
                src={tattooImage.url}
                alt="Tattoo"
                className="w-full h-full object-contain pointer-events-none select-none"
                style={{
                  opacity: transform.opacity,
                  maskImage: transform.mask ? `url(${transform.mask})` : 'none',
                  WebkitMaskImage: transform.mask ? `url(${transform.mask})` : 'none',
                  maskSize: '100% 100%',
                  WebkitMaskSize: '100% 100%'
                }}
              />

              {isEraserMode && (
                <canvas
                  ref={eraserCanvasRef}
                  width={tattooImage.width}
                  height={tattooImage.height}
                  onMouseDown={handleEraserStart}
                  onMouseMove={handleEraserMove}
                  onMouseUp={handleEraserEnd}
                  onMouseLeave={handleEraserEnd}
                  onTouchStart={handleEraserStart}
                  onTouchMove={handleEraserMove}
                  onTouchEnd={handleEraserEnd}
                  className="absolute inset-0 w-full h-full z-[100] touch-none"
                  style={{
                    cursor: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${eraserSize}' height='${eraserSize}' viewBox='0 0 ${eraserSize} ${eraserSize}'%3E%3Ccircle cx='${eraserSize / 2}' cy='${eraserSize / 2}' r='${eraserSize / 2 - 1}' fill='none' stroke='white' stroke-width='1'/%3E%3Ccircle cx='${eraserSize / 2}' cy='${eraserSize / 2}' r='${eraserSize / 2 - 2}' fill='none' stroke='black' stroke-width='1' opacity='0.3'/%3E%3C/svg%3E") ${eraserSize / 2} ${eraserSize / 2}, crosshair`,
                    backgroundColor: 'transparent',
                  }}
                />
              )}

              {isRemovingBg && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-lg">
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                </div>
              )}
            </div>
          </div>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full border border-white/10 text-[9px] uppercase font-bold tracking-widest text-neutral-400 pointer-events-none">
            <Move className="w-3 h-3" />
            {t('editor_hint_mobile')}
          </div>
        </div>

        {/* Bottom Control Panel */}
        <div className="bg-[#09090b] border-t border-white/5 shrink-0 h-[320px] pb-[env(safe-area-inset-bottom)]">
          {/* Tabs */}
          <div className="flex border-b border-white/5">
            <button
              onClick={() => setActiveTab('transform')}
              className={`flex-1 flex items-center justify-center gap-2 py-4 text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'transform' ? 'text-white border-b-2 border-[#0091FF] bg-white/5' : 'text-neutral-500'}`}
            >
              <Sliders className="w-4 h-4" />
              {t('editor_tab_settings')}
            </button>
            <button
              onClick={() => setActiveTab('style')}
              className={`flex-1 flex items-center justify-center gap-2 py-4 text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'style' ? 'text-white border-b-2 border-[#0091FF] bg-white/5' : 'text-neutral-500'}`}
            >
              <Palette className="w-4 h-4" />
              {t('editor_tab_style')}
            </button>
          </div>

          <div className="p-6 flex-1 overflow-y-auto space-y-6">
            {activeTab === 'transform' && (
              <div className="space-y-6 animate-fade-in">
                {/* Scale Slider */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">{t('editor_size')}</label>
                    <span className="text-[10px] font-mono text-blue-400">{Math.round(transform.scale * 100)}%</span>
                  </div>
                  <input
                    type="range" min="5" max="300" value={Math.round(transform.scale * 100)}
                    onChange={(e) => onTransformChange({ ...transform, scale: parseInt(e.target.value) / 100 })}
                    className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-[#0091FF]"
                  />
                </div>

                {/* Rotation Slider */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">{t('editor_turn')}</label>
                    <span className="text-[10px] font-mono text-blue-400">{Math.round(transform.rotation)}°</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <input
                      type="range" min="-180" max="180" value={Math.round(transform.rotation)}
                      onChange={(e) => onTransformChange({ ...transform, rotation: parseInt(e.target.value) })}
                      className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-[#0091FF]"
                    />
                    <button
                      onClick={() => onTransformChange({ ...transform, rotation: 0 })}
                      className="p-2 bg-neutral-800 rounded-lg text-neutral-400"
                    >
                      <RotateCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'style' && (
              <div className="space-y-6 animate-fade-in">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleRemoveBackground}
                    disabled={isRemovingBg}
                    className="flex flex-col items-center justify-center gap-2 py-4 bg-neutral-800 hover:bg-neutral-700 rounded-xl transition-all border border-white/5 disabled:opacity-40"
                  >
                    {isRemovingBg ? <Loader2 className="w-5 h-5 animate-spin" /> : <Eraser className="w-5 h-5 text-blue-400" />}
                    <span className="text-[10px] font-bold uppercase tracking-widest">{t('editor_remove_bg')}</span>
                  </button>
                  <button
                    onClick={() => setIsEraserMode(true)}
                    className="flex flex-col items-center justify-center gap-2 py-4 bg-neutral-800 hover:bg-neutral-700 rounded-xl transition-all border border-white/5"
                  >
                    <Move className="w-5 h-5 text-purple-400" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">{t('editor_manual_eraser')}</span>
                  </button>
                </div>
              </div>
            )}

            {bgError && (
              <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-[10px] uppercase font-bold tracking-widest animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {bgError}
              </div>
            )}
          </div>
        </div>

        {/* Floating Eraser Controls */}
        {isEraserMode && (
          <div className="absolute inset-x-0 bottom-0 bg-neutral-900/90 backdrop-blur-xl border-t border-white/10 p-6 space-y-4 z-[200] animate-slide-up">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold uppercase tracking-widest text-[#0091FF]">{t('editor_manual_eraser')}</label>
              <div className="flex gap-2">
                <button onClick={resetEraser} className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-neutral-400 bg-white/5 rounded-lg hover:bg-white/10 transition-all">
                  {t('editor_eraser_reset')}
                </button>
                <button onClick={applyEraser} className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white bg-[#0091FF] rounded-lg shadow-lg shadow-[#0091FF]/20 hover:bg-[#007AFF] transition-all">
                  {t('editor_eraser_done')}
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-widest">{t('editor_eraser_size')}</span>
                <span className="text-[10px] font-mono text-blue-400">{eraserSize}px</span>
              </div>
              <input
                type="range" min="5" max="100" value={eraserSize}
                onChange={(e) => setEraserSize(parseInt(e.target.value))}
                className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-[#0091FF]"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
