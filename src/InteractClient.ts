// HCL Interact SDK - Servlet API Compatible
// Clean, opinionated TypeScript client with React integration

import InteractApiError from "./InteractError"

// Enums for type safety
export enum InteractParamType {
  String = "string",
  Numeric = "numeric",
  DateTime = "datetime",
}

export enum InteractAudienceLevel {
  Visitor = "Visitor",
  Customer = "Customer",
}

// Class-based builders for fluent API
export class InteractParam {
  public readonly name: string
  public readonly value: string | number
  public readonly type: InteractParamType

  constructor(options: { name: string; value: string | number; type?: InteractParamType }) {
    this.name = options.name
    this.value = options.value
    this.type = options.type || InteractParamType.String
  }

  // Static factory methods for convenience
  static string(name: string, value: string): InteractParam {
    return new InteractParam({ name, value, type: InteractParamType.String })
  }

  static numeric(name: string, value: number): InteractParam {
    return new InteractParam({ name, value, type: InteractParamType.Numeric })
  }

  static dateTime(name: string, value: string): InteractParam {
    return new InteractParam({ name, value, type: InteractParamType.DateTime })
  }

  // Convert to internal format
  toNameValuePair(): { name: string; value: string | number; type: "string" | "numeric" | "datetime" } {
    return {
      name: this.name,
      value: this.value,
      type: this.type as "string" | "numeric" | "datetime",
    }
  }
}

export class InteractAudience {
  public readonly audienceLevel: string
  public readonly audienceId: InteractParam

  constructor(audienceLevel: string, audienceId: InteractParam) {
    this.audienceLevel = audienceLevel
    this.audienceId = audienceId
  }

  // Static factory methods for common audience levels
  static visitor(audienceId: InteractParam): InteractAudience {
    return new InteractAudience(InteractAudienceLevel.Visitor, audienceId)
  }

  static customer(audienceId: InteractParam): InteractAudience {
    return new InteractAudience(InteractAudienceLevel.Customer, audienceId)
  }

  // Convert to internal format
  toAudienceConfig(): AudienceConfig {
    return {
      audienceLevel: this.audienceLevel,
      audienceId: this.audienceId.toNameValuePair(),
    }
  }
}

export interface InteractConfig {
  serverUrl: string // e.g., "https://your-server.com/interact"
  interactiveChannel?: string // defaults to "_RealTimePersonalization_"
  username?: string
  password?: string
  enableLogging?: boolean
  persistSession?: boolean // Enable session persistence across page refreshes (default: true)
  sessionStorageKey?: string // Key for sessionStorage (default: "interact-session")
  sessionExpiryMinutes?: number // Minutes until persisted session expires (default: 30)
}

export interface AudienceConfig {
  audienceLevel: InteractAudienceLevel | string
  audienceId: {
    name: string
    value: string | number
    type: "string" | "numeric" | "datetime"
  }
}

export interface SessionState {
  sessionId: string | null
  isValid: boolean
  lastActivity: Date
  audience?: AudienceConfig // Store audience for session recovery
}

export interface InteractMessage {
  msg: string
  detailMsg: string
  msgLevel: number
  msgCode: number
}

export interface NameValuePair {
  n: string
  v: any
  t: "string" | "numeric" | "datetime"
}

export interface Command {
  action: string
  ic?: string // interactive channel
  audienceID?: NameValuePair[] // array of name/value/type objects
  audienceLevel?: string
  parameters?: NameValuePair[]
  relyOnExistingSession?: boolean
  debug?: boolean
  ip?: string // interaction point
  numberRequested?: number
  event?: string
  getOfferRequests?: any[]
  customSessionId?: string | null // For startSession commands with custom session ID
}

export interface OfferAttribute {
  n: string // name
  v: any // value
  t: string // type
}

export interface Offer {
  n: string // offer name
  code: string[] // offer codes (array)
  treatmentCode: string
  score: number
  desc: string // description
  attributes: OfferAttribute[]
}

export interface OfferList {
  interactionPointName: string
  defaultString: string
  offers: Offer[]
}

export interface InteractResponse {
  sessionId?: string
  statusCode: number
  offerLists?: OfferList[]
  profile?: NameValuePair[]
  version?: string
  messages?: InteractMessage[]
  // Synthetic response properties (added by SDK optimization)
  _synthetic?: boolean
  _filteredCommand?: string
}

export interface BatchResponse {
  batchStatusCode: number
  responses: InteractResponse[]
}

export class InteractClient {
  private config: InteractConfig
  private tokenId: string | null = null
  private sessionState: SessionState = {
    sessionId: null,
    isValid: false,
    lastActivity: new Date(),
    audience: undefined,
  }

  constructor(config: InteractConfig) {
    this.config = {
      ...config,
      interactiveChannel: config.interactiveChannel || "_RealTimePersonalization_",
      persistSession: config.persistSession !== false, // Default to true
      sessionStorageKey: config.sessionStorageKey || "interact-session",
      sessionExpiryMinutes: config.sessionExpiryMinutes || 30, // Default to 30 minutes
    }

    // Load persisted session on initialization
    this.loadPersistedSession()
  }

  // Session persistence methods
  private isBrowser(): boolean {
    return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined"
  }

  private saveSessionToStorage(): void {
    if (!this.config.persistSession || !this.isBrowser()) return

    try {
      const sessionData = {
        sessionId: this.sessionState.sessionId,
        audience: this.sessionState.audience,
        lastActivity: this.sessionState.lastActivity.toISOString(),
        interactiveChannel: this.config.interactiveChannel,
      }
      window.sessionStorage.setItem(this.config.sessionStorageKey!, JSON.stringify(sessionData))
    } catch (error) {
      console.warn("Failed to save session to storage:", error)
    }
  }

