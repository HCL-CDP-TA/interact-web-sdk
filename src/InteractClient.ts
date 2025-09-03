// HCL Interact SDK - Servlet API Compatible
// Clean, opinionated TypeScript client with React integration

export interface InteractConfig {
  serverUrl: string // e.g., "https://your-server.com/interact"
  interactiveChannel?: string // defaults to "_RealTimePersonalization_"
  username?: string
  password?: string
  enableLogging?: boolean
}

export interface AudienceConfig {
  audienceLevel: "Visitor" | "Customer" | string
  audienceId: {
    name: string
    value: string | number
    type: "string" | "numeric" | "datetime"
  }
}

export interface AudienceConfig {
  audienceLevel: "Visitor" | "Customer" | string
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

  isSessionValid(): boolean {
    return this.sessionState.isValid && !!this.sessionState.sessionId
  }

  clearSession(): void {
    this.sessionState = {
      sessionId: null,
      isValid: false,
      lastActivity: new Date(),
    }
  }

  // Helper methods for default audience configurations
  static createVisitorAudience(visitorId: string = "0"): AudienceConfig {
    return {
      audienceLevel: "Visitor",
      audienceId: {
        name: "VisitorID",
        value: visitorId,
        type: "string",
      },
    }
  }

  static createCustomerAudience(customerId: number): AudienceConfig {
    return {
      audienceLevel: "Customer",
      audienceId: {
        name: "CustomerID",
        value: customerId,
        type: "numeric",
      },
    }
  }

  // Check if response indicates session is invalid
  private isSessionInvalid(response: BatchResponse): boolean {
    return (
      response.responses?.some(
        r =>
          r.statusCode === 2 &&
          r.messages?.some(m => m.msgLevel === 2 && m.msg.toLowerCase().includes("invalid session id")),
      ) || false
    )
  }

  // Execute batch with automatic session retry
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
        const response = await this.executeBatch(currentSessionId, commands)

        // Update session ID if returned
        if (response.responses?.[0]?.sessionId) {
          this.setSessionId(response.responses[0].sessionId)
        }

