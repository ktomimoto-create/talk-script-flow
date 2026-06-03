import { db } from './firebaseClient';
import {
    collection,
    getDocs,
    getDoc,
    addDoc,
    deleteDoc,
    doc,
    updateDoc,
    query,
    where,
    writeBatch
} from 'firebase/firestore';

/* ====================================
 * 架電メモ（不通履歴）: 全認証ユーザーで共有
 * ==================================== */
export type CallMemo = {
    id: string; // Firestore ドキュメント ID (string)
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

/**
 * 完了済みのメモは「完了させた本人」だけに見える。
 * さらに完了から 24 時間経過したものは誰にも見えなくなる（＝自動失効）。
 *
 * 失効済み完了メモは可視ではないので、ついでに DELETE で物理削除しておく。
 */
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export const cleanupExpiredCompletedMemos = async (): Promise<void> => {
    const cutoffIso = new Date(Date.now() - ONE_DAY_MS).toISOString();
    try {
        const snapshot = await getDocs(collection(db, 'call_memos'));
        const batch = writeBatch(db);
        let count = 0;
        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            if (data.completed_at && data.completed_at < cutoffIso) {
                batch.delete(docSnap.ref);
                count++;
            }
        });
        if (count > 0) {
            await batch.commit();
        }
    } catch (error) {
        console.warn('[memoRepo] cleanupExpiredCompletedMemos failed', error);
    }
};

export const fetchCallMemos = async (ownerEmail: string): Promise<CallMemo[]> => {
    // 失効済みの完了メモを掃除してから取得
    await cleanupExpiredCompletedMemos();

    try {
        const snapshot = await getDocs(collection(db, 'call_memos'));
        const memos: CallMemo[] = [];
        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            memos.push({
                id: docSnap.id,
                phone: data.phone ?? '',
                name: data.name ?? '',
                caller: data.caller ?? '',
                site_name: data.site_name ?? '',
                created_by_email: data.created_by_email ?? null,
                created_by_name: data.created_by_name ?? null,
                created_at: data.created_at ?? '',
                completed_at: data.completed_at ?? null,
                completed_by_email: data.completed_by_email ?? null,
            });
        });

        // 作成日時降順でソート
        memos.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        const now = Date.now();
        const email = ownerEmail.trim().toLowerCase();
        return memos.filter(m => {
            if (!m.completed_at) return true; // 未完了は誰でも見える
            // 完了済み：本人にだけ、かつ24h以内のみ可視
            if ((m.completed_by_email ?? '').trim().toLowerCase() !== email) return false;
            return now - new Date(m.completed_at).getTime() < ONE_DAY_MS;
        }).slice(0, 300);
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
    try {
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
        const docRef = await addDoc(collection(db, 'call_memos'), docData);
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
    try {
        await deleteDoc(doc(db, 'call_memos', id));
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
    try {
        const docRef = doc(db, 'call_memos', id);
        const completed_at = new Date().toISOString();
        await updateDoc(docRef, {
            completed_at,
            completed_by_email: completedByEmail,
        });

        const updatedSnap = await getDoc(docRef);
        if (updatedSnap.exists()) {
            const data = updatedSnap.data();
            return {
                id: updatedSnap.id,
                phone: data.phone ?? '',
                name: data.name ?? '',
                caller: data.caller ?? '',
                site_name: data.site_name ?? '',
                created_by_email: data.created_by_email ?? null,
                created_by_name: data.created_by_name ?? null,
                created_at: data.created_at ?? '',
                completed_at: data.completed_at ?? null,
                completed_by_email: data.completed_by_email ?? null,
            };
        }
        return null;
    } catch (error) {
        console.warn('[memoRepo] completeCallMemo failed', error);
        return null;
    }
};

export const uncompleteCallMemo = async (id: string): Promise<CallMemo | null> => {
    try {
        const docRef = doc(db, 'call_memos', id);
        await updateDoc(docRef, { completed_at: null, completed_by_email: null });

        const updatedSnap = await getDoc(docRef);
        if (updatedSnap.exists()) {
            const data = updatedSnap.data();
            return {
                id: updatedSnap.id,
                phone: data.phone ?? '',
                name: data.name ?? '',
                caller: data.caller ?? '',
                site_name: data.site_name ?? '',
                created_by_email: data.created_by_email ?? null,
                created_by_name: data.created_by_name ?? null,
                created_at: data.created_at ?? '',
                completed_at: null,
                completed_by_email: null,
            };
        }
        return null;
    } catch (error) {
        console.warn('[memoRepo] uncompleteCallMemo failed', error);
        return null;
    }
};

/* ====================================
 * 個人メモ履歴: ユーザー単位の保存
 * ==================================== */
export type PersonalMemo = {
    id: string; // Firestore ドキュメント ID (string)
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
    try {
        const emailQuery = ownerEmail.trim().toLowerCase();
        const q = query(
            collection(db, 'personal_memos'),
            where('owner_email', '==', emailQuery)
        );
        const snapshot = await getDocs(q);
        const memos: PersonalMemo[] = [];
        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            memos.push({
                id: docSnap.id,
                owner_email: data.owner_email ?? '',
                node_id: data.node_id ?? '',
                node_label: data.node_label ?? null,
                site_name: data.site_name ?? '',
                company_name: data.company_name ?? '',
                content: data.content ?? '',
                callback_phone: data.callback_phone ?? '',
                created_at: data.created_at ?? '',
            });
        });

        // 作成日時降順でソート
        memos.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        return memos.slice(0, 100);
    } catch (error) {
        console.warn('[memoRepo] fetchPersonalMemos failed', error);
        return [];
    }
};

