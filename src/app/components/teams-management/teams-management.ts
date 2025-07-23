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

@Component({
  selector: 'app-teams-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './teams-management.html',
  styleUrl: './teams-management.css',
})
export class TeamsManagementComponent implements OnInit {
  activeTab: string = 'register';
  registerForm!: FormGroup;
  updateForm!: FormGroup;
  deactivateForm!: FormGroup;
  reactivateForm!: FormGroup;

  // Team data
  teams: Team[] = [];
  activeTeams: Team[] = [];
  inactiveTeams: Team[] = [];

  // Loading and message states
  isLoading = false;
  isLoadingTeams = false;
  successMessage: string = '';
  errorMessage: string = '';

  constructor(
    private fb: FormBuilder,
    private applicationService: ApplicationService
  ) {
    this.initializeForms();
  }

  ngOnInit(): void {
    this.loadTeams();
  }

  // Track by function for ngFor performance
  trackByTeamId(index: number, tm: Team): number {
    return tm.teamId;
  }

  private initializeForms(): void {
    this.registerForm = this.fb.group({
      teamName: ['', [Validators.required, Validators.minLength(3)]],
      teamDescription: ['', [Validators.required, Validators.minLength(10)]],
    });

    this.updateForm = this.fb.group({
      selectedTeamId: [null, [Validators.required]],
      teamName: ['', [Validators.required, Validators.minLength(3)]],
      teamDescription: ['', [Validators.required, Validators.minLength(10)]],
    });

    this.deactivateForm = this.fb.group({
      selectedTeamId: [null, [Validators.required]],
    });

    this.reactivateForm = this.fb.group({
      selectedTeamId: [null, [Validators.required]],
    });
  }

