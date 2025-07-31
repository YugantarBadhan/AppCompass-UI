import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ApplicationService,
  Application,
} from '../../services/application.service';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

@Component({
  selector: 'app-library',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app-library.html',
  styleUrls: ['./app-library.css'],
})
export class AppLibraryComponent implements OnInit, OnDestroy {
  allApplications: Application[] = []; // All applications from backend
  filteredApplications: Application[] = []; // Filtered applications based on search
  searchTerm: string = ''; // User input for search
  isLoading: boolean = true; // Loading spinner for first load
  isSearching: boolean = false; // Show spinner while searching
  error: string | null = null; // Error message for failed loads
  Math = Math; // To use Math in template

  isSearchAnimating: boolean = false; // Search animation trigger
  private searchSubject = new Subject<string>(); // Debounce subject for search

  // Pagination state
  currentPage: number = 1;
  itemsPerPage: number = 6;
  totalItems: number = 0;
  totalPages: number = 0;
  jumpToPage: number | null = null;

  flippedCardId: number | null = null; // Card flip state

  // Spoc contact state
  showSpocPopup: boolean = false;
  spocPopupMessage: string = '';

  // Application URL state
  showUrlPopup: boolean = false;
  urlPopupMessage: string = '';

  constructor(private applicationService: ApplicationService) {}

  ngOnInit(): void {
    this.setupSearchDebounce();
    this.loadApplications(); // Initial load
  }

  ngOnDestroy(): void {
    this.searchSubject.complete(); // Clean up
  }

  /**
   * Toggle favorite status of an application using the isFavorite flag from backend
   */
  toggleFavorite(event: Event, app: Application): void {
    event.stopPropagation();

    app.favorite = !app.favorite; // toggle locally for UI

    const apiCall = app.favorite
      ? this.applicationService.addToFavorites(app.appId)
      : this.applicationService.removeFromFavorites(app.appId);

    apiCall.subscribe({
      next: () => {
        console.log(
          `Application ${app.appId} favorite status updated to ${app.favorite}`
        );
      },
      error: (error) => {
        console.error('Error updating favorite status:', error);
        app.favorite = !app.favorite; // rollback on failure
      },
    });
  }

  /**
   * Check if application is favorite - uses backend-provided field
   */
  isFavorite(app: Application): boolean {
    return app.favorite === true;
  }

  /**
   * Handle Contact Spoc button click with mail template
   */
  contactSpoc(event: Event, app: Application): void {
    event.stopPropagation();

    // Check if email array exists and has emails
    if (!app.email || !Array.isArray(app.email) || app.email.length === 0) {
      // Show popup for no emails
      this.spocPopupMessage = 'No Spoc assigned to this application.';
      this.showSpocPopup = true;
      return;
    }

    // Filter out empty emails and create comma-separated string
    const validEmails = app.email.filter(
      (email) => email && email.trim() !== ''
    );

    if (validEmails.length === 0) {
      this.spocPopupMessage =
        'No valid Spoc email assigned to this application.';
      this.showSpocPopup = true;
      return;
    }

    // Get username from localStorage and extract name part (before @)
    const fullUsername = localStorage.getItem('username') || 'User';
    const userName = fullUsername.includes('@')
      ? fullUsername.split('@')[0]
      : fullUsername;

    // Create email template
    const subject = encodeURIComponent(
      `Access Request for ${app.appName} Application`
    );

    const bodyTemplate = `Dear Team,

I recently visited the AppCompass portal and came across the ${app.appName} application. Based on its features and description, I believe it aligns well with my current requirements and would like to explore its functionalities further.

Kindly grant me access to this application at your earliest convenience.

Thank you for your support.

Best regards,
${userName}`;

    const encodedBody = encodeURIComponent(bodyTemplate);

    // Create mailto link with comma-separated emails, subject, and body
    const emailList = validEmails.join(',');
    const mailtoUrl = `mailto:${emailList}?subject=${subject}&body=${encodedBody}`;

    // Open default email client
    window.location.href = mailtoUrl;
  }

