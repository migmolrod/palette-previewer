import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AdminLayout } from './admin-layout';

describe('AdminLayout', () => {
  let fixture: ComponentFixture<AdminLayout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminLayout],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminLayout);
    fixture.componentRef.setInput('menu', [{ label: 'Accent', routerLink: '/tools/accent' }]);
    await fixture.whenStable();
  });

  it('should render the menu items in the sidebar', () => {
    const sidebar = (fixture.nativeElement as HTMLElement).querySelector('.sidebar');
    expect(sidebar?.textContent).toContain('Accent');
  });
});
