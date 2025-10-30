# HCL Interact SDK

Framework-agnostic TypeScript SDK for HCL Interact with comprehensive session management, offer retrieval, and event tracking.

## Quick Start

The SDK can be used in any JavaScript environment:

### Option 1: NPM Installation (Recommended)

```bash
npm install @hcl-cdp-ta/interact-sdk
```

### Option 2: Direct Browser Usage (No Dependencies)

Load directly from GitHub (or use your preferred CDN):

```html
<!-- Load from # Start session with audience
const audience = InteractAudience.customer(InteractParam.create("CustomerID", "67890", InteractParamType.Numeric))
await client.startSession(audience)Hub -->
<script src="https://raw.githubusercontent.com/HCL-CDP-TA/interact-web-sdk/main/dist/index.global.js"></script>

<!-- Or specific version -->
<script src="https://raw.githubusercontent.com/HCL-CDP-TA/interact-web-sdk/v1.0.0/dist/index.global.js"></script>

<!-- Or from CDN (when published) -->
<script src="https://unpkg.com/@hcl-cdp-ta/interact-sdk/dist/index.global.js"></script>
```

## Installation & Usage

### With NPM

```javascript
// ES modules
import { InteractClient } from "@hcl-cdp-ta/interact-sdk"

// CommonJS
const { InteractClient } = require("@hcl-cdp-ta/interact-sdk")
```

### Vanilla JavaScript (No Build Tools)

The SDK is fully compatible with vanilla JavaScript and can be used directly in browsers:

#### Option 1: ES Modules (Modern Browsers)

```html
<!DOCTYPE html>
<html>
  <head>
    <title>HCL Interact SDK Demo</title>
  </head>
  <body>
    <script type="module">
      // Import directly from CDN (when published)
      import {
        InteractClient,
        InteractAudience,
        InteractParam,
        InteractParamType,
      } from "https://unpkg.com/@hcl-cdp-ta/interact-sdk/dist/index.js"

      // Or serve the file locally
      // import { InteractClient, InteractAudience, InteractParam, InteractParamType } from './node_modules/@hcl-cdp-ta/interact-sdk/dist/index.js'

      const client = new InteractClient({
        serverUrl: "https://your-interact-server.com/interact",
        interactiveChannel: "web",
      })

      async function demo() {
        try {
          // Option 1: Manual audience creation
          const audience = {
            audienceLevel: "Visitor",
            audienceId: { name: "VisitorID", value: "0", type: "string" },
          }

          // Option 2: Helper method
          const audienceHelper = InteractClient.createAudience("Visitor", "VisitorID", "0", "string")

          // Option 3: Class-based fluent API (recommended)
          const audienceFluent = new InteractAudience(
            "Visitor",
            InteractParam.create("VisitorID", "0", InteractParamType.String),
          )

          const sessionResponse = await client.startSession(audienceFluent)
          console.log("Session started:", sessionResponse.sessionId)

          // Get offers
          const offers = await client.getOffers(sessionResponse.sessionId, "homepage", 3)
          console.log("Offers received:", offers.offerLists)

          // Track event
          await client.postEvent(sessionResponse.sessionId, "page_view")
          console.log("Event tracked")
        } catch (error) {
          console.error("Error:", error)
        }
      }

      demo()
    </script>
  </body>
</html>
```

#### Option 2: IIFE Bundle (All Browsers)

For maximum compatibility, you can use the IIFE (Immediately Invoked Function Expression) build:

```html
<!DOCTYPE html>
<html>
  <head>
    <title>HCL Interact SDK Demo</title>
    <!-- Load the IIFE bundle from GitHub (or other sources) -->
    <script src="https://raw.githubusercontent.com/HCL-CDP-TA/interact-web-sdk/main/dist/index.global.js"></script>
    <!-- Alternative loading options:
    <script src="https://raw.githubusercontent.com/HCL-CDP-TA/interact-web-sdk/v1.0.0/dist/index.global.js"></script>
    <script src="https://unpkg.com/@hcl-cdp-ta/interact-sdk/dist/index.global.js"></script>
    <script src="./node_modules/@hcl-cdp-ta/interact-sdk/dist/index.global.js"></script>
    -->
  </head>
  <body>
    <script>
      // SDK available as global variable HCLInteractSDK
      const { InteractClient } = HCLInteractSDK

      const client = new InteractClient({
        serverUrl: "https://your-interact-server.com/interact",
        interactiveChannel: "web",
      })

      async function demo() {
        try {
          // Using helper method for cleaner code
          const audience = HCLInteractSDK.InteractClient.createAudience("Visitor", "VisitorID", "0")

          const sessionResponse = await client.startSession(audience)
          console.log("Session:", sessionResponse.sessionId)

          const offers = await client.getOffers(sessionResponse.sessionId, "homepage", 3)
          console.log("Offers:", offers.offerLists)

          await client.postEvent(sessionResponse.sessionId, "page_view")
          console.log("Event tracked")
        } catch (error) {
          console.error("Error:", error)
        }
      }

      demo()
    </script>
  </body>
</html>
```

