import { Card, Statistic, Typography } from 'antd';
import type { ReactNode } from 'react';

export function StatCard({
  title,
  value,
  suffix,
  icon,
  color,
  footer,
}: {
  title: string;
  value: string | number;
  suffix?: string;
  icon?: ReactNode;
  color?: string;
  footer?: ReactNode;
}) {
  return (
    <Card className="stat-card" style={{ height: '100%' }}>
      <Statistic
        title={title}
        value={value}
        suffix={suffix}
        prefix={icon}
        valueStyle={{ color, fontWeight: 600 }}
      />
      {footer && (
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          {footer}
        </Typography.Text>
      )}
    </Card>
  );
}