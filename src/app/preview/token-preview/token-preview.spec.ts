import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FILL_TOKENS } from '../../palette/semantic-tokens';
import { DEFAULT_ACCENT_PARAMS, generateFromAccent } from '../../tools/accent/generate-from-accent';
import { TokenPreview } from './token-preview';

describe('TokenPreview', () => {
  let fixture: ComponentFixture<TokenPreview>;
  let element: HTMLElement;

  beforeEach(async () => {
    fixture = TestBed.createComponent(TokenPreview);
    fixture.componentRef.setInput('tokens', generateFromAccent(DEFAULT_ACCENT_PARAMS).tokens);
    element = fixture.nativeElement;
    await fixture.whenStable();
  });

  it('should render one tile per fill token with its contrast ratio', () => {
    const tiles = element.querySelectorAll('.tile');
    expect(tiles.length).toBe(FILL_TOKENS.length);
    expect(tiles[0].textContent).toMatch(/background[\s\S]*\d+\.\d:1/);
  });

  it('should expose tokens as custom properties', () => {
    expect(element.style.getPropertyValue('--t-on_danger')).toMatch(/^#[0-9a-f]{6}$/);
  });
});
