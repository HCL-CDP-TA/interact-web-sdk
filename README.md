[![Version](https://img.shields.io/github/v/release/HCL-CDP-TA/demo-banking)](https://github.com/HCL-CDP-TA/demo-banking/releases)

# HCL Interact Web SDK

TypeScript SDK for HCL Interact Runtime REST API v2.0.0

## Usage Examples

### Example 1: Complete Web Interaction (Most Common Pattern)

This is the standard pattern for web personalization - get offers for a visitor in a single batch call.

```typescript
const client = createInteractClient({
  baseUrl: "https://your-interact-instance.com/interact/v2",
  username: "your-username",
})

// Single batch call: Start → Get Offers → End
const result = await client.executeCompleteInteraction(
  "web_session_" + Date.now(), // unique session ID
  "WebChannel_IC", // interaction channel
  "Customer", // audience level
  [InteractApiClient.createParameter("CustomerID", "string", "12345")], // audience ID
  "HomePage_IP", // interaction point
  3, // number of offers to request
)

// Extract offers from batch response
const offersResponse = result.responses?.[1] // getOffers is typically the 2nd response
console.log("Offers received:", offersResponse?.offerLists?.[0]?.offers)
```

### Example 2: Interaction with Event Tracking

Track customer behavior and get personalized offers based on that event.

```typescript
const result = await client.executeInteractionWithEvent(
  "session_" + customerId,
  "WebChannel_IC",
  "Customer",
  [InteractApiClient.createParameter("CustomerID", "string", customerId)],
  "ProductView", // event to track
  "ProductPage_IP",
  2,
  {
    eventParameters: [
      InteractApiClient.createParameter("ProductID", "string", "PROD123"),
      InteractApiClient.createParameter("Category", "string", "Electronics"),
    ],
  },
)
```

### Example 3: Multi-Touchpoint Interaction

Get offers for multiple interaction points (e.g., header banner, sidebar, footer) in one call.

```typescript
const result = await client.executeMultiTouchpointInteraction(
  "session_" + Date.now(),
  "WebChannel_IC",
  "Customer",
  [InteractApiClient.createParameter("CustomerID", "string", "67890")],
  [
    { dupPolicy: 0, ip: "Header_Banner_IP", numberRequested: 1 },
    { dupPolicy: 0, ip: "Sidebar_IP", numberRequested: 2 },
    { dupPolicy: 0, ip: "Footer_IP", numberRequested: 1 },
  ],
)

// Each interaction point will have its own offer list in the response
result.responses?.[1]?.offerLists?.forEach(offerList => {
  console.log(`Offers for ${offerList.ip}:`, offerList.offers)
})
```

### Example 4: Advanced Custom Batch with Builder Pattern

For complex scenarios, use the batch builder for full control.

```typescript
const result = await client
  .createBatchBuilder("custom_session_123")
  .startSession("MobileApp_IC", "Customer", [InteractApiClient.createParameter("CustomerID", "string", "CUST456")], {
    debug: true,
  })
  .postEvent("AppLaunch", [
    InteractApiClient.createParameter("AppVersion", "string", "2.1.0"),
    InteractApiClient.createParameter("DeviceType", "string", "iPhone"),
  ])
  .getProfile() // Get customer profile data
  .getOffers("MobileApp_Home_IP", 5) // Get 5 offers for home screen
  .postEvent("OffersDisplayed") // Track that offers were shown
  .endSession()
  .execute()

// Process the sequential responses
console.log("Session started:", result.responses?.[0]?.statusCode === 200)
console.log("Profile data:", result.responses?.[2]?.profile)
console.log("Offers:", result.responses?.[3]?.offerLists?.[0]?.offers)
```

### Example 5: Email Campaign Batch Operation

Typical batch for email marketing campaigns.

```typescript
const emailBatch = await client
  .createBatchBuilder(`email_${campaignId}_${customerId}`)
  .startSession("EmailChannel_IC", "Customer", [
    InteractApiClient.createParameter("CustomerID", "string", customerId),
    InteractApiClient.createParameter("EmailAddress", "string", emailAddress),
  ])
  .postEvent("EmailOpened", [
    InteractApiClient.createParameter("CampaignID", "string", campaignId),
    InteractApiClient.createParameter("Subject", "string", "Special Offers Just for You"),
  ])
  .getOffers("Email_Content_IP", 3)
  .endSession()
  .execute()
```

### Why Use Batch Operations?

1. **Performance**: Single HTTP request instead of 3-4 separate calls
2. **Consistency**: All operations happen in the same context/session
3. **Reduced Latency**: Especially important for real-time web personalization
4. **Atomic Operations**: Either all operations succeed or all fail together
5. **Network Efficiency**: Reduces bandwidth and connection overhead

### Individual API Calls (Use Sparingly)

Individual calls should only be used for:

- Long-running sessions where you need to make incremental calls
- Error recovery scenarios
- Testing and debugging

```typescript
// Individual call example (not recommended for production web flows):
await client.startSession("session123", "WebChannel_IC", "Customer", "CustomerID")
const offers = await client.getOffers("session123", "HomePage_IP")
await client.endSession("session123")
```
