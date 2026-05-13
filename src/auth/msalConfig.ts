import { Configuration, LogLevel, PublicClientApplication } from '@azure/msal-browser';

/**
 * Microsoft Entra ID (旧 Azure AD) の SSO 設定
 *
 * .env (もしくは .env.local) に以下を定義してください:
 *   VITE_AZURE_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
 *   VITE_AZURE_TENANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
 *   VITE_AZURE_REDIRECT_URI=http://localhost:5173
 */
const clientId = import.meta.env.VITE_AZURE_CLIENT_ID as string | undefined;
const tenantId = import.meta.env.VITE_AZURE_TENANT_ID as string | undefined;
const redirectUri =
    (import.meta.env.VITE_AZURE_REDIRECT_URI as string | undefined) ||
    window.location.origin;

if (!clientId || !tenantId) {
    // 開発時に気付けるよう警告
    // eslint-disable-next-line no-console
    console.warn(
        '[msalConfig] VITE_AZURE_CLIENT_ID / VITE_AZURE_TENANT_ID が未設定です。\n' +
            '.env.local を作成して値を設定してください。'
    );
}

export const msalConfig: Configuration = {
    auth: {
        clientId: clientId ?? '',
        authority: `https://login.microsoftonline.com/${tenantId ?? 'common'}`,
        redirectUri,
        postLogoutRedirectUri: redirectUri,
    },
    cache: {
        cacheLocation: 'sessionStorage', // 社内利用前提なので sessionStorage で OK
        storeAuthStateInCookie: false,
    },
    system: {
        loggerOptions: {
            loggerCallback: (level, message) => {
                if (level === LogLevel.Error) {
                    // eslint-disable-next-line no-console
                    console.error('[MSAL]', message);
                }
            },
            logLevel: LogLevel.Warning,
        },
    },
};

/**
 * ログイン時に要求するスコープ。
 * openid / profile / email があれば、JWT に氏名・メール・oid が入ってくる。
 */
export const loginRequest = {
    scopes: ['openid', 'profile', 'email', 'User.Read'],
};

export const msalInstance = new PublicClientApplication(msalConfig);