  /**
   * Handle Application URL button click
   */
  openApplicationUrl(event: Event, app: Application): void {
    event.stopPropagation();

    // Check if applicationUrl exists
    if (!app.applicationUrl || app.applicationUrl.trim() === '') {
      this.urlPopupMessage =
        'No application URL is available for this application.';
      this.showUrlPopup = true;
      return;
    }

    const url = app.applicationUrl.trim();

    // Validate URL format
    if (!this.isValidUrl(url)) {
      this.urlPopupMessage = 'The application URL is not valid or accessible.';
      this.showUrlPopup = true;
      return;
    }

    // Open URL in new tab
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  /**
   * Validate URL format
   */
  private isValidUrl(urlString: string): boolean {
    try {
      const url = new URL(urlString);
      // Check if it's http or https protocol
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (error) {
      return false;
    }
  }

  /**
   * Close the Spoc popup
   */
  closeSpocPopup(): void {
    this.showSpocPopup = false;
    this.spocPopupMessage = '';
  }

  /**
   * Close the URL popup
   */
  closeUrlPopup(): void {
    this.showUrlPopup = false;
    this.urlPopupMessage = '';
  }

  private setupSearchDebounce(): void {
    this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((searchTerm) => {
        this.performSearch(searchTerm);
      });
  }

  /**
   * Load all applications from backend (no pagination API call)
   */
  loadApplications(): void {
    this.isLoading = true;
    this.error = null;
    console.log('Starting to load applications...');

    this.applicationService.getAllApplications().subscribe({
      next: (applications) => {
        console.log('Raw response from API:', applications);
        this.allApplications = applications || [];
        this.filteredApplications = [...this.allApplications];
        this.updatePaginationInfo();
        this.isLoading = false;
        console.log(
          'Applications loaded successfully:',
          this.allApplications.length
        );
        console.log('Filtered applications:', this.filteredApplications.length);
        console.log('Total pages:', this.totalPages);
        console.log(
          'Current page applications:',
          this.paginatedApplications.length
        );
      },
      error: (error) => {
        console.error('Error loading applications:', error);
        this.error = error.error?.message || 'Failed to load applications';
        this.allApplications = [];
        this.filteredApplications = [];
        this.updatePaginationInfo();
        this.isLoading = false;
      },
    });
  }

  /**
   * Update pagination information based on filtered applications
   */
  private updatePaginationInfo(): void {
    this.totalItems = this.filteredApplications.length;
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);

    // Reset to first page if current page is beyond available pages
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = 1;
    }

    // Ensure current page is at least 1
    if (this.currentPage < 1) {
      this.currentPage = 1;
    }
  }

  /**
   * Handle search input with debouncing
   */
  onSearchInput(): void {
    this.searchSubject.next(this.searchTerm);
  }

  /**
   * Handle search button click
   */
  onSearch(): void {
    this.triggerSearchAnimation();
    this.performSearch(this.searchTerm);
  }

  /**
   * Trigger search animation
   */
  private triggerSearchAnimation(): void {
    this.isSearchAnimating = true;
    setTimeout(() => {
      this.isSearchAnimating = false;
    }, 600);
  }

  /**
   * Perform frontend search filtering
   */
  private performSearch(searchTerm: string): void {
    this.isSearching = true;
    this.currentPage = 1;
    this.jumpToPage = null;
    this.flippedCardId = null;

    // Simulate a small delay for better UX
    setTimeout(() => {
      const trimmedSearchTerm = searchTerm.trim().toLowerCase();

      if (trimmedSearchTerm === '') {
        this.filteredApplications = [...this.allApplications];
      } else {
        this.filteredApplications = this.allApplications.filter((app) => {
          return (
            app.appName.toLowerCase().includes(trimmedSearchTerm) ||
            app.appDescription.toLowerCase().includes(trimmedSearchTerm)
          );
        });
      }

      this.updatePaginationInfo();
      this.isSearching = false;
    }, 200);
  }

  /**
   * Refresh applications by reloading from backend
   */
  refreshApplications(): void {
    this.searchTerm = '';
    this.currentPage = 1;
    this.jumpToPage = null;
    this.flippedCardId = null;
    this.loadApplications();
  }

  /**
   * Clear search and show all applications
   */
  clearSearch(): void {
    this.searchTerm = '';
    this.currentPage = 1;
    this.jumpToPage = null;
    this.flippedCardId = null;
    this.filteredApplications = [...this.allApplications];
    this.updatePaginationInfo();
  }

