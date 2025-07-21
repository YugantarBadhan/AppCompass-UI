import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewAppByTeam } from './view-app-by-team';

describe('ViewAppByTeam', () => {
  let component: ViewAppByTeam;
  let fixture: ComponentFixture<ViewAppByTeam>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewAppByTeam]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewAppByTeam);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