#### Option 3: Local Files (No CDN)

1. Download the SDK files:

```bash
npm install @hcl-cdp-ta/interact-sdk
# Copy files from node_modules/@hcl-cdp-ta/interact-sdk/dist/ to your project
```

2. Use in vanilla HTML:

```html
<!-- ES Modules -->
<script type="module" src="./interact-sdk/dist/index.js"></script>

<!-- Or IIFE (no modules needed) -->
<script src="./interact-sdk/dist/index.global.js"></script>
```

### Complete Vanilla JavaScript Example

See the complete working example at [`vanilla-example.html`](../vanilla-example.html) which demonstrates:

- SDK initialization
- Session management
- Getting offers
- Event tracking
- Error handling
- All without any build tools or frameworks!

## Quick Start

```typescript
import { InteractClient, InteractAudience, InteractParam, InteractParamType } from "@hcl-cdp-ta/interact-sdk"

// Initialize client
const client = new InteractClient({
  serverUrl: "https://your-interact-server.com/interact",
  interactiveChannel: "web",
})

// Define audience using fluent builders
const audience = InteractAudience.visitor(InteractParam.create("VisitorID", "0", InteractParamType.String))

// Start session and get offers (client manages session automatically)
const sessionResponse = await client.startSession(audience)
const offersResponse = await client.getOffers("HomePage_Hero", 3)

// Track user events (uses existing session)
await client.postEvent("page_view")
```

## Key SDK Improvements

### ✅ Standardized API Consistency

- **Unified Parameter Order**: All audience methods follow consistent `(level, identifier, value, type)` pattern
- **Direct Integration**: `createAudience()` results work directly with `setAudience()` - no conversion needed!
- **Method Overloads**: Both high-level (`AudienceConfig`) and low-level (`NameValuePair[]`) usage supported

### ✅ Enhanced Session Management

- **Automatic Recovery**: Sessions automatically recover when expired server-side
- **Synthetic Response Injection**: Optimized commands maintain response array alignment
- **Session Persistence**: Sessions survive page refreshes with configurable expiry
- **Smart Optimization**: Skips unnecessary `startSession` calls when valid session exists

### ✅ Developer Experience

- **Type Safety**: Full TypeScript support with enums for better IntelliSense
- **Consistent Batching**: BatchBuilder methods match main client signatures exactly
- **Clear Error Messages**: Detailed diagnostics for session recovery failures
- **Backward Compatibility**: All existing code continues to work

## Core Classes

### InteractClient

Main SDK client with unified session management, audience configuration, and offer retrieval.

**Key Features:**

- Unified session API with optional custom session IDs
- Automatic session state management
- Built-in error handling and retry logic
- Framework-agnostic design

### InteractServletClient

Direct servlet API access for advanced use cases and custom integrations.

### BatchBuilder

Efficient batch operations for complex workflows and performance optimization.

## Key Methods

### Session Management

- `startSession(audience, sessionId?, options?)` - Start session with audience config and optional custom session ID
  - `audience` - AudienceConfig or InteractAudience object defining the user
  - `sessionId` - Optional custom session ID (pass `null` to auto-generate)
  - `options.parameters` - Optional additional parameters to send with session start
  - `options.relyOnExistingSession` - Whether to rely on existing session (default: `true`)
  - `options.debug` - Enable debug mode for additional diagnostics (default: `false`)
- `setAudience(sessionId, audience)` - Set audience using AudienceConfig (recommended)
- `setAudience(sessionId, audienceLevel, audienceData)` - Set audience with manual NameValuePair array (low-level)
- `getSessionId()` - Get current active session ID
- `endSession(sessionId)` - End session and cleanup

### Offers & Content

- `getOffers(interactionPoint, numberRequested?, options?)` - Retrieve offers with automatic session management
  - `interactionPoint` - The interaction point name
  - `numberRequested` - Number of offers to request (default: 1)
  - `options.sessionId` - Override stored session with explicit session ID
  - `options.autoManageSession` - Auto-manage session if no sessionId provided (default: true)
  - `options.audience` - Audience for auto session creation

### Event Tracking

