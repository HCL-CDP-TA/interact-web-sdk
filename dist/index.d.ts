interface InteractConfig {
    serverUrl: string;
    interactiveChannel?: string;
    username?: string;
    password?: string;
    enableLogging?: boolean;
}
interface AudienceConfig {
    audienceLevel: "Visitor" | "Customer" | string;
    audienceId: {
        name: string;
        value: string | number;
        type: "string" | "numeric" | "datetime";
    };
}
interface AudienceConfig {
    audienceLevel: "Visitor" | "Customer" | string;
    audienceId: {
        name: string;
        value: string | number;
        type: "string" | "numeric" | "datetime";
    };
}
interface SessionState {
    sessionId: string | null;
    isValid: boolean;
    lastActivity: Date;
}
interface InteractMessage {
    msg: string;
    detailMsg: string;
    msgLevel: number;
    msgCode: number;
}
interface NameValuePair$1 {
    n: string;
    v: any;
    t: "string" | "numeric" | "datetime";
}
interface Command$1 {
    action: string;
    ic?: string;
    audienceID?: NameValuePair$1[];
    audienceLevel?: string;
    parameters?: NameValuePair$1[];
    relyOnExistingSession?: boolean;
    debug?: boolean;
    ip?: string;
    numberRequested?: number;
    event?: string;
    getOfferRequests?: any[];
}
interface OfferAttribute {
    n: string;
    v: any;
    t: string;
}
interface Offer {
    n: string;
    code: string[];
    treatmentCode: string;
    score: number;
    desc: string;
    attributes: OfferAttribute[];
}
interface OfferList {
    interactionPointName: string;
    defaultString: string;
    offers: Offer[];
}
interface InteractResponse {
    sessionId?: string;
    statusCode: number;
    offerLists?: OfferList[];
    profile?: NameValuePair$1[];
    version?: string;
    messages?: InteractMessage[];
}
interface BatchResponse {
    batchStatusCode: number;
    responses: InteractResponse[];
}
declare class InteractClient {
    private config;
    private tokenId;
    private sessionState;
    constructor(config: InteractConfig);
    private convertAudienceToArray;
    static convertAudienceToArray(audience: AudienceConfig): NameValuePair$1[];
    getSessionId(): string | null;
    setSessionId(sessionId: string | null): void;
    isSessionValid(): boolean;
    clearSession(): void;
    static createVisitorAudience(visitorId?: string): AudienceConfig;
    static createCustomerAudience(customerId: number): AudienceConfig;
    private isSessionInvalid;
    executeBatchWithRetry(sessionId: string | null, commands: Command$1[], audience?: AudienceConfig, maxRetries?: number): Promise<BatchResponse>;
    executeBatch(sessionId: string | null, commands: Command$1[]): Promise<BatchResponse>;
    startSessionLowLevel(sessionId: string | null, audienceID: NameValuePair$1[], audienceLevel: string, parameters?: NameValuePair$1[], relyOnExistingSession?: boolean, debug?: boolean): Promise<InteractResponse>;
    startSession(audience: AudienceConfig, sessionId?: string | null): Promise<InteractResponse>;
    getOffers(sessionId: string, interactionPoint: string, numberRequested?: number): Promise<InteractResponse>;
    postEvent(sessionId: string, eventName: string, parameters?: NameValuePair$1[]): Promise<InteractResponse>;
    postEvent(eventName: string, parameters?: NameValuePair$1[], options?: {
        sessionId?: string;
        autoManageSession?: boolean;
        audience?: AudienceConfig;
    }): Promise<InteractResponse>;
    getVersion(): Promise<InteractResponse>;
    endSession(sessionId: string): Promise<InteractResponse>;
    setAudience(sessionId: string, audienceID: NameValuePair$1[], audienceLevel?: string): Promise<InteractResponse>;
    setAudienceFromConfig(sessionId: string, audience: AudienceConfig, audienceLevel?: string): Promise<InteractResponse>;
    createBatch(): BatchBuilder;
    getOffersWithSession(interactionPoint: string, numberRequested?: number, audience?: AudienceConfig): Promise<InteractResponse>;
    postEventWithSession(eventName: string, parameters?: NameValuePair$1[], audience?: AudienceConfig): Promise<InteractResponse>;
    getOffersForPage(interactionPoint: string, audience: AudienceConfig, numberRequested?: number, trackPageView?: boolean): Promise<{
        offers: Offer[];
        sessionId: string;
    }>;
    static createParameter(name: string, value: any, type?: "string" | "numeric" | "datetime"): NameValuePair$1;
    private extractFirstResponse;
}
declare class BatchBuilder {
    private client;
    private commands;
    constructor(client: InteractClient);
    startSession(audienceID: NameValuePair$1[], audienceLevel: string, parameters?: NameValuePair$1[], relyOnExistingSession?: boolean, debug?: boolean): BatchBuilder;
    getOffers(interactionPoint: string, numberRequested?: number): BatchBuilder;
    postEvent(eventName: string, parameters?: NameValuePair$1[]): BatchBuilder;
    endSession(): BatchBuilder;
    setAudience(audienceID: NameValuePair$1[], audienceLevel?: string): BatchBuilder;
    execute(sessionId: string | null): Promise<BatchResponse>;
}