  /**
   * Get application icon or initials
   */
  getApplicationIcon(app: Application): string {
    return app.icon || app.initials || app.appName.charAt(0).toUpperCase();
  }

  /**
   * Get application gradient colors
   */
  getApplicationGradient(app: Application): string {
    if (app.gradientColors && app.gradientColors.length >= 2) {
      return `linear-gradient(135deg, ${app.gradientColors[0]}, ${app.gradientColors[1]})`;
    }
    return 'linear-gradient(135deg, #667eea, #764ba2)';
  }

  /**
   * Get paginated applications for current page
   */
  get paginatedApplications(): Application[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredApplications.slice(startIndex, endIndex);
  }

  /**
   * Get applications array (for template compatibility)
   */
  get applications(): Application[] {
    return this.paginatedApplications;
  }

  /**
   * Get pagination items for display
   */
  get paginationItems(): Array<{ type: 'page' | 'ellipsis'; value: number }> {
    const items: Array<{ type: 'page' | 'ellipsis'; value: number }> = [];
    const totalPages = this.totalPages;
    const currentPage = this.currentPage;

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        items.push({ type: 'page', value: i });
      }
    } else {
      if (currentPage <= 4) {
        for (let i = 1; i <= 5; i++) {
          items.push({ type: 'page', value: i });
        }
        items.push({ type: 'ellipsis', value: 0 });
        items.push({ type: 'page', value: totalPages });
      } else if (currentPage >= totalPages - 3) {
        items.push({ type: 'page', value: 1 });
        items.push({ type: 'ellipsis', value: 0 });
        for (let i = totalPages - 4; i <= totalPages; i++) {
          items.push({ type: 'page', value: i });
        }
      } else {
        items.push({ type: 'page', value: 1 });
        items.push({ type: 'ellipsis', value: 0 });
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          items.push({ type: 'page', value: i });
        }
        items.push({ type: 'ellipsis', value: 0 });
        items.push({ type: 'page', value: totalPages });
      }
    }
    return items;
  }

  /**
   * Change to specific page
   */
  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.flippedCardId = null;
      this.jumpToPage = null;
    }
  }

  /**
   * Go to first page
   */
  goToFirstPage(): void {
    this.changePage(1);
  }

  /**
   * Go to last page
   */
  goToLastPage(): void {
    this.changePage(this.totalPages);
  }

  /**
   * Go to previous page
   */
  goToPreviousPage(): void {
    if (this.currentPage > 1) {
      this.changePage(this.currentPage - 1);
    }
  }

  /**
   * Go to next page
   */
  goToNextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.changePage(this.currentPage + 1);
    }
  }

  /**
   * Jump to specific page from input
   */
  performPageJump(): void {
    if (
      this.jumpToPage &&
      this.jumpToPage >= 1 &&
      this.jumpToPage <= this.totalPages
    ) {
      this.changePage(this.jumpToPage);
    }
  }

  /**
   * Check if any card is flipped
   */
  isAnyCardFlipped(): boolean {
    return this.flippedCardId !== null;
  }

  /**
   * Handle card click to flip it
   */
  handleCardClick(cardId: number): void {
    if (this.flippedCardId === null) {
      this.flippedCardId = cardId;
    }
  }

  /**
   * Close flipped card
   */
  closeFlip(event: Event): void {
    event.stopPropagation();
    this.flippedCardId = null;
  }

  /**
   * Get results start index for display
   */
  get resultsStartIndex(): number {
    if (this.totalItems === 0) return 0;
    return (this.currentPage - 1) * this.itemsPerPage + 1;
  }

  /**
   * Get results end index for display
   */
  get resultsEndIndex(): number {
    return Math.min(this.currentPage * this.itemsPerPage, this.totalItems);
  }

  /**
   * Check if pagination should be shown
   */
  get shouldShowPagination(): boolean {
    return this.totalPages > 1 && !this.isLoading && !this.error;
  }

  /**
   * TrackBy function for application cards (improves performance)
   */
  trackByAppId(index: number, app: Application): number {
    return app.appId;
  }

  /**
   * TrackBy function for pagination items (improves performance)
   */
  trackByPaginationItem(
    index: number,
    item: { type: 'page' | 'ellipsis'; value: number }
  ): string {
    return `${item.type}-${item.value}-${index}`;
  }
}