- `postEvent(eventName, parameters?, options?)` - Track events with automatic session management
  - `eventName` - Name of the event to track
  - `parameters` - Optional event parameters as NameValuePair array
  - `options.sessionId` - Override stored session with explicit session ID
  - `options.autoManageSession` - Auto-manage session if no sessionId provided (default: true)
  - `options.audience` - Audience for auto session creation

### Batch Operations

#### Traditional Batch API

For complex workflows requiring multiple operations with shared setup:

- `createBatch()` - Create batch builder for multiple operations
- Execute multiple API calls in a single request for optimal performance
- **Note**: Batch operations execute commands sequentially on the server. Session management options in individual batch commands are for API consistency but don't affect execution (the batch executes with the sessionId passed to `execute()`)

```typescript
// Create batch builder, configure multiple operations, then execute
const batch = client.createBatch().startSession(audience).getOffers("homepage_hero", 3).postEvent("page_view")

const results = await batch.execute() // Explicit execution step
```

#### One-Line Batch API (New!)

For simple batch operations, use the fluent one-line API:

- `executeBatch(sessionId?)` - Create auto-executing batch builder
- **Terminal methods**: `getOffers()`, `postEvent()`, `endSession()` auto-execute and return `Promise<BatchResponse>`
- **Builder methods**: `startSession()`, `setAudience()` continue the chain

```typescript
// Execute immediately when chain completes - no separate execute() call needed!
const results = await client.executeBatch().startSession(audience).getOffers("homepage_hero", 3) // Auto-executes and returns Promise<BatchResponse>

// Even simpler - just get offers with automatic session management
const offers = await client.executeBatch().getOffers("homepage_hero", 3)

// Post an event in one line
const eventResult = await client
  .executeBatch()
  .postEvent("page_view", [InteractClient.createParameter("pageType", "homepage")])
```

**API Comparison:**

- **Traditional**: Build → Execute (two steps, complex workflows)
- **One-line**: Auto-execute on terminal methods (one step, simple operations)

#### Batch Builder Methods

The BatchBuilder supports the same method signatures as the main client for **complete consistency**:

- `startSession(audience, sessionId?)` - With AudienceConfig/InteractAudience
- `startSession(audience, sessionId?, options?)` - With full options support
- `getOffers(interactionPoint, numberRequested?, options?)` - Same as main client
- `postEvent(eventName, parameters?, options?)` - Same as main client
- `setAudience(audienceLevel, audienceID)` - Set audience in batch (consistent parameter order)
- `setAudienceFromConfig(audience)` - Set audience using AudienceConfig (recommended)
- `endSession()` - Add end session to batch
- `execute(sessionId)` - Execute the batch with specified session ID

**Key Point**: BatchBuilder methods operate **exactly the same** as the direct client methods, providing a consistent developer experience.

#### API Consistency Example

```typescript
const audience = InteractAudience.customer(InteractParam.create("CustomerID", "67890", InteractParamType.Numeric))

// Direct client calls
await client.startSession(audience, "custom-session-123")
await client.getOffers("homepage", 3, { autoManageSession: true })
await client.postEvent("page_view", [], { audience })

// Equivalent batch calls - SAME signatures!
const batch = client
  .createBatch()
  .startSession(audience, "custom-session-123") // Same signature
  .getOffers("homepage", 3, { autoManageSession: true }) // Same signature
  .postEvent("page_view", [], { audience }) // Same signature

await batch.execute(null)
```

#### Session ID Handling in Batches

**Automatic Session Management** (Recommended):

```typescript
// Start session once
await client.startSession(audience)

// All batches automatically use the managed session
const batch = client.createBatch().getOffers("homepage", 3).postEvent("page_view")
const results = await batch.execute() // No session ID needed!
```

**Session ID Priority** (when multiple sources exist):

1. **Custom session ID in `startSession()`** - highest priority
2. **Explicit session ID passed to `execute(sessionId)`** - manual override
3. **Client's managed session ID** - automatic default (most common)

```typescript
// Example showing all priority levels
await client.startSession(audience) // Managed session: "auto-session-456"

const batch = client
  .createBatch()
  .startSession(audience, "custom-123") // Priority 1: Custom session ID
  .getOffers("homepage", 3)

await batch.execute("override-789") // Priority 2: Explicit override (ignored in this case)
// Result: "custom-123" is used (highest priority)

// Without startSession in batch
const simpleBatch = client.createBatch().getOffers("homepage", 3)
await simpleBatch.execute("override-789") // Priority 2: Explicit override used
await simpleBatch.execute() // Priority 3: Managed session "auto-session-456" used
```

## Advanced Features

### Custom Session IDs

