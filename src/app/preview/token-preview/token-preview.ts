import { Component, computed, input } from '@angular/core';
import { contrast, toHex } from '../../palette/color';
import {
  FILL_TOKENS,
  MIN_TEXT_CONTRAST,
  type FillToken,
  type SemanticTokens,
  type TokenName,
} from '../../palette/semantic-tokens';

/** Semantic UI tokens: a small mock UI plus every fill / `on_` pair with its contrast ratio. */
@Component({
  selector: 'app-token-preview',
  template: `
    <div class="mock">
      <div class="card">
        <p class="title">Notifications</p>
        <p>Body text on surface.</p>
        <p class="muted">Secondary text on surface variant.</p>
        <div class="row">
          <span class="pill accent">Accept</span>
          <span class="pill accent_container">Later</span>
          <span class="pill danger">Delete</span>
        </div>
        <div class="row">
          <span class="pill danger_container">Battery low</span>
          <span class="pill warning_container">Update pending</span>
          <span class="pill success_container">Synced</span>
          <span class="pill info_container">3 new</span>
        </div>
      </div>
    </div>

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

    .mock {
      padding: 1.5rem;
      border-radius: var(--p-content-border-radius);
      background: var(--t-background);
      color: var(--t-on_background);
    }

    .card {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      max-width: 28rem;
      padding: 1rem;
      border: 1px solid var(--t-outline_variant);
      border-radius: 0.75rem;
      background: var(--t-surface);
      color: var(--t-on_surface);
    }

    .title {
      font-weight: 600;
    }

    .muted {
      padding: 0.25rem 0.5rem;
      border-radius: 0.375rem;
      background: var(--t-surface_variant);
      color: var(--t-on_surface_variant);
    }

    .row {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .pill {
      padding: 0.25rem 0.75rem;
      border-radius: 999px;
      font-size: 0.875rem;
    }

    @each $name in accent, accent_container, danger, danger_container, warning_container,
      success_container, info_container
    {
      .#{$name} {
        background: var(--t-#{$name});
        color: var(--t-on_#{$name});
      }
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
  host: {
    '[style]': 'cssVars()',
  },
})
export class TokenPreview {
  readonly tokens = input.required<SemanticTokens>();

  /** Every token as a `--t-<name>` custom property for the mock UI. */
  protected readonly cssVars = computed(() =>
    Object.fromEntries(
      (Object.entries(this.tokens()) as [TokenName, SemanticTokens[TokenName]][]).map(
        ([name, color]) => [`--t-${name}`, toHex(color)],
      ),
    ),
  );

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
