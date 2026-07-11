import { ChangeDetectionStrategy, Component } from '@angular/core';

import { FeatureIntroductionComponent } from '../../../shared/ui/feature-introduction/feature-introduction.component';

@Component({
  selector: 'app-orders-page',
  imports: [FeatureIntroductionComponent],
  template: `
    <app-feature-introduction
      eyebrow="Operations"
      title="Live Orders"
      description="Track walk-in, delivery, and online orders from one focused operational workspace."
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrdersPageComponent {}