interface ServletApiConfig {
    url: string;
    m_user_name?: string;
    m_user_password?: string;
    enableLog?: string;
}
interface NameValuePair {
    n: string;
    v: any;
    t: string;
}
interface Command {
    action: string;
    ic?: string;
    audienceID?: string;
    audienceLevel?: string;
    parameters?: NameValuePair[];
    relyOnExistingSession?: boolean;
    debug?: boolean;
    ip?: string;
    numberRequested?: number;
    event?: string;
    getOfferRequests?: any[];
}
interface ServletResponse {
    sessionId?: string;
    statusCode: number;
    offerLists?: any[];
    profile?: NameValuePair[];
    version?: string;
    messages?: any[];
}
interface ServletBatchResponse {
    batchStatusCode: number;
    responses: ServletResponse[];
}
declare class InteractServletClient {
    private config;
    constructor(config: ServletApiConfig);
    private executeCmd;
    executeBatch(sessionId: string | null, commands: Command[]): Promise<ServletBatchResponse>;
    getVersion(): Promise<ServletResponse>;
    startSession(sessionId: string | null, ic: string, audienceID: string, audienceLevel: string, parameters?: NameValuePair[], relyOnExistingSession?: boolean, debug?: boolean): Promise<ServletResponse>;
    getOffers(sessionId: string, ip: string, numberRequested: number): Promise<ServletResponse>;
    endSession(sessionId: string): Promise<ServletResponse>;
    getProfile(sessionId: string): Promise<ServletResponse>;
    postEvent(sessionId: string, event: string, parameters?: NameValuePair[]): Promise<ServletResponse>;
    private createGetVersionCmd;
    private createEndSessionCmd;
    private createStartSessionCmd;
    private createGetOffersCmd;
    private createGetProfileCmd;
    private createPostEventCmd;
    private extractFirstResponse;
    static createParameter(name: string, value: any, type?: "string" | "numeric" | "datetime"): NameValuePair;
    private getTokenFromCookie;
    private setTokenCookie;
}

interface ApiConfig {
    baseUrl?: string;
    userName?: string;
    defaultHeaders?: Record<string, string>;
}
interface ParameterVO {
    n: string;
    t: string;
    v: any;
}
interface ResponseVO {
    messages?: AdvisoryMessageVO[];
    sessionId?: string;
    version?: string;
    statusCode?: number;
    profile?: ParameterVO[];
    offerLists?: OfferListVO[];
    attributeMap?: Record<string, number>;
}
interface AdvisoryMessageVO {
    msgCode?: number;
    msgLevel?: number;
    msg?: string;
    detailMsg?: string;
}
interface OfferListVO {
    ip?: string;
    defaultString?: string;
    offers?: OfferVO[];
}
interface OfferVO {
    n?: string;
    code?: string[];
    treatmentCode?: string;
    score?: number;
    desc?: string;
    attributes?: ParameterVO[];
}
interface StartSessionVO {
    debug?: boolean;
    relyOnExistingSession?: boolean;
    parameters?: ParameterVO[];
    auIdParams?: ParameterVO[];
}
interface SetAudienceVO {
    parameters?: ParameterVO[];
}
interface PostEventVO {
    parameters?: ParameterVO[];
}
interface OfferAttribRequirementVO {
    numberRequested?: number;
    attributes?: ParameterVO[];
    childRequirements?: OfferAttribRequirementVO[];
}
interface StartSessionCommandVO {
    ic: string;
    audienceLevel: string;
    audienceID: ParameterVO[];
    debug?: boolean;
    relyOnExistingSession?: boolean;
    parameters?: ParameterVO[];
    auIdParams?: ParameterVO[];
}
interface GetOffersCommandVO {
    interactionPointID: string;
    numberRequested: number;
    parameters?: ParameterVO[];
}
interface PostEventCommandVO {
    event: string;
    parameters?: ParameterVO[];
}
interface SetAudienceCommandVO {
    audienceLevel: string;
    audienceID: ParameterVO[];
    parameters?: ParameterVO[];
}
interface SetDebugCommandVO {
    debug: boolean;
}
interface DeploymentInfoVO {
    deployment?: any;
}
interface DataSourceInfoVO {
    dataSourceName?: string;
    jndiName?: string;
    schemaName?: string;
    dbType?: string;
    userName?: string;
    status?: boolean;
}
interface InteractResourceConsumption {
    sysCpuLoad?: number;
    sysTotalPhyscialMemory?: number;
    sysFreePhyscialMemory?: number;
    processCpuLoad?: number;
    processTotalMemory?: number;
    processAllocatedMemory?: number;
}

declare class InteractApiError extends Error {
    status: number;
    statusText: string;
    constructor(status: number, statusText: string, message?: string);
}

export { type AdvisoryMessageVO, type ApiConfig, type AudienceConfig, BatchBuilder, type BatchResponse, type Command$1 as Command, type DataSourceInfoVO, type DeploymentInfoVO, type GetOffersCommandVO, InteractClient, type InteractConfig, InteractApiError as InteractError, type InteractResourceConsumption, type InteractResponse, InteractServletClient, type NameValuePair$1 as NameValuePair, type Offer, type OfferAttribRequirementVO, type OfferAttribute, type OfferList, type OfferListVO, type OfferVO, type ParameterVO, type PostEventCommandVO, type PostEventVO, type ResponseVO, type SessionState, type SetAudienceCommandVO, type SetAudienceVO, type SetDebugCommandVO, type StartSessionCommandVO, type StartSessionVO, InteractClient as default };
