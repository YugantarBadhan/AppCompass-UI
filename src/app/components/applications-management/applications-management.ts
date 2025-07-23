import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ApplicationService } from '../../services/application.service';

interface Application {
  appId: number;
  appName: string;
  appDescription?: string;
  active: boolean;
}

@Component({
  selector: 'app-applications',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './applications-management.html',
  styleUrl: './applications-management.css'
})
export class ApplicationsManagementComponent implements OnInit {
  activeTab: string = 'register';
  registerForm!: FormGroup;
  updateForm!: FormGroup;
  deactivateForm!: FormGroup;
  reactivateForm!: FormGroup;

  // Application data
  applications: Application[] = [];
  activeApplications: Application[] = [];
  inactiveApplications: Application[] = [];

  // Loading and message states
  isLoading = false;
  isLoadingApplications = false;
  successMessage: string = '';
  errorMessage: string = '';

  constructor(
    private fb: FormBuilder,
    private applicationService: ApplicationService
  ) {
    this.initializeForms();
  }

  ngOnInit(): void {
    this.loadApplications();
  }

  // Track by function for ngFor performance
  trackByAppId(index: number, app: Application): number {
    return app.appId;
  }

  private initializeForms(): void {
    this.registerForm = this.fb.group({
      appName: ['', [Validators.required, Validators.minLength(3)]],
      appDescription: ['', [Validators.required, Validators.minLength(10)]]
    });

    this.updateForm = this.fb.group({
      selectedAppId: [null, [Validators.required]],
      appName: ['', [Validators.required, Validators.minLength(3)]],
      appDescription: ['', [Validators.required, Validators.minLength(10)]]
    });

    this.deactivateForm = this.fb.group({
      selectedAppId: [null, [Validators.required]]
    });

    this.reactivateForm = this.fb.group({
      selectedAppId: [null, [Validators.required]]
    });
  }

  private loadApplications(): void {
    this.isLoadingApplications = true;
    this.applicationService.getAllApplications().subscribe({
      next: (apps: Application[]) => {
        this.applications = apps;
        this.activeApplications = apps.filter(app => app.active === true);
        this.inactiveApplications = apps.filter(app => app.active === false);
        this.isLoadingApplications = false;
      },
      error: (error) => {
        this.isLoadingApplications = false;
        this.errorMessage = 'Failed to load applications. Please refresh the page.';
        console.error('Error loading applications:', error);
      }
    });
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
    this.clearMessages();
    this.resetForms();
  }

  private resetForms(): void {
    this.updateForm.reset();
    this.deactivateForm.reset();
    this.reactivateForm.reset();
  }

  // Selection handlers
  onUpdateApplicationSelect(event: any): void {
    const selectedAppId = parseInt(event.target.value);
    if (selectedAppId) {
      const selectedApp = this.applications.find(app => app.appId === selectedAppId);
      if (selectedApp) {
        this.updateForm.patchValue({
          selectedAppId: selectedAppId,
          appName: selectedApp.appName,
          appDescription: selectedApp.appDescription || ''
        });
      }
    } else {
      this.updateForm.patchValue({
        selectedAppId: null,
        appName: '',
        appDescription: ''
      });
    }
  }

  onDeactivateApplicationSelect(event: any): void {
    const selectedAppId = parseInt(event.target.value);
    this.deactivateForm.patchValue({
      selectedAppId: selectedAppId || null
    });
  }

  onReactivateApplicationSelect(event: any): void {
    const selectedAppId = parseInt(event.target.value);
    this.reactivateForm.patchValue({
      selectedAppId: selectedAppId || null
    });
  }

  // Get selected application info
  getSelectedUpdateApplication(): Application | null {
    const selectedAppId = this.updateForm.get('selectedAppId')?.value;
    return selectedAppId ? this.applications.find(app => app.appId === selectedAppId) || null : null;
  }

  getSelectedDeactivateApplication(): Application | null {
    const selectedAppId = this.deactivateForm.get('selectedAppId')?.value;
    return selectedAppId ? this.activeApplications.find(app => app.appId === selectedAppId) || null : null;
  }

  getSelectedReactivateApplication(): Application | null {
    const selectedAppId = this.reactivateForm.get('selectedAppId')?.value;
    return selectedAppId ? this.inactiveApplications.find(app => app.appId === selectedAppId) || null : null;
  }

