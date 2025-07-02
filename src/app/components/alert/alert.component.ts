import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export type AlertType = 'success' | 'error' | 'warning' | 'info';

@Component({
  selector: 'app-alert',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="alert" [class]="'alert-' + type" *ngIf="show">
      <div class="alert-content">
        <span class="alert-icon">{{ getIcon() }}</span>
        <span class="alert-message">{{ message }}</span>
        <button 
          *ngIf="dismissible" 
          class="alert-close"
          (click)="onDismiss()"
          aria-label="Close alert"
        >
          ×
        </button>
      </div>
    </div>
  `,
  styles: [`
    .alert {
      padding: 0.75rem 1rem;
      border-radius: 0.5rem;
      border: 1px solid;
      margin-bottom: 1rem;
    }
    
    .alert-content {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .alert-message {
      flex: 1;
      font-size: 0.875rem;
    }
    
    .alert-icon {
      font-size: 1rem;
    }
    
    .alert-close {
      background: none;
      border: none;
      font-size: 1.25rem;
      cursor: pointer;
      padding: 0;
      line-height: 1;
      opacity: 0.7;
    }
    
    .alert-close:hover {
      opacity: 1;
    }
    
    .alert-success {
      background-color: #ecfdf5;
      border-color: #a7f3d0;
      color: #059669;
    }
    
    .alert-error {
      background-color: #fef2f2;
      border-color: #fecaca;
      color: #dc2626;
    }
    
    .alert-warning {
      background-color: #fffbeb;
      border-color: #fed7aa;
      color: #d97706;
    }
    
    .alert-info {
      background-color: #eff6ff;
      border-color: #bfdbfe;
      color: #2563eb;
    }
  `]
})
export class AlertComponent {
  @Input() type: AlertType = 'info';
  @Input() message: string = '';
  @Input() dismissible: boolean = true;
  @Input() show: boolean = true;
  @Output() dismissed = new EventEmitter<void>();

  getIcon(): string {
    switch (this.type) {
      case 'success': return '✓';
      case 'error': return '✕';
      case 'warning': return '⚠';
      case 'info': return 'ℹ';
      default: return 'ℹ';
    }
  }

  onDismiss(): void {
    this.show = false;
    this.dismissed.emit();
  }
}