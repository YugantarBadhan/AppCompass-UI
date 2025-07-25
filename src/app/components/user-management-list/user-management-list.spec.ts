import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserManagementList } from './user-management-list';

describe('UserManagementList', () => {
  let component: UserManagementList;
  let fixture: ComponentFixture<UserManagementList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserManagementList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserManagementList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
