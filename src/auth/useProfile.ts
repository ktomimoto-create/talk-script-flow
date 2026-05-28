import { useEffect, useState } from 'react';
import { useMsal } from '@azure/msal-react';
import { db, Profile } from '../lib/firebaseClient';
import { doc, getDoc } from 'firebase/firestore';

/**
 * MSAL でサインイン中のユーザーのメールをキーに、Cloud Firestore profiles から
 * プロフィール情報を 1 件取得するフック。
 *
 * - ドキュメントIDとして小文字のメールアドレスを使用します。
 * - 環境変数未設定時やFirestoreにプロフィールがない場合は、MSALアカウント情報からフォールバック値を生成します。
 */
export const useProfile = () => {
    const { accounts } = useMsal();
    const account = accounts[0];
    const email = (account?.username || '').trim();

    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState<boolean>(!!email);

    useEffect(() => {
        if (!email) {
            setProfile(null);
            setLoading(false);
            return;
        }

        // MSALアカウント情報に基づくフォールバック用プロフィール
        const fallbackProfile: Profile = {
            id: email.toLowerCase(),
            email: email,
            display_name: account?.name || account?.username || null,
            avatar_url: null,
            department: null,
            position: null,
        };

        if (!db) {
            setProfile(fallbackProfile);
            setLoading(false);
            return;
        }

        let cancelled = false;
        setLoading(true);

        const docRef = doc(db, 'profiles', email.toLowerCase());
        getDoc(docRef)
            .then((docSnap) => {
                if (cancelled) return;
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setProfile({
                        id: docSnap.id,
                        email: data.email || null,
                        display_name: data.display_name || null,
                        avatar_url: data.avatar_url || null,
                        department: data.department || null,
                        position: data.position || null,
                    });
                } else {
                    // Firestore上にドキュメントがない場合はフォールバック
                    setProfile(fallbackProfile);
                }
                setLoading(false);
            })
            .catch((error) => {
                if (cancelled) return;
                // eslint-disable-next-line no-console
                console.warn('[useProfile] failed to load profile from Firestore', error);
                setProfile(fallbackProfile);
                setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [email, account]);

    return { profile, loading, email };
};
