import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-feature-introduction',
  templateUrl: './feature-introduction.component.html',
  styleUrl: './feature-introduction.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureIntroductionComponent {
  readonly eyebrow = input.required<string>();
  readonly title = input.required<string>();
  readonly description = input.required<string>();
  readonly status = input('Foundation ready');
}
