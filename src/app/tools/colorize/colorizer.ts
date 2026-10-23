import { DestroyRef, inject, Injectable } from '@angular/core';
import type {
  ColorizeCommand,
  ColorizeRequest,
  ColorizeResponse,
  LoadedImage,
  RecolorJob,
} from './colorize-messages';

type Response<T extends ColorizeCommand['type']> = Extract<ColorizeResponse, { type: T }>;

interface Pending {
  resolve(response: ColorizeResponse): void;
  reject(error: Error): void;
}

interface QueuedPreview {
  readonly job: RecolorJob;
  resolve(bitmap: ImageBitmap): void;
  reject(error: unknown): void;
}

/**
 * Main-thread side of the colorize worker, which is started on the first image. Previews are
 * coalesced: while one is being recolored only the latest request waits, so dragging a slider
 * never piles up work.
 */
@Injectable()
export class Colorizer {
  private worker: Worker | undefined;
  private nextId = 0;
  private readonly pending = new Map<number, Pending>();

  private previewRunning = false;
  private queuedPreview: QueuedPreview | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.worker?.terminate();
      const error = abortError();
      this.pending.forEach(({ reject }) => reject(error));
      this.queuedPreview?.reject(error);
    });
  }

  /** Decodes the image in the worker; later previews and exports use it. */
  async load(image: Blob): Promise<LoadedImage> {
    return (await this.call({ type: 'load', image })).image;
  }

  /** Recolored, downscaled preview of the loaded image. */
  preview(job: RecolorJob, signal?: AbortSignal): Promise<ImageBitmap> {
    return new Promise((resolve, reject) => {
      this.queuedPreview?.reject(abortError());
      const queued: QueuedPreview = { job, resolve, reject };
      this.queuedPreview = queued;
      signal?.addEventListener('abort', () => {
        if (this.queuedPreview !== queued) return;
        this.queuedPreview = undefined;
        reject(abortError());
      });
      void this.runPreviews();
    });
  }

  /** Recolored loaded image at full resolution, as PNG. */
  async export(job: RecolorJob): Promise<Blob> {
    return (await this.call({ type: 'export', ...job })).png;
  }

  private async runPreviews(): Promise<void> {
    if (this.previewRunning) return;
    this.previewRunning = true;
    while (this.queuedPreview) {
      const { job, resolve, reject } = this.queuedPreview;
      this.queuedPreview = undefined;
      try {
        resolve((await this.call({ type: 'preview', ...job })).bitmap);
      } catch (error) {
        reject(error);
      }
    }
    this.previewRunning = false;
  }

  private call<C extends ColorizeCommand>(command: C): Promise<Response<C['type']>> {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, {
        resolve: (response) => resolve(response as Response<C['type']>),
        reject,
      });
      this.ensureWorker().postMessage({ ...command, id } satisfies ColorizeRequest);
    });
  }

  private ensureWorker(): Worker {
    if (!this.worker) {
      this.worker = new Worker(new URL('./colorize.worker', import.meta.url), { type: 'module' });
      this.worker.addEventListener('message', ({ data }: MessageEvent<ColorizeResponse>) => {
        const pending = this.pending.get(data.id);
        this.pending.delete(data.id);
        if (data.type === 'error') pending?.reject(new Error(data.message));
        else pending?.resolve(data);
      });
    }
    return this.worker;
  }
}

function abortError(): DOMException {
  return new DOMException('Superseded', 'AbortError');
}
