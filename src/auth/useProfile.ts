import { useEffect, useState } from 'react';
import { useMsal } from '@azure/msal-react';
import { supabase } from '../lib/supabaseClient';

export type Profile = {
    id: string;
    email: string | null;
    display_name: string | null;
    avatar_url: string | null;
    department: string | null;
    position: string | null;
};

/**
 * MSAL でサインイン中のユーザーのメールをキーに、Supabase profiles から
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
            if (!supabase) {
                console.warn('[useProfile] Supabase is not initialized (missing environment variables)');
                setProfile(null);
                setLoading(false);
                return;
            }
            try {
                const emailQuery = email.toLowerCase();
                const { data, error } = await supabase
                    .from('profiles')
                    .select('id, email, display_name, avatar_url, department, position')
                    .eq('email', emailQuery)
                    .maybeSingle();

                if (cancelled) return;

                if (error) {
                    console.warn('[useProfile] Supabase query error', error);
                    setProfile(null);
                } else if (data) {
                    setProfile({
                        id: String(data.id),
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

