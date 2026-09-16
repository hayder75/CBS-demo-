import type { ReactNode } from 'react';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  extra?: ReactNode;
  tags?: ReactNode;
}

export function PageHeader({ title, subtitle, extra, tags }: PageHeaderProps) {
  return (
    <div className="page-head">
      <div>
        <h1 className="page-head-title">{title}</h1>
        {subtitle && <div className="page-head-sub">{subtitle}</div>}
        {tags && <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>{tags}</div>}
      </div>
      {extra && <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>{extra}</div>}
    </div>
  );
}
