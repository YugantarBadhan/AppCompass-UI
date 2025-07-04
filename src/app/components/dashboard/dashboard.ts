import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppLibraryComponent } from '../app-library/app-library';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, AppLibraryComponent],
  template: `
    <div class="app-container">
      <!-- Global Header -->
      <header class="global-header">
        <div class="header-content">
          <div class="logo">
            <span class="logo-icon">⚡</span>
            <span class="logo-text">AppCompass</span>
          </div>
          <div class="user-avatar">
            <img
              src="assets/images/profile.png"
              alt="User Avatar"
              class="avatar-img"
            />
          </div>
        </div>
      </header>

      <div class="main-layout">
        <!-- Left Sidebar -->
        <aside class="sidebar">
          <nav class="sidebar-nav">
            <ul class="nav-list">
              <li class="nav-item active">
                <a href="#" class="nav-link">
                  <span class="nav-icon">📱</span>
                  <span class="nav-text">App Library</span>
                </a>
              </li>
              <li class="nav-item">
                <a href="#" class="nav-link">
                  <span class="nav-icon">⭐</span>
                  <span class="nav-text">Selections</span>
                </a>
              </li>
              <li class="nav-item">
                <a href="#" class="nav-link">
                  <span class="nav-icon">🔍</span>
                  <span class="nav-text">Filters</span>
                </a>
              </li>
            </ul>
          </nav>
          
          <div class="developer-info">
            <a href="#" class="developer-link">
              <span class="developer-icon">👨‍💻</span>
              <span class="developer-text">Developed by Yugantar Badhan</span>
            </a>
          </div>
        </aside>

        <!-- Main Content -->
        <main class="main-content">
          <app-library></app-library>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .app-container {
      height: 100vh;
      display: flex;
      flex-direction: column;
      background-color: #f8fafc;
    }

    .global-header {
      background: white;
      border-bottom: 1px solid #e2e8f0;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      z-index: 1000;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 2rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 700;
      font-size: 1.25rem;
      color: #1e293b;
    }

    .logo-icon {
      font-size: 1.5rem;
    }

    .user-avatar {
      display: flex;
      align-items: center;
    }

    .avatar-img {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid #e2e8f0;
      cursor: pointer;
      transition: border-color 0.2s;
    }

    .avatar-img:hover {
      border-color: #3b82f6;
    }

    .main-layout {
      flex: 1;
      display: flex;
      overflow: hidden;
    }

    .sidebar {
      width: 280px;
      background: white;
      border-right: 1px solid #e2e8f0;
      display: flex;
      flex-direction: column;
      padding: 1.5rem 0;
    }

    .sidebar-nav {
      flex: 1;
      padding: 0 1rem;
    }

    .nav-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .nav-item {
      border-radius: 0.5rem;
      transition: background-color 0.2s;
    }

    .nav-item.active {
      background-color: #eff6ff;
    }

    .nav-link {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      text-decoration: none;
      color: #64748b;
      font-weight: 500;
      transition: color 0.2s;
    }

    .nav-item.active .nav-link {
      color: #3b82f6;
    }

    .nav-icon {
      font-size: 1.25rem;
    }

    .developer-info {
      margin-top: auto;
      padding: 1rem;
      border-top: 1px solid #e2e8f0;
    }

    .developer-link {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem;
      text-decoration: none;
      color: #64748b;
      font-size: 0.875rem;
      border-radius: 0.375rem;
      transition: background-color 0.2s;
    }

    .developer-link:hover {
      background-color: #f1f5f9;
    }

    .main-content {
      flex: 1;
      overflow: auto;
    }

    @media (max-width: 768px) {
      .sidebar {
        width: 240px;
      }
      
      .header-content {
        padding: 1rem;
      }
    }
  `]
})
export class DashboardComponent {}