// DT: editor de imágenes para admins (Oct-26 Req 5). Lápiz con paleta fija,
// goma (borra solo lo dibujado) y deshacer. Dos canvas superpuestos a la
// resolución de salida: la foto abajo y el dibujo arriba; se unen al exportar.
import React, { PointerEvent, useCallback, useEffect, useRef, useState } from 'react';
import { Box, Button, Icon, IconButton, Icons, Spinner, Text, color, config } from 'folds';

const COLORS = [
  '#E53935',
  '#FB8C00',
  '#FDD835',
  '#43A047',
  '#26C6DA',
  '#1E88E5',
  '#8E24AA',
  '#FFFFFF',
];
// Lado más largo de la imagen exportada: evita trabar celulares de gama baja
// y respeta los límites de canvas de iPhone.
const MAX_SIDE = 2000;
const JPEG_QUALITY = 0.9;

type Point = { x: number; y: number };
type Stroke = { color: string; erase: boolean; width: number; points: Point[] };

function drawStroke(ctx: CanvasRenderingContext2D, stroke: Stroke) {
  const [first, ...rest] = stroke.points;
  if (!first) return;
  ctx.save();
  ctx.globalCompositeOperation = stroke.erase ? 'destination-out' : 'source-over';
  ctx.strokeStyle = stroke.color;
  ctx.fillStyle = stroke.color;
  ctx.lineWidth = stroke.width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (rest.length === 0) {
    // Un toque sin arrastrar deja un punto
    ctx.beginPath();
    ctx.arc(first.x, first.y, stroke.width / 2, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.moveTo(first.x, first.y);
    rest.forEach((p) => ctx.lineTo(p.x, p.y));
    ctx.stroke();
  }
  ctx.restore();
}

function EraserIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="m7 21-4.3-4.3a1 1 0 0 1 0-1.4l10-10a1 1 0 0 1 1.4 0l5.6 5.6a1 1 0 0 1 0 1.4L11 21" />
      <path d="M22 21H7" />
      <path d="m5 11 9 9" />
    </svg>
  );
}

const editedName = (name: string, ext: string) => {
  const base = name.replace(/\.[^.]+$/, '') || 'imagen';
  return `${base}-editada.${ext}`;
};

type DtImageEditorProps = {
  /** URL de la imagen (blob/object URL, mismo origen: el canvas no queda bloqueado por CORS) */
  src: string;
  name: string;
  onDone: (file: File) => void;
  onClose: () => void;
};

