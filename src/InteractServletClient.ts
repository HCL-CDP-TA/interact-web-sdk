// Servlet Interact API Client
// Compatible with the original interactapi.js servlet-based API
import InteractApiError from "./InteractError.js"

export interface ServletApiConfig {
  url: string // Base URL to the server (e.g., "https://yourserver.com/interact")
  m_user_name?: string
  m_user_password?: string
  enableLog?: string // "true" to enable logging
}

export interface NameValuePair {
  n: string // name
  v: any // value
  t: string // type: "string", "numeric", "datetime"
}

export interface Command {
  action: string
  ic?: string // interactive channel
  audienceID?: string
  audienceLevel?: string
  parameters?: NameValuePair[]
  relyOnExistingSession?: boolean
  debug?: boolean
  ip?: string // interaction point
  numberRequested?: number
  event?: string
  getOfferRequests?: any[]
}

export interface ServletResponse {
  sessionId?: string
  statusCode: number
  offerLists?: any[]
  profile?: NameValuePair[]
  version?: string
  messages?: any[]
}

export interface ServletBatchResponse {
  batchStatusCode: number
  responses: ServletResponse[]
}

export interface ServletCallback {
  successCb?: (response: ServletResponse) => void
  failureCb?: (error: any) => void
}

export class InteractServletClient {
  private config: ServletApiConfig

  constructor(config: ServletApiConfig) {
    this.config = config
  }

  // Core execute command method that mimics the original interactapi.js
  private async executeCmd(requestBody: string): Promise<any> {
    const url = this.config.url + "/servlet/RestServlet"

    const headers: Record<string, string> = {
      "Content-type": "application/json; charset=utf-8",
    }

    // Check for token in cookie (simplified - in browser this would use document.cookie)
    const tokenId = this.getTokenFromCookie("m_tokenId")
    if (tokenId) {
      headers["m_tokenId"] = tokenId
    } else if (this.config.m_user_name) {
      headers["m_user_name"] = encodeURIComponent(this.config.m_user_name)
      headers["m_user_password"] = encodeURIComponent(this.config.m_user_password || "")
    }

    if (this.config.enableLog === "true") {
      console.log("Executing commands: " + requestBody)
    }

    try {
      const response = await fetch(url, {
        method: "POST",
        headers,
        body: requestBody,
      })

      // Handle token response header (simplified)
      const responseTokenId = response.headers.get("m_tokenId")
      if (responseTokenId) {
        this.setTokenCookie("m_tokenId", responseTokenId, requestBody.indexOf("endSession") > -1)
      }

      let responseData: any
      const responseText = await response.text()

      try {
        responseData = JSON.parse(responseText)
      } catch (e) {
        responseData = responseText
      }

      if (response.status === 200) {
        if (this.config.enableLog === "true") {
          console.log("Response: " + responseText)
        }
        return responseData
      } else {
        if (this.config.enableLog === "true") {
          console.error("Response: " + responseText)
        }
        throw new InteractApiError(response.status, response.statusText, `Request failed: ${response.status}`)
      }
    } catch (error) {
      throw error
    }
  }

  // Execute batch commands - this is the main method matching the original API
  async executeBatch(sessionId: string | null, commands: Command[]): Promise<ServletBatchResponse> {
    const requestBody = JSON.stringify({
      sessionId: sessionId,
      commands: commands,
    })

    return this.executeCmd(requestBody)
  }

  // Convenience methods that match the original interactapi.js API

  async getVersion(): Promise<ServletResponse> {
    const commands = [this.createGetVersionCmd()]
    const batchResponse = await this.executeBatch(null, commands)
    return this.extractFirstResponse(batchResponse)
  }

  async startSession(
    sessionId: string | null,
    ic: string,
    audienceID: string,
    audienceLevel: string,
    parameters?: NameValuePair[],
    relyOnExistingSession?: boolean,
    debug?: boolean,
  ): Promise<ServletResponse> {
    const commands = [
      this.createStartSessionCmd(ic, audienceID, audienceLevel, parameters, relyOnExistingSession, debug),
    ]
    const batchResponse = await this.executeBatch(sessionId, commands)
    return this.extractFirstResponse(batchResponse)
  }

  async getOffers(sessionId: string, ip: string, numberRequested: number): Promise<ServletResponse> {
    const commands = [this.createGetOffersCmd(ip, numberRequested)]
    const batchResponse = await this.executeBatch(sessionId, commands)
    return this.extractFirstResponse(batchResponse)
  }

  async endSession(sessionId: string): Promise<ServletResponse> {
    const commands = [this.createEndSessionCmd()]
    const batchResponse = await this.executeBatch(sessionId, commands)
    return this.extractFirstResponse(batchResponse)
  }

  async getProfile(sessionId: string): Promise<ServletResponse> {
    const commands = [this.createGetProfileCmd()]
    const batchResponse = await this.executeBatch(sessionId, commands)
    return this.extractFirstResponse(batchResponse)
  }

  async postEvent(sessionId: string, event: string, parameters?: NameValuePair[]): Promise<ServletResponse> {
    const commands = [this.createPostEventCmd(event, parameters)]
    const batchResponse = await this.executeBatch(sessionId, commands)
    return this.extractFirstResponse(batchResponse)
  }

  // Command builders that match the original CommandUtil
  private createGetVersionCmd(): Command {
    return { action: "getVersion" }
  }

  private createEndSessionCmd(): Command {
    return { action: "endSession" }
  }

  private createStartSessionCmd(
    ic: string,
    audienceID: string,
    audienceLevel: string,
    parameters?: NameValuePair[],
    relyOnExistingSession?: boolean,
    debug?: boolean,
  ): Command {
    const cmd: Command = {
      action: "startSession",
      ic: ic,
      audienceID: audienceID,
      audienceLevel: audienceLevel,
      relyOnExistingSession: relyOnExistingSession,
      debug: debug,
    }
    if (parameters) {
      cmd.parameters = parameters
    }
    return cmd
  }

  private createGetOffersCmd(ip: string, numberRequested: number): Command {
    return {
      action: "getOffers",
      ip: ip,
      numberRequested: numberRequested,
    }
  }

  private createGetProfileCmd(): Command {
    return { action: "getProfile" }
  }

  private createPostEventCmd(event: string, parameters?: NameValuePair[]): Command {
    const cmd: Command = {
      action: "postEvent",
      event: event,
    }
    if (parameters) {
      cmd.parameters = parameters
    }
    return cmd
  }

  // Helper to extract first response from batch (matching FirstResponseCallback behavior)
  private extractFirstResponse(batchResponse: ServletBatchResponse): ServletResponse {
    if (batchResponse.responses && batchResponse.responses.length >= 1) {
      return batchResponse.responses[0]
    }
    throw new InteractApiError(0, "No response in batch")
  }

  // Utility to create name-value pairs
  static createParameter(name: string, value: any, type: "string" | "numeric" | "datetime" = "string"): NameValuePair {
    return { n: name, v: value, t: type }
  }

  // Simplified cookie handling (in real browser environment, this would use document.cookie)
  private getTokenFromCookie(name: string): string | null {
    // In a real implementation, this would parse document.cookie
    // For now, return null to fall back to username/password auth
    return null
  }

  private setTokenCookie(name: string, value: string, endSession: boolean): void {
    // In a real implementation, this would set document.cookie
    // For now, we'll skip cookie management
  }
}
