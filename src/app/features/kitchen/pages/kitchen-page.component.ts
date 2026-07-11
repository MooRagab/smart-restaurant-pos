import { ChangeDetectionStrategy, Component } from '@angular/core';

import { FeatureIntroductionComponent } from '../../../shared/ui/feature-introduction/feature-introduction.component';

@Component({
  selector: 'app-kitchen-page',
  imports: [FeatureIntroductionComponent],
  template: `
    <app-feature-introduction
      eyebrow="Kitchen"
      title="Kitchen Monitor"
      description="See live workload, station availability, delays, and preparation pressure at a glance."
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KitchenPageComponent {}
