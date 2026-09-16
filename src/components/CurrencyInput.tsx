import { InputNumber } from 'antd';
import type { InputNumberProps } from 'antd';

const addCommas = (value: number | string | undefined) => {
  if (value === undefined || value === null || value === '') return '';
  const [int, dec] = String(value).split('.');
  const withCommas = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return dec !== undefined ? `${withCommas}.${dec}` : withCommas;
};

export function CurrencyInput(props: InputNumberProps) {
  return (
    <InputNumber
      {...props}
      formatter={(v) => addCommas(v)}
      parser={(v) => (v ? String(v).replace(/,/g, '') : '')}
    />
  );
}