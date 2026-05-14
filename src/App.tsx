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

    // 架電メモ（Supabase で全認証ユーザー間で共有）
    const [outgoingMemos, setOutgoingMemos] = useState<CallMemo[]>([]);
    React.useEffect(() => {
        let cancelled = false;
        fetchCallMemos().then(list => {
            if (!cancelled) setOutgoingMemos(list);
        });
        return () => { cancelled = true; };
    }, []);

    // 架電メモ入力フォームの状態（架電者はログインユーザー固定）
    const [tempPhone, setTempPhone] = useState('');
    const [tempName, setTempName] = useState('');

    // 履歴表示の状態
    const [showHistory, setShowHistory] = useState(false);

    // 受電メモ入力欄の状態（照合用）
    const [callbackPhone, setCallbackPhone] = useState('');

    // サイドバー内メモ入力欄 ─ 個人メモ
    const [memoSite, setMemoSite] = useState('');
    const [memoCompany, setMemoCompany] = useState('');
    const [memoContent, setMemoContent] = useState('');

    // 個人メモ履歴
    const [personalMemos, setPersonalMemos] = useState<PersonalMemo[]>([]);
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

    const removePersonalMemo = async (id: number) => {
        const ok = await deletePersonalMemo(id);
        if (ok) setPersonalMemos(prev => prev.filter(m => m.id !== id));
    };

    const saveOutgoingMemo = async () => {
        if (!tempPhone) return;
        const created = await insertCallMemo({
            phone: tempPhone,
            name: tempName,
            caller: ownerDisplayName, // 架電者は自動でログインユーザー
            created_by_email: ownerEmail || null,
            created_by_name: ownerDisplayName || null,
        });
        if (created) {
            setOutgoingMemos(prev => [created, ...prev]);
            setTempPhone('');
            setTempName('');
        } else {
            alert('架電メモの保存に失敗しました');
        }
    };

    const deleteMemo = async (id: number) => {
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

    // 初期化：popstateリスナーの登録と初期ハッシュの処理
    React.useEffect(() => {
        const onPopState = (e: PopStateEvent) => {
            if (e.state && e.state.nodeId) {
                setCurrentNodeId(e.state.nodeId);
            } else {
                // 初期状態（ハッシュなし）の場合はトップへ
                const hashId = window.location.hash.replace('#', '');
                setCurrentNodeId(hashId || 'juden');
            }
        };

        // 初回読み込み時のハッシュ処理
        // 最終ノード(isFinal)はURL復元の対象外。リロードした際にいきなり結果画面が出ないように。
        const initialHash = window.location.hash.replace('#', '');
        const initialNode = initialHash ? scriptData.find(n => n.id === initialHash) : null;
        if (initialNode && !initialNode.isFinal) {
            setCurrentNodeId(initialHash);
            window.history.replaceState({ nodeId: initialHash }, '', `#${initialHash}`);
        } else {
            setCurrentNodeId('juden');
            window.history.replaceState({ nodeId: 'juden' }, '', '#juden');
        }

        window.addEventListener('popstate', onPopState);
        return () => window.removeEventListener('popstate', onPopState);
    }, []);

    const handleNext = React.useCallback((nextNodeId: string) => {
        window.history.pushState({ nodeId: nextNodeId }, '', `#${nextNodeId}`);
        setCurrentNodeId(nextNodeId);
    }, []);

    const handleBack = React.useCallback(() => {
        window.history.back();
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
                                    {(node.id.startsWith('bottom-kenchiku-') || node.id.startsWith('bottom-tasha-')) ? '現場名' : '号機/物件名'}
                                </label>
                                <input
                                    type="text"
                                    className="memo-input"
                                    placeholder={(node.id.startsWith('bottom-kenchiku-') || node.id.startsWith('bottom-tasha-')) ? "例：〇〇新築現場" : "例：FTSビル 101号室"}
                                    value={memoSite}
                                    onChange={(e) => setMemoSite(e.target.value)}
                                />
                            </div>
                            <div className="memo-field">
                                <label className="memo-label">会社名/氏名</label>
                                <input
                                    type="text"
                                    className="memo-input"
                                    placeholder="例：山田 太郎 様"
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
                                    placeholder="例：03-xxxx-xxxx"
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

            {/* 架電メモ入力フォーム（旧クイックアクションの場所） */}
            <div className="outgoing-memo-bar">
                <div className="outgoing-memo-title">
                    <span className="outgoing-memo-icon">
                        <PhoneIcon size={18} />
                    </span>
                    <span className="outgoing-memo-title-text">架電メモ</span>
                </div>
                <div className="outgoing-memo-inputs">
                    <div className="outgoing-memo-field">
                        <input 
                            type="text" 
                            className="memo-input" 
                            placeholder="電話番号" 
                            value={tempPhone}
                            onChange={(e) => setTempPhone(e.target.value)}
                        />
                    </div>
                    <div className="outgoing-memo-field">
                        <input 
                            type="text" 
                            className="memo-input" 
                            placeholder="名前（架電先）" 
                            value={tempName}
                            onChange={(e) => setTempName(e.target.value)}
                        />
                    </div>
                    <div className="outgoing-memo-caller-fixed" title="ログインユーザーで自動設定">
                        架電者: <strong>{ownerDisplayName || '(未取得)'}</strong>
                    </div>
                    <button 
                        className="outgoing-memo-save-button"
                        onClick={saveOutgoingMemo}
                        disabled={!tempPhone}
                    >
                        不通
                    </button>
                    <button 
                        className="outgoing-memo-history-button"
                        onClick={() => setShowHistory(!showHistory)}
                    >
                        履歴 {outgoingMemos.length > 0 && `(${outgoingMemos.length})`}
                    </button>
                </div>

                {showHistory && (
                    <div className="outgoing-memo-history-panel">
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
            </div>
        </React.Fragment>
    );
};

export default App;
