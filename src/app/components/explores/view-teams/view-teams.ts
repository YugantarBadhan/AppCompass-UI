import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApplicationService } from '../../../services/application.service';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

@Component({
  selector: 'app-view-teams',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './view-teams.html',
  styleUrls: ['./view-teams.css'],
})
export class ViewTeamsComponent implements OnInit {
  teams: any[] = [];
  paginatedTeams: any[] = [];
  searchTerm: string = '';
  currentPage: number = 1;
  itemsPerPage: number = 6;
  isLoading: boolean = false;
  error: string = '';
  flippedCardId: number | null = null;
  jumpToPage: number = 1;
  Math = Math;

    isSearchAnimating: boolean = false; // Search animation trigger
    private searchSubject = new Subject<string>(); // Debounce subject for searchs
    

  constructor(private applicationService: ApplicationService) {}

  ngOnInit(): void {
    this.fetchTeams();
  }

  fetchTeams(): void {
    this.isLoading = true;
    this.error = '';
    this.applicationService.getAllTeams().subscribe({
      next: (res: any) => {
        this.teams = res || [];
        this.updatePagination();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching teams', err);
        this.error = 'Failed to load teams. Please try again.';
        this.isLoading = false;
      }
    });
  }

  onSearch(): void {
    this.currentPage = 1;
    this.updatePagination();
    this.triggerSearchAnimation();
  }

  onSearchInput(): void {
    this.searchSubject.next(this.searchTerm);
  }

  

  private triggerSearchAnimation(): void {
    this.isSearchAnimating = true;
    setTimeout(() => {
      this.isSearchAnimating = false;
    }, 600);
  }

  updatePagination(): void {
    const filtered = this.teams.filter(team =>
      team.teamName.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.paginatedTeams = filtered.slice(start, end);
  }

  get totalPages(): number {
    const filtered = this.teams.filter(team =>
      team.teamName.toLowerCase().includes(this.searchTerm.toLowerCase())
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
    this.fetchTeams();
  }

  getFilteredTeamsCount(): number {
    return this.teams.filter(team =>
      team.teamName.toLowerCase().includes(this.searchTerm.toLowerCase())
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