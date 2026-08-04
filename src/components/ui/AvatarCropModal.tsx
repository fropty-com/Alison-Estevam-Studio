'use client'

import { useEffect, useRef, useState } from 'react'

const FRAME = 260
const OUTPUT = 480

interface NaturalSize {
  w: number
  h: number
}

/**
 * Square crop + zoom/pan before an avatar upload. Built on canvas instead of
 * a library — drag to pan, slider to zoom, "cover fit" keeps the frame
 * always fully covered by the image. Output is always a square JPEG; how it
 * later renders (round for staff, square for clients/topbar) is a CSS
 * concern downstream, not something baked into the stored file.
 */
export function AvatarCropModal({
  file,
  onCancel,
  onConfirm,
}: {
  file: File
  onCancel: () => void
  onConfirm: (blob: Blob) => void
}) {
  const [imgUrl, setImgUrl] = useState<string | null>(null)
  const [naturalSize, setNaturalSize] = useState<NaturalSize | null>(null)
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [processing, setProcessing] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)
  const dragRef = useRef<{ x: number; y: number; offX: number; offY: number } | null>(null)

  useEffect(() => {
    const url = URL.createObjectURL(file)
    setImgUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const baseScale = naturalSize ? FRAME / Math.min(naturalSize.w, naturalSize.h) : 1
  const displayScale = baseScale * zoom
  const dispW = naturalSize ? naturalSize.w * displayScale : 0
  const dispH = naturalSize ? naturalSize.h * displayScale : 0
  const maxOffsetX = Math.max(0, (dispW - FRAME) / 2)
  const maxOffsetY = Math.max(0, (dispH - FRAME) / 2)

  const clamp = (o: { x: number; y: number }) => ({
    x: Math.min(maxOffsetX, Math.max(-maxOffsetX, o.x)),
    y: Math.min(maxOffsetY, Math.max(-maxOffsetY, o.y)),
  })

  const handleImgLoad = () => {
    const img = imgRef.current
    if (!img) return
    setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight })
    setZoom(1)
    setOffset({ x: 0, y: 0 })
  }

  const handleZoomChange = (next: number) => {
    setZoom(next)
    setOffset(o => clamp(o))
  }

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    dragRef.current = { x: e.clientX, y: e.clientY, offX: offset.x, offY: offset.y }
  }
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return
    const dx = e.clientX - dragRef.current.x
    const dy = e.clientY - dragRef.current.y
    setOffset(clamp({ x: dragRef.current.offX + dx, y: dragRef.current.offY + dy }))
  }
  const onPointerUp = () => { dragRef.current = null }

  const handleConfirm = () => {
    if (!naturalSize || !imgRef.current) return
    setProcessing(true)
    const canvas = document.createElement('canvas')
    canvas.width = OUTPUT
    canvas.height = OUTPUT
    const ctx = canvas.getContext('2d')
    if (!ctx) { setProcessing(false); return }

    const imgLeft = FRAME / 2 - dispW / 2 + offset.x
    const imgTop = FRAME / 2 - dispH / 2 + offset.y
    const srcX = -imgLeft / displayScale
    const srcY = -imgTop / displayScale
    const srcSize = FRAME / displayScale

    ctx.drawImage(imgRef.current, srcX, srcY, srcSize, srcSize, 0, 0, OUTPUT, OUTPUT)
    canvas.toBlob(blob => {
      setProcessing(false)
      if (blob) onConfirm(blob)
    }, 'image/jpeg', 0.92)
  }

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-charcoal-deep/80 backdrop-blur-sm px-6">
      <div className="w-full max-w-[360px] bg-charcoal border border-offwhite/[0.14] p-6">
        <p className="font-body font-light text-[9px] tracking-[0.3em] uppercase text-offwhite/40 mb-4">Ajustar foto</p>

        <div
          className="relative mx-auto overflow-hidden bg-charcoal-mid cursor-move touch-none select-none"
          style={{ width: FRAME, height: FRAME }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        >
          {imgUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              ref={imgRef}
              src={imgUrl}
              alt=""
              draggable={false}
              onLoad={handleImgLoad}
              className="absolute pointer-events-none"
              style={naturalSize ? { width: dispW, height: dispH, left: FRAME / 2 - dispW / 2 + offset.x, top: FRAME / 2 - dispH / 2 + offset.y } : { opacity: 0 }}
            />
          )}
        </div>

        <input
          type="range"
          min={1}
          max={3}
          step={0.01}
          value={zoom}
          onChange={e => handleZoomChange(Number(e.target.value))}
          disabled={!naturalSize}
          className="w-full mt-5 accent-gold disabled:opacity-40"
          aria-label="Zoom"
        />

        <div className="flex gap-2 mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-[10px] font-body font-light text-[9px] tracking-[0.25em] uppercase border border-offwhite/[0.14] text-offwhite/50 hover:border-offwhite/30 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!naturalSize || processing}
            onClick={handleConfirm}
            className="flex-1 px-4 py-[10px] font-body font-medium text-[9px] tracking-[0.25em] uppercase bg-gold text-charcoal-deep hover:bg-gold-light transition-colors disabled:opacity-40"
          >
            {processing ? 'Aplicando…' : 'Usar foto'}
          </button>
        </div>
      </div>
    </div>
  )
}