```typescript
// Use your own session ID for integration with existing systems
const customSessionId = "my-custom-session-123"
const response = await client.startSession(audience, customSessionId)
console.log(response.sessionId) // "my-custom-session-123"
```

### Advanced Session Options

```typescript
// Basic session start
await client.startSession(audience)

// Session with custom ID
await client.startSession(audience, "my-session-123")

// Session without custom ID but with advanced options
await client.startSession(audience, null, {
  relyOnExistingSession: false, // Force new session (default: true)
  debug: true, // Enable debug mode (default: false)
  parameters: [
    // Optional additional parameters
    { n: "pageURL", v: "/homepage", t: "string" },
    { n: "userAgent", v: navigator.userAgent, t: "string" },
  ],
})

// All options combined
await client.startSession(audience, "custom-session-456", {
  relyOnExistingSession: false,
  debug: true,
  parameters: [{ n: "source", v: "mobile-app", t: "string" }],
})
```

### Automatic Session Management

The client automatically manages sessions for you. Just start a session once and use it throughout your workflow:

```typescript
// Start session with audience once
const audience = InteractAudience.customer(InteractParam.create("CustomerID", "67890", InteractParamType.Numeric))
await client.startSession(audience)

// All subsequent calls automatically use the stored session AND stored audience
const offers = await client.getOffers("ProductPage_Sidebar", 2) // ✅ No session/audience needed!
await client.postEvent("product_view") // ✅ Uses stored session & audience automatically

// Even if session expires, it's automatically recovered using the stored audience
const moreOffers = await client.getOffers("HomePage_Hero", 3) // ✅ Auto-recovery works!
```

**Key Benefits:**

- **Stored Session**: Once started, session ID is automatically used
- **Stored Audience**: Audience is remembered for automatic session recovery
- **Auto-Recovery**: If session expires, new session is created automatically with stored audience
- **Zero Configuration**: Just call methods - session management is handled for you

````typescript
### Session Management

The client automatically manages sessions for you, including **automatic session recovery** when sessions expire:

```typescript
// Start session with audience
const audience = InteractAudience.customer(InteractParam.create("CustomerID", "67890", InteractParamType.Numeric))
await client.startSession(audience)

// All subsequent calls use the established session automatically
const offers = await client.getOffers("ProductPage_Sidebar", 2)
await client.postEvent("product_view", [
  InteractParam.create("ProductID", "ABC123", InteractParamType.String).toNameValuePair()
])

// If the session expires on the server, the SDK automatically:
// 1. Detects the session expiration error
// 2. Creates a new session with the same audience
// 3. Retries the original operation seamlessly
// This all happens transparently - your code doesn't need to handle it!
````

#### Session Recovery Features

- **Automatic Detection**: Recognizes server responses indicating session expiration
- **Seamless Recovery**: Automatically starts new session with the stored audience
- **Batch Recovery**: If session expires, prepends `startSession` to the batch and retries
- **No Code Changes**: Existing code continues to work without modification
- **Audience Persistence**: Stores audience configuration for reliable session recovery

#### Session ID Persistence in Batches

**Important**: When using batch operations with `startSession`, the client's session ID is automatically updated:

```typescript
// Create client and execute batch with startSession
const client = new InteractClient({ serverUrl: "..." })

const batchResponse = await client.createBatch().startSession(audience).getOffers("homepage", 3).execute()

// ✅ Client now has the session ID automatically set!
console.log(client.getSessionId()) // Session ID is available

// You can now use the client elsewhere in your application
setState({ client }) // Client retains session for future operations

// Same applies to fluent batch API
await client.executeBatch().startSession(audience) // Client session ID updated automatically
```

#### Session Persistence Across Page Refreshes

**NEW**: The SDK automatically persists sessions using `sessionStorage`, so your sessions survive page refreshes:

```typescript
// Create client - session persistence is enabled by default
const client = new InteractClient({ serverUrl: "..." })

// Start session
await client.startSession(audience)
console.log(client.getSessionId()) // e.g., "ABC123"

// 🔄 User refreshes the page, your app reinitializes...

// Create new client instance after page refresh
const newClient = new InteractClient({ serverUrl: "..." })
console.log(newClient.getSessionId()) // Still "ABC123"! ✅

// Continue using the persisted session
const offers = await newClient.getOffers("homepage", 3) // Works seamlessly!
```

**Configuration Options:**

```typescript
const client = new InteractClient({
  serverUrl: "https://your-server.com/interact",
  persistSession: true, // Default: true
  sessionStorageKey: "my-custom-session-key", // Default: "interact-session"
})

// Disable session persistence
const temporaryClient = new InteractClient({
  serverUrl: "https://your-server.com/interact",
  persistSession: false, // Sessions won't survive page refreshes
})

