export interface SubBranch {
    label: string;
    nextNodeId: string;
    color?: string;
}

export interface Branch {
    label: string;
    subLabel?: string;
    nextNodeId: string;
    color?: string;
    middleBox?: { label: string; color?: string };
    subBranches?: SubBranch[];
}

export interface ScriptNode {
    id: string;
    text: string;
    subText?: string;
    points?: string[]; // 確認ポイント
    branches?: Branch[];
    isFinal?: boolean;
}
