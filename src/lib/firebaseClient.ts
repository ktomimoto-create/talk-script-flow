import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const isConfigured = !!(
    firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.appId
);

if (!isConfigured) {
    // eslint-disable-next-line no-console
    console.warn(
        '[firebase] Firebase環境変数が未設定です。データベース機能およびプロフィール取得は無効化されます。'
    );
}

const app = isConfigured
    ? (getApps().length > 0 ? getApp() : initializeApp(firebaseConfig))
    : null;

export const db = app ? getFirestore(app) : null;

export type Profile = {
    id: string;
    email: string | null;
    display_name: string | null;
    avatar_url: string | null;
    department: string | null;
    position: string | null;
};