// Manually clear persisted session
client.clearSession() // Clears both in-memory and persisted session
```

**Features:**

- **Automatic**: Sessions persist across page refreshes by default
- **Secure**: Uses `sessionStorage` (clears when browser tab closes)
- **Configurable**: Custom storage keys, opt-out capability
- **Smart Expiry**: Auto-expires persisted sessions after 30 minutes of inactivity
- **Server-Side Safe**: Gracefully handles SSR environments (no storage available)

```typescript
// Example: Even if session expires between these calls, it's handled automatically
await client.startSession(audience)

// ... time passes, session expires on server ...

// This call will automatically detect expiration, recover session, and succeed
const offers = await client.getOffers("HomePage_Hero", 3)
```

### Advanced Session Management

For advanced scenarios, you still have full control:

```typescript
// Check current session
console.log("Current session:", client.getSessionId())

// Get stored audience for recovery
console.log("Stored audience:", client.getStoredAudience())

// Advanced options for session management
await client.getOffers("HomePage_Hero", 3, {
  autoManageSession: true, // Auto-start session if needed
  audience: myAudience, // Audience for auto-session creation
})

await client.postEvent("purchase", parameters, {
  sessionId: "custom-session-id", // Override stored session
  autoManageSession: true, // Or auto-manage session
  audience: myAudience,
})

// End session manually (optional - server will timeout eventually)
await client.endSession(client.getSessionId())

// Clear session state from client
client.clearSession()
```

#### External Session Management

The SDK supports external session management for scenarios like server-side rendering, custom session stores, or when you need full control over session lifecycle:

```typescript
// Method 1: Start session with external session ID
const customSessionId = "my-custom-session-id"
const audience = InteractClient.createAudience(
  InteractAudienceLevel.Visitor,
  "VisitorID",
  "visitor123",
  InteractParamType.String,
)

// Pass custom session ID as second parameter
await client.startSession(audience, customSessionId)

// The SDK won't automatically store/manage this session
// You must explicitly pass it to subsequent calls
await client.getOffers("HomePage", 3, {
  sessionId: customSessionId,
})

// Method 2: Set external session in SDK for convenience
// Store external session ID in SDK but mark as externally managed
client.setSession(customSessionId, audience, true) // true = externally managed

// Now you can use SDK's convenience without automatic persistence
await client.getOffers("HomePage", 3) // Uses stored external session
await client.postEvent("page_view") // Also uses stored external session

// Method 3: Fully manual control
// Don't store in SDK at all, pass sessionId every time
await client.getOffers("HomePage", 3, { sessionId: customSessionId })
await client.postEvent("purchase", params, { sessionId: customSessionId })

// Comparison: Internal vs External Session Management
//
// Internal (default):
// - SDK stores session in sessionStorage
// - Automatic persistence across page refreshes
// - Automatic session recovery on expiry
// - Best for: Single-page apps, browser-based apps
//
// External:
// - You control the session ID
// - No automatic persistence
// - Session stored in your custom store (Redis, etc.)
// - Best for: Server-side rendering, microservices, custom session stores
```

**When to use External Session Management:**

- **Server-Side Rendering (SSR)**: Session managed by server, passed to client
- **Custom Session Stores**: Using Redis, database, or other session management
- **Microservices**: Session shared across multiple services
- **Testing**: Predictable session IDs for integration tests
- **Multi-Tab Sync**: Custom logic to sync sessions across browser tabs

#### Session Expiration Handling

The SDK automatically handles session expiration responses like this:

```json
{
  "batchStatusCode": 2,
  "responses": [
    {
      "statusCode": 2,
      "messages": [
        {
          "msg": "GetOffer request received an invalid session id: ee9d003d-21ff-46a8-a78b-67d190281f31",
          "msgLevel": 2,
          "msgCode": 1
        }
      ]
    }
  ]
}
```

When this occurs, the SDK:

1. **Detects** the session expiration error
2. **Creates** a new session using the stored audience
3. **Prepends** a `startSession` command to the original batch
4. **Retries** the entire operation seamlessly
5. **Updates** the stored session ID for future calls

**Important: External Session Recovery**

When using external session management (passing explicit `sessionId` to methods), the SDK preserves your session ID during recovery:

```typescript
// Your external session
const mySessionId = "my-custom-session-123"

// Call with external session ID
await client.getOffers("HomePage", 3, {
  sessionId: mySessionId,
  audience: myAudience, // Required for recovery!
})

