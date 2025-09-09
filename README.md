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
<!-- Load from GitHub -->
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
      } from "https://unpkg.com/@hcl-cdp-ta/interact-sdk/dist/index.js"

      // Or serve the file locally
      // import { InteractClient, InteractAudience, InteractParam } from './node_modules/@hcl-cdp-ta/interact-sdk/dist/index.js'

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
          const audienceFluent = new InteractAudience("Visitor", InteractParam.string("VisitorID", "0"))

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
import { InteractClient, InteractAudience, InteractParam } from "@hcl-cdp-ta/interact-sdk"

// Initialize client
const client = new InteractClient({
  serverUrl: "https://your-interact-server.com/interact",
  interactiveChannel: "web",
})

// Define audience using fluent builders
const audience = InteractAudience.visitor(InteractParam.string("VisitorID", "0"))

// Start session and get offers (client manages session automatically)
const sessionResponse = await client.startSession(audience)
const offersResponse = await client.getOffers("HomePage_Hero", 3)

// Track user events (uses existing session)
await client.postEvent("page_view")
```

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
- `setAudience(sessionId, level, audienceData)` - Set or update audience information
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

- `createBatch()` - Create batch builder for multiple operations
- Execute multiple API calls in a single request for optimal performance

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

````typescript
### Session Management

The client automatically manages sessions for you, including **automatic session recovery** when sessions expire:

```typescript
// Start session with audience
const audience = InteractAudience.customer(InteractParam.numeric("CustomerID", 67890))
await client.startSession(audience)

// All subsequent calls use the established session automatically
const offers = await client.getOffers("ProductPage_Sidebar", 2)
await client.postEvent("product_view", [
  InteractParam.string("ProductID", "ABC123").toNameValuePair()
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

````

### Audience Management

```typescript
// Set comprehensive audience data
await client.setAudience(sessionId, "Customer", [
  { name: "CustomerID", value: "CUST123", type: "string" },
  { name: "Tenure", value: "24", type: "numeric" },
  { name: "PremiumMember", value: "true", type: "boolean" },
  { name: "LastLogin", value: "2025-09-03T10:30:00Z", type: "datetime" },
])
````

### Batch Operations Example

```typescript
const audienceArray = [{ n: "VisitorID", v: "0", t: "string" }]

// Basic batch
const batch = client
  .createBatch()
  .startSession(audienceArray, "Visitor")
  .getOffers("homepage_hero", 3)
  .postEvent("page_view")

const results = await batch.execute(null)

// Batch with advanced session options
const advancedBatch = client
  .createBatch()
  .startSession(
    audienceArray,
    "Visitor",
    [{ n: "source", v: "mobile", t: "string" }], // parameters
    false, // relyOnExistingSession
    true, // debug
  )
  .getOffers("homepage_hero", 3)
  .postEvent("page_view")

const advancedResults = await advancedBatch.execute(null)
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

- Unified servlet API approach (legacy REST API support removed)
- Consistent response handling across all operations
- Built-in session state management
- Optimized for performance and reliability

## API Styles

The SDK supports multiple API styles to match your preferences:

### 1. Class-Based Fluent API (Recommended)

Type-safe, modern approach with IntelliSense support:

```typescript
import { InteractClient, InteractAudience, InteractParam } from "@hcl-cdp-ta/interact-sdk"

// Create audience with fluent API
const audience = new InteractAudience("Visitor", InteractParam.string("VisitorID", "0"))

// Alternative factory methods
const visitorAudience = InteractAudience.visitor(InteractParam.string("VisitorID", "0"))
const customerAudience = InteractAudience.customer(InteractParam.numeric("CustomerID", 67890))

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

## Helper Methods

The SDK provides static helper methods to simplify common tasks:

### createAudience()

Creates an AudienceConfig object with proper typing:

```typescript
// Using the helper method (recommended)
const audience = InteractClient.createAudience("Visitor", "VisitorID", "0", "string")

// Equivalent to manually creating:
const audience = {
  audienceLevel: "Visitor",
  audienceId: { name: "VisitorID", value: "0", type: "string" },
}
```

### createParameter()

Creates a NameValuePair for event parameters:

```typescript
const param = InteractClient.createParameter("pageURL", "/homepage", "string")
// Returns: { n: "pageURL", v: "/homepage", t: "string" }
```

### Type-Safe Operations

```typescript
interface AudienceConfig {
  audienceLevel: "Customer" | "Visitor"
  audienceId: NameValuePair
}

interface NameValuePair {
  name: string
  value: string
  type: "string" | "numeric" | "boolean" | "datetime"
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
2. **Event Tracking**: Use `postEventWithSession()` for automatic session handling
3. **Batch Operations**: Use batch API for multiple operations to reduce network overhead
4. **Performance**: Monitor SDK metrics to optimize API usage patterns
5. **Error Handling**: Implement proper try/catch blocks around all SDK calls
6. **React Integration**: Use the provided components and tracking utilities

## Documentation

- **API Reference**: Full TypeScript definitions included
- **Integration Examples**: Complete demo application with source code
- **Component Library**: React components in `interact-sdk-test/components/`
- **Performance Monitoring**: ResponseMetrics component for real-time tracking
