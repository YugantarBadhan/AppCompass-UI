import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ViewTeamsComponent } from './view-teams/view-teams';
import { ViewAppSpocsComponent } from './view-app-spocs/view-app-spocs';
import { ViewAppByTeam } from './view-app-by-team/view-app-by-team';
import { ViewAppByAppspocs } from './view-app-by-appspocs/view-app-by-appspocs';

@Component({
  selector: 'app-explores',
  standalone: true,
  imports: [CommonModule, ViewTeamsComponent, ViewAppSpocsComponent, ViewAppByTeam, ViewAppByAppspocs],
  templateUrl: './explores.html',
  styleUrls: ['./explores.css'],
})
export class ExploresComponent {
  selectedTab: string = 'teams';

  switchTab(tab: string) {
    this.selectedTab = tab;
  }
}
