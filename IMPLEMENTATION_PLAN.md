# Sahm Food Smart Order Workspace — Implementation Plan

## 1. Current Repository Assessment

### Repository contents

The repository currently contains only:

- `AGENTS.md`: engineering and workflow constraints.
- `SMART_POS_SPEC.md`: the complete product and architecture specification.
- `IMPLEMENTATION_PLAN.md`: this assessment and implementation plan.

There is no existing Angular application or other source code to preserve or adapt. The directory is not currently a Git working tree.

### Tooling and application status

| Area                     | Actual repository state                                                                                                                                                                       |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Angular version          | No Angular packages, CLI configuration, or workspace exists.                                                                                                                                  |
| Node.js requirement      | No `engines`, version file, or package manifest defines one. The inspection environment has Node.js `v25.7.0`, but this is not a project requirement and should not be adopted automatically. |
| Package manager          | No lockfile or package-manager declaration exists. The inspection environment has npm `11.10.1`; npm is the least-assumptive choice for initialization.                                       |
| Package manifest         | No `package.json`.                                                                                                                                                                            |
| Angular configuration    | No `angular.json`.                                                                                                                                                                            |
| TypeScript configuration | No `tsconfig.json` or derived application/test configurations.                                                                                                                                |
| Source/folder structure  | No `src` directory, components, services, models, assets, or environments.                                                                                                                    |
| Routing                  | Not configured.                                                                                                                                                                               |
| Styling                  | No global stylesheet, theme, CSS framework, or design tokens. The specification requires SCSS.                                                                                                |
| State management         | None.                                                                                                                                                                                         |
| Linting/formatting       | No ESLint, Prettier, or editor configuration.                                                                                                                                                 |
| Testing                  | No test runner, test configuration, or tests.                                                                                                                                                 |
| Dependencies             | None installed or declared.                                                                                                                                                                   |
| Build/CI                 | No scripts, build targets, or CI workflows.                                                                                                                                                   |

Because the workspace is empty, implementation should begin by generating a modern standalone Angular application at the repository root. The exact Angular version must be selected at that time from a stable version whose documented Node.js support includes the chosen Node LTS. The current machine Node `v25.7.0` should be replaced or managed with a supported LTS version if the selected Angular release does not support it. The generated versions must then be pinned by `package-lock.json`, `packageManager`, and `engines`.

## 2. Proposed Application Architecture

Use a standalone, feature-based Angular architecture with lazy-loaded route entry points and explicit dependency direction:

```text
pages -> feature state/facades -> data access -> core infrastructure
  |              |
  v              v
feature UI     domain models and pure policies
```

- **Domain** contains immutable models, status-transition rules, pure calculations, and no Angular UI dependencies.
- **Data access** owns mock repositories, event streams, persistence adapters, and simulated server behavior.
- **State/facades** coordinate use cases and expose readonly signals/view models. Writable signals remain private.
- **Pages** connect route state and facades and compose presentation components.
- **UI components** use `OnPush`, typed inputs/outputs, stable tracking, and contain rendering behavior only.
- **Core** contains app-wide infrastructure with narrow responsibilities: connectivity, persistence, notifications, errors/logging, live-event orchestration, and shell layout.
- **Shared** contains genuinely reusable presentational primitives, formatting, directives, and pure utilities. It must not become a miscellaneous domain layer.

Cross-feature effects should be coordinated by typed events and an application-level simulation coordinator, not by one feature reaching into another feature's components or writable state. Domain models should have a single owning feature; shared event contracts should live at the narrowest common boundary.

## 3. Proposed Folder Structure

