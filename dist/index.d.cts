interface ApiConfig {
    baseUrl?: string;
    username?: string;
    password?: string;
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
interface GetOffersMultipleIPCommandVO {
    getOfferRequests: GetOfferRequestsVO[];
    parameters?: ParameterVO[];
}
interface GetOfferRequestsVO {
    dupPolicy: number;
    ip: string;
    numberRequested: number;
    offerAttributes?: OfferAttribRequirementVO;
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
interface BatchExecuteCommandVO {
    startSession?: StartSessionCommandVO;
    getOffers?: GetOffersCommandVO;
    getOffersForMultipleInteractionPoints?: GetOffersMultipleIPCommandVO;
    postEvent?: PostEventCommandVO;
    setAudience?: SetAudienceCommandVO;
    getProfile?: any;
    endSession?: any;
    setDebug?: SetDebugCommandVO;
    getVersion?: boolean;
}
interface BatchResponseVO {
    responses?: ResponseVO[];
    batchStatusCode?: number;
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
declare class InteractApiClient {
    private baseUrl;
    private defaultHeaders;
    constructor(config?: ApiConfig);
    private request;
    startSession(sessionId: string, ic: string, audienceLevel: string, audienceIDField: string, body?: StartSessionVO, escapeHtml?: boolean): Promise<ResponseVO>;
    endSession(sessionId: string, parameters?: string, escapeHtml?: boolean): Promise<ResponseVO>;
    setAudience(sessionId: string, audienceLevel: string, audienceIDField: string, body: SetAudienceVO, escapeHtml?: boolean): Promise<ResponseVO>;
    getOffers(sessionId: string, interactionPointID: string, number?: number, parameters?: string, escapeHtml?: boolean): Promise<ResponseVO>;
    getOffersForMultipleIPs(sessionId: string, body: GetOffersMultipleIPCommandVO, parameters?: string, escapeHtml?: boolean): Promise<ResponseVO>;
    postEvent(sessionId: string, eventName: string, body?: PostEventVO, escapeHtml?: boolean): Promise<ResponseVO>;
    getProfile(sessionId: string, parameters?: string, escapeHtml?: boolean): Promise<ResponseVO>;
    batchExecute(sessionId: string, body: BatchExecuteCommandVO, escapeHtml?: boolean): Promise<BatchResponseVO>;
    /**
     * Complete interaction workflow in a single batch call:
     * Start session → Get offers → End session
     * This is the most common pattern for web interactions
     */
    executeCompleteInteraction(sessionId: string, ic: string, audienceLevel: string, audienceID: ParameterVO[], interactionPointID: string, numberOffers?: number, options?: {
        sessionParameters?: ParameterVO[];
        offerParameters?: ParameterVO[];
        debug?: boolean;
        relyOnExistingSession?: boolean;
    }): Promise<BatchResponseVO>;
    /**
     * Session with event tracking and offers:
     * Start session → Post event → Get offers → End session
     */
    executeInteractionWithEvent(sessionId: string, ic: string, audienceLevel: string, audienceID: ParameterVO[], eventName: string, interactionPointID: string, numberOffers?: number, options?: {
        sessionParameters?: ParameterVO[];
        eventParameters?: ParameterVO[];
        offerParameters?: ParameterVO[];
        debug?: boolean;
    }): Promise<BatchResponseVO>;
    /**
     * Multi-touchpoint interaction in one batch:
     * Start session → Get offers for multiple interaction points → End session
     */
    executeMultiTouchpointInteraction(sessionId: string, ic: string, audienceLevel: string, audienceID: ParameterVO[], offerRequests: GetOfferRequestsVO[], options?: {
        sessionParameters?: ParameterVO[];
        offerParameters?: ParameterVO[];
        debug?: boolean;
    }): Promise<BatchResponseVO>;
    /**
     * Profile and offers workflow:
     * Start session → Get profile → Get offers → End session
     */
    executeProfileBasedInteraction(sessionId: string, ic: string, audienceLevel: string, audienceID: ParameterVO[], interactionPointID: string, numberOffers?: number, options?: {
        sessionParameters?: ParameterVO[];
        offerParameters?: ParameterVO[];
        debug?: boolean;
    }): Promise<BatchResponseVO>;
    /**
     * Custom batch builder for advanced scenarios
     */
    createBatchBuilder(sessionId: string): BatchBuilder;
    getStatus(): Promise<ResponseVO>;
    getResourceConsumption(): Promise<InteractResourceConsumption>;
    getActiveDeployments(): Promise<DeploymentInfoVO[]>;
    getDeploymentByIcId(icIdOrName: string): Promise<DeploymentInfoVO>;
    getDataSources(): Promise<DataSourceInfoVO[]>;
    testDataSourceConnection(datasourceName: string): Promise<boolean>;
    getGDPRSQLScripts(body: any[], querySeparator?: string, nlsPrefix?: string, returnZip?: boolean): Promise<any>;
    syncConsent(): Promise<ResponseVO>;
    static createParameter(name: string, type: string, value: any): ParameterVO;
    static createParameters(params: Array<{
        name: string;
        type: string;
        value: any;
    }>): ParameterVO[];
}
declare function createInteractClient(config?: ApiConfig): InteractApiClient;
declare class BatchBuilder {
    private client;
    private sessionId;
    private batchCommand;
    constructor(client: InteractApiClient, sessionId: string);
    startSession(ic: string, audienceLevel: string, audienceID: ParameterVO[], options?: {
        debug?: boolean;
        relyOnExistingSession?: boolean;
        parameters?: ParameterVO[];
        auIdParams?: ParameterVO[];
    }): BatchBuilder;
    getOffers(interactionPointID: string, numberRequested?: number, parameters?: ParameterVO[]): BatchBuilder;
    getOffersMultiple(offerRequests: GetOfferRequestsVO[], parameters?: ParameterVO[]): BatchBuilder;
    postEvent(eventName: string, parameters?: ParameterVO[]): BatchBuilder;
    setAudience(audienceLevel: string, audienceID: ParameterVO[], parameters?: ParameterVO[]): BatchBuilder;
    getProfile(): BatchBuilder;
    endSession(): BatchBuilder;
    setDebug(debug: boolean): BatchBuilder;
    getVersion(): BatchBuilder;
    execute(): Promise<BatchResponseVO>;
    build(): BatchExecuteCommandVO;
}

export { type AdvisoryMessageVO, type ApiConfig, BatchBuilder, type BatchExecuteCommandVO, type BatchResponseVO, type DataSourceInfoVO, type DeploymentInfoVO, type GetOfferRequestsVO, type GetOffersCommandVO, type GetOffersMultipleIPCommandVO, InteractApiClient, InteractApiError, type InteractResourceConsumption, type OfferAttribRequirementVO, type OfferListVO, type OfferVO, type ParameterVO, type PostEventCommandVO, type PostEventVO, type ResponseVO, type SetAudienceCommandVO, type SetAudienceVO, type SetDebugCommandVO, type StartSessionCommandVO, type StartSessionVO, createInteractClient, InteractApiClient as default };
