import { useEffect, useState } from 'react';
import { useMsal } from '@azure/msal-react';
import { supabase, Profile } from '../lib/supabaseClient';

/**
 * MSAL でサインイン中のユーザーのメールをキーに、Supabase profiles から
 * プロフィール情報を 1 件取得するフック。
 *
 * - email は大小文字を区別しないため ilike で照合。
 * - 環境変数 (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY) 未設定時は null を返す。
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
        supabase
            .from('profiles')
            .select('id,email,display_name,avatar_url,department,position')
            .ilike('email', email)
            .maybeSingle()
            .then(({ data, error }) => {
                if (cancelled) return;
                if (error) {
                    // eslint-disable-next-line no-console
                    console.warn('[useProfile] failed to load profile', error);
                    setProfile(null);
                } else {
                    setProfile((data as Profile) ?? null);
                }
                setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [email]);

    return { profile, loading, email };
};
