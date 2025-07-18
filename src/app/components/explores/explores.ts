import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ViewTeamsComponent } from './view-teams/view-teams';
import { ViewAppSpocsComponent } from './view-app-spocs/view-app-spocs';

@Component({
  selector: 'app-explores',
  standalone: true,
  imports: [CommonModule, ViewTeamsComponent, ViewAppSpocsComponent],
  templateUrl: './explores.html',
  styleUrls: ['./explores.css'],
})
export class ExploresComponent {
  selectedTab: string = 'teams';

  switchTab(tab: string) {
    this.selectedTab = tab;
  }
}
