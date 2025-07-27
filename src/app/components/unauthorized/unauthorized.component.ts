import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PermissionService } from '../../services/permission.service';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="unauthorized-container">
      <div class="unauthorized-content">
        <div class="unauthorized-icon">🚫</div>
        <h1 class="unauthorized-title">Access Denied</h1>
        <p class="unauthorized-message">
          You don't have permission to access this feature.
        </p>
        <p class="unauthorized-submessage">
          Your current role: <strong>{{ getCurrentRole() }}</strong>
        </p>
        <p class="unauthorized-submessage">
          Username: <strong>{{ getUsername() }}</strong>
        </p>
        <p class="unauthorized-info">
          Contact your administrator if you believe you should have access to this feature.
        </p>
        <div class="unauthorized-actions">
          <button class="btn btn-primary" (click)="goBack()">
            Go Back
          </button>
          <button class="btn btn-secondary" (click)="goHome()">
            Go to App Library
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .unauthorized-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: #f8fafc;
      padding: 2rem;
    }

    .unauthorized-content {
      text-align: center;
      background: white;
      padding: 3rem 2rem;
      border-radius: 1rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      max-width: 500px;
      width: 100%;
    }

    .unauthorized-icon {
      font-size: 4rem;
      margin-bottom: 1.5rem;
    }

    .unauthorized-title {
      font-size: 2rem;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 1rem;
    }

    .unauthorized-message {
      font-size: 1.1rem;
      color: #6b7280;
      margin-bottom: 0.5rem;
    }

    .unauthorized-submessage {
      font-size: 1rem;
      color: #374151;
      margin-bottom: 1rem;
    }

    .unauthorized-submessage strong {
      color: #dc2626;
      font-weight: 600;
    }

    .unauthorized-info {
      font-size: 0.9rem;
      color: #9ca3af;
      margin-bottom: 2rem;
      font-style: italic;
    }

    .unauthorized-actions {
      display: flex;
      gap: 1rem;
      justify-content: center;
      flex-wrap: wrap;
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 0.5rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .btn-primary {
      background-color: #3b82f6;
      color: white;
    }

    .btn-primary:hover {
      background-color: #2563eb;
      transform: translateY(-1px);
    }

    .btn-secondary {
      background-color: #6b7280;
      color: white;
    }

    .btn-secondary:hover {
      background-color: #4b5563;
      transform: translateY(-1px);
    }

    @media (max-width: 480px) {
      .unauthorized-container {
        padding: 1rem;
      }

      .unauthorized-content {
        padding: 2rem 1.5rem;
      }

      .unauthorized-title {
        font-size: 1.5rem;
      }

      .unauthorized-actions {
        flex-direction: column;
      }

      .btn {
        width: 100%;
      }
    }
  `]
})
export class UnauthorizedComponent {
  constructor(
    private router: Router,
    private permissionService: PermissionService
  ) {}

  getCurrentRole(): string {
    return this.permissionService.getUserRoleDisplayName();
  }

  getUsername(): string {
    return this.permissionService.getUsername();
  }

  goBack(): void {
    window.history.back();
  }

  goHome(): void {
    this.router.navigate(['/dashboard/app-library']);
  }
}