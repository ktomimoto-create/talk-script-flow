import { db } from './firebaseClient';
import {
    collection,
    doc,
    addDoc,
    getDoc,
    getDocs,
    deleteDoc,
    updateDoc,
    query,
    where,
    orderBy,
    limit,
    writeBatch
} from 'firebase/firestore';

/* ====================================
 * 架電メモ（不通履歴）: 全認証ユーザーで共有
 * ==================================== */
export type CallMemo = {
    id: string; // Changed from number
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

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export const cleanupExpiredCompletedMemos = async (): Promise<void> => {
    if (!db) return;
    try {
        const cutoffIso = new Date(Date.now() - ONE_DAY_MS).toISOString();
        const memosRef = collection(db, 'call_memos');
        // Firestoreで「completed_at が null でないかつ cutoffIso 未満」をクエリします。
        // completed_at が設定されている（nullでない）ドキュメントは string 型の ISO タイムスタンプを持つため、
        // 単純に '< cutoffIso' の条件でクエリ可能です。
        const q = query(memosRef, where('completed_at', '<', cutoffIso));
        const snapshot = await getDocs(q);
        if (snapshot.empty) return;

        const batch = writeBatch(db);
        snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();
    } catch (error) {
        console.warn('[memoRepo] cleanupExpiredCompletedMemos failed', error);
    }
};

export const fetchCallMemos = async (ownerEmail: string): Promise<CallMemo[]> => {
    if (!db) return [];
    // 失効済みの完了メモを掃除してから取得
    await cleanupExpiredCompletedMemos();

    try {
        const memosRef = collection(db, 'call_memos');
        // created_atで降順にソートして上限300件取得
        // 複合インデックスを不要にするため、クライアント側でのフィルタリングを前提とし、
        // 単一フィールドのソートクエリを行います。
        const q = query(memosRef, orderBy('created_at', 'desc'), limit(300));
        const snapshot = await getDocs(q);
        const now = Date.now();
        const email = ownerEmail.trim().toLowerCase();
        
        const list: CallMemo[] = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            list.push({
                id: doc.id,
                phone: data.phone || '',
                name: data.name || '',
                caller: data.caller || '',
                site_name: data.site_name || '',
                created_by_email: data.created_by_email || null,
                created_by_name: data.created_by_name || null,
                created_at: data.created_at || '',
                completed_at: data.completed_at || null,
                completed_by_email: data.completed_by_email || null,
            });
        });

        return list.filter(m => {
            if (!m.completed_at) return true; // 未完了は誰でも見える
            // 完了済み：本人にだけ、かつ24h以内のみ可視
            if ((m.completed_by_email ?? '').trim().toLowerCase() !== email) return false;
            return now - new Date(m.completed_at).getTime() < ONE_DAY_MS;
        });
    } catch (error) {
        console.warn('[memoRepo] fetchCallMemos failed', error);
        return [];
    }
};

export const insertCallMemo = async (
    input: Pick<CallMemo, 'phone' | 'name' | 'caller'> & {
        site_name?: string;
        created_by_email?: string | null;
        created_by_name?: string | null;
    },
): Promise<CallMemo | null> => {
    if (!db) return null;
    try {
        const memosRef = collection(db, 'call_memos');
        const docData = {
            phone: input.phone,
            name: input.name,
            caller: input.caller,
            site_name: input.site_name ?? '',
            created_by_email: input.created_by_email ?? null,
            created_by_name: input.created_by_name ?? null,
            created_at: new Date().toISOString(),
            completed_at: null,
            completed_by_email: null,
        };
        const docRef = await addDoc(memosRef, docData);
        return {
            id: docRef.id,
            ...docData,
        };
    } catch (error) {
        console.warn('[memoRepo] insertCallMemo failed', error);
        return null;
    }
};

export const deleteCallMemo = async (id: string): Promise<boolean> => {
    if (!db) return false;
    try {
        const docRef = doc(db, 'call_memos', id);
        await deleteDoc(docRef);
        return true;
    } catch (error) {
        console.warn('[memoRepo] deleteCallMemo failed', error);
        return false;
    }
};

