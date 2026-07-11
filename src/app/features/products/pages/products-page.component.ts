import { ChangeDetectionStrategy, Component } from '@angular/core';

import { FeatureIntroductionComponent } from '../../../shared/ui/feature-introduction/feature-introduction.component';

@Component({
  selector: 'app-products-page',
  imports: [FeatureIntroductionComponent],
  template: `
    <app-feature-introduction
      eyebrow="Catalog"
      title="Product Search"
      description="Find menu items quickly with a keyboard-first search experience built for busy service."
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsPageComponent {}