  private loadPersistedSession(): void {
    if (!this.config.persistSession || !this.isBrowser()) return

    try {
      const stored = window.sessionStorage.getItem(this.config.sessionStorageKey!)
      if (stored) {
        const sessionData = JSON.parse(stored)

        // Only restore if the session is recent (within configured expiry time)
        const lastActivity = new Date(sessionData.lastActivity)
        const expiryTime = new Date(Date.now() - this.config.sessionExpiryMinutes! * 60 * 1000)

        if (lastActivity > expiryTime && sessionData.sessionId) {
          this.sessionState = {
            sessionId: sessionData.sessionId,
            isValid: true,
            lastActivity: lastActivity,
            audience: sessionData.audience,
          }
        }
      }
    } catch (error) {
      console.warn("Failed to load persisted session:", error)
    }
  }

  private clearPersistedSession(): void {
    if (!this.config.persistSession || !this.isBrowser()) return

    try {
      window.sessionStorage.removeItem(this.config.sessionStorageKey!)
    } catch (error) {
      console.warn("Failed to clear persisted session:", error)
    }
  }

  // Helper to convert AudienceConfig to NameValuePair array
  private convertAudienceToArray(audience: AudienceConfig): NameValuePair[] {
    return [
      {
        n: audience.audienceId.name,
        v: audience.audienceId.value,
        t: audience.audienceId.type,
      },
    ]
  }

  // Public helper for users who need to create audience arrays manually
  static convertAudienceToArray(audience: AudienceConfig): NameValuePair[] {
    return [
      {
        n: audience.audienceId.name,
        v: audience.audienceId.value,
        t: audience.audienceId.type,
      },
    ]
  }

  // Session management methods
  getSessionId(): string | null {
    return this.sessionState.sessionId
  }

  setSessionId(sessionId: string | null): void {
    this.sessionState.sessionId = sessionId
    this.sessionState.isValid = !!sessionId
    this.sessionState.lastActivity = new Date()

    // Persist session to storage
    if (sessionId) {
      this.saveSessionToStorage()
    } else {
      this.clearPersistedSession()
    }
  }

  // Set both session and audience for session recovery
  setSession(sessionId: string | null, audience?: AudienceConfig): void {
    this.sessionState.sessionId = sessionId
    this.sessionState.isValid = !!sessionId
    this.sessionState.lastActivity = new Date()
    if (audience) {
      this.sessionState.audience = audience
    }

    // Persist session to storage
    if (sessionId) {
      this.saveSessionToStorage()
    } else {
      this.clearPersistedSession()
    }
  }

  // Get stored audience for session recovery
  getStoredAudience(): AudienceConfig | undefined {
    return this.sessionState.audience
  }

  isSessionValid(): boolean {
    return this.sessionState.isValid && !!this.sessionState.sessionId
  }

  // Public method for batch builders to check if logging is enabled
  isLoggingEnabled(): boolean {
    return !!this.config.enableLogging
  }

  // Check if we have a valid session that doesn't need startSession
  private shouldSkipStartSession(): boolean {
    if (!this.isSessionValid()) return false

    // Check if session hasn't expired based on last activity
    const now = new Date()
    const expiryTime = new Date(
      this.sessionState.lastActivity.getTime() + this.config.sessionExpiryMinutes! * 60 * 1000,
    )

    return now < expiryTime
  }

  clearSession(): void {
    this.sessionState = {
      sessionId: null,
      isValid: false,
      lastActivity: new Date(),
      audience: undefined,
    }
    this.clearPersistedSession()
  }

  // Helper methods for default audience configurations
  static createVisitorAudience(visitorId: string = "0"): AudienceConfig {
    return {
      audienceLevel: InteractAudienceLevel.Visitor,
      audienceId: {
        name: "VisitorID",
        value: visitorId,
        type: "string",
      },
    }
  }

  static createCustomerAudience(customerId: number): AudienceConfig {
    return {
      audienceLevel: InteractAudienceLevel.Customer,
      audienceId: {
        name: "CustomerID",
        value: customerId,
        type: "numeric",
      },
    }
  }

  // Helper method to check if a single message is a recoverable session error
  private isRecoverableSessionError(message: string): boolean {
    const msgLower = message.toLowerCase()
    return (
      msgLower.includes("request received an invalid session id") ||
      msgLower.includes("session expired") ||
      msgLower.includes("session timeout") ||
      msgLower.includes("session has expired")
    )
  }

  // Check if response indicates session is invalid or expired
  // Made public so batch builders can use it for session recovery
  isSessionInvalid(response: BatchResponse): boolean {
    // Check for specific session-related error messages
    const found =
      response.responses?.some(r => {
        return (
          r.messages?.some(m => {
            if (m.msgLevel === 2 && m.msgCode === 1) {
              return this.isRecoverableSessionError(m.msg)
            }
            return false
          }) || false
        )
      }) || false

    return found
  }

  // Check for non-recoverable errors and throw immediately (fail fast)
  // Only session-related errors are recoverable, everything else should fail fast
  private checkForNonRecoverableErrors(response: BatchResponse): void {
    // Check each error message individually - if ANY error is non-recoverable, fail fast
    for (const r of response.responses || []) {
      for (const m of r.messages || []) {
        if (m.msgLevel === 2) {
          // If this error is NOT recoverable, fail fast immediately
          if (!this.isRecoverableSessionError(m.msg)) {
            throw new InteractApiError(400, "Configuration Error", m.msg)
          }
        }
      }
    }
  }

