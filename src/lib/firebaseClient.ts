import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
const appId = import.meta.env.VITE_FIREBASE_APP_ID;

const isConfigured = !!(apiKey && projectId && appId);

if (!isConfigured) {
    // eslint-disable-next-line no-console
    console.warn(
        '[firebase] Firebase環境変数が未設定です。データベース機能およびプロフィール取得はダミー設定で動作します。'
    );
}

const firebaseConfig = {
    apiKey: apiKey || 'dummy-api-key',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'dummy.firebaseapp.com',
    projectId: projectId || 'dummy-project',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'dummy.appspot.com',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '0000000000',
    appId: appId || '1:0000000000:web:0000000000',
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const db = getFirestore(app);

export type Profile = {
    id: string;
    email: string | null;
    display_name: string | null;
    avatar_url: string | null;
    department: string | null;
    position: string | null;
};
