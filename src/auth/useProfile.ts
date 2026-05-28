import { useEffect, useState } from 'react';
import { useMsal } from '@azure/msal-react';
import { db } from '../lib/firebaseClient';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';

export type Profile = {
    id: string;
    email: string | null;
    display_name: string | null;
    avatar_url: string | null;
    department: string | null;
    position: string | null;
};

/**
 * MSAL でサインイン中のユーザーのメールをキーに、Firestore profiles から
 * プロフィール情報を 1 件取得するフック。
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
        let cancelled = false;
        setLoading(true);

        const fetchProfile = async () => {
            try {
                const emailQuery = email.toLowerCase();
                const q = query(
                    collection(db, 'profiles'),
                    where('email', '==', emailQuery),
                    limit(1)
                );
                const snapshot = await getDocs(q);
                if (cancelled) return;

                if (!snapshot.empty) {
                    const docSnap = snapshot.docs[0];
                    const data = docSnap.data();
                    setProfile({
                        id: docSnap.id,
                        email: data.email ?? null,
                        display_name: data.display_name ?? null,
                        avatar_url: data.avatar_url ?? null,
                        department: data.department ?? null,
                        position: data.position ?? null,
                    });
                } else {
                    setProfile(null);
                }
            } catch (error) {
                // eslint-disable-next-line no-console
                console.warn('[useProfile] failed to load profile', error);
                setProfile(null);
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        fetchProfile();

        return () => {
            cancelled = true;
        };
    }, [email]);

    return { profile, loading, email };
};
