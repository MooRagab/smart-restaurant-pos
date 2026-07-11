import { ChangeDetectionStrategy, Component, input, isDevMode, output } from '@angular/core';

import { formatDate } from '../../../../shared/utilities/formatters';
import {
  AiRecommendationState,
  AiRecommendationType,
  AiSimulationOutcome,
} from '../../domain/ai-recommendation.model';

@Component({
  selector: 'app-ai-assistant-panel',
  templateUrl: './ai-assistant-panel.component.html',
  styleUrl: './ai-assistant-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiAssistantPanelComponent {
  readonly state = input.required<AiRecommendationState>();
  readonly simulationOutcome = input.required<AiSimulationOutcome>();
  readonly slowStreaming = input.required<boolean>();
  readonly generateRequested = output<void>();
  readonly retryRequested = output<void>();
  readonly cancelRequested = output<void>();
  readonly resetRequested = output<void>();
  readonly simulationOutcomeChanged = output<AiSimulationOutcome>();
  readonly slowStreamingChanged = output<boolean>();

  protected readonly date = formatDate;
  protected readonly developmentMode = isDevMode();

  protected typeLabel(type: AiRecommendationType): string {
    const labels: Readonly<Record<AiRecommendationType, string>> = {
      upselling: 'Upselling suggestion',
      'allergy-warning': 'Allergy warning',
      'missing-information': 'Missing information',
      'delivery-risk': 'Delivery risk',
      'kitchen-overload': 'Kitchen overload',
    };
    return labels[type];
  }

  protected onOutcomeChange(event: Event): void {
    this.simulationOutcomeChanged.emit(
      (event.target as HTMLSelectElement).value as AiSimulationOutcome,
    );
  }

  protected onSlowChange(event: Event): void {
    this.slowStreamingChanged.emit((event.target as HTMLInputElement).checked);
  }
}
