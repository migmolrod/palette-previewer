import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ColorizeTool } from './colorize-tool';

describe('ColorizeTool', () => {
  let fixture: ComponentFixture<ColorizeTool>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ColorizeTool],
    }).compileComponents();

    fixture = TestBed.createComponent(ColorizeTool);
    await fixture.whenStable();
  });

  it('asks for an image before showing a preview', () => {
    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('.placeholder')?.textContent).toContain('Choose an image');
    expect(element.querySelector('app-image-compare')).toBeNull();
  });

  it('counts the palette colors in use', () => {
    const hint = [...(fixture.nativeElement as HTMLElement).querySelectorAll('.hint')].map(
      (p) => p.textContent,
    );
    expect(hint.some((text) => /\d+ colors/.test(text ?? ''))).toBe(true);
  });
});
