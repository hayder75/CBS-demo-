import { useState } from 'react';
import { Button, message } from 'antd';
import { FileExcelOutlined } from '@ant-design/icons';
import { exportExcel, type ExcelSheet } from '../utils/excel';

export interface ExportExcelButtonProps {
  fileName: string;
  sheets: ExcelSheet[] | (() => ExcelSheet[]);
  label?: string;
  disabled?: boolean;
}

export function ExportExcelButton({ fileName, sheets, label = 'Export Excel', disabled = false }: ExportExcelButtonProps) {
  const [loading, setLoading] = useState(false);
  const current = typeof sheets === 'function' ? sheets() : sheets;
  const hasRows = current.some((sheet) => sheet.rows.length > 0);

  const handleExport = async () => {
    const resolved = typeof sheets === 'function' ? sheets() : sheets;
    if (!resolved.some((sheet) => sheet.rows.length > 0)) {
      message.warning('No rows available to export');
      return;
    }
    setLoading(true);
    try {
      await exportExcel(fileName, resolved);
      message.success('Excel file downloaded');
    } catch {
      message.error('Could not create the Excel file. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button icon={<FileExcelOutlined />} disabled={disabled || !hasRows} loading={loading} onClick={handleExport}>
      {label}
    </Button>
  );
}
