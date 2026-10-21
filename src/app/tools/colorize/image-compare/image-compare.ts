import { Component, effect, ElementRef, input, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SliderModule } from 'primeng/slider';

/**
 * Before/after view: the recolored image is drawn over the original and revealed right of a
 * split that a slider moves.
 */
@Component({
  imports: [FormsModule, SliderModule],
  selector: 'app-image-compare',
  template: `
    <div class="frame" [style.aspect-ratio]="width() + ' / ' + height()">
      <img [src]="before()" alt="Original image" />
      <canvas
        #canvas
        role="img"
        aria-label="Recolored image"
        [style.clip-path]="'inset(0 0 0 ' + split() + '%)'"
      ></canvas>
      <div class="divider" aria-hidden="true" [style.left.%]="split()"></div>
    </div>
    <p-slider [(ngModel)]="split" [min]="0" [max]="100" ariaLabel="Before and after split" />
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .frame {
      position: relative;
      width: 100%;
      max-height: 70vh;
      overflow: hidden;
      border: 1px solid var(--p-content-border-color);
      border-radius: var(--p-content-border-radius);
    }

    img,
    canvas {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: contain;
    }

    .divider {
      position: absolute;
      top: 0;
      bottom: 0;
      width: 2px;
      margin-left: -1px;
      background: var(--p-primary-color);
    }

    p-slider {
      margin: 0 0.5rem;
    }
  `,
})
export class ImageCompare {
  /** URL of the original image. */
  readonly before = input.required<string>();
  /** Recolored image, possibly downscaled; stretched over the original. */
  readonly after = input.required<ImageBitmap>();
  readonly width = input.required<number>();
  readonly height = input.required<number>();

  /** Percentage from the left where the recolored image starts. */
  protected readonly split = signal(50);

  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');

  constructor() {
    effect(() => {
      const bitmap = this.after();
      const canvas = this.canvas().nativeElement;
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      canvas.getContext('2d')?.drawImage(bitmap, 0, 0);
    });
  }
}
