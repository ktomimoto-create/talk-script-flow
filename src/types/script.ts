export interface Branch {
    label: string;
    subLabel?: string;
    nextNodeId: string;
    color?: string;
    middleBox?: { label: string; color?: string };
    subBranches?: { label: string; nextNodeId: string }[];
}

export interface ScriptNode {
    id: string;
    text: string;
    subText?: string;
    points?: string[]; // 確認ポイント
    branches?: Branch[];
    isFinal?: boolean;
}