export const completeCallMemo = async (
    id: string,
    completedByEmail: string | null,
): Promise<CallMemo | null> => {
    if (!db) return null;
    try {
        const docRef = doc(db, 'call_memos', id);
        const completed_at = new Date().toISOString();
        await updateDoc(docRef, {
            completed_at,
            completed_by_email: completedByEmail,
        });
        const snapshot = await getDoc(docRef);
        if (!snapshot.exists()) return null;
        const data = snapshot.data();
        return {
            id: snapshot.id,
            phone: data.phone || '',
            name: data.name || '',
            caller: data.caller || '',
            site_name: data.site_name || '',
            created_by_email: data.created_by_email || null,
            created_by_name: data.created_by_name || null,
            created_at: data.created_at || '',
            completed_at: data.completed_at || null,
            completed_by_email: data.completed_by_email || null,
        };
    } catch (error) {
        console.warn('[memoRepo] completeCallMemo failed', error);
        return null;
    }
};

export const uncompleteCallMemo = async (id: string): Promise<CallMemo | null> => {
    if (!db) return null;
    try {
        const docRef = doc(db, 'call_memos', id);
        await updateDoc(docRef, {
            completed_at: null,
            completed_by_email: null,
        });
        const snapshot = await getDoc(docRef);
        if (!snapshot.exists()) return null;
        const data = snapshot.data();
        return {
            id: snapshot.id,
            phone: data.phone || '',
            name: data.name || '',
            caller: data.caller || '',
            site_name: data.site_name || '',
            created_by_email: data.created_by_email || null,
            created_by_name: data.created_by_name || null,
            created_at: data.created_at || '',
            completed_at: null,
            completed_by_email: null,
        };
    } catch (error) {
        console.warn('[memoRepo] uncompleteCallMemo failed', error);
        return null;
    }
};

/* ====================================
 * 個人メモ履歴: ユーザー単位の保存
 * ==================================== */
export type PersonalMemo = {
    id: string; // Changed from number
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
    if (!db || !ownerEmail) return [];
    try {
        const memosRef = collection(db, 'personal_memos');
        // owner_email_lowerでの一致クエリ。
        // インデックスエラーを完全に避けるため、ソートは取得後にクライアント側で実行します。
        const q = query(
            memosRef,
            where('owner_email_lower', '==', ownerEmail.trim().toLowerCase()),
            limit(100)
        );
        const snapshot = await getDocs(q);
        const list: PersonalMemo[] = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            list.push({
                id: doc.id,
                owner_email: data.owner_email || '',
                node_id: data.node_id || '',
                node_label: data.node_label || null,
                site_name: data.site_name || '',
                company_name: data.company_name || '',
                content: data.content || '',
                callback_phone: data.callback_phone || '',
                created_at: data.created_at || '',
            });
        });
        
        // クライアント側で created_at の降順にソート
        return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } catch (error) {
        console.warn('[memoRepo] fetchPersonalMemos failed', error);
        return [];
    }
};

export const insertPersonalMemo = async (
    input: Omit<PersonalMemo, 'id' | 'created_at'>,
): Promise<PersonalMemo | null> => {
    if (!db) return null;
    try {
        const memosRef = collection(db, 'personal_memos');
        const docData = {
            ...input,
            owner_email_lower: input.owner_email.trim().toLowerCase(),
            created_at: new Date().toISOString(),
        };
        const docRef = await addDoc(memosRef, docData);
        return {
            id: docRef.id,
            owner_email: input.owner_email,
            node_id: input.node_id,
            node_label: input.node_label,
            site_name: input.site_name,
            company_name: input.company_name,
            content: input.content,
            callback_phone: input.callback_phone,
            created_at: docData.created_at,
        };
    } catch (error) {
        console.warn('[memoRepo] insertPersonalMemo failed', error);
        return null;
    }
};

export const deletePersonalMemo = async (id: string): Promise<boolean> => {
    if (!db) return false;
    try {
        const docRef = doc(db, 'personal_memos', id);
        await deleteDoc(docRef);
        return true;
    } catch (error) {
        console.warn('[memoRepo] deletePersonalMemo failed', error);
        return false;
    }
};
