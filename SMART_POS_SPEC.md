You are a senior Angular frontend architect and UI engineer.

Build a production-quality frontend prototype for a browser-based **Smart Restaurant POS Dashboard** called **Sahm Food Smart Order Workspace**.

The goal is not to build a complete backend-connected application. The goal is to demonstrate a scalable, maintainable Angular frontend architecture capable of handling:

- Complex UI interactions
- Live asynchronous updates
- Simulated WebSocket events
- AI response streaming
- Optimistic actions
- Offline recovery
- Large searchable datasets
- Efficient and predictable state management

Do not create only static screens. Implement the interactions, state transitions, loading states, error states, simulations, and recovery flows described below.

## General instructions

1. First inspect the existing repository, package.json, Angular version, folder structure, installed dependencies, linting rules, and styling setup.
2. Reuse the existing tools and conventions whenever reasonable.
3. If the repository is empty, initialize a modern Angular application using:

   - Standalone components
   - Strict TypeScript
   - SCSS
   - Angular Router
   - Angular Signals
   - RxJS
   - ESLint
   - Prettier

4. Use the Angular version available in the repository. Do not unnecessarily upgrade dependencies.
5. Do not introduce large third-party libraries unless they provide a clear architectural benefit.
6. Do not build a real backend. Create typed mock services and realistic event simulators.
7. Make reasonable assumptions without stopping to ask questions.
8. Complete the implementation, run the available checks, and fix errors before finishing.

---

# Business context

Sahm Food operates hundreds of restaurants. Every cashier uses a browser-based POS system.

The new Smart Order Workspace is used simultaneously by:

- Cashiers
- Branch managers
- Kitchen staff
- Customer support teams

Unlike a traditional CRUD dashboard, this workspace continuously receives updates from multiple systems.

The application must remain responsive, understandable, and maintainable as the number of features and live events grows.

---

# Required modules

## 1. Application shell

Build a polished responsive dashboard shell containing:

- Collapsible side navigation
- Top header
- Branch selector
- Current user and role
- Online/offline connection indicator
- Pending offline operations indicator
- Notification area
- Main workspace
- Responsive layout for desktop and tablet screens

Navigation items:

- Live Orders
- Product Search
- Kitchen Monitor
- Offline Queue

Use a professional restaurant POS visual style.

The interface should be clean, spacious, accessible, and operational rather than decorative.

Avoid excessive gradients, animations, glass effects, and unnecessary visual noise.

---

## 2. Live Orders Workspace

Display orders received from:

- Walk-in
- Delivery
- Online

Each order should include:

- Order number
- Channel
- Customer name when applicable
- Ordered items
- Total price
- Creation time
- Elapsed waiting time
- Current status
- Priority
- Kitchen delay state
- Payment state
- AI recommendation state
- Pending synchronization state

Supported order statuses:

- Received
- Preparing
- Ready
- Delivered
- Completed
- Cancelled

Implement:

- Status tabs or filters
- Channel filters
- Priority filters
- Search by order number or customer
- Sort by newest, oldest, highest priority, or longest waiting time
- Order summary counters
- Detailed order drawer or side panel
- Clear empty states
- Skeleton loading states
- Error and retry states

Order updates should arrive through a simulated live event service.

The simulation should periodically:

- Add a new order
- Update an order status
- Change order priority
- Mark an order as delayed
- Update payment information

Updates must happen without refreshing the page.

Use efficient rendering patterns:

- OnPush change detection
- Stable item identity
- Proper `trackBy` or Angular tracking expressions
- Memoized or computed selectors
- Immutable state updates
- Avoid recalculating all orders for every small event
- Avoid unnecessary subscriptions inside presentation components

Do not mutate shared state directly.

---

## 3. Order status workflow

Implement valid status transitions.

Example:

Received → Preparing → Ready → Delivered → Completed

Walk-in orders may move from Ready directly to Completed.

Prevent invalid transitions.

When a user changes an order status:

1. Update the UI optimistically.
2. Show that synchronization is pending.
3. Simulate a server request.
4. Confirm the action on success.
5. Revert the state and show a useful message on failure.
6. Queue the action when offline.
7. Prevent duplicate submissions caused by repeated clicking.

All status transition rules must live outside UI components.

Create a dedicated domain service, policy, state machine, or pure utility for transition validation.

---

## 4. AI Order Assistant

Each selected order should contain an AI recommendation panel.

The AI assistant may produce:

- Upselling recommendations
- Allergy warnings
- Missing order information
- Delivery risks
- Kitchen overload warnings

Simulate asynchronous AI behavior.

The panel must support:

- Idle
- Loading
- Streaming partial content
- Success
- Empty result
- Failure
- Retry
- Cancelled request

AI responses should sometimes:

- Complete successfully
- Take several seconds
- Fail
- Stream content in small chunks
- Change after kitchen load changes
- Be cancelled when the user selects another order

