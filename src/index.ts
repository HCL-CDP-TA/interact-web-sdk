// Interact Runtime API SDK
// TypeScript SDK for HCL Interact Runtime REST API v2.0.0

export interface ApiConfig {
  baseUrl?: string
  username?: string
  password?: string
  defaultHeaders?: Record<string, string>
}

// Core Types from OpenAPI Schema
export interface ParameterVO {
  n: string
  t: string
  v: any
}

export interface ResponseVO {
  messages?: AdvisoryMessageVO[]
  sessionId?: string
  version?: string
  statusCode?: number
  profile?: ParameterVO[]
  offerLists?: OfferListVO[]
  attributeMap?: Record<string, number>
}

export interface AdvisoryMessageVO {
  msgCode?: number
  msgLevel?: number
  msg?: string
  detailMsg?: string
}

export interface OfferListVO {
  ip?: string
  defaultString?: string
  offers?: OfferVO[]
}

export interface OfferVO {
  n?: string
  code?: string[]
  treatmentCode?: string
  score?: number
  desc?: string
  attributes?: ParameterVO[]
}

export interface StartSessionVO {
  debug?: boolean
  relyOnExistingSession?: boolean
  parameters?: ParameterVO[]
  auIdParams?: ParameterVO[]
}

export interface SetAudienceVO {
  parameters?: ParameterVO[]
}

export interface PostEventVO {
  parameters?: ParameterVO[]
}

export interface GetOffersMultipleIPCommandVO {
  getOfferRequests: GetOfferRequestsVO[]
  parameters?: ParameterVO[]
}

export interface GetOfferRequestsVO {
  dupPolicy: number
  ip: string
  numberRequested: number
  offerAttributes?: OfferAttribRequirementVO
}

export interface OfferAttribRequirementVO {
  numberRequested?: number
  attributes?: ParameterVO[]
  childRequirements?: OfferAttribRequirementVO[]
}

export interface StartSessionCommandVO {
  ic: string
  audienceLevel: string
  audienceID: ParameterVO[]
  debug?: boolean
  relyOnExistingSession?: boolean
  parameters?: ParameterVO[]
  auIdParams?: ParameterVO[]
}

export interface GetOffersCommandVO {
  interactionPointID: string
  numberRequested: number
  parameters?: ParameterVO[]
}

export interface PostEventCommandVO {
  event: string
  parameters?: ParameterVO[]
}

export interface SetAudienceCommandVO {
  audienceLevel: string
  audienceID: ParameterVO[]
  parameters?: ParameterVO[]
}

export interface SetDebugCommandVO {
  debug: boolean
}

export interface BatchExecuteCommandVO {
  startSession?: StartSessionCommandVO
  getOffers?: GetOffersCommandVO
  getOffersForMultipleInteractionPoints?: GetOffersMultipleIPCommandVO
  postEvent?: PostEventCommandVO
  setAudience?: SetAudienceCommandVO
  getProfile?: any
  endSession?: any
  setDebug?: SetDebugCommandVO
  getVersion?: boolean
}

export interface BatchResponseVO {
  responses?: ResponseVO[]
  batchStatusCode?: number
}

export interface DeploymentInfoVO {
  deployment?: any
}

export interface DataSourceInfoVO {
  dataSourceName?: string
  jndiName?: string
  schemaName?: string
  dbType?: string
  userName?: string
  status?: boolean
}

export interface InteractResourceConsumption {
  sysCpuLoad?: number
  sysTotalPhyscialMemory?: number
  sysFreePhyscialMemory?: number
  processCpuLoad?: number
  processTotalMemory?: number
  processAllocatedMemory?: number
}

// API Error Class
export class InteractApiError extends Error {
  constructor(public status: number, public statusText: string, message?: string) {
    super(message || `API Error: ${status} ${statusText}`)
    this.name = "InteractApiError"
  }
}

// Main SDK Class
export class InteractApiClient {
  private baseUrl: string
  private defaultHeaders: Record<string, string>

