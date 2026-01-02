# Copilot Instructions

## General Guidelines

1. **Be Concise**: Provide clear and concise answers. Avoid unnecessary verbosity.
2. **Stay On Topic**: Keep responses relevant to the user's query. If the question is unclear, ask for clarification.
3. **Use Code Blocks**: For code-related queries, use code blocks to format code snippets properly.
4. **Provide Examples**: When explaining concepts, provide examples to illustrate your points.
5. **Terminal Usage**: Rather than opening a new terminal window all the time, re-use existing ones where possible. If the current terminal window as running npm run dev, open a new terminal window to run other commands and not kill the current window.
6. **Over-complicated changes** - Avoid suggesting complex refactors or changes that are not directly related to the user's request or are an over-complication of the task at hand. Simple is often better.
7. **Remove test code and logging** - if you create test code for logging, be sure to remove it when the task is complete
8. **Git Commit Message Format**: Always use [Conventional Commits](https://www.conventionalcommits.org/) format for compatibility with release-please automation:
   - Format: `<type>[optional scope]: <description>`
   - Types: `feat:` (new feature), `fix:` (bug fix), `docs:` (documentation), `chore:` (maintenance), `refactor:` (code restructuring), `test:` (testing), `style:` (formatting), `perf:` (performance), `ci:` (CI/CD), `build:` (build system)
   - Breaking changes: Add `BREAKING CHANGE:` in commit body or append `!` after type/scope
   - Examples:
     - `feat: add external session management support`
     - `fix: preserve custom sessionId during recovery`
     - `chore: remove node_modules from git tracking`
     - `docs: update session management guide`
     - `feat!: change session storage API (breaking change)`

---

## Project: HCL Interact SDK

### Overview

This is the **HCL Interact Web SDK** (`@hcl-cdp-ta/interact-sdk`) - a production-ready TypeScript SDK for HCL Interact (formerly Unica Interact) personalization platform. The SDK provides a clean, type-safe interface for real-time offer management, session handling, event tracking, and audience segmentation.

**Version**: 2.7.2  
**Package**: `@hcl-cdp-ta/interact-sdk`  
**Author**: Simon Pallister  
**License**: ISC

### Project Structure

```
interact-sdk/                    # Main SDK package
├── src/
│   ├── InteractClient.ts       # Core SDK implementation (1544 lines)
│   ├── InteractServletClient.ts # Low-level servlet API client
│   ├── InteractError.ts        # Custom error handling
│   ├── Types.ts                # TypeScript type definitions
│   ├── index.ts                # Public API exports
│   └── BatchBuilder.ts         # (integrated in InteractClient.ts)
├── dist/                        # Built distribution files
│   ├── index.js                # CommonJS bundle
│   ├── index.mjs               # ES Module bundle
│   ├── index.global.js         # IIFE bundle for browsers
│   └── index.d.ts              # TypeScript definitions
├── package.json
├── tsconfig.json
└── tsup.config.ts              # Build configuration

interact-sdk-test/               # Next.js demo application
├── app/
│   ├── page.tsx                # Main demo UI with SDK integration
│   ├── layout.tsx              # App layout
│   └── globals.css             # Styles
├── components/
│   ├── ResponseMetrics.tsx     # Real-time SDK performance tracking
│   └── OfferCard.tsx           # Production-ready offer display components
└── package.json

Root level test files:           # Standalone test scripts
├── test-session-persistence.ts
├── test-custom-session-filtering.ts
├── diagnose-session-recovery.ts
├── demo-synthetic-responses.ts
├── demo-command-filtering.ts
└── vanilla-example.html        # Pure HTML/JS example (no build tools)
```

### Core Architecture

#### 1. **InteractClient** (Main Class)

The primary SDK interface providing high-level methods for:

- **Session Management**: `startSession()`, `endSession()`, `getSessionId()`, `setSessionId()`, `clearSession()`
- **Offer Retrieval**: `getOffers()` - retrieve personalized offers from interaction points
- **Event Tracking**: `postEvent()` - track user interactions and behaviors
- **Audience Management**: `setAudience()`, `getStoredAudience()` - manage user segmentation
- **Batch Operations**: `createBatch()`, `executeBatch()` - optimize multiple API calls

**Key Features:**

- **Automatic Session Recovery**: Detects expired sessions and seamlessly recovers using stored audience
- **Session Persistence**: Uses `sessionStorage` to maintain sessions across page refreshes
- **External Session Management**: Supports custom session IDs for integration with external systems
- **Smart Session Storage**: Distinguishes between internal (SDK-managed) and external (user-managed) sessions
- **Intelligent Retry Logic**: Automatically handles transient errors and session expiration
- **Command Filtering**: Optimizes batches by skipping redundant `startSession` commands when valid session exists

#### 2. **BatchBuilder** (Batch Operations)

Two batch operation styles:

**Traditional Batch API** (explicit execution):

```typescript
const batch = client.createBatch().startSession(audience).getOffers("homepage", 3).postEvent("page_view")
const results = await batch.execute() // Explicit execute() call
```

**ExecutableBatchBuilder** (fluent one-line API):

```typescript
// Auto-executes on terminal methods
const results = await client.executeBatch().startSession(audience).getOffers("homepage", 3) // Executes immediately
```

#### 3. **Session Management System**

**Session State** (`SessionState` interface):

```typescript
{
  sessionId: string | null           // Current session ID
  isValid: boolean                   // Session validity flag
  lastActivity: Date                 // Last activity timestamp
  audience?: AudienceConfig          // Stored audience for recovery
  externallyManaged?: boolean        // Flag for external session management
}
```

**Session Persistence Flow:**

1. Session created via `startSession()` → stored in memory + `sessionStorage`
2. Page refresh → `loadPersistedSession()` restores from `sessionStorage`
3. Session expires → automatic recovery using stored audience
4. External session ID provided → no storage updates (external management mode)

**External vs Internal Session Management:**

- **Internal**: SDK manages sessionId, stores in `sessionStorage`, handles recovery
- **External**: User provides sessionId, SDK skips storage, user handles recovery

#### 4. **Automatic Session Recovery**

When a method detects session expiration (via `isRecoverableSessionError()`):

1. **Detection**: Response contains specific error messages indicating invalid/expired session
2. **Recovery Trigger**: `executeBatchWithRetry()` or `ExecutableBatchBuilder.execute()` detects error
3. **Audience Retrieval**: Gets stored audience from `sessionState.audience`
4. **Session Creation**: Calls `startSession()` with stored audience
5. **Command Retry**: Prepends `startSession` to original batch and retries
6. **Custom SessionId Preservation**: If original command had custom sessionId, it's preserved in retry

**Error Detection Logic:**

```typescript
isRecoverableSessionError(error): boolean {
  // Checks for specific server messages:
  // - "invalid session id"
  // - "Session has expired"
  // - "No active session"
}
```

**Non-Recoverable Errors** (fail-fast):

- Invalid IC (Interactive Channel)
- Invalid IP (Interaction Point)
- Configuration errors
- These trigger `InteractApiError` with original server message

#### 5. **Type System**

**Core Types:**

- `InteractConfig`: SDK configuration
- `AudienceConfig`: User audience definition
- `NameValuePair`: Parameter structure (`{ n: string, v: any, t: "string"|"numeric"|"datetime" }`)
- `Command`: Batch command structure
- `Offer`: Offer data from server
- `InteractResponse`: Single operation response
- `BatchResponse`: Batch operation response

**Enums for Type Safety:**

- `InteractParamType`: String | Numeric | DateTime
- `InteractAudienceLevel`: Visitor | Customer

**Fluent API Classes:**

- `InteractParam`: Type-safe parameter builder
- `InteractAudience`: Type-safe audience builder

### Key Implementation Details

#### Session Storage Logic

```typescript
// Only persist to sessionStorage when:
// 1. persistSession is enabled (default: true)
// 2. Session is NOT externally managed
// 3. SessionId is not null

if (sessionId && !this.sessionState.externallyManaged) {
  this.saveSessionToStorage() // Save to sessionStorage
} else if (!sessionId) {
  this.clearPersistedSession() // Clear storage
}
```

#### External Session Management Detection

```typescript
// In BatchBuilder.execute() and ExecutableBatchBuilder.execute():
const startSessionCmd = this.commands.find(cmd => cmd.action === "startSession")
const hasExternalSessionManagement =
  sessionId !== undefined || // Explicit sessionId to execute()
  startSessionCmd?.customSessionId !== undefined // Custom sessionId in startSession command

// Pass flag to setSession to prevent storage updates
this.client.setSession(sessionIdToStore, audience, hasExternalSessionManagement)
```

#### Intelligent Session Filtering

```typescript
// ExecutableBatchBuilder.execute() tries optimized execution first:
if (hasValidSession && hasStartSessionCommand) {
  // Try without startSession command first
  const optimizedCommands = commands.filter(cmd => cmd.action !== "startSession")
  const result = await client._executeBatch(sessionId, optimizedCommands)

  if (!isSessionInvalid(result)) {
    return result // Success! No need for startSession
  }

  // Session invalid - retry with full batch including startSession
  clearSession()
  return await client._executeBatch(effectiveSessionId, commands)
}
```

### Build System

**Build Tool**: tsup (TypeScript Universal Package)  
**Formats**: ESM (.mjs), CommonJS (.js), IIFE (.global.js)  
**Commands**:

- `npm run build` - Production build
- `npm run dev` - Watch mode for development

**Output**:

- Modern browsers: ES Modules (`index.mjs`)
- Node.js/Bundlers: CommonJS (`index.js`)
- Direct browser usage: IIFE (`index.global.js`)
- TypeScript: Declaration files (`index.d.ts`, `index.d.mts`)

### Dependencies

**Runtime**:

- None - Uses native `fetch` API (Node.js 18+ and all modern browsers)

**Dev Dependencies**:

- TypeScript 5.7.3
- tsup 8.3.6
- terser (minification)

### Testing & Examples

**Test Files** (root level):

- `test-session-persistence.ts` - Session storage across page refreshes
- `test-custom-session-filtering.ts` - External session management
- `diagnose-session-recovery.ts` - Session expiration recovery
- `demo-synthetic-responses.ts` - Response injection testing
- `demo-command-filtering.ts` - Command optimization testing

**Demo Application** (`interact-sdk-test/`):

- Next.js 15 + React 19
- Real-time SDK performance metrics
- Production-ready offer card components
- Complete integration examples

**Vanilla JavaScript Example** (`vanilla-example.html`):

- Pure HTML/JS with no build tools
- Demonstrates IIFE bundle usage
- Complete working example for non-framework usage

### Common Development Tasks

#### Building the SDK

```bash
cd interact-sdk
npm run build
```

#### Running Tests

```bash
# Node.js test scripts
npx ts-node test-session-persistence.ts
npx ts-node diagnose-session-recovery.ts

# Demo app
cd interact-sdk-test
npm run dev
```

#### Making Changes

1. Edit `src/InteractClient.ts` (main implementation)
2. Run `npm run build` in `interact-sdk/`
3. Changes propagate to test app via `file:` dependency
4. Test in demo app at `http://localhost:3000`

### Important Conventions

#### Session Management Rules

1. **Never** update `sessionStorage` when `externallyManaged` flag is true
2. **Always** preserve custom sessionIds during recovery operations
3. **Check** `hasExternalSessionManagement` before calling `setSession()`
4. **Store** audience information for automatic recovery (even with external sessions)

#### Batch Command Handling

1. **startSession** commands can have `customSessionId` property
2. **Command arrays** must maintain order for response correlation
3. **Synthetic responses** injected for skipped commands to maintain array alignment
4. **Session recovery** prepends new startSession, doesn't modify original commands

#### Error Handling

1. **Recoverable errors**: Session expiration, invalid session → trigger recovery
2. **Non-recoverable errors**: Invalid IC/IP, config errors → fail fast with `InteractApiError`
3. **Always** preserve original server error messages for debugging

#### API Design Principles

1. **Consistency**: All methods follow same parameter patterns
2. **Backward Compatibility**: Old APIs still work, new APIs preferred
3. **Type Safety**: Use enums and interfaces, avoid string literals
4. **Framework Agnostic**: No framework dependencies, works everywhere
5. **Progressive Enhancement**: Simple APIs for common cases, advanced options available

### Common Pitfalls to Avoid

1. **Don't** call `saveSessionToStorage()` when `externallyManaged` is true
2. **Don't** modify command arrays during retry - always recreate
3. **Don't** skip audience storage for external sessions (needed for recovery)
4. **Don't** assume `sessionId` parameter means external management (check for custom sessionId in commands too)
5. **Don't** add multiple `startSession` commands in recovery retry
6. **Don't** remove debug logging code that's controlled by `enableLogging` config

### Configuration Options

```typescript
const client = new InteractClient({
  serverUrl: string                 // Required: HCL Interact server URL
  interactiveChannel?: string       // Default: "_RealTimePersonalization_"
  username?: string                 // Optional: for authenticated requests
  password?: string                 // Optional: for authenticated requests
  enableLogging?: boolean           // Default: false - enables console debug output
  persistSession?: boolean          // Default: true - session persistence across refreshes
  sessionStorageKey?: string        // Default: "interact-session"
  sessionExpiryMinutes?: number     // Default: 30 - minutes until persisted session expires
})
```

### React Integration Patterns

**ResponseMetrics Component** (`components/ResponseMetrics.tsx`):

- Global state management for SDK metrics
- Real-time performance tracking
- `updateMetrics(response, executionTime)` to track operations

**OfferCard Components** (`components/OfferCard.tsx`):

- `OfferCard`: Full featured with tracking, actions, error handling
- `SimpleOfferCard`: Display-only variant
- Automatic contact event tracking with duplicate prevention
- React StrictMode safe (global tracking set)

### Current State & Known Issues

**Working Features:**
✅ Session persistence across page refreshes  
✅ Automatic session recovery on expiration  
✅ External session management with custom sessionIds  
✅ Intelligent batch command optimization  
✅ Fail-fast error handling for configuration errors  
✅ Custom sessionId preservation during recovery  
✅ Session storage consistency for external vs internal management

**Recent Fixes:**

- Session storage now respects `externallyManaged` flag
- Custom sessionIds in batch startSession commands properly detected
- Both `BatchBuilder` and `ExecutableBatchBuilder` check for external management
- `setSession()` and `setSessionId()` accept `externallyManaged` parameter

**Testing Scenarios:**

- Direct method calls with custom sessionId ✅
- Batch operations with custom sessionId in startSession ✅
- Fluent executeBatch with custom sessionId ✅
- Session recovery preserves custom sessionIds ✅
- postEvent with autoManageSession and audience parameter ⚠️ (verify stored audience is available)
