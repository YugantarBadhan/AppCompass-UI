import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router } from '@angular/router';
import {
  RoleService,
  Role,
  CreateRoleRequest,
  UpdateRoleRequest,
} from '../../services/role.service';
import { AuthService } from '../../services/auth.service';
import { AlertComponent } from '../alert/alert.component';
import { LoadingComponent } from '../../components/dashboard/loading/loading.component';

@Component({
  selector: 'app-role-management',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AlertComponent,
    LoadingComponent,
  ],
  templateUrl: './role-management.html',
  styleUrl: './role-management.css',
})
export class RoleManagementComponent implements OnInit {
  roles: Role[] = [];
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  showCreateModal = false;
  showEditModal = false;
  createRoleForm!: FormGroup;
  editRoleForm!: FormGroup;
  selectedRole: Role | null = null;

  // Modal-specific error messages
  createModalErrorMessage = '';
  editModalErrorMessage = '';

  constructor(
    private roleService: RoleService,
    private authService: AuthService,
    private fb: FormBuilder,
    private router: Router
  ) {}

  ngOnInit() {
    if (!this.authService.isAuthenticated()) {
      console.error('❌ User not authenticated');
      this.errorMessage = 'Please log in to access role management.';
      return;
    }

    this.initializeForms();
    this.loadRoles();
    this.debugAuth();
  }

  debugAuth() {
    // Authentication check without console logs for security
  }

  initializeForms() {
    this.createRoleForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
    });

    this.editRoleForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
    });
  }

  loadRoles() {
    if (!this.authService.isAuthenticated()) {
      this.errorMessage = 'Authentication required. Please log in again.';
      return;
    }

    this.isLoading = true;
    this.clearMessages();

    this.roleService.getAllRoles().subscribe({
      next: (roles) => {
        this.roles = roles;
        this.isLoading = false;

        if (roles.length === 0) {
          this.errorMessage =
            'No roles found. Create your first role to get started.';
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.handleApiError(error, 'Failed to load roles');
      },
    });
  }

  openCreateModal() {
    if (!this.authService.isAuthenticated()) {
      this.errorMessage = 'Authentication required. Please log in again.';
      return;
    }

    this.showCreateModal = true;
    this.createRoleForm.reset();
    this.clearMessages();
    this.clearModalMessages();
  }

  closeCreateModal() {
    this.showCreateModal = false;
    this.createRoleForm.reset();
    this.clearModalMessages();
  }

  openEditModal(role: Role) {
    if (!this.authService.isAuthenticated()) {
      this.errorMessage = 'Authentication required. Please log in again.';
      return;
    }

    // Check if role is inactive and prevent editing
    if (!role.isActive) {
      this.errorMessage =
        'Cannot edit inactive roles. Please reactivate the role first to make changes.';
      return;
    }

    this.selectedRole = role;
    this.showEditModal = true;
    this.editRoleForm.patchValue({
      name: role.name,
    });
    this.clearMessages();
    this.clearModalMessages();
  }

  closeEditModal() {
    this.showEditModal = false;
    this.selectedRole = null;
    this.editRoleForm.reset();
    this.clearModalMessages();
  }

  onCreateRole() {
    if (this.createRoleForm.valid && this.authService.isAuthenticated()) {
      this.isLoading = true;
      this.clearModalMessages();

      const request: CreateRoleRequest = {
        name: this.createRoleForm.get('name')?.value.trim(),
      };

      this.roleService.createRole(request).subscribe({
        next: (response) => {
          this.successMessage = 'Role created successfully!';
          this.closeCreateModal();
          this.loadRoles();
        },
        error: (error) => {
          this.isLoading = false;
          // Show error in modal instead of main page
          this.handleModalError(error, 'Failed to create role', true);
        },
      });
    } else {
      if (!this.authService.isAuthenticated()) {
        this.createModalErrorMessage = 'Authentication required. Please log in again.';
      } else {
        this.markFormFieldsAsTouched(this.createRoleForm);
      }
    }
  }

  onUpdateRole() {
    if (
      this.editRoleForm.valid &&
      this.selectedRole &&
      this.authService.isAuthenticated()
    ) {
      // Double check if role is still active before updating
      if (!this.selectedRole.isActive) {
        this.editModalErrorMessage = 'Cannot update inactive roles. Please reactivate the role first.';
        return;
      }

      this.isLoading = true;
      this.clearModalMessages();

      const request: UpdateRoleRequest = {
        name: this.editRoleForm.get('name')?.value.trim(),
      };

      this.roleService.updateRole(this.selectedRole.id, request).subscribe({
        next: (response) => {
          this.successMessage = 'Role updated successfully!';
          this.closeEditModal();
          this.loadRoles();
        },
        error: (error) => {
          this.isLoading = false;
          // Show error in modal instead of main page
          this.handleModalError(error, 'Failed to update role', false);
        },
      });
    } else {
      if (!this.authService.isAuthenticated()) {
        this.editModalErrorMessage = 'Authentication required. Please log in again.';
      } else {
        this.markFormFieldsAsTouched(this.editRoleForm);
      }
    }
  }

  onToggleRoleStatus(role: Role) {
    if (!this.authService.isAuthenticated()) {
      this.errorMessage = 'Authentication required. Please log in again.';
      return;
    }

    this.isLoading = true;
    this.clearMessages();

    const operation = role.isActive
      ? this.roleService.deactivateRole(role.id)
      : this.roleService.reactivateRole(role.id);

    const actionText = role.isActive ? 'deactivated' : 'reactivated';

    operation.subscribe({
      next: (response) => {
        this.successMessage = `Role ${actionText} successfully!`;
        this.loadRoles();
      },
      error: (error) => {
        this.isLoading = false;
        this.handleApiError(
          error,
          `Failed to ${role.isActive ? 'deactivate' : 'reactivate'} role`
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
      userFriendlyMessage = 'The requested role was not found. It may have been deleted by another user.';
    } else if (error.status === 409) {
      userFriendlyMessage = 'A role with this name already exists. Please choose a different name.';
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
        'The requested role was not found. It may have been deleted by another user.';
    } else if (error.status === 409) {
      userFriendlyMessage =
        'A role with this name already exists. Please choose a different name.';
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

  // Method to check if a role can be edited
  canEditRole(role: Role): boolean {
    return role.isActive;
  }

  // Method to get appropriate button text and class
  getToggleButtonConfig(role: Role): {
    text: string;
    class: string;
    icon: string;
  } {
    if (role.isActive) {
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

  refreshRoles() {
    this.loadRoles();
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
      this.createRoleForm.valid &&
      !this.isLoading &&
      this.authService.isAuthenticated()
    );
  }

  get isEditFormValid(): boolean {
    return (
      this.editRoleForm.valid &&
      !this.isLoading &&
      this.authService.isAuthenticated()
    );
  }

  trackByRoleId(index: number, role: Role): number {
    return role.id;
  }
}