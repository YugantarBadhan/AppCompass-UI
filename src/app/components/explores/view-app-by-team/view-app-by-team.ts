import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ApplicationService,
  Application,
} from '../../../services/application.service';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

@Component({
  selector: 'app-view-app-by-team',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './view-app-by-team.html',
  styleUrl: './view-app-by-team.css',
})
export class ViewAppByTeam implements OnInit, OnDestroy {
  applications: Application[] = [];
  searchTerm: string = '';
  isLoading: boolean = true;
  isSearching: boolean = false;
  error: string | null = null;
  Math = Math;

  isSearchAnimating: boolean = false;
  private searchSubject = new Subject<string>();

  currentPage: number = 1;
  itemsPerPage: number = 6;
  totalItems: number = 0;
  totalPages: number = 0;
  jumpToPage: number | null = null;

  flippedCardId: number | null = null;
  private supportsPagination: boolean = false;

  constructor(private applicationService: ApplicationService) {}

  ngOnInit(): void {
    this.setupSearchDebounce();
    this.loadAllApplications(); // default load
  }

  ngOnDestroy(): void {
    this.searchSubject.complete();
  }

  private setupSearchDebounce(): void {
    this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((searchTerm) => {
        this.performBackendSearch(searchTerm);
      });
  }

  private loadAllApplications(): void {
    this.isLoading = true;
    this.isSearching = false;
    this.error = null;

    this.applicationService.getAllApplications().subscribe({
      next: (applications) => {
        this.applications = applications || [];
        this.totalItems = this.applications.length;
        this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
        this.currentPage = 1;
        this.isLoading = false;
      },
      error: (error) => {
        this.handleError(error);
      },
    });
  }

  private loadApplicationsByTeam(teamName: string): void {
    this.isLoading = true;
    this.isSearching = true;
    this.error = null;

    this.applicationService.getAllAppByTeam(teamName.trim()).subscribe({
      next: (applications) => {
        this.applications = applications || [];
        this.totalItems = this.applications.length;
        this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
        this.currentPage = 1;
        this.isLoading = false;
        this.isSearching = false;
      },
      error: (error) => {
        this.handleError(error);
      },
    });
  }

  private handleError(error: any): void {
    this.error = error.error?.message || 'Failed to load applications';
    this.applications = [];
    this.totalItems = 0;
    this.totalPages = 0;
    this.isLoading = false;
    this.isSearching = false;
    console.error('Component: Error loading applications', error);
  }

  onSearchInput(): void {
    this.searchSubject.next(this.searchTerm);
  }

  onSearch(): void {
    this.triggerSearchAnimation();
    this.performBackendSearch(this.searchTerm);
  }

  private triggerSearchAnimation(): void {
    this.isSearchAnimating = true;
    setTimeout(() => {
      this.isSearchAnimating = false;
    }, 600);
  }

  private performBackendSearch(searchTerm: string): void {
    this.currentPage = 1;
    this.jumpToPage = null;
    this.flippedCardId = null;

    if (searchTerm.trim()) {
      this.loadApplicationsByTeam(searchTerm.trim());
    } else {
      this.loadAllApplications();
    }
  }

  refreshApplications(): void {
    this.searchTerm = '';
    this.currentPage = 1;
    this.jumpToPage = null;
    this.flippedCardId = null;
    this.loadAllApplications();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.currentPage = 1;
    this.jumpToPage = null;
    this.flippedCardId = null;
    this.loadAllApplications();
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

  get paginatedApplications(): Application[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.applications.slice(startIndex, endIndex);
  }

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

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.flippedCardId = null;
      this.jumpToPage = null;
      this.currentPage = page;
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

  isAnyCardFlipped(): boolean {
    return this.flippedCardId !== null;
  }

  handleCardClick(cardId: number): void {
    if (this.flippedCardId === null) {
      this.flippedCardId = cardId;
    }
  }

  closeFlip(event: Event): void {
    event.stopPropagation();
    this.flippedCardId = null;
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
}