  private loadTeams(): void {
    this.isLoadingTeams = true;
    this.applicationService.getAllTeams().subscribe({
      next: (tms: Team[]) => {
        this.teams = tms;
        this.activeTeams = tms.filter((tm) => tm.active === true);
        this.inactiveTeams = tms.filter((tm) => tm.active === false);
        this.isLoadingTeams = false;
      },
      error: (error) => {
        this.isLoadingTeams = false;
        this.errorMessage = 'Failed to load teams. Please refresh the page.';
        console.error('Error loading teams:', error);
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
  }

  // Selection handlers
  onUpdateTeamSelect(event: any): void {
    const selectedTeamId = parseInt(event.target.value);
    if (selectedTeamId) {
      const selectedTm = this.teams.find((tm) => tm.teamId === selectedTeamId);
      if (selectedTm) {
        this.updateForm.patchValue({
          selectedTeamId: selectedTeamId,
          teamName: selectedTm.teamName,
          teamDescription: selectedTm.teamDescription || '',
        });
      }
    } else {
      this.updateForm.patchValue({
        selectedTeamId: null,
        teamName: '',
        teamDescription: '',
      });
    }
  }

  onDeactivateTeamSelect(event: any): void {
    const selectedTeamId = parseInt(event.target.value);
    this.deactivateForm.patchValue({
      selectedTeamId: selectedTeamId || null,
    });
  }

  onReactivateTeamSelect(event: any): void {
    const selectedTeamId = parseInt(event.target.value);
    this.reactivateForm.patchValue({
      selectedTeamId: selectedTeamId || null,
    });
  }

  // Get selected team info
  getSelectedUpdateTeam(): Team | null {
    const selectedTeamId = this.updateForm.get('selectedTeamId')?.value;
    return selectedTeamId
      ? this.teams.find((tm) => tm.teamId === selectedTeamId) || null
      : null;
  }

  getSelectedDeactivateTeam(): Team | null {
    const selectedTeamId = this.deactivateForm.get('selectedTeamId')?.value;
    return selectedTeamId
      ? this.activeTeams.find((tm) => tm.teamId === selectedTeamId) || null
      : null;
  }

  getSelectedReactivateTeam(): Team | null {
    const selectedTeamId = this.reactivateForm.get('selectedTeamId')?.value;
    return selectedTeamId
      ? this.inactiveTeams.find((tm) => tm.teamId === selectedTeamId) || null
      : null;
  }

  // Form submission methods
  onRegisterSubmit(): void {
    if (this.registerForm.valid) {
      this.isLoading = true;
      this.clearMessages();
      const formData = {
        teamName: this.registerForm.get('teamName')?.value,
        teamDescription: this.registerForm.get('teamDescription')?.value,
      };
      this.applicationService.registerTeam(formData).subscribe({
        next: () => {
          this.isLoading = false;
          this.successMessage = 'Team registered successfully!';
          this.registerForm.reset();
          this.loadTeams();
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage =
            error.error?.message ||
            'Failed to register team. Please try again.';
        },
      });
    } else {
      this.markFormGroupTouched(this.registerForm);
    }
  }

  onUpdateSubmit(): void {
    if (this.updateForm.valid) {
      const selectedTeamId = this.updateForm.get('selectedTeamId')?.value;
      const selectedTeam = this.getSelectedUpdateTeam();

      if (!selectedTeamId || !selectedTeam) {
        this.errorMessage = 'Please select a team to update.';
        return;
      }

      this.isLoading = true;
      this.clearMessages();
      const formData = {
        teamName: this.updateForm.get('teamName')?.value,
        teamDescription: this.updateForm.get('teamDescription')?.value,
      };

      this.applicationService.updateTeam(selectedTeamId, formData).subscribe({
        next: () => {
          this.isLoading = false;
          this.successMessage = `Team "${selectedTeam.teamName}" updated successfully!`;
          this.updateForm.reset();
          this.loadTeams();
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage =
            error.error?.message || 'Failed to update team. Please try again.';
        },
      });
    } else {
      this.markFormGroupTouched(this.updateForm);
    }
  }

  onDeactivateSubmit(): void {
    if (this.deactivateForm.valid) {
      const selectedTeamId = this.deactivateForm.get('selectedTeamId')?.value;
      const selectedTeam = this.getSelectedDeactivateTeam();

      if (!selectedTeamId || !selectedTeam) {
        this.errorMessage = 'Please select a team to deactivate.';
        return;
      }

      this.isLoading = true;
      this.clearMessages();

      this.applicationService.deactivateTeam(selectedTeamId).subscribe({
        next: () => {
          this.isLoading = false;
          this.successMessage = `Team "${selectedTeam.teamName}" deactivated successfully!`;
          this.deactivateForm.reset();
          this.loadTeams();
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage =
            error.error?.message ||
            'Failed to deactivate team. Please try again.';
        },
      });
    } else {
      this.markFormGroupTouched(this.deactivateForm);
    }
  }

  onReactivateSubmit(): void {
    if (this.reactivateForm.valid) {
      const selectedTeamId = this.reactivateForm.get('selectedTeamId')?.value;
      const selectedTeam = this.getSelectedReactivateTeam();

      if (!selectedTeamId || !selectedTeam) {
        this.errorMessage = 'Please select a team to reactivate.';
        return;
      }

      this.isLoading = true;
      this.clearMessages();

      this.applicationService.reactivateTeam(selectedTeamId).subscribe({
        next: () => {
          this.isLoading = false;
          this.successMessage = `Team "${selectedTeam.teamName}" reactivated successfully!`;
          this.reactivateForm.reset();
          this.loadTeams();
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage =
            error.error?.message ||
            'Failed to reactivate team. Please try again.';
        },
      });
    } else {
      this.markFormGroupTouched(this.reactivateForm);
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
    }
    return '';
  }

  private getFieldDisplayName(fieldName: string): string {
    const displayNames: { [key: string]: string } = {
      teamName: 'Team Name',
      teamDescription: 'Team Description',
      selectedTeamId: 'Team Selection',
    };
    return displayNames[fieldName] || fieldName;
  }
}
