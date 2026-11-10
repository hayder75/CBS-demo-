import type { ReactNode } from 'react';
import { useI18n } from '../i18n/I18nContext';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  extra?: ReactNode;
  tags?: ReactNode;
}

export function PageHeader({ title, subtitle, extra, tags }: PageHeaderProps) {
  const { tText } = useI18n();
  return (
    <div className="page-head">
      <div>
        <h1 className="page-head-title">{tText(title)}</h1>
        {subtitle && <div className="page-head-sub">{tText(subtitle)}</div>}
        {tags && <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>{tags}</div>}
      </div>
      {extra && <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>{extra}</div>}
    </div>
  );
}
