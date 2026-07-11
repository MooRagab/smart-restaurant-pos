import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { createHighlightSegments } from '../../domain/product-search';

@Component({
  selector: 'app-highlight-text',
  template: `
    @for (segment of segments(); track $index) {
      @if (segment.matched) {
        <mark>{{ segment.text }}</mark>
      } @else {
        <span>{{ segment.text }}</span>
      }
    }
  `,
  styles: `
    :host {
      display: inline;
    }
    mark {
      color: inherit;
      background: #fff0b8;
      border-radius: 0.15rem;
      font-weight: 800;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HighlightTextComponent {
  readonly text = input.required<string>();
  readonly query = input.required<string>();
  protected readonly segments = computed(() => createHighlightSegments(this.text(), this.query()));
}