  // Execute batch with automatic session retry and recovery
  async executeBatchWithRetry(
    sessionId: string | null,
    commands: Command[],
    audience?: AudienceConfig | undefined,
    maxRetries: number = 1,
  ): Promise<BatchResponse> {
    let currentSessionId = sessionId || this.sessionState.sessionId
    let attempt = 0

    while (attempt <= maxRetries) {
      try {
        const response = await this._executeBatch(currentSessionId, commands)

        // Find the first real (non-synthetic) response
        const realResponse = response.responses?.find(r => !r._synthetic) || response.responses?.[0]

        // Update session ID if returned
        if (realResponse?.sessionId) {
          // Check if commands had a startSession with custom sessionId
          const startSessionCmd = commands.find(cmd => cmd.action === "startSession")
          const customSessionId = startSessionCmd?.customSessionId

          // Use custom sessionId if provided, otherwise use server response
          const sessionIdToStore = customSessionId !== undefined ? customSessionId : realResponse.sessionId
          // Store both session ID and audience for future recovery
          this.setSession(sessionIdToStore, audience)
        }

        // If session is invalid and we can retry, attempt recovery
        if (this.isSessionInvalid({ ...response, responses: [realResponse] }) && attempt < maxRetries) {
          if (this.config.enableLogging) {
            console.warn("Session expired, recovering with new session and retrying batch...")
          }

          this.clearSession()

          if (audience && "audienceLevel" in audience) {
            if (this.config.enableLogging) {
              console.log("Session recovery: Starting new session with audience:", audience.audienceLevel)
            }

            // Check if original commands had a startSession with custom sessionId and IC
            const originalStartSession = commands.find(cmd => cmd.action === "startSession")
            const customSessionId = originalStartSession?.customSessionId
            const originalIC = originalStartSession?.ic || this.config.interactiveChannel

            const recoveryStartSession: Command = {
              action: "startSession",
              ic: originalIC, // Preserve original IC
              audienceID: this.convertAudienceToArray(audience),
              audienceLevel: audience.audienceLevel,
              relyOnExistingSession: false, // Force new session since old one expired
            }

            // Preserve custom sessionId if it existed
            if (customSessionId !== undefined) {
              recoveryStartSession.customSessionId = customSessionId
            }

            const recoveryCommands: Command[] = [
              recoveryStartSession,
              ...commands.filter(cmd => cmd.action !== "startSession"), // Add non-startSession commands
            ]

            if (this.config.enableLogging) {
              console.log("Executing recovery batch with startSession + original commands...")
            }

            // Execute the recovery batch (use null sessionId to let startSession create new one)
            const recoveryResponse = await this._executeBatch(null, recoveryCommands)

            // Update session ID from the startSession response
            if (recoveryResponse.responses?.[0]?.sessionId) {
              // Use custom sessionId if provided, otherwise use server response
              const sessionIdToStore =
                customSessionId !== undefined ? customSessionId : recoveryResponse.responses[0].sessionId
              // Store both session and audience for future recovery
              this.setSession(sessionIdToStore, audience)

              if (this.config.enableLogging) {
                console.log(`Session recovered: ${currentSessionId} -> ${sessionIdToStore}`)
              }
            }

            // Return the recovery response (which includes results from all commands)
            return recoveryResponse
          } else {
            if (this.config.enableLogging) {
              console.error("❌ Session recovery failed: No audience configuration available")
              console.error("   - Invalid session ID:", currentSessionId)
              console.error("   - Stored audience:", this.getStoredAudience())
              console.error("   - Session state:", {
                sessionId: this.sessionState.sessionId,
                isValid: this.sessionState.isValid,
                hasAudience: !!this.sessionState.audience,
                lastActivity: this.sessionState.lastActivity,
              })
              console.error("   - This usually means the session was set externally without storing audience")
              console.error("   - Solutions:")
              console.error("     1. Call startSession(audience) instead of setSessionId()")
              console.error("     2. Provide audience parameter to getOffers()")
              console.error("     3. Call setSession(sessionId, audience) to store both")
            }

            throw new Error(
              "Cannot recover session: no audience configuration provided. " +
                "This usually happens when the session expired and no audience was stored. " +
                "Try calling startSession(audience) first or provide an audience parameter.",
            )
          }
        }

        // If this was a successful response or no retry needed, return it
        return response
      } catch (error) {
        if (attempt >= maxRetries) {
          throw error
        }
        attempt++
      }
    }

    throw new Error("Max retries exceeded")
  }