```text
src/
  app/
    app.component.ts
    app.config.ts
    app.routes.ts
    core/
      connectivity/
        connectivity.model.ts
        connectivity.service.ts
      error-handling/
        app-error.model.ts
        error-mapper.ts
        logger.service.ts
      layout/
        shell.component.*
        header/
        side-navigation/
        simulation-panel/
      live-events/
        live-event.model.ts
        simulation-coordinator.service.ts
      notifications/
        notification.model.ts
        notification.service.ts
        toast-container.component.*
      persistence/
        persistence.port.ts
        local-storage-persistence.service.ts
    shared/
      ui/
        badge/
        empty-state/
        error-state/
        loading-skeleton/
        metric-card/
        search-input/
        confirmation-dialog/
      directives/
      pipes/
      utilities/
        formatters/
        identifiers/
    features/
      orders/
        domain/
          order.model.ts
          order-transition.policy.ts
          order-priority.policy.ts
        data-access/
          orders.repository.ts
          mock-orders.repository.ts
          order-live-events.service.ts
          order-mock.generator.ts
        state/
          orders.store.ts
          orders.selectors.ts
          orders.facade.ts
        ui/
          order-list/
          order-card/
          order-filters/
          order-summary/
          order-detail/
        pages/
          orders-page.component.*
        orders.routes.ts
      ai-assistant/
        domain/
        data-access/
        state/
        ui/
      kitchen/
        domain/
        data-access/
        state/
        ui/
        pages/
        kitchen.routes.ts
      products/
        domain/
        data-access/
        state/
        ui/
        pages/
        products.routes.ts
      offline-queue/
        domain/
        data-access/
        state/
        ui/
        pages/
        offline-queue.routes.ts
  assets/
  styles/
    _tokens.scss
    _mixins.scss
    _reset.scss
    styles.scss
```

Tests should be colocated as `*.spec.ts` next to the units they verify. Files should remain small and focused; folders should only be created when their first real implementation is added.

## 4. State-Management Strategy

Use Angular Signals plus focused injectable feature stores/facades. Do not add NgRx or another global state library initially: the required workflows can be expressed cleanly with Angular's built-in primitives and RxJS, avoiding a large dependency and abstraction cost.

Each feature store will:

- Keep normalized entity state where update frequency matters, such as `ReadonlyMap<OrderId, Order>` plus a stable ordered ID list.
- Keep query/filter/sort/selection state separately from entities.
- Expose readonly signals and computed view models.
- Apply immutable, event-specific updates so one live event does not rebuild unrelated state.
- Track command-in-flight/idempotency state to suppress duplicate submissions.
- Represent async workflows with discriminated unions rather than parallel booleans.
- Delegate business rules to domain policies and I/O to repositories.

Global state is limited to connectivity, notifications, navigation shell state, and persisted offline-operation summary. Orders, kitchen, products, and AI state remain feature-scoped. Facades coordinate workflows such as optimistic order transitions and rollback without exposing writable store internals.

## 5. Signals and RxJS Responsibilities

### Signals

Use signals for synchronous application state and derived UI state:

- Selected order and active filters.
- Normalized entities and stable entity ordering.
- Computed counters, filtered IDs, badges, availability, and view models.
- Connectivity snapshot and queue counts.
- Shell navigation state.
- Async-state snapshots consumed by templates.

Computed signals must remain pure. Expensive product filtering should run once per input change in a state layer, not repeatedly in templates.

### RxJS

Use RxJS where time, cancellation, concurrency, or external event streams are intrinsic:

- Simulated WebSocket/live kitchen/order events.
- Debounced product queries.
- AI chunk streaming and cancellation.
- Simulated network latency, transient/permanent failures, and bounded retries.
- Sequential offline queue draining.
- Connectivity/reconnection event flow.

Convert between observables and signals only at stable state boundaries. Prefer `switchMap` for replaceable requests such as AI generation and search, `concatMap` for ordered queue processing, and explicit concurrency rules for live commands. Use `takeUntilDestroyed`, framework interop, or template consumption for teardown; avoid nested subscriptions.

## 6. Live-Event Simulation Design

Create deterministic seeded generators for at least 50 initial orders and all subsequent simulated events. A typed live-event service will expose events such as:

- `order.created`
- `order.statusChanged`
- `order.priorityChanged`
- `order.delayChanged`
- `order.paymentChanged`
- `kitchen.loadChanged`
- `kitchen.stationChanged`
- `stream.error` / `stream.reconnected`