export function DtImageEditor({ src, name, onDone, onClose }: DtImageEditorProps) {
  const baseRef = useRef<HTMLCanvasElement>(null);
  const drawRef = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState<{ width: number; height: number }>();
  const [mimeType, setMimeType] = useState('image/jpeg');
  const [loadError, setLoadError] = useState(false);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [activeColor, setActiveColor] = useState(COLORS[0]);
  const [erasing, setErasing] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [exporting, setExporting] = useState(false);
  const current = useRef<Stroke | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const areaRef = useRef<HTMLDivElement>(null);
  const [area, setArea] = useState<{ width: number; height: number }>();

  // Tamaño disponible para la imagen: se recalcula al girar el celular o
  // cambiar el tamaño de la ventana. Los trazos están en píxeles de la imagen,
  // así que no se desplazan.
  useEffect(() => {
    const el = areaRef.current;
    if (!el) return undefined;
    const observer = new ResizeObserver(([entry]) => {
      setArea({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const fit =
    size && area ? Math.min(area.width / size.width, area.height / size.height) : undefined;

  // Carga la imagen y la dibuja una sola vez en el canvas de abajo
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const blob = await (await fetch(src)).blob();
        const url = URL.createObjectURL(blob);
        const img = new Image();
        img.src = url;
        await img.decode();
        if (cancelled) return;
        const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
        const width = Math.round(img.naturalWidth * scale);
        const height = Math.round(img.naturalHeight * scale);
        URL.revokeObjectURL(url);
        imageRef.current = img;
        setMimeType(blob.type);
        setSize({ width, height });
      } catch {
        if (!cancelled) setLoadError(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [src]);

  // La foto se dibuja una vez, cuando el canvas ya está montado (depende de
  // haber medido el área disponible)
  const canvasReady = size !== undefined && fit !== undefined;
  useEffect(() => {
    const img = imageRef.current;
    const ctx = baseRef.current?.getContext('2d');
    if (!canvasReady || !img || !ctx || !size) return;
    ctx.drawImage(img, 0, 0, size.width, size.height);
  }, [canvasReady, size]);

  const redraw = useCallback((list: Stroke[]) => {
    const canvas = drawRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    list.forEach((s) => drawStroke(ctx, s));
  }, []);

  const strokeWidth = size ? Math.max(4, Math.round(Math.max(size.width, size.height) / 200)) : 8;

  const toCanvasPoint = (evt: PointerEvent<HTMLCanvasElement>): Point => {
    const canvas = evt.currentTarget;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((evt.clientX - rect.left) / rect.width) * canvas.width,
      y: ((evt.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const handlePointerDown = (evt: PointerEvent<HTMLCanvasElement>) => {
    evt.currentTarget.setPointerCapture(evt.pointerId);
    current.current = {
      color: activeColor,
      erase: erasing,
      width: erasing ? strokeWidth * 3 : strokeWidth,
      points: [toCanvasPoint(evt)],
    };
    const ctx = drawRef.current?.getContext('2d');
    if (ctx) drawStroke(ctx, current.current);
  };

  const handlePointerMove = (evt: PointerEvent<HTMLCanvasElement>) => {
    const stroke = current.current;
    if (!stroke) return;
    stroke.points.push(toCanvasPoint(evt));
    // Se redibuja el trazo en curso sobre los ya terminados
    redraw(strokes);
    const ctx = drawRef.current?.getContext('2d');
    if (ctx) drawStroke(ctx, stroke);
  };

  const handlePointerUp = () => {
    const stroke = current.current;
    if (!stroke) return;
    current.current = null;
    setStrokes((prev) => [...prev, stroke]);
  };

  const handleUndo = () => {
    const next = strokes.slice(0, -1);
    setStrokes(next);
    redraw(next);
  };

  const requestClose = () => {
    if (strokes.length > 0) setConfirmDiscard(true);
    else onClose();
  };

  const handleDone = () => {
    if (!size || !baseRef.current || !drawRef.current) return;
    setExporting(true);
    const out = document.createElement('canvas');
    out.width = size.width;
    out.height = size.height;
    const ctx = out.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(baseRef.current, 0, 0);
    ctx.drawImage(drawRef.current, 0, 0);
    // Capturas (PNG) siguen en PNG; fotos en JPEG para no pesar de más
    const asPng = mimeType === 'image/png';
    const type = asPng ? 'image/png' : 'image/jpeg';
    out.toBlob(
      (blob) => {
        setExporting(false);
        if (!blob) return;
        onDone(new File([blob], editedName(name, asPng ? 'png' : 'jpg'), { type }));
      },
      type,
      asPng ? undefined : JPEG_QUALITY
    );
  };

  return (
    <Box
      direction="Column"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: '#111',
        color: '#fff',
        // iPhone con la app instalada: respetar muesca y barra de inicio
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
        // Safari iOS: sin lupa ni menú de "guardar imagen" al mantener presionado
        userSelect: 'none',
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none',
      }}
    >
      <Box alignItems="Center" gap="200" style={{ padding: config.space.S200 }}>
        <IconButton
          size="300"
          radii="300"
          variant="Background"
          onClick={requestClose}
          aria-label="Cerrar"
        >
          <Icon src={Icons.Cross} />
        </IconButton>
        <Text size="T300" style={{ flexGrow: 1, color: '#fff' }}>
          Editar imagen
        </Text>
        <IconButton
          size="300"
          radii="300"
          variant="Background"
          onClick={handleUndo}
          disabled={strokes.length === 0}
          aria-label="Deshacer"
        >
          <Icon src={Icons.ArrowGoLeft} />
        </IconButton>
        <Button
          size="300"
          radii="300"
          onClick={handleDone}
          disabled={!size || exporting}
          before={
            exporting ? (
              <Spinner size="100" fill="Solid" variant="Primary" />
            ) : (
              <Icon size="100" src={Icons.Check} />
            )
          }
        >
          <Text size="B300">Listo</Text>
        </Button>
      </Box>

      <Box
        ref={areaRef}
        grow="Yes"
        justifyContent="Center"
        alignItems="Center"
        style={{ minHeight: 0, margin: config.space.S200, overflow: 'hidden' }}
      >
        {loadError && <Text style={{ color: '#fff' }}>No se pudo cargar la imagen.</Text>}
        {!size && !loadError && <Spinner size="400" />}
        {size && fit !== undefined && (
          <div
            style={{
              position: 'relative',
              flexShrink: 0,
              width: Math.floor(size.width * fit),
              height: Math.floor(size.height * fit),
            }}
          >
            <canvas
              ref={baseRef}
              width={size.width}
              height={size.height}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
            />
            <canvas
              ref={drawRef}
              width={size.width}
              height={size.height}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                // Sin scroll, zoom ni "deslizar para recargar" mientras se dibuja
                touchAction: 'none',
                cursor: 'crosshair',
              }}
            />
          </div>
        )}
      </Box>

      <Box
        alignItems="Center"
        justifyContent="Center"
        gap="200"
        wrap="Wrap"
        style={{ padding: config.space.S300 }}
      >
        {COLORS.map((c) => {
          const selected = !erasing && activeColor === c;
          return (
            <button
              key={c}
              type="button"
              aria-label={`Color ${c}`}
              aria-pressed={selected}
              onClick={() => {
                setActiveColor(c);
                setErasing(false);
              }}
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: c,
                border: selected ? '3px solid #fff' : '2px solid rgba(255,255,255,0.35)',
                boxShadow: selected ? `0 0 0 2px ${color.Primary.Main}` : undefined,
                cursor: 'pointer',
              }}
            />
          );
        })}
        <button
          type="button"
          aria-label="Goma"
          aria-pressed={erasing}
          onClick={() => setErasing(true)}
          style={{
            width: 40,
            height: 40,
            marginLeft: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 8,
            color: '#fff',
            background: erasing ? color.Primary.Main : 'rgba(255,255,255,0.12)',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <EraserIcon />
        </button>
      </Box>

      {confirmDiscard && (
        <Box
          direction="Column"
          gap="300"
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            background: color.Surface.Container,
            color: color.Surface.OnContainer,
            padding: config.space.S400,
            borderRadius: config.radii.R400,
            width: 'min(320px, 90vw)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          }}
        >
          <Text size="H5">¿Descartar los cambios?</Text>
          <Text size="T300">Se pierde lo que dibujaste en esta imagen.</Text>
          <Box gap="200" justifyContent="End">
            <Button
              size="300"
              variant="Secondary"
              fill="Soft"
              onClick={() => setConfirmDiscard(false)}
            >
              <Text size="B300">Seguir editando</Text>
            </Button>
            <Button size="300" variant="Critical" onClick={onClose}>
              <Text size="B300">Descartar</Text>
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
}
