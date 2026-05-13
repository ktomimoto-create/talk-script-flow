import React from 'react';

/**
 * 本システムで使用する全アイコンをここに集約。
 * - すべて 24x24 viewBox、stroke ベース
 * - 色は `currentColor` を使い、親の `color` で着色できるようにする
 * - サイズは `size` プロパティで上書き可能
 */

type IconProps = {
    size?: number | string;
    strokeWidth?: number;
    className?: string;
    'aria-label'?: string;
};

const baseProps = (size: number | string = 18, strokeWidth = 2): React.SVGProps<SVGSVGElement> => ({
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
});

export const PhoneIcon: React.FC<IconProps> = ({ size, strokeWidth, className }) => (
    <svg {...baseProps(size, strokeWidth)} className={className}>
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.72 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.35 1.85.59 2.81.72A2 2 0 0 1 22 16.92z" />
    </svg>
);

export const ArrowRightIcon: React.FC<IconProps> = ({ size, strokeWidth, className }) => (
    <svg {...baseProps(size, strokeWidth)} className={className}>
        <path d="M5 12h14M13 5l7 7-7 7" />
    </svg>
);

export const ArrowLeftIcon: React.FC<IconProps> = ({ size, strokeWidth, className }) => (
    <svg {...baseProps(size, strokeWidth)} className={className}>
        <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
);

export const CloseIcon: React.FC<IconProps> = ({ size, strokeWidth, className }) => (
    <svg {...baseProps(size, strokeWidth)} className={className}>
        <path d="M18 6 6 18M6 6l12 12" />
    </svg>
);

export const LogoutIcon: React.FC<IconProps> = ({ size, strokeWidth, className }) => (
    <svg {...baseProps(size, strokeWidth)} className={className}>
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <path d="M16 17l5-5-5-5" />
        <path d="M21 12H9" />
    </svg>
);

/** 受電の最終結果画面（他部署転送中など）向けのトランスファー / アンテナ系アイコン */
export const TransferIcon: React.FC<IconProps> = ({ size, strokeWidth, className }) => (
    <svg {...baseProps(size, strokeWidth)} className={className}>
        <path d="M3 7h13l-3-3" />
        <path d="M21 17H8l3 3" />
    </svg>
);

export const HistoryIcon: React.FC<IconProps> = ({ size, strokeWidth, className }) => (
    <svg {...baseProps(size, strokeWidth)} className={className}>
        <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
        <path d="M3 3v5h5" />
        <path d="M12 7v5l3 2" />
    </svg>
);

export const SaveIcon: React.FC<IconProps> = ({ size, strokeWidth, className }) => (
    <svg {...baseProps(size, strokeWidth)} className={className}>
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
        <path d="M17 21v-8H7v8M7 3v5h8" />
    </svg>
);

export const TrashIcon: React.FC<IconProps> = ({ size, strokeWidth, className }) => (
    <svg {...baseProps(size, strokeWidth)} className={className}>
        <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z" />
        <path d="M10 11v6M14 11v6" />
    </svg>
);
