import React, { useCallback, useRef, useState } from "react";
import { createPortal } from "react-dom";
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  type Crop,
  type PixelCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Camera, RotateCcw, ZoomIn, ZoomOut, Check, X, Loader2 } from "lucide-react";

interface PhotoUploadModalProps {
  imageSrc: string;
  fileName: string;
  onConfirm: (croppedFile: File) => void;
  onCancel: () => void;
  uploading?: boolean;
}

function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number): Crop {
  return centerCrop(
    makeAspectCrop({ unit: "%", width: 80 }, aspect, mediaWidth, mediaHeight),
    mediaWidth,
    mediaHeight,
  );
}

/**
 * Renders the crop selection onto a fixed 400x400 canvas.
 * Scale and rotation are applied before sampling so the output
 * always matches exactly what the user sees in the circle.
 */
async function getCroppedFile(
  image: HTMLImageElement,
  pixelCrop: PixelCrop,
  scale: number,
  rotation: number,
  fileName: string,
): Promise<File> {
  const offscreen = document.createElement("canvas");
  const ctx = offscreen.getContext("2d")!;

  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  const OUTPUT = 400;

  offscreen.width = OUTPUT;
  offscreen.height = OUTPUT;

  ctx.save();
  ctx.translate(OUTPUT / 2, OUTPUT / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.scale(scale, scale);
  ctx.translate(-OUTPUT / 2, -OUTPUT / 2);

  ctx.drawImage(
    image,
    pixelCrop.x * scaleX,
    pixelCrop.y * scaleY,
    pixelCrop.width * scaleX,
    pixelCrop.height * scaleY,
    0,
    0,
    OUTPUT,
    OUTPUT,
  );
  ctx.restore();

  return new Promise((resolve, reject) => {
    offscreen.toBlob(
      (blob) => {
        if (!blob) return reject(new Error("Canvas toBlob failed"));
        const ext = fileName.split(".").pop() ?? "jpg";
        resolve(new File([blob], `cropped_${Date.now()}.${ext}`, { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.92,
    );
  });
}

export const PhotoUploadModal: React.FC<PhotoUploadModalProps> = ({
  imageSrc,
  fileName,
  onConfirm,
  onCancel,
  uploading = false,
}) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, 1));
  }, []);

  const handleConfirm = async () => {
    if (!imgRef.current || !completedCrop) return;
    const file = await getCroppedFile(imgRef.current, completedCrop, scale, rotation, fileName);
    onConfirm(file);
  };

  const handleZoomIn = () => setScale((s) => Math.min(+(s + 0.1).toFixed(1), 3));
  const handleZoomOut = () => setScale((s) => Math.max(+(s - 0.1).toFixed(1), 0.5));
  const handleRotate = () => setRotation((r) => (r + 90) % 360);

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop — click to cancel */}
      <div
        className="absolute inset-0 bg-black/65 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal card */}
      <div
        className="relative z-10 bg-card border border-theme rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{ width: "min(500px, 96vw)", maxHeight: "92vh" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-theme flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Camera className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-main leading-tight">
                Adjust Profile Photo
              </p>
              <p className="text-[11px] text-muted leading-tight mt-0.5">
                Drag to reposition · use slider to zoom
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={uploading}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-muted hover:text-main hover:bg-app transition-colors disabled:opacity-40"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Crop area — dark bg so the circular mask edge is obvious */}
        <div className="flex-1 overflow-hidden">
          <div
            className="flex items-center justify-center overflow-hidden"
            style={{ background: "#111", minHeight: 260, maxHeight: 380 }}
          >
            <ReactCrop
              crop={crop}
              onChange={(c) => setCrop(c)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={1}
              circularCrop
              keepSelection
              style={{ maxHeight: 380, maxWidth: "100%" }}
            >
              <img
                ref={imgRef}
                src={imageSrc}
                alt="Crop preview"
                onLoad={onImageLoad}
                style={{
                  transform: `scale(${scale}) rotate(${rotation}deg)`,
                  transformOrigin: "center",
                  maxHeight: 380,
                  maxWidth: "100%",
                  display: "block",
                }}
              />
            </ReactCrop>
          </div>
        </div>

        {/* Controls footer */}
        <div className="px-5 pt-3 pb-4 border-t border-theme bg-app flex-shrink-0 space-y-3">
          {/* Zoom row */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={scale <= 0.5}
              title="Zoom out"
              className="w-7 h-7 rounded-md border border-theme flex items-center justify-center text-muted hover:text-main hover:bg-card transition-colors disabled:opacity-30 flex-shrink-0"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>

            <input
              type="range"
              min={50}
              max={300}
              step={5}
              value={Math.round(scale * 100)}
              onChange={(e) => setScale(Number(e.target.value) / 100)}
              className="flex-1 accent-primary cursor-pointer"
            />

            <button
              type="button"
              onClick={handleZoomIn}
              disabled={scale >= 3}
              title="Zoom in"
              className="w-7 h-7 rounded-md border border-theme flex items-center justify-center text-muted hover:text-main hover:bg-card transition-colors disabled:opacity-30 flex-shrink-0"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>

            <div className="w-px h-4 bg-theme mx-0.5 flex-shrink-0" />

            <button
              type="button"
              onClick={handleRotate}
              title="Rotate 90°"
              className="w-7 h-7 rounded-md border border-theme flex items-center justify-center text-muted hover:text-main hover:bg-card transition-colors flex-shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Zoom / rotation readout */}
          <p className="text-[10px] text-muted text-center tabular-nums">
            {Math.round(scale * 100)}% zoom
            {rotation > 0 && ` · ${rotation}° rotation`}
          </p>

          {/* Action buttons */}
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={onCancel}
              disabled={uploading}
              className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg border border-theme text-sm text-muted font-medium hover:bg-card transition-colors disabled:opacity-50"
            >
              <X className="w-3.5 h-3.5" />
              Cancel
            </button>

            <button
              type="button"
              onClick={handleConfirm}
              disabled={!completedCrop || uploading}
              className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg bg-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Uploading…
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Save Photo
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};