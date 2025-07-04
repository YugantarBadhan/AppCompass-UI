import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApplicationService, Application } from '../../services/application.service';

@Component({
  selector: 'app-library',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app-library.html',
  styleUrls: ['./app-library.css']
})
export class AppLibraryComponent implements OnInit {
  applications: Application[] = [];
  filteredApplications: Application[] = [];
  searchTerm: string = '';
  isLoading: boolean = true;
  error: string | null = null;
  Math = Math;

  constructor(private applicationService: ApplicationService) {}

  ngOnInit(): void {
    this.loadApplications();
  }

  loadApplications(): void {
    this.isLoading = true;
    this.error = null;

    this.applicationService.getAllApplications().subscribe({
      next: (apps) => {
        this.applications = apps;
        this.filteredApplications = [...apps];
        this.isLoading = false;
      },
      error: (error) => {
        this.error = error.error?.message || 'Failed to load applications';
        this.isLoading = false;
      }
    });
  }

  onSearch(): void {
    this.performSearch();
  }

  onSearchInput(): void {
    this.performSearch();
  }

  /**
   * Perform dynamic search across all applications
   */
  private performSearch(): void {
    if (this.searchTerm.trim() === '') {
      // Reset to show all applications
      this.filteredApplications = [...this.applications];
    } else {
      // Filter applications based on search term across all data
      const searchLower = this.searchTerm.toLowerCase();
      this.filteredApplications = this.applications.filter(app =>
        app.appName.toLowerCase().includes(searchLower) ||
        app.appDescription.toLowerCase().includes(searchLower) ||
        (app.active ? 'active' : 'inactive').includes(searchLower)
      );
    }
    
    // Reset to first page when search results change
    this.currentPage = 1;
    this.currentPageGroup = 0;
    this.flippedCardId = null; // Reset flipped card on search
  }

  refreshApplications(): void {
    this.searchTerm = '';
    this.filteredApplications = [...this.applications];
    this.flippedCardId = null; // Reset flipped card on refresh
    this.currentPage = 1;
    this.currentPageGroup = 0;
    this.loadApplications();
  }

  getApplicationIcon(app: Application): string {
    return app.icon || app.initials || app.appName.charAt(0).toUpperCase();
  }

  getApplicationGradient(app: Application): string {
    if (app.gradientColors && app.gradientColors.length >= 2) {
      return `linear-gradient(135deg, ${app.gradientColors[0]}, ${app.gradientColors[1]})`;
    }
    return 'linear-gradient(135deg, #667eea, #764ba2)';
  }

  // Enhanced Pagination Properties
  currentPage: number = 1;
  currentPageGroup: number = 0;
  itemsPerPage: number = 6;
  pagesPerGroup: number = 3;

  get paginatedApplications(): Application[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredApplications.slice(startIndex, startIndex + this.itemsPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredApplications.length / this.itemsPerPage);
  }

  get totalPageGroups(): number {
    return Math.ceil(this.totalPages / this.pagesPerGroup);
  }

  get visiblePages(): number[] {
    const startPage = this.currentPageGroup * this.pagesPerGroup + 1;
    const endPage = Math.min(startPage + this.pagesPerGroup - 1, this.totalPages);
    const pages: number[] = [];
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  get canGoToPreviousGroup(): boolean {
    return this.currentPageGroup > 0;
  }

  get canGoToNextGroup(): boolean {
    return this.currentPageGroup < this.totalPageGroups - 1;
  }

  changePage(page: number): void {
    this.currentPage = page;
    this.flippedCardId = null; // Reset flipped card when changing pages
  }

  goToPreviousGroup(): void {
    if (this.canGoToPreviousGroup) {
      this.currentPageGroup--;
      this.currentPage = this.currentPageGroup * this.pagesPerGroup + 1;
      this.flippedCardId = null; // Reset flipped card when changing page groups
    }
  }

  goToNextGroup(): void {
    if (this.canGoToNextGroup) {
      this.currentPageGroup++;
      this.currentPage = this.currentPageGroup * this.pagesPerGroup + 1;
      this.flippedCardId = null; // Reset flipped card when changing page groups
    }
  }

  flippedCardId: number | null = null;

  /**
   * Check if any card is currently flipped
   */
  isAnyCardFlipped(): boolean {
    return this.flippedCardId !== null;
  }

  /**
   * Handle card click - only flip if no other card is flipped
   */
  handleCardClick(cardId: number): void {
    // Only allow flipping if no card is currently flipped
    if (this.flippedCardId === null) {
      this.flippedCardId = cardId;
    }
    // If the same card is clicked while it's flipped, do nothing
    // User must use the X button to close
  }

  /**
   * Close the flipped card using the X button
   */
  closeFlip(event: Event): void {
    event.stopPropagation();
    this.flippedCardId = null;
  }
}