export const insertPersonalMemo = async (
    input: Omit<PersonalMemo, 'id' | 'created_at'>,
): Promise<PersonalMemo | null> => {
    try {
        const docData = {
            owner_email: input.owner_email.trim().toLowerCase(),
            node_id: input.node_id,
            node_label: input.node_label,
            site_name: input.site_name,
            company_name: input.company_name,
            content: input.content,
            callback_phone: input.callback_phone,
            created_at: new Date().toISOString(),
        };
        const docRef = await addDoc(collection(db, 'personal_memos'), docData);
        return {
            id: docRef.id,
            ...docData,
        };
    } catch (error) {
        console.warn('[memoRepo] insertPersonalMemo failed', error);
        return null;
    }
};

export const deletePersonalMemo = async (id: string): Promise<boolean> => {
    try {
        await deleteDoc(doc(db, 'personal_memos', id));
        return true;
    } catch (error) {
        console.warn('[memoRepo] deletePersonalMemo failed', error);
        return false;
    }
};

/* ====================================
 * 受電統計ログ: ダッシュボード集計用
 * ==================================== */
export type CallLog = {
    id?: string;
    operator_name: string | null;
    operator_email: string | null;
    caller_category: string; // 受電相手（管理会社、管理員、協力会社、建築、連動相手、居住者）
    destination: string; // どこ宛（ディスパッチャー、保守管理、施工管理、管理センター、管理部、など）
    node_id: string; // 用件のノードID
    node_label: string; // 用件のラベル名
    created_at: string; // ISO 8601
};

export const insertCallLog = async (
    log: Omit<CallLog, 'id' | 'created_at'>
): Promise<CallLog | null> => {
    try {
        const docData = {
            operator_name: log.operator_name,
            operator_email: log.operator_email ? log.operator_email.trim().toLowerCase() : null,
            caller_category: log.caller_category,
            destination: log.destination,
            node_id: log.node_id,
            node_label: log.node_label,
            created_at: new Date().toISOString(),
        };
        const docRef = await addDoc(collection(db, 'call_logs'), docData);
        return {
            id: docRef.id,
            ...docData,
        };
    } catch (error) {
        console.warn('[memoRepo] insertCallLog failed', error);
        return null;
    }
};

export const fetchCallLogs = async (): Promise<CallLog[]> => {
    try {
        const snapshot = await getDocs(collection(db, 'call_logs'));
        const logs: CallLog[] = [];
        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            logs.push({
                id: docSnap.id,
                operator_name: data.operator_name ?? null,
                operator_email: data.operator_email ?? null,
                caller_category: data.caller_category ?? '',
                destination: data.destination ?? '',
                node_id: data.node_id ?? '',
                node_label: data.node_label ?? '',
                created_at: data.created_at ?? '',
            });
        });
        return logs;
    } catch (error) {
        console.warn('[memoRepo] fetchCallLogs failed', error);
        return [];
    }
};

export const clearCallLogs = async (): Promise<boolean> => {
    try {
        const snapshot = await getDocs(collection(db, 'call_logs'));
        const batch = writeBatch(db);
        let count = 0;
        snapshot.forEach(docSnap => {
            batch.delete(docSnap.ref);
            count++;
        });
        if (count > 0) {
            await batch.commit();
        }
        return true;
    } catch (error) {
        console.warn('[memoRepo] clearCallLogs failed', error);
        return false;
    }
};

