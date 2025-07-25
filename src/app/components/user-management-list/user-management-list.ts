import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router } from '@angular/router';
import {
  UserService,
  User,
  CreateUserRequest,
  UpdateUserRequest,
} from '../../services/user.service';
import { RoleService, Role } from '../../services/role.service';
import { AuthService } from '../../services/auth.service';
import { AlertComponent } from '../alert/alert.component';
import { LoadingComponent } from '../../components/dashboard/loading/loading.component';

@Component({
  selector: 'app-user-management-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    AlertComponent,
    LoadingComponent,
  ],
  templateUrl: './user-management-list.html',
  styleUrl: './user-management-list.css',
})
export class UserManagementListComponent implements OnInit {
  users: User[] = [];
  paginatedUsers: User[] = [];
  roles: Role[] = [];
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  showCreateModal = false;
  showEditModal = false;
  createUserForm!: FormGroup;
  editUserForm!: FormGroup;
  selectedUser: User | null = null;

  // Modal-specific error messages
  createModalErrorMessage = '';
  editModalErrorMessage = '';

  // Pagination properties
  currentPage: number = 1;
  itemsPerPage: number = 10;
  jumpToPage: number = 1;
  Math = Math;

  constructor(
    private userService: UserService,
    private roleService: RoleService,
    private authService: AuthService,
    private fb: FormBuilder,
    private router: Router
  ) {}

  ngOnInit() {
    if (!this.authService.isAuthenticated()) {
      console.error('❌ User not authenticated');
      this.errorMessage = 'Please log in to access user management.';
      return;
    }

    this.initializeForms();
    this.loadUsers();
    this.loadRoles();
    this.debugAuth();
  }

  debugAuth() {
    // Authentication check without console logs for security
  }

