import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewAppByAppspocs } from './view-app-by-appspocs';

describe('ViewAppByAppspocs', () => {
  let component: ViewAppByAppspocs;
  let fixture: ComponentFixture<ViewAppByAppspocs>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewAppByAppspocs]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewAppByAppspocs);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