  // Form submission methods
  onRegisterSubmit(): void {
    if (this.registerForm.valid) {
      this.isLoading = true;
      this.clearMessages();
      const formData = {
        appName: this.registerForm.get('appName')?.value,
        appDescription: this.registerForm.get('appDescription')?.value
      };
      this.applicationService.registerApplication(formData).subscribe({
        next: () => {
          this.isLoading = false;
          this.successMessage = 'Application registered successfully!';
          this.registerForm.reset();
          this.loadApplications();
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.error?.message || 'Failed to register application. Please try again.';
        }
      });
    } else {
      this.markFormGroupTouched(this.registerForm);
    }
  }

  onUpdateSubmit(): void {
    if (this.updateForm.valid) {
      const selectedAppId = this.updateForm.get('selectedAppId')?.value;
      const selectedApp = this.getSelectedUpdateApplication();
      
      if (!selectedAppId || !selectedApp) {
        this.errorMessage = 'Please select an application to update.';
        return;
      }

      this.isLoading = true;
      this.clearMessages();
      const formData = {
        appName: this.updateForm.get('appName')?.value,
        appDescription: this.updateForm.get('appDescription')?.value
      };
      
      this.applicationService.updateApplication(selectedAppId, formData).subscribe({
        next: () => {
          this.isLoading = false;
          this.successMessage = `Application "${selectedApp.appName}" updated successfully!`;
          this.updateForm.reset();
          this.loadApplications();
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.error?.message || 'Failed to update application. Please try again.';
        }
      });
    } else {
      this.markFormGroupTouched(this.updateForm);
    }
  }

  onDeactivateSubmit(): void {
    if (this.deactivateForm.valid) {
      const selectedAppId = this.deactivateForm.get('selectedAppId')?.value;
      const selectedApp = this.getSelectedDeactivateApplication();
      
      if (!selectedAppId || !selectedApp) {
        this.errorMessage = 'Please select an application to deactivate.';
        return;
      }

      this.isLoading = true;
      this.clearMessages();
      
      this.applicationService.deactivateApplication(selectedAppId).subscribe({
        next: () => {
          this.isLoading = false;
          this.successMessage = `Application "${selectedApp.appName}" deactivated successfully!`;
          this.deactivateForm.reset();
          this.loadApplications();
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.error?.message || 'Failed to deactivate application. Please try again.';
        }
      });
    } else {
      this.markFormGroupTouched(this.deactivateForm);
    }
  }

  onReactivateSubmit(): void {
    if (this.reactivateForm.valid) {
      const selectedAppId = this.reactivateForm.get('selectedAppId')?.value;
      const selectedApp = this.getSelectedReactivateApplication();
      
      if (!selectedAppId || !selectedApp) {
        this.errorMessage = 'Please select an application to reactivate.';
        return;
      }

      this.isLoading = true;
      this.clearMessages();
      
      this.applicationService.reactivateApplication(selectedAppId).subscribe({
        next: () => {
          this.isLoading = false;
          this.successMessage = `Application "${selectedApp.appName}" reactivated successfully!`;
          this.reactivateForm.reset();
          this.loadApplications();
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.error?.message || 'Failed to reactivate application. Please try again.';
        }
      });
    } else {
      this.markFormGroupTouched(this.reactivateForm);
    }
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  clearMessages(): void {
    this.successMessage = '';
    this.errorMessage = '';
  }

  isFieldInvalid(formGroup: FormGroup, fieldName: string): boolean {
    const field = formGroup.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(formGroup: FormGroup, fieldName: string): string {
    const field = formGroup.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) {
        return `${this.getFieldDisplayName(fieldName)} is required.`;
      }
      if (field.errors['minlength']) {
        const minLength = field.errors['minlength'].requiredLength;
        return `${this.getFieldDisplayName(fieldName)} must be at least ${minLength} characters.`;
      }
    }
    return '';
  }

  private getFieldDisplayName(fieldName: string): string {
    const displayNames: { [key: string]: string } = {
      'appName': 'Application Name',
      'appDescription': 'Application Description',
      'selectedAppId': 'Application Selection'
    };
    return displayNames[fieldName] || fieldName;
  }
}