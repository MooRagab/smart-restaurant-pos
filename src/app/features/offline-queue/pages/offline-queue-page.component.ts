import { ChangeDetectionStrategy, Component } from '@angular/core';

import { FeatureIntroductionComponent } from '../../../shared/ui/feature-introduction/feature-introduction.component';

@Component({
  selector: 'app-offline-queue-page',
  imports: [FeatureIntroductionComponent],
  template: `
    <app-feature-introduction
      eyebrow="Synchronization"
      title="Offline Queue"
      description="Inspect operations waiting to synchronize and recover safely when connectivity returns."
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OfflineQueuePageComponent {}