        // Check if session is invalid
        if (this.isSessionInvalid(response) && attempt < maxRetries) {
          if (this.config.enableLogging) {
            console.warn("Session invalid, retrying with new session...")
          }

          // Clear invalid session
          this.clearSession()

          // If we have audience config, start a new session
          if (audience) {
            const newSessionResponse = await this.startSessionLowLevel(
              null,
              this.convertAudienceToArray(audience),
              audience.audienceLevel,
            )

            if (newSessionResponse.sessionId) {
              currentSessionId = newSessionResponse.sessionId
              this.setSessionId(currentSessionId)

              // Retry the original commands with new session
              attempt++
              continue
            }
          }

          throw new Error("Failed to establish new session after invalid session")
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
  async executeBatch(sessionId: string | null, commands: Command[]): Promise<BatchResponse> {
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

    const batchResponse = await this.executeBatch(sessionId, commands)
    return this.extractFirstResponse(batchResponse)
  }

  // Main session start method with audience config and optional sessionId
  async startSession(audience: AudienceConfig, sessionId?: string | null): Promise<InteractResponse> {
    const audienceIdArray = this.convertAudienceToArray(audience)
    const response = await this.startSessionLowLevel(sessionId ?? null, audienceIdArray, audience.audienceLevel)

    if (response.sessionId) {
      this.setSessionId(response.sessionId)
    }

    return response
  }

  async getOffers(sessionId: string, interactionPoint: string, numberRequested: number = 1): Promise<InteractResponse> {
    const commands: Command[] = [
      {
        action: "getOffers",
        ip: interactionPoint,
        numberRequested,
      },
    ]

    const batchResponse = await this.executeBatch(sessionId, commands)
    return this.extractFirstResponse(batchResponse)
  }

  // Method overloads for postEvent - provides multiple call signatures
  async postEvent(sessionId: string, eventName: string, parameters?: NameValuePair[]): Promise<InteractResponse>
  async postEvent(
    eventName: string,
    parameters?: NameValuePair[],
    options?: {
      sessionId?: string
      autoManageSession?: boolean
      audience?: AudienceConfig
    },
  ): Promise<InteractResponse>

  // Implementation handles both signatures
  async postEvent(
    sessionIdOrEventName: string,
    eventNameOrParameters?: string | NameValuePair[],
    parametersOrOptions?:
      | NameValuePair[]
      | {
          sessionId?: string
          autoManageSession?: boolean
          audience?: AudienceConfig
        },
  ): Promise<InteractResponse> {
    // Detect which overload was called based on parameter types
    if (typeof eventNameOrParameters === "string") {
      // Old signature: postEvent(sessionId, eventName, parameters?)
      const sessionId = sessionIdOrEventName
      const eventName = eventNameOrParameters
      const parameters = parametersOrOptions as NameValuePair[] | undefined

      const commands: Command[] = [
        {
          action: "postEvent",
          event: eventName,
          parameters,
        },
      ]

      const batchResponse = await this.executeBatch(sessionId, commands)
      return this.extractFirstResponse(batchResponse)
    } else {
      // New signature: postEvent(eventName, parameters?, options?)
      const eventName = sessionIdOrEventName
      const parameters = eventNameOrParameters as NameValuePair[] | undefined
      const options = parametersOrOptions as
        | {
            sessionId?: string
            autoManageSession?: boolean
            audience?: AudienceConfig
          }
        | undefined

      const { sessionId: explicitSessionId, autoManageSession = false, audience } = options || {}

      let sessionId: string | undefined = explicitSessionId

      if (!sessionId) {
        if (autoManageSession) {
          // Auto-managed session mode
          sessionId = this.getSessionId() || undefined

          if (!sessionId && audience) {
            const sessionResponse = await this.startSession(audience)
            sessionId = sessionResponse.sessionId || undefined
          }

          if (!sessionId) {
            throw new Error("No session available and no audience provided to start new session")
          }

          const commands: Command[] = [
            {
              action: "postEvent",
              event: eventName,
              parameters,
            },
          ]

          const batchResponse = await this.executeBatchWithRetry(sessionId, commands, audience)
          return this.extractFirstResponse(batchResponse)
        } else {
          throw new Error("No sessionId provided and autoManageSession not enabled")
        }
      }

      // Manual session mode
      const commands: Command[] = [
        {
          action: "postEvent",
          event: eventName,
          parameters,
        },
      ]

      const batchResponse = await this.executeBatch(sessionId, commands)
      return this.extractFirstResponse(batchResponse)
    }
  }

  async getVersion(): Promise<InteractResponse> {
    const commands: Command[] = [
      {
        action: "getVersion",
      },
    ]

    const batchResponse = await this.executeBatch(null, commands)
    return this.extractFirstResponse(batchResponse)
  }

  async endSession(sessionId: string): Promise<InteractResponse> {
    const commands: Command[] = [
      {
        action: "endSession",
      },
    ]

    const batchResponse = await this.executeBatch(sessionId, commands)
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

    const batchResponse = await this.executeBatch(sessionId, commands)
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

  // Enhanced convenience methods with automatic session management
  async getOffersWithSession(
    interactionPoint: string,
    numberRequested: number = 1,
    audience?: AudienceConfig,
  ): Promise<InteractResponse> {
    let sessionId = this.getSessionId()

    // If no session, start one
    if (!sessionId && audience) {
      const sessionResponse = await this.startSession(audience)
      sessionId = sessionResponse.sessionId || null
    }

    if (!sessionId) {
      throw new Error("No session available and no audience provided to start new session")
    }

    const commands: Command[] = [
      {
        action: "getOffers",
        ip: interactionPoint,
        numberRequested,
      },
    ]

    const batchResponse = await this.executeBatchWithRetry(sessionId, commands, audience)
    return this.extractFirstResponse(batchResponse)
  }

  // Backward compatibility wrapper for postEventWithSession
  async postEventWithSession(
    eventName: string,
    parameters?: NameValuePair[],
    audience?: AudienceConfig,
  ): Promise<InteractResponse> {
    return this.postEvent(eventName, parameters, { autoManageSession: true, audience })
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
  static createParameter(name: string, value: any, type: "string" | "numeric" | "datetime" = "string"): NameValuePair {
    return { n: name, v: value, t: type }
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

  startSession(
    audienceID: NameValuePair[],
    audienceLevel: string,
    parameters?: NameValuePair[],
    relyOnExistingSession: boolean = true,
    debug: boolean = false,
  ): BatchBuilder {
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

  getOffers(interactionPoint: string, numberRequested: number = 1): BatchBuilder {
    this.commands.push({
      action: "getOffers",
      ip: interactionPoint,
      numberRequested,
    })
    return this
  }

  postEvent(eventName: string, parameters?: NameValuePair[]): BatchBuilder {
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

  async execute(sessionId: string | null): Promise<BatchResponse> {
    const result = await this.client.executeBatch(sessionId, this.commands)
    this.commands = [] // Reset for reuse
    return result
  }
}
