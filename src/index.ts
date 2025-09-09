// HCL Interact SDK
// Framework-agnostic TypeScript SDK for HCL Interact

// Core client (recommended)
export {
  InteractClient,
  BatchBuilder,
  ExecutableBatchBuilder,
  InteractAudience,
  InteractParam,
} from "./InteractClient.js"
export { InteractParamType, InteractAudienceLevel } from "./InteractClient.js"
export type {
  InteractConfig,
  AudienceConfig,
  SessionState,
  NameValuePair,
  Command,
  Offer,
  OfferAttribute,
  OfferList,
  InteractResponse,
  BatchResponse,
} from "./InteractClient.js"

// Servlet client (for direct servlet API access)
export { InteractServletClient } from "./InteractServletClient.js"

// Type exports
export * from "./Types.js"
export { default as InteractError } from "./InteractError.js"

// Default export
export { InteractClient as default } from "./InteractClient.js"
