import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SpocsManagement } from './spocs-management';

describe('SpocsManagement', () => {
  let component: SpocsManagement;
  let fixture: ComponentFixture<SpocsManagement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SpocsManagement]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SpocsManagement);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
