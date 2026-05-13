import React from 'react'
import ReactDOM from 'react-dom/client'
import { MsalProvider } from '@azure/msal-react'
import App from './App'
import './index.css'
import { msalInstance } from './auth/msalConfig'
import { AuthGate } from './auth/AuthGate'

// MSAL の初期化（redirect フローの戻りも内部でハンドリングされる）
msalInstance.initialize().then(() => {
    ReactDOM.createRoot(document.getElementById('root')!).render(
        <React.StrictMode>
            <MsalProvider instance={msalInstance}>
                <AuthGate>
                    <App />
                </AuthGate>
            </MsalProvider>
        </React.StrictMode>,
    )
})
