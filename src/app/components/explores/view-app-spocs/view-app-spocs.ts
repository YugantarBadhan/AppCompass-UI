import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApplicationService } from '../../../services/application.service';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

@Component({
  selector: 'app-view-app-spocs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './view-app-spocs.html',
  styleUrls: ['./view-app-spocs.css'],
})
export class ViewAppSpocsComponent implements OnInit {
  appspocs: any[] = [];
  paginatedAppSpocs: any[] = [];
  searchTerm: string = '';
  currentPage: number = 1;
  itemsPerPage: number = 6;
  isLoading: boolean = false;
  error: string = '';
  flippedCardId: number | null = null;
  jumpToPage: number = 1;
  Math = Math;

  isSearchAnimating: boolean = false; // Search animation trigger
  private searchSubject = new Subject<string>(); // Debounce subject for search

  constructor(private applicationService: ApplicationService) { }

  ngOnInit(): void {
    this.fetchAppSpocs();
    this.setupSearchDebounce();
  }

  private setupSearchDebounce(): void {
    this.searchSubject
      .pipe(
        debounceTime(300), // Wait 300ms after user stops typing
        distinctUntilChanged() // Only trigger if search term actually changed
      )
      .subscribe((searchTerm: string) => {
        this.searchTerm = searchTerm;
        this.performSearch();
      });
  }

  fetchAppSpocs(): void {
    this.isLoading = true;
    this.error = '';
    this.applicationService.getAllAppSpocs().subscribe({
      next: (res: any) => {
        this.appspocs = res || [];
        this.updatePagination();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching application spocs', err);
        this.error = 'Failed to load application spocs. Please try again.';
        this.isLoading = false;
      },
    });
  }

  onSearch(): void {
    this.performSearch();
  }

  onSearchInput(): void {
    // Emit search term to debounced subject
    this.searchSubject.next(this.searchTerm);
  }

  private performSearch(): void {
    this.currentPage = 1;
    this.updatePagination();
    this.triggerSearchAnimation();
  }

  private triggerSearchAnimation(): void {
    this.isSearchAnimating = true;
    setTimeout(() => {
      this.isSearchAnimating = false;
    }, 600);
  }

  updatePagination(): void {
    const filtered = this.appspocs.filter((appspoc) =>
      appspoc.spocName.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.paginatedAppSpocs = filtered.slice(start, end);
  }

  get totalPages(): number {
    const filtered = this.appspocs.filter((appspoc) =>
      appspoc.spocName.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
    return Math.ceil(filtered.length / this.itemsPerPage);
  }

  changePage(page: number): void {
    this.currentPage = page;
    this.updatePagination();
  }

  flipCard(id: number): void {
    this.flippedCardId = this.flippedCardId === id ? null : id;
  }

  refresh(): void {
    this.searchTerm = '';
    this.currentPage = 1;
    this.updatePagination(); // Update pagination after clearing search
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.currentPage = 1;
    this.updatePagination();
  }

  getFilteredAppSpocsCount(): number {
    return this.appspocs.filter((appspoc) =>
      appspoc.spocName.toLowerCase().includes(this.searchTerm.toLowerCase())
    ).length;
  }

  getVisiblePages(): (number | string)[] {
    const totalPages = this.totalPages;
    const current = this.currentPage;
    const pages: (number | string)[] = [];

    if (totalPages <= 7) {
      // Show all pages if 7 or fewer
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (current > 4) {
        pages.push('...');
      }

      // Show pages around current page
      const start = Math.max(2, current - 1);
      const end = Math.min(totalPages - 1, current + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (current < totalPages - 3) {
        pages.push('...');
      }

      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }

    return pages;
  }

  jumpToPageAction(): void {
    if (this.jumpToPage >= 1 && this.jumpToPage <= this.totalPages) {
      this.changePage(this.jumpToPage);
    }
  }
}