The simulator will use configurable RxJS timers with jitter and emit immutable typed payloads. It will support start/stop/reset and explicit development controls. A coordinator translates kitchen events into domain decisions (delay, ETA, priority, AI staleness) by calling pure policies, then dispatches resulting typed actions to the relevant feature stores. Simulators never reference components.

Seeded data and an injectable clock/random source make tests reproducible. Event rates should be modest, events batched where appropriate, and rendering keyed by stable IDs so the UI remains responsive.

## 7. AI Streaming Simulation Design

Model AI state as a discriminated union covering `idle`, `loading`, `streaming`, `success`, `empty`, `error`, and `cancelled`. Recommendations include kind, severity, content, generation time, source order revision, and kitchen-load revision so stale output can be detected.

An AI repository will create a deterministic scenario from the selected order and simulation flags, then return an observable that:

1. Waits through a loading delay.
2. Emits small text chunks at variable intervals.
3. Completes as success or empty, or emits a typed failure.
4. Stops immediately on unsubscribe/cancellation.

The facade uses `switchMap` so changing the selected order cancels the previous stream. Explicit cancel, retry, and forced-failure commands flow through the facade. The UI receives the state and emits typed actions only. Kitchen revision changes mark relevant successful recommendations stale; regeneration remains an explicit, observable action.

## 8. Offline Queue and Persistence Design

Start with a typed persistence port backed by `localStorage`. This satisfies refresh persistence without an added dependency and keeps an IndexedDB adapter possible if payload size or atomicity later warrants it. All reads/writes will validate schema/version and map storage failures to application errors.

Each queued operation contains:

- `id`
- `idempotencyKey`
- `type`
- `entityId`
- typed payload
- `createdAt`
- `retryCount`
- state: `pending | processing | completed | failed`
- `lastError`
- optimistic-state reconciliation metadata

Queue behavior:

- Persist after each state transition using serialized immutable snapshots.
- Dedupe active operations by idempotency key and suppress repeated UI commands while an equivalent command is in flight.
- When online, process FIFO with `concatMap` so order is preserved.
- Retry only classified transient failures, using bounded exponential backoff with jitter.
- Stop at a fixed retry limit and surface permanent failures.
- On startup, restore and validate the queue; recover interrupted `processing` items to `pending`.
- On success, reconcile/remove completed operations according to a short audit-retention policy.
- On permanent failure or removal, invoke the stored reconciliation command to roll optimistic order state back safely, provided a newer confirmed revision has not superseded it.
- Provide manual retry/removal from the queue page.

Connectivity simulation exposes online, offline, and unstable modes. Unstable mode deterministically injects latency and transient failures. The persistence abstraction and queue processor are independent of UI and mock transport.

## 9. Main Domain Models

- **Order**: ID/number, channel, optional customer, readonly items, totals in minor currency units, timestamps, status, priority, delay/ETA, payment, AI state reference, synchronization state, and revision.
- **OrderItem**: product ID/name, quantity, unit price, modifiers, dietary/allergy metadata, and station assignment.
- **OrderStatus**: received, preparing, ready, delivered, completed, cancelled.
- **OrderChannel**: walk-in, delivery, online.
- **OrderPriority**: normal, high, urgent, with a reason/source.
- **PaymentState**: pending, authorized, paid, failed, refunded as required by mock scenarios.
- **KitchenLoad**: percentage, status, active/delayed counts, average preparation duration, timestamp, history, and revision.
- **KitchenStation**: ID/name, capacity, active work, load percentage, availability, and status.
- **AIRecommendation**: ID, order/revision, recommendation kind, severity, content, generated timestamp, kitchen revision, and stale state.
- **Product**: ID, name, category, price in EGP minor units, availability, preparation duration, dietary tags, allergens, popularity, and icon key.
- **QueuedOperation**: generic discriminated operation union with common queue metadata and operation-specific typed payload.
- **ConnectivityState**: mode, effective online status, transition timestamp, and optional instability information.
- **AppError**: stable error code, user-safe message, retry classification, and internal cause available only to the logger.
- **AsyncState<T>**: discriminated union appropriate to each workflow, with streaming fields only where meaningful.

