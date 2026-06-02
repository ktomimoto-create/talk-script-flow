import React, { useEffect } from 'react';
import { useIsAuthenticated, AuthenticatedTemplate, UnauthenticatedTemplate, useMsal } from "@azure/msal-react";
import { loginRequest } from "./msalConfig";
import "./authGate.css";

interface AuthGateProps {
  children: React.ReactNode;
}

export const AuthGate: React.FC<AuthGateProps> = ({ children }) => {
  const { instance } = useMsal();
  const isAuthenticated = useIsAuthenticated();

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    const theme = saved === 'light' || saved === 'dark' ? saved : 'dark';
    document.documentElement.setAttribute('data-theme', theme);
  }, []);

  const handleLogin = () => {
    instance.loginRedirect(loginRequest).catch((e) => {
      console.error(e);
    });
  };

  return (
    <>
      <AuthenticatedTemplate>
        {children}
      </AuthenticatedTemplate>
      <UnauthenticatedTemplate>
        <div className="login-container">
          <div className="login-card">
            <div className="login-header">
              <svg className="app-logo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                <circle cx="9" cy="9" r="1" fill="currentColor"></circle>
                <circle cx="12" cy="9" r="1" fill="currentColor"></circle>
                <circle cx="15" cy="9" r="1" fill="currentColor"></circle>
              </svg>
              <h1 className="login-title">トークスクリプトフロー</h1>
            </div>
            <p className="login-subtitle">アカウントでサインインしてください</p>
            <button className="login-button" onClick={handleLogin}>
              <svg className="microsoft-logo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 23 23">
                <path fill="#f35325" d="M0 0h11v11H0z"/>
                <path fill="#81bc06" d="M12 0h11v11H12z"/>
                <path fill="#05a6f0" d="M0 12h11v11H0z"/>
                <path fill="#ffba08" d="M12 12h11v11H12z"/>
              </svg>
              Microsoft アカウントでサインイン
            </button>
          </div>
        </div>
      </UnauthenticatedTemplate>
    </>
  );
};
