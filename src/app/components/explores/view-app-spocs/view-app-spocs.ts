import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApplicationService, AppSpoc } from '../../../services/application.service';

@Component({
  selector: 'app-view-app-spocs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './view-app-spocs.html',
  styleUrls: ['./view-app-spocs.css']
})
export class ViewAppSpocsComponent implements OnInit {
  spocs: AppSpoc[] = [];
  filteredSpocs: AppSpoc[] = [];
  searchTerm: string = '';
  currentPage: number = 1;
  itemsPerPage: number = 6;
  totalPages: number = 0;
  isLoading: boolean = true;
  error: string | null = null;
  flippedCardId: number | null = null;

  constructor(private applicationService: ApplicationService) {}

  ngOnInit(): void {
    this.loadSpocs();
  }

  loadSpocs(): void {
    this.isLoading = true;
    this.applicationService.getAllAppSpocs().subscribe({
      next: (spocs) => {
        this.spocs = spocs || [];
        this.filteredSpocs = [...this.spocs];
        this.totalPages = Math.ceil(this.filteredSpocs.length / this.itemsPerPage);
        this.isLoading = false;
      },
      error: (error) => {
        this.error = error.error?.message || 'Failed to load SPOCs';
        this.isLoading = false;
      },
    });
  }

  onSearch(): void {
    const term = this.searchTerm.toLowerCase().trim();
    this.filteredSpocs = this.spocs.filter(spoc =>
      spoc.spocName.toLowerCase().includes(term) ||
      spoc.spocDesignation.toLowerCase().includes(term) ||
      spoc.email.toLowerCase().includes(term) ||
      spoc.teamName.toLowerCase().includes(term)
    );
    this.currentPage = 1;
    this.totalPages = Math.ceil(this.filteredSpocs.length / this.itemsPerPage);
  }

  refresh(): void {
    this.searchTerm = '';
    this.currentPage = 1;
    this.flippedCardId = null;
    this.loadSpocs();
  }

  get paginatedSpocs(): AppSpoc[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredSpocs.slice(start, start + this.itemsPerPage);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.flippedCardId = null;
    }
  }

  flipCard(id: number): void {
    this.flippedCardId = this.flippedCardId === id ? null : id;
  }
}