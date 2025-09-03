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
      import { InteractClient } from "https://unpkg.com/@hcl-cdp-ta/interact-sdk/dist/index.js"

      // Or serve the file locally
      // import { InteractClient } from './node_modules/@hcl-cdp-ta/interact-sdk/dist/index.js'

      const client = new InteractClient({
        serverUrl: "https://your-interact-server.com/interact",
        interactiveChannel: "web",
      })

      async function demo() {
        try {
          // Start session
          const audience = {
            audienceLevel: "Visitor",
            audienceId: { name: "VisitorID", value: "12345", type: "string" },
          }

          const sessionResponse = await client.startSession(audience)
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
          const audience = {
            audienceLevel: "Visitor",
            audienceId: { name: "VisitorID", value: "12345", type: "string" },
          }

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
import { InteractClient } from "@hcl-cdp-ta/interact-sdk"

// Initialize client
const client = new InteractClient({
  serverUrl: "https://your-interact-server.com/interact",
  interactiveChannel: "web",
})

// Start session with audience
const audience = {
  audienceLevel: "Visitor",
  audienceId: {
    name: "VisitorID",
    value: "12345",
    type: "string",
  },
}

// Start session (optionally with custom sessionId)
const response = await client.startSession(audience)
const sessionId = response.sessionId

// Set additional audience data
await client.setAudience(sessionId, audience.audienceLevel, [
  { name: "CustomerType", value: "Premium", type: "string" },
])

// Get offers
const offers = await client.getOffers(sessionId, "homepage_hero", 3)

// Track events - multiple ways to use the unified postEvent method

// Method 1: Explicit session ID (backward compatible)
await client.postEvent(sessionId, "page_view")

// Method 2: Auto session management
await client.postEvent("Contact", [{ n: "UACIOfferTrackingCode", v: "OFFER123", t: "string" }], {
  autoManageSession: true,
  audience,
})

// Method 3: Use existing session automatically
await client.postEvent("page_view") // Uses current session

// Method 4: Legacy method (still supported)
await client.postEventWithSession("Contact", [{ n: "UACIOfferTrackingCode", v: "OFFER123", t: "string" }])

// End session
await client.endSession(sessionId)
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

- `startSession(audience, sessionId?)` - Start session with audience config and optional custom session ID
- `setAudience(sessionId, level, audienceData)` - Set or update audience information
- `getSessionId()` - Get current active session ID
- `endSession(sessionId)` - End session and cleanup

### Offers & Content

- `getOffers(sessionId, interactionPoint, count)` - Retrieve personalized offers
- `getProfile(sessionId)` - Get customer profile data

### Event Tracking

- `postEvent(sessionId, eventName, parameters?)` - Track events with explicit session ID
- `postEvent(eventName, parameters?, options?)` - Unified event tracking with flexible session management
  - `options.sessionId` - Explicit session ID to use
  - `options.autoManageSession` - Auto-manage session if no sessionId provided
  - `options.audience` - Audience for auto session creation
- `postEventWithSession(eventName, parameters?, audience?)` - Legacy auto-session method (still supported)

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

### Audience Management

```typescript
// Set comprehensive audience data
await client.setAudience(sessionId, "Customer", [
  { name: "CustomerID", value: "CUST123", type: "string" },
  { name: "Tenure", value: "24", type: "numeric" },
  { name: "PremiumMember", value: "true", type: "boolean" },
  { name: "LastLogin", value: "2025-09-03T10:30:00Z", type: "datetime" },
])
```

### Batch Operations Example

```typescript
const audienceArray = [{ n: "VisitorID", v: "12345", t: "string" }]

const batch = client
  .createBatch()
  .startSession(audienceArray, "Visitor")
  .getOffers("homepage_hero", 3)
  .postEvent("page_view")

const results = await batch.execute(null)
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

## Demo Application

Complete working demo at `interact-sdk-test/` featuring:

- **Configuration Management**: Dynamic server and channel setup
- **Session Workflow**: Start session → Set audience → Get offers → Track events
- **Batch Operations**: Efficient multi-step API operations
- **Offer Display**: Production-ready offer cards with interaction tracking
- **Performance Monitoring**: Real-time SDK metrics and response times
- **Error Handling**: Comprehensive error display and logging
- **TypeScript Integration**: Full type safety throughout

### Running the Demo

```bash
cd interact-sdk-test/
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to explore all SDK features.

## Architecture

### Clean Servlet-Based Design

- Unified servlet API approach (legacy REST API support removed)
- Consistent response handling across all operations
- Built-in session state management
- Optimized for performance and reliability

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
