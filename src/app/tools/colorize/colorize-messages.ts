import type { LabColor, RecolorSettings } from './recolor';

/** What to recolor with: the same for previews and full-resolution exports. */
export interface RecolorJob {
  readonly palette: readonly LabColor[];
  readonly settings: RecolorSettings;
}

/**
 * Main thread → colorize worker. The image is sent once (`load`) and kept by the worker, so
 * previews only carry the palette and settings.
 */
export type ColorizeCommand =
  | { readonly type: 'load'; readonly image: Blob }
  | ({ readonly type: 'preview' } & RecolorJob)
  | ({ readonly type: 'export' } & RecolorJob);

export type ColorizeRequest = ColorizeCommand & { readonly id: number };

export interface LoadedImage {
  readonly width: number;
  readonly height: number;
}

/** Colorize worker → main thread, answering the request with the same `id`. */
export type ColorizeResponse = { readonly id: number } & (
  | { readonly type: 'load'; readonly image: LoadedImage }
  | { readonly type: 'preview'; readonly bitmap: ImageBitmap }
  | { readonly type: 'export'; readonly png: Blob }
  | { readonly type: 'error'; readonly message: string }
);
