import { Card } from 'antd';
import { ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons';
import type { ReactNode } from 'react';

export interface StatCardProps {
  title: string;
  value: string | number;
  suffix?: string;
  icon?: ReactNode;
  color?: string;
  footer?: ReactNode;
  delta?: number;
  caption?: string;
}

export function StatCard({
  title,
  value,
  suffix,
  icon,
  color,
  footer,
  delta,
  caption,
}: StatCardProps) {
  const direction = delta == null ? 'flat' : delta >= 0 ? 'up' : 'down';
  return (
    <Card className="stat-card" style={{ height: '100%' }} styles={{ body: { padding: '18px 20px' } }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div className="kpi-label">{title}</div>
        {icon && <span style={{ fontSize: 16, opacity: 0.75 }}>{icon}</span>}
      </div>
      <div className="kpi-value" style={color ? { color } : undefined}>
        {value}
        {suffix && <span style={{ fontSize: 15, fontWeight: 600, marginLeft: 4 }}>{suffix}</span>}
      </div>
      {(delta != null || footer || caption) && (
        <div className="kpi-foot">
          {delta != null && (
            <span className={`kpi-delta ${direction}`}>
              {direction === 'up' ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
              {Math.abs(delta)}%
            </span>
          )}
          {footer && <span className="kpi-caption">{footer}</span>}
          {caption && <span className="kpi-caption">{caption}</span>}
        </div>
      )}
    </Card>
  );
}
