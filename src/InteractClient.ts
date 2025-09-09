// HCL Interact SDK - Servlet API Compatible
// Clean, opinionated TypeScript client with React integration

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
  }

  // Set both session and audience for session recovery
  setSession(sessionId: string | null, audience?: AudienceConfig): void {
    this.sessionState.sessionId = sessionId
    this.sessionState.isValid = !!sessionId
    this.sessionState.lastActivity = new Date()
    if (audience) {
      this.sessionState.audience = audience
    }
  }

  // Get stored audience for session recovery
  getStoredAudience(): AudienceConfig | undefined {
    return this.sessionState.audience
  }

  isSessionValid(): boolean {
    return this.sessionState.isValid && !!this.sessionState.sessionId
  }

  clearSession(): void {
    this.sessionState = {
      sessionId: null,
      isValid: false,
      lastActivity: new Date(),
      audience: undefined,
    }
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

  // Check if response indicates session is invalid or expired
  private isSessionInvalid(response: BatchResponse): boolean {
    // Check batch-level status code
    if (response.batchStatusCode === 2) {
      return true
    }

    // Check individual response status codes and messages
    return (
      response.responses?.some(r => {
        // Status code 2 typically indicates session issues
        if (r.statusCode === 2) {
          // Check for specific session-related error messages
          return (
            r.messages?.some(m => {
              if (m.msgLevel === 2 && m.msgCode === 1) {
                const msgLower = m.msg.toLowerCase()
                return (
                  msgLower.includes("invalid session id") ||
                  msgLower.includes("session id") ||
                  msgLower.includes("session expired") ||
                  msgLower.includes("session timeout")
                )
              }
              return false
            }) || false
          )
        }
        return false
      }) || false
    )
  }

  // Execute batch with automatic session retry and recovery
  async executeBatchWithRetry(
    sessionId: string | null,
    commands: Command[],
    audience?: AudienceConfig,
    maxRetries: number = 1,
  ): Promise<BatchResponse> {
    let currentSessionId = sessionId || this.sessionState.sessionId
    let attempt = 0

    while (attempt <= maxRetries) {
      try {
        const response = await this._executeBatch(currentSessionId, commands)

        // Update session ID if returned
        if (response.responses?.[0]?.sessionId) {
          this.setSessionId(response.responses[0].sessionId)
        }

        // Check if session is invalid
        if (this.isSessionInvalid(response) && attempt < maxRetries) {
          if (this.config.enableLogging) {
            console.warn("Session expired, recovering with new session and retrying batch...")
          }

          // Clear invalid session from client state
          this.clearSession()

          // If we have audience config, recover by prepending startSession to the batch
          if (audience) {
            // Create a new batch with startSession command first, then original commands
            const recoveryCommands: Command[] = [
              {
                action: "startSession",
                ic: this.config.interactiveChannel,
                audienceID: this.convertAudienceToArray(audience),
                audienceLevel: audience.audienceLevel,
                relyOnExistingSession: false, // Force new session since old one expired
              },
              ...commands, // Add original commands after startSession
            ]

            if (this.config.enableLogging) {
              console.log("Executing recovery batch with startSession + original commands...")
            }

            // Execute the recovery batch (use the expired sessionId since startSession will create new one)
            const recoveryResponse = await this._executeBatch(currentSessionId, recoveryCommands)

            // Update session ID from the startSession response
            if (recoveryResponse.responses?.[0]?.sessionId) {
              const newSessionId = recoveryResponse.responses[0].sessionId
              // Store both session and audience for future recovery
              this.setSession(newSessionId, audience)

              if (this.config.enableLogging) {
                console.log(`Session recovered: ${currentSessionId} -> ${newSessionId}`)
              }
            }

            // Return the recovery response (which includes results from all commands)
            return recoveryResponse
          }

          throw new Error("Cannot recover session: no audience configuration provided")
        }

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

    // Build request body - only include sessionId if it's not null
    const requestBody: any = {
      commands: commands,
    }

    // Only include sessionId if we have one, let server generate one if null
    if (sessionId !== null) {
      requestBody.sessionId = sessionId
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
      // Store both session and audience for session recovery
      this.setSession(response.sessionId, audienceConfig)
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
        action: "getOffers",
        ip: interactionPoint,
        numberRequested,
      },
    ]

    // Use provided audience or fall back to stored audience for session recovery
    const recoveryAudience = audience || this.getStoredAudience()
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
    return this.extractFirstResponse(batchResponse)
  }

  async setAudience(sessionId: string, audienceID: NameValuePair[], audienceLevel?: string): Promise<InteractResponse> {
    const commands: Command[] = [
      {
        action: "setAudience",
        audienceID,
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

  async setAudienceFromConfig(
    sessionId: string,
    audience: AudienceConfig,
    audienceLevel?: string,
  ): Promise<InteractResponse> {
    const audienceIdArray = this.convertAudienceToArray(audience)
    return this.setAudience(sessionId, audienceIdArray, audienceLevel)
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

  setAudience(audienceID: NameValuePair[], audienceLevel?: string): BatchBuilder {
    this.commands.push({
      action: "setAudience",
      audienceID,
      audienceLevel,
    })
    return this
  }

  setAudienceFromConfig(audience: AudienceConfig, audienceLevel?: string): BatchBuilder {
    const audienceIdArray = this.client["convertAudienceToArray"](audience)
    return this.setAudience(audienceIdArray, audienceLevel)
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

  // Method overloads for getOffers (matching main client)
  getOffers(interactionPoint: string): Promise<BatchResponse>
  getOffers(interactionPoint: string, numberRequested?: number): Promise<BatchResponse>
  getOffers(
    interactionPoint: string,
    numberRequested?: number,
    options?: {
      sessionId?: string | null
      autoManageSession?: boolean
      audience?: AudienceConfig | InteractAudience
    },
  ): Promise<BatchResponse>
  getOffers(
    interactionPoint: string,
    numberRequested: number = 1,
    options?: {
      sessionId?: string | null
      autoManageSession?: boolean
      audience?: AudienceConfig | InteractAudience
    },
  ): Promise<BatchResponse> {
    this.commands.push({
      action: "getOffers",
      ip: interactionPoint,
      numberRequested,
      parameters: options?.sessionId ? [{ n: "sessionId", v: options.sessionId, t: "string" }] : undefined,
    })
    return this.execute()
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

  setAudience(audienceID: NameValuePair[], audienceLevel?: string): ExecutableBatchBuilder {
    this.commands.push({
      action: "setAudience",
      audienceLevel: audienceLevel || InteractAudienceLevel.Visitor,
      audienceID,
    })
    return this
  }

  setAudienceFromConfig(audience: AudienceConfig | InteractAudience, audienceLevel?: string): ExecutableBatchBuilder {
    const config = audience instanceof InteractAudience ? audience.toAudienceConfig() : audience
    return this.setAudience(
      [{ n: config.audienceId.name, v: config.audienceId.value, t: config.audienceId.type }],
      audienceLevel || config.audienceLevel,
    )
  }

  endSession(): Promise<BatchResponse> {
    this.commands.push({
      action: "endSession",
    })
    return this.execute()
  }

  private async execute(): Promise<BatchResponse> {
    // Use same session precedence logic as BatchBuilder
    const effectiveSessionId =
      this.commands.length > 0 &&
      this.commands[0].action === "startSession" &&
      this.commands[0].customSessionId !== undefined
        ? this.commands[0].customSessionId
        : this.sessionId !== undefined
        ? this.sessionId
        : this.client.getSessionId()

    const result = await this.client._executeBatch(effectiveSessionId, this.commands)
    return result
  }
}
