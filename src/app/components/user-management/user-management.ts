import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RoleManagementComponent } from '../role-management/role-management';
import { UserManagementListComponent } from '../user-management-list/user-management-list';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [
    CommonModule,
    RoleManagementComponent,
    UserManagementListComponent // Add this to imports
  ],
  templateUrl: './user-management.html',
  styleUrl: './user-management.css'
})
export class UserManagementComponent {
  activeTab: 'roles' | 'users' = 'roles';

  setActiveTab(tab: 'roles' | 'users') {
    this.activeTab = tab;
  }
}