import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
} from '@angular/forms';
import {
  AuthService,
  ForgotPasswordResponse,
} from '../../services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './forgot-password.html',
  styleUrls: ['./forgot-password.css'],
})
export class ForgotPasswordComponent implements OnInit {
  @Output() backToLogin = new EventEmitter<void>();

  forgotPasswordForm!: FormGroup;
  isLoading = false;
  successMessage = '';
  errorMessage = '';

  constructor(private fb: FormBuilder, private authService: AuthService) {}

  ngOnInit() {
    this.initializeForm();
  }

  initializeForm() {
    this.forgotPasswordForm = this.fb.group(
      {
        username: ['', [Validators.required]],
        newPassword: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required]],
      },
      { validators: this.passwordMatchValidator }
    );
  }

  passwordMatchValidator(
    control: AbstractControl
  ): { [key: string]: any } | null {
    const newPassword = control.get('newPassword');
    const confirmPassword = control.get('confirmPassword');

    if (
      newPassword &&
      confirmPassword &&
      newPassword.value !== confirmPassword.value
    ) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }

    // Clear password mismatch error if passwords match
    if (
      confirmPassword?.errors?.['passwordMismatch'] &&
      newPassword?.value === confirmPassword?.value
    ) {
      delete confirmPassword.errors['passwordMismatch'];
      if (Object.keys(confirmPassword.errors).length === 0) {
        confirmPassword.setErrors(null);
      }
    }

    return null;
  }

  get isResetDisabled(): boolean {
    return this.forgotPasswordForm.invalid || this.isLoading;
  }

  onResetPassword() {
    if (this.forgotPasswordForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      this.successMessage = '';

      const resetData = {
        username: this.forgotPasswordForm.get('username')?.value,
        newPassword: this.forgotPasswordForm.get('newPassword')?.value,
        confirmPassword: this.forgotPasswordForm.get('confirmPassword')?.value,
      };

      this.authService.forgotPassword(resetData).subscribe({
        next: (response: ForgotPasswordResponse) => {
          this.isLoading = false;
          this.successMessage =
            response.message ||
            'Password reset successfully! You can now login with your new password.';
          // Auto redirect back to login after 3 seconds
          setTimeout(() => {
            this.backToLogin.emit();
          }, 3000);
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage =
            error.error?.message ||
            'Failed to reset password. Please try again.';
          console.error('Password reset error:', error);
        },
      });
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.forgotPasswordForm.controls).forEach((key) => {
        this.forgotPasswordForm.get(key)?.markAsTouched();
      });
    }
  }

  onBackToLogin() {
    this.backToLogin.emit();
  }
}
