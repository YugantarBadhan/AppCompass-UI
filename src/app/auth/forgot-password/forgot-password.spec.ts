import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { ForgotPasswordComponent } from './forgot-password';
import { AuthService } from '../../services/auth.service';

// Mock AuthService
class MockAuthService {
  forgotPassword(data: any) {
    if (data.username === 'validuser') {
      return of({ message: 'Password reset successful.' });
    } else {
      return throwError(() => ({ error: { message: 'User not found' } }));
    }
  }
}

describe('ForgotPasswordComponent', () => {
  let component: ForgotPasswordComponent;
  let fixture: ComponentFixture<ForgotPasswordComponent>;
  let authService: AuthService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ForgotPasswordComponent, ReactiveFormsModule],
      providers: [{ provide: AuthService, useClass: MockAuthService }],
    }).compileComponents();

    fixture = TestBed.createComponent(ForgotPasswordComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with empty values', () => {
    expect(component.forgotPasswordForm.get('username')?.value).toBe('');
    expect(component.forgotPasswordForm.get('newPassword')?.value).toBe('');
    expect(component.forgotPasswordForm.get('confirmPassword')?.value).toBe('');
  });

  it('should validate required fields', () => {
    const form = component.forgotPasswordForm;
    expect(form.valid).toBeFalsy();

    form.patchValue({
      username: 'testuser',
      newPassword: 'password123',
      confirmPassword: 'password123',
    });

    expect(form.valid).toBeTruthy();
  });

  it('should validate password minimum length', () => {
    const form = component.forgotPasswordForm;
    form.patchValue({
      username: 'testuser',
      newPassword: '123',
      confirmPassword: '123',
    });

    expect(form.get('newPassword')?.hasError('minlength')).toBeTruthy();
    expect(form.valid).toBeFalsy();
  });

  it('should validate password match', () => {
    const form = component.forgotPasswordForm;
    form.patchValue({
      username: 'testuser',
      newPassword: 'password123',
      confirmPassword: 'differentpassword',
    });

    expect(
      form.get('confirmPassword')?.hasError('passwordMismatch')
    ).toBeTruthy();
    expect(form.valid).toBeFalsy();
  });

  it('should disable reset button when form is invalid', () => {
    expect(component.isResetDisabled).toBeTruthy();

    component.forgotPasswordForm.patchValue({
      username: 'testuser',
      newPassword: 'password123',
      confirmPassword: 'password123',
    });

    expect(component.isResetDisabled).toBeFalsy();
  });

  it('should call authService.forgotPassword on form submission', () => {
    spyOn(authService, 'forgotPassword').and.returnValue(
      of({ message: 'Success' })
    );

    component.forgotPasswordForm.patchValue({
      username: 'testuser',
      newPassword: 'password123',
      confirmPassword: 'password123',
    });

    component.onResetPassword();

    expect(authService.forgotPassword).toHaveBeenCalledWith({
      username: 'testuser',
      newPassword: 'password123',
      confirmPassword: 'password123',
    });
  });

  it('should show success message on successful password reset', () => {
    spyOn(authService, 'forgotPassword').and.returnValue(
      of({ message: 'Password reset successful.' })
    );

    component.forgotPasswordForm.patchValue({
      username: 'validuser',
      newPassword: 'password123',
      confirmPassword: 'password123',
    });

    component.onResetPassword();

    expect(component.successMessage).toBe('Password reset successful.');
    expect(component.errorMessage).toBe('');
    expect(component.isLoading).toBeFalsy();
  });

  it('should show error message on failed password reset', () => {
    spyOn(authService, 'forgotPassword').and.returnValue(
      throwError(() => ({ error: { message: 'User not found' } }))
    );

    component.forgotPasswordForm.patchValue({
      username: 'invaliduser',
      newPassword: 'password123',
      confirmPassword: 'password123',
    });

    component.onResetPassword();

    expect(component.errorMessage).toBe('User not found');
    expect(component.successMessage).toBe('');
    expect(component.isLoading).toBeFalsy();
  });

  it('should emit backToLogin event', () => {
    spyOn(component.backToLogin, 'emit');

    component.onBackToLogin();

    expect(component.backToLogin.emit).toHaveBeenCalled();
  });

  it('should auto-redirect after successful password reset', (done) => {
    spyOn(component.backToLogin, 'emit');
    spyOn(authService, 'forgotPassword').and.returnValue(
      of({ message: 'Success' })
    );

    component.forgotPasswordForm.patchValue({
      username: 'testuser',
      newPassword: 'password123',
      confirmPassword: 'password123',
    });

    component.onResetPassword();

    // Wait for the timeout to complete
    setTimeout(() => {
      expect(component.backToLogin.emit).toHaveBeenCalled();
      done();
    }, 3100);
  }, 5000);
});
