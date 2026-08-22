import { useEffect, useRef, useState } from 'react';
import Modal from '../common/Modal.jsx';
import Button from '../common/Button.jsx';

const FRAME_RATIO = 5 / 1;
const OUTPUT_WIDTH = 1000;
const OUTPUT_HEIGHT = OUTPUT_WIDTH / FRAME_RATIO;

export default function BannerCropModal({ file, onConfirm, onCancel }) {
  const [imageUrl, setImageUrl] = useState(null);
  const [naturalSize, setNaturalSize] = useState(null);
  const [scale, setScale] = useState(1);
  const [minScale, setMinScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const frameRef = useRef(null);
  const imgRef = useRef(null);
  const dragState = useRef(null);

  useEffect(() => {
    if (!file) return undefined;
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function handleImageLoad() {
    const frame = frameRef.current;
    const img = imgRef.current;
    if (!frame || !img) return;
    const frameRect = frame.getBoundingClientRect();
    const natural = { width: img.naturalWidth, height: img.naturalHeight };
    const computedMinScale = Math.max(frameRect.width / natural.width, frameRect.height / natural.height);
    setNaturalSize(natural);
    setMinScale(computedMinScale);
    setScale(computedMinScale);
    setOffset({
      x: (frameRect.width - natural.width * computedMinScale) / 2,
      y: (frameRect.height - natural.height * computedMinScale) / 2,
    });
  }

  function clampOffset(nextOffset, currentScale) {
    if (!naturalSize || !frameRef.current) return nextOffset;
    const frameRect = frameRef.current.getBoundingClientRect();
    const displayedWidth = naturalSize.width * currentScale;
    const displayedHeight = naturalSize.height * currentScale;
    const minX = Math.min(0, frameRect.width - displayedWidth);
    const minY = Math.min(0, frameRect.height - displayedHeight);
    return {
      x: Math.min(0, Math.max(minX, nextOffset.x)),
      y: Math.min(0, Math.max(minY, nextOffset.y)),
    };
  }

  function handlePointerDown(event) {
    if (!naturalSize) return;
    dragState.current = {
      startX: event.clientX,
      startY: event.clientY,
      startOffset: offset,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event) {
    if (!dragState.current) return;
    const dx = event.clientX - dragState.current.startX;
    const dy = event.clientY - dragState.current.startY;
    const next = {
      x: dragState.current.startOffset.x + dx,
      y: dragState.current.startOffset.y + dy,
    };
    setOffset(clampOffset(next, scale));
  }

  function handlePointerUp() {
    dragState.current = null;
  }

  function handleZoomChange(event) {
    const nextScale = Number(event.target.value);
    setScale(nextScale);
    setOffset((prev) => clampOffset(prev, nextScale));
  }

  function handleConfirm() {
    if (!naturalSize || !imgRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = OUTPUT_WIDTH;
    canvas.height = OUTPUT_HEIGHT;
    const ctx = canvas.getContext('2d');

    const frameRect = frameRef.current.getBoundingClientRect();
    const sourceX = -offset.x / scale;
    const sourceY = -offset.y / scale;
    const sourceWidth = frameRect.width / scale;
    const sourceHeight = frameRect.height / scale;

    ctx.drawImage(imgRef.current, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, OUTPUT_WIDTH, OUTPUT_HEIGHT);
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
          <Button type="button" variant="primary" onClick={handleConfirm} disabled={!naturalSize}>
            Valider
          </Button>
        </>
      }
    >
      <p className="mb-3 text-xs text-slate-400">Deplace l'image et ajuste le zoom pour cadrer ta banniere.</p>

      <div
        ref={frameRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className="relative w-full touch-none overflow-hidden rounded-lg border border-surface-border bg-surface"
        style={{ aspectRatio: FRAME_RATIO, cursor: naturalSize ? 'grab' : 'default' }}
      >
        {imageUrl && (
          // eslint-disable-next-line jsx-a11y/alt-text
          <img
            ref={imgRef}
            src={imageUrl}
            onLoad={handleImageLoad}
            draggable={false}
            className="absolute select-none"
            style={
              naturalSize
                ? {
                    width: naturalSize.width * scale,
                    height: naturalSize.height * scale,
                    left: offset.x,
                    top: offset.y,
                  }
                : { opacity: 0 }
            }
          />
        )}
      </div>

      {naturalSize && (
        <input
          type="range"
          min={minScale}
          max={minScale * 3}
          step={minScale / 100}
          value={scale}
          onChange={handleZoomChange}
          className="mt-3 w-full accent-yang-300"
          aria-label="Zoom"
        />
      )}
    </Modal>
  );
}
