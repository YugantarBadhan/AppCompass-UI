import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Explores } from './explores';

describe('Explores', () => {
  let component: Explores;
  let fixture: ComponentFixture<Explores>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Explores]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Explores);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
