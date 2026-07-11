import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-recent-searches',
  templateUrl: './recent-searches.component.html',
  styleUrl: './recent-searches.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecentSearchesComponent {
  readonly searches = input.required<readonly string[]>();
  readonly selected = output<string>();
  readonly cleared = output<void>();
}