  // Core batch execution - the main method for all API calls
  async _executeBatch(sessionId: string | null, commands: Command[]): Promise<BatchResponse> {
    const url = `${this.config.serverUrl}/servlet/RestServlet`

    const headers: Record<string, string> = {
      "Content-Type": "application/json; charset=utf-8",
    }

    // Handle authentication
    if (this.tokenId) {
      headers["m_tokenId"] = this.tokenId
    } else if (this.config.username) {
      headers["m_user_name"] = encodeURIComponent(this.config.username)
      headers["m_user_password"] = encodeURIComponent(this.config.password || "")
    }

    // Filter out startSession commands if we already have a valid session
    // BUT: if sessionId is null, it means we want to create a fresh session (like during recovery)
    // Track filtered command positions for synthetic response injection
    const filteredCommandsInfo: { command: Command; originalIndex: number }[] = []
    const filteredCommands: Command[] = []

    if (sessionId !== null && this.shouldSkipStartSession()) {
      commands.forEach((cmd, index) => {
        if (cmd.action === "startSession") {
          filteredCommandsInfo.push({ command: cmd, originalIndex: index })
        } else {
          filteredCommands.push(cmd)
        }
      })
    } else {
      // No filtering, keep all commands
      commands.forEach(cmd => filteredCommands.push(cmd))
    }

    // If all commands were filtered out, return empty success response
    if (filteredCommands.length === 0) {
      return {
        batchStatusCode: 200,
        responses: [],
      }
    }

    // Build request body - only include sessionId if it's not null
    const requestBody: any = {
      commands: filteredCommands.map(cmd => {
        // Remove internal-only fields before sending to server
        // customSessionId is used internally for session management but not recognized by server
        const { customSessionId, ...serverCommand } = cmd
        return serverCommand
      }),
    }

    // Use existing session ID if we filtered out startSession commands
    const effectiveSessionId =
      filteredCommandsInfo.length > 0 && this.shouldSkipStartSession() ? this.getSessionId() : sessionId

    // Only include sessionId if we have one, let server generate one if null
    if (effectiveSessionId !== null) {
      requestBody.sessionId = effectiveSessionId
    }

    const requestBodyString = JSON.stringify(requestBody)

    if (this.config.enableLogging) {
      console.log("Interact Request:", requestBodyString)
    }

    try {
      const response = await fetch(url, {
        method: "POST",
        headers,
        body: requestBodyString,
      })

      // Handle token response
      const responseTokenId = response.headers.get("m_tokenId")
      if (responseTokenId) {
        this.tokenId = responseTokenId
      }

      const responseData = await response.json()

      if (response.status === 200) {
        if (this.config.enableLogging) {
          console.log("Interact Response:", responseData)
        }

        // Inject synthetic responses for filtered startSession commands
        if (filteredCommandsInfo.length > 0) {
          const syntheticResponses = filteredCommandsInfo.map(({ command, originalIndex }) => ({
            statusCode: 0,
            sessionId: this.getSessionId(),
            messages: [],
            _synthetic: true, // Mark as synthetic response
            _filteredCommand: command.action, // Identify which command was filtered
          }))

          // Reconstruct response array with synthetic responses at correct positions
          const reconstructedResponses: any[] = []
          let serverResponseIndex = 0

          for (let i = 0; i < commands.length; i++) {
            const filteredInfo = filteredCommandsInfo.find(info => info.originalIndex === i)
            if (filteredInfo) {
              // Insert synthetic response for filtered command
              const syntheticResponse = syntheticResponses.find(
                resp => resp._filteredCommand === filteredInfo.command.action,
              )
              reconstructedResponses.push(syntheticResponse)
            } else {
              // Insert actual server response
              if (serverResponseIndex < responseData.responses.length) {
                reconstructedResponses.push(responseData.responses[serverResponseIndex])
                serverResponseIndex++
              }
            }
          }

          const reconstructedResponse = {
            ...responseData,
            responses: reconstructedResponses,
          }

          // Check for non-recoverable errors and fail fast
          this.checkForNonRecoverableErrors(reconstructedResponse)

          return reconstructedResponse
        }

        // Check for non-recoverable errors and fail fast
        this.checkForNonRecoverableErrors(responseData)

        return responseData
      } else {
        throw new Error(`Interact API error: ${response.status}`)
      }
    } catch (error) {
      if (this.config.enableLogging) {
        console.error("Interact API error:", error)
      }
      throw error
    }
  }

  // Convenience methods for common operations
  // Low-level session start with full control
  async startSessionLowLevel(
    sessionId: string | null,
    audienceID: NameValuePair[],
    audienceLevel: string,
    parameters?: NameValuePair[],
    relyOnExistingSession: boolean = true,
    debug: boolean = false,
  ): Promise<InteractResponse> {
    const commands: Command[] = [
      {
        action: "startSession",
        ic: this.config.interactiveChannel,
        audienceID,
        audienceLevel,
        parameters,
        relyOnExistingSession,
        debug,
      },
    ]

    const batchResponse = await this._executeBatch(sessionId, commands)
    return this.extractFirstResponse(batchResponse)
  }

  // Main session start method with audience config and optional sessionId
  // Method overloads for startSession
  async startSession(audience: AudienceConfig, sessionId?: string | null): Promise<InteractResponse>
  async startSession(audience: InteractAudience, sessionId?: string | null): Promise<InteractResponse>
  async startSession(
    audience: AudienceConfig | InteractAudience,
    sessionId?: string | null,
    options?: {
      parameters?: NameValuePair[]
      relyOnExistingSession?: boolean
      debug?: boolean
    },
  ): Promise<InteractResponse>

  // Implementation handles all signatures
  async startSession(
    audience: AudienceConfig | InteractAudience,
    sessionId?: string | null,
    options?: {
      parameters?: NameValuePair[]
      relyOnExistingSession?: boolean
      debug?: boolean
    },
  ): Promise<InteractResponse> {
    // Convert InteractAudience to AudienceConfig if needed
    const audienceConfig = audience instanceof InteractAudience ? audience.toAudienceConfig() : audience

    // Skip startSession if we already have a valid session and no custom sessionId
    if (!sessionId && this.shouldSkipStartSession()) {
      // Update stored audience and return mock response
      this.sessionState.audience = audienceConfig
      this.sessionState.lastActivity = new Date()
      this.saveSessionToStorage()

      return {
        sessionId: this.sessionState.sessionId!,
        statusCode: 200,
        offerLists: [],
        profile: [],
        version: "2.4.1",
        messages: [],
      }
    }

    const audienceIdArray = this.convertAudienceToArray(audienceConfig)
    const response = await this.startSessionLowLevel(
      sessionId ?? null,
      audienceIdArray,
      audienceConfig.audienceLevel,
      options?.parameters,
      options?.relyOnExistingSession ?? true,
      options?.debug ?? false,
    )

    if (response.sessionId) {
      // Use custom sessionId if provided, otherwise use server response
      const sessionIdToStore = sessionId !== undefined && sessionId !== null ? sessionId : response.sessionId
      // Store both session and audience for session recovery
      this.setSession(sessionIdToStore, audienceConfig)
    }

    return response
  }

