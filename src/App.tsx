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
import './index.css';

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
                <div className="visual-flow-node active" style={{ minWidth: '300px', fontSize: '1.4rem', padding: '24px' }}>
                    <span className="visual-flow-node-label">受電</span>
                    <div className="visual-flow-connector"></div>
                </div>
            </div>

            {/* 第2層および第3層 */}
            {/* 第2層および第3層 */}
            <div className="visual-flow-layer" style={{ alignItems: 'flex-start', gap: '20px' }}>
                {topLayerBranches.map((branch) => {
                    const midNode = scriptData.find(n => n.id === branch.nextNodeId);
                    return (
                        <React.Fragment key={`col-frag-${branch.nextNodeId}`}>
                            {branch.nextNodeId === 'mid-other' && (
                                <div className="visual-flow-column spacer" style={{ width: '100px', minWidth: '100px' }}>
                                    {/* 居住者前のスペーサー：横線のみを描画するため中身は空 */}
                                    <div className="spacer-inner"></div>
                                </div>
                            )}
                            <div className="visual-flow-column" style={{ 
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '60px', 
                                width: 'max-content', 
                                minWidth: '180px'
                            }}>

                                {/* Layer 2 Node */}
                                <div
                                    className="visual-flow-node"
                                    style={{ width: '100%', padding: '16px 20px', fontSize: '1.1rem', cursor: 'default' }}
                                >
                                    <span className="visual-flow-node-label">{branch.label}</span>
                                    <div className="visual-flow-connector"></div>
                                </div>
                                {/* Layer 3 Nodes */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
                                    {midNode?.branches?.map((b) => (
                                        <div
                                            key={b.nextNodeId}
                                            className="visual-flow-node"
                                            style={{
                                                fontSize: '0.9rem',
                                                padding: b.subBranches ? '12px 8px' : '12px',
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
                                                    fontSize: '0.85rem',
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
                                                <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>
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

    // 架電メモの状態管理
    const [outgoingMemos, setOutgoingMemos] = useState<{ phone: string, name: string, caller?: string }[]>(() => {
        const saved = localStorage.getItem('outgoingMemos');
        return saved ? JSON.parse(saved) : [];
    });

    // 架電メモ入力フォームの状態
    const [tempPhone, setTempPhone] = useState('');
    const [tempName, setTempName] = useState('');
    const [tempCaller, setTempCaller] = useState('');

    // 履歴表示の状態
    const [showHistory, setShowHistory] = useState(false);

    // 受電メモ入力欄の状態（照合用）
    const [callbackPhone, setCallbackPhone] = useState('');

    const saveOutgoingMemo = () => {
        if (!tempPhone) return;
        const newMemos = [{ phone: tempPhone, name: tempName, caller: tempCaller, id: Date.now() }, ...outgoingMemos];
        setOutgoingMemos(newMemos);
        localStorage.setItem('outgoingMemos', JSON.stringify(newMemos));
        setTempPhone('');
        setTempName('');
        setTempCaller('');
        // alertは煩わしいので削除するか、トースト的なものにしたいが、まずはシンプルに
    };

    const deleteMemo = (id: number) => {
        const newMemos = outgoingMemos.filter(m => (m as any).id !== id);
        setOutgoingMemos(newMemos);
        localStorage.setItem('outgoingMemos', JSON.stringify(newMemos));
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
        const parentNode = scriptData.find(n => n.branches?.some(b => b.nextNodeId === currentNodeId));
        return parentNode?.branches?.find(b => b.nextNodeId === currentNodeId)?.color || '#40a9ff';
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
                                <input type="text" className="memo-input" placeholder={(node.id.startsWith('bottom-kenchiku-') || node.id.startsWith('bottom-tasha-')) ? "例：〇〇新築現場" : "例：FTSビル 101号室"} />
                            </div>
                            <div className="memo-field">
                                <label className="memo-label">会社名/氏名</label>
                                <input type="text" className="memo-input" placeholder="例：山田 太郎 様" />
                            </div>
                            <div className="memo-field full-width">
                                <label className="memo-label">内容</label>
                                <textarea className="memo-input memo-textarea" placeholder="詳細を入力してください..."></textarea>
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
            <div className={`app-container ${isSidebarOpen ? 'with-sidebar' : ''}`} style={{ maxWidth: '1550px', transform: 'scale(0.85)', transformOrigin: 'top center' }}>
                <div className="card" key="juden" style={{ borderTop: '6px solid #40a9ff', maxWidth: '1500px' }}>
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
                    <button className="node-sidebar-close" onClick={closeSidebar} aria-label="閉じる">
                        <CloseIcon size={20} />
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
                    架電メモ
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
                    <div className="outgoing-memo-field">
                        <input 
                            type="text" 
                            className="memo-input" 
                            placeholder="架電者" 
                            value={tempCaller}
                            onChange={(e) => setTempCaller(e.target.value)}
                        />
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
                                outgoingMemos.map((m: any) => (
                                    <div key={m.id} className="history-item">
                                        <div className="history-info">
                                            <div className="history-phone">{m.phone}</div>
                                            <div className="history-name">
                                                {m.name || '(名前なし)'}
                                                {m.caller && <span className="history-caller"> / 架電者: {m.caller}</span>}
                                            </div>
                                        </div>
                                        <button className="delete-button" onClick={() => deleteMemo(m.id)}>削除</button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
        </React.Fragment>
    );
};

export default App;