// If session expires:
// 1. SDK detects expiry
// 2. Creates startSession with YOUR session ID (mySessionId)
// 3. Re-establishes session using same ID
// 4. Retries getOffers automatically
// 5. Your external session ID is preserved throughout
```

**Key Point:** Always provide the `audience` parameter when using external session IDs to enable automatic recovery. Without it, the SDK cannot re-establish the expired session.

````

### Audience Management

```typescript
// ✅ RECOMMENDED: Use createAudience + setAudience directly
const audience = InteractClient.createAudience(
  InteractAudienceLevel.Customer,
  "CustomerID",
  "CUST123",
  InteractParamType.String
)
await client.setAudience(sessionId, audience)  // Direct usage!

// ✅ ALTERNATIVE: Using fluent API
const audience = InteractAudience.customer(InteractParam.string("CustomerID", "CUST123"))
await client.setAudience(sessionId, audience.toAudienceConfig())

// ✅ LOW-LEVEL: Manual NameValuePair array (for advanced cases)
await client.setAudience(sessionId, "Customer", [
  { n: "CustomerID", v: "CUST123", t: "string" },
  { n: "Tenure", v: "24", t: "numeric" },
  { n: "PremiumMember", v: "true", t: "string" },
  { n: "LastLogin", v: "2025-09-03T10:30:00Z", t: "datetime" },
])

// ✅ LEGACY: Backward compatibility (still works)
await client.setAudienceFromConfig(sessionId, audience)
```

### Batch Operations Example

```typescript
const audience = InteractAudience.visitor(InteractParam.create("VisitorID", "0", InteractParamType.String))

// === ONE-LINE BATCH API (New!) ===
// Perfect for simple operations - auto-executes when terminal method is called

// Simple one-line operations with automatic session management
await client.startSession(audience) // Start session once

const offers = await client.executeBatch().getOffers("homepage_hero", 3)
const eventResult = await client.executeBatch().postEvent("page_view")

// Chain with session creation in one line
const sessionAndOffers = await client.executeBatch().startSession(audience).getOffers("homepage_hero", 3) // Auto-executes here

// === TRADITIONAL BATCH API ===
// Best for complex workflows with multiple operations

// Create batch builder, configure multiple operations, then execute
const batch = client.createBatch().getOffers("homepage_hero", 3).postEvent("page_view")

const results = await batch.execute() // Explicit execution step

// Access individual operation results from the batch
console.log("Batch status:", results.batchStatusCode) // Overall batch status
console.log("Number of responses:", results.responses.length) // Should be 2 (getOffers, postEvent)

// The responses array corresponds to the order of operations in your batch:
// [0] = getOffers response
// [1] = postEvent response

const offersResponse = results.responses[0] // getOffers result
const eventResponse = results.responses[1] // postEvent result

// Access offers from the getOffers response
if (offersResponse.offerLists && offersResponse.offerLists.length > 0) {
  const offers = offersResponse.offerLists[0].offers || []
  console.log(`Received ${offers.length} offers:`)

  offers.forEach((offer, index) => {
    console.log(`  ${index + 1}. ${offer.n} (${offer.treatmentCode})`)
  })
} else {
  console.log("No offers received")
} // Check for any errors in individual responses
results.responses.forEach((response, index) => {
  if (response.statusCode !== 0) {
    console.error(`Response ${index} had error:`, response.messages)
  }
})

// Batch with session creation and enhanced options
const advancedBatch = client
  .createBatch()
  .startSession(audience, null, {
    parameters: [InteractClient.createParameter("UACIWaitForSegmentation", "true")],
    relyOnExistingSession: false,
    debug: true,
  })
  .getOffers("homepage_hero", 3)
  .postEvent("page_view", [InteractClient.createParameter("pageType", "homepage")])

const advancedResults = await advancedBatch.execute() // startSession creates the session automatically

// Using custom session ID in batch startSession
const customSessionBatch = client
  .createBatch()
  .startSession(audience, "my-custom-session-123") // Custom session ID
  .getOffers("homepage_hero", 3)
  .postEvent("page_view")

// When startSession has custom session ID, it's used automatically
const customResults = await customSessionBatch.execute() // Custom session ID from startSession is used

// Using existing managed session (no startSession needed)
const existingSessionBatch = client.createBatch().getOffers("homepage_hero", 3).postEvent("page_view")

const existingResults = await existingSessionBatch.execute() // Uses client's managed session automatically

// Override with explicit session ID (when needed)
const overrideResults = await existingSessionBatch.execute("specific-session-id") // Explicit override

// Quick access patterns for batch results
const quickBatch = client.createBatch().getOffers("homepage_hero", 3).postEvent("page_view")
const quickResults = await quickBatch.execute() // Uses managed session automatically

