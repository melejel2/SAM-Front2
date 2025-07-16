import { Configuration } from "@azure/msal-browser";

// MSAL Configuration
export const msalConfig: Configuration = {
    auth: {
        clientId: "c4ad80cc-fc74-4242-aa70-1310a95a48b1",
        authority: "https://login.microsoftonline.com/38af5e2f-8acc-403f-817b-c3945e1e3d35",
        redirectUri: `${window.location.origin}/dashboard`,
        postLogoutRedirectUri: `${window.location.origin}/auth/login`
    },
    cache: {
        cacheLocation: "localStorage", // This configures where your cache will be stored
        storeAuthStateInCookie: false, // Set this to "true" if you are having issues on IE11 or Edge
    }
};

// Login request configuration
export const loginRequest = {
    scopes: ["openid", "profile", "email"]
}; 