export interface ApiConfig {
  baseUrl?: string
  userName?: string // Optional header for tracking/logging (not authentication)
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
