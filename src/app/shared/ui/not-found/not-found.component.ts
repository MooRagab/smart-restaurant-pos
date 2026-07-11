import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  template: `
    <main class="not-found">
      <span>404</span>
      <h1>Workspace not found</h1>
      <p>The page you requested is not part of this Sahm Food workspace.</p>
      <a routerLink="/orders">Return to Live Orders</a>
    </main>
  `,
  styles: `
    :host {
      display: grid;
      min-height: 100vh;
      place-items: center;
      padding: 1.5rem;
      background: var(--color-canvas);
    }
    .not-found {
      max-width: 32rem;
      text-align: center;
    }
    span {
      color: var(--color-brand);
      font-size: 0.75rem;
      font-weight: 800;
      letter-spacing: 0.12em;
    }
    h1 {
      margin: 0.5rem 0;
      color: var(--color-ink);
      font-size: 2rem;
    }
    p {
      margin: 0 0 1.5rem;
      color: var(--color-ink-muted);
    }
    a {
      display: inline-flex;
      padding: 0.75rem 1rem;
      color: #fff;
      background: var(--color-brand);
      border-radius: 0.6rem;
      font-weight: 700;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFoundComponent {}