  // Get offers with automatic session management
  async getOffers(
    interactionPoint: string,
    numberRequested: number = 1,
    options?: {
      sessionId?: string
      autoManageSession?: boolean
      audience?: AudienceConfig
    },
  ): Promise<InteractResponse> {
    if (this.config.enableLogging) {
      console.log("🚨🚨🚨 ENHANCED getOffers method called! 🚨🚨🚨")
    }

    const { sessionId: explicitSessionId, autoManageSession = true, audience } = options || {}

    let sessionId = explicitSessionId || this.getSessionId()

    // Don't start sessions preemptively - always try the request first
    // Let the retry logic in executeBatchWithRetry handle session recovery if needed
    if (!sessionId) {
      throw new Error(
        "No session available. Start a session first with startSession(audience) or provide audience parameter.",
      )
    }

    const commands: Command[] = [
      {
        action: "getOffers",
        ip: interactionPoint,
        numberRequested,
      },
    ]

    // Use provided audience or fall back to stored audience for session recovery
    const recoveryAudience = audience || this.getStoredAudience()

    if (this.config.enableLogging && !recoveryAudience) {
      console.warn("⚠️ getOffers: No recovery audience available - session recovery will fail if session is invalid")
    }

    const batchResponse = await this.executeBatchWithRetry(sessionId, commands, recoveryAudience)

    return this.extractFirstResponse(batchResponse)
  }

  // Post event with automatic session management
  async postEvent(
    eventName: string,
    parameters?: NameValuePair[],
    options?: {
      sessionId?: string
      autoManageSession?: boolean
      audience?: AudienceConfig
    },
  ): Promise<InteractResponse> {
    const { sessionId: explicitSessionId, autoManageSession = true, audience } = options || {}

    let sessionId = explicitSessionId || this.getSessionId()

    // Auto-manage session if enabled and no session exists
    if (!sessionId && autoManageSession) {
      // Use provided audience or fall back to stored audience
      const targetAudience = audience || this.getStoredAudience()
      if (targetAudience) {
        const sessionResponse = await this.startSession(targetAudience)
        sessionId = sessionResponse.sessionId || null
      }
    }

    if (!sessionId) {
      throw new Error(
        "No session available. Start a session first with startSession(audience) or provide audience parameter.",
      )
    }

    const commands: Command[] = [
      {
        action: "postEvent",
        event: eventName,
        parameters,
      },
    ]

    // Use provided audience or fall back to stored audience for session recovery
    const recoveryAudience = audience || this.getStoredAudience()
    const batchResponse = await this.executeBatchWithRetry(sessionId, commands, recoveryAudience)
    return this.extractFirstResponse(batchResponse)
  }

  async getVersion(): Promise<InteractResponse> {
    const commands: Command[] = [
      {
        action: "getVersion",
      },
    ]

    const batchResponse = await this._executeBatch(null, commands)
    return this.extractFirstResponse(batchResponse)
  }

  async endSession(sessionId: string): Promise<InteractResponse> {
    const commands: Command[] = [
      {
        action: "endSession",
      },
    ]

    const batchResponse = await this._executeBatch(sessionId, commands)

    // Clear session state and persisted session
    this.setSessionId(null)

    return this.extractFirstResponse(batchResponse)
  }

  // Set audience with manual NameValuePair array (low-level)
  async setAudience(sessionId: string, audienceLevel: string, audienceID: NameValuePair[]): Promise<InteractResponse>
  // Set audience from AudienceConfig (recommended - consistent with createAudience format)
  async setAudience(sessionId: string, audience: AudienceConfig): Promise<InteractResponse>
  async setAudience(
    sessionId: string,
    audienceLevelOrConfig: string | AudienceConfig,
    audienceID?: NameValuePair[],
  ): Promise<InteractResponse> {
    let audienceLevel: string
    let audienceIDArray: NameValuePair[]

    if (typeof audienceLevelOrConfig === "string") {
      // Low-level usage: setAudience(sessionId, audienceLevel, audienceID)
      audienceLevel = audienceLevelOrConfig
      audienceIDArray = audienceID!
    } else {
      // High-level usage: setAudience(sessionId, audienceConfig)
      const audience = audienceLevelOrConfig
      audienceLevel = audience.audienceLevel
      audienceIDArray = this.convertAudienceToArray(audience)
    }

    const commands: Command[] = [
      {
        action: "setAudience",
        audienceID: audienceIDArray,
        audienceLevel,
      },
    ]

    const batchResponse = await this._executeBatch(sessionId, commands)
    const response = this.extractFirstResponse(batchResponse)

    // Update the current session ID if the command was successful
    if (response.sessionId) {
      this.setSessionId(response.sessionId)
    }

    return response
  }

  // Legacy method for backward compatibility
  async setAudienceFromConfig(sessionId: string, audience: AudienceConfig): Promise<InteractResponse> {
    return this.setAudience(sessionId, audience)
  }

  // Batch builder for complex workflows
  createBatch(): BatchBuilder {
    return new BatchBuilder(this)
  }

  // Complete workflow methods
  async getOffersForPage(
    interactionPoint: string,
    audience: AudienceConfig,
    numberRequested: number = 1,
    trackPageView: boolean = true,
  ): Promise<{ offers: Offer[]; sessionId: string }> {
    const batch = this.createBatch()

    // Always start with session
    const audienceIdArray = this.convertAudienceToArray(audience)
    batch.startSession(audienceIdArray, audience.audienceLevel)

    // Track page view if requested
    if (trackPageView) {
      batch.postEvent("page_view")
    }

    // Get offers
    batch.getOffers(interactionPoint, numberRequested)

    const results = await batch.execute(null)

    // Extract session ID and offers
    const sessionId = results.responses?.[0]?.sessionId
    if (sessionId) {
      this.setSessionId(sessionId)
    }

    const offersResponse = results.responses?.find(r => r.offerLists && r.offerLists.length > 0)
    const offers = offersResponse?.offerLists?.[0]?.offers || []

    return {
      offers,
      sessionId: sessionId || this.getSessionId() || "",
    }
  }

  // Helper methods
  static createParameter(name: string, value: any, type: InteractParamType = InteractParamType.String): NameValuePair {
    return { n: name, v: value, t: type }
  }

  static createAudience(
    audienceLevel: InteractAudienceLevel | string,
    audienceIdName: string,
    audienceIdValue: string | number,
    audienceIdType: InteractParamType = InteractParamType.String,
  ): AudienceConfig {
    return {
      audienceLevel,
      audienceId: {
        name: audienceIdName,
        value: audienceIdValue,
        type: audienceIdType,
      },
    }
  }