// Direct access to offers (when getOffers is the first operation)
const offers = quickResults.responses[0]?.offerLists?.[0]?.offers || []
console.log(
  "Quick access offers:",
  offers.map(offer => offer.treatmentCode),
)
```

## TypeScript Support

Full TypeScript support with comprehensive type definitions for all APIs, configurations, and responses.

## Framework Agnostic

This SDK is **100% framework-agnostic** and works with:

- **Vanilla JavaScript** (no build tools required - just include the file!)
- **React** (see demo app for React component examples)
- **Vue.js** (works with both Vue 2 and Vue 3)
- **Angular** (compatible with all versions)
- **Node.js** server applications
- **Any JavaScript environment** with `fetch` support

### Browser Compatibility

- **Modern Browsers**: Full ES modules support with native `fetch`
- **Older Browsers**: Use with polyfills for `fetch` and `Promise` if needed
- **Node.js**: Works with Node.js 18+ (has native `fetch`)

### No External Dependencies

The SDK has **zero runtime dependencies** - it only uses:

- Native `fetch` API for HTTP requests
- Standard JavaScript features (ES2020+)
- TypeScript definitions for better development experience

## React Integration Examples

The demo application (`interact-sdk-test/`) showcases production-ready React integration including:

### Performance Metrics Component

Real-time SDK performance tracking with live metrics:

```typescript
import ResponseMetrics, { updateMetrics } from "./ResponseMetrics"

// Track SDK operation performance
const startTime = performance.now()
const response = await client.startSession(audience)
const executionTime = performance.now() - startTime
updateMetrics(response, executionTime)

// Display live metrics
<ResponseMetrics />
```

**Metrics Tracked:**

- Total API requests made
- Success rate percentage
- Average response times
- Total offers received
- Current session details
- Last operation status

### Offer Card Components

Production-ready offer display and interaction tracking:

```typescript
import { OfferCard } from "./OfferCard"
;<OfferCard
  offer={offer}
  client={interactClient}
  autoTrack={true}
  onAccept={offer => console.log("Accepted:", offer)}
  onDismiss={offer => console.log("Dismissed:", offer)}
  onLog={message => console.log(message)}
/>
```

**Features:**

- Automatic contact event tracking (prevents React StrictMode duplicates)
- Accept/Reject event handling
- Customizable styling and actions
- Built-in error handling
- Responsive design

### Contact Event Tracking

Robust event tracking with duplicate prevention:

```typescript
// Global tracking prevents React StrictMode double-firing
const trackedOffers = new Set<string>()

// Auto-track offer display
useEffect(() => {
  const trackingKey = `${offer.treatmentCode}-${clientId}`
  if (!trackedOffers.has(trackingKey)) {
    trackContact(offer)
  }
}, [offer.treatmentCode])
```

## Architecture

### Clean Servlet-Based Design

- Unified servlet API approach
- Consistent response handling across all operations
- Built-in session state management with automatic recovery
- Optimized for performance and reliability

## API Styles

The SDK supports multiple API styles to match your preferences:

### 1. Class-Based Fluent API (Recommended)

Type-safe, modern approach with IntelliSense support:

```typescript
import { InteractClient, InteractAudience, InteractParam, InteractParamType } from "@hcl-cdp-ta/interact-sdk"

// Create audience with fluent API
const audience = new InteractAudience("Visitor", InteractParam.create("VisitorID", "0", InteractParamType.String))

// Alternative factory methods
const visitorAudience = InteractAudience.visitor(InteractParam.create("VisitorID", "0", InteractParamType.String))
const customerAudience = InteractAudience.customer(
  InteractParam.create("CustomerID", "67890", InteractParamType.Numeric),
)

// Start session
await client.startSession(audience)
```

### 2. Static Helper Methods

Simple functions for quick setup:

```typescript
const audience = InteractClient.createAudience("Visitor", "VisitorID", "0", "string")
await client.startSession(audience)
```

### 3. Manual Object Creation

Direct object creation for maximum control:

```typescript
const audience = {
  audienceLevel: "Visitor",
  audienceId: { name: "VisitorID", value: "0", type: "string" },
}
await client.startSession(audience)
```

## API Consistency & Standardization

The SDK provides consistent parameter ordering and format across all audience-related methods:

### Standardized setAudience API

```typescript
// ✅ RECOMMENDED: High-level usage with createAudience
const audience = InteractClient.createAudience(
  InteractAudienceLevel.Customer,    // Consistent parameter order
  "CustomerID",
  "12345",
  InteractParamType.String
)

// Direct usage - no conversion needed!
await client.setAudience(sessionId, audience)

