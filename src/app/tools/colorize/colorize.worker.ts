/// <reference lib="webworker" />

import type { ColorizeRequest, ColorizeResponse } from './colorize-messages';
import { recolor } from './recolor';

/** Previews are recolored at most at this many pixels; exports always at full resolution. */
const PREVIEW_MAX_PIXELS = 2_000_000;

interface Source {
  readonly full: ImageBitmap;
  readonly preview: ImageData;
}

let source: Source | undefined;

addEventListener('message', async ({ data: request }: MessageEvent<ColorizeRequest>) => {
  try {
    switch (request.type) {
      case 'load': {
        source?.full.close();
        source = undefined;
        const full = await createImageBitmap(request.image);
        source = { full, preview: draw(full, previewScale(full)) };
        reply({ id: request.id, type: 'load', image: { width: full.width, height: full.height } });
        break;
      }
      case 'preview': {
        const { preview } = loaded();
        const pixels = new ImageData(new Uint8ClampedArray(preview.data), preview.width);
        recolor(pixels.data, pixels.width, request.palette, request.settings);
        const bitmap = await createImageBitmap(pixels);
        reply({ id: request.id, type: 'preview', bitmap }, [bitmap]);
        break;
      }
      case 'export': {
        const { full } = loaded();
        const pixels = draw(full, 1);
        recolor(pixels.data, pixels.width, request.palette, request.settings);
        const canvas = new OffscreenCanvas(pixels.width, pixels.height);
        canvas.getContext('2d')!.putImageData(pixels, 0, 0);
        reply({ id: request.id, type: 'export', png: await canvas.convertToBlob() });
        break;
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    reply({ id: request.id, type: 'error', message });
  }
});

function reply(response: ColorizeResponse, transfer: Transferable[] = []): void {
  postMessage(response, transfer);
}

function loaded(): Source {
  if (!source) throw new Error('No image loaded');
  return source;
}

function previewScale({ width, height }: ImageBitmap): number {
  return Math.min(1, Math.sqrt(PREVIEW_MAX_PIXELS / (width * height)));
}

/** The bitmap's pixels, scaled by `scale`. */
function draw(bitmap: ImageBitmap, scale: number): ImageData {
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const context = new OffscreenCanvas(width, height).getContext('2d', {
    willReadFrequently: true,
  })!;
  context.imageSmoothingQuality = 'high';
  context.drawImage(bitmap, 0, 0, width, height);
  return context.getImageData(0, 0, width, height);
}
