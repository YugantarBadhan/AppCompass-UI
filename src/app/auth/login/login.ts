import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ForgotPasswordComponent } from '../forgot-password/forgot-password';
import { AlertComponent } from '../../components/alert/alert.component';
import { LoadingComponent } from '../../components/dashboard/loading/loading.component';
import { PermissionService } from '../../services/permission.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ForgotPasswordComponent,
    AlertComponent,
    LoadingComponent,
  ],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  isLoading = false;
  errorMessage = '';
  showForgotPassword = false;
  passwordVisible = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private permissionService: PermissionService
  ) {}

  ngOnInit() {
    this.initializeForm();
  }

  initializeForm() {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  get isLoginDisabled(): boolean {
    return this.loginForm.invalid || this.isLoading;
  }

  togglePasswordVisibility() {
    this.passwordVisible = !this.passwordVisible;
  }

  onLogin() {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      const credentials = {
        username: this.loginForm.get('username')?.value.trim(),
        password: this.loginForm.get('password')?.value,
      };

      this.authService.login(credentials).subscribe({
        next: (response) => {
          this.isLoading = false;
          if (response.token) {
            console.log('Login successful', response);
            // Refresh user profile after successful login to get role information
            this.permissionService.refreshUserProfile().subscribe({
              next: () => {
                this.router.navigate(['/dashboard']);
              },
              error: (error) => {
                console.error('Failed to load user profile after login:', error);
                // Still navigate to dashboard, permissions will be loaded there
                this.router.navigate(['/dashboard']);
              }
            });
          } else {
            this.errorMessage = 'Login failed. No token received.';
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage =
            error.message || 'Invalid username or password. Please try again.';
        },
      });
    } else {
      this.markAllFieldsAsTouched();
    }
  }

  onForgotPassword() {
    this.showForgotPassword = true;
    this.clearError();
  }

  onBackToLogin() {
    this.showForgotPassword = false;
    this.clearError();
    this.loginForm.reset();
  }

  clearError() {
    this.errorMessage = '';
  }

  private markAllFieldsAsTouched() {
    Object.keys(this.loginForm.controls).forEach((key) => {
      this.loginForm.get(key)?.markAsTouched();
    });
  }
}