  initializeForms() {
    this.createUserForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(2)]],
      password: [
        '',
        [Validators.required, Validators.minLength(8), this.passwordValidator],
      ],
      role: ['', [Validators.required]],
    });

    // For edit form, password should be optional
    this.editUserForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(2)]],
      password: ['', [this.optionalPasswordValidator]], // Optional password validator for edit
      role: ['', [Validators.required]],
    });
  }

  // Custom password validator for create form - Required and must meet criteria
  passwordValidator(control: any) {
    const value = control.value;
    if (!value || value.trim() === '') {
      return { required: true };
    }

    const hasUpperCase = /[A-Z]/.test(value);
    const hasNumber = /\d/.test(value);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);

    if (!hasUpperCase || !hasNumber || !hasSpecialChar) {
      return { invalidPassword: true };
    }
    return null;
  }

  // Optional password validator for edit form - Only validate if password is provided
  optionalPasswordValidator(control: any) {
    const value = control.value;
    if (!value || value.trim() === '') {
      return null; // Don't validate empty passwords for edit form
    }

    const hasUpperCase = /[A-Z]/.test(value);
    const hasNumber = /\d/.test(value);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);

    if (!hasUpperCase || !hasNumber || !hasSpecialChar) {
      return { invalidPassword: true };
    }
    return null;
  }

  loadUsers() {
    if (!this.authService.isAuthenticated()) {
      this.errorMessage = 'Authentication required. Please log in again.';
      return;
    }

    this.isLoading = true;
    this.clearMessages();

    this.userService.getAllUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.updatePagination();
        this.isLoading = false;

        if (users.length === 0) {
          this.errorMessage =
            'No users found. Create your first user to get started.';
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.handleApiError(error, 'Failed to load users');
      },
    });
  }

  loadRoles() {
    if (!this.authService.isAuthenticated()) {
      return;
    }

    this.roleService.getAllRoles().subscribe({
      next: (roles) => {
        // Filter only active roles for user assignment
        this.roles = roles.filter((role) => role.isActive);
      },
      error: (error) => {
        console.error('Failed to load roles:', error);
      },
    });
  }

  // Pagination methods
  updatePagination(): void {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.paginatedUsers = this.users.slice(start, end);
  }

  get totalPages(): number {
    return Math.ceil(this.users.length / this.itemsPerPage);
  }

  changePage(page: number): void {
    this.currentPage = page;
    this.updatePagination();
  }

  getVisiblePages(): (number | string)[] {
    const totalPages = this.totalPages;
    const current = this.currentPage;
    const pages: (number | string)[] = [];

    if (totalPages <= 7) {
      // Show all pages if 7 or fewer
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (current > 4) {
        pages.push('...');
      }

      // Show pages around current page
      const start = Math.max(2, current - 1);
      const end = Math.min(totalPages - 1, current + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (current < totalPages - 3) {
        pages.push('...');
      }

      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }

    return pages;
  }

  jumpToPageAction(): void {
    if (this.jumpToPage >= 1 && this.jumpToPage <= this.totalPages) {
      this.changePage(this.jumpToPage);
    }
  }

  openCreateModal() {
    if (!this.authService.isAuthenticated()) {
      this.errorMessage = 'Authentication required. Please log in again.';
      return;
    }

    this.showCreateModal = true;
    this.createUserForm.reset();
    this.clearMessages();
    this.clearModalMessages();
  }

  closeCreateModal() {
    this.showCreateModal = false;
    this.createUserForm.reset();
    this.clearModalMessages();
  }

  openEditModal(user: User) {
    if (!this.authService.isAuthenticated()) {
      this.errorMessage = 'Authentication required. Please log in again.';
      return;
    }

    // Check if user is inactive and prevent editing
    if (!user.isActive) {
      this.errorMessage =
        'Cannot edit inactive users. Please reactivate the user first to make changes.';
      return;
    }

    this.selectedUser = user;
    this.showEditModal = true;
    this.editUserForm.patchValue({
      username: user.username,
      role: user.role,
      password: '', // Don't populate password field
    });
    this.clearMessages();
    this.clearModalMessages();
  }

  closeEditModal() {
    this.showEditModal = false;
    this.selectedUser = null;
    this.editUserForm.reset();
    this.clearModalMessages();
  }

  onCreateUser() {
    if (this.createUserForm.valid && this.authService.isAuthenticated()) {
      this.isLoading = true;
      this.clearModalMessages();

      const formValue = this.createUserForm.value;
      const request: CreateUserRequest = {
        username: formValue.username.trim(),
        password: formValue.password,
        role: formValue.role,
      };

      this.userService.createUser(request).subscribe({
        next: (response) => {
          this.successMessage = 'User created successfully!';
          this.closeCreateModal();
          this.loadUsers();
        },
        error: (error) => {
          this.isLoading = false;
          // Show error in modal instead of main page
          this.handleModalError(error, 'Failed to create user', true);
        },
      });
    } else {
      if (!this.authService.isAuthenticated()) {
        this.createModalErrorMessage = 'Authentication required. Please log in again.';
      } else {
        this.markFormFieldsAsTouched(this.createUserForm);
      }
    }
  }

  onUpdateUser() {
    if (
      this.editUserForm.valid &&
      this.selectedUser &&
      this.authService.isAuthenticated()
    ) {
      // Double check if user is still active before updating
      if (!this.selectedUser.isActive) {
        this.editModalErrorMessage = 'Cannot update inactive users. Please reactivate the user first.';
        return;
      }

      this.isLoading = true;
      this.clearModalMessages();

      const formValue = this.editUserForm.value;
      const request: UpdateUserRequest = {
        username: formValue.username.trim(),
        role: formValue.role,
      };

      // Only include password if it's provided and not empty
      if (formValue.password && formValue.password.trim()) {
        request.password = formValue.password;
      }

      this.userService.updateUser(this.selectedUser.id, request).subscribe({
        next: (response) => {
          this.successMessage = 'User updated successfully!';
          this.closeEditModal();
          this.loadUsers();
        },
        error: (error) => {
          this.isLoading = false;
          // Show error in modal instead of main page
          this.handleModalError(error, 'Failed to update user', false);
        },
      });
    } else {
      if (!this.authService.isAuthenticated()) {
        this.editModalErrorMessage = 'Authentication required. Please log in again.';
      } else {
        this.markFormFieldsAsTouched(this.editUserForm);
      }
    }
  }

  onToggleUserStatus(user: User) {
    if (!this.authService.isAuthenticated()) {
      this.errorMessage = 'Authentication required. Please log in again.';
      return;
    }

    this.isLoading = true;
    this.clearMessages();

    const operation = user.isActive
      ? this.userService.deactivateUser(user.id)
      : this.userService.reactivateUser(user.id);

    const actionText = user.isActive ? 'deactivated' : 'reactivated';

    operation.subscribe({
      next: (response) => {
        this.successMessage = `User ${actionText} successfully!`;
        this.loadUsers();
      },
      error: (error) => {
        this.isLoading = false;
        this.handleApiError(
          error,
          `Failed to ${user.isActive ? 'deactivate' : 'reactivate'} user`
        );
      },
    });
  }

  // Modal-specific error handler
  private handleModalError(error: any, defaultMessage: string, isCreateModal: boolean = false) {
    let userFriendlyMessage = '';

    if (error.status === 401) {
      userFriendlyMessage = 'Your session has expired. Please log in again.';
    } else if (error.status === 403) {
      userFriendlyMessage = 'You do not have permission to perform this action.';
    } else if (error.status === 404) {
      userFriendlyMessage = 'The requested user was not found. It may have been deleted by another admin.';
    } else if (error.status === 409) {
      userFriendlyMessage = 'A user with this username already exists. Please choose a different username.';
    } else if (error.status === 422) {
      userFriendlyMessage = 'Invalid data provided. Please check your input and try again.';
    } else if (error.status === 400) {
      userFriendlyMessage = error.error?.message || 'Bad request. Please check your input and try again.';
    } else if (error.status === 500) {
      userFriendlyMessage = 'Internal server error. Please try again later or contact support.';
    } else if (error.status === 0) {
      userFriendlyMessage = 'Unable to connect to the server. Please check your internet connection and try again.';
    } else if (error.status >= 500) {
      userFriendlyMessage = 'Server is currently unavailable. Please try again later.';
    } else if (error.error?.message) {
      userFriendlyMessage = error.error.message;
    } else {
      userFriendlyMessage = `${defaultMessage}. Please try again or contact support if the problem persists.`;
    }

    if (isCreateModal) {
      this.createModalErrorMessage = userFriendlyMessage;
    } else {
      this.editModalErrorMessage = userFriendlyMessage;
    }
  }

  // Enhanced error handling method for main page errors
  private handleApiError(error: any, defaultMessage: string) {
    let userFriendlyMessage = '';

    if (error.status === 401) {
      userFriendlyMessage = 'Your session has expired. Please log in again.';
    } else if (error.status === 403) {
      userFriendlyMessage =
        'You do not have permission to perform this action.';
    } else if (error.status === 404) {
      userFriendlyMessage =
        'The requested user was not found. It may have been deleted by another admin.';
    } else if (error.status === 409) {
      userFriendlyMessage =
        'A user with this username already exists. Please choose a different username.';
    } else if (error.status === 422) {
      userFriendlyMessage =
        'Invalid data provided. Please check your input and try again.';
    } else if (error.status === 400) {
      userFriendlyMessage =
        error.error?.message ||
        'Bad request. Please check your input and try again.';
    } else if (error.status === 500) {
      userFriendlyMessage =
        'Internal server error. Please try again later or contact support.';
    } else if (error.status === 0) {
      userFriendlyMessage =
        'Unable to connect to the server. Please check your internet connection and try again.';
    } else if (error.status >= 500) {
      userFriendlyMessage =
        'Server is currently unavailable. Please try again later.';
    } else if (error.error?.message) {
      userFriendlyMessage = error.error.message;
    } else {
      userFriendlyMessage = `${defaultMessage}. Please try again or contact support if the problem persists.`;
    }

    this.errorMessage = userFriendlyMessage;
  }

  // Method to check if a user can be edited
  canEditUser(user: User): boolean {
    return user.isActive;
  }

  // Method to get appropriate button text and class
  getToggleButtonConfig(user: User): {
    text: string;
    class: string;
    icon: string;
  } {
    if (user.isActive) {
      return {
        text: 'Deactivate',
        class: 'btn-danger',
        icon: 'icon-deactivate',
      };
    } else {
      return {
        text: 'Reactivate',
        class: 'btn-success',
        icon: 'icon-activate',
      };
    }
  }

  // Method to get role display name
  getRoleDisplayName(roleKey: string): string {
    const role = this.roles.find((r) => r.name === roleKey);
    return role ? role.name : roleKey;
  }

  refreshUsers() {
    this.currentPage = 1; // Reset to first page when refreshing
    this.loadUsers();
  }

  private markFormFieldsAsTouched(form: FormGroup) {
    Object.keys(form.controls).forEach((key) => {
      form.get(key)?.markAsTouched();
    });
  }

  private clearMessages() {
    this.errorMessage = '';
    this.successMessage = '';
  }

  private clearModalMessages() {
    this.createModalErrorMessage = '';
    this.editModalErrorMessage = '';
  }

  get isCreateFormValid(): boolean {
    return (
      this.createUserForm.valid &&
      !this.isLoading &&
      this.authService.isAuthenticated()
    );
  }

  get isEditFormValid(): boolean {
    return (
      this.editUserForm.valid &&
      !this.isLoading &&
      this.authService.isAuthenticated()
    );
  }

  trackByUserId(index: number, user: User): number {
    return user.id;
  }
}