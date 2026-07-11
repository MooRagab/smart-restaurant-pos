import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  input,
  inject,
  output,
  viewChild,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';

import { trapTabKey } from '../../utilities/focus-management';
import { IdGenerator } from '../../utilities/id-generator';

@Component({
  selector: 'app-confirmation-dialog',
  templateUrl: './confirmation-dialog.component.html',
  styleUrl: './confirmation-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmationDialogComponent implements OnDestroy {
  private static readonly idGenerator = new IdGenerator();
  private readonly document = inject(DOCUMENT);
  private readonly dialog = viewChild.required<ElementRef<HTMLElement>>('dialog');
  private readonly cancelButton = viewChild.required<ElementRef<HTMLButtonElement>>('cancelButton');
  private readonly restoreFocus =
    this.document.activeElement instanceof HTMLElement ? this.document.activeElement : null;

  protected readonly titleId = ConfirmationDialogComponent.idGenerator.next('confirmation-title');
  protected readonly messageId =
    ConfirmationDialogComponent.idGenerator.next('confirmation-message');

  readonly title = input.required<string>();
  readonly message = input.required<string>();
  readonly confirmLabel = input('Confirm');
  readonly dangerous = input(false);
  readonly confirmed = output<void>();
  readonly cancelled = output<void>();

  constructor() {
    afterNextRender(() => this.cancelButton().nativeElement.focus());
  }

  ngOnDestroy(): void {
    this.restoreFocus?.focus();
  }

  protected handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.cancelled.emit();
      return;
    }
    trapTabKey(event, this.dialog().nativeElement);
  }
}
