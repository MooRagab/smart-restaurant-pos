# Sahm Food POS — Engineering Instructions

## General Rules

- Build the application using modern Angular patterns.
- Use standalone components, strict TypeScript, Angular Signals, RxJS, SCSS, and lazy-loaded routes.
- Follow a feature-based architecture.
- Keep domain logic, data access, state management, and UI components separated.
- Do not place business logic directly inside Angular components or templates.
- Do not use `any`.
- Prefer readonly and explicitly typed models.
- Use immutable state updates.
- Use OnPush change detection.
- Prevent unnecessary component re-rendering.
- Use computed signals or selectors for derived state.
- Presentation components must receive typed inputs and emit typed outputs.
- Services must have clear and limited responsibilities.
- Avoid circular dependencies and oversized global services.
- Avoid nested subscriptions.
- Dispose of asynchronous subscriptions correctly.
- Do not leave TODO comments, unused imports, dead code, debug code, or console logs.
- Do not introduce unnecessary dependencies.
- Reuse the repository’s existing conventions and dependencies whenever appropriate.

## Workflow

Before making changes:

1. Inspect the entire repository.
2. Read `SMART_POS_SPEC.md` completely.
3. Inspect `package.json`, Angular configuration, linting, formatting, testing, and existing architecture.
4. Create an implementation plan based on the actual repository.
5. Implement the specification incrementally.

After making changes:

1. Run TypeScript checking.
2. Run the production build.
3. Run linting.
4. Run all relevant tests.
5. Fix discovered errors.
6. Review the implementation for architectural violations.
7. Confirm that no unfinished code, debug statements, or unnecessary files remain.

## Quality Requirements

The final implementation must:

- Be functional rather than a collection of static screens.
- Include realistic asynchronous simulations.
- Include loading, empty, error, retry, cancellation, offline, and reconnection states.
- Remain responsive while live simulations are active.
- Use clean naming and small focused files.
- Contain meaningful tests for business-critical behavior.
- Include updated project documentation.

Do not return only explanations or code snippets. Make the required changes directly in the repository.