Branded/string ID aliases and readonly properties will reduce accidental model mixing. Monetary values should use integer piastres and a centralized EGP formatter; durations and timestamps should use centralized formatting utilities and an injectable clock.

## 10. Feature Implementation Order

1. **Workspace foundation**: initialize Angular with standalone routing, strict TypeScript, SCSS, npm lockfile, supported Node declarations, ESLint, Prettier, and test/build scripts.
2. **Cross-cutting primitives**: error model/logger, clock/random abstractions, design tokens, reusable status UI, notifications, and deterministic fixture utilities.
3. **Application shell and routes**: responsive shell, lazy routes, branch/user display, accessibility baseline, not-found page, and simulation-panel boundary.
4. **Orders domain and data**: models, transition/priority policies, seeded repository, normalized store, filters/selectors, loading/error/empty states, details, and live event updates.
5. **Optimistic commands and connectivity**: command lifecycle, duplicate prevention, online simulated transport, rollback, and connection controls.
6. **Offline queue**: versioned persistence, restoration, FIFO processor, retry/error reconciliation, indicators, and queue page.
7. **Kitchen monitor**: station/load simulation, history, metrics, and policy-driven effects on orders.
8. **AI assistant**: streaming repository, facade state machine, selection cancellation, failures/retries, staleness, and recommendation UI.
9. **Product search**: 500+ deterministic products, debounce/filter pipeline, recent-search persistence, safe highlighting, keyboard interaction, and result rendering optimization.
10. **Integration and hardening**: cross-feature event scenarios, responsive/tablet polish, reduced motion, recovery paths, performance profiling, documentation, and full validation.

Each increment should end with relevant unit tests plus type-check, lint, and production-build checks rather than deferring verification to the end.

## 11. Testing Strategy

Use the test stack generated/configured for the selected Angular version rather than introducing a second runner. Prefer pure unit tests for domain and state behavior, focused component tests for keyboard/accessibility interactions, and a small number of route-level integration tests.

Required high-value coverage:

1. Status transition matrix, including channel-specific transitions and invalid commands.
2. Order filtering/sorting/counters and stable immutable updates.
3. Debounced product search using virtual time/fake timers.
4. Arrow, Enter, and Escape result navigation with focus/ARIA assertions.
5. AI loading-to-streaming-to-terminal transitions, cancellation, retry, and stale-result protection.
6. Queue idempotency-key deduplication and repeated-click suppression.
7. Transient retry backoff and terminal retry-limit behavior.
8. Queue persistence restoration, malformed/versioned data handling, and interrupted-operation recovery.
9. Kitchen-load policy effects on ETA, delay, priority, and AI freshness.
10. Optimistic confirmation and rollback, including prevention of stale rollback over a newer revision.

Also test connectivity-mode transitions, formatter correctness, and representative loading/empty/error/retry presentation states. Randomness and time must be injected or seeded so tests are deterministic. Avoid low-value creation-only tests.

Validation commands should ultimately include the repository scripts for formatting checks, lint, strict type checking, unit tests, and production build. Browser smoke checks should cover all routes and key simulation controls once implementation exists.

## 12. Performance Considerations

- Normalize frequently updated order entities and update only affected records immutably.
- Use `OnPush`, readonly inputs, computed selectors, and stable `@for (...; track item.id)` expressions.
- Derive filtered ID lists, then map visible rows; avoid sorting/filtering in templates.
- Debounce search and cap visible results. Add CDK virtual scrolling only if profiling shows the displayed list is large enough to justify the dependency; a capped result set is likely simpler for 500 products.
- Keep live-event frequency bounded, coalesce bursts where safe, and retain only a fixed history window.
- Avoid a global signal read that causes the whole shell to refresh on every order event.
- Cancel obsolete AI/search work and do not retain abandoned streams.
- Lazy-load route features and keep shared components granular enough for tree shaking.
- Use lightweight icons/placeholders and avoid unnecessary image/network work.
- Profile update bursts and keyboard search responsiveness before adding optimizations or libraries.

