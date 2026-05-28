import { Configuration, LogLevel, PublicClientApplication } from "@azure/msal-browser";

/**
 * MSAL Configuration
 */
export const msalConfig: Configuration = {
    auth: {
        clientId: import.meta.env.VITE_AZURE_CLIENT_ID || "CLIENT_ID_MISSING",
        authority: `https://login.microsoftonline.com/${import.meta.env.VITE_AZURE_TENANT_ID || "common"}`,
        redirectUri: import.meta.env.VITE_AZURE_REDIRECT_URI || "http://localhost:5177",
        navigateToLoginRequestUrl: true,
    },
    cache: {
        cacheLocation: "sessionStorage", // 'localStorage' or 'sessionStorage'
        storeAuthStateInCookie: false,
    },
    system: {
        loggerOptions: {
            loggerCallback: (level, message, containsPii) => {
                if (containsPii) return;
                switch (level) {
                    case LogLevel.Error: console.error(message); return;
                    case LogLevel.Info: console.info(message); return;
                    case LogLevel.Verbose: console.debug(message); return;
                    case LogLevel.Warning: console.warn(message); return;
                    default: return;
                }
            }
        }
    }
};

/**
 * Scopes for Login
 */
export const loginRequest = {
    scopes: ["User.Read"]
};

/**
 * Graph Endpoints
 */
export const graphConfig = {
    graphMeEndpoint: "https://graph.microsoft.com/v1.0/me"
};

export const msalInstance = new PublicClientApplication(msalConfig);
