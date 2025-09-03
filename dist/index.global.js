"use strict";
var HCLInteractSDK = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // src/index.ts
  var index_exports = {};
  __export(index_exports, {
    BatchBuilder: () => BatchBuilder,
    InteractClient: () => InteractClient,
    InteractError: () => InteractApiError,
    InteractServletClient: () => InteractServletClient,
    default: () => InteractClient
  });

  // src/InteractClient.ts
  var InteractClient = class {
    config;
    tokenId = null;
    sessionState = {
      sessionId: null,
      isValid: false,
      lastActivity: /* @__PURE__ */ new Date()
    };
    constructor(config) {
      this.config = {
        ...config,
        interactiveChannel: config.interactiveChannel || "_RealTimePersonalization_"
      };
    }
    // Helper to convert AudienceConfig to NameValuePair array
    convertAudienceToArray(audience) {
      return [
        {
          n: audience.audienceId.name,
          v: audience.audienceId.value,
          t: audience.audienceId.type
        }
      ];
    }
    // Public helper for users who need to create audience arrays manually
    static convertAudienceToArray(audience) {
      return [
        {
          n: audience.audienceId.name,
          v: audience.audienceId.value,
          t: audience.audienceId.type
        }
      ];
    }
    // Session management methods
    getSessionId() {
      return this.sessionState.sessionId;
    }
    setSessionId(sessionId) {
      this.sessionState.sessionId = sessionId;
      this.sessionState.isValid = !!sessionId;
      this.sessionState.lastActivity = /* @__PURE__ */ new Date();
    }
    isSessionValid() {
      return this.sessionState.isValid && !!this.sessionState.sessionId;
    }
    clearSession() {
      this.sessionState = {
        sessionId: null,
        isValid: false,
        lastActivity: /* @__PURE__ */ new Date()
      };
    }
    // Helper methods for default audience configurations
    static createVisitorAudience(visitorId = "0") {
      return {
        audienceLevel: "Visitor",
        audienceId: {
          name: "VisitorID",
          value: visitorId,
          type: "string"
        }
      };
    }
    static createCustomerAudience(customerId) {
      return {
        audienceLevel: "Customer",
        audienceId: {
          name: "CustomerID",
          value: customerId,
          type: "numeric"
        }
      };
    }
    // Check if response indicates session is invalid
    isSessionInvalid(response) {
      return response.responses?.some(
        (r) => r.statusCode === 2 && r.messages?.some((m) => m.msgLevel === 2 && m.msg.toLowerCase().includes("invalid session id"))
      ) || false;
    }
    // Execute batch with automatic session retry
    async executeBatchWithRetry(sessionId, commands, audience, maxRetries = 1) {
      let currentSessionId = sessionId || this.sessionState.sessionId;
      let attempt = 0;
      while (attempt <= maxRetries) {
        try {
          const response = await this.executeBatch(currentSessionId, commands);
          if (response.responses?.[0]?.sessionId) {
            this.setSessionId(response.responses[0].sessionId);
          }
          if (this.isSessionInvalid(response) && attempt < maxRetries) {
            if (this.config.enableLogging) {
              console.warn("Session invalid, retrying with new session...");
            }
            this.clearSession();
            if (audience) {
              const newSessionResponse = await this.startSessionLowLevel(
                null,
                this.convertAudienceToArray(audience),
                audience.audienceLevel
              );
              if (newSessionResponse.sessionId) {
                currentSessionId = newSessionResponse.sessionId;
                this.setSessionId(currentSessionId);
                attempt++;
                continue;
              }
            }
            throw new Error("Failed to establish new session after invalid session");
          }
          return response;
        } catch (error) {
          if (attempt >= maxRetries) {
            throw error;
          }
          attempt++;
        }
      }
      throw new Error("Max retries exceeded");
    }
    // Core batch execution - the main method for all API calls
    async executeBatch(sessionId, commands) {
      const url = `${this.config.serverUrl}/servlet/RestServlet`;
      const headers = {
        "Content-Type": "application/json; charset=utf-8"
      };
      if (this.tokenId) {
        headers["m_tokenId"] = this.tokenId;
      } else if (this.config.username) {
        headers["m_user_name"] = encodeURIComponent(this.config.username);
        headers["m_user_password"] = encodeURIComponent(this.config.password || "");
      }
      const requestBody = {
        commands
      };
      if (sessionId !== null) {
        requestBody.sessionId = sessionId;
      }
      const requestBodyString = JSON.stringify(requestBody);
      if (this.config.enableLogging) {
        console.log("Interact Request:", requestBodyString);
      }
      try {
        const response = await fetch(url, {
          method: "POST",
          headers,
          body: requestBodyString
        });
        const responseTokenId = response.headers.get("m_tokenId");
        if (responseTokenId) {
          this.tokenId = responseTokenId;
        }
        const responseData = await response.json();
        if (response.status === 200) {
          if (this.config.enableLogging) {
            console.log("Interact Response:", responseData);
          }
          return responseData;
        } else {
          throw new Error(`Interact API error: ${response.status}`);
        }
      } catch (error) {
        if (this.config.enableLogging) {
          console.error("Interact API error:", error);
        }
        throw error;
      }
    }
    // Convenience methods for common operations
    // Low-level session start with full control
    async startSessionLowLevel(sessionId, audienceID, audienceLevel, parameters, relyOnExistingSession = true, debug = false) {
      const commands = [
        {
          action: "startSession",
          ic: this.config.interactiveChannel,
          audienceID,
          audienceLevel,
          parameters,
          relyOnExistingSession,
          debug
        }
      ];
      const batchResponse = await this.executeBatch(sessionId, commands);
      return this.extractFirstResponse(batchResponse);
    }
    // Main session start method with audience config and optional sessionId
    async startSession(audience, sessionId) {
      const audienceIdArray = this.convertAudienceToArray(audience);
      const response = await this.startSessionLowLevel(sessionId ?? null, audienceIdArray, audience.audienceLevel);
      if (response.sessionId) {
        this.setSessionId(response.sessionId);
      }
      return response;
    }
    async getOffers(sessionId, interactionPoint, numberRequested = 1) {
      const commands = [
        {
          action: "getOffers",
          ip: interactionPoint,
          numberRequested
        }
      ];
      const batchResponse = await this.executeBatch(sessionId, commands);
      return this.extractFirstResponse(batchResponse);
    }
    // Implementation handles both signatures
    async postEvent(sessionIdOrEventName, eventNameOrParameters, parametersOrOptions) {
      if (typeof eventNameOrParameters === "string") {
        const sessionId = sessionIdOrEventName;
        const eventName = eventNameOrParameters;
        const parameters = parametersOrOptions;
        const commands = [
          {
            action: "postEvent",
            event: eventName,
            parameters
          }
        ];
        const batchResponse = await this.executeBatch(sessionId, commands);
        return this.extractFirstResponse(batchResponse);
      } else {
        const eventName = sessionIdOrEventName;
        const parameters = eventNameOrParameters;
        const options = parametersOrOptions;
        const { sessionId: explicitSessionId, autoManageSession = false, audience } = options || {};
        let sessionId = explicitSessionId;
        if (!sessionId) {
          if (autoManageSession) {
            sessionId = this.getSessionId() || void 0;
            if (!sessionId && audience) {
              const sessionResponse = await this.startSession(audience);
              sessionId = sessionResponse.sessionId || void 0;
            }
            if (!sessionId) {
              throw new Error("No session available and no audience provided to start new session");
            }
            const commands2 = [
              {
                action: "postEvent",
                event: eventName,
                parameters
              }
            ];
            const batchResponse2 = await this.executeBatchWithRetry(sessionId, commands2, audience);
            return this.extractFirstResponse(batchResponse2);
          } else {
            throw new Error("No sessionId provided and autoManageSession not enabled");
          }
        }
        const commands = [
          {
            action: "postEvent",
            event: eventName,
            parameters
          }
        ];
        const batchResponse = await this.executeBatch(sessionId, commands);
        return this.extractFirstResponse(batchResponse);
      }
    }
    async getVersion() {
      const commands = [
        {
          action: "getVersion"
        }
      ];
      const batchResponse = await this.executeBatch(null, commands);
      return this.extractFirstResponse(batchResponse);
    }
    async endSession(sessionId) {
      const commands = [
        {
          action: "endSession"
        }
      ];
      const batchResponse = await this.executeBatch(sessionId, commands);
      return this.extractFirstResponse(batchResponse);
    }
    async setAudience(sessionId, audienceID, audienceLevel) {
      const commands = [
        {
          action: "setAudience",
          audienceID,
          audienceLevel
        }
      ];
      const batchResponse = await this.executeBatch(sessionId, commands);
      const response = this.extractFirstResponse(batchResponse);
      if (response.sessionId) {
        this.setSessionId(response.sessionId);
      }
      return response;
    }
    async setAudienceFromConfig(sessionId, audience, audienceLevel) {
      const audienceIdArray = this.convertAudienceToArray(audience);
      return this.setAudience(sessionId, audienceIdArray, audienceLevel);
    }
    // Batch builder for complex workflows
    createBatch() {
      return new BatchBuilder(this);
    }
    // Enhanced convenience methods with automatic session management
    async getOffersWithSession(interactionPoint, numberRequested = 1, audience) {
      let sessionId = this.getSessionId();
      if (!sessionId && audience) {
        const sessionResponse = await this.startSession(audience);
        sessionId = sessionResponse.sessionId || null;
      }
      if (!sessionId) {
        throw new Error("No session available and no audience provided to start new session");
      }
      const commands = [
        {
          action: "getOffers",
          ip: interactionPoint,
          numberRequested
        }
      ];
      const batchResponse = await this.executeBatchWithRetry(sessionId, commands, audience);
      return this.extractFirstResponse(batchResponse);
    }
    // Backward compatibility wrapper for postEventWithSession
    async postEventWithSession(eventName, parameters, audience) {
      return this.postEvent(eventName, parameters, { autoManageSession: true, audience });
    }
    // Complete workflow methods
    async getOffersForPage(interactionPoint, audience, numberRequested = 1, trackPageView = true) {
      const batch = this.createBatch();
      const audienceIdArray = this.convertAudienceToArray(audience);
      batch.startSession(audienceIdArray, audience.audienceLevel);
      if (trackPageView) {
        batch.postEvent("page_view");
      }
      batch.getOffers(interactionPoint, numberRequested);
      const results = await batch.execute(null);
      const sessionId = results.responses?.[0]?.sessionId;
      if (sessionId) {
        this.setSessionId(sessionId);
      }
      const offersResponse = results.responses?.find((r) => r.offerLists && r.offerLists.length > 0);
      const offers = offersResponse?.offerLists?.[0]?.offers || [];
      return {
        offers,
        sessionId: sessionId || this.getSessionId() || ""
      };
    }
    // Helper methods
    static createParameter(name, value, type = "string") {
      return { n: name, v: value, t: type };
    }
    extractFirstResponse(batchResponse) {
      if (batchResponse.responses && batchResponse.responses.length >= 1) {
        return batchResponse.responses[0];
      }
      throw new Error("No response in batch");
    }
  };
  var BatchBuilder = class {
    client;
    commands = [];
    constructor(client) {
      this.client = client;
    }
    startSession(audienceID, audienceLevel, parameters, relyOnExistingSession = true, debug = false) {
      this.commands.push({
        action: "startSession",
        ic: this.client["config"].interactiveChannel,
        audienceID,
        audienceLevel,
        parameters,
        relyOnExistingSession,
        debug
      });
      return this;
    }
    getOffers(interactionPoint, numberRequested = 1) {
      this.commands.push({
        action: "getOffers",
        ip: interactionPoint,
        numberRequested
      });
      return this;
    }
    postEvent(eventName, parameters) {
      this.commands.push({
        action: "postEvent",
        event: eventName,
        parameters
      });
      return this;
    }
    endSession() {
      this.commands.push({
        action: "endSession"
      });
      return this;
    }
    setAudience(audienceID, audienceLevel) {
      this.commands.push({
        action: "setAudience",
        audienceID,
        audienceLevel
      });
      return this;
    }
    async execute(sessionId) {
      const result = await this.client.executeBatch(sessionId, this.commands);
      this.commands = [];
      return result;
    }
  };

  // src/InteractError.ts
  var InteractApiError = class extends Error {
    constructor(status, statusText, message) {
      super(message || `API Error: ${status} ${statusText}`);
      this.status = status;
      this.statusText = statusText;
      this.name = "InteractApiError";
    }
  };

  // src/InteractServletClient.ts
  var InteractServletClient = class {
    config;
    constructor(config) {
      this.config = config;
    }
    // Core execute command method that mimics the original interactapi.js
    async executeCmd(requestBody) {
      const url = this.config.url + "/servlet/RestServlet";
      const headers = {
        "Content-type": "application/json; charset=utf-8"
      };
      const tokenId = this.getTokenFromCookie("m_tokenId");
      if (tokenId) {
        headers["m_tokenId"] = tokenId;
      } else if (this.config.m_user_name) {
        headers["m_user_name"] = encodeURIComponent(this.config.m_user_name);
        headers["m_user_password"] = encodeURIComponent(this.config.m_user_password || "");
      }
      if (this.config.enableLog === "true") {
        console.log("Executing commands: " + requestBody);
      }
      try {
        const response = await fetch(url, {
          method: "POST",
          headers,
          body: requestBody
        });
        const responseTokenId = response.headers.get("m_tokenId");
        if (responseTokenId) {
          this.setTokenCookie("m_tokenId", responseTokenId, requestBody.indexOf("endSession") > -1);
        }
        let responseData;
        const responseText = await response.text();
        try {
          responseData = JSON.parse(responseText);
        } catch (e) {
          responseData = responseText;
        }
        if (response.status === 200) {
          if (this.config.enableLog === "true") {
            console.log("Response: " + responseText);
          }
          return responseData;
        } else {
          if (this.config.enableLog === "true") {
            console.error("Response: " + responseText);
          }
          throw new InteractApiError(response.status, response.statusText, `Request failed: ${response.status}`);
        }
      } catch (error) {
        throw error;
      }
    }
    // Execute batch commands - this is the main method matching the original API
    async executeBatch(sessionId, commands) {
      const requestBody = JSON.stringify({
        sessionId,
        commands
      });
      return this.executeCmd(requestBody);
    }
    // Convenience methods that match the original interactapi.js API
    async getVersion() {
      const commands = [this.createGetVersionCmd()];
      const batchResponse = await this.executeBatch(null, commands);
      return this.extractFirstResponse(batchResponse);
    }
    async startSession(sessionId, ic, audienceID, audienceLevel, parameters, relyOnExistingSession, debug) {
      const commands = [
        this.createStartSessionCmd(ic, audienceID, audienceLevel, parameters, relyOnExistingSession, debug)
      ];
      const batchResponse = await this.executeBatch(sessionId, commands);
      return this.extractFirstResponse(batchResponse);
    }
    async getOffers(sessionId, ip, numberRequested) {
      const commands = [this.createGetOffersCmd(ip, numberRequested)];
      const batchResponse = await this.executeBatch(sessionId, commands);
      return this.extractFirstResponse(batchResponse);
    }
    async endSession(sessionId) {
      const commands = [this.createEndSessionCmd()];
      const batchResponse = await this.executeBatch(sessionId, commands);
      return this.extractFirstResponse(batchResponse);
    }
    async getProfile(sessionId) {
      const commands = [this.createGetProfileCmd()];
      const batchResponse = await this.executeBatch(sessionId, commands);
      return this.extractFirstResponse(batchResponse);
    }
    async postEvent(sessionId, event, parameters) {
      const commands = [this.createPostEventCmd(event, parameters)];
      const batchResponse = await this.executeBatch(sessionId, commands);
      return this.extractFirstResponse(batchResponse);
    }
    // Command builders that match the original CommandUtil
    createGetVersionCmd() {
      return { action: "getVersion" };
    }
    createEndSessionCmd() {
      return { action: "endSession" };
    }
    createStartSessionCmd(ic, audienceID, audienceLevel, parameters, relyOnExistingSession, debug) {
      const cmd = {
        action: "startSession",
        ic,
        audienceID,
        audienceLevel,
        relyOnExistingSession,
        debug
      };
      if (parameters) {
        cmd.parameters = parameters;
      }
      return cmd;
    }
    createGetOffersCmd(ip, numberRequested) {
      return {
        action: "getOffers",
        ip,
        numberRequested
      };
    }
    createGetProfileCmd() {
      return { action: "getProfile" };
    }
    createPostEventCmd(event, parameters) {
      const cmd = {
        action: "postEvent",
        event
      };
      if (parameters) {
        cmd.parameters = parameters;
      }
      return cmd;
    }
    // Helper to extract first response from batch (matching FirstResponseCallback behavior)
    extractFirstResponse(batchResponse) {
      if (batchResponse.responses && batchResponse.responses.length >= 1) {
        return batchResponse.responses[0];
      }
      throw new InteractApiError(0, "No response in batch");
    }
    // Utility to create name-value pairs
    static createParameter(name, value, type = "string") {
      return { n: name, v: value, t: type };
    }
    // Simplified cookie handling (in real browser environment, this would use document.cookie)
    getTokenFromCookie(name) {
      return null;
    }
    setTokenCookie(name, value, endSession) {
    }
  };
  return __toCommonJS(index_exports);
})();
//# sourceMappingURL=index.global.js.map