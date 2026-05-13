import React from 'react';
import {
    AuthenticatedTemplate,
    UnauthenticatedTemplate,
    useMsal,
} from '@azure/msal-react';
import { loginRequest } from './msalConfig';
import { useProfile } from './useProfile';
import './authGate.css'; // sign-in screen styles

/**
 * ログイン前は「サインイン画面」、ログイン後は children を表示するゲート。
 */
export const AuthGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <>
            <UnauthenticatedTemplate>
                <SignInScreen />
            </UnauthenticatedTemplate>
            <AuthenticatedTemplate>
                <UserBar />
                {children}
            </AuthenticatedTemplate>
        </>
    );
};

const SignInScreen: React.FC = () => {
    const { instance } = useMsal();

    const handleLogin = () => {
        instance.loginRedirect(loginRequest).catch((e) => {
            // eslint-disable-next-line no-console
            console.error('[AuthGate] loginRedirect failed', e);
        });
    };

    return (
        <div className="auth-screen">
            {/* 背景のアニメーションブロブ */}
            <div className="auth-blob auth-blob-1" aria-hidden="true" />
            <div className="auth-blob auth-blob-2" aria-hidden="true" />
            <div className="auth-blob auth-blob-3" aria-hidden="true" />
            <div className="auth-grid" aria-hidden="true" />

            <div className="auth-card">
                <div className="auth-card-glow" aria-hidden="true" />

                <div className="auth-brand">
                    <div className="auth-brand-icon">
                        <FlowIcon />
                    </div>
                    <div className="auth-brand-text">
                        <div className="auth-brand-eyebrow">FCO Internal</div>
                        <h1 className="auth-brand-title">Talk Script Flow</h1>
                    </div>
                </div>

                <p className="auth-lead">
                    オペレーター向けトークスクリプトを、フロー形式で素早くナビゲートします。
                </p>

                <ul className="auth-features">
                    <li>
                        <CheckIcon />
                        <span>応対分岐をビジュアルで把握</span>
                    </li>
                    <li>
                        <CheckIcon />
                        <span>キーワード検索で瞬時にジャンプ</span>
                    </li>
                    <li>
                        <CheckIcon />
                        <span>社内アカウントでセキュアにアクセス</span>
                    </li>
                </ul>

                <button
                    onClick={handleLogin}
                    className="auth-signin-button"
                    type="button"
                >
                    <MicrosoftLogo />
                    <span>Microsoft アカウントでサインイン</span>
                    <ArrowIcon />
                </button>

                <div className="auth-footnote">
                    <LockIcon />
                    <span>このアプリは社内ネットワーク専用です</span>
                </div>
            </div>

            <div className="auth-version">v0.1.0</div>
        </div>
    );
};

const UserBar: React.FC = () => {
    const { instance, accounts } = useMsal();
    const account = accounts[0];
    const { profile } = useProfile();

    const handleLogout = () => {
        instance.logoutRedirect().catch((e) => {
            // eslint-disable-next-line no-console
            console.error('[AuthGate] logoutRedirect failed', e);
        });
    };

    if (!account) return null;

    const displayName = profile?.display_name || account.name || account.username || '';
    const initial = (displayName || '?').trim().charAt(0).toUpperCase();
    const avatarUrl = profile?.avatar_url || null;

    return (
        <div className="auth-userbar">
            <div className="auth-userbar-avatar">
                {avatarUrl ? (
                    <img
                        src={avatarUrl}
                        alt={displayName}
                        className="auth-userbar-avatar-img"
                        onError={(e) => {
                            // 画像 404 などに備え、フォールバックでイニシャル表示に戻す
                            (e.currentTarget as HTMLImageElement).style.display = 'none';
                        }}
                    />
                ) : (
                    initial
                )}
            </div>
            <div className="auth-userbar-meta">
                <span className="auth-userbar-name">{displayName}</span>
                {profile?.department && (
                    <span className="auth-userbar-sub">{profile.department}</span>
                )}
            </div>
            <button onClick={handleLogout} className="auth-userbar-logout" type="button">
                サインアウト
            </button>
        </div>
    );
};

/* ---------- inline icons (no extra deps) ---------- */

const MicrosoftLogo: React.FC = () => (
    <svg width="20" height="20" viewBox="0 0 23 23" aria-hidden="true">
        <rect x="1" y="1" width="10" height="10" fill="#f25022" />
        <rect x="12" y="1" width="10" height="10" fill="#7fba00" />
        <rect x="1" y="12" width="10" height="10" fill="#00a4ef" />
        <rect x="12" y="12" width="10" height="10" fill="#ffb900" />
    </svg>
);

const FlowIcon: React.FC = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="5" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="19" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="12" cy="18" r="2.5" stroke="currentColor" strokeWidth="1.8" />
        <path d="M7 7.5 L11 16.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M17 7.5 L13 16.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
);

const CheckIcon: React.FC = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
            d="M5 12.5L10 17.5L19 7.5"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

const ArrowIcon: React.FC = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
            d="M5 12H19M19 12L13 6M19 12L13 18"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

const LockIcon: React.FC = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.8" />
        <path d="M8 11V8a4 4 0 1 1 8 0v3" stroke="currentColor" strokeWidth="1.8" />
    </svg>
);