  // One-line batch execution with fluent API
  executeBatch(sessionId?: string | null): ExecutableBatchBuilder {
    return new ExecutableBatchBuilder(this, sessionId, this.config.interactiveChannel)
  }

  private extractFirstResponse(batchResponse: BatchResponse): InteractResponse {
    if (batchResponse.responses && batchResponse.responses.length >= 1) {
      // Skip synthetic responses and return the first real server response
      const realResponse = batchResponse.responses.find(r => !r._synthetic)
      if (realResponse) return realResponse
      // If all are synthetic, just return the first (should not happen in normal use)
      return batchResponse.responses[0]
    }
    throw new Error("No response in batch")
  }
}

// Fluent batch builder for complex workflows
export class BatchBuilder {
  private client: InteractClient
  private commands: Command[] = []

  constructor(client: InteractClient) {
    this.client = client
  }

  // Method overloads for startSession (matching main client)
  startSession(audience: AudienceConfig, sessionId?: string | null): BatchBuilder
  startSession(audience: InteractAudience, sessionId?: string | null): BatchBuilder
  startSession(
    audience: AudienceConfig | InteractAudience,
    sessionId?: string | null,
    options?: {
      parameters?: NameValuePair[]
      relyOnExistingSession?: boolean
      debug?: boolean
    },
  ): BatchBuilder
  startSession(
    audienceID: NameValuePair[],
    audienceLevel: string,
    parameters?: NameValuePair[],
    relyOnExistingSession?: boolean,
    debug?: boolean,
  ): BatchBuilder
  startSession(
    audienceOrArray: AudienceConfig | InteractAudience | NameValuePair[],
    sessionIdOrAudienceLevelOrOptions?:
      | string
      | null
      | {
          parameters?: NameValuePair[]
          relyOnExistingSession?: boolean
          debug?: boolean
        },
    parametersOrOptions?:
      | NameValuePair[]
      | {
          parameters?: NameValuePair[]
          relyOnExistingSession?: boolean
          debug?: boolean
        },
    relyOnExistingSession: boolean = true,
    debug: boolean = false,
  ): BatchBuilder {
    // Handle new signature with AudienceConfig/InteractAudience
    if (!Array.isArray(audienceOrArray)) {
      const audience =
        audienceOrArray instanceof InteractAudience
          ? (audienceOrArray as InteractAudience).toAudienceConfig()
          : (audienceOrArray as AudienceConfig)

      // Check if second parameter is sessionId (string/null) or options (object)
      let sessionId: string | null = null
      let options: { parameters?: NameValuePair[]; relyOnExistingSession?: boolean; debug?: boolean } = {}

      if (typeof sessionIdOrAudienceLevelOrOptions === "string" || sessionIdOrAudienceLevelOrOptions === null) {
        sessionId = sessionIdOrAudienceLevelOrOptions
        options = (parametersOrOptions as any) || {}
      } else {
        options = (sessionIdOrAudienceLevelOrOptions as any) || {}
      }

      const audienceIdArray = this.client["convertAudienceToArray"](audience)
      this.commands.push({
        action: "startSession",
        ic: this.client["config"].interactiveChannel,
        audienceID: audienceIdArray,
        audienceLevel: audience.audienceLevel,
        parameters: options.parameters,
        relyOnExistingSession: options.relyOnExistingSession ?? true,
        debug: options.debug ?? false,
        customSessionId: sessionId, // Store custom session ID for special handling
      })
      return this
    }

    // Handle legacy signature with NameValuePair[]
    const audienceID = audienceOrArray as NameValuePair[]
    const audienceLevel = sessionIdOrAudienceLevelOrOptions as string
    const parameters = parametersOrOptions as NameValuePair[]

    this.commands.push({
      action: "startSession",
      ic: this.client["config"].interactiveChannel,
      audienceID,
      audienceLevel,
      parameters,
      relyOnExistingSession,
      debug,
    })
    return this
  }

  getOffers(
    interactionPoint: string,
    numberRequested: number = 1,
    options?: {
      sessionId?: string
      autoManageSession?: boolean
      audience?: AudienceConfig
    },
  ): BatchBuilder {
    this.commands.push({
      action: "getOffers",
      ip: interactionPoint,
      numberRequested,
    })
    return this
  }

  postEvent(
    eventName: string,
    parameters?: NameValuePair[],
    options?: {
      sessionId?: string
      autoManageSession?: boolean
      audience?: AudienceConfig
    },
  ): BatchBuilder {
    this.commands.push({
      action: "postEvent",
      event: eventName,
      parameters,
    })
    return this
  }

  endSession(): BatchBuilder {
    this.commands.push({
      action: "endSession",
    })
    return this
  }

  // Set audience with manual NameValuePair array (low-level)
  setAudience(audienceLevel: string, audienceID: NameValuePair[]): BatchBuilder {
    this.commands.push({
      action: "setAudience",
      audienceID,
      audienceLevel,
    })
    return this
  }

  // Set audience from AudienceConfig (recommended - matches createAudience format)
  setAudienceFromConfig(audience: AudienceConfig): BatchBuilder {
    const audienceIdArray = this.client["convertAudienceToArray"](audience)
    return this.setAudience(audience.audienceLevel, audienceIdArray)
  }

