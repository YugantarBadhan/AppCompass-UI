// Login related interfaces
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  role: string;
  username: string;
}

// Forgot password related interfaces
export interface ForgotPasswordRequest {
  username: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ForgotPasswordResponse {
  message: string;
}
