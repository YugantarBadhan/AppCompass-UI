import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { LoginComponent } from './login';
import { AuthService } from '../../services/auth.service';
import { AlertComponent } from '../../components/alert/alert.component';
import { LoadingComponent } from '../../components/dashboard/loading/loading.component';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['login']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [
        LoginComponent,
        ReactiveFormsModule,
        AlertComponent,
        LoadingComponent,
      ],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    mockAuthService = TestBed.inject(
      AuthService
    ) as jasmine.SpyObj<AuthService>;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with empty values', () => {
    expect(component.loginForm.get('username')?.value).toBe('');
    expect(component.loginForm.get('password')?.value).toBe('');
  });

  it('should validate required fields', () => {
    const usernameControl = component.loginForm.get('username');
    const passwordControl = component.loginForm.get('password');

    expect(usernameControl?.valid).toBeFalsy();
    expect(passwordControl?.valid).toBeFalsy();

    usernameControl?.setValue('testuser');
    passwordControl?.setValue('password123');

    expect(usernameControl?.valid).toBeTruthy();
    expect(passwordControl?.valid).toBeTruthy();
  });

  it('should validate minimum length requirements', () => {
    const usernameControl = component.loginForm.get('username');
    const passwordControl = component.loginForm.get('password');

    usernameControl?.setValue('ab'); // Less than 3 characters
    passwordControl?.setValue('12345'); // Less than 6 characters

    expect(usernameControl?.valid).toBeFalsy();
    expect(passwordControl?.valid).toBeFalsy();

    usernameControl?.setValue('abc'); // Exactly 3 characters
    passwordControl?.setValue('123456'); // Exactly 6 characters

    expect(usernameControl?.valid).toBeTruthy();
    expect(passwordControl?.valid).toBeTruthy();
  });

  it('should disable login button when form is invalid', () => {
    expect(component.isLoginDisabled).toBeTruthy();

    component.loginForm.patchValue({
      username: 'testuser',
      password: 'password123',
    });

    expect(component.isLoginDisabled).toBeFalsy();
  });

  it('should disable login button when loading', () => {
    component.loginForm.patchValue({
      username: 'testuser',
      password: 'password123',
    });
    component.isLoading = true;

    expect(component.isLoginDisabled).toBeTruthy();
  });

  it('should toggle password visibility', () => {
    expect(component.passwordVisible).toBeFalsy();

    component.togglePasswordVisibility();
    expect(component.passwordVisible).toBeTruthy();

    component.togglePasswordVisibility();
    expect(component.passwordVisible).toBeFalsy();
  });

  it('should call auth service on login with valid form', () => {
    const mockResponse = {
      token: 'fake-token',
      user: { id: 1, username: 'testuser' },
    };
    mockAuthService.login.and.returnValue(of(mockResponse));

    component.loginForm.patchValue({
      username: 'testuser',
      password: 'password123',
    });

    component.onLogin();

    expect(mockAuthService.login).toHaveBeenCalledWith({
      username: 'testuser',
      password: 'password123',
    });
  });

  it('should navigate to dashboard on successful login', () => {
    const mockResponse = {
      token: 'fake-token',
      user: { id: 1, username: 'testuser' },
    };
    mockAuthService.login.and.returnValue(of(mockResponse));

    component.loginForm.patchValue({
      username: 'testuser',
      password: 'password123',
    });

    component.onLogin();

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('should show error message on login failure', () => {
    const errorMessage = 'Invalid credentials';
    mockAuthService.login.and.returnValue(
      throwError(() => ({ message: errorMessage }))
    );

    component.loginForm.patchValue({
      username: 'testuser',
      password: 'wrongpassword',
    });

    component.onLogin();

    expect(component.errorMessage).toBe(errorMessage);
    expect(component.isLoading).toBeFalsy();
  });

  it('should show default error message when no error message provided', () => {
    mockAuthService.login.and.returnValue(throwError(() => ({})));

    component.loginForm.patchValue({
      username: 'testuser',
      password: 'wrongpassword',
    });

    component.onLogin();

    expect(component.errorMessage).toBe(
      'Invalid username or password. Please try again.'
    );
  });

  it('should show error when login succeeds but no token received', () => {
    const mockResponse = {
      token: 'fake-token',
      user: { id: 1, username: 'testuser' },
    }; // No token
    mockAuthService.login.and.returnValue(of(mockResponse));

    component.loginForm.patchValue({
      username: 'testuser',
      password: 'password123',
    });

    component.onLogin();

    expect(component.errorMessage).toBe('Login failed. No token received.');
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  it('should mark all fields as touched when form is invalid on submit', () => {
    spyOn(component as any, 'markAllFieldsAsTouched'); // `as any` to access private method
    component.loginForm.patchValue({
      username: '',
      password: '',
    });

    component.onLogin();

    expect((component as any).markAllFieldsAsTouched).toHaveBeenCalled();
  });

  it('should reset form and hide forgot password on back to login', () => {
    component.loginForm.patchValue({
      username: 'testuser',
      password: 'password123',
    });
    component.showForgotPassword = true;
    component.errorMessage = 'Some error';

    component.onBackToLogin();

    expect(component.showForgotPassword).toBeFalse();
    expect(component.errorMessage).toBe('');
    expect(component.loginForm.get('username')?.value).toBeNull();
    expect(component.loginForm.get('password')?.value).toBeNull();
  });
});