// ✅ Batch operations use the same format
const batch = client.createBatch()
  .setAudienceFromConfig(audience)    // High-level
  .setAudience("Customer", audienceArray)  // Low-level
  .getOffers("homepage", 3)

await batch.execute(sessionId)
```

### Parameter Order Consistency

All audience methods now follow the same logical order:

```typescript
// ✅ Consistent pattern: (level, identifier, value, type)
createAudience(audienceLevel, audienceIdName, audienceIdValue, audienceIdType)
setAudience(sessionId, audienceLevel, audienceID)  // or setAudience(sessionId, audienceConfig)

// ✅ Batch methods match the same pattern
batch.setAudience(audienceLevel, audienceID)
batch.setAudienceFromConfig(audienceConfig)
```

### Migration from Legacy API

```typescript
// ❌ OLD inconsistent way
const audienceID = [{ n: "CustomerID", v: "12345", t: "string" }]
await client.setAudience(sessionId, audienceID, "Customer")  // level at end

// ✅ NEW standardized way (recommended)
const audience = InteractClient.createAudience("Customer", "CustomerID", "12345", InteractParamType.String)
await client.setAudience(sessionId, audience)  // direct usage

// ✅ NEW low-level way (consistent order)
await client.setAudience(sessionId, "Customer", audienceID)  // level comes first
```

## Helper Methods

The SDK provides static helper methods to simplify common tasks:

### createAudience()

Creates an AudienceConfig object that can be used directly with setAudience():

```typescript
import { InteractClient, InteractAudienceLevel, InteractParamType } from "@hcl-cdp-ta/interact-sdk"

// ✅ RECOMMENDED: Using enums for type safety
const audience = InteractClient.createAudience(
  InteractAudienceLevel.Customer,
  "CustomerID",
  "12345",
  InteractParamType.String,
)

// ✅ Direct usage with setAudience (no conversion needed!)
await client.setAudience(sessionId, audience)

// ✅ Works with all audience operations
await client.startSession(audience)
batch.setAudienceFromConfig(audience)

// Type examples with defaults:
const visitorAudience = InteractClient.createAudience(
  InteractAudienceLevel.Visitor,
  "VisitorID",
  "12345"  // type defaults to String
)

const customerAudience = InteractClient.createAudience(
  InteractAudienceLevel.Customer,
  "CustomerID",
  987654,
  InteractParamType.Numeric,
)
  InteractAudienceLevel.Customer,
  "CustomerID",
  987654,
  InteractParamType.Numeric,
)

// Equivalent to manually creating:
const audience = {
  audienceLevel: InteractAudienceLevel.Visitor,
  audienceId: { name: "VisitorID", value: "0", type: InteractParamType.String },
}
```

### createParameter()

Creates a NameValuePair for event parameters:

```typescript
import { InteractClient, InteractParamType } from "@hcl-cdp-ta/interact-sdk"

const param = InteractClient.createParameter("pageURL", "/homepage", InteractParamType.String)
// Returns: { n: "pageURL", v: "/homepage", t: "string" }

// Type examples:
const stringParam = InteractClient.createParameter("customerID", "12345", InteractParamType.String)
const numericParam = InteractClient.createParameter("price", "99.99", InteractParamType.Numeric)
const dateParam = InteractClient.createParameter("purchaseDate", "2024-01-15", InteractParamType.DateTime)
```

### Type-Safe Operations

```typescript
interface AudienceConfig {
  audienceLevel: InteractAudienceLevel | string
  audienceId: NameValuePair
}

interface NameValuePair {
  name: string
  value: string
  type: InteractParamType
}
```

## Error Handling

```typescript
try {
  const response = await client.startSession(audience)
  console.log("Session started:", response.sessionId)
} catch (error) {
  if (error instanceof InteractError) {
    console.error("Interact API Error:", error.message)
    console.error("Status Code:", error.statusCode)
  } else {
    console.error("Network Error:", error)
  }
}
```

## Best Practices

1. **Session Management**: Always call `endSession()` when interaction is complete
2. **Event Tracking**: Use `postEvent()` for automatic session handling
3. **Batch Operations**: Use batch API for multiple operations to reduce network overhead
4. **Performance**: Monitor SDK metrics to optimize API usage patterns
5. **Error Handling**: Implement proper try/catch blocks around all SDK calls
6. **React Integration**: Use the provided components and tracking utilities

## Documentation

- **API Reference**: Full TypeScript definitions included
- **Integration Examples**: Complete demo application with source code
- **Component Library**: React components in `interact-sdk-test/components/`
- **Performance Monitoring**: ResponseMetrics component for real-time tracking
````