  constructor(config: ApiConfig = {}) {
    this.baseUrl = config.baseUrl || "https://unica.prod.hxun.aws.now.hclsoftware.cloud/interact/v2"
    this.defaultHeaders = {
      "Content-Type": "application/json",
      ...config.defaultHeaders,
    }

    if (config.username) {
      this.defaultHeaders["m_user_name"] = config.username
    }

    if (config.password) {
      this.defaultHeaders["m_user_password"] = config.password
    }
  }

  private async request<T>(
    method: string,
    path: string,
    options: {
      params?: Record<string, any>
      body?: any
      headers?: Record<string, string>
    } = {},
  ): Promise<T> {
    const url = new URL(path, this.baseUrl)

    // Add query parameters
    if (options.params) {
      Object.entries(options.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value))
        }
      })
    }

    const headers = {
      ...this.defaultHeaders,
      ...options.headers,
    }

    const fetchOptions: RequestInit = {
      method,
      headers,
    }

    if (options.body && method !== "GET") {
      fetchOptions.body = JSON.stringify(options.body)
    }

    const response = await fetch(url.toString(), fetchOptions)

    if (!response.ok) {
      throw new InteractApiError(response.status, response.statusText)
    }

    // Handle different content types
    const contentType = response.headers.get("content-type")
    if (contentType?.includes("application/json")) {
      return response.json()
    } else {
      return response.text() as any
    }
  }

  // Session Management
  async startSession(
    sessionId: string,
    ic: string,
    audienceLevel: string,
    audienceIDField: string,
    body?: StartSessionVO,
    escapeHtml: boolean = true,
  ): Promise<ResponseVO> {
    return this.request<ResponseVO>("POST", `/sessions/${sessionId}`, {
      params: { ic, audienceLevel, audienceIDField, escapeHtml },
      body,
    })
  }

  async endSession(sessionId: string, parameters?: string, escapeHtml: boolean = true): Promise<ResponseVO> {
    return this.request<ResponseVO>("DELETE", `/sessions/${sessionId}`, {
      params: { parameters, escapeHtml },
    })
  }

  // Audience Management
  async setAudience(
    sessionId: string,
    audienceLevel: string,
    audienceIDField: string,
    body: SetAudienceVO,
    escapeHtml: boolean = true,
  ): Promise<ResponseVO> {
    return this.request<ResponseVO>("PUT", `/audiences/${sessionId}`, {
      params: { audienceLevel, audienceIDField, escapeHtml },
      body,
    })
  }

  // Offers
  async getOffers(
    sessionId: string,
    interactionPointID: string,
    number?: number,
    parameters?: string,
    escapeHtml: boolean = true,
  ): Promise<ResponseVO> {
    return this.request<ResponseVO>("GET", `/offers/${sessionId}/${interactionPointID}`, {
      params: { number, parameters, escapeHtml },
    })
  }

  async getOffersForMultipleIPs(
    sessionId: string,
    body: GetOffersMultipleIPCommandVO,
    parameters?: string,
    escapeHtml: boolean = true,
  ): Promise<ResponseVO> {
    return this.request<ResponseVO>("POST", `/offers/${sessionId}`, {
      params: { parameters, escapeHtml },
      body,
    })
  }

  // Events
  async postEvent(
    sessionId: string,
    eventName: string,
    body?: PostEventVO,
    escapeHtml: boolean = true,
  ): Promise<ResponseVO> {
    return this.request<ResponseVO>("POST", `/events/${sessionId}/${eventName}`, {
      params: { escapeHtml },
      body,
    })
  }

  // Profile
  async getProfile(sessionId: string, parameters?: string, escapeHtml: boolean = true): Promise<ResponseVO> {
    return this.request<ResponseVO>("GET", `/profiles/${sessionId}`, {
      params: { parameters, escapeHtml },
    })
  }

  // ===== BATCH OPERATIONS =====
  // This is the PRIMARY way to interact with the Interact API for performance
  async batchExecute(
    sessionId: string,
    body: BatchExecuteCommandVO,
    escapeHtml: boolean = true,
  ): Promise<BatchResponseVO> {
    return this.request<BatchResponseVO>("POST", `/batch/${sessionId}`, {
      params: { escapeHtml },
      body,
    })
  }

  // ===== BATCH OPERATION HELPERS =====
  // These methods help you build common batch operation patterns

  /**
   * Complete interaction workflow in a single batch call:
   * Start session → Get offers → End session
   * This is the most common pattern for web interactions
   */
  async executeCompleteInteraction(
    sessionId: string,
    ic: string,
    audienceLevel: string,
    audienceID: ParameterVO[],
    interactionPointID: string,
    numberOffers: number = 1,
    options: {
      sessionParameters?: ParameterVO[]
      offerParameters?: ParameterVO[]
      debug?: boolean
      relyOnExistingSession?: boolean
    } = {},
  ): Promise<BatchResponseVO> {
    const batchCommand: BatchExecuteCommandVO = {
      startSession: {
        ic,
        audienceLevel,
        audienceID,
        debug: options.debug,
        relyOnExistingSession: options.relyOnExistingSession,
        parameters: options.sessionParameters,
      },
      getOffers: {
        interactionPointID,
        numberRequested: numberOffers,
        parameters: options.offerParameters,
      },
      endSession: {},
    }

    return this.batchExecute(sessionId, batchCommand)
  }

  /**
   * Session with event tracking and offers:
   * Start session → Post event → Get offers → End session
   */
  async executeInteractionWithEvent(
    sessionId: string,
    ic: string,
    audienceLevel: string,
    audienceID: ParameterVO[],
    eventName: string,
    interactionPointID: string,
    numberOffers: number = 1,
    options: {
      sessionParameters?: ParameterVO[]
      eventParameters?: ParameterVO[]
      offerParameters?: ParameterVO[]
      debug?: boolean
    } = {},
  ): Promise<BatchResponseVO> {
    const batchCommand: BatchExecuteCommandVO = {
      startSession: {
        ic,
        audienceLevel,
        audienceID,
        debug: options.debug,
        parameters: options.sessionParameters,
      },
      postEvent: {
        event: eventName,
        parameters: options.eventParameters,
      },
      getOffers: {
        interactionPointID,
        numberRequested: numberOffers,
        parameters: options.offerParameters,
      },
      endSession: {},
    }

    return this.batchExecute(sessionId, batchCommand)
  }

  /**
   * Multi-touchpoint interaction in one batch:
   * Start session → Get offers for multiple interaction points → End session
   */
  async executeMultiTouchpointInteraction(
    sessionId: string,
    ic: string,
    audienceLevel: string,
    audienceID: ParameterVO[],
    offerRequests: GetOfferRequestsVO[],
    options: {
      sessionParameters?: ParameterVO[]
      offerParameters?: ParameterVO[]
      debug?: boolean
    } = {},
  ): Promise<BatchResponseVO> {
    const batchCommand: BatchExecuteCommandVO = {
      startSession: {
        ic,
        audienceLevel,
        audienceID,
        debug: options.debug,
        parameters: options.sessionParameters,
      },
      getOffersForMultipleInteractionPoints: {
        getOfferRequests: offerRequests,
        parameters: options.offerParameters,
      },
      endSession: {},
    }

    return this.batchExecute(sessionId, batchCommand)
  }

  /**
   * Profile and offers workflow:
   * Start session → Get profile → Get offers → End session
   */
  async executeProfileBasedInteraction(
    sessionId: string,
    ic: string,
    audienceLevel: string,
    audienceID: ParameterVO[],
    interactionPointID: string,
    numberOffers: number = 1,
    options: {
      sessionParameters?: ParameterVO[]
      offerParameters?: ParameterVO[]
      debug?: boolean
    } = {},
  ): Promise<BatchResponseVO> {
    const batchCommand: BatchExecuteCommandVO = {
      startSession: {
        ic,
        audienceLevel,
        audienceID,
        debug: options.debug,
        parameters: options.sessionParameters,
      },
      getProfile: {},
      getOffers: {
        interactionPointID,
        numberRequested: numberOffers,
        parameters: options.offerParameters,
      },
      endSession: {},
    }

    return this.batchExecute(sessionId, batchCommand)
  }

  /**
   * Custom batch builder for advanced scenarios
   */
  createBatchBuilder(sessionId: string): BatchBuilder {
    return new BatchBuilder(this, sessionId)
  }

  // System Information
  async getStatus(): Promise<ResponseVO> {
    return this.request<ResponseVO>("GET", "/status")
  }

  async getResourceConsumption(): Promise<InteractResourceConsumption> {
    return this.request<InteractResourceConsumption>("GET", "/resources")
  }

  // Deployments
  async getActiveDeployments(): Promise<DeploymentInfoVO[]> {
    return this.request<DeploymentInfoVO[]>("GET", "/deployments")
  }

  async getDeploymentByIcId(icIdOrName: string): Promise<DeploymentInfoVO> {
    return this.request<DeploymentInfoVO>("GET", `/deployments/channels/${icIdOrName}`)
  }

  // Data Sources
  async getDataSources(): Promise<DataSourceInfoVO[]> {
    return this.request<DataSourceInfoVO[]>("GET", "/datasources")
  }

  async testDataSourceConnection(datasourceName: string): Promise<boolean> {
    return this.request<boolean>("GET", "/datasources/status", {
      params: { datasourceName },
    })
  }

  // GDPR
  async getGDPRSQLScripts(body: any[], querySeparator?: string, nlsPrefix?: string, returnZip?: boolean): Promise<any> {
    return this.request<any>("POST", "/gdpr", {
      params: { QuerySeparator: querySeparator, NLSPrefix: nlsPrefix, returnZip },
      body,
    })
  }

  // Consent
  async syncConsent(): Promise<ResponseVO> {
    return this.request<ResponseVO>("POST", "/consent/sync")
  }

  // Utility method to create parameters
  static createParameter(name: string, type: string, value: any): ParameterVO {
    return { n: name, t: type, v: value }
  }

  // Utility method to create multiple parameters
  static createParameters(params: Array<{ name: string; type: string; value: any }>): ParameterVO[] {
    return params.map(p => this.createParameter(p.name, p.type, p.value))
  }
}

