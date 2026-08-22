import { useEffect, useRef, useState } from 'react';
import Modal from '../common/Modal.jsx';
import Button from '../common/Button.jsx';

const FRAME_RATIO = 5 / 1;
const OUTPUT_WIDTH = 1000;
const OUTPUT_HEIGHT = OUTPUT_WIDTH / FRAME_RATIO;

export default function BannerCropModal({ file, onConfirm, onCancel }) {
  const [imageUrl, setImageUrl] = useState(null);
  const [naturalSize, setNaturalSize] = useState(null);
  const [displaySize, setDisplaySize] = useState(null);
  const [frame, setFrame] = useState(null);
  const [maxFrameWidth, setMaxFrameWidth] = useState(0);
  const [minFrameWidth, setMinFrameWidth] = useState(0);

  const imgRef = useRef(null);
  const dragState = useRef(null);

  useEffect(() => {
    setNaturalSize(null);
    setDisplaySize(null);
    setFrame(null);
    if (!file) {
      setImageUrl(null);
      return undefined;
    }
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function handleImageLoad() {
    const img = imgRef.current;
    if (!img) return;
    const rect = img.getBoundingClientRect();
    const natural = { width: img.naturalWidth, height: img.naturalHeight };
    const display = { width: rect.width, height: rect.height };

    const maxW = Math.min(display.width, display.height * FRAME_RATIO);
    const minW = maxW * 0.25;

    setNaturalSize(natural);
    setDisplaySize(display);
    setMaxFrameWidth(maxW);
    setMinFrameWidth(minW);
    setFrame({
      width: maxW,
      height: maxW / FRAME_RATIO,
      x: (display.width - maxW) / 2,
      y: (display.height - maxW / FRAME_RATIO) / 2,
    });
  }

  function clampFrame(next, display) {
    const d = display ?? displaySize;
    if (!d) return next;
    return {
      ...next,
      x: Math.min(Math.max(0, next.x), d.width - next.width),
      y: Math.min(Math.max(0, next.y), d.height - next.height),
    };
  }

  function handlePointerDown(event) {
    if (!frame) return;
    dragState.current = { startX: event.clientX, startY: event.clientY, startFrame: frame };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event) {
    if (!dragState.current) return;
    const dx = event.clientX - dragState.current.startX;
    const dy = event.clientY - dragState.current.startY;
    const { startFrame } = dragState.current;
    setFrame(clampFrame({ ...startFrame, x: startFrame.x + dx, y: startFrame.y + dy }));
  }

  function handlePointerUp() {
    dragState.current = null;
  }

  function handleZoomChange(event) {
    const nextWidth = Number(event.target.value);
    setFrame((prev) => {
      const centerX = prev.x + prev.width / 2;
      const centerY = prev.y + prev.height / 2;
      const nextHeight = nextWidth / FRAME_RATIO;
      return clampFrame({
        width: nextWidth,
        height: nextHeight,
        x: centerX - nextWidth / 2,
        y: centerY - nextHeight / 2,
      });
    });
  }

  function handleConfirm() {
    if (!naturalSize || !displaySize || !frame || !imgRef.current) return;
    const scaleFactor = naturalSize.width / displaySize.width;

    const canvas = document.createElement('canvas');
    canvas.width = OUTPUT_WIDTH;
    canvas.height = OUTPUT_HEIGHT;
    const ctx = canvas.getContext('2d');

    ctx.drawImage(
      imgRef.current,
      frame.x * scaleFactor,
      frame.y * scaleFactor,
      frame.width * scaleFactor,
      frame.height * scaleFactor,
      0,
      0,
      OUTPUT_WIDTH,
      OUTPUT_HEIGHT
    );
    canvas.toBlob(
      (blob) => {
        if (blob) onConfirm(blob);
      },
      'image/jpeg',
      0.9
    );
  }

  return (
    <Modal
      title="Positionne ta banniere"
      isOpen={Boolean(file)}
      onClose={onCancel}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={onCancel}>
            Annuler
          </Button>
          <Button type="button" variant="primary" onClick={handleConfirm} disabled={!frame}>
            Valider
          </Button>
        </>
      }
    >
      <p className="mb-3 text-xs text-slate-400">Deplace et redimensionne le cadre pour choisir la zone visible.</p>

      <div className="text-center">
        <div className="relative inline-block max-w-full select-none">
          {imageUrl && (
            // eslint-disable-next-line jsx-a11y/alt-text
            <img
              ref={imgRef}
              src={imageUrl}
              onLoad={handleImageLoad}
              draggable={false}
              className="block max-h-[60vh] max-w-full"
            />
          )}

          {frame && (
            <div
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              className="absolute touch-none rounded-sm border-2 border-yang-50 shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]"
              style={{
                left: frame.x,
                top: frame.y,
                width: frame.width,
                height: frame.height,
                cursor: 'grab',
              }}
            />
          )}
        </div>
      </div>

      {frame && (
        <input
          type="range"
          min={minFrameWidth}
          max={maxFrameWidth}
          step={(maxFrameWidth - minFrameWidth) / 100 || 1}
          value={frame.width}
          onChange={handleZoomChange}
          className="mt-3 w-full accent-yang-300"
          aria-label="Taille du cadre"
        />
      )}
    </Modal>
  );
}
