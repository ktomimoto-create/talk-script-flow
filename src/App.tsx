import React, { useState, useMemo } from 'react';
import { scriptData } from './data/scriptData';
import { ScriptNode } from './types/script';
import {
    PhoneIcon,
    ArrowRightIcon,
    ArrowLeftIcon,
    CloseIcon,
    TransferIcon,
} from './components/Icons';
import {
    CallMemo,
    fetchCallMemos,
    insertCallMemo,
    deleteCallMemo,
    completeCallMemo,
    uncompleteCallMemo,
    PersonalMemo,
    fetchPersonalMemos,
    insertPersonalMemo,
    deletePersonalMemo,
    CallLog,
    insertCallLog,
    fetchCallLogs,
    clearCallLogs,
} from './lib/memoRepo';
import { useProfile } from './auth/useProfile';
import './index.css';

const formatRelativeTime = (iso: string): string => {
    const date = new Date(iso);
    const diffMs = Date.now() - date.getTime();
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 1) return 'たった今';
    if (minutes < 60) return `${minutes}分前`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}時間前`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}日前`;
    return `${date.getMonth() + 1}/${date.getDate()}`;
};

const renderPoint = (pointText: string) => {
    if (pointText.includes('→')) {
        const parts = pointText.split('→');
        return (
            <div className="point-content">
                <div className="point-question">{parts[0].trim()}</div>
                <div className="point-answers" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {parts.slice(1).map((part, index) => (
                        <div key={index} className="point-answer" style={{ whiteSpace: 'pre-wrap' }}>
                            <span className="point-arrow"><ArrowRightIcon size={14} strokeWidth={2.2} /></span>
                            <div style={{ flex: 1 }}>{part.trim()}</div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    if (pointText.match(/　{2,}/)) {
        const parts = pointText.split(/　{2,}/);
        if (parts.length >= 2) {
            return (
                <div className="point-content">
                    <div className="point-question">{parts[0].trim()}</div>
                    <div className="point-answer" style={{ whiteSpace: 'pre-wrap' }}>
                        <span className="point-arrow">→</span>
                        <div style={{ flex: 1 }}>{parts.slice(1).join(' ').trim()}</div>
                    </div>
                </div>
            );
        }
    }
    return <div className="point-text" style={{ whiteSpace: 'pre-wrap' }}>{pointText}</div>;
};

export const getCallLogMetadata = (nodeId: string) => {
    let callerCategory = 'その他';
    let destination = 'その他';

    // 誰から (caller_category) の判定
    if (nodeId.includes('-kanri-in') || nodeId.includes('mid-kanri-in')) {
        callerCategory = '管理員';
    } else if (nodeId.includes('-kanri-') || nodeId.includes('mid-kanri-')) {
        callerCategory = '管理会社';
    } else if (nodeId.includes('-kyoryoku-') || nodeId.includes('mid-kyoryoku')) {
        callerCategory = '協力会社';
    } else if (nodeId.includes('-kenchiku-') || nodeId.includes('mid-kenchiku')) {
        callerCategory = '建築';
    } else if (nodeId.includes('-tasha-') || nodeId.includes('mid-tasha')) {
        callerCategory = '連動相手';
    } else if (nodeId.includes('-other-') || nodeId.includes('mid-other')) {
        callerCategory = '居住者';
    }

    // どこ宛 (destination) の判定
    if (nodeId.includes('-dis') || nodeId === 'final-dis') {
        destination = 'ディスパッチャー';
    } else if (nodeId.includes('-hoshu') || nodeId === 'final-hoshu') {
        destination = '保守管理';
    } else if (nodeId.includes('-sekou') || nodeId === 'final-sekou') {
        destination = '施工管理';
    } else if (nodeId.includes('-tabusho') || nodeId === 'final-tabusho') {
        destination = '他部署';
    }

    return { callerCategory, destination };
};

// ログデータから統計を集計するヘルパー関数
export type DashboardStats = {
    totalCalls: number;
    byCaller: { label: string; count: number; percentage: number }[];
    byDestination: { label: string; count: number; percentage: number }[];
    byOperator: { label: string; count: number }[];
    byNode: { label: string; count: number }[];
};

export const calculateStats = (logs: CallLog[], period: 'today' | 'week' | 'month' | 'all'): DashboardStats => {
    const now = new Date();
    let filteredLogs = logs;

    if (period === 'today') {
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        filteredLogs = logs.filter(l => new Date(l.created_at) >= startOfToday);
    } else if (period === 'week') {
        const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filteredLogs = logs.filter(l => new Date(l.created_at) >= startOfWeek);
    } else if (period === 'month') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        filteredLogs = logs.filter(l => new Date(l.created_at) >= startOfMonth);
    }

    const total = filteredLogs.length;

    const callerMap: Record<string, number> = {};
    const destMap: Record<string, number> = {};
    const opMap: Record<string, number> = {};
    const nodeMap: Record<string, number> = {};

    filteredLogs.forEach(l => {
        if (l.caller_category) callerMap[l.caller_category] = (callerMap[l.caller_category] || 0) + 1;
        if (l.destination) destMap[l.destination] = (destMap[l.destination] || 0) + 1;
        
        const opKey = l.operator_name || l.operator_email || '不明なオペレーター';
        opMap[opKey] = (opMap[opKey] || 0) + 1;

        if (l.node_label) nodeMap[l.node_label] = (nodeMap[l.node_label] || 0) + 1;
    });

    const sortByCount = (map: Record<string, number>) => {
        return Object.entries(map)
            .map(([label, count]) => ({
                label,
                count,
                percentage: total > 0 ? Math.round((count / total) * 100) : 0
            }))
            .sort((a, b) => b.count - a.count);
    };

    return {
        totalCalls: total,
        byCaller: sortByCount(callerMap),
        byDestination: sortByCount(destMap),
        byOperator: Object.entries(opMap).map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count),
        byNode: Object.entries(nodeMap).map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count).slice(0, 10),
    };
};

const VisualFlow: React.FC<{ onSelect: (id: string) => void }> = React.memo(({ onSelect }) => {
    // 第1層（受電）のブランチを取得
    const topLayerBranches = useMemo(() => 
        scriptData.find(n => n.id === 'juden')?.branches || [],
    []);

    return (
        <div className="visual-flow-map">
            {/* 第1層 */}
            <div className="visual-flow-layer">
                <div className="visual-flow-node active" style={{ minWidth: '220px', width: 'auto', fontSize: '1.25rem', padding: '18px 28px' }}>
                    <span className="visual-flow-node-label">受電</span>
                    <div className="visual-flow-connector"></div>
                </div>
            </div>

            {/* 第2層および第3層 */}
            {/* 第2層および第3層 */}
            <div className="visual-flow-layer" style={{ alignItems: 'flex-start', gap: '10px' }}>
                {topLayerBranches.map((branch) => {
                    const midNode = scriptData.find(n => n.id === branch.nextNodeId);
                    return (
                        <React.Fragment key={`col-frag-${branch.nextNodeId}`}>
                            {branch.nextNodeId === 'mid-other' && (
                                <div className="visual-flow-column spacer" style={{ flex: '0 0 40px', minWidth: 0 }}>
                                    {/* 居住者前のスペーサー：横線のみを描画するため中身は空 */}
                                    <div className="spacer-inner"></div>
                                </div>
                            )}
                            <div className="visual-flow-column" style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '48px',
                                flex: '1 1 0',
                                minWidth: '140px'
                            }}>

                                {/* Layer 2 Node */}
                                <div
                                    className="visual-flow-node"
                                    style={{ width: '100%', padding: '14px 12px', fontSize: '1rem', cursor: 'default' }}
                                >
                                    <span className="visual-flow-node-label">{branch.label}</span>
                                    <div className="visual-flow-connector"></div>
                                </div>
                                {/* Layer 3 Nodes */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
                                    {midNode?.branches?.map((b) => (
                                        <div
                                            key={b.nextNodeId}
                                            className="visual-flow-node"
                                            style={{
                                                fontSize: '0.85rem',
                                                padding: b.subBranches ? '10px 8px' : '10px',
                                                width: '100%',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '4px',
                                                backgroundColor: 'var(--glass)',
                                                border: '1px solid var(--glass-border)',
                                                '--hover-color': b.color || b.middleBox?.color || 'var(--primary-blue)'
                                            } as React.CSSProperties}
                                            onClick={() => !b.subBranches && onSelect(b.nextNodeId)}
                                        >
                                            <div style={{ fontWeight: 'bold', color: branch.nextNodeId === 'mid-kyoryoku' ? '#ffffff' : (b.color || '#ffffff') }}>{b.label}</div>
                                            {b.middleBox && (
                                                <div style={{
                                                    fontSize: '0.75rem',
                                                    fontWeight: 'bold',
                                                    color: b.middleBox.color || '#ffffff',
                                                    marginTop: '4px',
                                                    marginBottom: '4px'
                                                }}>
                                                    {b.middleBox.label}
                                                </div>
                                            )}
                                            {b.subBranches ? (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%', marginTop: '4px' }}>
                                                    {b.subBranches.map(sb => (
                                                        <div
                                                            key={sb.nextNodeId}
                                                            className="visual-flow-sub-link"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onSelect(sb.nextNodeId);
                                                            }}
                                                        >
                                                            {sb.label}
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : b.subLabel ? (
                                                <div style={{ fontSize: '0.72rem', opacity: 0.8 }}>
                                                    {b.subLabel}
                                                </div>
                                            ) : null}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );
});

const App: React.FC = () => {
    const [currentNodeId, setCurrentNodeId] = useState<string>('juden');
    const { profile, email: msalEmail } = useProfile();
    const ownerEmail = (profile?.email || msalEmail || '').trim();
    const ownerDisplayName = profile?.display_name || msalEmail || '';

    // 管理者判定（「自分だけ」がリセットできるよう制限）
    const isAdmin = React.useMemo(() => {
        const email = ownerEmail.toLowerCase();
        const displayName = ownerDisplayName.toLowerCase();
        const adminEmailsEnv = (import.meta.env.VITE_ADMIN_EMAILS || '').toLowerCase();
        const adminEmailsList = adminEmailsEnv.split(',').map((e: string) => e.trim());

        return (
            adminEmailsList.includes(email) ||
            email.includes('tomimoto') ||
            email.includes('000644') ||
            displayName.includes('友本') ||
            email === 'admin@fts-net.co.jp'
        );
    }, [ownerEmail, ownerDisplayName]);

    // 詳細表示用個人メモステート
    const [activeDetailMemo, setActiveDetailMemo] = useState<PersonalMemo | null>(null);

    // 架電メモ（Supabase で全認証ユーザー間で共有）
    const [outgoingMemos, setOutgoingMemos] = useState<CallMemo[]>([]);
    const reloadCallMemos = React.useCallback(() => {
        if (!ownerEmail) return;
        fetchCallMemos(ownerEmail).then(setOutgoingMemos);
    }, [ownerEmail]);
    React.useEffect(() => {
        reloadCallMemos();
    }, [reloadCallMemos]);

    // 架電メモ入力フォームの状態（架電者はログインユーザー固定）
    const [tempPhone, setTempPhone] = useState('');
    const [tempName, setTempName] = useState('');
    const [tempSite, setTempSite] = useState('');

    // 履歴表示の状態
    const [showHistory, setShowHistory] = useState(false);
    // 個人メモ履歴パネル（下部ポップアップ）表示の状態
    const [showPersonalHistoryPanel, setShowPersonalHistoryPanel] = useState(false);

    // 受電メモ入力欄の状態（照合用）
    const [callbackPhone, setCallbackPhone] = useState('');

    // サイドバー内メモ入力欄 ─ 個人メモ
    const [memoSite, setMemoSite] = useState('');
    const [memoCompany, setMemoCompany] = useState('');
    const [memoContent, setMemoContent] = useState('');

    // 個人メモ履歴
    const [personalMemos, setPersonalMemos] = useState<PersonalMemo[]>([]);

    // 受電統計ダッシュボード用の状態
    const [showDashboard, setShowDashboard] = useState(false);
    const [dashboardLogs, setDashboardLogs] = useState<CallLog[]>([]);
    const [dashboardPeriod, setDashboardPeriod] = useState<'today' | 'week' | 'month' | 'all'>('all');

    const reloadCallLogs = React.useCallback(() => {
        fetchCallLogs().then(setDashboardLogs);
    }, []);

    React.useEffect(() => {
        reloadCallLogs();
    }, [reloadCallLogs]);

    const handleResetDashboard = async () => {
        if (!isAdmin) {
            alert('統計データをリセットする権限がありません。');
            return;
        }
        if (window.confirm('これまでの受電統計データをすべて削除し、リセットしますか？\nこの操作は取り消せません。')) {
            const success = await clearCallLogs();
            if (success) {
                alert('受電統計データをリセットしました。');
                reloadCallLogs();
            } else {
                alert('統計データのリセットに失敗しました。');
            }
        }
    };

    const saveCallLog = async (callerCategory: string, destination: string, nodeId: string, nodeLabel: string) => {
        try {
            await insertCallLog({
                operator_name: ownerDisplayName || '不明',
                operator_email: ownerEmail || null,
                caller_category: callerCategory,
                destination: destination,
                node_id: nodeId,
                node_label: nodeLabel,
            });
            reloadCallLogs();
        } catch (error) {
            console.warn('[App] saveCallLog failed', error);
        }
    };
    const [showPersonalHistory, setShowPersonalHistory] = useState(false);
    const reloadPersonalMemos = React.useCallback(() => {
        if (!ownerEmail) return;
        fetchPersonalMemos(ownerEmail).then(setPersonalMemos);
    }, [ownerEmail]);
    React.useEffect(() => {
        reloadPersonalMemos();
    }, [reloadPersonalMemos]);

    const savePersonalMemo = async (nodeId: string, nodeLabel: string) => {
        if (!ownerEmail) {
            alert('プロフィール情報が取得できていません');
            return;
        }
        if (!memoSite && !memoCompany && !memoContent && !callbackPhone) {
            alert('メモが空です');
            return;
        }
        const created = await insertPersonalMemo({
            owner_email: ownerEmail,
            node_id: nodeId,
            node_label: nodeLabel,
            site_name: memoSite,
            company_name: memoCompany,
            content: memoContent,
            callback_phone: callbackPhone,
        });
        if (created) {
            setPersonalMemos(prev => [created, ...prev]);
            setMemoSite('');
            setMemoCompany('');
            setMemoContent('');
            setCallbackPhone('');
        } else {
            alert('個人メモの保存に失敗しました');
        }
    };

    const removePersonalMemo = async (id: string) => {
        const ok = await deletePersonalMemo(id);
        if (ok) setPersonalMemos(prev => prev.filter(m => m.id !== id));
    };

    const saveOutgoingMemo = async () => {
        if (!tempPhone) return;
        const created = await insertCallMemo({
            phone: tempPhone,
            name: tempName,
            caller: ownerDisplayName, // 架電者は自動でログインユーザー
            site_name: tempSite,
            created_by_email: ownerEmail || null,
            created_by_name: ownerDisplayName || null,
        });
        if (created) {
            setOutgoingMemos(prev => [created, ...prev]);
            setTempPhone('');
            setTempName('');
            setTempSite('');
        } else {
            alert('架電メモの保存に失敗しました');
        }
    };

    const deleteMemo = async (id: string) => {
        const ok = await deleteCallMemo(id);
        if (ok) {
            setOutgoingMemos(prev => prev.filter(m => m.id !== id));
        } else {
            alert('削除に失敗しました');
        }
    };

    const toggleCompleteMemo = async (memo: CallMemo) => {
        const updated = memo.completed_at
            ? await uncompleteCallMemo(memo.id)
            : await completeCallMemo(memo.id, ownerEmail || null);
        if (updated) {
            setOutgoingMemos(prev => prev.map(m => (m.id === memo.id ? updated : m)));
        } else {
            alert('完了状態の更新に失敗しました');
        }
    };

    const matchedCaller = useMemo(() => {
        if (!callbackPhone) return null;
        return outgoingMemos.find(m => m.phone === callbackPhone)?.name;
    }, [callbackPhone, outgoingMemos]);


    const currentNode = useMemo(() =>
        scriptData.find(node => node.id === currentNodeId) || scriptData[0],
        [currentNodeId]);

    const themeColor = useMemo(() => {
        if (currentNodeId === 'juden') return '#40a9ff';
        // 主分岐から先に検索
        for (const n of scriptData) {
            const direct = n.branches?.find(b => b.nextNodeId === currentNodeId);
            if (direct?.color) return direct.color;
            // 同階層の subBranches も検索（管理会社→他部署→登録方法 のような深い枝対応）
            for (const b of n.branches || []) {
                const sub = b.subBranches?.find(sb => sb.nextNodeId === currentNodeId);
                if (sub?.color) return sub.color;
                // subBranches に色が無い場合は親 branch の色を継承
                if (b.subBranches?.some(sb => sb.nextNodeId === currentNodeId) && b.color) return b.color;
            }
        }
        return '#40a9ff';
    }, [currentNodeId]);

    const displayedPersonalMemos = useMemo(() => {
        if (currentNodeId === 'juden') {
            return personalMemos;
        }
        return personalMemos.filter(pm => pm.node_id === currentNodeId);
    }, [personalMemos, currentNodeId]);

    // 初期化：popstateリスナーの登録と初期ハッシュの処理
    React.useEffect(() => {
        const onPopState = (e: PopStateEvent) => {
            if (e.state && e.state.nodeId) {
                if (e.state.nodeId === 'dashboard') {
                    setShowDashboard(true);
                } else {
                    setShowDashboard(false);
                    setCurrentNodeId(e.state.nodeId);
                }
            } else {
                const hashId = window.location.hash.replace('#', '');
                if (hashId === 'dashboard') {
                    setShowDashboard(true);
                } else {
                    setShowDashboard(false);
                    setCurrentNodeId(hashId || 'juden');
                }
            }
        };

        // 初回読み込み時のハッシュ処理
        // 最終ノード(isFinal)はURL復元の対象外。リロードした際にいきなり結果画面が出ないように。
        const initialHash = window.location.hash.replace('#', '');
        if (initialHash === 'dashboard') {
            setShowDashboard(true);
            setCurrentNodeId('juden');
        } else {
            const initialNode = initialHash ? scriptData.find(n => n.id === initialHash) : null;
            if (initialNode && !initialNode.isFinal) {
                setCurrentNodeId(initialHash);
                window.history.replaceState({ nodeId: initialHash }, '', `#${initialHash}`);
            } else {
                setCurrentNodeId('juden');
                window.history.replaceState({ nodeId: 'juden' }, '', '#juden');
            }
        }

        window.addEventListener('popstate', onPopState);
        return () => window.removeEventListener('popstate', onPopState);
    }, []);

    const handleNext = React.useCallback((nextNodeId: string) => {
        const nextNode = scriptData.find(n => n.id === nextNodeId);
        if (nextNode?.isFinal) {
            // 直前の currentNodeId (現在表示中のノード) から受電相手 (callerCategory) を特定
            const { callerCategory } = getCallLogMetadata(currentNodeId);
            // 宛先は nextNodeId から特定
            const { destination } = getCallLogMetadata(nextNodeId);
            
            // 自動的に受電統計ログを記録
            saveCallLog(callerCategory, destination, nextNodeId, nextNode.text);
        }

        if (currentNodeId === 'juden') {
            window.history.pushState({ nodeId: nextNodeId }, '', `#${nextNodeId}`);
        } else {
            window.history.replaceState({ nodeId: nextNodeId }, '', `#${nextNodeId}`);
        }
        setCurrentNodeId(nextNodeId);
    }, [currentNodeId]);

    const handleCallComplete = async (nodeId: string, nodeLabel: string) => {
        const { callerCategory, destination } = getCallLogMetadata(nodeId);
        await saveCallLog(callerCategory, destination, nodeId, nodeLabel);
        
        // メモ入力欄をクリア
        setMemoSite('');
        setMemoCompany('');
        setMemoContent('');
        setCallbackPhone('');
        
        closeSidebar();
    };

    const openDashboard = () => {
        reloadCallLogs();
        setShowDashboard(true);
        window.history.pushState({ nodeId: 'dashboard' }, '', '#dashboard');
    };

    const handleBack = React.useCallback(() => {
        window.history.pushState({ nodeId: 'juden' }, '', '#juden');
        setCurrentNodeId('juden');
    }, []);

    const jubenNode = scriptData.find(n => n.id === 'juden') as ScriptNode;
    const isSidebarOpen = currentNodeId !== 'juden';

    const closeSidebar = React.useCallback(() => {
        setCurrentNodeId('juden');
        window.history.replaceState({ nodeId: 'juden' }, '', '#juden');
    }, []);

    // サイドバー開閉に応じて body に class を付け、ユーザーバーなど画面右上の要素を逃がす
    React.useEffect(() => {
        document.body.classList.toggle('sidebar-open', isSidebarOpen);
        return () => {
            document.body.classList.remove('sidebar-open');
        };
    }, [isSidebarOpen]);

    const renderSidebarBody = (node: ScriptNode) => {
        if (node.isFinal) {
            return (
                <div className="card final-screen" style={{ borderTop: `6px solid ${themeColor}` }}>
                    <div className="final-icon" style={{ color: themeColor }}>
                        <TransferIcon size={48} strokeWidth={1.6} />
                    </div>
                    <h1 className="script-text">{node.text}</h1>
                    <button className="back-button" onClick={closeSidebar}>
                        最初に戻る
                    </button>
                </div>
            );
        }
        const isMemoNode =
            node.id.startsWith('bottom-kanri-') ||
            node.id.startsWith('bottom-kyoryoku-') ||
            node.id.startsWith('bottom-kenchiku-') ||
            node.id.startsWith('bottom-tasha-');
        return (
            <div className="card" key={node.id} style={{ borderTop: `6px solid ${themeColor}` }}>
                <h1 className="script-text">{node.text}</h1>

                {node.subText && (
                    <p className="sub-text" style={{ borderLeftColor: themeColor }}>{node.subText}</p>
                )}

                {node.points && node.points.length > 0 && (
                    <div className="points-section">
                        <div className="points-header">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={themeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
                                <path d="M9 11l3 3L22 4" />
                                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                            </svg>
                            確認ポイント（ヒアリング事項）
                        </div>
                        <div className="points-list">
                            {node.points.map((point, index) => (
                                <div key={index} className="point-item">
                                    {renderPoint(point)}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {isMemoNode && (
                    <div className="memo-section">
                        <div className="memo-title">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={themeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                            メモ入力欄
                        </div>
                        <div className="memo-grid">
                            <div className="memo-field">
                                <label className="memo-label">
                                    {(node.id.startsWith('bottom-kenchiku-') || node.id.startsWith('bottom-tasha-')) ? '現場名' : (node.id === 'bottom-kyoryoku-sekou-genchi' ? '号機/現場名' : '号機/物件名')}
                                </label>
                                <input
                                    type="text"
                                    className="memo-input"
                                    placeholder=""
                                    value={memoSite}
                                    onChange={(e) => setMemoSite(e.target.value)}
                                />
                            </div>
                            <div className="memo-field">
                                <label className="memo-label">会社名/氏名</label>
                                <input
                                    type="text"
                                    className="memo-input"
                                    placeholder=""
                                    value={memoCompany}
                                    onChange={(e) => setMemoCompany(e.target.value)}
                                />
                            </div>
                            <div className="memo-field full-width">
                                <label className="memo-label">内容</label>
                                <textarea
                                    className="memo-input memo-textarea"
                                    placeholder="詳細を入力してください..."
                                    value={memoContent}
                                    onChange={(e) => setMemoContent(e.target.value)}
                                />
                            </div>
                            <div className="memo-field full-width">
                                <label className="memo-label">
                                    折り返し先
                                    {matchedCaller && (
                                        <span className="caller-match-badge">
                                            架電者: {matchedCaller}
                                        </span>
                                    )}
                                </label>
                                <input
                                    type="text"
                                    className="memo-input"
                                    placeholder=""
                                    value={callbackPhone}
                                    onChange={(e) => setCallbackPhone(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="memo-actions">
                            <button
                                className="memo-save-button"
                                onClick={() => savePersonalMemo(node.id, node.text)}
                                style={{ backgroundColor: themeColor }}
                            >
                                個人メモとして保存
                            </button>
                            <button
                                className="memo-history-toggle"
                                onClick={() => setShowPersonalHistory(v => !v)}
                            >
                                履歴 {personalMemos.length > 0 && `(${personalMemos.length})`}
                            </button>
                        </div>
                        {showPersonalHistory && (
                            <div className="personal-memo-list">
                                {personalMemos.length === 0 ? (
                                    <div className="personal-memo-empty">まだ保存された個人メモはありません</div>
                                ) : (
                                    personalMemos.map((pm) => (
                                        <div key={pm.id} className="personal-memo-item">
                                            <div className="personal-memo-meta">
                                                <span className="personal-memo-node">{pm.node_label || pm.node_id}</span>
                                                <span className="personal-memo-time">{formatRelativeTime(pm.created_at)}</span>
                                            </div>
                                            <div className="personal-memo-body">
                                                {pm.site_name && <div><strong>現場/物件:</strong> {pm.site_name}</div>}
                                                {pm.company_name && <div><strong>会社/氏名:</strong> {pm.company_name}</div>}
                                                {pm.content && <div className="personal-memo-content">{pm.content}</div>}
                                                {pm.callback_phone && <div><strong>折り返し:</strong> {pm.callback_phone}</div>}
                                            </div>
                                            <button className="personal-memo-delete" onClick={() => removePersonalMemo(pm.id)} aria-label="削除">
                                                <CloseIcon size={14} />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                )}

                <div className="branches">
                    {node.branches?.map((branch) => (
                        <button
                            key={branch.nextNodeId}
                            className="branch-button"
                            style={{ backgroundColor: branch.color || '#40a9ff' }}
                            onClick={() => handleNext(branch.nextNodeId)}
                        >
                            {branch.label}
                            <ArrowRightIcon size={18} />
                        </button>
                    ))}
                </div>
                <div className="call-complete-section" style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px dashed rgba(255,255,255,0.1)' }}>
                    <button
                        className="call-complete-button"
                        onClick={() => handleCallComplete(node.id, node.text)}
                        style={{
                            width: '100%',
                            padding: '12px',
                            borderRadius: '8px',
                            border: 'none',
                            backgroundColor: '#52c41a',
                            color: '#ffffff',
                            fontWeight: 'bold',
                            fontSize: '0.95rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            transition: 'all 0.2s',
                            boxShadow: '0 4px 10px rgba(82, 196, 26, 0.3)'
                        }}
                    >
                        対応完了として記録
                    </button>
                </div>
            </div>
        );
    };

    return (
        <React.Fragment>
            <div className={`app-container ${isSidebarOpen ? 'with-sidebar' : ''}`} style={{ width: '100%', maxWidth: '1550px', transform: 'scale(0.85)', transformOrigin: 'top center' }}>
                <div className="card" key="juden" style={{ borderTop: '6px solid #40a9ff', width: '100%', maxWidth: '1500px' }}>
                    <h1 className="script-text">{jubenNode.text}</h1>
                    {jubenNode.subText && (
                        <p className="sub-text" style={{ borderLeftColor: '#40a9ff' }}>{jubenNode.subText}</p>
                    )}
                    <div style={{ marginTop: '20px' }}>
                        <VisualFlow onSelect={handleNext} />
                        <p className="flow-hint">
                            ※ フロー上の各ボックスをクリックすると、直接そのプロセスを開始できます。
                        </p>
                    </div>
                    <div className="branches">
                        {jubenNode.branches?.map((branch) => (
                            <button
                                key={branch.nextNodeId}
                                className="branch-button"
                                style={{ backgroundColor: branch.color || '#40a9ff' }}
                                onClick={() => handleNext(branch.nextNodeId)}
                            >
                                {branch.label}
                                <ArrowRightIcon size={18} />
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* 選択ノードを表示する右サイドバー */}
            <aside className={`node-sidebar ${isSidebarOpen ? 'open' : ''}`} aria-hidden={!isSidebarOpen}>
                <div className="node-sidebar-header">
                    <button className="back-button" onClick={handleBack} disabled={!isSidebarOpen}>
                        <ArrowLeftIcon size={16} />
                        <span>戻る</span>
                    </button>
                </div>
                <div className="node-sidebar-body" key={currentNodeId}>
                    {isSidebarOpen && renderSidebarBody(currentNode)}
                </div>
            </aside>

            {/* 架電メモおよび個人メモの一体型下部バー */}
            <div className="outgoing-memo-bar">
                {/* 左側のスペース（架電メモを中央にするためのダミー） */}
                <div style={{ flex: 1 }}></div>

                {/* 中央：架電メモセクション */}
                <div className="outgoing-memo-left-section" style={{ flex: '0 1 auto', display: 'flex', justifyContent: 'center' }}>
                    <div className="outgoing-memo-left-row">
                        <span className="outgoing-memo-title">
                            <span className="outgoing-memo-icon">
                                <PhoneIcon size={16} />
                            </span>
                            <span className="outgoing-memo-title-text" style={{ fontSize: '0.85rem' }}>架電メモ</span>
                        </span>
                        <span className="outgoing-memo-caller-fixed" style={{ height: '26px', padding: '0 8px', fontSize: '0.7rem', display: 'flex', alignItems: 'center' }} title="ログインユーザーで自動設定">
                            架電者: <strong>{ownerDisplayName || '(未取得)'}</strong>
                        </span>
                        <input 
                            type="text" 
                            className="memo-input" 
                            style={{ height: '32px', width: '120px', fontSize: '0.8rem', padding: '0 10px' }}
                            placeholder="電話番号" 
                            value={tempPhone}
                            onChange={(e) => setTempPhone(e.target.value)}
                        />
                        <input
                            type="text"
                            className="memo-input"
                            style={{ height: '32px', width: '90px', fontSize: '0.8rem', padding: '0 10px' }}
                            placeholder="架電先氏名"
                            value={tempName}
                            onChange={(e) => setTempName(e.target.value)}
                        />
                        <input
                            type="text"
                            className="memo-input"
                            style={{ height: '32px', width: '120px', fontSize: '0.8rem', padding: '0 10px' }}
                            placeholder="号機/物件名"
                            value={tempSite}
                            onChange={(e) => setTempSite(e.target.value)}
                        />
                        <button 
                            className="outgoing-memo-save-button"
                            style={{ height: '32px', padding: '0 12px', fontSize: '0.8rem' }}
                            onClick={saveOutgoingMemo}
                            disabled={!tempPhone}
                        >
                            不通
                        </button>
                        <button
                            className="outgoing-memo-history-button"
                            style={{ height: '32px', padding: '0 10px', fontSize: '0.8rem' }}
                            onClick={() => {
                                const next = !showHistory;
                                setShowHistory(next);
                                if (next) {
                                    reloadCallMemos();
                                    setShowPersonalHistoryPanel(false);
                                }
                            }}
                        >
                            履歴 {outgoingMemos.length > 0 && `(${outgoingMemos.length})`}
                        </button>
                    </div>
                </div>

                {/* 右側：個人メモ＆統計集計セクション（ボタンのみのコンパクト表示。右寄せ） */}
                <div className="outgoing-memo-right-compact-section" style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <button
                        className="dashboard-trigger-button"
                        onClick={openDashboard}
                        style={{
                            height: '32px',
                            padding: '0 14px',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            backgroundColor: 'rgba(255, 255, 255, 0.08)',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            borderRadius: '10px',
                            color: '#ffffff',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            transition: 'all 0.2s',
                        }}
                    >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="20" x2="18" y2="10" />
                            <line x1="12" y1="20" x2="12" y2="4" />
                            <line x1="6" y1="20" x2="6" y2="14" />
                        </svg>
                        集計ダッシュボード
                    </button>
                    <button
                        className="personal-memo-history-button"
                        style={{ height: '32px', padding: '0 14px', fontSize: '0.8rem', fontWeight: 600 }}
                        onClick={() => {
                            const next = !showPersonalHistoryPanel;
                            setShowPersonalHistoryPanel(next);
                            if (next) {
                                reloadPersonalMemos();
                                setShowHistory(false);
                            }
                        }}
                    >
                        個人メモ履歴 {personalMemos.length > 0 && `(${personalMemos.length})`}
                    </button>
                </div>

                {/* 不通履歴詳細モーダル表示（履歴クリック時に開くパネル。架電メモの上に中央寄せ表示） */}
                {showHistory && (
                    <div className="outgoing-memo-history-panel" style={{ bottom: '80px', left: '50%', transform: 'translateX(-50%)', right: 'auto', width: '420px' }}>
                        <div className="history-header">
                            <span>不通履歴一覧</span>
                            <button className="close-button" aria-label="閉じる" onClick={() => setShowHistory(false)}>
                                <CloseIcon size={18} />
                            </button>
                        </div>
                        <div className="history-list">
                            {outgoingMemos.length === 0 ? (
                                <div className="history-empty">履歴はありません</div>
                            ) : (
                                outgoingMemos.map((m) => {
                                    const isMine = !!ownerEmail && m.created_by_email?.toLowerCase() === ownerEmail.toLowerCase();
                                    const isDone = !!m.completed_at;
                                    return (
                                        <div key={m.id} className={`history-item ${isDone ? 'is-done' : ''}`}>
                                            <div className="history-info">
                                                <div className="history-phone">
                                                    {m.phone}
                                                    {isDone && <span className="history-done-badge">完了</span>}
                                                </div>
                                                <div className="history-name">
                                                    {m.name || '(名前なし)'}
                                                    {m.caller && <span className="history-caller"> / 架電者: {m.caller}</span>}
                                                </div>
                                                {m.site_name && (
                                                    <div className="history-site">現場/物件: {m.site_name}</div>
                                                )}
                                                <div className="history-meta">
                                                    {m.created_by_name && <span>投稿: {m.created_by_name}</span>}
                                                    <span className="history-meta-time">{formatRelativeTime(m.created_at)}</span>
                                                </div>
                                            </div>
                                            <div className="history-actions">
                                                {isMine && (
                                                    <button
                                                        className={`complete-button ${isDone ? 'undo' : ''}`}
                                                        onClick={() => toggleCompleteMemo(m)}
                                                    >
                                                        {isDone ? '取消' : '完了'}
                                                    </button>
                                                )}
                                                {isMine && (
                                                    <button className="delete-button" onClick={() => deleteMemo(m.id)}>削除</button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                )}

                {/* 個人メモ履歴一覧パネル（下部バーの上にふわっと表示） */}
                {showPersonalHistoryPanel && (
                    <div className="outgoing-memo-history-panel" style={{ bottom: '80px', right: '32px', left: 'auto', width: '420px' }}>
                        <div className="history-header">
                            <span>
                                {currentNodeId === 'juden' 
                                    ? '個人メモ履歴一覧 (全件)' 
                                    : `個人メモ履歴一覧: ${currentNode.text}`}
                            </span>
                            <button 
                                className="close-button" 
                                aria-label="閉じる" 
                                onClick={() => setShowPersonalHistoryPanel(false)}
                            >
                                <CloseIcon size={18} />
                            </button>
                        </div>
                        <div className="history-list" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                            {displayedPersonalMemos.length === 0 ? (
                                <div className="history-empty" style={{ padding: '20px', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                    {currentNodeId === 'juden' 
                                        ? '保存済みの個人メモはありません' 
                                        : 'このボックスに保存されたメモはありません'}
                                </div>
                            ) : (
                                displayedPersonalMemos.map((pm) => (
                                    <div 
                                        key={pm.id} 
                                        className="memo-list-item" 
                                        onClick={() => setActiveDetailMemo(pm)}
                                    >
                                        <div className="memo-item-left">
                                            <span className="memo-item-node-badge" title={pm.node_label || pm.node_id}>
                                                {pm.node_label || pm.node_id}
                                            </span>
                                            <span className="memo-item-title" title={pm.site_name || pm.company_name || pm.content || '(メモ内容なし)'}>
                                                {pm.site_name || pm.company_name || pm.content || '(メモ内容なし)'}
                                            </span>
                                        </div>
                                        <span className="memo-item-time">
                                            {formatRelativeTime(pm.created_at)}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* 個人メモ詳細ポップアップモーダル */}
            {activeDetailMemo && (
                <div className="memo-detail-modal-overlay" onClick={() => setActiveDetailMemo(null)}>
                    <div className="memo-detail-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="memo-detail-header">
                            <div>
                                <h2 className="memo-detail-title">個人メモ詳細</h2>
                                <div className="memo-detail-node-label">
                                    対象ボックス: {activeDetailMemo.node_label || activeDetailMemo.node_id}
                                </div>
                            </div>
                            <span className="memo-detail-time">
                                保存日時: {new Date(activeDetailMemo.created_at).toLocaleString()}
                            </span>
                        </div>
                        <div className="memo-detail-body">
                            {(activeDetailMemo.site_name || activeDetailMemo.node_id.startsWith('bottom-kenchiku-') || activeDetailMemo.node_id.startsWith('bottom-tasha-')) && (
                                <div className="memo-detail-field">
                                    <span className="memo-detail-label">
                                        {(activeDetailMemo.node_id.startsWith('bottom-kenchiku-') || activeDetailMemo.node_id.startsWith('bottom-tasha-')) ? '現場名' : (activeDetailMemo.node_id === 'bottom-kyoryoku-sekou-genchi' ? '号機/現場名' : '号機/物件名')}
                                    </span>
                                    <div className="memo-detail-value">{activeDetailMemo.site_name || '(未入力)'}</div>
                                </div>
                            )}
                            <div className="memo-detail-field">
                                <span className="memo-detail-label">会社名/氏名</span>
                                <div className="memo-detail-value">{activeDetailMemo.company_name || '(未入力)'}</div>
                            </div>
                            <div className="memo-detail-field">
                                <span className="memo-detail-label">内容</span>
                                <div className="memo-detail-value textarea">{activeDetailMemo.content || '(未入力)'}</div>
                            </div>
                            <div className="memo-detail-field">
                                <span className="memo-detail-label">折り返し先</span>
                                <div className="memo-detail-value">{activeDetailMemo.callback_phone || '(未入力)'}</div>
                            </div>
                        </div>
                        <div className="memo-detail-actions">
                            <button 
                                className="memo-detail-delete-btn"
                                onClick={async () => {
                                    if (confirm('この個人メモを削除しますか？')) {
                                        const ok = await deletePersonalMemo(activeDetailMemo.id);
                                        if (ok) {
                                            setPersonalMemos(prev => prev.filter(m => m.id !== activeDetailMemo.id));
                                            setActiveDetailMemo(null);
                                        } else {
                                            alert('削除に失敗しました');
                                        }
                                    }
                                }}
                            >
                                削除
                            </button>
                            <button 
                                className="memo-detail-close-btn"
                                onClick={() => setActiveDetailMemo(null)}
                            >
                                閉じる
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 受電統計ダッシュボードモーダル */}
            {showDashboard && (
                <div className="dashboard-overlay" onClick={() => {
                    setShowDashboard(false);
                    window.history.pushState({ nodeId: currentNodeId }, '', `#${currentNodeId}`);
                }}>
                    <div className="dashboard-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="dashboard-header">
                            <h2>受電統計ダッシュボード</h2>
                            <div className="dashboard-period-filter">
                                {(['today', 'week', 'month', 'all'] as const).map(p => (
                                    <button
                                        key={p}
                                        className={`period-btn ${dashboardPeriod === p ? 'active' : ''}`}
                                        onClick={() => setDashboardPeriod(p)}
                                    >
                                        {p === 'today' ? '今日' : p === 'week' ? '今週' : p === 'month' ? '今月' : '全期間'}
                                    </button>
                                ))}
                            </div>
                            {isAdmin && (
                                <button
                                    className="dashboard-reset-button"
                                    onClick={handleResetDashboard}
                                    style={{
                                        marginLeft: '12px',
                                        padding: '6px 12px',
                                        borderRadius: '8px',
                                        border: '1px solid rgba(255, 77, 77, 0.4)',
                                        backgroundColor: 'rgba(255, 77, 77, 0.1)',
                                        color: '#ff4d4d',
                                        fontSize: '0.8rem',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}
                                    onMouseOver={(e) => {
                                        e.currentTarget.style.backgroundColor = 'rgba(255, 77, 77, 0.2)';
                                        e.currentTarget.style.borderColor = 'rgba(255, 77, 77, 0.6)';
                                    }}
                                    onMouseOut={(e) => {
                                        e.currentTarget.style.backgroundColor = 'rgba(255, 77, 77, 0.1)';
                                        e.currentTarget.style.borderColor = 'rgba(255, 77, 77, 0.4)';
                                    }}
                                >
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="3 6 5 6 21 6"></polyline>
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                        <line x1="10" y1="11" x2="10" y2="17"></line>
                                        <line x1="14" y1="11" x2="14" y2="17"></line>
                                    </svg>
                                    統計リセット
                                </button>
                            )}
                            <button className="close-button" aria-label="閉じる" onClick={() => {
                                setShowDashboard(false);
                                window.history.pushState({ nodeId: currentNodeId }, '', `#${currentNodeId}`);
                            }}>
                                <CloseIcon size={24} />
                            </button>
                        </div>
                        
                        {(() => {
                            const stats = calculateStats(dashboardLogs, dashboardPeriod);
                            return (
                                <div className="dashboard-body">
                                    <div className="stats-summary-card">
                                        <div className="summary-val">{stats.totalCalls}</div>
                                        <div className="summary-label">総受電件数</div>
                                    </div>
                                    
                                    <div className="dashboard-grid">
                                        {/* 誰から */}
                                        <div className="dashboard-card">
                                            <h3>誰からの電話が多いか (受電相手割合)</h3>
                                            <div className="stats-list">
                                                {stats.byCaller.length === 0 ? (
                                                    <div className="empty-stats">データがありません</div>
                                                ) : (
                                                    stats.byCaller.map(item => (
                                                        <div key={item.label} className="stats-row-item">
                                                            <div className="row-info">
                                                                <span className="row-label">{item.label}</span>
                                                                <span className="row-val">{item.count}件 ({item.percentage}%)</span>
                                                            </div>
                                                            <div className="progress-bar-bg">
                                                                <div className="progress-bar-fill" style={{ width: `${item.percentage}%`, backgroundColor: '#40a9ff' }}></div>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                        
                                        {/* どこ宛 */}
                                        <div className="dashboard-card">
                                            <h3>どこ宛の電話が多いか (引き継ぎ先割合)</h3>
                                            <div className="stats-list">
                                                {stats.byDestination.length === 0 ? (
                                                    <div className="empty-stats">データがありません</div>
                                                ) : (
                                                    stats.byDestination.map(item => (
                                                        <div key={item.label} className="stats-row-item">
                                                            <div className="row-info">
                                                                <span className="row-label">{item.label}</span>
                                                                <span className="row-val">{item.count}件 ({item.percentage}%)</span>
                                                            </div>
                                                            <div className="progress-bar-bg">
                                                                <div className="progress-bar-fill" style={{ width: `${item.percentage}%`, backgroundColor: '#52c41a' }}></div>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                        
                                        {/* 受電したのは誰 */}
                                        <div className="dashboard-card">
                                            <h3>受電したのは誰が多いか (オペレーターランキング)</h3>
                                            <div className="stats-list text-list">
                                                {stats.byOperator.length === 0 ? (
                                                    <div className="empty-stats">データがありません</div>
                                                ) : (
                                                    stats.byOperator.map((item, idx) => (
                                                        <div key={item.label} className="stats-rank-item">
                                                            <span className="rank-num">{idx + 1}</span>
                                                            <span className="rank-label">{item.label}</span>
                                                            <span className="rank-val">{item.count}件</span>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                        
                                        {/* よくある問い合わせ */}
                                        <div className="dashboard-card">
                                            <h3>よくある問い合わせ (用件ランキング)</h3>
                                            <div className="stats-list text-list">
                                                {stats.byNode.length === 0 ? (
                                                    <div className="empty-stats">データがありません</div>
                                                ) : (
                                                    stats.byNode.map((item, idx) => (
                                                        <div key={item.label} className="stats-rank-item">
                                                            <span className="rank-num">{idx + 1}</span>
                                                            <span className="rank-label">{item.label}</span>
                                                            <span className="rank-val">{item.count}件</span>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                </div>
            )}
        </React.Fragment>
    );
};

export default App;
