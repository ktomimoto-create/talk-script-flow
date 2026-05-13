import { ScriptNode } from '../types/script';

export const scriptData: ScriptNode[] = [
    // --- 第1層: 受電 ---
    {
        id: 'juden',
        text: '受電',
        subText: '受電相手を選択してください。',
        branches: [
            { label: '管理会社', nextNodeId: 'mid-kanri-gaisha' },
            { label: '管理員', nextNodeId: 'mid-kanri-in' },
            { label: '協力会社', nextNodeId: 'mid-kyoryoku' },
            { label: '建築', nextNodeId: 'mid-kenchiku' },
            { label: '連動相手', nextNodeId: 'mid-tasha' },
            { label: '居住者', nextNodeId: 'mid-other' }
        ]
    },

    // --- 第2層 (Mid Layer) & 第3層 (引き継ぎ先統合) ---
    // 管理会社
    {
        id: 'mid-kanri-gaisha',
        text: '【管理会社】内容を選択',
        branches: [
            {
                label: 'ディスパッチャー',
                nextNodeId: 'final-dis',
                color: '#ff4d4f',
                subBranches: [
                    { label: '架電の折り返し', nextNodeId: 'bottom-kanri-dis-orikaeshi', color: '#ff4d4f' },
                    { label: '対応結果に関する問い合わせ', nextNodeId: 'bottom-kanri-dis-confirm', color: '#ff4d4f' }
                ]
            },
            {
                label: '保守管理',
                nextNodeId: 'final-hoshu',
                color: '#40a9ff',
                subBranches: [
                    { label: 'メンテナンス日の確認', nextNodeId: 'bottom-kanri-hoshu-date', color: '#40a9ff' },
                    { label: '報告書に関する問い合わせ', nextNodeId: 'bottom-kanri-hoshu-report', color: '#40a9ff' }
                ]
            },
            {
                label: '他部署',
                nextNodeId: 'final-tabusho',
                color: '#9254de',
                subBranches: [
                    { label: '不具合の通報', nextNodeId: 'bottom-kanri-tabusho-bug', color: '#9254de' },
                    { label: '登録方法', nextNodeId: 'bottom-kanri-tabusho-register', color: '#9254de' },
                    { label: '契約内容に関する問い合わせ', nextNodeId: 'bottom-kanri-tabusho-contract', color: '#9254de' }
                ]
            }
        ]
    },
    // 管理会社 -> ディスパッチャー詳細用件
    {
        id: 'mid-kanri-dis',
        text: '【管理会社 → ディスパッチャー】詳細を選択',
        branches: [
            { label: 'ディスパッチャー架電の折り返し', nextNodeId: 'bottom-kanri-dis-orikaeshi', color: '#ff4d4f' },
            { label: '対応内容に関する問い合わせ', nextNodeId: 'bottom-kanri-dis-confirm', color: '#ff4d4f' }
        ]
    },
    // ヒアリング項目：折り返し
    {
        id: 'bottom-kanri-dis-orikaeshi',
        text: '架電の折り返し',
        subText: '以下の内容を確認のうえ、ディスパッチャーへ引き継ぎしてください。',
        points: [
            '誰から連絡があったか（個人名が分かればそちらへ引き継ぎ）',
            '何の案件に関する折り返しか（物件名等）'
        ]
    },
    // ヒアリング項目：対応確認
    {
        id: 'bottom-kanri-dis-confirm',
        text: '対応結果に関する問い合わせ',
        subText: '以下の状況を確認のうえ、ディスパッチャーへ引き継ぎしてください。',
        points: [
            '該当FCの確認',
            '対応結果を確認し回答可能であれば説明'
        ]
    },
    // ヒアリング項目：保守管理（管理会社）
    {
        id: 'bottom-kanri-hoshu-date',
        text: 'メンテナンス日の確認',
        subText: '以下の内容を確認のうえ、保守管理へ引き継ぎしてください。',
        points: [
            '過去の定期点検日の確認。　→FC右上の「ﾒﾝﾃﾅﾝｽ報告書一覧」・「定期ﾒﾝﾃﾅﾝｽ予定一覧」から確認する。',
            '定期点検予定日の確認。　→FC右上のﾒﾝﾃ予定　今月・次月の欄を確認する。指定日有無を確認する。'
        ]
    },
    {
        id: 'bottom-kanri-hoshu-report',
        text: '報告書に関する問い合わせ',
        subText: '以下の内容を確認のうえ、保守管理へ引き継ぎしてください。',
        points: [
            '定期メンテナンス報告書が送られてきていない\n→2026年4月で報告書の原紙送付が廃止されたためFリポート　アカウント作成申請を行うよう推進。\n→データでの送付を要望された場合、メールアドレスを伺い保守管理へ引き継ぐ。',
            '報告書の特記事項や不具合の内容を確認。\n→FC・報告書を参照して内容を伝える。\n見積書の再送付要望であればトータル事業部へ引き継ぐ。',
            'メンテナンス作業の対応時間を確認\n→FC[ｱﾗｰﾑ一覧]　の保守開始・終了ログの時間を伝える。'
        ]
    },
    // ヒアリング項目：他部署（管理会社）
    {
        id: 'bottom-kanri-tabusho-bug',
        text: '不具合の通報',
        subText: '以下の内容を確認のうえ、他部署へ引き継ぎしてください。',
        points: [
            '号機・物件名を確認',
            '該当するコントロールセンターへの連絡先を案内\n→FC左下連絡先一覧のサービス別連絡先一覧を参照'
        ]
    },
    {
        id: 'bottom-kanri-tabusho-register',
        text: '登録方法に関する問い合わせ',
        subText: '以下の内容を確認のうえ、他部署へ引き継ぎしてください。',
        points: [
            '号機・物件名を確認',
            '機種に沿った案内\n→オンラインの場合、フルタイムカスタマーサイトを案内。\n不明点等はコントロールセンターへ確認いただくよう案内。\n→オフラインの場合、ロッカー操作にて登録する旨を案内。\n不明点等はコントロールセンターへ確認いただくよう案内。'
        ]
    },
    {
        id: 'bottom-kanri-tabusho-contract',
        text: '契約内容に関する問い合わせ',
        subText: '以下の内容を確認のうえ、他部署へ引き継ぎしてください。',
        points: [
            '号機・物件名を確認',
            '問い合わせ内容を確認',
            '管理部へ引き継ぐ'
        ]
    },
    // 管理員
    {
        id: 'mid-kanri-in',
        text: '【管理員】内容を選択',
        branches: [
            {
                label: 'ディスパッチャー',
                nextNodeId: 'final-dis',
                color: '#ff4d4f',
                subBranches: [
                    { label: '架電の折り返し', nextNodeId: 'bottom-kanri-in-dis-orikaeshi', color: '#ff4d4f' },
                    { label: '障害対応結果に関する問い合わせ', nextNodeId: 'bottom-kanri-in-dis-shogai', color: '#ff4d4f' }
                ]
            },
            {
                label: '保守管理',
                nextNodeId: 'final-hoshu',
                color: '#40a9ff',
                subBranches: [
                    { label: 'メンテナンス日の確認', nextNodeId: 'bottom-kanri-in-hoshu-date', color: '#40a9ff' },
                    { label: '定期点検対応結果に関する問い合わせ', nextNodeId: 'bottom-kanri-in-hoshu-teiki', color: '#40a9ff' }
                ]
            },
            {
                label: '他部署',
                nextNodeId: 'final-tabusho',
                color: '#9254de',
                subBranches: [
                    { label: '不具合の通報', nextNodeId: 'bottom-kanri-in-tabusho-bug', color: '#9254de' },
                    { label: '登録方法', nextNodeId: 'bottom-kanri-in-tabusho-register', color: '#9254de' }
                ]
            }
        ]
    },
    // ヒアリング項目：管理員
    {
        id: 'bottom-kanri-in-dis-orikaeshi',
        text: '架電の折り返し',
        subText: '以下の内容を確認のうえ、ディスパッチャーへ引き継ぎしてください。',
        points: [
            '誰から連絡があったか（個人名が分かればそちらへ引き継ぎ）',
            '何の案件に関する折り返しか（物件名等）'
        ]
    },
    {
        id: 'bottom-kanri-in-dis-shogai',
        text: '障害対応結果に関する問い合わせ',
        subText: '以下の状況を確認のうえ、ディスパッチャーへ引き継ぎしてください。',
        points: [
            '該当FCの確認',
            '対応結果を確認し回答可能であれば説明'
        ]
    },
    {
        id: 'bottom-kanri-in-hoshu-date',
        text: 'メンテナンス日の確認',
        subText: '以下の内容を確認のうえ、保守管理へ引き継ぎしてください。',
        points: [
            '過去の定期点検日の確認。　→FC右上の「ﾒﾝﾃﾅﾝｽ報告書一覧」・「定期ﾒﾝﾃﾅﾝｽ予定一覧」から確認する。',
            '定期点検予定日の確認。　→FC右上のﾒﾝﾃ予定　今月・次月の欄を確認する。指定日有無を確認する。'
        ]
    },
    {
        id: 'bottom-kanri-in-hoshu-teiki',
        text: '定期点検対応結果に関する問い合わせ',
        subText: '以下の内容を確認のうえ、保守管理へ引き継ぎしてください。',
        points: [
            '問い合わせの具体的な内容\n→該当FCが起票されているか確認',
            '記載内容について\n→FC・報告書を参照して内容を伝える。\nFC右上のﾒﾝﾃﾅﾝｽ報告書一覧からPDFファイルの閲覧ができる'
        ]
    },
    // ヒアリング項目：他部署（管理員）
    {
        id: 'bottom-kanri-in-tabusho-bug',
        text: '不具合の通報',
        subText: '以下の内容を確認のうえ、他部署へ引き継ぎしてください。',
        points: [
            '号機・物件名を確認',
            '該当するコントロールセンターへの連絡先を案内\n→FC左下連絡先一覧のサービス別連絡先一覧を参照'
        ]
    },
    {
        id: 'bottom-kanri-in-tabusho-register',
        text: '登録方法に関する問い合わせ',
        subText: '以下の内容を確認のうえ、他部署へ引き継ぎしてください。',
        points: [
            '号機・物件名を確認',
            '機種に沿った案内\n→オンラインの場合、フルタイムカスタマーサイトを案内。\n不明点等はコントロールセンターへ確認いただくよう案内。\n→オフラインの場合、ロッカー操作にて登録する旨を案内。\n不明点等はコントロールセンターへ確認いただくよう案内。'
        ]
    },
    // 協力会社
    {
        id: 'mid-kyoryoku',
        text: '【協力会社】内容を選択',
        branches: [
            {
                label: 'AFC、BLP等',
                nextNodeId: 'mid-kyoryoku-afc',
                color: '#ff4d4f',
                middleBox: { label: 'ディスパッチャー', color: '#ff4d4f' },
                subBranches: [
                    { label: '現地作業に関する問い合わせ', nextNodeId: 'bottom-kyoryoku-dis-genchi', color: '#ff4d4f' }
                ]
            },
            {
                label: 'FRESH ROOM、設置業者等',
                nextNodeId: 'mid-kyoryoku-fresh',
                color: '#73d13d',
                middleBox: { label: '施工管理', color: '#73d13d' },
                subBranches: [
                    { label: '現地作業に関する問い合わせ', nextNodeId: 'bottom-kyoryoku-sekou-genchi', color: '#73d13d' }
                ]
            }
        ]
    },
    // 中間レイヤー：協力会社
    {
        id: 'mid-kyoryoku-afc',
        text: '【協力会社】AFC、BLP等：内容を選択',
        branches: [
            { label: '現地作業に関する問い合わせ', nextNodeId: 'bottom-kyoryoku-dis-genchi', color: '#ff4d4f' }
        ]
    },
    {
        id: 'mid-kyoryoku-fresh',
        text: '【協力会社】FRESH ROOM、設置業者等：内容を選択',
        branches: [
            { label: '現地作業に関する問い合わせ', nextNodeId: 'bottom-kyoryoku-sekou-genchi', color: '#73d13d' }
        ]
    },
    // ヒアリング項目：協力会社
    {
        id: 'bottom-kyoryoku-dis-genchi',
        text: '現地作業に関する問い合わせ（AFC、BLP等）',
        subText: '以下の内容を確認のうえ、ディスパッチャーへ引き継ぎしてください。',
        points: [
            '定期点検or障害対応の確認',
            '定期点検\n→作業時の不具合の場合は現地対応するか見積にするかを確認。\nその後FC起票。',
            '障害対応\n→該当FCを確認し対応報告受付を入力。\n作業中の不明点がある場合は内容を確認しディスパッチャーへ引き継ぐ。'
        ]
    },

    {
        id: 'bottom-kyoryoku-sekou-genchi',
        text: '現地作業に関する問い合わせ（FRESH ROOM、設置業者等）',
        subText: '以下の内容を確認のうえ、施工管理へ引き継ぎしてください。',
        points: [
            '定期点検or障害対応の確認',
            '定期点検\n→作業時の不具合の場合は現地対応するか見積にするかを確認。\nその後FC起票。',
            '障害対応\n→該当FCを確認し対応報告受付を入力。\n作業中の不明点がある場合は内容を確認し施工管理へ引き継ぐ。'
        ]
    },
    // 建築
    {
        id: 'mid-kenchiku',
        text: '【建築】内容を選択',
        branches: [
            {
                label: '施工管理',
                nextNodeId: 'final-sekou',
                color: '#73d13d',
                subBranches: [
                    { label: '連動日の確認', nextNodeId: 'bottom-kenchiku-sekou-rendo', color: '#73d13d' },
                    { label: '設置日の確認', nextNodeId: 'bottom-kenchiku-sekou-setchi', color: '#73d13d' },
                    { label: '現場状況の確認', nextNodeId: 'bottom-kenchiku-sekou-genba', color: '#73d13d' }
                ]
            }
        ]
    },
    // ヒアリング項目：建築
    {
        id: 'bottom-kenchiku-sekou-rendo',
        text: '連動日の確認',
        subText: '以下の内容を確認のうえ、施工管理へ引き継ぎしてください。',
        points: ['物件名', 'お問い合わせの具体的な内容']
    },
    {
        id: 'bottom-kenchiku-sekou-setchi',
        text: '設置日の確認',
        subText: '以下の内容を確認のうえ、施工管理へ引き継ぎしてください。',
        points: ['物件名', 'お問い合わせの具体的な内容']
    },
    {
        id: 'bottom-kenchiku-sekou-genba',
        text: '現場状況の確認',
        subText: '以下の内容を確認のうえ、施工管理へ引き継ぎしてください。',
        points: ['物件名', 'お問い合わせの具体的な内容']
    },
    // 連動相手
    {
        id: 'mid-tasha',
        text: '【連動相手】内容を選択',
        branches: [
            {
                label: '施工管理',
                nextNodeId: 'final-sekou',
                color: '#73d13d',
                subBranches: [
                    { label: '連動日の確認', nextNodeId: 'bottom-tasha-sekou-rendo', color: '#73d13d' },
                    { label: '現場作業時の報告', nextNodeId: 'bottom-tasha-sekou-houkoku', color: '#73d13d' }
                ]
            }
        ]
    },
    // ヒアリング項目：連動相手
    {
        id: 'bottom-tasha-sekou-rendo',
        text: '連動日の確認',
        subText: '以下の内容を確認のうえ、施工管理へ引き継ぎしてください。',
        points: ['物件名', 'お問い合わせの具体的な内容']
    },
    {
        id: 'bottom-tasha-sekou-houkoku',
        text: '現場作業時の報告',
        subText: '以下の内容を確認のうえ、施工管理へ引き継ぎしてください。',
        points: ['物件名', '報告の具体的な内容']
    },
    // 居住者（その他）
    {
        id: 'mid-other',
        text: '【居住者】内容を選択',
        branches: [
            {
                label: '他部署',
                nextNodeId: 'final-tabusho',
                color: '#9254de',
                subBranches: [
                    { label: '登録方法の問い合わせ', nextNodeId: 'bottom-other-tabusho-touroku', color: '#9254de' },
                    { label: '利用方法の問い合わせ', nextNodeId: 'bottom-other-tabusho-riyou', color: '#9254de' }
                ]
            }
        ]
    },
    // ヒアリング項目：居住者
    {
        id: 'bottom-other-tabusho-touroku',
        text: '登録方法の問い合わせ',
        subText: '以下の内容を確認のうえ、他部署へ引き継ぎしてください。',
        points: ['物件名・号室', 'お問い合わせの具体的な内容']
    },
    {
        id: 'bottom-other-tabusho-riyou',
        text: '利用方法の問い合わせ',
        subText: '以下の内容を確認のうえ、他部署へ引き継ぎしてください。',
        points: ['物件名・号室', 'お問い合わせの具体的な内容']
    },

    // 最終転送画面
    { id: 'final-dis', text: 'ディスパッチャーへ転送中...', isFinal: true },
    { id: 'final-hoshu', text: '保守管理へ転送中...', isFinal: true },
    { id: 'final-sekou', text: '施工管理へ転送中...', isFinal: true },
    { id: 'final-tabusho', text: '他部署へ転送中...', isFinal: true }
];
