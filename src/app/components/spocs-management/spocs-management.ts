import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ApplicationService } from '../../services/application.service';

interface Team {
  teamId: number;
  teamName: string;
  teamDescription?: string;
  active: boolean;
}

interface AppSpoc {
  spocId: number;
  spocName: string;
  spocDesignation: string;
  email: string;
  teamId: number;
  teamName: string;
  active: boolean;
}

interface Application {
  appId: number;
  appName: string;
  appDescription: string;
  active: boolean;
}

@Component({
  selector: 'app-spocs-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './spocs-management.html',
  styleUrl: './spocs-management.css',
})
export class SpocsManagementComponent implements OnInit {
  activeTab: string = 'register';
  registerForm!: FormGroup;
  updateForm!: FormGroup;
  deactivateForm!: FormGroup;
  reactivateForm!: FormGroup;
  assignForm!: FormGroup;

  // Data
  spocs: AppSpoc[] = [];
  activeSpocs: AppSpoc[] = [];
  inactiveSpocs: AppSpoc[] = [];
  teams: Team[] = [];
  applications: Application[] = [];

  // Loading and message states
  isLoading = false;
  isLoadingSpocs = false;
  isLoadingTeams = false;
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
    this.loadSpocs();
    this.loadTeams();
    this.loadApplications();
  }

  // Track by functions for ngFor performance
  trackBySpocId(index: number, spoc: AppSpoc): number {
    return spoc.spocId;
  }

  trackByTeamId(index: number, team: Team): number {
    return team.teamId;
  }

  trackByAppId(index: number, app: Application): number {
    return app.appId;
  }

  private initializeForms(): void {
    this.registerForm = this.fb.group({
      spocName: ['', [Validators.required, Validators.minLength(3)]],
      spocDesignation: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      teamId: [null, [Validators.required]],
    });

    this.updateForm = this.fb.group({
      selectedSpocId: [null, [Validators.required]],
      spocName: ['', [Validators.required, Validators.minLength(3)]],
      spocDesignation: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      teamId: [null, [Validators.required]],
    });

    this.deactivateForm = this.fb.group({
      selectedSpocId: [null, [Validators.required]],
    });

    this.reactivateForm = this.fb.group({
      selectedSpocId: [null, [Validators.required]],
    });

    this.assignForm = this.fb.group({
      selectedAppId: [null, [Validators.required]],
      selectedSpocId: [null, [Validators.required]],
    });
  }

  private loadSpocs(): void {
    this.isLoadingSpocs = true;
    this.applicationService.getAllAppSpocs().subscribe({
      next: (spocs: AppSpoc[]) => {
        this.spocs = spocs;
        this.activeSpocs = spocs.filter((spoc) => spoc.active === true);
        this.inactiveSpocs = spocs.filter((spoc) => spoc.active === false);
        this.isLoadingSpocs = false;
      },
      error: (error) => {
        this.isLoadingSpocs = false;
        this.errorMessage = 'Failed to load SPOCs. Please refresh the page.';
        console.error('Error loading SPOCs:', error);
      },
    });
  }

  private loadTeams(): void {
    this.isLoadingTeams = true;
    this.applicationService.getAllTeams().subscribe({
      next: (teams: Team[]) => {
        this.teams = teams.filter((team) => team.active === true);
        this.isLoadingTeams = false;
      },
      error: (error) => {
        this.isLoadingTeams = false;
        console.error('Error loading teams:', error);
      },
    });
  }

  private loadApplications(): void {
    this.isLoadingApplications = true;
    this.applicationService.getAllApplications().subscribe({
      next: (applications: Application[]) => {
        this.applications = applications.filter((app) => app.active === true);
        this.isLoadingApplications = false;
      },
      error: (error) => {
        this.isLoadingApplications = false;
        console.error('Error loading applications:', error);
      },
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
    this.assignForm.reset();
  }

  // Selection handlers
  onUpdateSpocSelect(event: any): void {
    const selectedSpocId = parseInt(event.target.value);
    if (selectedSpocId) {
      const selectedSpoc = this.spocs.find((spoc) => spoc.spocId === selectedSpocId);
      if (selectedSpoc) {
        this.updateForm.patchValue({
          selectedSpocId: selectedSpocId,
          spocName: selectedSpoc.spocName,
          spocDesignation: selectedSpoc.spocDesignation,
          email: selectedSpoc.email,
          teamId: selectedSpoc.teamId,
        });
      }
    } else {
      this.updateForm.patchValue({
        selectedSpocId: null,
        spocName: '',
        spocDesignation: '',
        email: '',
        teamId: null,
      });
    }
  }

  onDeactivateSpocSelect(event: any): void {
    const selectedSpocId = parseInt(event.target.value);
    this.deactivateForm.patchValue({
      selectedSpocId: selectedSpocId || null,
    });
  }

  onReactivateSpocSelect(event: any): void {
    const selectedSpocId = parseInt(event.target.value);
    this.reactivateForm.patchValue({
      selectedSpocId: selectedSpocId || null,
    });
  }

  onAssignAppSelect(event: any): void {
    const selectedAppId = parseInt(event.target.value);
    this.assignForm.patchValue({
      selectedAppId: selectedAppId || null,
    });
  }

  onAssignSpocSelect(event: any): void {
    const selectedSpocId = parseInt(event.target.value);
    this.assignForm.patchValue({
      selectedSpocId: selectedSpocId || null,
    });
  }

  // Get selected SPOC info
  getSelectedUpdateSpoc(): AppSpoc | null {
    const selectedSpocId = this.updateForm.get('selectedSpocId')?.value;
    return selectedSpocId
      ? this.spocs.find((spoc) => spoc.spocId === selectedSpocId) || null
      : null;
  }

  getSelectedDeactivateSpoc(): AppSpoc | null {
    const selectedSpocId = this.deactivateForm.get('selectedSpocId')?.value;
    return selectedSpocId
      ? this.activeSpocs.find((spoc) => spoc.spocId === selectedSpocId) || null
      : null;
  }

  getSelectedReactivateSpoc(): AppSpoc | null {
    const selectedSpocId = this.reactivateForm.get('selectedSpocId')?.value;
    return selectedSpocId
      ? this.inactiveSpocs.find((spoc) => spoc.spocId === selectedSpocId) || null
      : null;
  }

  getSelectedApplication(): Application | null {
    const selectedAppId = this.assignForm.get('selectedAppId')?.value;
    return selectedAppId
      ? this.applications.find((app) => app.appId === selectedAppId) || null
      : null;
  }

  getSelectedAssignSpoc(): AppSpoc | null {
    const selectedSpocId = this.assignForm.get('selectedSpocId')?.value;
    return selectedSpocId
      ? this.activeSpocs.find((spoc) => spoc.spocId === selectedSpocId) || null
      : null;
  }

  getSelectedTeamName(teamId: number): string {
    const team = this.teams.find((t) => t.teamId === teamId);
    return team ? team.teamName : 'Unknown Team';
  }

  // Form submission methods
  onRegisterSubmit(): void {
    if (this.registerForm.valid) {
      this.isLoading = true;
      this.clearMessages();
      const formData = {
        spocName: this.registerForm.get('spocName')?.value,
        spocDesignation: this.registerForm.get('spocDesignation')?.value,
        email: this.registerForm.get('email')?.value,
        teamId: this.registerForm.get('teamId')?.value,
      };
      this.applicationService.registerSpoc(formData).subscribe({
        next: () => {
          this.isLoading = false;
          this.successMessage = 'SPOC registered successfully!';
          this.registerForm.reset();
          this.loadSpocs();
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage =
            error.error?.message ||
            'Failed to register SPOC. Please try again.';
        },
      });
    } else {
      this.markFormGroupTouched(this.registerForm);
    }
  }

  onUpdateSubmit(): void {
    if (this.updateForm.valid) {
      const selectedSpocId = this.updateForm.get('selectedSpocId')?.value;
      const selectedSpoc = this.getSelectedUpdateSpoc();

      if (!selectedSpocId || !selectedSpoc) {
        this.errorMessage = 'Please select a SPOC to update.';
        return;
      }

      this.isLoading = true;
      this.clearMessages();
      const formData = {
        spocName: this.updateForm.get('spocName')?.value,
        spocDesignation: this.updateForm.get('spocDesignation')?.value,
        email: this.updateForm.get('email')?.value,
        teamId: this.updateForm.get('teamId')?.value,
      };

      this.applicationService.updateSpoc(selectedSpocId, formData).subscribe({
        next: () => {
          this.isLoading = false;
          this.successMessage = `SPOC "${selectedSpoc.spocName}" updated successfully!`;
          this.updateForm.reset();
          this.loadSpocs();
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage =
            error.error?.message || 'Failed to update SPOC. Please try again.';
        },
      });
    } else {
      this.markFormGroupTouched(this.updateForm);
    }
  }

  onDeactivateSubmit(): void {
    if (this.deactivateForm.valid) {
      const selectedSpocId = this.deactivateForm.get('selectedSpocId')?.value;
      const selectedSpoc = this.getSelectedDeactivateSpoc();

      if (!selectedSpocId || !selectedSpoc) {
        this.errorMessage = 'Please select a SPOC to deactivate.';
        return;
      }

      this.isLoading = true;
      this.clearMessages();

      this.applicationService.deactivateSpoc(selectedSpocId).subscribe({
        next: () => {
          this.isLoading = false;
          this.successMessage = `SPOC "${selectedSpoc.spocName}" deactivated successfully!`;
          this.deactivateForm.reset();
          this.loadSpocs();
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage =
            error.error?.message ||
            'Failed to deactivate SPOC. Please try again.';
        },
      });
    } else {
      this.markFormGroupTouched(this.deactivateForm);
    }
  }

  onReactivateSubmit(): void {
    if (this.reactivateForm.valid) {
      const selectedSpocId = this.reactivateForm.get('selectedSpocId')?.value;
      const selectedSpoc = this.getSelectedReactivateSpoc();

      if (!selectedSpocId || !selectedSpoc) {
        this.errorMessage = 'Please select a SPOC to reactivate.';
        return;
      }

      this.isLoading = true;
      this.clearMessages();

      this.applicationService.reactivateSpoc(selectedSpocId).subscribe({
        next: () => {
          this.isLoading = false;
          this.successMessage = `SPOC "${selectedSpoc.spocName}" reactivated successfully!`;
          this.reactivateForm.reset();
          this.loadSpocs();
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage =
            error.error?.message ||
            'Failed to reactivate SPOC. Please try again.';
        },
      });
    } else {
      this.markFormGroupTouched(this.reactivateForm);
    }
  }

  onAssignSubmit(): void {
    if (this.assignForm.valid) {
      const selectedAppId = this.assignForm.get('selectedAppId')?.value;
      const selectedSpocId = this.assignForm.get('selectedSpocId')?.value;
      const selectedApp = this.getSelectedApplication();
      const selectedSpoc = this.getSelectedAssignSpoc();

      if (!selectedAppId || !selectedSpocId || !selectedApp || !selectedSpoc) {
        this.errorMessage = 'Please select both an application and a SPOC.';
        return;
      }

      this.isLoading = true;
      this.clearMessages();

      this.applicationService.assignSpocToApplication(selectedAppId, selectedSpocId).subscribe({
        next: () => {
          this.isLoading = false;
          this.successMessage = `SPOC "${selectedSpoc.spocName}" assigned to application "${selectedApp.appName}" successfully!`;
          this.assignForm.reset();
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage =
            error.error?.message ||
            'Failed to assign SPOC to application. Please try again.';
        },
      });
    } else {
      this.markFormGroupTouched(this.assignForm);
    }
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach((key) => {
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
        return `${this.getFieldDisplayName(
          fieldName
        )} must be at least ${minLength} characters.`;
      }
      if (field.errors['email']) {
        return 'Please enter a valid email address.';
      }
    }
    return '';
  }

  private getFieldDisplayName(fieldName: string): string {
    const displayNames: { [key: string]: string } = {
      spocName: 'SPOC Name',
      spocDesignation: 'SPOC Designation',
      email: 'Email',
      teamId: 'Team',
      selectedSpocId: 'SPOC Selection',
      selectedAppId: 'Application Selection',
    };
    return displayNames[fieldName] || fieldName;
  }
}