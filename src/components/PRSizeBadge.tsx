import React from 'react';
import { PRSizeCategory } from '../types';

export interface PRSizeBadgeProps {
  additions?: number;
  deletions?: number;
  sizeCategory?: PRSizeCategory;
}

const SIZE_STYLES: Record<PRSizeCategory, string> = {
  XS: 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80',
  S: 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80',
  M: 'bg-sky-950/80 text-sky-300 border-sky-800/80',
  L: 'bg-amber-950/80 text-amber-300 border-amber-800/80',
  XL: 'bg-rose-950/80 text-rose-300 border-rose-800/80',
};

export const PRSizeBadge: React.FC<PRSizeBadgeProps> = ({
  additions = 0,
  deletions = 0,
  sizeCategory,
}) => {
  if (!sizeCategory) return null;

  const colorClass = SIZE_STYLES[sizeCategory] || SIZE_STYLES.XS;
  const tooltip = `Size: ${sizeCategory} (+${additions} / -${deletions} lines across files)`;

  return (
    <span
      title={tooltip}
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium border ${colorClass}`}
    >
      <span className="font-bold">{sizeCategory}</span>
      <span className="font-mono text-[10px] opacity-80">
        +{additions} / -{deletions}
      </span>
    </span>
  );
};
