import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AccentTool } from './accent-tool';

describe('AccentTool', () => {
  let component: AccentTool;
  let fixture: ComponentFixture<AccentTool>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccentTool],
    }).compileComponents();

    fixture = TestBed.createComponent(AccentTool);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
