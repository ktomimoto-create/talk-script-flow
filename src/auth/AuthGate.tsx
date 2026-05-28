import React from 'react';
import { useIsAuthenticated, AuthenticatedTemplate, UnauthenticatedTemplate, useMsal } from "@azure/msal-react";
import { loginRequest } from "./msalConfig";
import "./authGate.css";

interface AuthGateProps {
  children: React.ReactNode;
}

export const AuthGate: React.FC<AuthGateProps> = ({ children }) => {
  const { instance } = useMsal();
  const isAuthenticated = useIsAuthenticated();

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
            <h1>トークスクリプトフロー</h1>
            <p>システムを利用するには Microsoft アカウントでサインインしてください</p>
            <button className="login-button" onClick={handleLogin}>
              Microsoft でサインイン
            </button>
          </div>
        </div>
      </UnauthenticatedTemplate>
    </>
  );
};
