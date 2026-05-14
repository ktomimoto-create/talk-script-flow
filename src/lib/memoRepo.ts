import { supabase } from './supabaseClient';

/* ====================================
 * 架電メモ（不通履歴）: 全認証ユーザーで共有
 * ==================================== */
export type CallMemo = {
    id: number;
    phone: string;
    name: string;
    caller: string;
    site_name: string;
    created_by_email: string | null;
    created_by_name: string | null;
    created_at: string;
    completed_at: string | null;
    completed_by_email: string | null;
};

export const fetchCallMemos = async (): Promise<CallMemo[]> => {
    const { data, error } = await supabase
        .from('call_memos')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
    if (error) {
        console.warn('[memoRepo] fetchCallMemos failed', error);
        return [];
    }
    return (data as CallMemo[]) ?? [];
};

export const insertCallMemo = async (
    input: Pick<CallMemo, 'phone' | 'name' | 'caller'> & {
        site_name?: string;
        created_by_email?: string | null;
        created_by_name?: string | null;
    },
): Promise<CallMemo | null> => {
    const { data, error } = await supabase
        .from('call_memos')
        .insert({
            phone: input.phone,
            name: input.name,
            caller: input.caller,
            site_name: input.site_name ?? '',
            created_by_email: input.created_by_email ?? null,
            created_by_name: input.created_by_name ?? null,
        })
        .select('*')
        .single();
    if (error) {
        console.warn('[memoRepo] insertCallMemo failed', error);
        return null;
    }
    return data as CallMemo;
};

export const deleteCallMemo = async (id: number): Promise<boolean> => {
    const { error } = await supabase.from('call_memos').delete().eq('id', id);
    if (error) {
        console.warn('[memoRepo] deleteCallMemo failed', error);
        return false;
    }
    return true;
};

export const completeCallMemo = async (
    id: number,
    completedByEmail: string | null,
): Promise<CallMemo | null> => {
    const { data, error } = await supabase
        .from('call_memos')
        .update({
            completed_at: new Date().toISOString(),
            completed_by_email: completedByEmail,
        })
        .eq('id', id)
        .select('*')
        .single();
    if (error) {
        console.warn('[memoRepo] completeCallMemo failed', error);
        return null;
    }
    return data as CallMemo;
};

export const uncompleteCallMemo = async (id: number): Promise<CallMemo | null> => {
    const { data, error } = await supabase
        .from('call_memos')
        .update({ completed_at: null, completed_by_email: null })
        .eq('id', id)
        .select('*')
        .single();
    if (error) {
        console.warn('[memoRepo] uncompleteCallMemo failed', error);
        return null;
    }
    return data as CallMemo;
};

/* ====================================
 * 個人メモ履歴: ユーザー単位の保存
 * ==================================== */
export type PersonalMemo = {
    id: number;
    owner_email: string;
    node_id: string;
    node_label: string | null;
    site_name: string;
    company_name: string;
    content: string;
    callback_phone: string;
    created_at: string;
};

export const fetchPersonalMemos = async (ownerEmail: string): Promise<PersonalMemo[]> => {
    if (!ownerEmail) return [];
    const { data, error } = await supabase
        .from('personal_memos')
        .select('*')
        .ilike('owner_email', ownerEmail)
        .order('created_at', { ascending: false })
        .limit(100);
    if (error) {
        console.warn('[memoRepo] fetchPersonalMemos failed', error);
        return [];
    }
    return (data as PersonalMemo[]) ?? [];
};

export const insertPersonalMemo = async (
    input: Omit<PersonalMemo, 'id' | 'created_at'>,
): Promise<PersonalMemo | null> => {
    const { data, error } = await supabase
        .from('personal_memos')
        .insert(input)
        .select('*')
        .single();
    if (error) {
        console.warn('[memoRepo] insertPersonalMemo failed', error);
        return null;
    }
    return data as PersonalMemo;
};

export const deletePersonalMemo = async (id: number): Promise<boolean> => {
    const { error } = await supabase.from('personal_memos').delete().eq('id', id);
    if (error) {
        console.warn('[memoRepo] deletePersonalMemo failed', error);
        return false;
    }
    return true;
};
