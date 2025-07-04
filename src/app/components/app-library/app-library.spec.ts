import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppLibrary } from './app-library';

describe('AppLibrary', () => {
  let component: AppLibrary;
  let fixture: ComponentFixture<AppLibrary>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppLibrary]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AppLibrary);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