## 13. Accessibility Considerations

- Use semantic landmarks, headings, navigation, lists/tables, buttons, and form labels.
- Provide a skip link and predictable keyboard focus when navigation collapses, drawers open, or routes change.
- Implement the product search as an accessible combobox/listbox with `aria-expanded`, `aria-controls`, and `aria-activedescendant` where appropriate.
- Ensure drawers/dialogs have focus management, Escape behavior, labelled titles, and focus restoration.
- Never communicate status, priority, payment, or connectivity by color alone; include text/icons.
- Meet WCAG AA contrast, visible focus, minimum target sizing, and readable tablet layouts.
- Announce significant asynchronous changes selectively through live regions without flooding screen readers during frequent events.
- Support `prefers-reduced-motion`; animations must be brief and nonessential.
- Skeletons should be ignored by assistive technology while meaningful loading text remains available.
- Keep live timers from causing disruptive focus or announcements.

## 14. Risks and Reasonable Trade-offs

- **No existing workspace**: initialization choices cannot reuse repository conventions because none exist. Mitigation: use Angular's official generator defaults, document exact pinned versions, and avoid extra libraries.
- **Node compatibility**: installed Node `v25.7.0` may not be supported by the chosen Angular version. Mitigation: declare a supported Node LTS range and add a version-manager file before dependency installation.
- **Mock concurrency versus backend truth**: optimistic reconciliation cannot model every real server conflict. Mitigation: use entity revisions and explicit stale-response handling to demonstrate sound client behavior.
- **Cross-feature coupling**: kitchen, orders, and AI influence each other. Mitigation: typed events plus pure policies coordinated outside components; avoid direct store-to-store mutation.
- **Signal recomputation under live load**: naive full-array derivations may become noisy. Mitigation: normalized state, stable ordering, narrow computed selectors, bounded event rates, and profiling.
- **`localStorage` limitations**: it is synchronous and offers limited transactional behavior. For the small prototype queue it is simpler and sufficient; persistence remains behind a port so IndexedDB can replace it later.
- **Simulation determinism versus realism**: fully random failures are difficult to test. Use seeded pseudo-random scenarios and manual controls; production-like variability remains reproducible.
- **Custom state stores versus NgRx**: local signal stores require team conventions but avoid an unnecessary dependency for this prototype. Reassess only if real backend integration and cross-feature workflows materially increase complexity.
- **Virtual scrolling**: Angular CDK would be useful for thousands of simultaneously rendered results, but the specified 500-item dataset can be efficiently searched with a bounded visible result list. Add CDK only after measurement.
- **No real service worker/backend**: “offline” is an application/network simulation and persistent command queue, not full asset-level PWA offline support. This is aligned with the frontend-prototype scope and should be documented clearly.

## 15. Dependency Plan

No dependency changes are made during this assessment. During implementation, use only the minimal workspace dependencies:

- Angular framework packages generated for a single stable, mutually compatible Angular version, including core, common, router, forms, animations only if genuinely used, and platform browser.
- RxJS and `tslib` as standard Angular runtime dependencies.
- Angular CLI/build/compiler tooling, a compatible TypeScript version, and the test tooling selected by the generated workspace.
- `angular-eslint`/ESLint and Prettier for the required linting and formatting workflow.
- Sass through Angular's supported build tooling for SCSS; no UI framework is required.

Do not add NgRx, a component suite, charting library, WebSocket client, persistence library, utility CSS framework, or date library initially. The small workload-history visualization can use semantic HTML/CSS or a lightweight inline SVG Angular component. Browser APIs and narrow adapters cover persistence and simulation needs.

## 16. Genuine Blockers

There is no blocker to creating the application in the next phase. Before installing packages, the implementation phase must resolve and pin one compatibility decision: a stable Angular version and its supported Node LTS/npm combination. The currently installed Node `v25.7.0` is environment information, not a repository constraint, and may require switching Node versions. Package availability/network access may also require explicit installation permission in the implementation phase, but it does not block this planning phase.
