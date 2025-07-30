import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ApplicationService,
  Application,
  ApplicationDetails,
} from '../../services/application.service';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

@Component({
  selector: 'app-selections',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './selections.html',
  styleUrls: ['./selections.css'],
})
export class SelectionsComponent implements OnInit, OnDestroy {
  applications: Application[] = []; // Filtered + paginated favorites
  allApplications: Application[] = []; // All favorite apps fetched
  searchTerm: string = '';
  isLoading: boolean = true;
  isSearching: boolean = false;
  error: string | null = null;
  Math = Math;

  showPopup: boolean = false;
  selectedApplication: Application | null = null;
  selectedApplicationDetails: ApplicationDetails | null = null;
  isLoadingDetails: boolean = false;

  // Spoc contact state
  showSpocPopup: boolean = false;
  spocPopupMessage: string = '';

  // Application URL state
  showUrlPopup: boolean = false;
  urlPopupMessage: string = '';

  currentPage: number = 1;
  itemsPerPage: number = 6;
  totalItems: number = 0;
  totalPages: number = 0;
  jumpToPage: number | null = null;

  isSearchAnimating: boolean = false;
  private searchSubject = new Subject<string>();

  constructor(private applicationService: ApplicationService) {}

  ngOnInit(): void {
    this.setupSearchDebounce();
    this.loadFavoriteApplications();
  }

  ngOnDestroy(): void {
    this.searchSubject.complete();
  }

  loadFavoriteApplications(): void {
    this.isLoading = true;
    this.error = null;

    this.applicationService.getAllApplications().subscribe({
      next: (apps) => {
        const favoriteApps = apps.filter((app) => app.favorite === true);
        this.allApplications = favoriteApps;
        this.applyFilters();
      },
      error: (error) => {
        console.error('❌ Failed to load applications:', error);
        this.error = error.error?.message || 'Failed to load applications';
        this.applications = [];
        this.allApplications = [];
        this.totalItems = 0;
        this.totalPages = 0;
        this.isLoading = false;
      },
    });
  }

  applyFilters(): void {
    const filtered = this.searchTerm.trim()
      ? this.allApplications.filter(
          (app) =>
            app.appName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
            app.appDescription
              .toLowerCase()
              .includes(this.searchTerm.toLowerCase())
        )
      : this.allApplications;

    this.totalItems = filtered.length;
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);

    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.applications = filtered.slice(start, end);
    this.isLoading = false;
    this.isSearching = false;
  }

  onSearchInput(): void {
    this.searchSubject.next(this.searchTerm);
  }

  onSearch(): void {
    this.triggerSearchAnimation();
    this.currentPage = 1;
    this.applyFilters();
  }

  private setupSearchDebounce(): void {
    this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => {
        this.currentPage = 1;
        this.applyFilters();
      });
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.currentPage = 1;
    this.applyFilters();
  }

  refreshApplications(): void {
    this.searchTerm = '';
    this.currentPage = 1;
    this.loadFavoriteApplications();
  }

  triggerSearchAnimation(): void {
    this.isSearchAnimating = true;
    setTimeout(() => (this.isSearchAnimating = false), 600);
  }

  toggleFavorite(event: Event, app: Application): void {
    event.stopPropagation();
    app.favorite = false;

    this.applicationService.removeFromFavorites(app.appId).subscribe({
      next: () => {
        this.allApplications = this.allApplications.filter(
          (a) => a.appId !== app.appId
        );
        this.applyFilters();

        if (this.currentPage > this.totalPages && this.totalPages > 0) {
          this.currentPage = this.totalPages;
          this.applyFilters();
        }
      },
      error: (error) => {
        console.error('Failed to unfavorite:', error);
        app.favorite = true;
      },
    });
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

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.applyFilters();
    }
  }

  goToFirstPage(): void {
    this.changePage(1);
  }

  goToLastPage(): void {
    this.changePage(this.totalPages);
  }

  goToPreviousPage(): void {
    if (this.currentPage > 1) {
      this.changePage(this.currentPage - 1);
    }
  }

  goToNextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.changePage(this.currentPage + 1);
    }
  }

  performPageJump(): void {
    if (
      this.jumpToPage &&
      this.jumpToPage >= 1 &&
      this.jumpToPage <= this.totalPages
    ) {
      this.changePage(this.jumpToPage);
    }
  }

  get paginationItems(): Array<{ type: 'page' | 'ellipsis'; value: number }> {
    const items: Array<{ type: 'page' | 'ellipsis'; value: number }> = [];
    const totalPages = this.totalPages;
    const currentPage = this.currentPage;

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++)
        items.push({ type: 'page', value: i });
    } else {
      if (currentPage <= 4) {
        for (let i = 1; i <= 5; i++) items.push({ type: 'page', value: i });
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

  get resultsStartIndex(): number {
    return (this.currentPage - 1) * this.itemsPerPage + 1;
  }

  get resultsEndIndex(): number {
    return Math.min(this.currentPage * this.itemsPerPage, this.totalItems);
  }

  get shouldShowPagination(): boolean {
    return this.totalPages > 1 && !this.isLoading && !this.error;
  }

  openApplicationDetails(app: Application): void {
    this.selectedApplication = app;
    this.showPopup = true;
    this.isLoadingDetails = true;
    this.selectedApplicationDetails = null;

    this.applicationService.getApplicationDetailsByName(app.appName).subscribe({
      next: (details) => {
        this.selectedApplicationDetails = details;
        this.isLoadingDetails = false;
      },
      error: (err) => {
        console.error('Error loading details', err);
        this.isLoadingDetails = false;
      },
    });
  }

  closePopup(): void {
    this.selectedApplication = null;
    this.selectedApplicationDetails = null;
    this.showPopup = false;
    this.isLoadingDetails = false;
  }

  getApplicationIcon(app: Application): string {
    return app.icon || app.initials || app.appName.charAt(0).toUpperCase();
  }

  getApplicationGradient(app: Application): string {
    if (app.gradientColors && app.gradientColors.length >= 2) {
      return `linear-gradient(135deg, ${app.gradientColors.join(', ')})`;
    }
    return 'linear-gradient(135deg, #667eea, #764ba2)';
  }

  getTruncatedDescription(description: string): string {
    if (!description) return 'No description available';
    const maxLength = 97;
    return description.length > maxLength
      ? description.substring(0, maxLength) + '...'
      : description;
  }
}
