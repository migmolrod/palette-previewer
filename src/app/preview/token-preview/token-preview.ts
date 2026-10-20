import { Component, computed, input } from '@angular/core';
import { contrast, toHex } from '../../palette/color';
import {
  FILL_TOKENS,
  MIN_TEXT_CONTRAST,
  type FillToken,
  type SemanticTokens,
} from '../../palette/semantic-tokens';

/** Every semantic fill / `on_` pair with its hex values and contrast ratio. */
@Component({
  selector: 'app-token-preview',
  template: `
    <ul class="tiles">
      @for (tile of tiles(); track tile.name) {
        <li class="tile" [style.background-color]="tile.fill" [style.color]="tile.on">
          <span class="name">{{ tile.name }}</span>
          <span class="meta">
            {{ tile.fill }} · on {{ tile.on }}<br />
            {{ tile.ratio }}:1{{ tile.readable ? '' : ' · below AA' }}
          </span>
        </li>
      }
    </ul>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    p {
      margin: 0;
    }

    .tiles {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 0.25rem;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .tile {
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      gap: 0.125rem;
      min-height: 4.5rem;
      padding: 0.375rem 0.5rem;
      border-radius: var(--p-content-border-radius);
      font-size: 0.75rem;
      line-height: 1.3;
    }

    .name {
      font-weight: 600;
    }

    .meta {
      font-family: ui-monospace, monospace;
    }
  `,
})
export class TokenPreview {
  readonly tokens = input.required<SemanticTokens>();

  protected readonly tiles = computed(() =>
    FILL_TOKENS.map((name: FillToken) => {
      const fill = this.tokens()[name];
      const on = this.tokens()[`on_${name}`];
      const ratio = contrast(fill, on);
      return {
        name,
        fill: toHex(fill),
        on: toHex(on),
        ratio: ratio.toFixed(1),
        readable: ratio >= MIN_TEXT_CONTRAST,
      };
    }),
  );
}