  async execute(sessionId?: string | null): Promise<BatchResponse> {
    // Handle session ID precedence:
    // 1. If first command is startSession with customSessionId, use that
    // 2. If sessionId parameter provided, use that
    // 3. Otherwise, use the client's managed session ID
    const effectiveSessionId =
      this.commands.length > 0 &&
      this.commands[0].action === "startSession" &&
      this.commands[0].customSessionId !== undefined
        ? this.commands[0].customSessionId
        : sessionId !== undefined
        ? sessionId
        : this.client.getSessionId()

    const result = await this.client._executeBatch(effectiveSessionId, this.commands)

    // If batch contains startSession, update client's session ID and store audience for recovery
    if (this.commands.some(cmd => cmd.action === "startSession") && result.responses?.[0]?.sessionId) {
      const startSessionCmd = this.commands.find(cmd => cmd.action === "startSession")
      if (
        startSessionCmd &&
        startSessionCmd.audienceLevel &&
        startSessionCmd.audienceID &&
        startSessionCmd.audienceID.length > 0
      ) {
        // Extract audience information from startSession command for recovery
        const audience: AudienceConfig = {
          audienceLevel: startSessionCmd.audienceLevel,
          audienceId: {
            name: startSessionCmd.audienceID[0].n || "VisitorID",
            value: startSessionCmd.audienceID[0].v || "0",
            type: startSessionCmd.audienceID[0].t || "string",
          },
        }
        // Store session ID and audience for session recovery
        // Use custom sessionId if provided, otherwise use server response
        const sessionIdToStore =
          startSessionCmd.customSessionId !== undefined
            ? startSessionCmd.customSessionId
            : result.responses[0].sessionId
        this.client.setSession(sessionIdToStore, audience)
      } else {
        // Fallback if audience extraction fails
        const sessionIdToStore = this.commands.find(cmd => cmd.action === "startSession")?.customSessionId
        this.client.setSessionId(sessionIdToStore !== undefined ? sessionIdToStore : result.responses[0].sessionId)
      }
    }

    this.commands = [] // Reset for reuse
    return result
  }
}

// Auto-executing batch builder for one-line batch operations
export class ExecutableBatchBuilder {
  private client: InteractClient
  private commands: Command[] = []
  private sessionId?: string | null
  private interactiveChannel: string

  constructor(client: InteractClient, sessionId?: string | null, interactiveChannel?: string) {
    this.client = client
    this.sessionId = sessionId
    this.interactiveChannel = interactiveChannel || "_RealTimePersonalization_"
  }

  // Method overloads for startSession (matching main client)
  startSession(audience: AudienceConfig, sessionId?: string | null): ExecutableBatchBuilder
  startSession(audience: InteractAudience, sessionId?: string | null): ExecutableBatchBuilder
  startSession(
    audience: AudienceConfig | InteractAudience,
    sessionId?: string | null,
    options?: {
      parameters?: NameValuePair[]
      relyOnExistingSession?: boolean
      debug?: boolean
    },
  ): ExecutableBatchBuilder
  startSession(
    audienceID: NameValuePair[],
    audienceLevel: string,
    parameters?: NameValuePair[],
    relyOnExistingSession?: boolean,
    debug?: boolean,
  ): ExecutableBatchBuilder
  startSession(
    audienceOrArray: AudienceConfig | InteractAudience | NameValuePair[],
    sessionIdOrAudienceLevel?: string | null,
    parametersOrOptions?:
      | NameValuePair[]
      | {
          parameters?: NameValuePair[]
          relyOnExistingSession?: boolean
          debug?: boolean
        },
    relyOnExistingSession: boolean = true,
    debug: boolean = false,
  ): ExecutableBatchBuilder {
    // Handle new signature with AudienceConfig/InteractAudience
    if (!Array.isArray(audienceOrArray)) {
      const audience =
        audienceOrArray instanceof InteractAudience
          ? (audienceOrArray as InteractAudience).toAudienceConfig()
          : (audienceOrArray as AudienceConfig)

      this.commands.push({
        action: "startSession",
        ic: this.interactiveChannel,
        audienceLevel: audience.audienceLevel,
        audienceID: [{ n: audience.audienceId.name, v: audience.audienceId.value, t: audience.audienceId.type }],
        customSessionId: sessionIdOrAudienceLevel,
        debug: debug,
        relyOnExistingSession: relyOnExistingSession,
        parameters: Array.isArray(parametersOrOptions) ? parametersOrOptions : parametersOrOptions?.parameters,
      })
      return this
    }

    // Handle legacy signature with NameValuePair[]
    const audienceLevel = sessionIdOrAudienceLevel as string
    const parameters = parametersOrOptions as NameValuePair[]

    this.commands.push({
      action: "startSession",
      ic: this.interactiveChannel,
      audienceLevel: audienceLevel,
      audienceID: audienceOrArray as NameValuePair[],
      customSessionId: undefined,
      debug: debug,
      relyOnExistingSession: relyOnExistingSession,
      parameters: parameters,
    })
    return this
  }

  // Method overloads for postEvent (matching main client)
  postEvent(eventName: string): Promise<BatchResponse>
  postEvent(eventName: string, parameters?: NameValuePair[]): Promise<BatchResponse>
  postEvent(
    eventName: string,
    parameters?: NameValuePair[],
    options?: {
      sessionId?: string | null
      autoManageSession?: boolean
      audience?: AudienceConfig | InteractAudience
    },
  ): Promise<BatchResponse>
  postEvent(
    eventName: string,
    parameters?: NameValuePair[],
    options?: {
      sessionId?: string | null
      autoManageSession?: boolean
      audience?: AudienceConfig | InteractAudience
    },
  ): Promise<BatchResponse> {
    this.commands.push({
      action: "postEvent",
      event: eventName,
      parameters,
    })
    return this.execute()
  }

  // Set audience with manual NameValuePair array (low-level)
  setAudience(audienceLevel: string, audienceID: NameValuePair[]): ExecutableBatchBuilder {
    this.commands.push({
      action: "setAudience",
      audienceLevel,
      audienceID,
    })
    return this
  }