Make the streaming simulation realistic and cleanly implemented using RxJS or another suitable Angular reactive pattern.

Do not place streaming logic directly inside the component.

The component should receive view state and emit user actions.

Include:

- Generate recommendation button
- Retry button
- Cancel generation button
- Streaming indicator
- Last generated timestamp
- Recommendation severity
- Clear distinction between warnings and sales suggestions

Make sure subscriptions are disposed of correctly.

---

## 5. Kitchen Load Monitor

Build a live kitchen workload module.

Display:

- Overall kitchen load percentage
- Active orders
- Average preparation time
- Delayed orders
- Available stations
- Busy stations
- Load status: Normal, Busy, Critical
- Simple workload history visualization
- Station-level workload

Example stations:

- Grill
- Fryer
- Drinks
- Desserts
- Packaging

Simulate kitchen load updates periodically.

When kitchen load changes:

- Relevant orders may become delayed
- Order priorities may change
- Priority badges should update
- AI recommendations may become outdated
- The AI assistant may produce a kitchen overload warning
- Estimated preparation times should change

Keep the dependency flow clear.

Kitchen events should not directly manipulate components. They should flow through typed application services or feature state.

---

## 6. Advanced Product Search

Create a product search experience with a realistically large mocked dataset.

Each product should include:

- ID
- Name
- Category
- Price
- Availability
- Preparation time
- Dietary tags
- Allergy information
- Popularity
- Image placeholder or icon

Implement:

- Instant search
- Debounced input
- Category filters
- Availability filter
- Recent searches
- Clear search
- Highlighted matching text
- Keyboard navigation
- Arrow Up and Arrow Down
- Enter to select
- Escape to close results
- Active result styling
- Accessible search semantics
- Empty state
- Loading state
- Large dataset performance

Do not execute expensive filtering repeatedly from the HTML template.

Use computed state, memoized selectors, or an appropriate reactive pipeline.

If the number of displayed results is large, use virtual scrolling if it is already available or can be added without unnecessary complexity.

Persist recent searches locally.

Sanitize and safely render highlighted text. Do not use unsafe HTML patterns.

---

## 7. Offline support

The application should tolerate temporary connection loss.

Add a connection simulation control so the reviewer can manually switch between:

- Online
- Offline
- Unstable connection

When offline:

- Status updates should still appear optimistically
- Actions should be added to a persistent queue
- Pending actions should remain visible after page refresh
- Duplicate actions should be prevented
- The user should clearly understand which operations are not synchronized

When the connection returns:

- Process queued operations in order
- Mark successful operations as synchronized
- Retry transient failures with a limited retry strategy
- Stop infinite retries
- Surface permanent failures
- Allow manual retry
- Allow removal of a failed operation
- Reconcile optimistic state when an operation fails permanently

Use IndexedDB when practical. A clean local persistence abstraction backed by localStorage is acceptable if IndexedDB would introduce disproportionate complexity.

Every queued operation should have:

- Unique operation ID
- Idempotency key
- Operation type
- Entity ID
- Payload
- Creation timestamp
- Retry count
- Current state
- Last error

Possible operation states:

- Pending
- Processing
- Completed
- Failed

Create an Offline Queue page that allows the user to inspect pending and failed operations.

---

# Architecture requirements

Use feature-based architecture with clear dependency boundaries.

A suggested structure is:

```text
src/app/
  core/
    connectivity/
    error-handling/
    persistence/
    live-events/
    notifications/
    layout/
  shared/
    ui/
    directives/
    pipes/
    utilities/
  features/
    orders/
      domain/
      data-access/
      state/
      ui/
      pages/
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
    products/
      domain/
      data-access/
      state/
      ui/
      pages/
    offline-queue/
      domain/
      data-access/
      state/
      ui/
      pages/
```

Adapt this structure when the existing repository has an established architecture, but preserve the same separation of concerns.

## Dependency direction

Keep dependencies flowing in a predictable direction:

- Pages compose features.
- UI components depend on view models and inputs.
- State or facades coordinate use cases.
- Data-access services communicate with mocks, persistence, and event sources.
- Domain code contains business rules and pure models.
- Domain code must not depend on UI components.

Avoid circular dependencies.

---

# Angular implementation standards

Use:

- Standalone components
- Strictly typed reactive forms where forms are needed
- Signals for synchronous UI state
- Computed signals for derived state
- RxJS for asynchronous event streams
- Dependency injection
- Feature facades or feature stores
- Functional guards or interceptors where relevant
- Lazy-loaded feature routes
- OnPush change detection
- `inject()` when consistent with the repository
- Proper teardown using `takeUntilDestroyed`, async pipe, signals, or equivalent safe patterns

Do not:

- Put business logic inside templates
- Put large business workflows directly inside components
- Use `any`
- Create generic services that know everything
- Create a single oversized global store
- Subscribe inside nested subscriptions
- Mutate arrays or shared objects in place
- Duplicate models in multiple features
- Expose writable state publicly
- Use components with hundreds of lines of mixed responsibilities
- Add comments that merely repeat the code
- Leave dead code, unused imports, placeholder TODOs, or console logging

Use readonly models where appropriate.

Prefer discriminated unions for async and operation states.

Example:

```ts
type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'streaming'; partialData: T }
  | { status: 'success'; data: T }
  | { status: 'empty' }
  | { status: 'error'; error: AppError };
```

Create clear domain types for:

- Order
- Order item
- Order status
- Order channel
- Order priority
- Kitchen load
- Kitchen station
- AI recommendation
- Product
- Queued operation
- Connectivity state

---

# Component design

Separate container and presentation responsibilities.

Container or page components should:

- Connect to feature state
- Trigger use cases
- Compose view models
- Handle route parameters

Presentation components should:

- Receive typed inputs
- Emit typed events
- Focus on rendering
- Avoid direct data fetching
- Avoid knowledge of persistence or WebSocket simulation

Create reusable UI components where they provide real value, such as:

- Status badge
- Priority badge
- Channel badge
- Loading skeleton
- Empty state
- Error state
- Search input
- Confirmation dialog
- Toast notification
- Metric card
- Connection status
- Pending synchronization indicator

Do not create unnecessary wrapper components.

---

# Error handling

Create a consistent application error model.

Handle:

- Initial loading failure
- Live event failure
- AI generation failure
- Offline synchronization failure
- Invalid order transitions
- Product search errors
- Persistence failure

Messages should be useful to the user and not expose technical implementation details.

Log technical details through a centralized logger abstraction rather than scattered console statements.

---

# UI and UX requirements

Create a cohesive and professional POS interface.

The dashboard should include:

- Strong visual hierarchy
- Readable typography
- Consistent spacing
- Clear status colors
- Accessible contrast
- Visible keyboard focus
- Tooltips where icons may be unclear
- Responsive order cards or rows
- Compact but readable operational information
- Confirmation for destructive actions
- Toast feedback for important actions

Support reduced motion preferences.

Use semantic HTML and meaningful ARIA attributes where necessary.

All interactive elements must be accessible by keyboard.

Do not use placeholder lorem ipsum content. Use realistic restaurant, product, order, and customer data.

Use a centralized formatting approach for currency, dates, durations, and order identifiers.

Use a consistent currency, such as QAR, across the prototype.

---

# Routes

Implement lazy-loaded routes similar to:

```text
/orders
/products
/kitchen
/offline-queue
```

The default route should open the Live Orders workspace.

Include a not-found route.

---

# Mock data and simulations

Create deterministic mock generators where possible.

Provide enough data to demonstrate performance and interaction:

- At least 50 live orders
- At least 500 products
- Multiple kitchen stations
- Different AI recommendation types
- A variety of queued offline operations

The application should remain usable while simulations are active.

Provide an obvious development-only simulation panel or controls for:

- Add new order
- Trigger order update
- Increase kitchen load
- Decrease kitchen load
- Force AI failure
- Switch connection state
- Trigger synchronization
- Reset mock data

Keep simulation controls separate from production-facing domain logic.

---

# Testing

Add meaningful tests for critical behavior.

At minimum, test:

1. Valid and invalid order status transitions
2. Order selectors or computed filtering
3. Debounced product search behavior
4. Keyboard result navigation
5. AI streaming state transitions
6. Offline queue deduplication
7. Retry limit behavior
8. Queue restoration from persistence
9. Kitchen load influence on order priority
10. Optimistic update rollback

Use the testing stack already configured in the project.

Do not add low-value tests that only verify that a component exists.

---

# Documentation

Add a concise README containing:

- Project purpose
- Setup instructions
- Development commands
- Architecture overview
- State-management approach
- Live-event simulation approach
- AI streaming simulation approach
- Offline queue design
- Important engineering decisions
- Trade-offs
- Testing instructions

Also include a short architecture diagram using Mermaid.

---

# Definition of done

The task is complete only when:

- The application builds successfully
- Linting passes
- TypeScript strict checking passes
- Relevant tests pass
- Main routes work
- Live orders update without page refresh
- AI recommendations demonstrate streaming, failure, retry, and cancellation
- Kitchen load changes affect order state
- Product search supports debouncing and keyboard navigation
- Offline actions persist and synchronize after reconnection
- No important business logic is placed directly inside components
- No obvious unnecessary re-rendering exists
- No `any`, dead code, unfinished TODOs, or console errors remain
- The README clearly explains the architecture

At the end, provide:

1. A concise summary of what was implemented
2. The main architectural decisions
3. The important files and folders created or changed
4. Commands used to validate the application
5. Build, lint, and test results
6. Any remaining limitations or reasonable trade-offs

Do not return only a plan or code snippets. Make the actual repository changes and deliver a working frontend prototype.