// Export default instance factory
export function createInteractClient(config?: ApiConfig): InteractApiClient {
  return new InteractApiClient(config)
}

// Batch Builder for Custom Workflows
export class BatchBuilder {
  private batchCommand: BatchExecuteCommandVO = {}

  constructor(private client: InteractApiClient, private sessionId: string) {}

  startSession(
    ic: string,
    audienceLevel: string,
    audienceID: ParameterVO[],
    options: {
      debug?: boolean
      relyOnExistingSession?: boolean
      parameters?: ParameterVO[]
      auIdParams?: ParameterVO[]
    } = {},
  ): BatchBuilder {
    this.batchCommand.startSession = {
      ic,
      audienceLevel,
      audienceID,
      ...options,
    }
    return this
  }

  getOffers(interactionPointID: string, numberRequested: number = 1, parameters?: ParameterVO[]): BatchBuilder {
    this.batchCommand.getOffers = {
      interactionPointID: interactionPointID,
      numberRequested,
      parameters,
    }
    return this
  }

  getOffersMultiple(offerRequests: GetOfferRequestsVO[], parameters?: ParameterVO[]): BatchBuilder {
    this.batchCommand.getOffersForMultipleInteractionPoints = {
      getOfferRequests: offerRequests,
      parameters,
    }
    return this
  }

  postEvent(eventName: string, parameters?: ParameterVO[]): BatchBuilder {
    this.batchCommand.postEvent = {
      event: eventName,
      parameters,
    }
    return this
  }

  setAudience(audienceLevel: string, audienceID: ParameterVO[], parameters?: ParameterVO[]): BatchBuilder {
    this.batchCommand.setAudience = {
      audienceLevel,
      audienceID,
      parameters,
    }
    return this
  }

  getProfile(): BatchBuilder {
    this.batchCommand.getProfile = {}
    return this
  }

  endSession(): BatchBuilder {
    this.batchCommand.endSession = {}
    return this
  }

  setDebug(debug: boolean): BatchBuilder {
    this.batchCommand.setDebug = { debug }
    return this
  }

  getVersion(): BatchBuilder {
    this.batchCommand.getVersion = true
    return this
  }

  async execute(): Promise<BatchResponseVO> {
    return this.client.batchExecute(this.sessionId, this.batchCommand)
  }

  // Get the built command without executing (useful for debugging)
  build(): BatchExecuteCommandVO {
    return { ...this.batchCommand }
  }
}

// Export everything
export default InteractApiClient
