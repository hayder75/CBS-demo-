import { Input } from 'antd';
import type { InputProps } from 'antd';

const MAX_DIGITS = 20;

const formatFayda = (raw: string) =>
  raw
    .replace(/\D/g, '')
    .slice(0, MAX_DIGITS)
    .replace(/(.{4})/g, '$1 ')
    .trim();

export function FaydaIdInput({ value, onChange, ...rest }: InputProps) {
  return (
    <Input
      {...rest}
      value={formatFayda(String(value ?? ''))}
      inputMode="numeric"
      placeholder={rest.placeholder ?? 'Enter Fayda ID number'}
      onChange={(e) => {
        e.target.value = formatFayda(e.target.value);
        onChange?.(e);
      }}
    />
  );
}

export const faydaValueFromEvent = (e: React.ChangeEvent<HTMLInputElement>) =>
  e.target.value.replace(/\D/g, '').slice(0, MAX_DIGITS);