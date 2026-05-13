import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
    // eslint-disable-next-line no-console
    console.warn('[supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY が未設定です。プロフィール取得は無効化されます。');
}

export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '', {
    auth: { persistSession: false, autoRefreshToken: false },
});

export type Profile = {
    id: string;
    email: string | null;
    display_name: string | null;
    avatar_url: string | null;
    department: string | null;
    position: string | null;
};