  // Set audience from AudienceConfig (recommended - matches createAudience format)
  setAudienceFromConfig(audience: AudienceConfig | InteractAudience): ExecutableBatchBuilder {
    const config = audience instanceof InteractAudience ? audience.toAudienceConfig() : audience
    return this.setAudience(config.audienceLevel, [
      { n: config.audienceId.name, v: config.audienceId.value, t: config.audienceId.type },
    ])
  }

  // Get offers and auto-execute with session recovery
  async getOffers(interactionPoint: string, numberRequested: number = 1): Promise<BatchResponse> {
    this.commands.push({
      action: "getOffers",
      ip: interactionPoint,
      numberRequested,
    })

    const maxRetries = 1
    let attempt = 0

    while (attempt <= maxRetries) {
      attempt++

      if (this.client.isLoggingEnabled()) {
        console.log(`🔧 ExecutableBatchBuilder.getOffers: Attempt ${attempt}/${maxRetries + 1}`)
      }

      const result = await this.execute()

      // Check if session is invalid and we can retry
      if (this.client.isSessionInvalid(result) && attempt <= maxRetries) {
        // Get stored audience for recovery
        const storedAudience = this.client.getStoredAudience()
        if (storedAudience) {
          // Find the original startSession command to preserve custom sessionId
          const originalStartSession = this.commands.find(cmd => cmd.action === "startSession")
          const customSessionId = originalStartSession?.customSessionId

          // Remove any existing startSession commands to avoid duplicates
          this.commands = this.commands.filter(cmd => cmd.action !== "startSession")

          // Prepend startSession command to the batch, preserving custom sessionId
          const recoveryStartSession: any = {
            action: "startSession",
            audienceLevel: storedAudience.audienceLevel,
            audienceID: [
              {
                n: storedAudience.audienceId.name,
                v: storedAudience.audienceId.value,
                t: storedAudience.audienceId.type,
              },
            ],
            parameters: [],
            relyOnExistingSession: false,
            debug: false,
          }

          // If there was a custom sessionId, preserve it
          if (customSessionId !== undefined) {
            recoveryStartSession.customSessionId = customSessionId
          }

          this.commands.unshift(recoveryStartSession)

          // Continue the retry loop
          continue
        } else {
          if (this.client.isLoggingEnabled()) {
            console.error("❌ ExecutableBatchBuilder: No stored audience available for recovery")
          }
          break
        }
      }

      // Success or non-recoverable error
      return result
    }

    // If we get here, all retries failed - return the last result
    if (this.client.isLoggingEnabled()) {
      console.error("❌ ExecutableBatchBuilder: All retry attempts failed")
    }
    return await this.execute()
  }

  endSession(): Promise<BatchResponse> {
    this.commands.push({
      action: "endSession",
    })
    return this.execute()
  }

  private async execute(): Promise<BatchResponse> {
    // Check if we have an existing session and the batch contains startSession
    const hasExistingSession = !!this.client.getSessionId()
    const hasStartSession = this.commands.some(cmd => cmd.action === "startSession")

    if (hasExistingSession && hasStartSession) {
      if (this.client.isLoggingEnabled()) {
        console.log("🔧 ExecutableBatchBuilder: Existing session found, trying without startSession first")
      }

      // First attempt: try without startSession commands (use existing session)
      const commandsWithoutStartSession = this.commands.filter(cmd => cmd.action !== "startSession")
      const existingSessionId = this.client.getSessionId()

      if (commandsWithoutStartSession.length > 0) {
        const firstResult = await this.client._executeBatch(existingSessionId, commandsWithoutStartSession)

        // If successful, return the result
        if (!this.client.isSessionInvalid(firstResult)) {
          if (this.client.isLoggingEnabled()) {
            console.log("✅ ExecutableBatchBuilder: Request succeeded with existing session")
          }
          return firstResult
        }

        // If session is invalid, clear it and retry with full batch including startSession
        if (this.client.isLoggingEnabled()) {
          console.log("🔄 ExecutableBatchBuilder: Session invalid, clearing and retrying with startSession")
        }
        // Clear the invalid session so subsequent calls don't keep trying it
        this.client.clearSession()
      }
    }

    // Default behavior: execute all commands as-is
    // If the first command is startSession, use null sessionId to let it create a new session
    const effectiveSessionId =
      this.commands.length > 0 && this.commands[0].action === "startSession"
        ? this.commands[0].customSessionId !== undefined
          ? this.commands[0].customSessionId
          : null // Let startSession create a new session
        : this.sessionId !== undefined
        ? this.sessionId
        : this.client.getSessionId()

    const result = await this.client._executeBatch(effectiveSessionId, this.commands)

    // If batch contains startSession, update client's session ID and store audience for recovery
    if (this.commands.some(cmd => cmd.action === "startSession") && result.responses?.[0]?.sessionId) {
      const startSessionCmd = this.commands.find(cmd => cmd.action === "startSession")
      if (
        startSessionCmd &&
        startSessionCmd.audienceLevel &&
        startSessionCmd.audienceID &&
        startSessionCmd.audienceID.length > 0
      ) {
        // Extract audience information from startSession command for recovery
        const audience: AudienceConfig = {
          audienceLevel: startSessionCmd.audienceLevel,
          audienceId: {
            name: startSessionCmd.audienceID[0].n || "VisitorID",
            value: startSessionCmd.audienceID[0].v || "0",
            type: startSessionCmd.audienceID[0].t || "string",
          },
        }
        // Store session ID and audience for session recovery
        // Use custom sessionId if provided, otherwise use server response
        const sessionIdToStore =
          startSessionCmd.customSessionId !== undefined
            ? startSessionCmd.customSessionId
            : result.responses[0].sessionId
        this.client.setSession(sessionIdToStore, audience)
      } else {
        // Fallback if audience extraction fails
        const sessionIdToStore = this.commands.find(cmd => cmd.action === "startSession")?.customSessionId
        this.client.setSessionId(sessionIdToStore !== undefined ? sessionIdToStore : result.responses[0].sessionId)
      }
    }

    return result
  }
}
